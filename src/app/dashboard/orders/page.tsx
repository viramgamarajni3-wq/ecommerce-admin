"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { motion } from "framer-motion"
import { Search, Loader2, ShoppingBag, Eye } from "lucide-react"
import { adminApi } from "@/lib/api"
import { format } from "date-fns"
import toast from "react-hot-toast"
import Link from "next/link"

const STATUS_BADGE: Record<string, string> = {
  pending:    "badge-yellow",
  confirmed:  "badge-blue",
  processing: "badge-purple",
  shipped:    "badge-green",
  delivered:  "badge-green",
  cancelled:  "badge-red",
  refunded:   "badge-gray",
}

type OrderStatus = "all" | "pending" | "confirmed" | "shipped" | "delivered" | "cancelled"

export default function AdminOrdersPage() {
  const [search, setSearch] = useState("")
  const [status, setStatus] = useState<OrderStatus>("all")
  const [page, setPage] = useState(1)
  const qc = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ["admin-orders", search, status, page],
    queryFn: () => adminApi.orders({ search, status: status === "all" ? undefined : status, page, limit: 20 }).then(r => r.data),
  })

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, newStatus }: { id: string; newStatus: string }) => adminApi.updateOrderStatus(id, newStatus),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-orders"] }); toast.success("Order updated") },
    onError: () => toast.error("Failed to update order"),
  })

  const orders = data?.data?.orders ?? []
  const total = data?.data?.total ?? 0
  const totalPages = Math.ceil(total / 20)

  return (
    <div>
      <div className="mb-6">
        <h1 className="page-title">Orders</h1>
        <p className="page-subtitle">{total} total orders</p>
      </div>

      <div className="card overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b border-slate-100 flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input value={search} onChange={e => { setSearch(e.target.value); setPage(1) }}
              placeholder="Search by order # or customer…"
              className="input pl-9 w-full py-2" />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 hide-scrollbar">
            {(["all","pending","confirmed","shipped","delivered","cancelled"] as OrderStatus[]).map(s => (
              <button key={s} onClick={() => { setStatus(s); setPage(1) }}
                className={`filter-tab whitespace-nowrap ${status === s ? "filter-tab-active" : "filter-tab-inactive"}`}>
                {s}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-48">
            <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <ShoppingBag className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p className="font-semibold text-base">No orders found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table-base">
              <thead>
                <tr>
                  {["Order","Customer","Items","Total","Status","Date","Action"].map(h => (
                    <th key={h} className="table-th">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {orders.map((o: any, i: number) => {
                  const badge = STATUS_BADGE[o.status] ?? "badge-yellow"
                  return (
                    <motion.tr key={o.id}
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                      className="table-row">
                      <td className="table-td font-bold text-sm text-slate-800">#{o.order_number}</td>
                      <td className="table-td text-sm text-slate-500">{o.first_name} {o.last_name}</td>
                      <td className="table-td text-sm text-slate-500">{o.item_count ?? "—"} items</td>
                      <td className="table-td font-bold text-slate-800">₹{Number(o.total).toLocaleString("en-IN")}</td>
                      <td className="table-td">
                        <span className={`badge ${badge} capitalize`}>{o.status}</span>
                      </td>
                      <td className="table-td text-xs text-slate-400 whitespace-nowrap">
                        {o.created_at ? format(new Date(o.created_at), "dd MMM yy") : "—"}
                      </td>
                      <td className="table-td">
                        <div className="flex gap-2 items-center">
                          <select
                            value={o.status}
                            onChange={e => updateStatusMutation.mutate({ id: o.id, newStatus: e.target.value })}
                            className="input py-1 px-2 text-xs w-auto cursor-pointer font-semibold capitalize"
                          >
                            {["pending","confirmed","processing","shipped","delivered","cancelled"].map(s => (
                              <option key={s} value={s}>{s}</option>
                            ))}
                          </select>
                          <Link href={`/dashboard/orders/${o.id}`}
                            className="btn-icon bg-blue-50 text-blue-500 hover:bg-blue-100 no-underline shrink-0">
                            <Eye className="w-3.5 h-3.5" />
                          </Link>
                        </div>
                      </td>
                    </motion.tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-100 flex justify-between items-center">
            <span className="text-xs font-semibold text-slate-400">Page {page} of {totalPages}</span>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page===1}
                className="btn-secondary py-1.5 px-3 text-xs">← Prev</button>
              <button onClick={() => setPage(p => Math.min(totalPages, p+1))} disabled={page===totalPages}
                className="btn-secondary py-1.5 px-3 text-xs">Next →</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
