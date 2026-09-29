import { NextResponse, type NextRequest } from 'next/server'

// Mimics an analytics/session middleware that refreshes a cookie on every request.
// Set SKIP_ACTIONS=1 to apply the workaround (skip server action POSTs).
export function middleware(request: NextRequest) {
  const res = NextResponse.next()

  if (process.env.SKIP_ACTIONS === '1' && request.headers.has('next-action')) {
    return res
  }

  res.cookies.set('mw', Date.now().toString())
  return res
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)']
}
