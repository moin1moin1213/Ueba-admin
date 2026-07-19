'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { FullScreenLoader } from '@/components/Loader'
import Image from 'next/image'

export default function AdminLoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage('')
    setIsLoading(true)

    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      const result = await response.json()

      if (!result.success) {
        setErrorMessage(result.message || 'Login failed')
        setIsLoading(false)
        return
      }

      router.push('/dashboard')
      router.refresh()
      // isLoading intentionally stays true here - the loader keeps
      // showing until the page navigates away.
    } catch (error) {
      console.error(error)
      setErrorMessage('Login failed. Please try again.')
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      {isLoading && <FullScreenLoader />}

      <div className="w-full max-w-sm bg-white rounded-2xl border border-border p-8">
        <Image src="/assets/icons/logo.png" alt="Ueba" width={48} height={48} className="rounded mb-4" unoptimized />
        <h1 className="text-2xl font-bold text-text-dark mb-1">Admin Login</h1>
        <p className="text-sm text-text-grey mb-6">Ueba control panel</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border border-border rounded-lg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-border rounded-lg"
            />
            {errorMessage && (
              <p className="text-error text-sm mt-1">{errorMessage}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-primary text-white py-3 rounded-lg font-medium disabled:opacity-60"
          >
            Login
          </button>
        </form>
      </div>
    </div>
  )
}
