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
import { toast } from "react-hot-toast";
import { useForm } from "react-hook-form";
import { useCountry } from "@/contexts/CountryContext";
import { useTranslation } from "@/contexts/TranslationContext";
import { validateOrderStock, subtractProductStock } from '@/lib/stockUtils';

// Country list for international shipping
const countries = [
  { code: "CA", name: "Canada" },
  { code: "US", name: "United States" },
  { code: "CO", name: "Colombia" },
  // { code: "GB", name: "United Kingdom" },
  // { code: "AU", name: "Australia" },
  // { code: "DE", name: "Germany" },
  // { code: "FR", name: "France" },
  // { code: "JP", name: "Japan" },
  // { code: "BR", name: "Brazil" },
  // { code: "IN", name: "India" },
  // { code: "MX", name: "Mexico" },
  // Add more countries as needed
].sort((a, b) => a.name.localeCompare(b.name));

const COD_FEE = 5; // You can change to 10 if needed

// Shipping methods by country
const shippingMethods = {
  CA: [
    { id: "local_ca", name: "", description: "Fast shipping within the same city or nearby areas.", price: 8.00, estimatedDays: "1–2 business days" },
    { id: "national_ca", name: "", description: "Standard shipping across Canada via trusted couriers.", price: 15.00, estimatedDays: "2–5 business days" },
    { id: "cod_ca", name: "Cash on Delivery – Toronto & GTA", description: "Pay with cash when you receive your product. Available only in Toronto & GTA.", price: 10.00, estimatedDays: "1–2 business days", isCOD: true }
  ],
  CO: [
    { id: "local_co", name: "Local (1–2 días)", description: "Envíos rápidos dentro de la misma ciudad o región principal.", price: 8000, estimatedDays: "1–2 días hábiles" },
    { id: "national_co", name: "Nacional (2–5 días)", description: "Envíos a cualquier parte del país mediante transportadoras reconocidas.", price: 12000, estimatedDays: "2–5 días hábiles" },
    { id: "cod_co", name: "Contra Entrega", description: "Pago en efectivo al momento de recibir el producto (ciudades principales).", price: 15000, estimatedDays: "1–3 días hábiles", isCOD: true }
  ],
  US: [
    { id: "standard_us", name: "Standard", description: "Standard shipping across US.", price: 10.00, estimatedDays: "3-5 business days" },
    { id: "express_us", name: "Express", description: "Express shipping within US.", price: 20.00, estimatedDays: "1-2 business days" }
  ]
};

// Add this component at the top of the file, before the main Checkout component
function CartDisplay({ cart, updateQuantity, setQuantity, removeItem }) {
  return (
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
                    setQuantity(item.id, 1);
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
  );
}

