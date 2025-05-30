import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { stripe } from "../../../lib/stripe"
import { supabase } from "../../../lib/supabaseClient"
import { validateOrderStock } from '@/lib/stockUtils'

export async function POST(req) {
  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      console.error('Stripe secret key is not configured')
      return NextResponse.json(
        { error: 'Payment system is not properly configured' },
        { status: 500 }
      )
    }

    const headersList = headers()
    const origin = headersList.get('origin')
    const authHeader = headersList.get('authorization')
    const token = authHeader && authHeader.split(' ')[1]
    
    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Verify the token and get the user
    const { data: { user }, error: userError } = await supabase.auth.getUser(token)
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      )
    }

    const body = await req.json()
    const { cart, shippingInfo, total, shippingMethod, orderId } = body

    if (!cart || !shippingInfo || !total || !orderId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Validate stock before proceeding
    const orderItems = cart.map(item => ({
      product_id: item.id,
      quantity: item.quantity
    }))

    const { error: stockValidationError, insufficientStock, items: insufficientItems } = await validateOrderStock(orderItems)
    
    if (stockValidationError) {
      return NextResponse.json(
        { error: 'Error validating stock' },
        { status: 500 }
      )
    }

    if (insufficientStock) {
      const itemMessages = insufficientItems.map(item => {
        const cartItem = cart.find(i => i.id === item.product_id)
        return `${cartItem.name}: Only ${item.available} units available`
      }).join(', ')
      return NextResponse.json(
        { error: `Some items are out of stock: ${itemMessages}` },
        { status: 400 }
      )
    }

    // Get the existing order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single()

    if (orderError) {
      console.error('Error fetching order:', orderError)
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }

    // Create payment record
    const { error: paymentError } = await supabase
      .from('payments')
      .insert([{
        order_id: order.id,
        user_id: user.id,
        amount: total,
        method: 'stripe',
        status: 'pending',
        created_at: new Date().toISOString()
      }])

    if (paymentError) {
      console.error('Error creating payment record:', paymentError)
      return NextResponse.json(
        { error: 'Failed to create payment record' },
        { status: 500 }
      )
    }

    try {
      // Create Checkout Session with order ID as client_reference_id
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: cart.map(item => ({
          price_data: {
            currency: 'usd',
            product_data: {
              name: item.name,
              images: [item.image],
            },
            unit_amount: Math.round(item.price * 100), // Convert to cents
          },
          quantity: item.quantity,
        })),
        mode: 'payment',
        client_reference_id: order.id,
        customer_email: shippingInfo.email,
        shipping_address_collection: {
          allowed_countries: ['US', 'CA', 'GB', 'AU', 'DE', 'FR', 'JP', 'BR', 'IN', 'MX'],
        },
        success_url: `${origin}/success?session_id={CHECKOUT_SESSION_ID}&order_id=${order.id}`,
        cancel_url: `${origin}/checkout?cancelled=true`,
        metadata: {
          order_id: order.id,
          order_number: order.order_number,
        },
      });

      return NextResponse.json({ url: session.url })
    } catch (stripeError) {
      console.error('Stripe error:', stripeError)
      return NextResponse.json(
        { error: stripeError.message || 'Failed to create checkout session' },
        { status: 500 }
      )
    }
  } catch (err) {
    console.error('Error in checkout session creation:', err)
    return NextResponse.json(
      { error: err.message || 'Internal server error' },
      { status: 500 }
    )
  }
}