'use client'

import { Mail, Instagram, Facebook } from 'lucide-react'
import { useTranslation } from '@/contexts/TranslationContext'

export default function Footer() {
  const { t } = useTranslation();
  return (
    <footer className="border-t mt-12">
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <p className="text-sm text-gray-600">© {new Date().getFullYear()} The Quick Shop. {t('allRightsReserved')}. {t('developedBy')} <a href="https://jose-arias-portfolio.vercel.app/"><span className="underline">Jose Arias</span></a></p>
          <div className="flex items-center space-x-4 mt-4 md:mt-0">
            <a href="/terms" className="text-sm text-gray-600 hover:text-black">
              {t('terms')}
            </a>
            <a href="/privacy" className="text-sm text-gray-600 hover:text-black">
              {t('privacy')}
            </a>
            <a href="/contact" className="text-sm text-gray-600 hover:text-black">
              {t('contact')}
            </a>
            <a href="mailto:info@thequickshop.com" className="text-gray-600 hover:text-black transition-colors">
              <Mail className="h-5 w-5" />
            </a>
            <a href="https://instagram.com/thequickshop" className="text-gray-600 hover:text-black transition-colors">
              <Instagram className="h-5 w-5" />
            </a>
            <a href="https://facebook.com/thequickshop" className="text-gray-600 hover:text-black transition-colors">
              <Facebook className="h-5 w-5" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
