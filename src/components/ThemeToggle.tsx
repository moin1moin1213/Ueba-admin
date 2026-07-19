'use client'

import { useEffect, useState } from 'react'

export default function ThemeToggle({ className = '' }: { className?: string }) {
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('ueba-theme')
    const dark = saved === 'dark'
    setIsDark(dark)
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light')
  }, [])

  const toggle = () => {
    const next = !isDark
    setIsDark(next)
    document.documentElement.setAttribute('data-theme', next ? 'dark' : 'light')
    localStorage.setItem('ueba-theme', next ? 'dark' : 'light')
  }

  return (
    <button
      onClick={toggle}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-text-dark hover:bg-background transition ${className}`}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      <span>{isDark ? '☀️' : '🌙'}</span>
      {isDark ? 'Light mode' : 'Dark mode'}
    </button>
  )
}