export default function CheckoutPage() {
  const router = useRouter()
  const { country, getCountryData } = useCountry()
  const { language, t } = useTranslation()
  const countryData = getCountryData()
  const isColombiaSelected = country === 'CO'
  
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
    country: "CA",
  })
  const [shippingMethod, setShippingMethod] = useState(isColombiaSelected ? "local_co" : "local_ca")
  const [paymentMethod, setPaymentMethod] = useState("credit")
  const [isProcessing, setIsProcessing] = useState(false)
  const [isComplete, setIsComplete] = useState(false)
  const [activeTab, setActiveTab] = useState("credit")
  const [billingAddress, setBillingAddress] = useState("same")
  const [paymentStatus, setPaymentStatus] = useState("pending")
  const [order, setOrder] = useState(null)

  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [showAuthPrompt, setShowAuthPrompt] = useState(false)
  const setQuantity = useQuantityStore((state) => state.setQuantity)
  const [savedAddresses, setSavedAddresses] = useState([])
  const [selectedAddressId, setSelectedAddressId] = useState(null)
  const [showNewAddressForm, setShowNewAddressForm] = useState(false)
  const [billingInfo, setBillingInfo] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    country: "CA",
    address: "",
    apartment: "",
    city: "",
    state: "",
    zipCode: ""
  });
  // Add state to track if save address checkbox is checked
  const [shouldSaveAddress, setShouldSaveAddress] = useState(false);

  // Load cart from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedCart = JSON.parse(localStorage.getItem("cart")) || []
      setCart(storedCart)
    }
  }, [])

  // Check authentication status on mount
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setIsAuthenticated(!!session)
      if (!session) {
        setShowAuthPrompt(true)
      }
    }
    checkAuth()

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN') {
        setIsAuthenticated(true)
        setShowAuthPrompt(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (isAuthenticated) {
      fetchSavedAddresses()
    }
  }, [isAuthenticated])

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
      existing.zip_code === address.zipCode &&
      existing.country === address.country
    )
  }

  const fetchSavedAddresses = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        console.log('No active session')
        return
      }

      const { data, error } = await supabase
        .from('shipping_addresses')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching addresses:', error.message)
        toast.error('Failed to load saved addresses')
        return
      }

      // Filter out duplicate addresses
      const uniqueAddresses = data.reduce((acc, current) => {
        if (!isDuplicateAddress(current, acc)) {
          acc.push(current)
        }
        return acc
      }, [])
      
      // Don't filter addresses here - we'll filter them directly in the render
      // Just log for debugging purposes
      console.log('All available addresses:', uniqueAddresses);
      console.log('Current selected country:', country);
      
      // Save all addresses and let the render filter them
      setSavedAddresses(uniqueAddresses);
      // Use the most recent address as default
      if (uniqueAddresses.length > 0) {
        const mostRecentAddress = uniqueAddresses[0]
        setSelectedAddressId(mostRecentAddress.id)
        setShippingInfo({
          firstName: mostRecentAddress.first_name,
          lastName: mostRecentAddress.last_name,
          email: mostRecentAddress.email,
          phone: mostRecentAddress.phone,
          address: mostRecentAddress.address,
          apartment: mostRecentAddress.apartment || '',
          city: mostRecentAddress.city,
          state: mostRecentAddress.state,
          zipCode: mostRecentAddress.zip_code,
          country: mostRecentAddress.country
        })
      }
    } catch (error) {
      console.error('Error in fetchSavedAddresses:', error)
      toast.error('Failed to load saved addresses')
    }
  }

  const handleAddressSelect = (address) => {
    setSelectedAddressId(address.id)
    setShippingInfo({
      firstName: address.first_name,
      lastName: address.last_name,
      email: address.email,
      phone: address.phone,
      address: address.address,
      apartment: address.apartment || '',
      city: address.city,
      state: address.state,
      zipCode: address.zip_code,
      country: address.country
    })
  }

  const handleSaveAddress = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Check if this address already exists
      const existingAddress = savedAddresses.find(addr => 
        addr.address === shippingInfo.address &&
        addr.apartment === shippingInfo.apartment &&
        addr.city === shippingInfo.city &&
        addr.state === shippingInfo.state &&
        addr.zip_code === shippingInfo.zipCode &&
        addr.country === shippingInfo.country
      )

      if (existingAddress) {
        toast.error('This address already exists')
        return
      }

      const { data, error } = await supabase
        .from('shipping_addresses')
        .insert([{
          user_id: user.id,
          first_name: shippingInfo.firstName,
          last_name: shippingInfo.lastName,
          email: shippingInfo.email,
          phone: shippingInfo.phone,
          address: shippingInfo.address,
          apartment: shippingInfo.apartment,
          city: shippingInfo.city,
          state: shippingInfo.state,
          zip_code: shippingInfo.zipCode,
          country: shippingInfo.country,
          created_at: new Date().toISOString(),
        }])
        .select()
        .single()

      if (error) throw error

      setSavedAddresses(prev => [...prev, data])
      setSelectedAddressId(data.id)
      toast.success('Address saved successfully')
    } catch (error) {
      console.error('Error saving address:', error)
      toast.error('Failed to save address')
    }
  }

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
  
  // Get the selected shipping method details
  const selectedShippingMethod = (shippingMethods[country] || shippingMethods.CA)
    .find(method => method.id === shippingMethod);

  // Calculate shipping cost and COD fee based on the selected method
  const shipping = selectedShippingMethod?.isCOD ? 0 : selectedShippingMethod?.price || 0
  const taxes = subtotal * 0.08 // Example tax calculation (8%)
  const isCOD = selectedShippingMethod?.isCOD || false;
  const codFee = isCOD ? selectedShippingMethod?.price || COD_FEE : 0;
  const total = subtotal + shipping + taxes + codFee

  const handleShippingSubmit = (e) => {
    e.preventDefault()
    setActiveStep("payment")
  }

  const handlePaymentSubmit = async (e) => {
    e.preventDefault()
    
    // Check if user is authenticated
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError || !session) {
      // Show a modal or redirect to login with return URL
      const returnUrl = encodeURIComponent(window.location.href)
      window.location.href = `/login?returnUrl=${returnUrl}`
      return
    }
    
    if (paymentMethod === 'credit') {
      setIsProcessing(true)
      try {
        // Create order first
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError) {
          throw new Error(`Authentication error: ${authError.message}`)
        }
        if (!user) {
          throw new Error("User not authenticated")
        }

        // Get only the shipping method name to store in the order
        const availableMethods = shippingMethods[shippingInfo.country] || shippingMethods.CA;
        const selectedMethod = availableMethods.find(method => method.id === shippingMethod);
        const shippingMethodName = selectedMethod ? selectedMethod.name : null;
        
        // Create order with enhanced shipping method info
        const { data: order, error: orderError } = await supabase
          .from("orders")
          .insert([{
            user_id: user.id,
            amount: total,
            shipping_method: shippingMethodName,
           
            status: "pending", // Will be updated by webhook
            created_at: new Date().toISOString(),
            shipping_info: shippingInfo
          }])
          .select('id, order_number')
          .single()

        if (orderError) {
          console.error("Order creation error:", orderError)
          throw new Error(`Order creation failed: ${orderError.message}`)
        }

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

        // Create shipping address (and potentially billing if same)
        const addressType = billingAddress === "same" ? "both" : "shipping";
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
              phone: shippingInfo.phone,
              address_type: addressType,
              created_at: new Date().toISOString(),
            },
          ]);

        if (shippingError) {
          console.error("Shipping address creation error:", shippingError)
          throw new Error(`Shipping address creation failed: ${shippingError.message}`)
        }
        
        // Create billing address if different from shipping
        if (billingAddress === "different") {
          const { error: billingError } = await supabase
            .from("shipping_addresses")
            .insert([
              {
                order_id: order.id,
                user_id: user.id,
                address: billingInfo.address,
                apartment: billingInfo.apartment,
                city: billingInfo.city,
                state: billingInfo.state,
                zip_code: billingInfo.zipCode,
                country: billingInfo.country,
                first_name: billingInfo.firstName,
                last_name: billingInfo.lastName,
                email: billingInfo.email,
                phone: billingInfo.phone,
                address_type: "billing",
                created_at: new Date().toISOString(),
              },
            ]);

          if (billingError) {
            console.error("Billing address creation error:", billingError)
            throw new Error(`Billing address creation failed: ${billingError.message}`)
          }
        }

        // Now create Stripe checkout session
        const responseStripe = await fetch('/api/checkout_sessions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`
          },
          body: JSON.stringify({
            cart,
            shippingInfo,
            total,
            shippingMethod,
            orderId: order.id, // Pass the order ID to the checkout session
          }),
        })

        if (!responseStripe.ok) {
          const errorStripe = await responseStripe.json()
          throw new Error(errorStripe.error || 'Failed to create checkout session')
        }

        const { url } = await responseStripe.json()
        if (url) {
          window.location.href = url
        } else {
          throw new Error('No redirect URL received')
        }
      } catch (error) {
        console.error('Checkout error:', error)
        alert(error.message || 'Error processing your payment. Please try again.')
        setIsProcessing(false)
      }
      return
    }
    
    // Handle COD payment
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

      // Validate stock before creating order
      const orderItems = cart.map(item => ({
        product_id: item.id,
        quantity: item.quantity
      }))

      const { error: stockValidationError, insufficientStock, items: insufficientItems } = await validateOrderStock(orderItems)
      
      if (stockValidationError) {
        throw new Error('Error validating stock')
      }

      if (insufficientStock) {
        const itemMessages = insufficientItems.map(item => {
          const cartItem = cart.find(i => i.id === item.product_id)
          return `${cartItem.name}: Only ${item.available} units available`
        }).join(', ')
        throw new Error(`Some items are out of stock: ${itemMessages}`)
      }

      // Helper function to get shipping method name only
      const getShippingMethodName = (countryCode, methodId) => {
        const methods = shippingMethods[countryCode] || shippingMethods.CA;
        const method = methods.find(m => m.id === methodId);
        return method ? method.name : null;
      };
      
      // Get shipping method name for the order
      const shippingMethodName = getShippingMethodName(shippingInfo.country, shippingMethod);
      
      // Create order with pending status for COD
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert([{
          user_id: user.id,
          amount: total,
          shipping_method: shippingMethodName,
          status: "pending", // COD orders start as pending
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

      // Create order items and update stock
      const orderItemsData = cart.map(item => ({
        order_id: order.id,
        product_id: item.id,
        quantity: item.quantity,
        price: item.price,
        name: item.name,
        image: item.image
      }))

      const { error: orderItemsError } = await supabase
        .from("order_items")
        .insert(orderItemsData)

      if (orderItemsError) throw orderItemsError;

      // Update stock for each item (COD orders update stock immediately)
      for (const item of cart) {
        const { error: stockError, insufficientStock } = await subtractProductStock(item.id, item.quantity)
        if (stockError) throw stockError
        if (insufficientStock) {
          throw new Error(`Insufficient stock for product: ${item.name}`)
        }
      }

      // Create payment record for COD
      const { error: paymentError } = await supabase
        .from("payments")
        .insert([{
          order_id: order.id,
          user_id: user.id,
          amount: total,
          method: "cod",
          status: "pending", // COD payments start as pending
          created_at: new Date().toISOString()
        }])

      if (paymentError) throw paymentError;

      // Create shipping address (and potentially billing if same)
      const addressType = billingAddress === "same" ? "both" : "shipping";
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
            phone: shippingInfo.phone,
            address_type: addressType,
            shipping_method: shippingMethodName,
            created_at: new Date().toISOString(),
          },
        ]);

      if (shippingError) throw shippingError;
      
      if (billingAddress === "different") {
        const billingShippingMethodName = getShippingMethodName(billingInfo.country, shippingMethod);
        const { error: billingError } = await supabase
          .from("shipping_addresses")
          .insert([
            {
              order_id: order.id,
              user_id: user.id,
              address: billingInfo.address,
              apartment: billingInfo.apartment,
              city: billingInfo.city,
              state: billingInfo.state,
              zip_code: billingInfo.zipCode,
              country: billingInfo.country,
              first_name: billingInfo.firstName,
              last_name: billingInfo.lastName,
              email: billingInfo.email,
              phone: billingInfo.phone,
              address_type: "billing",
              shipping_method: billingShippingMethodName,
              created_at: new Date().toISOString(),
            },
          ]);

        if (billingError) throw billingError;
      }

      // Send email notifications
      // Use the existing email templates for both customer and admin
      const customerEmail = shippingInfo.email;
      const customerEmailData = {
        type: 'customer',
        firstName: shippingInfo.firstName,
        shippingInfo,
        orderDetails: {
          orderId: `#${order.order_number}`,
          amount: total,
          shippingMethod,
          paymentMethod: "Cash on Delivery",
          items: cart.map(item => ({
            name: item.name,
            quantity: item.quantity,
            price: item.price
          }))
        }
      };

      const adminEmail = 'gojosearias@gmail.com';
      const adminEmailData = {
        type: 'admin',
        firstName: 'Admin',
        shippingInfo,
        orderDetails: {
          orderId: `#${order.order_number}`,
          amount: total,
          shippingMethod,
          paymentMethod: "Cash on Delivery",
          items: cart.map(item => ({
            name: item.name,
            quantity: item.quantity,
            price: item.price
          }))
        }
      };

      // Send emails using server-side API route
      try {
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

        if (!response.ok) {
          console.error("Failed to send emails via API");
        }
      } catch (emailError) {
        console.error("Email sending error:", emailError);
        console.warn("Emails failed to send, but order will still be processed");
      }

      // Clear cart after successful order
      syncCart([])
      setIsProcessing(false)
      setIsComplete(true)
      setActiveStep("confirmation")

    } catch (error) {
      console.error("Error processing order:", error)
      toast.error(`Error processing your order: ${error.message}. Please try again.`)
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

  const handleBillingInputChange = (e) => {
    const { name, value } = e.target;
    // Convert billingFirstName to firstName, etc.
    const fieldName = name.replace(/^billing/, '').charAt(0).toLowerCase() + name.replace(/^billing/, '').slice(1);
    setBillingInfo(prev => ({
      ...prev,
      [fieldName]: value
    }));
  };

  // Add effect to check if selected shipping method is COD
  useEffect(() => {
    const selectedShippingMethod = (shippingMethods[country] || shippingMethods.CA)
      .find(method => method.id === shippingMethod);
    
    if (selectedShippingMethod?.isCOD) {
      setActiveTab('cod');
      setPaymentMethod('cod');
    } else if (activeTab === 'cod') {
      setActiveTab('credit');
      setPaymentMethod('credit');
    }
  }, [shippingMethod, country]);

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
          <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
            {/* Country-specific message */}
            <div className={`mb-4 p-3 rounded-md ${isColombiaSelected ? 'bg-yellow-50 border border-yellow-200' : 'bg-blue-50 border border-blue-200'}`}>
              {isColombiaSelected ? (
                <p className="text-sm font-medium flex items-center">
                  <Image src="/flags/colombia.svg" alt="Colombia Flag" width={24} height={18} className="mr-2" />
                  Estás comprando en Colombia. Los precios están en pesos colombianos (COP).
                </p>
              ) : (
                <p className="text-sm font-medium flex items-center">
                  <Image src="/flags/Canada.svg.svg" alt="Canada Flag" width={24} height={18} className="mr-2" />
                  You are buying in Canada. Prices are in Canadian dollars (CAD).
                </p>
              )}
            </div>

            {/* Shipping Information */}
            <h2 className="text-xl font-semibold mb-4">
              {isColombiaSelected ? 'Información de Envío' : 'Shipping Information'}
            </h2>

            {/* Address Selection Section */}
            <div className="mb-6">
              {isAuthenticated && savedAddresses.length > 0 && !showNewAddressForm ? (
                <>
                  <h3 className="font-medium mb-3">{isColombiaSelected ? 'Direcciones Guardadas' : 'Saved Addresses'}</h3>
                  <div className="grid gap-2">
                    {/* Create a filtered list first to ensure uniqueness when displaying */}
                    {savedAddresses
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
                      // Remove any remaining duplicates that might appear due to cross-country filtering
                      .reduce((uniqueAddresses, address) => {
                        // Check if this address (ignoring the country) is already in our list
                        const isDuplicate = uniqueAddresses.some(a => 
                          a.first_name === address.first_name &&
                          a.last_name === address.last_name &&
                          a.address === address.address &&
                          a.apartment === address.apartment &&
                          a.city === address.city &&
                          a.state === address.state &&
                          a.zip_code === address.zip_code
                        );
                        
                        if (!isDuplicate) {
                          uniqueAddresses.push(address);
                        }
                        return uniqueAddresses;
                      }, [])
                      .map((address) => (
                      <div
                        key={address.id}
                        className={`border rounded-lg p-3 cursor-pointer transition-all hover:shadow-sm ${
                          selectedAddressId === address.id ? 'border-blue-500 bg-blue-50 shadow-sm' : 'border-gray-200'
                        }`}
                        onClick={() => handleAddressSelect(address)}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center">
                              <p className="font-medium text-sm">
                                {address.first_name} {address.last_name}
                              </p>
                              {address.country === 'CA' && (
                                <span className="ml-2">
                                  <Image src="/flags/Canada.svg.svg" alt="Canada" width={16} height={12} className="inline" />
                                </span>
                              )}
                              {address.country === 'CO' && (
                                <span className="ml-2">
                                  <Image src="/flags/colombia.svg" alt="Colombia" width={16} height={12} className="inline" />
                                </span>
                              )}
                            </div>
                            <div className="mt-1">
                              <p className="text-gray-600 text-xs">{address.address}
                              {address.apartment && <span>, {isColombiaSelected ? 'Unidad' : 'Unit'}: {address.apartment}</span>}</p>
                              <p className="text-gray-600 text-xs">
                                {address.city}, {address.state} {address.zip_code}
                              </p>
                            </div>
                            <div className="flex mt-1 text-xs text-gray-500">
                              <span className="mr-3">{address.email}</span>
                              <span>{address.phone}</span>
                            </div>
                          </div>
                          <div className="ml-2">
                            <input
                              type="radio"
                              checked={selectedAddressId === address.id}
                              onChange={() => handleAddressSelect(address)}
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <button
                    onClick={() => setShowNewAddressForm(true)}
                    className="mt-4 text-blue-600 hover:text-blue-800"
                  >
                    {isColombiaSelected ? '+ Añadir Nueva Dirección' : '+ Add New Address'}
                  </button>
                </>
              ) : (
                <form onSubmit={handleSaveAddress} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
                        {isColombiaSelected ? 'Nombre' : 'First Name'}
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
                        {isColombiaSelected ? 'Apellido' : 'Last Name'}
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
                      {isColombiaSelected ? 'Correo Electrónico' : 'Email'}
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
                      {isColombiaSelected ? 'Número de Teléfono' : 'Phone Number'}
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
                      {isColombiaSelected ? 'País/Región' : 'Country/Region'}
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
                      {isColombiaSelected ? 'Dirección' : 'Street Address'}
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
                      {isColombiaSelected ? 'Apartamento, suite, etc. (opcional)' : 'Apartment, suite, etc. (optional)'}
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
                        {isColombiaSelected ? 'Ciudad' : 'City'}
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
                        {isColombiaSelected ? 'Departamento' : 'State/Province'}
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
                        {isColombiaSelected ? 'Código Postal' : 'ZIP/Postal Code'}
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
                </form>
              )}
            </div>

            {/* Billing Address Section - Always visible */}
            <div className="border-t pt-6">
              <h3 className="font-medium mb-4">{isColombiaSelected ? 'Dirección de Facturación' : 'Billing Address'}</h3>
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
                    {isColombiaSelected ? 'Misma que la dirección de envío' : 'Same as shipping address'}
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
                    {isColombiaSelected ? 'Usar una dirección de facturación diferente' : 'Use a different billing address'}
                  </label>
                </div>

                {billingAddress === "different" && (
                  <div className="mt-4 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="billingFirstName" className="block text-sm font-medium text-gray-700 mb-1">
                          First Name
                        </label>
                        <input
                          id="billingFirstName"
                          name="billingFirstName"
                          value={billingInfo.firstName}
                          onChange={handleBillingInputChange}
                          required
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400"
                        />
                      </div>
                      <div>
                        <label htmlFor="billingLastName" className="block text-sm font-medium text-gray-700 mb-1">
                          Last Name
                        </label>
                        <input
                          id="billingLastName"
                          name="billingLastName"
                          value={billingInfo.lastName}
                          onChange={handleBillingInputChange}
                          required
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400"
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="billingEmail" className="block text-sm font-medium text-gray-700 mb-1">
                        Email
                      </label>
                      <input
                        id="billingEmail"
                        name="billingEmail"
                        type="email"
                        value={billingInfo.email}
                        onChange={handleBillingInputChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400"
                      />
                    </div>

                    <div>
                      <label htmlFor="billingPhone" className="block text-sm font-medium text-gray-700 mb-1">
                        Phone Number
                      </label>
                      <input
                        id="billingPhone"
                        name="billingPhone"
                        type="tel"
                        value={billingInfo.phone}
                        onChange={handleBillingInputChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400"
                      />
                    </div>

                    <div>
                      <label htmlFor="billingCountry" className="block text-sm font-medium text-gray-700 mb-1">
                        Country/Region
                      </label>
                      <select
                        id="billingCountry"
                        name="billingCountry"
                        value={billingInfo.country}
                        onChange={handleBillingInputChange}
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
                      <label htmlFor="billingAddress" className="block text-sm font-medium text-gray-700 mb-1">
                        Street Address
                      </label>
                      <input
                        id="billingAddress"
                        name="billingAddress"
                        value={billingInfo.address}
                        onChange={handleBillingInputChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400"
                      />
                    </div>

                    <div>
                      <label htmlFor="billingApartment" className="block text-sm font-medium text-gray-700 mb-1">
                        Apartment, suite, etc. (optional)
                      </label>
                      <input
                        id="billingApartment"
                        name="billingApartment"
                        value={billingInfo.apartment}
                        onChange={handleBillingInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label htmlFor="billingCity" className="block text-sm font-medium text-gray-700 mb-1">
                          City
                        </label>
                        <input
                          id="billingCity"
                          name="billingCity"
                          value={billingInfo.city}
                          onChange={handleBillingInputChange}
                          required
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400"
                        />
                      </div>
                      <div>
                        <label htmlFor="billingState" className="block text-sm font-medium text-gray-700 mb-1">
                          State/Province
                        </label>
                        <input
                          id="billingState"
                          name="billingState"
                          value={billingInfo.state}
                          onChange={handleBillingInputChange}
                          required
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400"
                        />
                      </div>
                      <div>
                        <label htmlFor="billingZipCode" className="block text-sm font-medium text-gray-700 mb-1">
                          ZIP/Postal Code
                        </label>
                        <input
                          id="billingZipCode"
                          name="billingZipCode"
                          value={billingInfo.zipCode}
                          onChange={handleBillingInputChange}
                          required
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Continue Button - Always visible */}
            <div className="flex justify-end mt-6">
              <button
                type="button"
                onClick={handleShippingSubmit}
                className="bg-black text-white px-6 py-2 rounded-md hover:bg-gray-800 transition-colors"
                disabled={isProcessing}
              >
                {isProcessing ? 'Processing...' : isColombiaSelected ? 'Continuar al Pago' : 'Continue to Payment'}
              </button>
            </div>
          </div>
        )

      case "payment":
        return (
          <div className="space-y-6">
            {/* Shipping Method Selection */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">
                {isColombiaSelected ? 'Método de Envío' : 'Shipping Method'}
              </h2>
              <div className="space-y-3">
                {(shippingMethods[country] || shippingMethods.CA).map((method) => (
                  <div key={method.id} 
                    className={`flex items-center justify-between border p-4 rounded-md ${
                      shippingMethod === method.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                    }`}
                  >
                    <div className="flex items-start space-x-2">
                      <input
                        type="radio"
                        id={method.id}
                        name="shippingMethod"
                        value={method.id}
                        checked={shippingMethod === method.id}
                        onChange={() => setShippingMethod(method.id)}
                        className="h-4 w-4 mt-1 text-blue-500 focus:ring-blue-500 border-gray-300"
                      />
                      <div>
                        <label htmlFor={method.id} className="font-medium cursor-pointer block">
                          {method.name || `${method.estimatedDays}`}
                        </label>
                        <p className="text-sm text-gray-600 mt-1">{method.description}</p>
                      </div>
                    </div>
                    <span className="font-medium">
                      {country === 'CO' 
                        ? `$${method.price.toLocaleString('es-CO')}`
                        : `$${method.price.toFixed(2)}`}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Payment Method Selection */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">
                {isColombiaSelected ? 'Método de Pago' : 'Payment Method'}
              </h2>
              <div className="space-y-4">
                {/* Credit Card Option */}
                <div className={`p-4 border rounded-lg ${
                  activeTab === "credit" ? "border-blue-500" : "border-gray-200"
                } ${
                  shippingMethod.includes('cod_') ? "opacity-50 pointer-events-none" : ""
                }`}>
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="credit"
                      checked={activeTab === "credit"}
                      onChange={(e) => {
                        setActiveTab(e.target.value);
                        setPaymentMethod(e.target.value);
                      }}
                      disabled={shippingMethod.includes('cod_')}
                      className="form-radio text-blue-500"
                    />
                    <span className="flex items-center space-x-2">
                      <CreditCard className="h-5 w-5 text-gray-400" />
                      <span className="font-medium">
                        {isColombiaSelected ? 'Pagar con Tarjeta de Crédito' : 'Pay with Credit Card'}
                      </span>
                      {country === 'CO' && (
                        <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full font-medium ml-2">PayU</span>
                      )}
                      {country === 'CA' && (
                        <span className="text-xs bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full font-medium ml-2">Stripe</span>
                      )}
                    </span>
                  </label>
                  {activeTab === "credit" && !shippingMethod.includes('cod_') && (
                    <>
                      {country === 'CO' ? (
                        <div className="mt-4">
                          <button
                            className="w-full bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-md transition-colors disabled:bg-gray-400"
                            onClick={(e) => {
                              e.preventDefault();
                              toast.success('PayU integration will be added soon!');
                            }}
                          >
                            Pagar con PayU
                          </button>
                          <p className="text-xs text-gray-500 mt-2 text-center">El servicio de pago con PayU estará disponible pronto</p>
                        </div>
                      ) : (
                        <button
                          onClick={handlePaymentSubmit}
                          disabled={isProcessing}
                          className="mt-4 w-full bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md transition-colors disabled:bg-gray-400"
                        >
                          {isProcessing ? "Processing..." : 'Pay with Stripe'}
                        </button>
                      )}
                    </>
                  )}
                </div>

                {/* COD Option */}
                <div className={`p-4 border rounded-lg ${
                  activeTab === "cod" ? "border-blue-500" : "border-gray-200"
                } ${
                  !shippingMethod.includes('cod_') ? "opacity-50 pointer-events-none" : ""
                }`}>
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="cod"
                      checked={activeTab === "cod"}
                      onChange={(e) => {
                        setActiveTab(e.target.value);
                        setPaymentMethod(e.target.value);
                      }}
                      disabled={!shippingMethod.includes('cod_')}
                      className="form-radio text-blue-500"
                    />
                    <span className="flex items-center space-x-2">
                      <Package className="h-5 w-5 text-gray-400" />
                      <span className="font-medium">
                        {isColombiaSelected ? 'Pago Contra Entrega' : 'Cash on Delivery (COD)'}
                      </span>
                    </span>
                  </label>
                  {activeTab === "cod" && shippingMethod.includes('cod_') && (
                    <div className="mt-4 space-y-4">
                      <p className="text-sm text-gray-600">
                        {isColombiaSelected
                          ? `Pague en efectivo cuando reciba su pedido. Se agregará una tarifa de $${COD_FEE.toLocaleString('es-CO')} a su pedido.`
                          : `Pay in cash when your order is delivered. A fee of $${COD_FEE.toFixed(2)} will be added to your order.`}
                      </p>
                      <button
                        onClick={handlePaymentSubmit}
                        disabled={isProcessing}
                        className="w-full bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 transition-colors disabled:bg-gray-400"
                      >
                        {isProcessing 
                          ? isColombiaSelected ? "Procesando..." : "Processing..." 
                          : isColombiaSelected ? "Realizar Pedido (Pagar Después)" : "Place Order (Pay Later)"}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="container mx-auto px-4 py-12">
      {showAuthPrompt ? (
        <div className="min-h-[80vh] flex items-center justify-center px-4">
          <div className="max-w-md w-full bg-white p-8 rounded-xl shadow-lg border border-gray-100">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <ShoppingBag className="h-8 w-8 text-indigo-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome to Checkout</h2>
              <p className="text-gray-600">
                Sign in to get a better shopping experience
              </p>
            </div>

            <div className="space-y-4">
              <Link
                href="/login"
                className="block w-full px-4 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors font-medium text-sm flex items-center justify-center gap-2"
                onClick={() => setShowAuthPrompt(false)}
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M15 3H19C19.5304 3 20.0391 3.21071 20.4142 3.58579C20.7893 3.96086 21 4.46957 21 5V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M10 17L15 12L10 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M15 12H3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Sign In to Your Account
              </Link>
              <button
                onClick={() => setShowAuthPrompt(false)}
                className="block w-full px-4 py-3 text-gray-700 hover:text-gray-900 transition-colors font-medium text-sm flex items-center justify-center gap-2 border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M12 16V12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M12 8H12.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Continue as Guest
              </button>
            </div>

            <div className="mt-8 pt-6 border-t border-gray-100">
              <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M12 16V12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M12 8H12.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span>Your cart items will be saved</span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <>
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
                    <h2 className="text-xl font-bold mb-4">Order Summary</h2>                      <div className="space-y-2 mb-4">
                        <div className="flex justify-between">
                          <span>Subtotal</span>
                          <span>
                            {country === 'CO' 
                              ? `$${subtotal.toLocaleString('es-CO')}`
                              : `$${subtotal.toFixed(2)}`}
                          </span>
                        </div>
                        
                        {!isCOD && selectedShippingMethod && (
                          <div className="flex justify-between">
                            <span>
                              {isColombiaSelected ? 'Envío' : 'Shipping'} ({selectedShippingMethod.estimatedDays})
                            </span>
                            <span>
                              {country === 'CO'
                                ? `$${selectedShippingMethod.price.toLocaleString('es-CO')}`
                                : `$${selectedShippingMethod.price.toFixed(2)}`}
                            </span>
                          </div>
                        )}
                        
                        {isCOD && selectedShippingMethod && (
                          <div className="flex justify-between">
                            <span>
                              {isColombiaSelected ? 'Tarifa Contra Entrega' : 'Cash on Delivery Fee'} ({selectedShippingMethod.estimatedDays})
                            </span>
                            <span>
                              {country === 'CO'
                                ? `$${selectedShippingMethod.price.toLocaleString('es-CO')}`
                                : `$${selectedShippingMethod.price.toFixed(2)}`}
                            </span>
                          </div>
                        )}
                        
                        <div className="flex justify-between">
                          <span>{isColombiaSelected ? 'Impuestos' : 'Taxes'}</span>
                          <span>
                            {country === 'CO'
                              ? `$${taxes.toLocaleString('es-CO')}`
                              : `$${taxes.toFixed(2)}`}
                          </span>
                        </div>
                        
                        <div className="border-t pt-2 mt-2 flex justify-between font-bold">
                          <span>Total</span>
                          <span>
                            {country === 'CO'
                              ? `$${total.toLocaleString('es-CO')}`
                              : `$${total.toFixed(2)}`}
                          </span>
                        </div>
                      </div>

                    {activeStep === "shipping" && (
                      <CartDisplay 
                        cart={cart}
                        updateQuantity={updateQuantity}
                        setQuantity={setQuantity}
                        removeItem={removeItem}
                      />
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
