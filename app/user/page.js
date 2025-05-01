"use client"

import { useState, useEffect } from "react"
import { createClient } from "@supabase/supabase-js"
import { ChevronDown, ChevronUp, User, ShoppingBag } from "lucide-react"
import {supabase} from "@/lib/supabaseClient"


export default function UserDashboard() {
  const [user, setUser] = useState(null)
  const [orders, setOrders] = useState([])
  const [payments, setPayments] = useState([])
  const [orderItems, setOrderItems] = useState([])
  const [shippingAddresses, setShippingAddresses] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("overview")
  const [expandedOrders, setExpandedOrders] = useState({})

  useEffect(() => {
    async function fetchUserData() {
      try {
        // Get current user
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (user) {
          // Fetch user details
          const { data: userData } = await supabase.from("users").select("*").eq("id", user.id).single()

          setUser(userData)

          // Fetch user's orders
          const { data: ordersData } = await supabase
            .from("orders")
            .select("*")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false })

          setOrders(ordersData || [])

          // Fetch user's payments
          const { data: paymentsData } = await supabase
            .from("payments")
            .select("*")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false })

          setPayments(paymentsData || [])

          // Fetch order items for user's orders
          if (ordersData && ordersData.length > 0) {
            const orderIds = ordersData.map((order) => order.id)

            const { data: orderItemsData } = await supabase.from("order_items").select("*").in("order_id", orderIds)

            setOrderItems(orderItemsData || [])

            // Fetch shipping addresses for user's orders
            const { data: shippingAddressesData } = await supabase
              .from("shipping_addresses")
              .select("*")
              .in("order_id", orderIds)

            setShippingAddresses(shippingAddressesData || [])
          }
        }
      } catch (error) {
        console.error("Error fetching user data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchUserData()
  }, [])

  const toggleOrderExpand = (orderId) => {
    setExpandedOrders((prev) => ({
      ...prev,
      [orderId]: !prev[orderId],
    }))
  }

  const getOrderItems = (orderId) => {
    return orderItems.filter((item) => item.order_id === orderId)
  }

  const getShippingAddress = (orderId) => {
    return shippingAddresses.find((address) => address.order_id === orderId)
  }

  const getPaymentForOrder = (paymentId) => {
    return payments.find((payment) => payment.id === paymentId)
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-pulse text-xl font-medium">Loading...</div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Please sign in</h1>
          <p className="mb-6">You need to be signed in to view your dashboard</p>
          <a
            href="/login"
            className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-black hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black"
          >
            Sign In
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-black text-white py-4 px-6 flex justify-between items-center">
        <h1 className="text-xl font-bold">The Quick Shop</h1>
        <div className="flex items-center space-x-4">
          <a href="/cart" className="relative">
            <ShoppingBag className="h-6 w-6" />
            {orders.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                {orders.length}
              </span>
            )}
          </a>
          <a href="/logout" className="text-sm">
            Sign Out
          </a>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="bg-white rounded-lg shadow-sm overflow-hidden mb-8">
          <div className="p-6 border-b border-gray-100">
            <h1 className="text-2xl font-bold">My Account</h1>
            <p className="text-gray-600">Welcome back, {user.name}</p>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-100">
            <nav className="flex -mb-px">
              <button
                onClick={() => setActiveTab("overview")}
                className={`py-4 px-6 text-sm font-medium ${
                  activeTab === "overview" ? "border-b-2 border-black text-black" : "text-gray-500 hover:text-gray-700"
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveTab("orders")}
                className={`py-4 px-6 text-sm font-medium ${
                  activeTab === "orders" ? "border-b-2 border-black text-black" : "text-gray-500 hover:text-gray-700"
                }`}
              >
                Orders
              </button>
              <button
                onClick={() => setActiveTab("payments")}
                className={`py-4 px-6 text-sm font-medium ${
                  activeTab === "payments" ? "border-b-2 border-black text-black" : "text-gray-500 hover:text-gray-700"
                }`}
              >
                Payments
              </button>
              <button
                onClick={() => setActiveTab("addresses")}
                className={`py-4 px-6 text-sm font-medium ${
                  activeTab === "addresses" ? "border-b-2 border-black text-black" : "text-gray-500 hover:text-gray-700"
                }`}
              >
                Addresses
              </button>
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {/* Overview Tab */}
            {activeTab === "overview" && (
              <div className="space-y-8">
                {/* User Info */}
                <div className="bg-gray-50 p-6 rounded-lg">
                  <div className="flex items-center mb-4">
                    <User className="h-5 w-5 mr-2 text-gray-500" />
                    <h2 className="text-lg font-medium">Account Information</h2>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Name</p>
                      <p className="font-medium">{user.name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Email</p>
                      <p className="font-medium">{user.email}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Account Status</p>
                      <p className="font-medium capitalize">{user.status}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Member Since</p>
                      <p className="font-medium">{formatDate(user.created_at)}</p>
                    </div>
                  </div>
                </div>

                {/* Recent Orders */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-medium">Recent Orders</h2>
                    {orders.length > 0 && (
                      <button onClick={() => setActiveTab("orders")} className="text-sm text-black hover:underline">
                        View All
                      </button>
                    )}
                  </div>

                  {orders.length === 0 ? (
                    <div className="bg-gray-50 p-6 rounded-lg text-center">
                      <p className="text-gray-500">You haven't placed any orders yet.</p>
                      <a href="/shop" className="mt-2 inline-block text-sm text-black hover:underline">
                        Start shopping
                      </a>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {orders.slice(0, 3).map((order) => (
                        <div key={order.id} className="bg-gray-50 p-4 rounded-lg">
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="font-medium">Order #{order.id.substring(0, 8)}</p>
                              <p className="text-sm text-gray-500">{formatDate(order.created_at)}</p>
                            </div>
                            <div className="text-right">
                              <p className="font-medium">{formatCurrency(order.total_amount)}</p>
                              <p className="text-sm capitalize px-2 py-1 rounded-full bg-gray-200 inline-block">
                                {order.status}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Recent Payments */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-medium">Recent Payments</h2>
                    {payments.length > 0 && (
                      <button onClick={() => setActiveTab("payments")} className="text-sm text-black hover:underline">
                        View All
                      </button>
                    )}
                  </div>

                  {payments.length === 0 ? (
                    <div className="bg-gray-50 p-6 rounded-lg text-center">
                      <p className="text-gray-500">No payment history available.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {payments.slice(0, 3).map((payment) => (
                        <div key={payment.id} className="bg-gray-50 p-4 rounded-lg">
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="font-medium capitalize">{payment.payment_method}</p>
                              <p className="text-sm text-gray-500">{formatDate(payment.created_at)}</p>
                            </div>
                            <div className="text-right">
                              <p className="font-medium">{formatCurrency(payment.amount)}</p>
                              <p className="text-sm capitalize px-2 py-1 rounded-full bg-gray-200 inline-block">
                                {payment.status}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Orders Tab */}
            {activeTab === "orders" && (
              <div>
                <h2 className="text-xl font-medium mb-6">My Orders</h2>

                {orders.length === 0 ? (
                  <div className="bg-gray-50 p-6 rounded-lg text-center">
                    <p className="text-gray-500">You haven't placed any orders yet.</p>
                    <a href="/shop" className="mt-2 inline-block text-sm text-black hover:underline">
                      Start shopping
                    </a>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {orders.map((order) => {
                      const isExpanded = expandedOrders[order.id]
                      const items = getOrderItems(order.id)
                      const address = getShippingAddress(order.id)
                      const payment = getPaymentForOrder(order.payment_id)

                      return (
                        <div key={order.id} className="border border-gray-200 rounded-lg overflow-hidden">
                          <div
                            className="bg-gray-50 p-4 flex justify-between items-center cursor-pointer"
                            onClick={() => toggleOrderExpand(order.id)}
                          >
                            <div>
                              <p className="font-medium">Order #{order.id.substring(0, 8)}</p>
                              <p className="text-sm text-gray-500">{formatDate(order.created_at)}</p>
                            </div>
                            <div className="flex items-center">
                              <div className="text-right mr-4">
                                <p className="font-medium">{formatCurrency(order.total_amount)}</p>
                                <p
                                  className={`text-sm capitalize px-2 py-1 rounded-full inline-block
                                  ${
                                    order.status === "completed"
                                      ? "bg-green-100 text-green-800"
                                      : order.status === "processing"
                                        ? "bg-blue-100 text-blue-800"
                                        : "bg-gray-200 text-gray-800"
                                  }`}
                                >
                                  {order.status}
                                </p>
                              </div>
                              {isExpanded ? (
                                <ChevronUp className="h-5 w-5 text-gray-500" />
                              ) : (
                                <ChevronDown className="h-5 w-5 text-gray-500" />
                              )}
                            </div>
                          </div>

                          {isExpanded && (
                            <div className="p-4 border-t border-gray-200">
                              {/* Order Items */}
                              <div className="mb-6">
                                <h3 className="font-medium mb-3">Order Items</h3>
                                <div className="bg-gray-50 rounded-lg overflow-hidden">
                                  <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-100">
                                      <tr>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                          Product
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                          Quantity
                                        </th>
                                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                          Price
                                        </th>
                                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                          Total
                                        </th>
                                      </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                      {items.map((item) => (
                                        <tr key={item.id}>
                                          <td className="px-4 py-3 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900">
                                              Product #{item.product_id.substring(0, 8)}
                                            </div>
                                          </td>
                                          <td className="px-4 py-3 whitespace-nowrap">
                                            <div className="text-sm text-gray-900">{item.quantity}</div>
                                          </td>
                                          <td className="px-4 py-3 whitespace-nowrap text-right">
                                            <div className="text-sm text-gray-900">{formatCurrency(item.price)}</div>
                                          </td>
                                          <td className="px-4 py-3 whitespace-nowrap text-right">
                                            <div className="text-sm text-gray-900">
                                              {formatCurrency(item.price * item.quantity)}
                                            </div>
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                    <tfoot className="bg-gray-50">
                                      <tr>
                                        <td colSpan="3" className="px-4 py-3 text-right text-sm font-medium">
                                          Total
                                        </td>
                                        <td className="px-4 py-3 text-right text-sm font-medium">
                                          {formatCurrency(order.total_amount)}
                                        </td>
                                      </tr>
                                    </tfoot>
                                  </table>
                                </div>
                              </div>

                              {/* Payment Info */}
                              {payment && (
                                <div className="mb-6">
                                  <h3 className="font-medium mb-3">Payment Information</h3>
                                  <div className="bg-gray-50 p-4 rounded-lg">
                                    <div className="grid md:grid-cols-3 gap-4">
                                      <div>
                                        <p className="text-sm text-gray-500">Method</p>
                                        <p className="font-medium capitalize">{payment.payment_method}</p>
                                      </div>
                                      <div>
                                        <p className="text-sm text-gray-500">Amount</p>
                                        <p className="font-medium">{formatCurrency(payment.amount)}</p>
                                      </div>
                                      <div>
                                        <p className="text-sm text-gray-500">Status</p>
                                        <p className="font-medium capitalize">{payment.status}</p>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              )}

                              {/* Shipping Address */}
                              {address && (
                                <div>
                                  <h3 className="font-medium mb-3">Shipping Address</h3>
                                  <div className="bg-gray-50 p-4 rounded-lg">
                                    <div className="grid md:grid-cols-2 gap-4">
                                      <div>
                                        <p className="text-sm text-gray-500">Name</p>
                                        <p className="font-medium">
                                          {address.first_name} {address.last_name}
                                        </p>
                                      </div>
                                      <div>
                                        <p className="text-sm text-gray-500">Contact</p>
                                        <p className="font-medium">{address.email}</p>
                                        <p className="font-medium">{address.phone}</p>
                                      </div>
                                      <div className="md:col-span-2">
                                        <p className="text-sm text-gray-500">Address</p>
                                        <p className="font-medium">
                                          {address.address}
                                          {address.apartment && `, ${address.apartment}`}
                                        </p>
                                        <p className="font-medium">
                                          {address.city}, {address.state} {address.zip}
                                        </p>
                                        <p className="font-medium">{address.country}</p>
                                      </div>
                                      <div>
                                        <p className="text-sm text-gray-500">Shipping Method</p>
                                        <p className="font-medium capitalize">{address.shipping_method}</p>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Payments Tab */}
            {activeTab === "payments" && (
              <div>
                <h2 className="text-xl font-medium mb-6">Payment History</h2>

                {payments.length === 0 ? (
                  <div className="bg-gray-50 p-6 rounded-lg text-center">
                    <p className="text-gray-500">No payment history available.</p>
                  </div>
                ) : (
                  <div className="bg-gray-50 rounded-lg overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Date
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Method
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Amount
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {payments.map((payment) => (
                          <tr key={payment.id}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">{formatDate(payment.created_at)}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900 capitalize">
                                {payment.payment_method}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span
                                className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                                ${
                                  payment.status === "completed"
                                    ? "bg-green-100 text-green-800"
                                    : payment.status === "processing"
                                      ? "bg-blue-100 text-blue-800"
                                      : "bg-gray-100 text-gray-800"
                                }`}
                              >
                                {payment.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              {formatCurrency(payment.amount)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Addresses Tab */}
            {activeTab === "addresses" && (
              <div>
                <h2 className="text-xl font-medium mb-6">Shipping Addresses</h2>

                {shippingAddresses.length === 0 ? (
                  <div className="bg-gray-50 p-6 rounded-lg text-center">
                    <p className="text-gray-500">No shipping addresses saved.</p>
                  </div>
                ) : (
                  <div className="grid md:grid-cols-2 gap-6">
                    {shippingAddresses.map((address) => (
                      <div key={address.id} className="bg-gray-50 p-6 rounded-lg">
                        <div className="flex justify-between items-start mb-4">
                          <h3 className="font-medium">
                            {address.first_name} {address.last_name}
                          </h3>
                          <span className="text-xs bg-gray-200 px-2 py-1 rounded-full">
                            Order #{address.order_id.substring(0, 8)}
                          </span>
                        </div>
                        <div className="space-y-2 text-sm">
                          <p>
                            {address.address}
                            {address.apartment && `, ${address.apartment}`}
                          </p>
                          <p>
                            {address.city}, {address.state} {address.zip}
                          </p>
                          <p>{address.country}</p>
                          <p className="pt-2">{address.phone}</p>
                          <p>{address.email}</p>
                        </div>
                        <div className="mt-4 pt-4 border-t border-gray-200">
                          <p className="text-sm text-gray-500">Shipping Method</p>
                          <p className="font-medium capitalize">{address.shipping_method}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-black text-white py-8 px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <h2 className="text-xl font-bold">The Quick Shop</h2>
              <p className="text-gray-400 text-sm mt-1">Premium products for your lifestyle</p>
            </div>
            <div className="flex space-x-6">
              <a href="/about" className="text-sm text-gray-300 hover:text-white">
                About
              </a>
              <a href="/contact" className="text-sm text-gray-300 hover:text-white">
                Contact
              </a>
              <a href="/terms" className="text-sm text-gray-300 hover:text-white">
                Terms
              </a>
              <a href="/privacy" className="text-sm text-gray-300 hover:text-white">
                Privacy
              </a>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-800 text-center text-sm text-gray-400">
            &copy; {new Date().getFullYear()} The Quick Shop. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  )
}
