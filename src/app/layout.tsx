import type { Metadata } from 'next'
import { Poppins } from 'next/font/google'
import './globals.css'
import Script from 'next/script'
import ActivityStoreInitializer from '@/components/ActivityStoreInitializer'

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-poppins',
})

export const metadata: Metadata = {
  title: 'ESP32 IoT Platform',
  description: 'Build real IoT projects visually',
}

/**
 * Root layout component that wraps the entire application with the Poppins font and initializes the activity store.
 */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${poppins.variable} font-poppins`}>
        <ActivityStoreInitializer />
        {children}
        <Script
          type="module"
          src="https://unpkg.com/esp-web-tools@10/dist/web/install-button.js"
          strategy="afterInteractive"
        />
      </body>
    </html>
  )
}