import type { Metadata } from "next"
import { Inter, Outfit } from "next/font/google"
import "./globals.css"
import { Providers } from "./providers"
import { AdminLayout } from "@/components/layout/AdminLayout"
import { Toaster } from "react-hot-toast"

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" })
const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit", display: "swap" })

export const metadata: Metadata = {
  title: { default: "Admin Dashboard — ShopHub", template: "%s | Admin" },
  description: "ShopHub platform administration panel.",
  robots: { index: false, follow: false },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${outfit.variable}`} suppressHydrationWarning>
      <body className="antialiased" suppressHydrationWarning>
        <Providers>
          <AdminLayout>{children}</AdminLayout>
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 3500,
              style: {
                background: "#1e293b",
                color: "#f8fafc",
                borderRadius: "12px",
                border: "1px solid #334155",
                fontSize: "14px",
              },
              success: { iconTheme: { primary: "#f97316", secondary: "#fff" } },
            }}
          />
        </Providers>
      </body>
    </html>
  )
}
