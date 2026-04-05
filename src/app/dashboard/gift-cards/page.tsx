"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { motion } from "framer-motion"
import { Plus, Trash2, Gift, Loader2, Copy } from "lucide-react"
import { adminApi } from "@/lib/api"
import toast from "react-hot-toast"
import { format } from "date-fns"

export default function AdminGiftCardsPage() {
  const qc = useQueryClient()
  const [form, setForm] = useState({ code: "", balance: "", expiresAt: "" })

  const { data, isLoading } = useQuery({
    queryKey: ["admin-gift-cards"],
    queryFn: () => adminApi.giftCards().then(r => r.data.data ?? []),
  })

  const createMutation = useMutation({
    mutationFn: () => adminApi.createGiftCard({ code: form.code.toUpperCase() || undefined, balance: Number(form.balance), expiresAt: form.expiresAt || null }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-gift-cards"] }); setForm({ code: "", balance: "", expiresAt: "" }); toast.success("Gift card created!") },
    onError: () => toast.error("Failed to create gift card"),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminApi.deleteGiftCard(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-gift-cards"] }); toast.success("Gift card deleted") },
  })

  const giftCards = data ?? []
  const totalValue = giftCards.reduce((s: number, g: any) => s + Number(g.balance ?? 0), 0)
  const totalRedeemedValue = giftCards.reduce((s: number, g: any) => s + Number(g.redeemed_amount ?? 0), 0)

  return (
    <div>
      <div className="mb-6">
        <h1 className="page-title">Gift Cards</h1>
        <p className="page-subtitle">Issue and manage gift cards for customers</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
        {[
          { label: "Total Cards", value: String(giftCards.length), gradient: "from-pink-500 to-purple-600" },
          { label: "Total Value", value: `₹${totalValue.toLocaleString("en-IN")}`, gradient: "from-brand-500 to-orange-600" },
          { label: "Redeemed", value: `₹${totalRedeemedValue.toLocaleString("en-IN")}`, gradient: "from-emerald-500 to-teal-600" },
        ].map(({ label, value, gradient }) => (
          <div key={label} className={`rounded-2xl p-6 text-white shadow-lg bg-gradient-to-br ${gradient}`}>
            <div className="text-3xl font-extrabold font-outfit">{value}</div>
            <div className="text-xs font-semibold text-white/80 uppercase tracking-widest mt-2">{label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Create form */}
        <div className="card-padded h-fit lg:sticky lg:top-6">
          <h2 className="font-bold text-slate-800 mb-5">Issue Gift Card</h2>
          <div className="flex flex-col gap-4">
            <div>
              <label className="label">Custom Code (optional)</label>
              <input value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value }))}
                placeholder="AUTO-GENERATED"
                className="input font-mono uppercase bg-slate-50 text-slate-600" />
            </div>
            <div>
              <label className="label">Balance (₹) *</label>
              <input type="number" min="1" value={form.balance} onChange={e => setForm(f => ({ ...f, balance: e.target.value }))}
                placeholder="500"
                className="input" />
            </div>
            <div>
              <label className="label">Expiry Date</label>
              <input type="date" value={form.expiresAt} onChange={e => setForm(f => ({ ...f, expiresAt: e.target.value }))}
                className="input" />
            </div>
            <button onClick={() => form.balance && createMutation.mutate()} disabled={createMutation.isPending || !form.balance}
              className="btn-primary w-full mt-2 bg-gradient-to-r from-pink-500 to-purple-600 border-none hover:from-pink-600 hover:to-purple-700 shadow-md">
              {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Issue Gift Card
            </button>
          </div>
        </div>

        {/* List */}
        <div className="card overflow-hidden lg:col-span-2">
          {isLoading ? (
            <div className="flex justify-center items-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-pink-500" />
            </div>
          ) : giftCards.length === 0 ? (
            <div className="text-center py-20 text-slate-400">
              <Gift className="w-12 h-12 mx-auto mb-4 opacity-40" />
              <p className="font-semibold text-base">No gift cards yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="table-base">
                <thead>
                  <tr>
                    {["Code", "Balance", "Redeemed", "Remaining", "Expires", "Status", ""].map(h => (
                      <th key={h} className="table-th whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {giftCards.map((g: any, i: number) => {
                    const remaining = Number(g.balance) - Number(g.redeemed_amount ?? 0)
                    const isExpired = g.expires_at && new Date(g.expires_at) < new Date()
                    return (
                      <motion.tr key={g.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}
                        className="table-row">
                        <td className="table-td">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-sm text-slate-800 bg-slate-100 px-2 py-0.5 rounded-lg border border-slate-200">{g.code}</span>
                            <button onClick={() => { navigator.clipboard.writeText(g.code); toast.success("Copied!") }}
                              className="btn-icon bg-transparent hover:bg-slate-100 text-slate-400 w-7 h-7">
                              <Copy className="w-3 h-3" />
                            </button>
                          </div>
                        </td>
                        <td className="table-td font-bold text-slate-800">₹{Number(g.balance).toLocaleString("en-IN")}</td>
                        <td className="table-td text-sm text-slate-500">₹{Number(g.redeemed_amount ?? 0).toLocaleString("en-IN")}</td>
                        <td className={`table-td font-bold ${remaining > 0 ? "text-emerald-500" : "text-red-500"}`}>
                          ₹{remaining.toLocaleString("en-IN")}
                        </td>
                        <td className="table-td text-xs text-slate-400 whitespace-nowrap">
                          {g.expires_at ? format(new Date(g.expires_at), "dd MMM yy") : "Never"}
                        </td>
                        <td className="table-td">
                          <span className={`badge ${isExpired ? "badge-red" : remaining <= 0 ? "badge-gray" : "badge-green"}`}>
                            {isExpired ? "Expired" : remaining <= 0 ? "Used" : "Active"}
                          </span>
                        </td>
                        <td className="table-td w-1">
                          <button onClick={() => deleteMutation.mutate(g.id)}
                            className="btn-icon bg-red-50 text-red-500 hover:bg-red-100 w-8 h-8">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </motion.tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
