'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

// Translations for English and Spanish
const translations = {
  en: {
    // Navigation
    store: "The Quick Shop",
    cart: "Cart",
    admin: "Admin",
    settings: "Settings",
    signIn: "Sign In",
    signOut: "Sign Out",
    hey: "Hey!",
    
    // Common actions
    addToCart: "Add",
    checkout: "Checkout",
    buy: "Buy Now",
    
    // Product related
    price: "Price",
    quantity: "Quantity",
    description: "Description",
    details: "Details",
    reviews: "Reviews",
    inStock: "In Stock",
    lowStock: "Low Units",
    unitsLeft: "units left",
    outOfStock: "Out of Stock",
    unit: "unit",
    units: "units",
    
    // Product filters and categories
    allCategories: "All Categories",
    searchProducts: "Search products...",
    viewAllProducts: "View all products",
    featuredProducts: "Featured Products",
    
    // Home page sections
    newCollection: "New Collection 2025",
    discoverProducts: "Discover Exceptional Products",
    curatedSelection: "Curated selection of premium items designed to elevate your everyday experience",
    exploreCollection: "Explore Collection",
    
    // Benefits section
    premiumQuality: "Premium Quality",
    premiumDescription: "All our products are made with the highest quality materials and craftsmanship to ensure lasting satisfaction.",
    freeShipping: "Free Shipping",
    shippingDescription: "Enjoy free shipping on all orders over $100 within the continental US with fast and reliable delivery.",
    returns: "30-Day Returns",
    returnsDescription: "Not satisfied? Return any item within 30 days for a full refund, no questions asked.",
    
    // Newsletter section
    joinNewsletter: "Join Our Newsletter",
    newsletterDescription: "Subscribe to get special offers, free giveaways, and once-in-a-lifetime deals delivered to your inbox.",
    nameOptional: "Name (optional)",
    emailAddress: "Email address",
    subscribe: "Subscribe",
    submitting: "Submitting...",
    subscribeSuccess: "You've been subscribed successfully!",
    subscribeError: "There was an error. Please try again.",
    
    // Authentication
    login: "Login",
    register: "Register",
    forgotPassword: "Forgot Password",
    email: "Email",
    password: "Password",
    
    // Checkout and Product Details
    orderSummary: "Order Summary",
    subtotal: "Subtotal",
    shipping: "Shipping",
    tax: "Tax",
    total: "Total",
    paymentMethod: "Payment Method",
    shippingAddress: "Shipping Address",
    freeShippingMessage: "Free standard shipping on orders over $100",
    easyReturns: "Easy Returns",
    easyReturnsMessage: "30-day return policy",
    secureCheckout: "Secure Checkout",
    secureCheckoutMessage: "SSL encrypted checkout",
    processingOrder: "Processing...",
    checkoutWelcome: "Welcome to Checkout",
    signInBetterExp: "Sign in to get a better shopping experience",
    signInToAccount: "Sign In to Your Account",
    continueAsGuest: "Continue as Guest",
    cartSaved: "Your cart items will be saved",
    cartEmpty: "Your cart is empty",
    browseProducts: "Browse Products",
    shippingInfo: "Shipping Information",
    savedAddresses: "Saved Addresses",
    addNewAddress: "+ Add New Address",
    billingAddress: "Billing Address",
    sameAsShipping: "Same as shipping address",
    differentBilling: "Use a different billing address",
    continueToPay: "Continue to Payment",
    shippingMethod: "Shipping Method",
    placeOrder: "Place Order",
    placeOrderLater: "Place Order (Pay Later)",
    payWithCard: "Pay with Credit Card",
    orderConfirmed: "Order Confirmed!",
    orderPendingCOD: "Order Pending (COD)",
    orderConfirmationMessage: "Thank you for your purchase. We've sent a confirmation email to {email}.",
    codConfirmationMessage: "Your order is pending. Please pay the delivery person in cash or e-transfer. Our staff will confirm your payment soon.",
    orderNumber: "Order #",
    payUComingSoon: "PayU payment service will be available soon",
    orderSummary: "Order Summary",
    subtotal: "Subtotal",
    shipping: "Shipping",
    taxes: "Taxes",
    codFee: "Cash on Delivery Fee",
    yourCart: "Your Cart",
    
    // Success page
    thankYou: "Thank you for your order!",
    orderReceived: "Your order has been received",
    continueShopping: "Continue Shopping",
    
    // Layout
    tagline: "Shop Quick, Ship Quicker",
    allRightsReserved: "All rights reserved",
    developedBy: "Developed by",
    terms: "Terms",
    privacy: "Privacy",
    contact: "Contact",
    hours: "Hours",
    monday: "Monday - Friday",
    saturday: "Saturday",
    sunday: "Sunday",
    closed: "Closed",
    
    // Footer
    // ...existing footer translations...
    
    // WhatsApp
    whatsappStatus: "Typically replies within 2 minutes",
    
    // Cart
    removeUnavailableItems: "Please remove unavailable items from cart",
    
    // Email Template
    yourItems: "YOUR ITEMS",
    totalAmount: "TOTAL AMOUNT",
    shippingInfo: "SHIPPING INFORMATION",
    shippingMethod: "SHIPPING METHOD",
    quantity: "Quantity",
    orderShipNotification: "We'll notify you when your order ships",
    viewInDashboard: "View in dashboard →"
  },
  es: {
    // Navigation
    store: "La Tienda Rápida",
    cart: "Carrito",
    admin: "Administrador",
    settings: "Configuración",
    signIn: "Iniciar Sesión",
    signOut: "Cerrar Sesión",
    hey: "¡Hola!",
    
    // Common actions
    addToCart: "Añadir",
    checkout: "Finalizar Compra",
    buy: "Comprar Ahora",
    
    // Product related
    price: "Precio",
    quantity: "Cantidad",
    description: "Descripción",
    details: "Detalles",
    reviews: "Reseñas",
    inStock: "En Stock",
    lowStock: "Pocas Unidades",
    unitsLeft: "unidades disponibles",
    outOfStock: "Agotado",
    unit: "unidad",
    units: "unidades",
    
    // Product filters and categories
    allCategories: "Todas las Categorías",
    searchProducts: "Buscar productos...",
    viewAllProducts: "Ver todos los productos",
    featuredProducts: "Productos Destacados",
    
    // Home page sections
    newCollection: "Nueva Colección 2025",
    discoverProducts: "Descubre Productos Excepcionales",
    curatedSelection: "Selección curada de artículos premium diseñados para elevar tu experiencia diaria",
    exploreCollection: "Explorar Colección",
    
    // Benefits section
    premiumQuality: "Calidad Premium",
    premiumDescription: "Todos nuestros productos están fabricados con materiales y artesanía de la más alta calidad para garantizar una satisfacción duradera.",
    freeShipping: "Envío Gratis",
    shippingDescription: "Disfruta de envío gratuito en todos los pedidos superiores a $100 dentro de Colombia con entrega rápida y confiable.",
    returns: "30 Días para Devoluciones",
    returnsDescription: "¿No estás satisfecho? Devuelve cualquier artículo dentro de los 30 días para un reembolso completo, sin preguntas.",
    
    // Newsletter section
    joinNewsletter: "Únete a Nuestro Boletín",
    newsletterDescription: "Suscríbete para recibir ofertas especiales, regalos gratuitos y ofertas únicas en tu bandeja de entrada.",
    nameOptional: "Nombre (opcional)",
    emailAddress: "Correo electrónico",
    subscribe: "Suscribirse",
    submitting: "Enviando...",
    subscribeSuccess: "¡Te has suscrito exitosamente!",
    subscribeError: "Hubo un error. Por favor intenta de nuevo.",
    
    // Authentication
    login: "Iniciar Sesión",
    register: "Registrarse",
    forgotPassword: "Olvidé mi Contraseña",
    email: "Correo Electrónico",
    password: "Contraseña",
    
    // Checkout and Product Details
    orderSummary: "Resumen del Pedido",
    subtotal: "Subtotal",
    shipping: "Envío",
    tax: "Impuesto",
    total: "Total",
    paymentMethod: "Método de Pago",
    shippingAddress: "Dirección de Envío",
    freeShippingMessage: "Envío estándar gratis en pedidos superiores a $100",
    easyReturns: "Devoluciones Fáciles",
    easyReturnsMessage: "Política de devolución de 30 días",
    secureCheckout: "Pago Seguro",
    secureCheckoutMessage: "Pago encriptado SSL",
    processingOrder: "Procesando...",
    checkoutWelcome: "Bienvenido al Checkout",
    signInBetterExp: "Inicia sesión para una mejor experiencia de compra",
    signInToAccount: "Iniciar Sesión en tu Cuenta",
    continueAsGuest: "Continuar como Invitado",
    cartSaved: "Tus artículos del carrito serán guardados",
    cartEmpty: "Tu carrito está vacío",
    browseProducts: "Explorar Productos",
    shippingInfo: "Información de Envío",
    savedAddresses: "Direcciones Guardadas",
    addNewAddress: "+ Añadir Nueva Dirección",
    billingAddress: "Dirección de Facturación",
    sameAsShipping: "Misma que la dirección de envío",
    differentBilling: "Usar una dirección de facturación diferente",
    continueToPay: "Continuar al Pago",
    shippingMethod: "Método de Envío",
    placeOrder: "Realizar Pedido",
    placeOrderLater: "Realizar Pedido (Pagar Después)",
    payWithCard: "Pagar con Tarjeta de Crédito",
    orderConfirmed: "¡Pedido Confirmado!",
    orderPendingCOD: "Pedido Pendiente (Contra Entrega)",
    orderConfirmationMessage: "Gracias por tu compra. Hemos enviado un correo de confirmación a {email}.",
    codConfirmationMessage: "Tu pedido está pendiente. Por favor paga al repartidor en efectivo. Nuestro personal confirmará tu pago pronto.",
    orderNumber: "Pedido #",
    payUComingSoon: "El servicio de pago PayU estará disponible pronto",
    orderSummary: "Resumen del Pedido",
    subtotal: "Subtotal",
    shipping: "Envío",
    taxes: "Impuestos",
    codFee: "Tarifa Contra Entrega",
    yourCart: "Tu Carrito",
    
    // Success page
    thankYou: "¡Gracias por su pedido!",
    orderReceived: "Su pedido ha sido recibido",
    continueShopping: "Continuar Comprando",
    
    // Layout
    tagline: "Compra Rápido, Envía Más Rápido",
    allRightsReserved: "Todos los derechos reservados",
    developedBy: "Desarrollado por",
    terms: "Términos",
    privacy: "Privacidad",
    contact: "Contacto",
    hours: "Horario",
    monday: "Lunes - Viernes",
    saturday: "Sábado",
    sunday: "Domingo",
    closed: "Cerrado",
    
    // Footer
    // ...existing footer translations...
    
    // WhatsApp
    whatsappStatus: "Normalmente responde en 2 minutos",
    
    // Cart
    removeUnavailableItems: "Por favor elimina los productos no disponibles del carrito",
    
    // Email Template
    yourItems: "TUS ARTÍCULOS",
    totalAmount: "MONTO TOTAL",
    shippingInfo: "INFORMACIÓN DE ENVÍO",
    shippingMethod: "MÉTODO DE ENVÍO",
    quantity: "Cantidad",
    orderShipNotification: "Te notificaremos cuando tu pedido sea enviado",
    viewInDashboard: "Ver en el panel →"
  }
};

