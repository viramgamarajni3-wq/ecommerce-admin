"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { motion } from "framer-motion"
import { ArrowLeftRight, Loader2, CheckCircle, XCircle } from "lucide-react"
import { adminApi } from "@/lib/api"
import { format } from "date-fns"
import toast from "react-hot-toast"
import Link from "next/link"

const STATUS_BADGE: Record<string, string> = {
  requested:  "badge-yellow",
  received:   "badge-blue",
  requires_action: "badge-red",
  completed:  "badge-green",
  canceled:   "badge-gray",
}

export default function AdminSwapsPage() {
  const [filter, setFilter] = useState("all")
  const qc = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ["admin-swaps", filter],
    queryFn: () => adminApi.swaps({ status: filter === "all" ? undefined : filter }).then(r => r.data.data ?? []),
  })

  const processSwapMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => adminApi.updateSwap(id, status),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-swaps"] }); toast.success("Swap updated!") },
    onError: () => toast.error("Failed to update"),
  })

  const swaps = data ?? []

  return (
    <div>
      <div className="mb-6">
        <h1 className="page-title">Swaps & Exchanges</h1>
        <p className="page-subtitle">Manage product exchange requests from customers</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Requested",    value: swaps.filter((s: any) => s.status === "requested").length,       color: "text-amber-500", bg: "bg-amber-50", border: "border-amber-100" },
          { label: "Received",     value: swaps.filter((s: any) => s.status === "received").length,        color: "text-blue-500",  bg: "bg-blue-50",  border: "border-blue-100" },
          { label: "Needs Action", value: swaps.filter((s: any) => s.status === "requires_action").length, color: "text-red-500",   bg: "bg-red-50",   border: "border-red-100" },
          { label: "Completed",    value: swaps.filter((s: any) => s.status === "completed").length,       color: "text-emerald-500",bg: "bg-emerald-50",border: "border-emerald-100" },
        ].map(({ label, value, color, bg, border }) => (
          <div key={label} className={`p-4 rounded-2xl border ${bg} ${border}`}>
            <div className={`text-3xl font-extrabold ${color}`}>{value}</div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-widest mt-1 opacity-80">{label}</div>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-5 overflow-x-auto pb-2 hide-scrollbar">
        {["all", "requested", "received", "requires_action", "completed", "canceled"].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`filter-tab whitespace-nowrap capitalize ${filter === f ? "filter-tab-active" : "filter-tab-inactive"}`}>
            {f.replace(/_/g, " ")}
          </button>
        ))}
      </div>

      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center p-16">
            <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
          </div>
        ) : swaps.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <ArrowLeftRight className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p className="font-semibold text-base">No swaps found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table-base">
              <thead>
                <tr>
                  {["Swap ID", "Order", "Customer", "Return Items", "New Items", "Diff", "Status", "Date", "Actions"].map(h => (
                    <th key={h} className="table-th whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {swaps.map((swap: any, i: number) => {
                  const badge = STATUS_BADGE[swap.status] ?? "badge-yellow"
                  return (
                    <motion.tr key={swap.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                      className="table-row">
                      <td className="table-td font-mono text-xs text-slate-400">#{swap.id?.slice(0, 8)}</td>
                      <td className="table-td">
                        <Link href={`/dashboard/orders/${swap.order_id}`} className="font-bold text-brand-500 no-underline hover:underline">#{swap.order_number}</Link>
                      </td>
                      <td className="table-td text-sm text-slate-500">{swap.customer_name}</td>
                      <td className="table-td text-xs text-slate-500 max-w-[150px] truncate">
                        {(swap.return_items ?? []).map((i: any) => i.name).join(", ") || "—"}
                      </td>
                      <td className="table-td text-xs text-slate-500 max-w-[150px] truncate">
                        {(swap.additional_items ?? []).map((i: any) => i.name).join(", ") || "—"}
                      </td>
                      <td className={`table-td font-bold ${(swap.price_diff ?? 0) > 0 ? "text-red-500" : "text-emerald-500"}`}>
                        {(swap.price_diff ?? 0) > 0 ? `+₹${swap.price_diff}` : swap.price_diff < 0 ? `-₹${Math.abs(swap.price_diff)}` : "—"}
                      </td>
                      <td className="table-td">
                        <span className={`badge ${badge} capitalize`}>{swap.status?.replace(/_/g, " ")}</span>
                      </td>
                      <td className="table-td text-xs text-slate-400 whitespace-nowrap">
                        {swap.created_at ? format(new Date(swap.created_at), "dd MMM yy") : "—"}
                      </td>
                      <td className="table-td w-1 whitespace-nowrap">
                        <div className="flex gap-2">
                          {swap.status === "requested" && (
                            <button onClick={() => processSwapMutation.mutate({ id: swap.id, status: "received" })}
                              className="btn-secondary bg-blue-50 text-blue-600 border-none hover:bg-blue-100 py-1 px-3 text-xs w-auto">
                              <CheckCircle className="w-3.5 h-3.5 mr-1" /> Receive
                            </button>
                          )}
                          {swap.status === "received" && (
                            <button onClick={() => processSwapMutation.mutate({ id: swap.id, status: "completed" })}
                              className="btn-success py-1 px-3 text-xs w-auto">
                              <CheckCircle className="w-3.5 h-3.5 mr-1" /> Complete
                            </button>
                          )}
                          {["requested", "received"].includes(swap.status) && (
                            <button onClick={() => processSwapMutation.mutate({ id: swap.id, status: "canceled" })}
                              className="btn-danger py-1 px-3 text-xs w-auto">
                              <XCircle className="w-3.5 h-3.5 mr-1" /> Cancel
                            </button>
                          )}
                        </div>
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
  )
}
