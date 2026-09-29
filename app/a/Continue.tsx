'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'

import { noop, setCookie } from '../actions'

export function Continue() {
  const router = useRouter()

  const handleContinue = async () => {
    await noop()
    router.push('/b')
  }

  const handleContinueWithCookie = async () => {
    await setCookie()
    router.push('/b')
  }

  return (
    <>
      <button onClick={handleContinue}>Continue</button>
      <button onClick={handleContinueWithCookie}>Continue (action sets cookie)</button>
      {/* Visible link so /b is prefetched before the action runs, as in the real app */}
      <Link href="/b">B (prefetch only)</Link>
    </>
  )
}
