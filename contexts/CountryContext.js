'use client'

import React, { createContext, useState, useContext, useEffect } from 'react';
import { useTranslation } from './TranslationContext';
import { supabase } from '@/lib/supabaseClient';

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
  const [countries, setCountries] = useState(countryDefaults);
  const [loading, setLoading] = useState(true);
  const { toggleLanguage, language } = useTranslation();
  
  // Load country preference from localStorage on component mount
  useEffect(() => {
    const savedCountry = localStorage.getItem('country');
    if (savedCountry && countries[savedCountry]) {
      setCountry(savedCountry);
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
  
  // Change country and update language if needed
  const changeCountry = (countryCode) => {
    if (countries[countryCode]) {
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
