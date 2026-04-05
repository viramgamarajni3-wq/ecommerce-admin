"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { motion, AnimatePresence } from "framer-motion"
import { Search, Plus, Edit3, Trash2, Filter, Loader2, Package } from "lucide-react"
import { adminApi } from "@/lib/api"
import Link from "next/link"
import toast from "react-hot-toast"

type Status = "all" | "active" | "draft" | "archived"

export default function AdminProductsPage() {
  const [search, setSearch] = useState("")
  const [status, setStatus] = useState<Status>("all")
  const [page, setPage] = useState(1)
  const qc = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ["admin-products", search, status, page],
    queryFn: () => adminApi.products({ search, status: status === "all" ? undefined : status, page, limit: 20 }).then(r => r.data),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminApi.deleteProduct(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-products"] }); toast.success("Product deleted") },
    onError: () => toast.error("Failed to delete"),
  })

  const products = data?.data?.products ?? []
  const total = data?.data?.total ?? 0
  const totalPages = Math.ceil(total / 20)

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="page-title">Products</h1>
          <p className="page-subtitle">{total} products in platform</p>
        </div>
        <Link href="/dashboard/products/create" className="btn-primary">
          <Plus className="w-4 h-4" /> Add Product
        </Link>
      </div>

      <div className="card overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row gap-3">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input value={search} onChange={e => { setSearch(e.target.value); setPage(1) }}
              placeholder="Search products…"
              className="input pl-9 w-full" />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 md:pb-0 scrollbar-hide">
            {(["all", "active", "draft", "archived"] as Status[]).map(s => (
              <button key={s} onClick={() => { setStatus(s); setPage(1) }}
                className={`px-4 py-2 rounded-xl text-sm font-bold capitalize whitespace-nowrap transition-colors ${
                  status === s 
                    ? "bg-brand-500 text-white shadow-sm" 
                    : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}>
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        {isLoading ? (
          <div className="flex justify-center items-center h-48">
            <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <Package className="w-12 h-12 mx-auto mb-4 opacity-40" />
            <p className="font-semibold text-base px-4">No products found matching your criteria</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table-base">
              <thead>
                <tr>
                  {["Product", "Vendor", "Price", "Stock", "Status", "Actions"].map(h => (
                    <th key={h} className="table-th whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <AnimatePresence>
                  {products.map((p: any, i: number) => (
                    <motion.tr key={p.id}
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      transition={{ delay: i * 0.03 }}
                      className="table-row">
                      <td className="table-td">
                        <div className="flex items-center gap-3">
                          {(p.thumbnail || p.image_url) ? (
                            <img src={p.thumbnail || p.image_url} alt={p.name} className="w-10 h-10 rounded-lg object-cover shadow-sm" />
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                              <Package className="w-5 h-5 text-slate-400" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <div className="font-bold text-sm text-slate-800 truncate max-w-[200px] xl:max-w-[300px]">{p.name}</div>
                            <div className="text-xs text-slate-400 font-mono truncate max-w-[200px] xl:max-w-[300px] mt-0.5">{p.slug}</div>
                          </div>
                        </div>
                      </td>
                      <td className="table-td text-sm text-slate-500">{p.vendor_name ?? "—"}</td>
                      <td className="table-td font-bold text-slate-800">₹{Number(p.price).toLocaleString("en-IN")}</td>
                      <td className={`table-td font-bold ${p.stock_quantity === 0 ? "text-red-500" : "text-emerald-500"}`}>
                        {p.stock_quantity}
                      </td>
                      <td className="table-td">
                        <span className={`badge ${
                          p.status === "active" ? "badge-green" : 
                          p.status === "draft" ? "badge-yellow" : 
                          "badge-gray"
                        } capitalize`}>
                          {p.status}
                        </span>
                      </td>
                      <td className="table-td w-1 whitespace-nowrap">
                        <div className="flex gap-2">
                          <Link href={`/dashboard/products/${p.id}`} className="btn-icon bg-blue-50 text-blue-500 hover:bg-blue-100 w-8 h-8">
                            <Edit3 className="w-4 h-4" />
                          </Link>
                          <button onClick={() => deleteMutation.mutate(p.id)} className="btn-icon bg-red-50 text-red-500 hover:bg-red-100 w-8 h-8">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-100 flex justify-between items-center bg-slate-50/50">
            <span className="text-xs font-semibold text-slate-500">Page {page} of {totalPages} <span className="hidden sm:inline">· {total} total</span></span>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="btn-secondary py-1.5 px-3 text-xs">
                ← Prev
              </button>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                className="btn-secondary py-1.5 px-3 text-xs">
                Next →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
