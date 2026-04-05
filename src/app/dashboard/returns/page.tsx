"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { motion } from "framer-motion"
import { Search, Loader2, RefreshCw, CheckCircle, XCircle } from "lucide-react"
import { adminApi } from "@/lib/api"
import { format } from "date-fns"
import toast from "react-hot-toast"
import Link from "next/link"

const REASON_LABELS: Record<string, string> = {
  wrong_product: "Wrong product",
  damaged: "Damaged / Defective",
  not_as_described: "Not as described",
  changed_mind: "Changed mind",
  other: "Other",
}

const STATUS_BADGE: Record<string, string> = {
  requested:  "badge-yellow",
  approved:   "badge-green",
  rejected:   "badge-red",
  refunded:   "badge-blue",
  completed:  "badge-gray",
}

export default function AdminReturnsPage() {
  const [search, setSearch] = useState("")
  const [filter, setFilter] = useState("all")
  const qc = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ["admin-returns", filter],
    queryFn: () => adminApi.returns({ status: filter === "all" ? undefined : filter }).then(r => r.data.data ?? []),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => adminApi.updateReturn(id, status),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-returns"] }); toast.success("Return updated!") },
    onError: () => toast.error("Failed to update"),
  })

  const refundMutation = useMutation({
    mutationFn: (id: string) => adminApi.refundReturn(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-returns"] }); toast.success("Refund processed!") },
    onError: () => toast.error("Failed to process refund"),
  })

  const returns = (data ?? []).filter((r: any) =>
    r.order_number?.toString().includes(search) ||
    r.customer_name?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div>
      <div className="mb-6">
        <h1 className="page-title">Returns & Refunds</h1>
        <p className="page-subtitle">Manage customer return requests and process refunds</p>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Requested", value: (data ?? []).filter((r: any) => r.status === "requested").length, color: "text-amber-500", bg: "bg-amber-50", border: "border-amber-100" },
          { label: "Approved",  value: (data ?? []).filter((r: any) => r.status === "approved").length,  color: "text-emerald-500",bg: "bg-emerald-50",border: "border-emerald-100" },
          { label: "Refunded",  value: (data ?? []).filter((r: any) => r.status === "refunded").length,  color: "text-blue-500",  bg: "bg-blue-50",  border: "border-blue-100" },
          { label: "Rejected",  value: (data ?? []).filter((r: any) => r.status === "rejected").length,  color: "text-red-500",   bg: "bg-red-50",   border: "border-red-100" },
        ].map(({ label, value, color, bg, border }) => (
          <div key={label} className={`p-4 rounded-2xl border flex flex-col items-center sm:items-start ${bg} ${border}`}>
            <div className={`text-3xl font-extrabold font-outfit ${color}`}>{value}</div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-widest mt-1 opacity-80">{label}</div>
          </div>
        ))}
      </div>

      <div className="card overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b border-slate-100 flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by order # or customer…"
              className="input pl-9 w-full py-2" />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 hide-scrollbar">
            {["all", "requested", "approved", "refunded", "rejected"].map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={`filter-tab whitespace-nowrap capitalize ${filter === f ? "filter-tab-active" : "filter-tab-inactive"}`}>
                {f}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center p-16">
            <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
          </div>
        ) : returns.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <RefreshCw className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p className="font-semibold text-base">No returns found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table-base">
              <thead>
                <tr>
                  {["Return ID", "Order", "Customer", "Reason", "Amount", "Status", "Requested", "Actions"].map(h => (
                    <th key={h} className="table-th whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {returns.map((r: any, i: number) => {
                  const badge = STATUS_BADGE[r.status] ?? "badge-yellow"
                  return (
                    <motion.tr key={r.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                      className="table-row">
                      <td className="table-td font-mono text-xs text-slate-400">#{r.id?.slice(0, 8)}…</td>
                      <td className="table-td font-bold">
                        <Link href={`/dashboard/orders/${r.order_id}`} className="text-brand-500 no-underline hover:underline">#{r.order_number}</Link>
                      </td>
                      <td className="table-td text-sm text-slate-500">{r.customer_name}</td>
                      <td className="table-td text-xs text-slate-500 max-w-[150px] truncate">{REASON_LABELS[r.reason] ?? r.reason}</td>
                      <td className="table-td font-bold text-slate-800">₹{Number(r.refund_amount ?? 0).toLocaleString("en-IN")}</td>
                      <td className="table-td">
                        <span className={`badge ${badge} capitalize`}>{r.status}</span>
                      </td>
                      <td className="table-td text-xs text-slate-400 whitespace-nowrap">
                        {r.created_at ? format(new Date(r.created_at), "dd MMM yy") : "—"}
                      </td>
                      <td className="table-td w-1 whitespace-nowrap">
                        <div className="flex gap-2">
                          {r.status === "requested" && (
                            <>
                              <button onClick={() => updateMutation.mutate({ id: r.id, status: "approved" })}
                                className="btn-success py-1 px-3 text-xs w-auto">
                                <CheckCircle className="w-3.5 h-3.5 mr-1" /> Approve
                              </button>
                              <button onClick={() => updateMutation.mutate({ id: r.id, status: "rejected" })}
                                className="btn-danger py-1 px-3 text-xs w-auto">
                                <XCircle className="w-3.5 h-3.5 mr-1" /> Reject
                              </button>
                            </>
                          )}
                          {r.status === "approved" && (
                            <button onClick={() => refundMutation.mutate(r.id)}
                              className="btn-secondary bg-blue-50 text-blue-600 border-none hover:bg-blue-100 py-1 px-3 text-xs w-auto">
                              <RefreshCw className="w-3.5 h-3.5 mr-1" /> Process Refund
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
