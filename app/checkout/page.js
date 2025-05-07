"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { ArrowLeft, CreditCard, Check, MapPin, Package, ShoppingBag, Trash2 } from "lucide-react"
import { useQuantityStore } from "../../store/quantityStore";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import { EmailTemplate } from "@/components/EmailTemplate";
import resend from "@/lib/resend";

// Country list for international shipping
const countries = [
  { code: "US", name: "United States" },
  { code: "CA", name: "Canada" },
  { code: "GB", name: "United Kingdom" },
  { code: "AU", name: "Australia" },
  { code: "DE", name: "Germany" },
  { code: "FR", name: "France" },
  { code: "JP", name: "Japan" },
  { code: "BR", name: "Brazil" },
  { code: "IN", name: "India" },
  { code: "MX", name: "Mexico" },
  // Add more countries as needed
].sort((a, b) => a.name.localeCompare(b.name))

const COD_FEE = 5; // You can change to 10 if needed

export default function CheckoutPage() {
  const [cart, setCart] = useState([])
  const [activeStep, setActiveStep] = useState("shipping")
  const [shippingInfo, setShippingInfo] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    apartment: "",
    city: "",
    state: "",
    zipCode: "",
    country: "US",
  })
  const [shippingMethod, setShippingMethod] = useState("standard")
  const [paymentMethod, setPaymentMethod] = useState("credit")
  const [isProcessing, setIsProcessing] = useState(false)
  const [isComplete, setIsComplete] = useState(false)
  const [activeTab, setActiveTab] = useState("credit")
  const [billingAddress, setBillingAddress] = useState("same")
  const [paymentStatus, setPaymentStatus] = useState("pending"); // For COD orders
  const [order, setOrder] = useState(null);
  const setQuantity = useQuantityStore((state) => state.setQuantity)

  // Load cart from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedCart = JSON.parse(localStorage.getItem("cart")) || []
      setCart(storedCart)
    }
  }, [])

  // Helper to sync cart state and localStorage + badge
  const syncCart = (newCart) => {
    setCart(newCart)
    localStorage.setItem("cart", JSON.stringify(newCart))
    window.dispatchEvent(new Event("cartUpdated"))
  }

  const removeItem = (id) => {
    const newCart = cart.filter((item) => item.id !== id)
    syncCart(newCart)
  }

  const updateQuantity = (id, newQuantity) => {
    if (newQuantity < 1) return
    const newCart = cart.map((item) => (item.id === id ? { ...item, quantity: newQuantity } : item))
    syncCart(newCart)
  }

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const shipping = shippingMethod === "express" ? 20.0 : 10.0
  const taxes = subtotal * 0.08 // Example tax calculation (8%)
  const isCOD = paymentMethod === "cod" || activeTab === "cod";
  const codFee = isCOD ? COD_FEE : 0;
  const total = subtotal + shipping + taxes + codFee

  const handleShippingSubmit = (e) => {
    e.preventDefault()
    setActiveStep("payment")
  }

  const handlePaymentSubmit = async (e) => {
    e.preventDefault()
    setIsProcessing(true)

    try {
      // Get current user
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError) {
        throw new Error(`Authentication error: ${authError.message}`)
      }
      if (!user) {
        throw new Error("User not authenticated")
      }

      // Create order
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert([{
          user_id: user.id,
          amount: total,
          shipping_method: shippingMethod,
          status: isCOD ? "pending" : "completed",
          created_at: new Date().toISOString(),
          shipping_info: shippingInfo
        }])
        .select('id, order_number')
        .single()

      if (orderError) {
        console.error("Order creation error:", orderError)
        throw new Error(`Order creation failed: ${orderError.message}`)
      }
      
      // Store the order data
      setOrder(order)

      // Create order items
      const orderItems = cart.map(item => ({
        order_id: order.id,
        product_id: item.id,
        quantity: item.quantity,
        price: item.price,
        name: item.name,
        image: item.image
      }))

      const { error: orderItemsError } = await supabase
        .from("order_items")
        .insert(orderItems)

      if (orderItemsError) {
        console.error("Order items creation error:", orderItemsError)
        throw new Error(`Order items creation failed: ${orderItemsError.message}`)
      }

      // Create payment record
      const { error: paymentError } = await supabase
        .from("payments")
        .insert([{
          order_id: order.id,
          user_id: user.id,
          amount: total,
          method: paymentMethod,
          status: isCOD ? "pending" : "completed",
          created_at: new Date().toISOString()
        }])

      if (paymentError) {
        console.error("Payment creation error:", paymentError)
        throw new Error(`Payment creation failed: ${paymentError.message}`)
      }

      // Create shipping address
      const { error: shippingError } = await supabase
        .from("shipping_addresses")
        .insert([
          {
            order_id: order.id,
            user_id: user.id,
            address: shippingInfo.address,
            apartment: shippingInfo.apartment,
            city: shippingInfo.city,
            state: shippingInfo.state,
            zip_code: shippingInfo.zipCode,
            country: shippingInfo.country,
            first_name: shippingInfo.firstName,
            last_name: shippingInfo.lastName,
            email: shippingInfo.email,
            created_at: new Date().toISOString(),
          },
        ]);

      if (shippingError) {
        console.error("Shipping address creation error:", shippingError)
        throw new Error(`Shipping address creation failed: ${shippingError.message}`)
      }

      // Send email to customer
      const customerEmail = shippingInfo.email;
      const customerEmailData = {
        type: 'customer',
        firstName: shippingInfo.firstName,
        shippingInfo,
        orderDetails: {
          orderId: `#${order.order_number}`,
          amount: total,
          shippingMethod,
          items: cart.map(item => ({
            name: item.name,
            quantity: item.quantity,
            price: item.price
          }))
        }
      };

      // Send email to admin
      const adminEmail = 'gojosearias@gmail.com';
      const adminEmailData = {
        type: 'admin',
        firstName: 'Admin',
        shippingInfo,
        orderDetails: {
          orderId: `#${order.order_number}`,
          amount: total,
          shippingMethod,
          items: cart.map(item => ({
            name: item.name,
            quantity: item.quantity,
            price: item.price
          }))
        }
      };

      // Send emails using server-side API route
      try {
        console.log('Sending email data:', {
          customerEmail,
          adminEmail,
          customerData: customerEmailData,
          adminData: adminEmailData
        });

        const response = await fetch('/api/send-email', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            customerEmail,
            adminEmail,
            customerData: customerEmailData,
            adminData: adminEmailData
          }),
        });

        const responseData = await response.json();
        console.log('Email API response:', responseData);

        if (!response.ok) {
          console.error("Failed to send emails via API");
          // Don't throw this error - we want to complete the order even if emails fail
          console.warn("Emails failed to send, but order will still be processed");
        }
      } catch (emailError) {
        console.error("Email sending error:", emailError);
        // Don't throw this error - we want to complete the order even if emails fail
        console.warn("Emails failed to send, but order will still be processed");
      }

      // Clear cart after successful order and emails sent
      syncCart([])
      setIsProcessing(false)
      setIsComplete(true)
      setActiveStep("confirmation")

    } catch (error) {
      console.error("Error processing order:", {
        message: error.message,
        name: error.name,
        stack: error.stack
      })
      alert(`Error processing your order: ${error.message}. Please try again.`)
      setIsProcessing(false)
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setShippingInfo((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  // Render different steps based on activeStep
  const renderCheckoutStep = () => {
    if (isComplete) {
      return (
        <div className="text-center py-12">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-6">
            <Check className="h-8 w-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold mb-4">{isCOD ? "Order Pending (COD)" : "Order Confirmed!"}</h2>
          <p className="mb-6 text-gray-600">
            {isCOD
              ? "Your order is pending. Please pay the delivery person in cash or e-transfer. Our staff will confirm your payment soon."
              : `Thank you for your purchase. We've sent a confirmation email to ${shippingInfo.email}.`}
          </p>
          <p className="mb-8 text-gray-600">
            Order #: {order?.order_number || 'Processing...'}
          </p>
          <Link href="/">
            <button className="bg-black text-white px-6 py-2 rounded-md hover:bg-gray-800 transition-colors">
              Continue Shopping
            </button>
          </Link>
        </div>
      )
    }

    switch (activeStep) {
      case "shipping":
        return (
          <form onSubmit={handleShippingSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
                  First Name
                </label>
                <input
                  id="firstName"
                  name="firstName"
                  value={shippingInfo.firstName}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400"
                />
              </div>
              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
                  Last Name
                </label>
                <input
                  id="lastName"
                  name="lastName"
                  value={shippingInfo.lastName}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400"
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={shippingInfo.email}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400"
              />
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                value={shippingInfo.phone}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400"
              />
            </div>

            <div>
              <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-1">
                Country/Region
              </label>
              <select
                id="country"
                name="country"
                value={shippingInfo.country}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400"
              >
                {countries.map((country) => (
                  <option key={country.code} value={country.code}>
                    {country.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
                Street Address
              </label>
              <input
                id="address"
                name="address"
                value={shippingInfo.address}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400"
              />
            </div>

            <div>
              <label htmlFor="apartment" className="block text-sm font-medium text-gray-700 mb-1">
                Apartment, suite, etc. (optional)
              </label>
              <input
                id="apartment"
                name="apartment"
                value={shippingInfo.apartment}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
                  City
                </label>
                <input
                  id="city"
                  name="city"
                  value={shippingInfo.city}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400"
                />
              </div>
              <div>
                <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-1">
                  State/Province
                </label>
                <input
                  id="state"
                  name="state"
                  value={shippingInfo.state}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400"
                />
              </div>
              <div>
                <label htmlFor="zipCode" className="block text-sm font-medium text-gray-700 mb-1">
                  ZIP/Postal Code
                </label>
                <input
                  id="zipCode"
                  name="zipCode"
                  value={shippingInfo.zipCode}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400"
                />
              </div>
            </div>

            <div className="pt-4">
              <h3 className="font-medium mb-3">Shipping Method</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between border p-4 rounded-md">
                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id="standard"
                      name="shippingMethod"
                      value="standard"
                      checked={shippingMethod === "standard"}
                      onChange={() => setShippingMethod("standard")}
                      className="h-4 w-4 text-black focus:ring-gray-500 border-gray-300"
                    />
                    <label htmlFor="standard" className="font-normal cursor-pointer">
                      Standard Shipping (3-5 business days)
                    </label>
                  </div>
                  <span className="font-medium">$10.00</span>
                </div>
                <div className="flex items-center justify-between border p-4 rounded-md">
                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id="express"
                      name="shippingMethod"
                      value="express"
                      checked={shippingMethod === "express"}
                      onChange={() => setShippingMethod("express")}
                      className="h-4 w-4 text-black focus:ring-gray-500 border-gray-300"
                    />
                    <label htmlFor="express" className="font-normal cursor-pointer">
                      Express Shipping (1-2 business days)
                    </label>
                  </div>
                  <span className="font-medium">$20.00</span>
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-black text-white py-2 px-4 rounded-md hover:bg-gray-800 transition-colors"
            >
              Continue to Payment
            </button>
          </form>
        )

      case "payment":
        return (
          <form onSubmit={handlePaymentSubmit} className="space-y-6">
            <div className="mb-6">
              <h3 className="font-medium mb-3">Payment Method</h3>
              <div className="w-full">
                <div className="flex border-b">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab("credit");
                      setPaymentMethod("credit");
                    }}
                    className={`flex-1 py-2 px-4 text-center ${
                      activeTab === "credit"
                        ? "border-b-2 border-black font-medium"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    Credit Card
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab("paypal");
                      setPaymentMethod("paypal");
                    }}
                    className={`flex-1 py-2 px-4 text-center ${
                      activeTab === "paypal"
                        ? "border-b-2 border-black font-medium"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    PayPal
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab("apple");
                      setPaymentMethod("apple");
                    }}
                    className={`flex-1 py-2 px-4 text-center ${
                      activeTab === "apple"
                        ? "border-b-2 border-black font-medium"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    Apple Pay
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab("cod");
                      setPaymentMethod("cod");
                    }}
                    className={`flex-1 py-2 px-4 text-center ${
                      activeTab === "cod"
                        ? "border-b-2 border-black font-medium bg-yellow-100"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    Cash on Delivery (COD)
                  </button>
                </div>
                <div className="pt-4">
                  {activeTab === "credit" && (
                    <div className="space-y-4 ">
                        <div className="text-center p-6 border rounded-md">
                      <p className="mb-4">
                        You'll be redirected to complete your purchase
                        securely.
                      </p>
                      <form
                        action="/api/checkout_sessions"
                        method="POST"
                        className="justify-self-center"
                      >
                        {/* Hidden fields with order data */}
                        <input type="hidden" name="amount" value={total} />
                        <input
                          type="hidden"
                          name="shippingInfo"
                          value={JSON.stringify(shippingInfo)}
                        />
                        <input
                          type="hidden"
                          name="cart"
                          value={JSON.stringify(cart)}
                        />
                        <input
                          type="hidden"
                          name="shippingMethod"
                          value={shippingMethod}
                        />

                        <button
                          type="submit"
                          className="justify-center items-center  bg-black text-white py-2 px-4 rounded-md hover:bg-gray-800 transition-colors"
                        >
                          Checkout 
                        </button>
                      </form>
                    </div>
                     
                    </div>
                  )}
                  {activeTab === "paypal" && (
                    <div className="text-center p-6 border rounded-md">
                      <p className="mb-4">
                        You'll be redirected to PayPal to complete your purchase
                        securely.
                      </p>
                      <button
                        type="button"
                        className="bg-[#0070ba] hover:bg-[#005ea6] text-white px-4 py-2 rounded-md transition-colors"
                      >
                        Continue with PayPal 
                      </button>
                    </div>
                  )}
                  {activeTab === "apple" && (
                    <div className="text-center p-6 border rounded-md">
                      <p className="mb-4">
                        Complete your purchase with Apple Pay.
                      </p>
                      <button
                        type="button"
                        className="bg-black hover:bg-gray-800 text-white px-4 py-2 rounded-md transition-colors flex items-center justify-center mx-auto"
                      >
                        <svg
                          className="h-5 w-5 mr-2"
                          viewBox="0 0 24 24"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M17.0001 7.5C17.6667 6.83333 18 6 18 5C18 4 17.6667 3.16667 17.0001 2.5C16.3334 3.16667 16.0001 4 16.0001 5C16.0001 6 16.3334 6.83333 17.0001 7.5Z"
                            fill="currentColor"
                          />
                          <path
                            d="M12.0001 21.5C11.0001 21.5 10.0001 21 9.00008 20C8.00008 19 7.33341 18.3333 7.00008 18C5.66674 16.6667 4.66674 15 4.00008 13C3.33341 11 3.33341 9.16667 4.00008 7.5C4.66674 5.83333 5.83341 5 7.50008 5C8.50008 5 9.33341 5.33333 10.0001 6C10.6667 6.66667 11.1667 7 11.5001 7C11.8334 7 12.3334 6.66667 13.0001 6C13.6667 5.33333 14.5001 5 15.5001 5C16.5001 5 17.3334 5.33333 18.0001 6C18.6667 6.66667 19.0001 7.5 19.0001 8.5C19.0001 9.5 18.6667 10.5 18.0001 11.5C17.3334 12.5 16.5001 13.3333 15.5001 14C14.5001 14.6667 13.6667 15 13.0001 15C12.3334 15 11.8334 14.6667 11.5001 14C11.1667 13.3333 10.6667 13 10.0001 13C9.33341 13 8.83341 13.3333 8.50008 14C8.16674 14.6667 8.00008 15.3333 8.00008 16C8.00008 16.6667 8.33341 17.5 9.00008 18.5C9.66674 19.5 10.5001 20 11.5001 20C12.5001 20 13.3334 19.6667 14.0001 19C14.6667 18.3333 15.1667 18 15.5001 18C15.8334 18 16.3334 18.3333 17.0001 19C17.6667 19.6667 18.5001 20 19.5001 20C20.5001 20 21.3334 19.6667 22.0001 19C22.6667 18.3333 23.0001 17.5 23.0001 16.5C23.0001 15.5 22.6667 14.5 22.0001 13.5C21.3334 12.5 20.5001 11.6667 19.5001 11C18.5001 10.3333 17.6667 10 17.0001 10C16.3334 10 15.8334 10.3333 15.5001 11C15.1667 11.6667 14.6667 12 14.0001 12C13.3334 12 12.8334 11.6667 12.5001 11C12.1667 10.3333 11.6667 10 11.0001 10C10.3334 10 9.83341 10.3333 9.50008 11C9.16674 11.6667 9.00008 12.3333 9.00008 13C9.00008 13.6667 9.33341 14.5 10.0001 15.5C10.6667 16.5 11.5001 17 12.5001 17C13.5001 17 14.3334 16.6667 15.0001 16C15.6667 15.3333 16.1667 15 16.5001 15C16.8334 15 17.3334 15.3333 18.0001 16C18.6667 16.6667 19.5001 17 20.5001 17C21.5001 17 22.3334 16.6667 23.0001 16"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                        Pay
                      </button>
                    </div>
                  )}
                  {activeTab === "cod" && (
                    <div className="border border-yellow-400 bg-yellow-50 p-4 rounded-md text-yellow-900 mt-2">
                      <h4 className="font-bold text-lg mb-2">
                        Cash on Delivery (COD)
                      </h4>
                      <ul className="list-disc ml-6 mb-2">
                        <li>
                          You must pay <b>in cash</b> or <b>e-transfer</b> to
                          the delivery person.
                        </li>
                        <li>
                          Please have the <b>exact amount</b> ready.
                        </li>
                        <li>
                          A COD handling fee of <b>${COD_FEE}</b> will be added
                          to your order.
                        </li>
                        <li>
                          Optionally, our courier may have a POS machine for
                          card payments.
                        </li>
                      </ul>
                      <div className="font-semibold">
                        Your order will be marked as{" "}
                        <span className="text-orange-600">
                          Pending Order in Process
                        </span>{" "}
                        until payment is confirmed by our staff or the delivery
                        person.
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-black text-white py-2 px-4 rounded-md hover:bg-gray-800 transition-colors"
              disabled={isProcessing}
            >
              {isProcessing ? (
                <span className="flex items-center justify-center">
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Processing...
                </span>
              ) : isCOD ? (
                `Place Order (COD) - $${total.toFixed(2)} USD`
              ) : (
                `Pay $${total.toFixed(2)} USD`
              )}
            </button>
          </form>
        );

      default:
        return null
    }
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <Link href="/" className="inline-flex items-center text-sm mb-8 hover:underline">
        <ArrowLeft className="h-4 w-4 mr-1" />
        Continue shopping
      </Link>

      <h1 className="text-3xl font-bold mb-8">Checkout</h1>

      {cart.length === 0 && !isComplete ? (
        <div className="text-center py-12">
          <p className="text-xl mb-4">Your cart is empty</p>
          <Link href="/">
            <button className="bg-black text-white px-6 py-2 rounded-md hover:bg-gray-800 transition-colors">
              Browse Products
            </button>
          </Link>
        </div>
      ) : (
        <div className="flex flex-col-reverse lg:grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            {!isComplete && (
              <div className="mb-8">
                <div className="flex items-center mb-6">
                  <div
                    className={`flex items-center justify-center w-8 h-8 rounded-full ${
                      activeStep === "shipping" ? "bg-black text-white" : "bg-gray-200 text-gray-700"
                    } mr-2`}
                  >
                    <MapPin className="h-4 w-4" />
                  </div>
                  <div className="flex-grow h-0.5 bg-gray-200 mx-2"></div>
                  <div
                    className={`flex items-center justify-center w-8 h-8 rounded-full ${
                      activeStep === "payment" ? "bg-black text-white" : "bg-gray-200 text-gray-700"
                    } mr-2`}
                  >
                    <CreditCard className="h-4 w-4" />
                  </div>
                  <div className="flex-grow h-0.5 bg-gray-200 mx-2"></div>
                  <div
                    className={`flex items-center justify-center w-8 h-8 rounded-full ${
                      activeStep === "confirmation" ? "bg-black text-white" : "bg-gray-200 text-gray-700"
                    }`}
                  >
                    <Check className="h-4 w-4" />
                  </div>
                </div>
                <div className="flex justify-between text-sm">
                  <span className={activeStep === "shipping" ? "font-medium" : ""}>Shipping</span>
                  <span className={activeStep === "payment" ? "font-medium" : ""}>Payment</span>
                  <span className={activeStep === "confirmation" ? "font-medium" : ""}>Confirmation</span>
                </div>
              </div>
            )}

            {renderCheckoutStep()}
          </div>

          <div className="lg:col-span-1">
            {!isComplete && (
              <div className="bg-gray-50 p-6 rounded-lg sticky top-6">
                <h2 className="text-xl font-bold mb-4">Order Summary</h2>
                <div className="border-t pt-6">
              <h3 className="font-bold mb-4 ">Order Review</h3>
              <div className="space-y-4">
                {cart.map((item) => (
                  <div key={item.id} className="flex items-center py-2">
                    <div className="w-16 h-16 relative flex-shrink-0 bg-gray-100 rounded-md overflow-hidden">
                      <Image
                        src={item.image || "/placeholder.svg?height=64&width=64"}
                        alt={item.name}
                        fill
                        className="object-cover object-center"
                      />
                    </div>
                    <div className="ml-4 flex-grow">
                      <h4 className="font-medium">{item.name}</h4>
                      <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                    </div>
                    <div className="ml-4 font-semibold">${(item.price * item.quantity).toFixed(2)}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="border-t pt-6">
              <h3 className="font-medium mb-4">Billing Address</h3>
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="same"
                    name="billingAddress"
                    value="same"
                    checked={billingAddress === "same"}
                    onChange={() => setBillingAddress("same")}
                    className="h-4 w-4 text-black focus:ring-gray-500 border-gray-300"
                  />
                  <label htmlFor="same" className="font-normal cursor-pointer">
                    Same as shipping address
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="different"
                    name="billingAddress"
                    value="different"
                    checked={billingAddress === "different"}
                    onChange={() => setBillingAddress("different")}
                    className="h-4 w-4 text-black focus:ring-gray-500 border-gray-300"
                  />
                  <label htmlFor="different" className="font-normal cursor-pointer">
                    Use a different billing address
                  </label>
                </div>
              </div>
            </div>

                <div className="space-y-2 mb-4">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Shipping</span>
                    <span>${shipping.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Taxes</span>
                    <span>${taxes.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>COD Fee</span>
                    <span>{codFee ? `$${codFee.toFixed(2)}` : "-"}</span>
                  </div>
                  <div className="border-t pt-2 mt-2 flex justify-between font-bold">
                    <span>Total</span>
                    <span>${total.toFixed(2)}</span>
                  </div>
                </div>

                {activeStep === "shipping" && (
                  <div className="mt-6 space-y-4">
                    <h3 className="font-medium text-sm">Your Cart ({cart.length})</h3>
                    <div className="max-h-60 overflow-y-auto space-y-3">
                      {cart.map((item) => (
                        <div key={item.id} className="flex items-center py-2 border-b">
                          <div className="w-12 h-12 relative flex-shrink-0 bg-gray-100 rounded-md overflow-hidden">
                            <Image
                              src={item.image || "/placeholder.svg?height=48&width=48"}
                              alt={item.name}
                              fill
                              className="object-cover object-center"
                            />
                          </div>
                          <div className="ml-3 flex-grow">
                            <h4 className="text-sm font-medium">{item.name}</h4>
                            <div className="flex items-center mt-1">
                              <button
                                className="w-6 h-6 flex items-center justify-center border rounded-md text-sm bg-white hover:bg-gray-200"
                                onClick={() => {
                                  const newQty = Math.max(1, item.quantity - 1);
                                  updateQuantity(item.id, newQty);
                                  setQuantity(item.id, newQty);
                                }}
                                aria-label="Decrease quantity"
                              >
                                -
                              </button>
                              <span className="mx-2 text-sm">{item.quantity}</span>
                              <button
                                className="w-6 h-6 flex items-center justify-center border rounded-md text-sm bg-white hover:bg-gray-200"
                                onClick={() => {
                                  const newQty = item.quantity + 1;
                                  updateQuantity(item.id, newQty);
                                  setQuantity(item.id, newQty);
                                }}
                                aria-label="Increase quantity"
                              >
                                +
                              </button>
                              <button
                                className="ml-3 text-gray-400 hover:text-red-500"
                                onClick={() => {
                                  removeItem(item.id);
                                  setQuantity(item.id, 1); // O podrías eliminar la key del store
                                }}
                                aria-label="Remove item"
                              >
                                <Trash2 className="h-5 w-5" />
                              </button>
                            </div>
                          </div>
                          <div className="ml-2 text-sm">${(item.price * item.quantity).toFixed(2)}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
