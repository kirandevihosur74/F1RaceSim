import React from 'react'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Toaster } from 'react-hot-toast'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'F1 Race Simulator - AI-Powered Strategy Analysis',
  description: 'Simulate Formula 1 race strategies, predict outcomes, and receive AI-generated recommendations',
  keywords: 'Formula 1, F1, racing, simulation, strategy, AI, pit stops, tires',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Toaster position="top-center" />
        {children}
      </body>
    </html>
  )
} 