const TranslationContext = createContext();

export function TranslationProvider({ children }) {
  // Initialize language from localStorage or default to English
  const [language, setLanguage] = useState('en');
  
  // Load language preference from localStorage on component mount
  useEffect(() => {
    const savedLanguage = localStorage.getItem('language');
    if (savedLanguage) {
      setLanguage(savedLanguage);
    }
  }, []);
  
  // Save language preference to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('language', language);
    // Update html lang attribute for accessibility
    document.documentElement.lang = language;
  }, [language]);
  
  // Toggle between English and Spanish
  const toggleLanguage = () => {
    setLanguage(prevLang => prevLang === 'en' ? 'es' : 'en');
  };
  
  // Get translation for a specific key
  const t = (key) => {
    return translations[language][key] || key;
  };
  
  return (
    <TranslationContext.Provider value={{ language, toggleLanguage, t }}>
      {children}
    </TranslationContext.Provider>
  );
}

// Custom hook to use translations in components
export function useTranslation() {
  const context = useContext(TranslationContext);
  if (context === undefined) {
    // Provide default values for when used outside provider
    console.warn('useTranslation is being used outside a TranslationProvider. Using default English values.');
    return {
      language: 'en',
      toggleLanguage: () => console.warn('toggleLanguage called outside provider'),
      t: (key) => {
        // Return the key as-is if not in provider
        return translations['en'][key] || key;
      }
    };
  }
  return context;
}
