'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'
import ThemeToggle from '@/components/ThemeToggle'

const navItems = [
  { name: 'Dashboard', href: '/dashboard', icon: '📊' },
  { name: 'Doctors', href: '/doctors', icon: '🩺' },
  { name: 'Hospitals', href: '/hospitals', icon: '🏥' },
  { name: 'Hospital Transactions', href: '/hospital-transactions', icon: '📈' },
  { name: 'Users', href: '/users', icon: '👥' },
  { name: 'Appointments', href: '/appointments', icon: '📅' },
  { name: 'Withdrawals', href: '/withdrawals', icon: '💸' },
  { name: 'Payments', href: '/payments', icon: '💳' },
]

export default function AdminSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const handleLogout = async () => {
    await fetch('/api/logout', { method: 'POST' })
    router.push('/login')
    router.refresh()
  }

  return (
    <>
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white border-b border-border">
        <div className="flex justify-between items-center px-4 py-3">
          <span className="font-bold text-lg flex items-center gap-2">
            <Image src="/assets/icons/logo.png" alt="Ueba" width={28} height={28} className="rounded" />
            Ueba Admin
          </span>
          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
            ☰
          </button>
        </div>

        {isMobileMenuOpen && (
          <div className="border-t border-border">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 text-sm ${
                  pathname === item.href
                    ? 'bg-primary-light text-primary font-medium'
                    : 'text-text-dark'
                }`}
              >
                <span>{item.icon}</span>
                {item.name}
              </Link>
            ))}
            <ThemeToggle className="w-full px-4" />
            <button
              onClick={handleLogout}
              className="w-full text-left flex items-center gap-3 px-4 py-3 text-sm text-error"
            >
              🚪 Logout
            </button>
          </div>
        )}
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden lg:flex flex-col sticky top-0 h-screen w-64 flex-shrink-0 bg-white border-r border-border">
        <div className="px-6 py-6 border-b border-border">
          <div className="flex items-center gap-2">
            <Image src="/assets/icons/logo.png" alt="Ueba" width={32} height={32} className="rounded" />
            <span className="font-bold text-xl text-text-dark">Ueba</span>
          </div>
          <p className="text-xs text-text-grey mt-1">Admin Panel</p>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition ${
                pathname === item.href
                  ? 'bg-primary-light text-primary font-medium'
                  : 'text-text-dark hover:bg-background'
              }`}
            >
              <span>{item.icon}</span>
              {item.name}
            </Link>
          ))}
        </nav>

        <div className="px-3 py-4 border-t border-border space-y-1">
          <ThemeToggle className="w-full" />
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-error hover:bg-red-50"
          >
            🚪 Logout
          </button>
        </div>
      </div>
    </>
  )
}
