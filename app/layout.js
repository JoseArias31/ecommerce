'use client'

import '../styles/globals.css';
import Link from "next/link"
import { useEffect, useState } from "react";
import Image from "next/image";
import Footer from "@/components/footer";
import { Globe, Menu, X } from "lucide-react"
import React from 'react'
import { FloatingWhatsApp } from 'react-floating-whatsapp'
import useProtectedRoute from "@/app/auth/register/Hooks/useProtectedRoutes";
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import { PageTransition } from '@/components/page-transitions';
import { Toaster } from 'react-hot-toast'
import { TranslationProvider, useTranslation } from '@/contexts/TranslationContext';
import { CountryProvider, useCountry } from '@/contexts/CountryContext';
import CountrySelector from '@/components/country-selector';

// This component is not needed as we're wrapping everything with TranslationProvider

export default function RootLayout({ children }) {
  const [cartCount, setCartCount] = useState(0);
  const [user, setUser] = useState(null);
  const [error, setError] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const session = useProtectedRoute(); // Custom hook to check session
  const router = useRouter();

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        if (!session) return; // If no session, do nothing

        const { data: userData, error: userError } = await supabase
          .from("users")
          .select("*")
          .eq("email", session.user.email)
          .single();

        if (userError) throw userError;
        setUser(userData);
      } catch (error) {
        console.error("Error fetching user data:", error.message);
        setError(error);
      }
    };

    fetchUserData();
  }, [session]); // Runs when session changes

  useEffect(() => {
    // Function to sum all quantities in the cart
    const getCartCount = () => {
      if (typeof window === 'undefined') return 0;
      const cart = JSON.parse(localStorage.getItem('cart')) || [];
      return cart.reduce((sum, item) => sum + item.quantity, 0);
    };

    // Initial count
    setCartCount(getCartCount());

    // Listen for cart updates from anywhere in the app
    const handleCartUpdate = () => setCartCount(getCartCount());
    window.addEventListener('cartUpdated', handleCartUpdate);

    return () => window.removeEventListener('cartUpdated', handleCartUpdate);
  }, []);

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setUser(null);
      router.push('/');
    } catch (error) {
      console.error('Error signing out:', error.message);
    }
  };

  if(error) {
    <div>Error while getting access</div>
  }

  useEffect(() => {
    // Add smooth scroll behavior
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
          target.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
          });
        }
      });
    });

    // Add smooth scroll behavior for all links
    document.querySelectorAll('a').forEach(anchor => {
      anchor.addEventListener('click', function () {
        window.scrollTo({
          top: 0,
          behavior: 'smooth'
        });
      });
    });
  }, []);

  return (
    <TranslationProvider>
      <CountryProvider>
        <LayoutContent 
          cartCount={cartCount} 
          user={user} 
          isMobileMenuOpen={isMobileMenuOpen} 
          setIsMobileMenuOpen={setIsMobileMenuOpen} 
          session={session} 
          handleSignOut={handleSignOut} 
          children={children} 
        />
      </CountryProvider>
    </TranslationProvider>
  );
}

