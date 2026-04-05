"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { motion } from "framer-motion"
import { Plus, Trash2, FileText, Loader2 } from "lucide-react"
import { adminApi } from "@/lib/api"
import toast from "react-hot-toast"
import { format } from "date-fns"

export default function AdminDraftOrdersPage() {
  const qc = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ customer_email: "", customer_name: "", items: [{ variant_id: "", quantity: 1, price: "" }], note: "" })
  const [search, setSearch] = useState("")

  const { data, isLoading } = useQuery({
    queryKey: ["admin-draft-orders"],
    queryFn: () => adminApi.draftOrders().then(r => r.data.data ?? []),
  })

  const createMutation = useMutation({
    mutationFn: () => adminApi.createDraftOrder({
      email: form.customer_email,
      customer_name: form.customer_name,
      items: form.items.filter(i => i.variant_id.trim()).map(i => ({ variant_id: i.variant_id, quantity: i.quantity, unit_price: Number(i.price) })),
      note: form.note,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-draft-orders"] })
      setShowForm(false)
      setForm({ customer_email: "", customer_name: "", items: [{ variant_id: "", quantity: 1, price: "" }], note: "" })
      toast.success("Draft order created!")
    },
    onError: () => toast.error("Failed to create draft order"),
  })

  const completeMutation = useMutation({
    mutationFn: (id: string) => adminApi.completeDraftOrder(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-draft-orders"] }); toast.success("Draft completed!") },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminApi.deleteDraftOrder(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-draft-orders"] }); toast.success("Draft deleted") },
  })

  const drafts = (data ?? []).filter((d: any) =>
    d.customer_email?.includes(search) || d.customer_name?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="page-title">Draft Orders</h1>
          <p className="page-subtitle">Create manual orders on behalf of customers</p>
        </div>
        <button onClick={() => setShowForm(v => !v)} className="btn-primary">
          <Plus className="w-4 h-4" /> New Draft
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="card-padded border-[1.5px] border-orange-200 mb-6 bg-orange-50/30">
          <h2 className="font-bold text-slate-800 mb-4">Create Draft Order</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="label">Customer Name</label>
              <input value={form.customer_name} onChange={e => setForm(f => ({ ...f, customer_name: e.target.value }))}
                placeholder="Rahul Sharma" className="input bg-white" />
            </div>
            <div>
              <label className="label">Customer Email *</label>
              <input type="email" value={form.customer_email} onChange={e => setForm(f => ({ ...f, customer_email: e.target.value }))}
                placeholder="rahul@example.com" className="input bg-white" />
            </div>
          </div>

          {/* Items */}
          <div className="mb-4">
            <div className="label mb-2">Line Items</div>
            {form.items.map((item, idx) => (
              <div key={idx} className="flex flex-wrap sm:flex-nowrap gap-2 mb-2">
                <input placeholder="Variant ID" value={item.variant_id} onChange={e => {
                    const items = [...form.items]; items[idx] = { ...items[idx], variant_id: e.target.value }; setForm(f => ({ ...f, items }))
                  }} className="input py-1.5 px-3 text-sm bg-white sm:flex-[3]" />
                <input type="number" placeholder="Qty" min="1" value={item.quantity} onChange={e => {
                    const items = [...form.items]; items[idx] = { ...items[idx], quantity: Number(e.target.value) }; setForm(f => ({ ...f, items }))
                  }} className="input py-1.5 px-3 text-sm bg-white flex-[1]" />
                <input type="number" placeholder="Price ₹" value={item.price} onChange={e => {
                    const items = [...form.items]; items[idx] = { ...items[idx], price: e.target.value }; setForm(f => ({ ...f, items }))
                  }} className="input py-1.5 px-3 text-sm bg-white flex-[2]" />
                {form.items.length > 1 && (
                  <button onClick={() => setForm(f => ({ ...f, items: f.items.filter((_, i) => i !== idx) }))}
                    className="btn-icon bg-red-50 text-red-500 hover:bg-red-100 shrink-0">✕</button>
                )}
              </div>
            ))}
            <button onClick={() => setForm(f => ({ ...f, items: [...f.items, { variant_id: "", quantity: 1, price: "" }] }))}
              className="text-xs font-bold text-brand-500 bg-transparent border-none cursor-pointer mt-1">
              + Add line item
            </button>
          </div>

          <div className="mb-5">
            <label className="label">Note</label>
            <textarea value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))} rows={2}
              className="input bg-white resize-y" />
          </div>

          <div className="flex gap-3">
            <button onClick={() => form.customer_email.trim() && createMutation.mutate()} disabled={!form.customer_email.trim() || createMutation.isPending}
              className="btn-primary">
              {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Create Draft
            </button>
            <button onClick={() => setShowForm(false)} className="btn-secondary bg-white">Cancel</button>
          </div>
        </motion.div>
      )}

      {/* List */}
      <div className="card overflow-hidden">
        <div className="p-4 border-b border-slate-100">
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by email or customer name…"
            className="input py-2" />
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
          </div>
        ) : drafts.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <FileText className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p className="font-medium text-base">No draft orders</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table-base">
              <thead>
                <tr>
                  {["Draft", "Customer", "Items", "Total", "Created", "Status", "Actions"].map(h => (
                    <th key={h} className="table-th">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {drafts.map((d: any, i: number) => (
                  <motion.tr key={d.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                    className="table-row">
                    <td className="table-td font-mono text-xs text-slate-400">#{d.id?.slice(0, 8)}</td>
                    <td className="table-td">
                      <div className="font-bold text-sm text-slate-800">{d.customer_name ?? d.customer_email}</div>
                      <div className="text-xs text-slate-400">{d.customer_email}</div>
                    </td>
                    <td className="table-td text-sm text-slate-500">{(d.items ?? []).length} items</td>
                    <td className="table-td font-bold text-slate-800">₹{Number(d.total ?? 0).toLocaleString("en-IN")}</td>
                    <td className="table-td text-xs text-slate-400 whitespace-nowrap">{d.created_at ? format(new Date(d.created_at), "dd MMM yy") : "—"}</td>
                    <td className="table-td">
                      <span className="badge badge-yellow">Draft</span>
                    </td>
                    <td className="table-td">
                      <div className="flex gap-2">
                        <button onClick={() => completeMutation.mutate(d.id)}
                          className="btn-success px-3 py-1 text-xs">Complete</button>
                        <button onClick={() => deleteMutation.mutate(d.id)}
                          className="btn-icon bg-red-50 text-red-500 hover:bg-red-100 w-auto px-2">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
