"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { adminApi } from "@/lib/api"
import { motion } from "framer-motion"
import { format } from "date-fns"
import {
  ArrowLeft, Loader2, Store, CheckCircle, XCircle, Package, ShoppingBag,
  DollarSign, Star, Mail, Phone, Globe, MapPin, BarChart3, Wallet,
  KeyRound, Eye, EyeOff, Shield
} from "lucide-react"
import Link from "next/link"
import toast from "react-hot-toast"
import { useState } from "react"

const INFO_ROW = ({ label, value }: { label: string; value: string }) => (
  <div className="flex gap-3 py-2 border-b border-slate-50 last:border-0">
    <span className="text-xs font-bold text-slate-400 w-28 shrink-0 pt-0.5">{label}</span>
    <span className="text-sm text-slate-700">{value || "—"}</span>
  </div>
)

export default function AdminVendorDetailPage({ params }: { params: { id: string } }) {
  const qc = useQueryClient()
  const [showPwPanel, setShowPwPanel] = useState(false)
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPw, setShowPw] = useState(false)

  const { data, isLoading, error } = useQuery({
    queryKey: ["admin-vendor", params.id],
    queryFn: () => adminApi.getVendor(params.id).then(r => r.data.data),
    retry: 1,
  })

  const approveMutation = useMutation({
    mutationFn: () => adminApi.approveVendor(params.id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-vendor", params.id] }); toast.success("Vendor approved!") },
    onError: () => toast.error("Failed to approve vendor"),
  })
  const suspendMutation = useMutation({
    mutationFn: () => adminApi.suspendVendor(params.id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-vendor", params.id] }); toast.success("Vendor suspended") },
    onError: () => toast.error("Failed to suspend vendor"),
  })
  const resetPasswordMutation = useMutation({
    mutationFn: () => adminApi.resetVendorPassword(params.id, newPassword),
    onSuccess: () => {
      toast.success("Password changed successfully!")
      setNewPassword("")
      setConfirmPassword("")
      setShowPwPanel(false)
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || "Failed to change password"),
  })

  const handleResetPassword = () => {
    if (newPassword.length < 6) return toast.error("Password must be at least 6 characters")
    if (newPassword !== confirmPassword) return toast.error("Passwords do not match")
    resetPasswordMutation.mutate()
  }

  if (isLoading) return (
    <div className="flex justify-center items-center h-64">
      <Loader2 className="w-10 h-10 animate-spin text-brand-500" />
    </div>
  )

  if (!data || error) return (
    <div className="text-center py-20 text-slate-400">
      <Store className="w-12 h-12 mx-auto mb-4 text-slate-200" />
      <p className="text-lg font-semibold text-slate-500 mb-2">Vendor not found</p>
      <p className="text-sm mb-6">The vendor with ID <code className="bg-slate-100 px-1 rounded text-xs">{params.id}</code> does not exist.</p>
      <Link href="/dashboard/vendors" className="inline-flex items-center gap-2 text-brand-500 font-semibold no-underline hover:text-brand-600">
        <ArrowLeft className="w-4 h-4" /> Back to Vendors
      </Link>
    </div>
  )

  const v = data
  const statusCls = v.status === "approved" ? "badge-green" : v.status === "suspended" ? "badge-red" : "badge-orange"

  const stats = [
    { label: "Products",   value: v.product_count ?? 0,  icon: Package,    grad: "from-blue-500 to-blue-600" },
    { label: "Orders",     value: v.order_count ?? 0,    icon: ShoppingBag, grad: "from-violet-500 to-violet-600" },
    { label: "Revenue",    value: `₹${Number(v.total_revenue ?? 0).toLocaleString("en-IN")}`, icon: DollarSign, grad: "from-emerald-500 to-emerald-600" },
    { label: "Avg Rating", value: v.avg_rating && Number(v.avg_rating) > 0 ? `${Number(v.avg_rating).toFixed(1)} ★` : "—", icon: Star, grad: "from-amber-500 to-orange-500" },
  ]

  return (
    <div className="max-w-5xl">
      {/* Back + Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-8">
        <Link href="/dashboard/vendors" className="btn-secondary w-9 h-9 !p-0 shrink-0 no-underline">
          <ArrowLeft className="w-4 h-4" />
        </Link>

        <div className="flex items-center gap-4 flex-1 min-w-0">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-2xl text-white font-extrabold shrink-0">
            {(v.store_name ?? "V").charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="page-title truncate">{v.store_name}</h1>
              <span className={`badge ${statusCls} capitalize`}>{v.status}</span>
            </div>
            <p className="page-subtitle">{v.first_name} {v.last_name} · {v.email}</p>
          </div>
        </div>

        <div className="flex gap-2 shrink-0 flex-wrap">
          {/* Change Password Button */}
          <button
            onClick={() => setShowPwPanel(p => !p)}
            className="btn-secondary text-xs gap-2"
          >
            <KeyRound className="w-3.5 h-3.5" />
            Reset Password
          </button>

          {v.status !== "approved" && (
            <button onClick={() => approveMutation.mutate()} disabled={approveMutation.isPending} className="btn-success">
              <CheckCircle className="w-4 h-4" /> Approve
            </button>
          )}
          {v.status === "approved" && (
            <button onClick={() => suspendMutation.mutate()} disabled={suspendMutation.isPending} className="btn-danger">
              <XCircle className="w-4 h-4" /> Suspend
            </button>
          )}
        </div>
      </div>

      {/* ── Change Password Panel ─────────────── */}
      {showPwPanel && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="card-padded mb-6 border-2 border-orange-100 bg-orange-50/40"
        >
          <div className="flex items-center gap-2 mb-5">
            <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center">
              <Shield className="w-4 h-4 text-orange-500" />
            </div>
            <div>
              <div className="font-bold text-slate-800 text-sm">Reset Vendor Password</div>
              <div className="text-xs text-slate-400">Set a new password for <strong>{v.email}</strong></div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="label text-xs mb-1.5">New Password</label>
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"}
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="Min. 6 characters"
                  className="input pr-10"
                />
                <button type="button" onClick={() => setShowPw(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div>
              <label className="label text-xs mb-1.5">Confirm Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="Repeat password"
                className="input"
              />
            </div>
          </div>

          {newPassword && confirmPassword && newPassword !== confirmPassword && (
            <p className="text-xs text-red-500 mb-3">⚠ Passwords do not match</p>
          )}

          <div className="flex gap-3">
            <button
              onClick={handleResetPassword}
              disabled={resetPasswordMutation.isPending || !newPassword || !confirmPassword}
              className="btn-primary text-xs"
            >
              {resetPasswordMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />}
              {resetPasswordMutation.isPending ? "Updating..." : "Update Password"}
            </button>
            <button onClick={() => { setShowPwPanel(false); setNewPassword(""); setConfirmPassword("") }} className="btn-secondary text-xs">
              Cancel
            </button>
          </div>
        </motion.div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {stats.map(({ label, value, icon: Icon, grad }, i) => (
          <motion.div key={label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07 }}
            className={`stat-card bg-gradient-to-br ${grad}`}>
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center mb-3">
              <Icon className="w-4 h-4 text-white" />
            </div>
            <div className="stat-card-value">{value}</div>
            <div className="stat-card-label">{label}</div>
          </motion.div>
        ))}
      </div>

      {/* Info grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        {/* Business */}
        <div className="card-padded">
          <div className="flex items-center gap-2 mb-4">
            <Store className="w-4 h-4 text-brand-500" />
            <span className="font-bold text-slate-800">Business Details</span>
          </div>
          <INFO_ROW label="Store Slug"   value={v.store_slug} />
          <INFO_ROW label="GSTIN"        value={v.gst_number ?? v.gstin} />
          <INFO_ROW label="PAN"          value={v.pan} />
          <INFO_ROW label="Category"     value={v.business_category} />
          <INFO_ROW label="Description"  value={v.description ?? v.store_description} />
        </div>

        {/* Contact */}
        <div className="card-padded">
          <div className="flex items-center gap-2 mb-4">
            <Mail className="w-4 h-4 text-blue-500" />
            <span className="font-bold text-slate-800">Contact</span>
          </div>
          {[
            { icon: Mail,   label: "Email",   value: v.email },
            { icon: Phone,  label: "Phone",   value: v.phone },
            { icon: Globe,  label: "Website", value: v.website },
            { icon: MapPin, label: "Address", value: v.address },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex gap-3 py-2 border-b border-slate-50 last:border-0">
              <Icon className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs text-slate-400 font-semibold">{label}</p>
                <p className="text-sm text-slate-700">{value || "—"}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Bank */}
        <div className="card-padded">
          <div className="flex items-center gap-2 mb-4">
            <Wallet className="w-4 h-4 text-emerald-500" />
            <span className="font-bold text-slate-800">Bank / Payout</span>
          </div>
          <INFO_ROW label="Bank"      value={v.bank_name} />
          <INFO_ROW label="Account"   value={v.bank_account_number ? `****${v.bank_account_number.slice(-4)}` : ""} />
          <INFO_ROW label="IFSC"      value={v.bank_ifsc} />
          <INFO_ROW label="UPI"       value={v.upi_id} />
          <INFO_ROW label="Frequency" value={v.payout_frequency} />
        </div>

        {/* Meta */}
        <div className="card-padded">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-4 h-4 text-violet-500" />
            <span className="font-bold text-slate-800">Account Meta</span>
          </div>
          <INFO_ROW label="Registered"    value={v.created_at ? format(new Date(v.created_at), "dd MMM yyyy") : ""} />
          <INFO_ROW label="Last Active"   value={v.last_active_at ? format(new Date(v.last_active_at), "dd MMM yyyy") : ""} />
          <INFO_ROW label="Approved At"   value={v.approved_at ? format(new Date(v.approved_at), "dd MMM yyyy") : ""} />
          <INFO_ROW label="Return Policy" value={v.return_policy} />
        </div>
      </div>

      {/* Recent Products */}
      {(v.products ?? []).length > 0 && (
        <div className="card overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <span className="font-bold text-slate-800">Recent Products ({(v.products ?? []).length})</span>
          </div>
          <div className="divide-y divide-slate-50">
            {(v.products ?? []).slice(0, 8).map((p: any) => (
              <div key={p.id} className="flex items-center gap-3 px-5 py-3">
                {p.image_url
                  ? <img src={p.image_url} alt={p.name} className="w-9 h-9 rounded-lg object-cover shrink-0" />
                  : <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                      <Package className="w-4 h-4 text-slate-300" />
                    </div>}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-slate-800 truncate">{p.name}</p>
                  <p className="text-xs text-slate-400">SKU: {p.sku ?? "—"}</p>
                </div>
                <span className="font-bold text-brand-500 text-sm whitespace-nowrap">₹{Number(p.price ?? 0).toLocaleString("en-IN")}</span>
                <span className={`badge ${p.status === "active" ? "badge-green" : "badge-gray"}`}>{p.status ?? "draft"}</span>
              </div>
            ))}
          </div>
          <div className="px-5 py-3 text-center">
            <Link href={`/dashboard/products?vendor=${params.id}`}
              className="text-sm text-brand-500 font-semibold no-underline hover:text-brand-600">
              View all products →
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
