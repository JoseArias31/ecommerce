'use client'

import React, { createContext, useState, useContext, useEffect } from 'react';
import { useTranslation } from './TranslationContext';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'react-hot-toast';

// Country data with name, code, currency, flag, and language
const countryDefaults = {
  CA: {
    name: 'Canada',
    currency: 'CAD',
    flag: '🇨🇦',
    locale: 'en-CA',
    language: 'en',
    flagImage: '/flags/Canada.svg.svg'
  },
  CO: {
    name: 'Colombia',
    currency: 'COP',
    flag: '🇨🇴',
    locale: 'es-CO',
    language: 'es',
    flagImage: '/flags/colombia.svg'
  }
};

const CountryContext = createContext();

export function CountryProvider({ children }) {
  // Initialize country from localStorage or default to Canada
  const [country, setCountry] = useState('CA');
  const [previousCountry, setPreviousCountry] = useState('CA');
  const [countries, setCountries] = useState(countryDefaults);
  const [loading, setLoading] = useState(true);
  const { toggleLanguage, language } = useTranslation();
  
  // Load country preference from localStorage on component mount
  useEffect(() => {
    const savedCountry = localStorage.getItem('country');
    if (savedCountry && countries[savedCountry]) {
      setCountry(savedCountry);
      setPreviousCountry(savedCountry);
    }
    
    // Fetch countries from Supabase
    fetchCountries();
  }, []);
  
  // Fetch countries from Supabase
  const fetchCountries = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('countries')
        .select('*');
      
      if (error) throw error;
      
      // If countries are available in Supabase, use them
      if (data && data.length > 0) {
        const countriesData = {};
        data.forEach(c => {
          countriesData[c.code] = {
            name: c.name,
            currency: c.currency,
            flag: c.flag,
            locale: c.locale,
            language: c.language || (c.locale.startsWith('es') ? 'es' : 'en'),
            flag: c.flag,
            flagImage: c.flag_image || `/flags/${c.code.toLowerCase()}.svg`
          };
        });
        setCountries(countriesData);
      }
    } catch (error) {
      console.error('Error fetching countries:', error.message);
      // Fallback to default countries if there's an error
      setCountries(countryDefaults);
    } finally {
      setLoading(false);
    }
  };
  
  // Save country preference to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('country', country);
  }, [country]);
  
  // Check if products in cart are available in the new country
  const checkCartAvailability = async (newCountryCode) => {
    try {
      // Get cart from localStorage
      const cart = JSON.parse(localStorage.getItem('cart')) || [];
      if (cart.length === 0) return true;

      // Get all product IDs from cart
      const productIds = cart.map(item => item.id);
      
      // Check availability in new country
      const { data, error } = await supabase
        .from('products')
        .select('id, name, country_availability')
        .in('id', productIds);

      if (error) throw error;

      // Check if all products are available in new country
      const unavailableProducts = data.filter(product => 
        !product.country_availability.includes(newCountryCode)
      );

      if (unavailableProducts.length > 0) {
        // Get the names of unavailable products
        const productNames = unavailableProducts.map(p => p.name).join(', ');
        
        // Show toast with unavailable products
        toast.error(
          language === 'en' 
            ? `The following items in your cart are not available in ${countries[newCountryCode].name}: ${productNames}`
            : `Los siguientes productos en tu carrito no están disponibles en ${countries[newCountryCode].name}: ${productNames}`
        );
        
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Error checking cart availability:', error);
      return false;
    }
  };

  // Change country and update language if needed
  const changeCountry = async (countryCode) => {
    if (countries[countryCode]) {
      // Store the current country as previous before changing
      setPreviousCountry(country);
      
      // Check if products in cart are available in new country
      const areProductsAvailable = await checkCartAvailability(countryCode);
      
      if (!areProductsAvailable) {
        toast(
          language === 'en'
            ? 'Please remove unavailable items from your cart before changing country'
            : 'Por favor elimina los productos no disponibles de tu carrito antes de cambiar el país'
        );
        return;
      }

      // Proceed with country change
      setCountry(countryCode);
      
      // Change language based on country if it's different
      const countryLanguage = countries[countryCode].language;
      if (countryLanguage && countryLanguage !== language) {
        toggleLanguage();
      }
    }
  };
  
  // Get country data
  const getCountryData = () => {
    return countries[country] || countries.CA;
  };
  
  return (
    <CountryContext.Provider value={{ 
      country, 
      previousCountry,
      changeCountry, 
      getCountryData,
      countries,
      loading
    }}>
      {children}
    </CountryContext.Provider>
  );
}

// Custom hook to use country context in components
export function useCountry() {
  const context = useContext(CountryContext);
  if (context === undefined) {
    console.warn('useCountry is being used outside a CountryProvider. Using default Canada values.');
    return {
      country: 'CA',
      changeCountry: () => console.warn('changeCountry called outside provider'),
      getCountryData: () => countryDefaults.CA,
      countries: countryDefaults,
      loading: false
    };
  }
  return context;
}
