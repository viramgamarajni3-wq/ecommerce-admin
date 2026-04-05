"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { motion } from "framer-motion"
import { Plus, Trash2, Tag, Loader2, ChevronDown, ChevronRight } from "lucide-react"
import { adminApi } from "@/lib/api"
import toast from "react-hot-toast"
import { format } from "date-fns"

export default function AdminPriceListsPage() {
  const qc = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: "", description: "", type: "sale", startsAt: "", endsAt: "" })
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [newPrice, setNewPrice] = useState<Record<string, { variantId: string; amount: string }>>({})

  const { data, isLoading } = useQuery({
    queryKey: ["admin-price-lists"],
    queryFn: () => adminApi.priceLists().then(r => r.data.data ?? []),
  })

  const createMutation = useMutation({
    mutationFn: () => adminApi.createPriceList(form),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-price-lists"] }); setShowForm(false); setForm({ name: "", description: "", type: "sale", startsAt: "", endsAt: "" }); toast.success("Price list created!") },
    onError: () => toast.error("Failed to create"),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminApi.deletePriceList(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-price-lists"] }); toast.success("Deleted") },
  })

  const addPriceMutation = useMutation({
    mutationFn: ({ listId, data }: any) => adminApi.addPriceListPrice(listId, data),
    onSuccess: (_, vars) => { qc.invalidateQueries({ queryKey: ["admin-price-lists"] }); setNewPrice(p => ({ ...p, [vars.listId]: { variantId: "", amount: "" } })); toast.success("Price added!") },
  })

  const priceLists = data ?? []

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="page-title">Price Lists</h1>
          <p className="page-subtitle">Create bulk pricing rules and sale prices for variants</p>
        </div>
        <button onClick={() => setShowForm(v => !v)} className="btn-primary">
          <Plus className="w-4 h-4" /> New Price List
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="card-padded border-[1.5px] border-orange-200 mb-6 bg-orange-50/30 shadow-brand">
          <h2 className="font-bold text-slate-800 mb-4">New Price List</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="label">Name *</label>
              <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Summer Sale 2025"
                className="input bg-white" />
            </div>
            <div>
              <label className="label">Type</label>
              <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                className="input bg-white cursor-pointer">
                <option value="sale">Sale</option>
                <option value="override">Override</option>
              </select>
            </div>
            <div>
              <label className="label">Starts At</label>
              <input type="date" value={form.startsAt} onChange={e => setForm(f => ({ ...f, startsAt: e.target.value }))}
                className="input bg-white" />
            </div>
            <div>
              <label className="label">Ends At</label>
              <input type="date" value={form.endsAt} onChange={e => setForm(f => ({ ...f, endsAt: e.target.value }))}
                className="input bg-white" />
            </div>
            <div className="sm:col-span-2">
              <label className="label">Description</label>
              <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2}
                className="input bg-white resize-y" />
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={() => form.name.trim() && createMutation.mutate()} disabled={!form.name.trim() || createMutation.isPending}
              className="btn-primary">
              {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} Create
            </button>
            <button onClick={() => setShowForm(false)} className="btn-secondary bg-white">Cancel</button>
          </div>
        </motion.div>
      )}

      {/* Price lists */}
      {isLoading ? (
        <div className="text-center py-16"><Loader2 className="w-8 h-8 animate-spin text-brand-500 mx-auto" /></div>
      ) : priceLists.length === 0 ? (
        <div className="text-center py-20 text-slate-400">
          <Tag className="w-12 h-12 mx-auto mb-4 opacity-40" />
          <h2 className="font-bold text-xl text-slate-800 mb-2">No price lists yet</h2>
          <p className="font-medium">Create your first price list to manage bulk pricing</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {priceLists.map((pl: any, i: number) => {
            const isExpanded = expandedId === pl.id
            const prices = pl.prices ?? []
            return (
              <motion.div key={pl.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                className="card overflow-hidden transition-shadow hover:shadow-md">
                <div className="flex items-center justify-between p-5 cursor-pointer bg-white hover:bg-slate-50 transition-colors"
                  onClick={() => setExpandedId(isExpanded ? null : pl.id)}>
                  <div className="flex gap-4 items-center">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-sm
                      ${pl.type === "sale" ? "bg-gradient-to-br from-brand-500 to-brand-600" : "bg-gradient-to-br from-indigo-500 to-indigo-600"}`}>
                      <Tag className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <div className="font-bold text-base text-slate-800">{pl.name}</div>
                      <div className="text-xs font-semibold text-slate-400 tracking-wide mt-1">
                        <span className={`uppercase font-bold ${pl.type === "sale" ? "text-brand-500" : "text-indigo-500"}`}>
                          {pl.type === "sale" ? "Sale price" : "Override price"}
                        </span>
                        {" · "}
                        {pl.starts_at ? format(new Date(pl.starts_at), "dd MMM") : "No start"} – {pl.ends_at ? format(new Date(pl.ends_at), "dd MMM yyyy") : "No end"}
                        {" · "}
                        <span className="text-slate-500">{prices.length} items</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-4 items-center pl-4 border-l border-slate-100 ml-4 max-sm:hidden">
                    <button onClick={e => { e.stopPropagation(); deleteMutation.mutate(pl.id) }}
                      className="btn-icon bg-red-50 text-red-500 hover:bg-red-100">
                      <Trash2 className="w-4 h-4" />
                    </button>
                    {isExpanded ? <ChevronDown className="w-5 h-5 text-slate-400" /> : <ChevronRight className="w-5 h-5 text-slate-400" />}
                  </div>
                </div>

                {/* Mobile actions via CSS */}
                <div className="sm:hidden flex justify-between px-5 pb-4 border-t border-slate-50 pt-3 bg-white">
                  <button onClick={e => { e.stopPropagation(); deleteMutation.mutate(pl.id) }}
                    className="btn-icon bg-red-50 text-red-500 hover:bg-red-100 h-8 font-semibold px-3 w-auto text-xs gap-1">
                    <Trash2 className="w-3.5 h-3.5" /> Delete
                  </button>
                  <button className="btn-secondary h-8 text-xs px-3">
                    {isExpanded ? "Close" : "Open"}
                  </button>
                </div>

                {isExpanded && (
                  <div className="border-t border-slate-100 p-5 bg-slate-50/50">
                    {/* Add price row */}
                    <div className="flex flex-wrap sm:flex-nowrap gap-3 mb-5">
                      <input placeholder="Variant ID" value={newPrice[pl.id]?.variantId ?? ""}
                        onChange={e => setNewPrice(p => ({ ...p, [pl.id]: { ...p[pl.id], variantId: e.target.value } }))}
                        className="input py-2 text-sm sm:flex-[2] bg-white font-mono" />
                      <input type="number" placeholder="Price (₹)" value={newPrice[pl.id]?.amount ?? ""}
                        onChange={e => setNewPrice(p => ({ ...p, [pl.id]: { ...p[pl.id], amount: e.target.value } }))}
                        className="input py-2 text-sm sm:flex-[1] bg-white" />
                      <button onClick={() => { const p = newPrice[pl.id]; if (p?.variantId && p?.amount) addPriceMutation.mutate({ listId: pl.id, data: { variant_id: p.variantId, amount: Number(p.amount) } }) }}
                        className="btn-primary py-2 px-4 whitespace-nowrap w-full sm:w-auto">
                        + Add Price
                      </button>
                    </div>
                    {/* Price rows */}
                    <div className="bg-white border text-sm border-slate-200 rounded-xl overflow-hidden shadow-sm">
                      {prices.length === 0 ? (
                        <p className="text-slate-400 text-sm text-center p-6">No prices added yet</p>
                      ) : prices.map((p: any) => (
                        <div key={p.id} className="flex justify-between p-3 border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors">
                          <span className="text-sm font-mono text-slate-500 font-medium">{p.variant_id}</span>
                          <span className="font-bold text-brand-500">₹{Number(p.amount).toLocaleString("en-IN")}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}
