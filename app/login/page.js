"use client"

import { AuthForm } from "../../components/auth-form"

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-full max-w-sm md:max-w-3xl">
        <div className="bg-white p-8 rounded-2xl shadow-lg">
          <AuthForm />
        </div>
      </div>
    </div>
  )
}
