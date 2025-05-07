import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { stripe } from '../../../lib/stripe'
import { supabase } from '../../../lib/supabaseClient'
import { Resend } from 'resend'
import { EmailTemplate } from '@/components/EmailTemplate'

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
        },
        amount_total,
        shipping
      } = session

      try {
        // Get the order details from the database
        const { data: order, error: orderError } = await supabase
          .from('orders')
          .select('*')
          .eq('id', orderId)
          .single()

        if (orderError) throw orderError

        // Update the order status to completed
        const { error: updateError } = await supabase
          .from('orders')
          .update({ status: 'completed' })
          .eq('id', orderId)

        if (updateError) throw updateError

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

        if (paymentError) throw paymentError

        // Get order items for email
        const { data: orderItems, error: itemsError } = await supabase
          .from('order_items')
          .select('*')
          .eq('order_id', orderId)

        if (itemsError) throw itemsError

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
            items: orderItems.map(item => ({
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
            items: orderItems.map(item => ({
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

          console.log('Emails sent successfully');
        } catch (emailError) {
          console.error('Error sending email:', emailError);
        }

        return NextResponse.json({ received: true })
      } catch (error) {
        console.error('Error processing webhook:', error)
        return NextResponse.json(
          { error: 'Error processing webhook' },
          { status: 500 }
        )
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
