import React from "react"
import type { Metadata } from 'next'

import { Analytics } from '@vercel/analytics/next'
import { LanguageProvider } from "@/components/language-provider"
import { Toaster } from "@/components/ui/toaster"
import './globals.css'

import { Libre_Baskerville as V0_Font_Libre_Baskerville, IBM_Plex_Mono as V0_Font_IBM_Plex_Mono, Lora as V0_Font_Lora } from 'next/font/google'

// Initialize fonts
const _libreBaskerville = V0_Font_Libre_Baskerville({ subsets: ['latin'], weight: ["400","700"] })
const _ibmPlexMono = V0_Font_IBM_Plex_Mono({ subsets: ['latin'], weight: ["100","200","300","400","500","600","700"] })
const _lora = V0_Font_Lora({ subsets: ['latin'], weight: ["400","500","600","700"] })

export const metadata: Metadata = {
  title: 'Dance Library',
  description: 'A collection of dances with schemes and music',
  generator: 'v0.app',
  icons: {
    // Use favicon.ico in app for browser favicon
    icon: '/favicon.ico',
    // Use Apple touch icon from app
    apple: '/apple-icon.png',
  },
  // Point to your app-level manifest
  manifest: '/manifest.json',
  other: {
    'apple-mobile-web-app-title': 'Dances',
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'default',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="uk">
      <body className={`font-sans antialiased`}>
        <LanguageProvider>
          {children}
        </LanguageProvider>
        <Toaster />
        <Analytics />
      </body>
    </html>
  )
}
