import React from 'react'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Toaster } from 'react-hot-toast'

import Providers from '../components/Providers'
import GlobalErrorBoundary from '../components/GlobalErrorBoundary'
import GlobalErrorHandler from '../components/GlobalErrorHandler'
import HydrationErrorBoundary from '../components/HydrationErrorBoundary'

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'F1 Race Simulator - Professional Strategy Analysis',
  description: 'Professional Formula 1 race strategy simulation and analysis platform',
  keywords: 'Formula 1, F1, racing, simulation, strategy, pit stops, tires, analysis',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>

      <body className="font-sans antialiased">
        <Providers>
          <GlobalErrorBoundary>
            <HydrationErrorBoundary>
              <GlobalErrorHandler />
              <Toaster position="top-center" />
              {children}
            </HydrationErrorBoundary>
          </GlobalErrorBoundary>
        </Providers>
      </body>
    </html>
  )
} 