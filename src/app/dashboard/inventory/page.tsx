"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { motion } from "framer-motion"
import { Search, Loader2, BoxesIcon, AlertTriangle, TrendingDown } from "lucide-react"
import { adminApi } from "@/lib/api"
import toast from "react-hot-toast"

export default function AdminInventoryPage() {
  const [search, setSearch] = useState("")
  const [filter, setFilter] = useState<"all" | "low" | "out">("all")
  const qc = useQueryClient()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editQty, setEditQty] = useState("")

  const { data, isLoading } = useQuery({
    queryKey: ["admin-inventory"],
    queryFn: () => adminApi.inventory().then(r => r.data.data ?? []),
  })

  const updateStockMutation = useMutation({
    mutationFn: ({ id, qty }: { id: string; qty: number }) => adminApi.updateStock(id, qty),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-inventory"] }); setEditingId(null); toast.success("Stock updated!") },
    onError: () => toast.error("Failed to update stock"),
  })

  const items = (data ?? []).filter((p: any) => {
    const matchSearch = p.name?.toLowerCase().includes(search.toLowerCase())
    if (!matchSearch) return false
    if (filter === "out") return Number(p.stock_quantity) === 0
    if (filter === "low") return Number(p.stock_quantity) > 0 && Number(p.stock_quantity) <= 10
    return true
  })

  const allItems = data ?? []
  const outOfStock = allItems.filter((p: any) => Number(p.stock_quantity) === 0).length
  const lowStock = allItems.filter((p: any) => Number(p.stock_quantity) > 0 && Number(p.stock_quantity) <= 10).length

  return (
    <div>
      <div className="mb-6">
        <h1 className="page-title">Inventory</h1>
        <p className="page-subtitle">Monitor and update stock levels across all products</p>
      </div>

      {/* Alerts row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {[
          { label: "Total Products", value: allItems.length, grad: "from-brand-500 to-brand-600",    icon: BoxesIcon,     f: "all" },
          { label: "Low Stock",      value: lowStock,        grad: "from-amber-500 to-orange-500",   icon: TrendingDown,  f: "low" },
          { label: "Out of Stock",   value: outOfStock,      grad: "from-red-500 to-rose-600",       icon: AlertTriangle, f: "out" },
        ].map(({ label, value, grad, icon: Icon, f }) => (
          <motion.div key={label} whileTap={{ scale: 0.97 }} onClick={() => setFilter(f as any)}
            className={`stat-card bg-gradient-to-br ${grad} cursor-pointer transition-all border-[3px]
              ${filter === f ? "border-white/50 shadow-lg scale-[1.02]" : "border-transparent"}`}>
            <Icon className="w-6 h-6 text-white/80 mb-3" />
            <div className="stat-card-value text-3xl">{value}</div>
            <div className="stat-card-label">{label}</div>
          </motion.div>
        ))}
      </div>

      <div className="card overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search products…"
              className="input pl-9 w-full py-2" />
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-48">
            <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table-base">
              <thead>
                <tr>
                  {["Product", "Vendor", "SKU", "Category", "Stock", "Status", "Update Stock"].map(h => (
                    <th key={h} className="table-th">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {items.map((p: any, i: number) => {
                  const stock = Number(p.stock_quantity)
                  const status = stock === 0 ? { label: "Out of Stock", badge: "badge-red" }
                    : stock <= 10 ? { label: "Low Stock", badge: "badge-yellow" }
                    : { label: "In Stock", badge: "badge-green" }
                  const isEditing = editingId === p.id

                  return (
                    <motion.tr key={p.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                      className="table-row">
                      <td className="table-td">
                        <div className="flex items-center gap-3">
                          {p.image_url ? (
                            <img src={p.image_url} alt={p.name} className="w-9 h-9 rounded-lg object-cover bg-slate-100" />
                          ) : (
                            <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                              <BoxesIcon className="w-4 h-4 text-slate-400" />
                            </div>
                          )}
                          <div className="font-semibold text-sm text-slate-800 max-w-[160px] truncate">{p.name}</div>
                        </div>
                      </td>
                      <td className="table-td text-xs text-slate-500">{p.vendor_name ?? "—"}</td>
                      <td className="table-td text-xs font-mono text-slate-400">{p.sku ?? "—"}</td>
                      <td className="table-td text-xs text-slate-500">{p.category_name ?? "—"}</td>
                      <td className="table-td">
                        <span className={`text-lg font-bold ${stock === 0 ? "text-red-500" : stock <= 10 ? "text-amber-500" : "text-emerald-500"}`}>
                          {stock}
                        </span>
                      </td>
                      <td className="table-td">
                        <span className={`badge ${status.badge}`}>{status.label}</span>
                      </td>
                      <td className="table-td">
                        {isEditing ? (
                          <div className="flex gap-2">
                            <input type="number" min="0" value={editQty} onChange={e => setEditQty(e.target.value)}
                              className="input w-20 py-1 px-2 text-sm" autoFocus />
                            <button onClick={() => updateStockMutation.mutate({ id: p.id, qty: Number(editQty) })}
                              className="btn-success px-3 py-1 text-xs">Save</button>
                            <button onClick={() => setEditingId(null)}
                              className="btn-secondary px-3 py-1 text-xs">✕</button>
                          </div>
                        ) : (
                          <button onClick={() => { setEditingId(p.id); setEditQty(String(stock)) }}
                            className="btn-secondary px-3 py-1.5 text-xs">Edit</button>
                        )}
                      </td>
                    </motion.tr>
                  )
                })}
              </tbody>
            </table>
            {items.length === 0 && (
              <div className="text-center py-12 text-slate-400">
                <BoxesIcon className="w-10 h-10 mx-auto mb-3 opacity-40" />
                <p>No products match your filter</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
