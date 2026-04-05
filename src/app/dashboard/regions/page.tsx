"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { motion } from "framer-motion"
import { Globe, Plus, Trash2, Loader2 } from "lucide-react"
import { adminApi } from "@/lib/api"
import toast from "react-hot-toast"

const CURRENCIES = [
  { code: "INR", symbol: "₹", name: "Indian Rupee" },
  { code: "USD", symbol: "$", name: "US Dollar" },
  { code: "EUR", symbol: "€", name: "Euro" },
  { code: "GBP", symbol: "£", name: "British Pound" },
  { code: "AED", symbol: "د.إ", name: "UAE Dirham" },
]

const REGION_COLORS = [
  "from-violet-500 to-indigo-600",
  "from-blue-500 to-cyan-600",
  "from-emerald-500 to-teal-600",
  "from-orange-500 to-rose-600",
  "from-pink-500 to-fuchsia-600",
]

export default function AdminRegionsPage() {
  const qc = useQueryClient()
  const [form, setForm] = useState({ name: "", currency: "INR", taxRate: "18" })

  const { data, isLoading } = useQuery({
    queryKey: ["admin-regions"],
    queryFn: () => adminApi.regions().then(r => r.data.data ?? []),
  })

  const createMutation = useMutation({
    mutationFn: () => adminApi.createRegion({ name: form.name, currency: form.currency, taxRate: Number(form.taxRate) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-regions"] }); setForm({ name: "", currency: "INR", taxRate: "18" }); toast.success("Region created!") },
    onError: () => toast.error("Failed to create region"),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminApi.deleteRegion(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-regions"] }); toast.success("Region deleted") },
  })

  const regions = data ?? []

  return (
    <div>
      <div className="mb-6">
        <h1 className="page-title">Regions</h1>
        <p className="page-subtitle">Define geographic regions with custom currencies and tax defaults</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-6">
        {/* Create form */}
        <div className="card-padded h-fit">
          <h2 className="font-bold text-slate-800 mb-5">Add Region</h2>
          <div className="flex flex-col gap-4">
            <div>
              <label className="label">Region Name *</label>
              <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="e.g. India, US East" className="input" />
            </div>
            <div>
              <label className="label">Currency</label>
              <select value={form.currency} onChange={e => setForm(f => ({ ...f, currency: e.target.value }))}
                className="input cursor-pointer">
                {CURRENCIES.map(c => (
                  <option key={c.code} value={c.code}>{c.symbol} {c.name} ({c.code})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Default Tax Rate (%)</label>
              <input type="number" min="0" max="100" value={form.taxRate}
                onChange={e => setForm(f => ({ ...f, taxRate: e.target.value }))}
                placeholder="18" className="input" />
            </div>
            <button onClick={() => form.name.trim() && createMutation.mutate()}
              disabled={!form.name.trim() || createMutation.isPending}
              className="btn-primary w-full justify-center">
              {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Add Region
            </button>
          </div>

          <div className="mt-5 bg-slate-50 rounded-xl p-4">
            <p className="text-2xl font-extrabold text-brand-500">{regions.length}</p>
            <p className="text-sm text-slate-500">Regions defined</p>
          </div>
        </div>

        {/* Regions list */}
        <div>
          {isLoading ? (
            <div className="card-padded flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
            </div>
          ) : regions.length === 0 ? (
            <div className="card-padded text-center py-14 text-slate-400">
              <Globe className="w-10 h-10 mx-auto mb-3 opacity-40" />
              <p className="font-semibold">No regions defined yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {regions.map((r: any, i: number) => {
                const curr = CURRENCIES.find(c => c.code === r.currency) ?? CURRENCIES[0]
                const grad = REGION_COLORS[i % REGION_COLORS.length]
                return (
                  <motion.div key={r.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.06 }} className="card p-5 flex items-center gap-4 group">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${grad} flex items-center justify-center shrink-0 text-2xl`}>
                      🌏
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-slate-800">{r.name}</p>
                      <p className="text-sm text-slate-500">{curr.symbol} {curr.name} · Tax {r.tax_rate}%</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="badge badge-purple text-[11px]">{r.currency}</span>
                      <button onClick={() => deleteMutation.mutate(r.id)}
                        className="btn-icon bg-red-50 text-red-400 hover:bg-red-100 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
