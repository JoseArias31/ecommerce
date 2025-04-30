'use client'

import { Globe, Mail, Instagram, Facebook } from 'lucide-react'
import TikTok from '@vicons/ionicons5/Tiktok'

export default function Footer() {
  return (
    <footer className="border-t py-8">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-gray-600" />
            <span className="text-sm text-gray-600">© 2025 The Quick Shop. All rights reserved.</span>
          </div>
          
          <div className="flex items-center gap-4">
            <a 
              href="mailto:info@thequickshop.com" 
              className="text-gray-600 hover:text-gray-900 transition-colors"
              target="_blank" 
              rel="noopener noreferrer"
            >
              <Mail className="h-5 w-5" />
            </a>
            <a 
              href="https://instagram.com/thequickshop" 
              className="text-gray-600 hover:text-gray-900 transition-colors"
              target="_blank" 
              rel="noopener noreferrer"
            >
              <Instagram className="h-5 w-5" />
            </a>
            <a 
              href="https://tiktok.com/@thequickshop" 
              className="text-gray-600 hover:text-gray-900 transition-colors"
              target="_blank" 
              rel="noopener noreferrer"
            >
              <TikTok className="h-5 w-5" />
            </a>
            <a 
              href="https://facebook.com/thequickshop" 
              className="text-gray-600 hover:text-gray-900 transition-colors"
              target="_blank" 
              rel="noopener noreferrer"
            >
              <Facebook className="h-5 w-5" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
