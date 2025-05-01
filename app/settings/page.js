"use client";

import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import { ChevronDown, ChevronUp, User, ShoppingBag } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

export default function UserDashboard() {
  const [user, setUser] = useState(null);
  const [orders, setOrders] = useState([]);
  const [payments, setPayments] = useState([]);
  const [orderItems, setOrderItems] = useState([]);
  const [shippingAddresses, setShippingAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [newName, setNewName] = useState("");
  const [isUpdatingName, setIsUpdatingName] = useState(false);
  const tabLabels = {
    overview: "Overview",
    orders: "Orders",
    payments: "Payments",
    addresses: "Addresses",
  };
  const [expandedOrders, setExpandedOrders] = useState({});
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    async function fetchUserData() {
      try {
        // Get current user
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          // Fetch user details
          const { data: userData } = await supabase
            .from("users")
            .select("*")
            .eq("id", user.id)
            .single();

          setUser(userData);

          // Fetch user's orders
          const { data: ordersData } = await supabase
            .from("orders")
            .select("*")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false });

          setOrders(ordersData || []);

          // Fetch user's payments
          const { data: paymentsData } = await supabase
            .from("payments")
            .select("*")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false });

          setPayments(paymentsData || []);

          // Fetch order items for user's orders
          if (ordersData && ordersData.length > 0) {
            const orderIds = ordersData.map((order) => order.id);

            const { data: orderItemsData } = await supabase
              .from("order_items")
              .select("*")
              .in("order_id", orderIds);

            setOrderItems(orderItemsData || []);

            // Fetch shipping addresses for user's orders
            const { data: shippingAddressesData } = await supabase
              .from("shipping_addresses")
              .select("*")
              .in("order_id", orderIds);

            setShippingAddresses(shippingAddressesData || []);
          }
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchUserData();
  }, []);

  const toggleOrderExpand = (orderId) => {
    setExpandedOrders((prev) => ({
      ...prev,
      [orderId]: !prev[orderId],
    }));
  };

  const getOrderItems = (orderId) => {
    return orderItems.filter((item) => item.order_id === orderId);
  };

  const getShippingAddress = (orderId) => {
    return shippingAddresses.find((address) => address.order_id === orderId);
  };

  const getPaymentForOrder = (paymentId) => {
    return payments.find((payment) => payment.id === paymentId);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-pulse text-xl font-medium">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Please sign in</h1>
          <p className="mb-6">
            You need to be signed in to view your dashboard
          </p>
          <a
            href="/login"
            className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-black hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black"
          >
            Sign In
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="bg-white rounded-lg shadow-sm overflow-hidden mb-8">
          <div className="p-6 border-b border-gray-100">
            <h1 className="text-2xl font-bold">My Account</h1>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-100">
            {/* Desktop Tabs */}
            <nav className="hidden sm:flex -mb-px">
              <button
                onClick={() => setActiveTab("overview")}
                className={`py-4 px-6 text-sm font-medium ${
                  activeTab === "overview"
                    ? "border-b-2 border-black text-black"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveTab("orders")}
                className={`py-4 px-6 text-sm font-medium ${
                  activeTab === "orders"
                    ? "border-b-2 border-black text-black"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                Orders
              </button>
              <button
                onClick={() => setActiveTab("payments")}
                className={`py-4 px-6 text-sm font-medium ${
                  activeTab === "payments"
                    ? "border-b-2 border-black text-black"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                Payments
              </button>
              <button
                onClick={() => setActiveTab("addresses")}
                className={`py-4 px-6 text-sm font-medium ${
                  activeTab === "addresses"
                    ? "border-b-2 border-black text-black"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                Addresses
              </button>
            </nav>

            {/* Mobile Menu Button */}
            <div className="lg:hidden flex justify-end p-3">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 rounded-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 flex items-center"
              >
                <span className="mr-2 text-sm font-medium">
                  {tabLabels[activeTab]}
                </span>
                {isMobileMenuOpen ? (
                  <ChevronUp className="h-6 w-6" />
                ) : (
                  <ChevronDown className="h-6 w-6" />
                )}
              </button>
            </div>

            {/* Mobile Menu */}
            <div
              className={`lg:hidden ${isMobileMenuOpen ? "block" : "hidden"}`}
            >
              <nav className="border-t border-gray-100">
                <button
                  onClick={() => {
                    setActiveTab("overview");
                    setIsMobileMenuOpen(false);
                  }}
                  className={`block w-full text-left py-3 px-4 text-sm font-medium ${
                    activeTab === "overview"
                      ? "text-black"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  Overview
                </button>
                <button
                  onClick={() => {
                    setActiveTab("orders");
                    setIsMobileMenuOpen(false);
                  }}
                  className={`block w-full text-left py-3 px-4 text-sm font-medium ${
                    activeTab === "orders"
                      ? "text-black"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  Orders
                </button>
                <button
                  onClick={() => {
                    setActiveTab("payments");
                    setIsMobileMenuOpen(false);
                  }}
                  className={`block w-full text-left py-3 px-4 text-sm font-medium ${
                    activeTab === "payments"
                      ? "text-black"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  Payments
                </button>
                <button
                  onClick={() => {
                    setActiveTab("addresses");
                    setIsMobileMenuOpen(false);
                  }}
                  className={`block w-full text-left py-3 px-4 text-sm font-medium ${
                    activeTab === "addresses"
                      ? "text-black"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  Addresses
                </button>
              </nav>
            </div>
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
                      <div className="flex flex-row gap-2">
                        <input
                          type="text"
                          value={newName || user?.name || ""}
                          onChange={(e) => setNewName(e.target.value)}
                          placeholder={
                            user?.name
                              ? user.name
                              : user?.email?.split("@")[0] || ""
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-black focus:border-black"
                        />
                        <button
                          onClick={async () => {
                            if (!newName.trim()) return;
                            setIsUpdatingName(true);
                            try {
                              await supabase
                                .from("users")
                                .update({ name: newName })
                                .eq("id", user.id);
                              setUser((prev) => ({ ...prev, name: newName }));
                              setNewName("");
                            } catch (error) {
                              console.error("Error updating name:", error);
                            } finally {
                              setIsUpdatingName(false);
                            }
                          }}
                          disabled={isUpdatingName || newName === user.name}
                          className=" px-3 py-1.5 bg-black text-white rounded-md hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isUpdatingName ? "Updating..." : "Save"}
                        </button>
                      </div>
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
                      <p className="font-medium">
                        {formatDate(user.created_at)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Recent Orders */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-medium">Recent Orders</h2>
                    {orders.length > 0 && (
                      <button
                        onClick={() => setActiveTab("orders")}
                        className="text-sm text-black hover:underline"
                      >
                        View All
                      </button>
                    )}
                  </div>

                  {orders.length === 0 ? (
                    <div className="bg-gray-50 p-6 rounded-lg text-center">
                      <p className="text-gray-500">
                        You haven't placed any orders yet.
                      </p>
                      <a
                        href="/shop"
                        className="mt-2 inline-block text-sm text-black hover:underline"
                      >
                        Start shopping
                      </a>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {orders.slice(0, 3).map((order) => (
                        <div
                          key={order.id}
                          className="bg-gray-50 p-4 rounded-lg"
                        >
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="font-medium">
                                Order #{order.id.substring(0, 8)}
                              </p>
                              <p className="text-sm text-gray-500">
                                {formatDate(order.created_at)}
                              </p>
                              <p className="text-xs text-gray-500">
                                {new Date(order.created_at).toLocaleTimeString(
                                  [],
                                  { hour: "2-digit", minute: "2-digit" }
                                )}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-medium">
                                {formatCurrency(order.amount)}
                              </p>
                              <p
                                className={`text-sm capitalize px-2 py-1 rounded-md inline-block
                                ${
                                  order.status === "completed"
                                    ? "bg-green-100 text-green-800"
                                    : order.status === "pending"
                                    ? "bg-yellow-100 text-yellow-800"
                                    : order.status === "cancelled"
                                    ? "bg-red-100 text-red-800"
                                    : "bg-gray-200 text-gray-800"
                                }`}
                              >
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
                      <button
                        onClick={() => setActiveTab("payments")}
                        className="text-sm text-black hover:underline"
                      >
                        View All
                      </button>
                    )}
                  </div>

                  {payments.length === 0 ? (
                    <div className="bg-gray-50 p-6 rounded-lg text-center">
                      <p className="text-gray-500">
                        No payment history available.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {payments.slice(0, 3).map((payment) => (
                        <div
                          key={payment.id}
                          className="bg-gray-50 p-4 rounded-lg"
                        >
                          <div className="flex justify-between items-center">
                            <div className="text-left">
                              <p className="font-medium capitalize">
                                {payment.method}
                              </p>
                              <p className="text-sm text-gray-500">
                                {formatDate(payment.created_at)}
                              </p>
                              <p className="text-xs text-gray-500">
                                {new Date(
                                  payment.created_at
                                ).toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-medium">
                                {formatCurrency(payment.amount)}
                              </p>
                              <p
                                className={`text-sm capitalize px-2 py-1 rounded-md inline-block
                                ${
                                  payment.status === "completed"
                                    ? "bg-green-100 text-green-800"
                                    : payment.status === "pending"
                                    ? "bg-yellow-100 text-yellow-800"
                                    : payment.status === "cancelled"
                                    ? "bg-red-100 text-red-800"
                                    : "bg-gray-200 text-gray-800"
                                }`}
                              >
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
                    <p className="text-gray-500">
                      You haven't placed any orders yet.
                    </p>
                    <a
                      href="/shop"
                      className="mt-2 inline-block text-sm text-black hover:underline"
                    >
                      Start shopping
                    </a>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {orders.map((order) => {
                      const isExpanded = expandedOrders[order.id];
                      const items = getOrderItems(order.id);
                      const address = getShippingAddress(order.id);
                      const payment = getPaymentForOrder(order.payment_id);

                      return (
                        <div
                          key={order.id}
                          className="border border-gray-200 rounded-lg overflow-hidden"
                        >
                          <div
                            className="bg-gray-50 p-4 flex justify-between items-center cursor-pointer"
                            onClick={() => toggleOrderExpand(order.id)}
                          >
                            <div>
                              <p className="font-medium">
                                Order #{order.id.substring(0, 8)}
                              </p>
                              <p className="text-sm text-gray-500">
                                {formatDate(order.created_at)}
                              </p>
                              <p className="text-xs text-gray-500">
                                {new Date(order.created_at).toLocaleTimeString(
                                  [],
                                  { hour: "2-digit", minute: "2-digit" }
                                )}
                              </p>
                            </div>
                            <div className="flex items-center">
                              <div className="text-right mr-4">
                                <p className="font-medium">
                                  {formatCurrency(order.amount)}
                                </p>
                                <p
                                  className={`text-sm capitalize px-2 py-1 rounded-md inline-block
                                  ${
                                    order.status === "completed"
                                      ? "bg-green-100 text-green-800"
                                      : order.status === "pending"
                                      ? "bg-yellow-100 text-yellow-800"
                                      : order.status === "cancelled"
                                      ? "bg-red-100 text-red-800"
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
                                <h3 className="font-medium mb-3">
                                  Order Items
                                </h3>
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
                                              Product #
                                              {item.product_id.substring(0, 8)}
                                            </div>
                                          </td>
                                          <td className="px-4 py-3 whitespace-nowrap">
                                            <div className="text-sm text-gray-900">
                                              {item.quantity}
                                            </div>
                                          </td>
                                          <td className="px-4 py-3 whitespace-nowrap text-right">
                                            <div className="text-sm text-gray-900">
                                              {formatCurrency(item.price)}
                                            </div>
                                          </td>
                                          <td className="px-4 py-3 whitespace-nowrap text-right">
                                            <div className="text-sm text-gray-900">
                                              {formatCurrency(
                                                item.price * item.quantity
                                              )}
                                            </div>
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                    <tfoot className="bg-gray-50">
                                      <tr>
                                        <td
                                          colSpan="3"
                                          className="px-4 py-3 text-right text-sm font-medium"
                                        >
                                          Total
                                        </td>
                                        <td className="px-4 py-3 text-right text-sm font-medium">
                                          {formatCurrency(order.amount)}
                                        </td>
                                      </tr>
                                    </tfoot>
                                  </table>
                                </div>
                              </div>

                              {/* Payment Info */}
                              {payment && (
                                <div className="mb-6">
                                  <h3 className="font-medium mb-3">
                                    Payment Information
                                  </h3>
                                  <div className="bg-gray-50 p-4 rounded-lg">
                                    <div className="grid md:grid-cols-3 gap-4">
                                      <div>
                                        <p className="text-sm text-gray-500">
                                          Method
                                        </p>
                                        <p
                                          className={`font-medium capitalize ${
                                            payment.status === "completed"
                                              ? "bg-green-100 text-green-800"
                                              : payment.status === "pending"
                                              ? "bg-yellow-100 text-yellow-800"
                                              : payment.status === "cancelled"
                                              ? "bg-red-100 text-red-800"
                                              : "bg-gray-100 text-gray-800"
                                          } px-2 py-1 rounded-md`}
                                        >
                                          {payment.method}
                                        </p>
                                      </div>
                                      <div>
                                        <p className="text-sm text-gray-500">
                                          Amount
                                        </p>
                                        <p className="font-medium">
                                          {formatCurrency(payment.amount)}
                                        </p>
                                      </div>
                                      <div>
                                        <p className="text-sm text-gray-500">
                                          Status
                                        </p>
                                        <p
                                          className={`font-medium capitalize ${
                                            payment.status === "completed"
                                              ? "bg-green-100 text-green-800"
                                              : payment.status === "pending"
                                              ? "bg-yellow-100 text-yellow-800"
                                              : payment.status === "cancelled"
                                              ? "bg-red-100 text-red-800"
                                              : "bg-gray-100 text-gray-800"
                                          } px-2 py-1 rounded-md`}
                                        >
                                          {payment.status}
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              )}

                              {/* Shipping Address */}
                              {address && (
                                <div>
                                  <h3 className="font-medium mb-3">
                                    Shipping Address
                                  </h3>
                                  <div className="bg-gray-50 p-4 rounded-lg">
                                    <div className="grid md:grid-cols-2 gap-4">
                                      <div>
                                        <p className="text-sm text-gray-500">
                                          Name
                                        </p>
                                        <p className="font-medium">
                                          {address.first_name}{" "}
                                          {address.last_name}
                                        </p>
                                      </div>
                                      <div>
                                        <p className="text-sm text-gray-500">
                                          Contact
                                        </p>
                                        <p className="font-medium">
                                          {address.email}
                                        </p>
                                        <p className="font-medium">
                                          {address.phone}
                                        </p>
                                      </div>
                                      <div className="md:col-span-2">
                                        <p className="text-sm text-gray-500">
                                          Address
                                        </p>
                                        <p className="font-medium">
                                          {address.address}
                                          {address.apartment &&
                                            `, ${address.apartment}`}
                                        </p>
                                        <p className="font-medium">
                                          {address.city}, {address.state}{" "}
                                          {address.zip_code}
                                        </p>
                                        <p className="font-medium">
                                          {address.country}
                                        </p>
                                      </div>
                                      <div>
                                        <p className="text-sm text-gray-500">
                                          Shipping Method
                                        </p>
                                        <p className="font-medium capitalize">
                                          {order.shipping_method}
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
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
                    <p className="text-gray-500">
                      No payment history available.
                    </p>
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
                              <div className="text-sm text-gray-900">
                                {formatDate(payment.created_at)}
                              </div>
                              <p className="text-xs text-gray-500">
                                {new Date(
                                  payment.created_at
                                ).toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </p>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900 capitalize">
                                {payment.method}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span
                                className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                                ${
                                  payment.status === "completed"
                                    ? "bg-green-100 text-green-800"
                                    : payment.status === "pending"
                                    ? "bg-yellow-100 text-yellow-800"
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
                    <p className="text-gray-500">
                      No shipping addresses saved.
                    </p>
                  </div>
                ) : (
                  <div className="grid md:grid-cols-2 gap-6">
                    {shippingAddresses.map((address) => (
                      <div
                        key={address.id}
                        className="bg-gray-50 p-6 rounded-lg"
                      >
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
                            {address.city}, {address.state} {address.zip_code}
                          </p>
                          <p>{address.country}</p>
                          <p className="pt-2">{address.phone}</p>
                          <p>{address.email}</p>
                        </div>
                        <div className="mt-4 pt-4 border-t border-gray-200">
                          <p className="text-sm text-gray-500">
                            Shipping Method
                          </p>
                          <p className="font-medium capitalize">
                            {address.shipping_method}
                          </p>
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
    </div>
  );
}
