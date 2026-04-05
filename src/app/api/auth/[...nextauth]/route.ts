import NextAuth, { type AuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"

let raw_api_url = process.env.NEXT_PUBLIC_API_URL || "http://localhost:9000/api/v1"

if (!raw_api_url || raw_api_url.trim() === "") {
  raw_api_url = "http://localhost:9000/api/v1"
} else if (!raw_api_url.startsWith('http')) {
  raw_api_url = `https://${raw_api_url}`
}

let API_URL_BASE = raw_api_url.replace(/\/+$/, "")
if (!API_URL_BASE.includes('/api/v1')) {
  API_URL_BASE += "/api/v1"
}
const API_URL = API_URL_BASE

const authOptions: AuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Admin Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        const res = await fetch(`${API_URL}/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: credentials.email,
            password: credentials.password,
          }),
        })

        if (!res.ok) return null
        const payload = await res.json()
        const user = payload?.data?.user
        const accessToken = payload?.data?.accessToken
        if (!user || !accessToken || user.role !== "admin") return null

        return {
          id: user.id,
          email: user.email,
          name: `${user.firstName || ""} ${user.lastName || ""}`.trim(),
          role: user.role,
          accessToken,
        } as any
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        ;(token as any).id = (user as any).id
        ;(token as any).role = (user as any).role
        ;(token as any).accessToken = (user as any).accessToken
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        ;(session.user as any).id = (token as any).id
        ;(session.user as any).role = (token as any).role
        ;(session.user as any).accessToken = (token as any).accessToken
      }
      return session
    },
  },
  pages: { signIn: "/auth/login", error: "/auth/login" },
  session: { strategy: "jwt" as const, maxAge: 24 * 60 * 60 },
  cookies: {
    sessionToken: {
      name: `next-auth.session-token.admin`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
  },
  secret: process.env.NEXTAUTH_SECRET || "default_secret",
}

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }
