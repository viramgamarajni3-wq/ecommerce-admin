"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { motion } from "framer-motion"
import { Plus, Search, Trash2, Percent, Loader2, Copy } from "lucide-react"
import { adminApi } from "@/lib/api"
import toast from "react-hot-toast"
import { format } from "date-fns"

const DISCOUNT_TYPES = [
  { value: "percentage", label: "Percentage (%)" },
  { value: "fixed",      label: "Fixed Amount (₹)" },
  { value: "free_ship",  label: "Free Shipping" },
]

export default function AdminDiscountsPage() {
  const [search, setSearch] = useState("")
  const qc = useQueryClient()
  const [form, setForm] = useState({ code: "", type: "percentage", value: "", minOrderAmount: "", expiresAt: "", usageLimit: "" })

  const { data, isLoading } = useQuery({
    queryKey: ["admin-discounts"],
    queryFn: () => adminApi.discounts().then(r => r.data.data ?? []),
  })

  const createMutation = useMutation({
    mutationFn: () => adminApi.createDiscount({
      code: form.code.toUpperCase(),
      type: form.type,
      value: form.type !== "free_ship" ? Number(form.value) : 0,
      minOrderAmount: form.minOrderAmount ? Number(form.minOrderAmount) : 0,
      expiresAt: form.expiresAt || null,
      usageLimit: form.usageLimit ? Number(form.usageLimit) : null,
    }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-discounts"] }); setForm({ code: "", type: "percentage", value: "", minOrderAmount: "", expiresAt: "", usageLimit: "" }); toast.success("Discount created!") },
    onError: () => toast.error("Failed to create discount"),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminApi.deleteDiscount(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-discounts"] }); toast.success("Discount deleted") },
    onError: () => toast.error("Failed to delete"),
  })

  const toggleMutation = useMutation({
    mutationFn: ({ id, state }: any) => adminApi.toggleDiscount(id, state),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-discounts"] }),
  })

  const discounts = (data ?? []).filter((d: any) => d.code?.toLowerCase().includes(search.toLowerCase()))

  return (
    <div>
      <div className="mb-6">
        <h1 className="page-title">Discounts</h1>
        <p className="page-subtitle">Create and manage promotional discount codes</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Create form */}
        <div className="card-padded h-fit lg:sticky lg:top-6">
          <h2 className="font-bold text-slate-800 mb-5">New Discount Code</h2>
          <div className="flex flex-col gap-4">
            <div>
              <label className="label">Code *</label>
              <input value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value }))}
                placeholder="SUMMER20" className="input font-mono font-bold uppercase tracking-widest" />
            </div>
            <div>
              <label className="label">Discount Type</label>
              <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                className="input cursor-pointer">
                {DISCOUNT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            {form.type !== "free_ship" && (
              <div>
                <label className="label">Discount Value</label>
                <input type="number" value={form.value} onChange={e => setForm(f => ({ ...f, value: e.target.value }))}
                  placeholder="20" className="input" />
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Min Order (₹)</label>
                <input type="number" value={form.minOrderAmount} onChange={e => setForm(f => ({ ...f, minOrderAmount: e.target.value }))}
                  placeholder="500" className="input" />
              </div>
              <div>
                <label className="label">Usage Limit</label>
                <input type="number" value={form.usageLimit} onChange={e => setForm(f => ({ ...f, usageLimit: e.target.value }))}
                  placeholder="100" className="input" />
              </div>
            </div>
            <div>
              <label className="label">Expires At</label>
              <input type="date" value={form.expiresAt} onChange={e => setForm(f => ({ ...f, expiresAt: e.target.value }))}
                className="input" />
            </div>
            <button onClick={() => form.code.trim() && createMutation.mutate()} disabled={createMutation.isPending || !form.code.trim()}
              className="btn-primary w-full mt-2">
              {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Create Discount
            </button>
          </div>
        </div>

        {/* List */}
        <div className="card overflow-hidden lg:col-span-2">
          <div className="p-4 border-b border-slate-100">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search codes…" className="input pl-9" />
            </div>
          </div>
          
          {isLoading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
            </div>
          ) : discounts.length === 0 ? (
            <div className="text-center py-16 text-slate-400">
              <Percent className="w-10 h-10 mx-auto mb-3 opacity-40" />
              <p className="font-medium text-base">No discount codes yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="table-base">
                <thead>
                  <tr>
                    {["Code", "Type", "Value", "Used / Limit", "Min Order", "Expires", "Status", ""].map(h => (
                      <th key={h} className="table-th">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {discounts.map((d: any, i: number) => (
                    <motion.tr key={d.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                      className="table-row">
                      <td className="table-td">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-sm text-slate-800 bg-slate-100 px-2 py-0.5 rounded-lg">{d.code}</span>
                          <button onClick={() => { navigator.clipboard.writeText(d.code); toast.success("Copied!") }}
                            className="bg-transparent border-none text-slate-400 hover:text-brand-500 cursor-pointer p-0">
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                      <td className="table-td text-xs text-slate-500 capitalize">{d.type?.replace("_", " ")}</td>
                      <td className="table-td font-bold text-brand-500 text-sm">
                        {d.type === "percentage" ? `${d.value}%` : d.type === "fixed" ? `₹${d.value}` : "Free ship"}
                      </td>
                      <td className="table-td text-xs text-slate-500">
                        {d.usage_count ?? 0}{d.usage_limit ? ` / ${d.usage_limit}` : " / ∞"}
                      </td>
                      <td className="table-td text-xs text-slate-500">
                        {d.min_order_amount ? `₹${d.min_order_amount}` : "—"}
                      </td>
                      <td className="table-td text-xs text-slate-400 whitespace-nowrap">
                        {d.expires_at ? format(new Date(d.expires_at), "dd MMM yy") : "Never"}
                      </td>
                      <td className="table-td">
                        <button onClick={() => toggleMutation.mutate({ id: d.id, state: !d.is_active })}
                          className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${d.is_active ? 'bg-brand-500' : 'bg-slate-200'}`}>
                          <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${d.is_active ? 'translate-x-4' : 'translate-x-0'}`} />
                        </button>
                      </td>
                      <td className="table-td">
                        <button onClick={() => deleteMutation.mutate(d.id)}
                          className="btn-icon bg-red-50 text-red-500 hover:bg-red-100">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
