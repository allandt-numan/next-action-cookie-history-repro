import { headers } from 'next/headers'

export default async function B() {
  // Dynamic, so the navigation needs a dynamic RSC request after the prefetch
  await headers()
  return (
    <main>
      <h1>B</h1>
    </main>
  )
}
