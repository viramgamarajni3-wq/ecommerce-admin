"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { signIn } from "next-auth/react"
import { useState } from "react"
import { Shield, Mail, Lock, Loader2 } from "lucide-react"

export default function AdminLoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const result = await signIn("credentials", {
      email: email.trim().toLowerCase(),
      password,
      redirect: false,
    })

    setLoading(false)

    if (result?.error) {
      setError("Invalid credentials or insufficient permissions.")
    } else if (result?.ok) {
      router.replace("/dashboard")
    }
  }

  return (
    <main className="min-h-screen grid place-items-center px-4" style={{ background: "linear-gradient(135deg, #0b0f1a 0%, #111827 100%)" }}>
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div style={{ width: 56, height: 56, borderRadius: 16, background: "linear-gradient(135deg, #f97316, #dc2626)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 8px 24px rgba(249,115,22,0.4)", marginBottom: 16 }}>
            <Shield style={{ width: 26, height: 26, color: "white" }} />
          </div>
          <h1 style={{ color: "white", fontSize: 26, fontWeight: 800, letterSpacing: "-0.5px", fontFamily: "var(--font-outfit,sans-serif)" }}>Admin Portal</h1>
          <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 13, marginTop: 4 }}>ShopHub Platform Administration</p>
        </div>

        {/* Card */}
        <form onSubmit={onSubmit} style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 20, padding: 32, backdropFilter: "blur(16px)" }}>
          {error && (
            <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 10, padding: "12px 16px", marginBottom: 20, color: "#fca5a5", fontSize: 13 }}>
              ⚠️ {error}
            </div>
          )}

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", color: "rgba(255,255,255,0.5)", fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 8 }}>Email Address</label>
            <div style={{ position: "relative" }}>
              <Mail style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", width: 16, height: 16, color: "rgba(255,255,255,0.3)" }} />
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="admin@shophub.in"
                required
                style={{ width: "100%", background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 10, color: "white", padding: "12px 12px 12px 42px", fontSize: 14, outline: "none", boxSizing: "border-box" }}
              />
            </div>
          </div>

          <div style={{ marginBottom: 24 }}>
            <label style={{ display: "block", color: "rgba(255,255,255,0.5)", fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 8 }}>Password</label>
            <div style={{ position: "relative" }}>
              <Lock style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", width: 16, height: 16, color: "rgba(255,255,255,0.3)" }} />
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Your password"
                required
                style={{ width: "100%", background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 10, color: "white", padding: "12px 12px 12px 42px", fontSize: 14, outline: "none", boxSizing: "border-box" }}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{ width: "100%", padding: "13px", borderRadius: 10, border: "none", background: loading ? "rgba(249,115,22,0.5)" : "linear-gradient(135deg, #f97316, #dc2626)", color: "white", fontWeight: 700, fontSize: 14, cursor: loading ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, boxShadow: "0 4px 16px rgba(249,115,22,0.3)", transition: "all 0.2s" }}
          >
            {loading ? <><Loader2 style={{ width: 16, height: 16, animation: "spin 1s linear infinite" }} /> Signing In...</> : "Sign In to Admin"}
          </button>

          <p style={{ textAlign: "center", marginTop: 20, color: "rgba(255,255,255,0.35)", fontSize: 13 }}>
            Need an account?{" "}
            <Link href="/auth/register" style={{ color: "#fb923c", fontWeight: 600, textDecoration: "none" }}>Request Access</Link>
          </p>
        </form>
      </div>
    </main>
  )
}