// This component is inside the TranslationProvider and can access translations
function LayoutContent({ cartCount, user, isMobileMenuOpen, setIsMobileMenuOpen, session, handleSignOut, children }) {
  // Now we can safely use the translation hook
  const { t, language, toggleLanguage } = useTranslation();
  
  return (
      <html lang={language} className="scroll-smooth">
        <head>
          <title>{t('store')}</title>
          <meta name="description" content="A minimalist e-commerce store" />
        </head>
        <body className="min-h-screen flex flex-col">
          <header className="sticky top-0 z-50 bg-[#092d5d]/90 backdrop-blur-sm border-b border-[#1a2b3c]/20">
            <div className="container mx-auto px-4">
              <div className="flex items-center justify-between h-16">
                <Link href="/" className="relative group flex flex-row items-center">
                  <div className="relative z-10">
                    <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white">
                      {t('store')}
                    </h1>
                    <p className="text-xs sm:text-sm text-blue-200/90 text-center -mt-1">Shop Quick, Ship Quicker</p>
                  </div>
                  <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 group-hover:opacity-60 transition-all duration-300 group-hover:rotate-12">
                    <Image 
                      src="/logoecommerce.png" 
                      alt="Logo" 
                      width={64} 
                      height={64}
                      className="object-contain brightness-0 invert"
                    />
                  </div>
                </Link>

                {/* Mobile menu button */}
                <button
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className="lg:hidden text-white p-1"
                  type="button"
                  aria-label="Toggle menu"
                >
                  {isMobileMenuOpen ? (
                    <X className="h-5 w-5 sm:h-6 sm:w-6" />
                  ) : (
                    <Menu className="h-5 w-5 sm:h-6 sm:w-6" />
                  )}
                </button>

                {/* Desktop navigation */}
                <div className="hidden lg:flex items-center space-x-6">
                  {/* Country selector */}
                  <CountrySelector />
                  
                  {/* Language toggle */}
                  <button
                    onClick={toggleLanguage}
                    className="p-2 text-white hover:text-blue-200 flex items-center space-x-1"
                  >
                    <Globe size={20} />
                    <span className="ml-1 hidden md:inline">{language === 'en' ? 'EN' : 'ES'}</span>
                  </button>
                  
                  <Link href="/checkout" className="text-white hover:text-blue-200 transition-colors">
                    <div className="p-2 relative">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <circle cx="8" cy="21" r="1"></circle>
                        <circle cx="19" cy="21" r="1"></circle>
                        <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"></path>
                      </svg>
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                        {cartCount}
                      </span>
                    </div>
                  </Link>
                  
                  {session ? (
                    <div className="flex items-center gap-2">
                      {user?.status === 'admin' && (
                        <Link href="/admin" className="text-white hover:text-blue-200 transition-colors">
                          <div className="p-2 flex items-center gap-1">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="20"
                              height="20"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            <span className="text-sm">{t('admin')}</span>
                          </div>
                        </Link>
                      )}
                      <button 
                        onClick={handleSignOut}
                        className="text-white hover:text-blue-200 p-2 flex items-center gap-1"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="20"
                          height="20"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                          <polyline points="16 17 21 12 16 7"></polyline>
                          <line x1="21" y1="12" x2="9" y2="12"></line>
                        </svg>
                        <span className="text-sm">{t('signOut')}</span>
                      </button>
                      <Link href={'/settings'}>
                        <div className="w-8 h-8 rounded-full bg-blue-200/20 flex items-center justify-center text-white">
                          {user?.username?.charAt(0).toUpperCase() || 
                           user?.email?.charAt(0).toUpperCase() || 
                           'U'}
                        </div>
                      </Link>
                    </div>
                  ) : (
                    <Link href="/login" className="text-white hover:text-blue-200 text-sm transition-colors">
                      <div className="relative p-2">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="20"
                          height="20"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path>
                          <circle cx="12" cy="7" r="4"></circle>
                        </svg>
                        <div className="absolute -top-2 right-0 flex items-center space-x-1 animate-bounce">
                          <span className="bg-blue-400 text-white text-xs rounded-full px-1 drop-shadow">
                            Hey!
                          </span>
                        </div>
                      </div>
                    </Link>
                  )}
                </div>
              </div>

              {/* Mobile menu */}
              <div
                className={`lg:hidden absolute top-full left-0 right-0 bg-[#1a2b3c]/95 backdrop-blur-sm border-b border-[#1a2b3c]/20 shadow-lg transition-all duration-300 ease-in-out ${
                  isMobileMenuOpen ? 'translate-y-0' : '-translate-y-full'
                }`}
              >
                <div className="flex flex-col space-y-1">
                  {/* Country Selector Mobile */}
                  <div className="p-2">
                    <CountrySelector />
                  </div>
                  {/* Language Toggle Button Mobile */}
                  <button 
                    onClick={toggleLanguage} 
                    className="flex items-center p-2 text-white text-sm hover:text-blue-200 hover:bg-blue-800/20 rounded-md transition-colors"
                  >
                    <Globe className="h-4 w-4 mr-2" />
                    {language === 'en' ? 'Español' : 'English'}
                  </button>
                  <Link
                    href="/"
                    className="flex items-center p-2 text-white text-sm hover:text-blue-200 hover:bg-blue-800/20 rounded-md transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4 mr-2"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                      />
                    </svg>
                    {t('home')}
                  </Link>
                  
                  <Link
                    href="/products"
                    className="flex items-center p-2 text-white text-sm hover:text-blue-200 hover:bg-blue-800/20 rounded-md transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4 mr-2"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                      />
                    </svg>
                    {t('products')}
                  </Link>
                  
                  <Link
                    href="/checkout"
                    className="flex items-center p-2 text-white text-sm hover:text-blue-200 hover:bg-blue-800/20 rounded-md transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4 mr-2"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                      />
                    </svg>
                    {t('checkout')}
                    <span className="bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center ml-2">
                      {cartCount}
                    </span>
                  </Link>

                  {user?.status === 'active' && (
                    <Link
                      href="/settings"
                      className="flex items-center p-2 text-white text-sm hover:text-blue-200 hover:bg-blue-800/20 rounded-md transition-colors"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4 mr-2"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                      Settings
                    </Link>
                  )}

                  {user?.status === 'admin' && (
                    <>
                      <Link
                        href="/settings"
                        className="flex items-center p-2 text-white text-sm hover:text-blue-200"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4 mr-2"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                        </svg>
                        Settings
                      </Link>
                      <Link
                        href="/admin"
                        className="flex items-center p-2 text-white text-sm hover:text-blue-200"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4 mr-2"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                          />
                        </svg>
                        {t('admin')}
                      </Link>
                    </>
                  )}

                  {session && (
                    <button
                      onClick={() => {
                        handleSignOut();
                        setIsMobileMenuOpen(false);
                      }}
                      className="flex items-center p-2 text-white w-full text-left text-sm hover:text-blue-200 hover:bg-blue-800/20 rounded-md transition-colors"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4 mr-2"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                        />
                      </svg>
                      {t('signOut')}
                    </button>
                  )}

                  {!session && (
                    <Link
                      href="/login"
                      className="flex items-center p-2 text-white text-sm hover:text-blue-200 hover:bg-blue-800/20 rounded-md transition-colors"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4 mr-2"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"
                        />
                        <circle cx="12" cy="7" r="4" />
                      </svg>
                      <div className="flex items-center">
                        {t('signIn')}
                        <div className="ml-2 flex items-center animate-bounce">
                          <span className="bg-blue-400 text-white text-xs rounded-full px-1 drop-shadow">
                            {t('hey')}
                          </span>
                        </div>
                      </div>
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </header>
          <FloatingWhatsApp
            phoneNumber="16474252986"
            accountName="The Quick Shop"
            statusMessage="Typically replies within 2 minutes"
            avatar='/logowithbackground.png'
          />
          <div className="flex flex-col min-h-screen">
            {children}
            <Footer />
          </div>
          <Toaster position="top-center" />
        </body>
      </html>
  );
}