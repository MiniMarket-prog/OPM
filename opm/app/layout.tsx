import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css" // Correctly imported here
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/sonner" // Assuming you use sonner for toasts

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Bulk Email Operations Manager",
  description: "Manage bulk email operations efficiently.",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}
