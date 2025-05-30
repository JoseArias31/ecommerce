"use client";

import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import { ChevronDown, ChevronUp, User, ShoppingBag } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "react-hot-toast";
import { useCountry } from "@/contexts/CountryContext";

export default function UserDashboard() {
  const [user, setUser] = useState(null);
  const [orders, setOrders] = useState([]);
  const [payments, setPayments] = useState([]);
  const [orderItems, setOrderItems] = useState([]);
  const [shippingAddresses, setShippingAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const { country } = useCountry(); // Get current country from context
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
  const [addresses, setAddresses] = useState([]);
  const [defaultAddressId, setDefaultAddressId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [newAddress, setNewAddress] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    address: '',
    apartment: '',
    city: '',
    state: '',
    zip_code: '',
    country: 'CA'
  });

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

          fetchAddresses();
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchUserData();
  }, []);

  const isDuplicateAddress = (address, existingAddresses) => {
    return existingAddresses.some(existing => 
      existing.first_name === address.first_name &&
      existing.last_name === address.last_name &&
      existing.email === address.email &&
      existing.phone === address.phone &&
      existing.address === address.address &&
      existing.apartment === address.apartment &&
      existing.city === address.city &&
      existing.state === address.state &&
      existing.zip_code === address.zip_code &&
      existing.country === address.country
    )
  }

  const fetchAddresses = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('shipping_addresses')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Filter out duplicate addresses
      const uniqueAddresses = data.reduce((acc, current) => {
        if (!isDuplicateAddress(current, acc)) {
          acc.push(current);
        }
        return acc;
      }, []);

      setAddresses(uniqueAddresses);
      // Use the most recent address as default
      if (uniqueAddresses.length > 0) {
        setDefaultAddressId(uniqueAddresses[0].id);
      }
    } catch (error) {
      console.error('Error fetching addresses:', error);
      toast.error('Failed to load addresses');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddAddress = async (e) => {
    e.preventDefault();
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('You must be logged in to add an address');
        return;
      }

      // Check if this address already exists
      if (isDuplicateAddress(newAddress, addresses)) {
        toast.error('This address already exists');
        return;
      }

      const { data, error } = await supabase
        .from('shipping_addresses')
        .insert([{
          user_id: user.id,
          first_name: newAddress.first_name,
          last_name: newAddress.last_name,
          email: newAddress.email,
          phone: newAddress.phone,
          address: newAddress.address,
          apartment: newAddress.apartment,
          city: newAddress.city,
          state: newAddress.state,
          zip_code: newAddress.zip_code,
          country: newAddress.country,
          created_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) {
        console.error('Database error:', error);
        throw new Error(error.message);
      }

      // Update the addresses list
      setAddresses(prev => [data, ...prev]);
      
      // If this is the first address, set it as default
      if (addresses.length === 0) {
        setDefaultAddressId(data.id);
      }

      // Reset form and close modal
      setNewAddress({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        address: '',
        apartment: '',
        city: '',
        state: '',
        zip_code: '',
        country: 'CA'
      });
      setShowAddressForm(false);
      
      toast.success('Address added successfully');
    } catch (error) {
      console.error('Error adding address:', error);
      toast.error(error.message || 'Failed to add address');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setNewAddress(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSetDefaultAddress = async (addressId) => {
    try {
      setDefaultAddressId(addressId);
      toast.success('Default address updated');
    } catch (error) {
      console.error('Error setting default address:', error);
      toast.error('Failed to update default address');
    }
  };

  const handleDeleteAddress = async (addressId) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('shipping_addresses')
        .delete()
        .eq('id', addressId)
        .eq('user_id', user.id);

      if (error) throw error;

      setAddresses(prev => prev.filter(addr => addr.id !== addressId));
      
      // If deleted address was default, set a new default
      if (addressId === defaultAddressId && addresses.length > 1) {
        const newDefault = addresses.find(addr => addr.id !== addressId);
        if (newDefault) {
          setDefaultAddressId(newDefault.id);
        }
      }
      
      toast.success('Address deleted successfully');
    } catch (error) {
      console.error('Error deleting address:', error);
      toast.error('Failed to delete address');
    }
  };

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
        <div className="flex flex-col items-center space-y-4">
          <div className="bg-white p-8 rounded-xl border border-gray-100 shadow-sm flex items-center justify-center">
            <div className="w-12 h-12 border-t-2 border-black rounded-full animate-spin"></div>
          </div>
          <p className="text-gray-600 font-medium">Loading your account...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center bg-white p-10 rounded-xl border border-gray-100 shadow-sm max-w-md w-full">
          <div className="inline-flex bg-black bg-opacity-5 p-3 rounded-full mb-6">
            <User className="h-6 w-6 text-black" />
          </div>
          <h1 className="text-2xl font-bold mb-4 text-gray-800">Please sign in</h1>
          <p className="mb-8 text-gray-500">
            You need to be signed in to view your account dashboard
          </p>
          <a
            href="/login"
            className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-black hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black transition-all duration-200 w-full"
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
        <div className="bg-white rounded-xl shadow-md overflow-hidden mb-8 border border-gray-100">
          <div className="p-8 border-b border-gray-100">
            <h1 className="text-2xl font-bold text-gray-800">My Account</h1>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-100">
            {/* Desktop Tabs */}
            <nav className="hidden sm:flex -mb-px px-8">
              <button
                onClick={() => setActiveTab("overview")}
                className={`py-4 px-6 text-sm font-medium transition-colors duration-200 ${
                  activeTab === "overview"
                    ? "border-b-2 border-black text-black"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveTab("orders")}
                className={`py-4 px-6 text-sm font-medium transition-colors duration-200 ${
                  activeTab === "orders"
                    ? "border-b-2 border-black text-black"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                Orders
              </button>
              <button
                onClick={() => setActiveTab("payments")}
                className={`py-4 px-6 text-sm font-medium transition-colors duration-200 ${
                  activeTab === "payments"
                    ? "border-b-2 border-black text-black"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                Payments
              </button>
              <button
                onClick={() => setActiveTab("addresses")}
                className={`py-4 px-6 text-sm font-medium transition-colors duration-200 ${
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
          <div className="p-8">
            {/* Overview Tab */}
            {activeTab === "overview" && (
              <div className="space-y-10">
                {/* User Info */}
                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm transition-all duration-200 hover:shadow-md">
                  <div className="flex items-center mb-6">
                    <div className="bg-black bg-opacity-5 p-2 rounded-full mr-3">
                      <User className="h-5 w-5 text-black" />
                    </div>
                    <h2 className="text-lg font-medium text-gray-800">Account Information</h2>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-400">Name</p>
                      <div className="flex flex-row gap-2 mt-1">
                        <input
                          type="text"
                          value={newName || user?.name || ""}
                          onChange={(e) => setNewName(e.target.value)}
                          placeholder={
                            user?.name
                              ? user.name
                              : user?.email?.split("@")[0] || ""
                          }
                          className="w-full px-4 py-2.5 border border-gray-200 rounded-lg shadow-sm focus:ring-1 focus:ring-black focus:border-black transition-all duration-200"
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
                          className="px-4 py-2.5 bg-black text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black"
                        >
                          {isUpdatingName ? "Updating..." : "Save"}
                        </button>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-400">Email</p>
                      <p className="font-medium mt-1 text-gray-800">{user.email}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-400">Account Status</p>
                      <p className="font-medium mt-1 capitalize text-gray-800">{user.status}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-400">Member Since</p>
                      <p className="font-medium mt-1 text-gray-800">
                        {formatDate(user.created_at)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Recent Orders */}
                <div>
                  <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center">
                      <div className="bg-black bg-opacity-5 p-2 rounded-full mr-3">
                        <ShoppingBag className="h-5 w-5 text-black" />
                      </div>
                      <h2 className="text-lg font-medium text-gray-800">Recent Orders</h2>
                    </div>
                    {orders.length > 0 && (
                      <button
                        onClick={() => setActiveTab("orders")}
                        className="text-sm text-black hover:text-gray-600 transition-colors duration-200 font-medium"
                      >
                        View All
                      </button>
                    )}
                  </div>

                  {orders.length === 0 ? (
                    <div className="bg-white p-8 rounded-xl border border-gray-100 shadow-sm text-center">
                      <p className="text-gray-500">
                        You haven't placed any orders yet.
                      </p>
                      <a
                        href="/shop"
                        className="mt-3 inline-block text-sm font-medium text-black hover:text-gray-600 transition-colors duration-200"
                      >
                        Start shopping
                      </a>
                    </div>
                  ) : (
                    <div className="space-y-4 overflow-hidden">
                      {orders.slice(0, 3).map((order) => (
                        <div
                          key={order.id}
                          className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm transition-all duration-200 hover:shadow-md"
                        >
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="font-medium">
                                Order #{order.order_number}
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
                              <p className="font-semibold text-gray-800">
                                {formatCurrency(order.amount)}
                              </p>
                              <p
                                className={`text-xs font-medium capitalize px-3 py-1 rounded-full inline-block
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
                  <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center">
                      <div className="bg-black bg-opacity-5 p-2 rounded-full mr-3">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                        </svg>
                      </div>
                      <h2 className="text-lg font-medium text-gray-800">Recent Payments</h2>
                    </div>
                    {payments.length > 0 && (
                      <button
                        onClick={() => setActiveTab("payments")}
                        className="text-sm text-black hover:text-gray-600 transition-colors duration-200 font-medium"
                      >
                        View All
                      </button>
                    )}
                  </div>

                  {payments.length === 0 ? (
                    <div className="bg-white p-8 rounded-xl border border-gray-100 shadow-sm text-center">
                      <p className="text-gray-500">
                        No payment history available.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4 overflow-hidden">
                      {payments.slice(0, 3).map((payment) => (
                        <div
                          key={payment.id}
                          className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm transition-all duration-200 hover:shadow-md"
                        >
                          <div className="flex justify-between items-center">
                            <div className="text-left">
                              <p className="font-semibold text-gray-800 capitalize">
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
                              <p className="font-semibold text-gray-800">
                                {formatCurrency(payment.amount)}
                              </p>
                              <p
                                className={`text-xs font-medium capitalize px-3 py-1 rounded-full inline-block
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
                <h2 className="text-xl font-medium mb-6 text-gray-800">My Orders</h2>

                {orders.length === 0 ? (
                  <div className="bg-white p-8 rounded-xl border border-gray-100 shadow-sm text-center">
                    <p className="text-gray-500">
                      You haven't placed any orders yet.
                    </p>
                    <a
                      href="/shop"
                      className="mt-3 inline-block text-sm font-medium text-black hover:text-gray-600 transition-colors duration-200"
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
                          className="border border-gray-100 rounded-xl shadow-sm overflow-hidden transition-all duration-200 hover:shadow-md"
                        >
                          <div
                            className="bg-white p-5 flex justify-between items-center cursor-pointer transition-colors duration-200 hover:bg-gray-50"
                            onClick={() => toggleOrderExpand(order.id)}
                          >
                            <div>
                              <p className="font-medium">
                                Order #{order.order_number}
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
                                <p className="font-semibold text-gray-800">
                                  {formatCurrency(order.amount)}
                                </p>
                                <p
                                  className={`text-xs font-medium capitalize px-3 py-1 rounded-full inline-block
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
                                <ChevronUp className="h-5 w-5 text-black" />
                              ) : (
                                <ChevronDown className="h-5 w-5 text-black" />
                              )}
                            </div>
                          </div>

                          {isExpanded && (
                            <div className="p-6 border-t border-gray-100">
                              {/* Order Items */}
                              <div className="mb-8">
                                <h3 className="font-medium mb-4 text-gray-800 flex items-center">
                                  <div className="bg-black bg-opacity-5 p-1.5 rounded-full mr-2">
                                    <ShoppingBag className="h-4 w-4 text-black" />
                                  </div>
                                  Order Items
                                </h3>
                                <div className="bg-white rounded-xl overflow-hidden border border-gray-100 shadow-sm">
                                  <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
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
                                            
                                              {item.name}
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
                                <div className="mb-8">
                                  <h3 className="font-medium mb-4 text-gray-800 flex items-center">
                                    <div className="bg-black bg-opacity-5 p-1.5 rounded-full mr-2">
                                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                                      </svg>
                                    </div>
                                    Payment Information
                                  </h3>
                                  <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
                                    <div className="grid md:grid-cols-3 gap-4">
                                      <div>
                                        <p className="text-sm font-medium text-gray-400">
                                          Method
                                        </p>
                                        <p className="font-medium capitalize text-gray-800 mt-1">
                                          {payment.method}
                                        </p>
                                      </div>
                                      <div>
                                        <p className="text-sm font-medium text-gray-400">
                                          Amount
                                        </p>
                                        <p className="font-medium text-gray-800 mt-1">
                                          {formatCurrency(payment.amount)}
                                        </p>
                                      </div>
                                      <div>
                                        <p className="text-sm font-medium text-gray-400">
                                          Status
                                        </p>
                                        <p
                                          className={`text-xs font-medium capitalize mt-1 px-3 py-1 rounded-full inline-block
                                          ${
                                            payment.status === "completed"
                                              ? "bg-green-100 text-green-800"
                                              : payment.status === "pending"
                                              ? "bg-yellow-100 text-yellow-800"
                                              : payment.status === "cancelled"
                                              ? "bg-red-100 text-red-800"
                                              : "bg-gray-100 text-gray-800"
                                          }`}
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
                                  <h3 className="font-medium mb-4 text-gray-800 flex items-center">
                                    <div className="bg-black bg-opacity-5 p-1.5 rounded-full mr-2">
                                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                      </svg>
                                    </div>
                                    Shipping Address
                                  </h3>
                                  <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
                                    <div className="grid md:grid-cols-2 gap-6">
                                      <div>
                                        <p className="text-sm font-medium text-gray-400">
                                          Name
                                        </p>
                                        <p className="font-medium text-gray-800 mt-1">
                                          {address.first_name}{" "}
                                          {address.last_name}
                                        </p>
                                      </div>
                                      <div>
                                        <p className="text-sm font-medium text-gray-400">
                                          Contact
                                        </p>
                                        <p className="font-medium text-gray-800 mt-1">
                                          {address.email}
                                        </p>
                                        <p className="font-medium text-gray-800">
                                          {address.phone}
                                        </p>
                                      </div>
                                      <div className="md:col-span-2">
                                        <p className="text-sm font-medium text-gray-400">
                                          Address
                                        </p>
                                        <p className="font-medium text-gray-800 mt-1">
                                          {address.address}
                                          {address.apartment &&
                                            `, ${address.apartment}`}
                                        </p>
                                        <p className="font-medium text-gray-800">
                                          {address.city}, {address.state}{" "}
                                          {address.zip_code}
                                        </p>
                                        <p className="font-medium text-gray-800">
                                          {address.country}
                                        </p>
                                      </div>
                                      <div>
                                        <p className="text-sm font-medium text-gray-400">
                                          Shipping Method
                                        </p>
                                        <p className="font-medium text-gray-800 mt-1 capitalize">
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
                <h2 className="text-xl font-medium mb-6 text-gray-800 flex items-center">
                  <div className="bg-black bg-opacity-5 p-2 rounded-full mr-3">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                  </div>
                  Payment History
                </h2>

                {payments.length === 0 ? (
                  <div className="bg-white p-8 rounded-xl border border-gray-100 shadow-sm text-center">
                    <p className="text-gray-500">
                      No payment history available.
                    </p>
                  </div>
                ) : (
                  <div className="bg-white rounded-xl overflow-hidden border border-gray-100 shadow-sm">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
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
                              <div className="text-sm font-medium text-gray-800">
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
                              <div className="text-sm font-medium text-gray-800 capitalize">
                                {payment.method}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span
                                className={`px-3 py-1 inline-flex text-xs leading-5 font-medium rounded-full 
                                ${
                                  payment.status === "completed"
                                    ? "bg-green-100 text-green-800"
                                    : payment.status === "pending"
                                    ? "bg-yellow-100 text-yellow-800"
                                    : payment.status === "cancelled"
                                    ? "bg-red-100 text-red-800"
                                    : "bg-gray-100 text-gray-800"
                                }`}
                              >
                                {payment.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-gray-800">
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
                <h2 className="text-xl font-medium mb-6 text-gray-800 flex items-center">
                  <div className="bg-black bg-opacity-5 p-2 rounded-full mr-3">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  Shipping Addresses
                </h2>

                {isLoading ? (
                  <div className="flex justify-center p-8">
                    <div className="w-10 h-10 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                  </div>
                ) : (
                  <div className="grid gap-3">
                    {addresses
                      .filter(address => {
                        // Filter addresses by country
                        if (country === 'CA') {
                          // For Canada, show both Canada and US addresses
                          return address.country === 'CA' || address.country === 'US';
                        } else if (country === 'CO') {
                          // For Colombia, show only Colombia addresses
                          return address.country === 'CO';
                        }
                        // Default case - show all addresses
                        return true;
                      })
                      .map((address) => (
                      <div 
                        key={address.id} 
                        className="border rounded-xl p-4 transition-all hover:shadow-md border-gray-100 shadow-sm bg-white"
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center">
                              <p className="font-medium text-sm text-gray-800">
                                {address.first_name} {address.last_name}
                              </p>
                              {address.country === 'CA' && (
                                <span className="ml-2">
                                  <img src="/flags/Canada.svg.svg" alt="Canada" width={16} height={12} className="inline" />
                                </span>
                              )}
                              {address.country === 'CO' && (
                                <span className="ml-2">
                                  <img src="/flags/colombia.svg" alt="Colombia" width={16} height={12} className="inline" />
                                </span>
                              )}
                              {address.country === 'US' && (
                                <span className="ml-2">
                                  <img src="/flags/us.svg" alt="United States" width={16} height={12} className="inline" />
                                </span>
                              )}
                              {defaultAddressId === address.id && (
                                <span className="ml-2 bg-black bg-opacity-10 text-black text-xs px-3 py-0.5 rounded-full font-medium">
                                  Default
                                </span>
                              )}
                            </div>
                            <div className="mt-1">
                              <p className="text-gray-600 text-xs">{address.address}
                              {address.apartment && <span>, Unit: {address.apartment}</span>}</p>
                              <p className="text-gray-600 text-xs">
                                {address.city}, {address.state} {address.zip_code}
                              </p>
                            </div>
                            <div className="flex mt-1 text-xs text-gray-500">
                              <span className="mr-3">{address.email}</span>
                              <span>{address.phone}</span>
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            {defaultAddressId !== address.id && (
                              <button 
                                onClick={() => handleSetDefaultAddress(address.id)}
                                className="text-xs font-medium text-black hover:text-gray-600 transition-colors duration-200"
                              >
                                Set Default
                              </button>
                            )}
                            <button 
                              onClick={() => handleDeleteAddress(address.id)}
                              className="text-xs font-medium text-red-600 hover:text-red-800 transition-colors duration-200"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    <button
                      onClick={() => setShowAddressForm(true)}
                      className="w-full border-2 border-dashed border-gray-200 rounded-xl p-5 text-gray-600 hover:border-gray-400 hover:text-gray-800 transition-all duration-200 hover:shadow-sm bg-white"
                    >
                      + Add New Address
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Address Form Modal */}
      {showAddressForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-8 max-w-md w-full shadow-lg border border-gray-100">
            <h3 className="text-xl font-semibold mb-6 text-gray-800">Add New Address</h3>
            <form onSubmit={handleAddAddress} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="first_name" className="block text-sm font-medium text-gray-700 mb-1">
                    First Name
                  </label>
                  <input
                    id="first_name"
                    name="first_name"
                    value={newAddress.first_name}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400"
                  />
                </div>
                <div>
                  <label htmlFor="last_name" className="block text-sm font-medium text-gray-700 mb-1">
                    Last Name
                  </label>
                  <input
                    id="last_name"
                    name="last_name"
                    value={newAddress.last_name}
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
                  value={newAddress.email}
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
                  value={newAddress.phone}
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
                  value={newAddress.country}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400"
                >
                  <option value="CA">Canada</option>
                  <option value="US">United States</option>
                </select>
              </div>

              <div>
                <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
                  Street Address
                </label>
                <input
                  id="address"
                  name="address"
                  value={newAddress.address}
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
                  value={newAddress.apartment}
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
                    value={newAddress.city}
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
                    value={newAddress.state}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400"
                  />
                </div>
                <div>
                  <label htmlFor="zip_code" className="block text-sm font-medium text-gray-700 mb-1">
                    ZIP/Postal Code
                  </label>
                  <input
                    id="zip_code"
                    name="zip_code"
                    value={newAddress.zip_code}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 mt-6">
                <button
                  type="button"
                  onClick={() => setShowAddressForm(false)}
                  className="px-4 py-2.5 text-gray-500 hover:text-gray-700 font-medium transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2.5 bg-black text-white rounded-lg hover:bg-gray-800 transition-all duration-200 font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black"
                >
                  Save Address
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
