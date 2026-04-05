"use client"

import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { SessionProvider } from "next-auth/react"
import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"

function AuthSync({ children }: { children: React.ReactNode }) {
  const { data, status } = useSession()
  useEffect(() => {
    if (status === "authenticated" && (data as any)?.accessToken) {
      localStorage.setItem("accessToken", (data as any).accessToken)
    } else if (status === "unauthenticated") {
      localStorage.removeItem("accessToken")
    }
  }, [data, status])
  return <>{children}</>
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () => new QueryClient({
      defaultOptions: {
        queries: { staleTime: 60 * 1000, retry: 1, refetchOnWindowFocus: false },
      },
    })
  )
  return (
    <SessionProvider>
      <AuthSync>
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      </AuthSync>
    </SessionProvider>
  )
}
