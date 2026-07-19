import { NextResponse } from 'next/server'
import { ADMIN_COOKIE_NAME } from '@/lib/admin-constants'

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json()

    const validEmail = process.env.ADMIN_EMAIL
    const validPassword = process.env.ADMIN_PASSWORD
    const secret = process.env.ADMIN_SESSION_SECRET

    if (!validEmail || !validPassword || !secret) {
      return NextResponse.json(
        { success: false, message: 'Admin credentials are not configured on the server' },
        { status: 500 }
      )
    }

    if (email !== validEmail || password !== validPassword) {
      return NextResponse.json(
        { success: false, message: 'Invalid email or password' },
        { status: 401 }
      )
    }

    const response = NextResponse.json({ success: true })

    response.cookies.set(ADMIN_COOKIE_NAME, secret, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    })

    return response
  } catch (error) {
    console.error('Admin login error:', error)
    return NextResponse.json(
      { success: false, message: 'Login failed' },
      { status: 500 }
    )
  }
}
