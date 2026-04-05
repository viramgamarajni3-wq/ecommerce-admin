"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query"
import { adminApi } from "@/lib/api"
import toast from "react-hot-toast"
import { Save, Loader2, Globe, Store, Bell, Shield } from "lucide-react"
import { motion } from "framer-motion"

type SettingsTab = "general" | "notifications" | "security" | "api"

const TABS: { key: SettingsTab; icon: any; label: string }[] = [
  { key: "general",       icon: Store,  label: "General" },
  { key: "notifications", icon: Bell,   label: "Notifications" },
  { key: "security",      icon: Shield, label: "Security" },
  { key: "api",           icon: Globe,  label: "API & Webhooks" },
]

export default function AdminSettingsPage() {
  const qc = useQueryClient()
  const [tab, setTab] = useState<SettingsTab>("general")

  const { data, isLoading } = useQuery({
    queryKey: ["admin-settings"],
    queryFn: () => adminApi.settings().then(r => r.data.data ?? {}),
  })

  const { register, handleSubmit } = useForm<any>({ values: data ?? {} })

  const updateMutation = useMutation({
    mutationFn: (d: any) => adminApi.updateSettings(d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-settings"] }); toast.success("Settings saved!") },
    onError: () => toast.error("Failed to save"),
  })

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="page-title">Settings</h1>
        <p className="page-subtitle">Configure your platform settings</p>
      </div>

      {/* Tab nav */}
      <div className="flex flex-wrap gap-2 mb-6 bg-white p-1.5 rounded-2xl border border-slate-200 w-fit">
        {TABS.map(({ key, icon: Icon, label }) => (
          <button key={key} onClick={() => setTab(key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all border-none ${
              tab === key ? "bg-gradient-to-br from-brand-500 to-brand-600 text-white shadow-sm" : "bg-transparent text-slate-500 hover:text-slate-700"
            }`}>
            <Icon className="w-4 h-4" />{label}
          </button>
        ))}
      </div>

      <motion.div key={tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <form onSubmit={handleSubmit(d => updateMutation.mutate(d))}>

          {/* General */}
          {tab === "general" && (
            <>
              <div className="card-padded mb-5">
                <h2 className="font-bold text-slate-800 mb-5">Platform Info</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div><label className="label">Platform Name</label><input {...register("platform_name")} defaultValue="ShopHub" className="input" /></div>
                  <div><label className="label">Support Email</label><input type="email" {...register("support_email")} className="input" placeholder="support@shophub.in" /></div>
                  <div><label className="label">Support Phone</label><input {...register("support_phone")} className="input" placeholder="+91 80000 00000" /></div>
                  <div><label className="label">Default Currency</label>
                    <select {...register("default_currency")} className="input cursor-pointer">
                      <option value="INR">INR — Indian Rupee (₹)</option>
                      <option value="USD">USD — US Dollar ($)</option>
                    </select>
                  </div>
                  <div className="sm:col-span-2"><label className="label">Platform Tagline</label><input {...register("tagline")} className="input" placeholder="India's trusted multi-vendor marketplace" /></div>
                  <div className="sm:col-span-2"><label className="label">Platform Description (for SEO)</label>
                    <textarea {...register("description")} rows={3} className="input resize-y" /></div>
                </div>
              </div>

              <div className="card-padded mb-5">
                <h2 className="font-bold text-slate-800 mb-5">Commission & Fees</h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div><label className="label">Platform Commission (%)</label><input type="number" step="0.1" {...register("commission_rate")} defaultValue="10" className="input" /></div>
                  <div><label className="label">Payment Gateway Fee (%)</label><input type="number" step="0.01" {...register("payment_fee")} defaultValue="2" className="input" /></div>
                  <div><label className="label">Min Payout Amount (₹)</label><input type="number" {...register("min_payout")} defaultValue="1000" className="input" /></div>
                </div>
              </div>

              <div className="card-padded mb-6">
                <h2 className="font-bold text-slate-800 mb-5">Order Settings</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div><label className="label">Auto-Cancel Unpaid Orders After (hrs)</label><input type="number" {...register("auto_cancel_hours")} defaultValue="24" className="input" /></div>
                  <div><label className="label">Return Window (days)</label><input type="number" {...register("return_window_days")} defaultValue="7" className="input" /></div>
                </div>
              </div>
            </>
          )}

          {/* Notifications */}
          {tab === "notifications" && (
            <div className="card-padded mb-6">
              <h2 className="font-bold text-slate-800 mb-5">Email Notifications</h2>
              <div className="flex flex-col gap-3">
                {[
                  "Send order confirmation emails",
                  "Send shipping notification emails",
                  "Send admin alert on new order",
                  "Send vendor payout notifications",
                  "Send refund confirmation emails",
                  "Send weekly sales report to admin",
                ].map(label => (
                  <label key={label} className="flex items-center gap-3 cursor-pointer p-3 rounded-xl bg-slate-50 border border-slate-100 hover:bg-slate-100 transition-colors">
                    <input type="checkbox" defaultChecked {...register(label.toLowerCase().replace(/\s+/g, "_"))}
                      className="w-4 h-4 text-brand-500 rounded border-slate-300 focus:ring-brand-500 cursor-pointer" />
                    <span className="text-sm font-semibold text-slate-700">{label}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Security */}
          {tab === "security" && (
            <div className="card-padded mb-6">
              <h2 className="font-bold text-slate-800 mb-5">Security Settings</h2>
              <div className="flex flex-col gap-4">
                {[
                  { label: "Maximum Login Attempts", key: "max_login_attempts", type: "number", placeholder: "5" },
                  { label: "Session Timeout (minutes)", key: "session_timeout", type: "number", placeholder: "480" },
                  { label: "Allowed Origins (CORS)", key: "allowed_origins", placeholder: "https://shophub.in,http://localhost:3000" },
                ].map(({ label, key, type, placeholder }) => (
                  <div key={key}>
                    <label className="label">{label}</label>
                    <input type={type ?? "text"} {...register(key)} placeholder={placeholder} className="input" />
                  </div>
                ))}
                <div>
                  <label className="label">JWT Secret Key (masked)</label>
                  <input type="password" {...register("jwt_secret")} placeholder="••••••••••••••••" className="input" />
                </div>
              </div>
            </div>
          )}

          {/* API */}
          {tab === "api" && (
            <div className="card-padded mb-6">
              <h2 className="font-bold text-slate-800 mb-5">API & Webhooks</h2>
              <div className="flex flex-col gap-4">
                {[
                  { label: "Razorpay Key ID",         key: "razorpay_key_id",         placeholder: "rzp_live_XXXXXX" },
                  { label: "Razorpay Key Secret",     key: "razorpay_key_secret",     placeholder: "••••••••••••••••", masked: true },
                  { label: "Cloudinary Cloud Name",   key: "cloudinary_cloud_name",   placeholder: "my-cloud" },
                  { label: "Cloudinary API Key",      key: "cloudinary_api_key",      placeholder: "123456789" },
                  { label: "SMTP Host",               key: "smtp_host",               placeholder: "smtp.gmail.com" },
                  { label: "SMTP Port",               key: "smtp_port",               placeholder: "587", type: "number" },
                  { label: "SMTP User",               key: "smtp_user",               placeholder: "noreply@shophub.in" },
                  { label: "Order Webhook URL",       key: "order_webhook_url",       placeholder: "https://yoursite.com/api/webhooks/order" },
                ].map(({ label, key, placeholder, masked, type }) => (
                  <div key={key}>
                    <label className="label">{label}</label>
                    <input type={masked ? "password" : type ?? "text"} {...register(key)} placeholder={placeholder} className="input" />
                  </div>
                ))}
              </div>
            </div>
          )}

          <button type="submit" disabled={updateMutation.isPending} className="btn-primary">
            {updateMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Settings
          </button>
        </form>
      </motion.div>
    </div>
  )
}
