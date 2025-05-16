// src/app/auth/callback/route.ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    // Initialize cookies with await
    const cookieStore = await cookies()

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          // Proper async cookie handling
          get: async (name: string) => {
            return cookieStore.get(name)?.value
          },
          set: async (name: string, value: string) => {
            cookieStore.set({
              name,
              value,
              httpOnly: true,
              secure: process.env.NODE_ENV === 'production',
              path: '/',
              sameSite: 'lax'
            })
          },
          remove: async (name: string) => {
            cookieStore.delete(name)
          }
        }
      }
    )

    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')

    if (code) {
      await supabase.auth.exchangeCodeForSession(code)
    }

    return NextResponse.redirect(new URL('/dashboard', request.url))
  } catch (error) {
    console.error('Authentication error:', error)
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 500 }
    )
  }
}
