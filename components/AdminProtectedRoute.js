"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

export default function AdminProtectedRoute({ children }) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const checkAdminStatus = async () => {
      try {
        // Get current session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()

        if (sessionError || !session) {
          router.push('/')
          return
        }

        // Check user status
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('status')
          .eq('id', session.user.id)
          .single()

        if (userError || !userData || userData.status !== 'admin') {
          router.push('/')
          return
        }

        setIsLoading(false)
      } catch (error) {
        console.error('Error checking admin status:', error)
        router.push('/')
      }
    }

    checkAdminStatus()
  }, [router])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  return children
} 