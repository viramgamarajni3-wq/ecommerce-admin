"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { motion } from "framer-motion"
import { Truck, CreditCard, Plus, Trash2, Loader2, ToggleLeft, ToggleRight } from "lucide-react"
import { adminApi } from "@/lib/api"
import toast from "react-hot-toast"

const FULFILLMENT_OPTIONS = [
  { value: "manual",     label: "Manual" },
  { value: "shiprocket", label: "Shiprocket" },
  { value: "delhivery",  label: "Delhivery" },
  { value: "bluedart",   label: "BlueDart" },
  { value: "easypost",   label: "EasyPost" },
  { value: "fedex",      label: "FedEx" },
]

const PAYMENT_PROVIDERS = [
  { id: "razorpay", label: "Razorpay",          emoji: "💳", desc: "India's leading payment gateway" },
  { id: "stripe",   label: "Stripe",            emoji: "💠", desc: "Global payment processing" },
  { id: "paypal",   label: "PayPal",            emoji: "🅿️", desc: "Global digital wallet" },
  { id: "cod",      label: "Cash on Delivery",  emoji: "💵", desc: "Pay at point of delivery" },
]

export default function AdminProvidersPage() {
  const qc = useQueryClient()
  const [tab, setTab] = useState<"fulfillment" | "payment">("fulfillment")
  const [ffForm, setFfForm] = useState({ name: "", type: "manual", api_key: "" })

  const { data: ffData, isLoading: ffLoading } = useQuery({
    queryKey: ["admin-fulfillment-providers"],
    queryFn: () => adminApi.fulfillmentProviders().then(r => r.data.data ?? []),
  })

  const createFfMutation = useMutation({
    mutationFn: () => adminApi.createFulfillmentProvider(ffForm),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-fulfillment-providers"] }); setFfForm({ name: "", type: "manual", api_key: "" }); toast.success("Provider added!") },
    onError: () => toast.error("Failed to add"),
  })

  const deleteFfMutation = useMutation({
    mutationFn: (id: string) => adminApi.deleteFulfillmentProvider(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-fulfillment-providers"] }); toast.success("Removed") },
  })

  const { data: pmData } = useQuery({
    queryKey: ["admin-payment-providers"],
    queryFn: () => adminApi.paymentProviders().then(r => r.data.data ?? []),
  })

  const togglePaymentMutation = useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) => adminApi.togglePaymentProvider(id, active),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-payment-providers"] }); toast.success("Updated!") },
  })

  const ffProviders = ffData ?? []
  const pmProviders = pmData ?? []

  return (
    <div className="max-w-4xl">
      <div className="mb-6">
        <h1 className="page-title">Providers</h1>
        <p className="page-subtitle">Manage fulfillment carriers and payment gateways</p>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-1 bg-white p-1.5 rounded-2xl border border-slate-100 shadow-sm w-fit mb-6">
        {[
          { key: "fulfillment", icon: Truck,       label: "Fulfillment" },
          { key: "payment",     icon: CreditCard,  label: "Payment" },
        ].map(({ key, icon: Icon, label }) => (
          <button key={key} onClick={() => setTab(key as any)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold border-none cursor-pointer transition-all
              ${tab === key ? "text-white" : "text-slate-500 bg-transparent hover:text-slate-700"}`}
            style={tab === key ? { background: "linear-gradient(135deg,#f97316,#ea580c)" } : {}}>
            <Icon className="w-4 h-4" />{label} Providers
          </button>
        ))}
      </div>

      {/* Fulfillment tab */}
      {tab === "fulfillment" && (
        <div>
          {/* Add form */}
          <div className="card-padded mb-5">
            <h2 className="font-bold text-slate-800 mb-4">Add Fulfillment Provider</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
              <div>
                <label className="label">Display Name *</label>
                <input value={ffForm.name} onChange={e => setFfForm(f => ({ ...f, name: e.target.value }))}
                  className="input" placeholder="Shiprocket India" />
              </div>
              <div>
                <label className="label">Provider Type</label>
                <select value={ffForm.type} onChange={e => setFfForm(f => ({ ...f, type: e.target.value }))}
                  className="input cursor-pointer">
                  {FULFILLMENT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
              <div>
                <label className="label">API Key (optional)</label>
                <input value={ffForm.api_key} onChange={e => setFfForm(f => ({ ...f, api_key: e.target.value }))}
                  className="input font-mono text-xs" placeholder="sk_live_..." />
              </div>
            </div>
            <button onClick={() => ffForm.name.trim() && createFfMutation.mutate()}
              disabled={!ffForm.name.trim() || createFfMutation.isPending}
              className="btn-primary">
              {createFfMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Add Provider
            </button>
          </div>

          {/* Providers list */}
          {ffLoading ? (
            <div className="card-padded flex justify-center py-10"><Loader2 className="w-8 h-8 animate-spin text-brand-500" /></div>
          ) : ffProviders.length === 0 ? (
            <div className="card-padded text-center py-14 text-slate-400">
              <Truck className="w-10 h-10 mx-auto mb-3 opacity-40" />
              <p className="font-semibold">No fulfillment providers configured</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {ffProviders.map((p: any, i: number) => (
                <motion.div key={p.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06 }}
                  className="card p-5 flex items-center gap-4 group">
                  <div className="w-12 h-12 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center shrink-0">
                    <Truck className="w-5 h-5 text-brand-500" />
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-slate-800">{p.name}</p>
                    <div className="flex gap-2 mt-1 flex-wrap">
                      <span className="badge badge-gray">{p.type}</span>
                      {p.api_key && <span className="badge badge-green">API Key ✓</span>}
                    </div>
                  </div>
                  <button onClick={() => deleteFfMutation.mutate(p.id)}
                    className="btn-icon bg-red-50 text-red-400 hover:bg-red-100 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Payment tab */}
      {tab === "payment" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {PAYMENT_PROVIDERS.map((provider, i) => {
            const cfg = pmProviders.find((p: any) => p.id === provider.id) ?? { is_active: false }
            return (
              <motion.div key={provider.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07 }} className="card p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl leading-none">{provider.emoji}</span>
                    <div>
                      <p className="font-bold text-slate-800">{provider.label}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{provider.desc}</p>
                    </div>
                  </div>
                  <button onClick={() => togglePaymentMutation.mutate({ id: provider.id, active: !cfg.is_active })}
                    className="border-none bg-transparent cursor-pointer p-0">
                    {cfg.is_active
                      ? <ToggleRight className="w-8 h-8 text-emerald-500" />
                      : <ToggleLeft className="w-8 h-8 text-slate-300" />}
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${cfg.is_active ? "bg-emerald-500" : "bg-slate-300"}`} />
                  <span className={`text-xs font-semibold ${cfg.is_active ? "text-emerald-600" : "text-slate-400"}`}>
                    {cfg.is_active ? "Enabled" : "Disabled"}
                  </span>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}
