'use client'

import { useCountry } from '@/contexts/CountryContext';
import { useTranslation } from '@/contexts/TranslationContext';
import { Globe } from 'lucide-react';
import Image from 'next/image';

export default function CountrySelector() {
  const { country, changeCountry, countries, loading } = useCountry();
  const { t, language } = useTranslation();
  
  if (loading) {
    return (
      <div className="flex items-center space-x-2 text-sm text-white/70">
        <Globe size={16} />
        <span>{t('loading') || 'Loading...'}</span>
      </div>
    );
  }

  // Get current country data
  const currentCountry = countries[country] || countries.CA;
  
  return (
    <div className="relative group">
      <button
        className="flex items-center color-white space-x-2 py-1 px-2 rounded-md hover:bg-white/10 transition-colors"
        aria-label={t("selectCountry") || "Select country"}
        aria-haspopup="listbox"
      >
        <div className="w-6 h-4 overflow-hidden rounded mr-1 border border-gray-600">
          <Image
            src={currentCountry.flagImage}
            alt={currentCountry.name}
            width={24}
            height={16}
            className="object-cover w-full h-full"
          />
        </div>
        <span className="text-sm text-white font-medium hidden md:inline">
          {currentCountry.name}
        </span>
      </button>

      <div className="absolute top-full right-0 mt-1 w-56 bg-gray-800 shadow-lg rounded-md overflow-hidden opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
        <div className="p-2 border-b border-gray-700 text-xs text-gray-400">
          {t("selectCountryAndLanguage") || "Select country and language"}
        </div>
        {Object.entries(countries).map(([code, data]) => (
          <button
            key={code}
            onClick={() => changeCountry(code)}
            className={`w-full flex items-center space-x-3 p-3 text-left hover:bg-gray-700 transition-colors ${code === country ? "bg-gray-700" : ""}`}
          >
            <div className="flex-shrink-0 w-8 h-6 overflow-hidden rounded border border-gray-600">
              <Image
                src={data.flagImage}
                alt={data.name}
                width={32}
                height={24}
                className="object-cover w-full h-full"
              />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-medium text-white">
                {data.name}
              </span>
              <div className="flex items-center">
                <span className="text-xs text-gray-400">
                  {data.language === "en" ? "English" : "Español"}
                </span>
                {data.language === language && (
                  <span className="ml-2 bg-blue-500 text-white text-xs px-1 py-0.5 rounded-sm">
                    {t("active") || "Active"}
                  </span>
                )}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
