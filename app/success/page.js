import { redirect } from 'next/navigation'
import Link from 'next/link'
import { stripe } from "../../lib/stripe"
import { supabase } from "../../lib/supabaseClient"
import CartClearer from './CartClearer'

export default async function Success({ searchParams }) {
  const { session_id, order_id } = searchParams

  if (!session_id || !order_id) {
    return redirect('/')
  }

  try {
    // Get session details from Stripe
    const session = await stripe.checkout.sessions.retrieve(session_id, {
      expand: ['line_items', 'payment_intent']
    })

    if (session.payment_status !== 'paid') {
      return redirect('/')
    }

    // Get order details from database
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*, order_items(*), shipping_addresses(*)')
      .eq('id', order_id)
      .single()

    if (orderError) throw orderError

    // Update order status to completed
    const { error: updateError } = await supabase
      .from('orders')
      .update({ status: 'completed' })
      .eq('id', order_id)

    if (updateError) throw updateError

    // Update payment status
    const { error: paymentError } = await supabase
      .from('payments')
      .update({ 
        status: 'completed',
        transaction_id: session.payment_intent.id,
        updated_at: new Date().toISOString()
      })
      .eq('order_id', order_id)

    if (paymentError) throw paymentError

    // Send confirmation emails
    try {
      const customerEmail = session.customer_details.email
      const customerData = {
        type: 'customer',
        firstName: order.shipping_addresses[0].first_name,
        shippingInfo: {
          ...order.shipping_addresses[0],
          email: customerEmail
        },
        orderDetails: {
          orderId: `#${order.order_number}`,
          amount: order.amount,
          shippingMethod: order.shipping_method,
          items: order.order_items.map(item => ({
            name: item.name,
            quantity: item.quantity,
            price: item.price
          }))
        }
      }

      const adminData = {
        type: 'admin',
        firstName: 'Admin',
        shippingInfo: {
          ...order.shipping_addresses[0],
          email: customerEmail
        },
        orderDetails: {
          orderId: `#${order.order_number}`,
          amount: order.amount,
          shippingMethod: order.shipping_method,
          items: order.order_items.map(item => ({
            name: item.name,
            quantity: item.quantity,
            price: item.price
          }))
        }
      }

      // Send emails using the API route
      const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/send-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customerEmail,
          adminEmail: 'gojosearias@gmail.com',
          customerData,
          adminData
        }),
      })

      const responseData = await response.json()
      console.log('Email API response:', responseData)

      if (!response.ok) {
        console.error('Failed to send emails:', responseData)
      }
    } catch (emailError) {
      console.error('Error sending emails:', emailError)
    }

    return (
      <>
        <CartClearer />
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-3xl mx-auto text-center">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-6">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-8 w-8 text-green-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h1 className="text-3xl font-bold mb-4">Order Confirmed!</h1>
            <p className="text-lg mb-6">
              Thank you for your purchase. We've sent a confirmation email to{' '}
              <span className="font-semibold">{session.customer_details?.email}</span>.
            </p>
            
            <div className="bg-gray-50 p-6 rounded-lg mb-8 text-left">
              <h2 className="text-xl font-semibold mb-4">Order Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <h3 className="font-semibold text-gray-700">Order Number</h3>
                  <p>#{order.order_number}</p>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-700">Date</h3>
                  <p>{new Date(order.created_at).toLocaleDateString()}</p>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-700">Total</h3>
                  <p>${order.amount.toFixed(2)}</p>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-700">Payment Method</h3>
                  <p>Credit Card (Ending in {session.payment_intent?.payment_method?.card?.last4 || '****'})</p>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-4">
                <h3 className="font-semibold text-gray-700 mb-2">Shipping Address</h3>
                <p className="text-gray-600">
                  {order.shipping_addresses[0]?.first_name} {order.shipping_addresses[0]?.last_name}<br />
                  {order.shipping_addresses[0]?.address}<br />
                  {order.shipping_addresses[0]?.apartment && (
                    <>{order.shipping_addresses[0].apartment}<br /></>
                  )}
                  {order.shipping_addresses[0]?.city}, {order.shipping_addresses[0]?.state} {order.shipping_addresses[0]?.zip_code}<br />
                  {order.shipping_addresses[0]?.country}
                </p>
              </div>
            </div>

            <Link
              href="/"
              className="inline-block bg-black text-white px-6 py-3 rounded-md hover:bg-gray-800 transition-colors"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      </>
    )
  } catch (error) {
    console.error('Error processing order confirmation:', error)
    return redirect('/')
  }
}