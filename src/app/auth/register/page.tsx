"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { signIn } from "next-auth/react"
import { useState } from "react"
import toast from "react-hot-toast"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:9000/api/v1"

export default function AdminRegisterPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    adminInviteCode: "",
  })

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const res = await fetch(`${API_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, role: "admin" }),
    })
    const payload = await res.json().catch(() => ({}))

    if (!res.ok) {
      setLoading(false)
      return toast.error(payload?.message || "Admin registration failed")
    }

    const login = await signIn("credentials", {
      email: form.email,
      password: form.password,
      redirect: false,
      callbackUrl: "/dashboard",
    })

    setLoading(false)
    if (login?.error) {
      toast.success("Registration successful, please login")
      router.push("/auth/login")
      return
    }

    toast.success("Admin account created")
    router.push("/dashboard")
  }

  return (
    <main className="min-h-screen grid place-items-center bg-slate-950 px-4">
      <form onSubmit={onSubmit} className="w-full max-w-md rounded-xl border border-slate-700 bg-slate-900 p-6 space-y-3">
        <h1 className="text-2xl font-bold text-white">Admin Registration</h1>
        <p className="text-slate-400 text-sm">Invite code required.</p>
        <input className="w-full rounded-md bg-slate-800 text-white px-3 py-2" placeholder="First name" value={form.firstName} onChange={(e) => setForm((s) => ({ ...s, firstName: e.target.value }))} required />
        <input className="w-full rounded-md bg-slate-800 text-white px-3 py-2" placeholder="Last name" value={form.lastName} onChange={(e) => setForm((s) => ({ ...s, lastName: e.target.value }))} required />
        <input className="w-full rounded-md bg-slate-800 text-white px-3 py-2" type="email" placeholder="Email" value={form.email} onChange={(e) => setForm((s) => ({ ...s, email: e.target.value }))} required />
        <input className="w-full rounded-md bg-slate-800 text-white px-3 py-2" placeholder="Phone (optional)" value={form.phone} onChange={(e) => setForm((s) => ({ ...s, phone: e.target.value }))} />
        <input className="w-full rounded-md bg-slate-800 text-white px-3 py-2" type="password" placeholder="Password" value={form.password} onChange={(e) => setForm((s) => ({ ...s, password: e.target.value }))} required />
        <input className="w-full rounded-md bg-slate-800 text-white px-3 py-2" placeholder="Admin invite code" value={form.adminInviteCode} onChange={(e) => setForm((s) => ({ ...s, adminInviteCode: e.target.value }))} required />
        <button className="w-full rounded-md bg-orange-500 text-white py-2 font-semibold disabled:opacity-60" disabled={loading}>
          {loading ? "Creating..." : "Create Admin Account"}
        </button>
        <p className="text-sm text-slate-300">
          Already admin? <Link href="/auth/login" className="text-orange-400">Login</Link>
        </p>
      </form>
    </main>
  )
}
