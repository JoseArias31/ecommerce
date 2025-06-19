import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { stripe } from '../../../lib/stripe'
import { supabase } from '../../../lib/supabaseClient'
import { Resend } from 'resend'
import { EmailTemplate } from '@/components/EmailTemplate'
import { subtractProductStock } from '@/lib/stockUtils'

const resend = new Resend('re_KVGcomQe_38LTukHwU52AvNAMVzpdYt5a2')

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

export async function POST(req) {
  try {
    const signature = headers().get('stripe-signature')
    const body = await req.text()

    let event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    } catch (err) {
      console.error(`Webhook signature verification failed:`, err.message)
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    }

    // Handle the checkout.session.completed event
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object
      const {
        id: sessionId,
        client_reference_id: orderId,
        customer_details: {
          email,
          name,
          address
        } = {},
        amount_total,
        shipping
      } = session

      console.log('Processing successful payment for order:', orderId)

      if (!orderId) {
        console.error('No order ID found in session')
        return NextResponse.json({ error: 'No order ID found' }, { status: 400 })
      }

      try {
        // Get the order details from the database
        const { data: order, error: orderError } = await supabase
          .from('orders')
          .select('*')
          .eq('id', orderId)
          .single()

        if (orderError) {
          console.error('Error fetching order:', orderError)
          throw orderError
        }

        // Get order items
        const { data: orderItems, error: itemsError } = await supabase
          .from('order_items')
          .select('*')
          .eq('order_id', orderId)

        if (itemsError) {
          console.error('Error fetching order items:', itemsError)
          throw itemsError
        }

        // Check if payment already exists to prevent duplicate processing
        const { data: existingPayment } = await supabase
          .from('payments')
          .select('id')
          .eq('transaction_id', sessionId)
          .single()

        if (existingPayment) {
          console.log('Payment already processed for session:', sessionId)
          return NextResponse.json({ received: true })
        }

        // Subtract stock for each item
        let stockErrors = []
        for (const item of orderItems) {
          const { error: stockError, insufficientStock } = await subtractProductStock(item.product_id, item.quantity)
          
          if (stockError) {
            console.error(`Error subtracting stock for product ${item.product_id}:`, stockError)
            stockErrors.push(`Product ${item.product_id}: ${stockError.message}`)
          } else if (insufficientStock) {
            console.warn(`Insufficient stock for product ${item.product_id} - this shouldn't happen after validation`)
            stockErrors.push(`Product ${item.product_id}: Insufficient stock`)
          } else {
            console.log(`Successfully subtracted ${item.quantity} units from product ${item.product_id}`)
          }
        }

        // Log stock errors but continue processing since payment is confirmed
        if (stockErrors.length > 0) {
          console.error('Stock update errors (payment still processed):', stockErrors)
        }

        // Update the order status to completed
        const { error: updateError } = await supabase
          .from('orders')
          .update({ 
            status: 'completed',
            updated_at: new Date().toISOString()
          })
          .eq('id', orderId)

        if (updateError) {
          console.error('Error updating order status:', updateError)
          throw updateError
        }

        // Create payment record
        const { error: paymentError } = await supabase
          .from('payments')
          .insert([{
            order_id: orderId,
            user_id: order.user_id,
            amount: amount_total / 100, // Convert from cents to dollars
            method: 'stripe',
            status: 'completed',
            transaction_id: sessionId,
            created_at: new Date().toISOString()
          }])

        if (paymentError) {
          console.error('Error creating payment record:', paymentError)
          throw paymentError
        }

        // Get order items for email (with product details)
        const { data: emailOrderItems, error: emailItemsError } = await supabase
          .from('order_items')
          .select('*')
          .eq('order_id', orderId)

        if (emailItemsError) {
          console.error('Error fetching order items for email:', emailItemsError)
          throw emailItemsError
        }

        // Format data for email
        const customerData = {
          type: 'customer',
          firstName: name?.split(' ')[0] || 'Customer',
          shippingInfo: {
            ...order.shipping_info,
            email: email
          },
          orderDetails: {
            orderId: `#${orderId.slice(0, 8)}`,
            amount: amount_total / 100,
            shippingMethod: order.shipping_method,
            items: emailOrderItems.map(item => ({
              name: item.name,
              quantity: item.quantity,
              price: item.price,
              image: item.image
            }))
          }
        }

        const adminData = {
          type: 'admin',
          firstName: 'Admin',
          shippingInfo: {
            ...order.shipping_info,
            email: email
          },
          orderDetails: {
            orderId: `#${orderId.slice(0, 8)}`,
            amount: amount_total / 100,
            shippingMethod: order.shipping_method,
            items: emailOrderItems.map(item => ({
              name: item.name,
              quantity: item.quantity,
              price: item.price,
              image: item.image
            }))
          }
        }

        // Send email notification
        try {
          console.log('Preparing to send email with data:', {
            customerEmail: email,
            adminEmail: 'gojosearias@gmail.com',
            orderId: orderId
          });

          // Send customer email
          const customerResponse = await resend.emails.send({
            from: 'The Quick Shop <onboarding@resend.dev>',
            to: email,
            subject: `Your Order Confirmation #${customerData.orderDetails.orderId.replace('#', '')}`,
            react: EmailTemplate(customerData),
            replyTo: 'gojosearias@gmail.com'
          });
          console.log('Customer email response:', customerResponse);

          // Send admin email
          const adminResponse = await resend.emails.send({
            from: 'The Quick Shop <onboarding@resend.dev>',
            to: 'gojosearias@gmail.com',
            subject: `New Order Received #${adminData.orderDetails.orderId.replace('#', '')}`,
            react: EmailTemplate(adminData)
          });
          console.log('Admin email response:', adminResponse);

          console.log('Emails sent successfully for order:', orderId);
        } catch (emailError) {
          console.error('Error sending email:', emailError);
          // Don't throw here - email failure shouldn't fail the entire webhook
        }

        console.log('Successfully processed payment and updated stock for order:', orderId)
        return NextResponse.json({ received: true })

      } catch (error) {
        console.error('Error processing webhook:', error)
        return NextResponse.json(
          { error: 'Error processing webhook' },
          { status: 500 }
        )
      }
    }

    // Handle payment failures
    if (event.type === 'checkout.session.expired' || event.type === 'payment_intent.payment_failed') {
      const session = event.data.object
      const orderId = session.client_reference_id || session.metadata?.order_id

      if (orderId) {
        console.log('Processing failed/expired payment for order:', orderId)

        // Update order status to cancelled
        await supabase
          .from('orders')
          .update({ 
            status: 'cancelled',
            updated_at: new Date().toISOString()
          })
          .eq('id', orderId)

        // Update payment status if exists
        await supabase
          .from('payments')
          .update({ 
            status: 'failed',
            updated_at: new Date().toISOString()
          })
          .eq('order_id', orderId)

        console.log('Updated failed payment for order:', orderId)
      }
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export const dynamic = 'force-dynamic'