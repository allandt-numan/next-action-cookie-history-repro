'use server'

import { cookies } from 'next/headers'

// Read-only: no cookies().set(), revalidatePath or revalidateTag.
export async function noop() {
  return 1
}

// A genuine cookie write, for comparison.
export async function setCookie() {
  const cookieStore = await cookies()
  cookieStore.set('action', Date.now().toString())
  return 1
}
