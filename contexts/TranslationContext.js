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
    
    // Authentication
    login: "Login",
    register: "Register",
    forgotPassword: "Forgot Password",
    email: "Email",
    password: "Password",
    
    // Checkout
    orderSummary: "Order Summary",
    subtotal: "Subtotal",
    shipping: "Shipping",
    tax: "Tax",
    total: "Total",
    paymentMethod: "Payment Method",
    shippingAddress: "Shipping Address",
    
    // Success page
    thankYou: "Thank you for your order!",
    orderReceived: "Your order has been received",
    continueShopping: "Continue Shopping",
    
    // Footer
    contactUs: "Contact Us",
    about: "About",
    termsOfService: "Terms of Service",
    privacyPolicy: "Privacy Policy",
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
    
    // Authentication
    login: "Iniciar Sesión",
    register: "Registrarse",
    forgotPassword: "Olvidé mi Contraseña",
    email: "Correo Electrónico",
    password: "Contraseña",
    
    // Checkout
    orderSummary: "Resumen del Pedido",
    subtotal: "Subtotal",
    shipping: "Envío",
    tax: "Impuesto",
    total: "Total",
    paymentMethod: "Método de Pago",
    shippingAddress: "Dirección de Envío",
    
    // Success page
    thankYou: "¡Gracias por su pedido!",
    orderReceived: "Su pedido ha sido recibido",
    continueShopping: "Continuar Comprando",
    
    // Footer
    contactUs: "Contáctenos",
    about: "Acerca de",
    termsOfService: "Términos de Servicio",
    privacyPolicy: "Política de Privacidad",
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
