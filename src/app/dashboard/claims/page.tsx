"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { motion } from "framer-motion"
import { AlertTriangle, Package, Loader2, CheckCircle, XCircle, RefreshCw } from "lucide-react"
import { adminApi } from "@/lib/api"
import toast from "react-hot-toast"
import { format } from "date-fns"
import Link from "next/link"

const FILTERS = ["all", "open", "approved", "resolved", "rejected"]

const STATUS_BADGE: Record<string, string> = {
  open:     "badge-yellow",
  approved: "badge-green",
  resolved: "badge-blue",
  rejected: "badge-red",
}

const CLAIM_TYPES: Record<string, string> = {
  damaged:     "Damaged / Defective",
  wrong_item:  "Wrong Item",
  not_working: "Not Working",
  expired:     "Expired",
  missing:     "Item Missing",
  other:       "Other",
}

export default function AdminClaimsPage() {
  const [filter, setFilter] = useState("all")
  const qc = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ["admin-claims", filter],
    queryFn: () => adminApi.claims({ status: filter === "all" ? undefined : filter }).then(r => r.data.data ?? []),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => adminApi.updateClaim(id, status),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-claims"] }); toast.success("Claim updated!") },
    onError: () => toast.error("Failed"),
  })

  const claims = data ?? []

  const counts = {
    open:     claims.filter((c: any) => c.status === "open").length,
    approved: claims.filter((c: any) => c.status === "approved").length,
    resolved: claims.filter((c: any) => c.status === "resolved").length,
    rejected: claims.filter((c: any) => c.status === "rejected").length,
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="page-title">Claims</h1>
        <p className="page-subtitle">Handle warranty, damage and product quality claims</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Open",     value: counts.open,     color: "text-amber-600",   bg: "bg-amber-50",   border: "border-amber-100" },
          { label: "Approved", value: counts.approved, color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-100" },
          { label: "Resolved", value: counts.resolved, color: "text-blue-600",    bg: "bg-blue-50",    border: "border-blue-100" },
          { label: "Rejected", value: counts.rejected, color: "text-red-600",     bg: "bg-red-50",     border: "border-red-100" },
        ].map(({ label, value, color, bg, border }) => (
          <div key={label} className={`rounded-2xl p-5 ${bg} border ${border}`}>
            <div className={`text-3xl font-extrabold font-display ${color}`}>{value}</div>
            <div className="text-sm text-slate-500 mt-1">{label}</div>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div className="flex gap-1 bg-white p-1.5 rounded-2xl border border-slate-100 shadow-sm w-fit mb-5 flex-wrap">
        {FILTERS.map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`filter-tab ${filter === f ? "filter-tab-active" : "filter-tab-inactive"}`}>
            {f}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
          </div>
        ) : claims.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <AlertTriangle className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p className="font-semibold">No claims found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table-base">
              <thead>
                <tr>
                  {["Order", "Customer", "Product", "Type", "Description", "Status", "Date", "Actions"].map(h => (
                    <th key={h} className="table-th">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {claims.map((c: any, i: number) => (
                  <motion.tr key={c.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.02 }} className="table-row">
                    <td className="table-td">
                      <Link href={`/dashboard/orders/${c.order_id}`}
                        className="text-brand-500 font-bold text-sm no-underline hover:text-brand-600">
                        #{c.order_number}
                      </Link>
                    </td>
                    <td className="table-td text-slate-500">{c.customer_name}</td>
                    <td className="table-td">
                      <div className="flex items-center gap-2">
                        {c.product_image
                          ? <img src={c.product_image} alt="" className="w-7 h-7 rounded-lg object-cover" />
                          : <Package className="w-5 h-5 text-slate-300" />}
                        <span className="font-semibold text-slate-800 text-xs">{c.product_name}</span>
                      </div>
                    </td>
                    <td className="table-td text-xs text-slate-400">{CLAIM_TYPES[c.type] ?? c.type}</td>
                    <td className="table-td max-w-xs">
                      <p className="truncate text-xs text-slate-500">{c.description}</p>
                    </td>
                    <td className="table-td">
                      <span className={`badge ${STATUS_BADGE[c.status] ?? "badge-gray"} capitalize`}>
                        {c.status}
                      </span>
                    </td>
                    <td className="table-td text-xs text-slate-400 whitespace-nowrap">
                      {c.created_at ? format(new Date(c.created_at), "dd MMM yy") : "—"}
                    </td>
                    <td className="table-td">
                      {c.status === "open" && (
                        <div className="flex gap-2">
                          <button onClick={() => updateMutation.mutate({ id: c.id, status: "approved" })}
                            className="btn-success py-1 px-2 text-xs">
                            <CheckCircle className="w-3 h-3" /> Approve
                          </button>
                          <button onClick={() => updateMutation.mutate({ id: c.id, status: "rejected" })}
                            className="btn-danger py-1 px-2 text-xs">
                            <XCircle className="w-3 h-3" /> Reject
                          </button>
                        </div>
                      )}
                      {c.status === "approved" && (
                        <button onClick={() => updateMutation.mutate({ id: c.id, status: "resolved" })}
                          className="btn-secondary py-1 px-2 text-xs">
                          <RefreshCw className="w-3 h-3" /> Resolve
                        </button>
                      )}
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
