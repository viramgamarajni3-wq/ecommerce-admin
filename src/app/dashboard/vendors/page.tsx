"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { motion, AnimatePresence } from "framer-motion"
import { CheckCircle, XCircle, Clock, Eye, Search, Loader2, Store } from "lucide-react"
import { adminApi } from "@/lib/api"
import toast from "react-hot-toast"
import { format } from "date-fns"
import Link from "next/link"

const STATUS_TABS = [
  { value: "pending",  label: "Pending",  badge: "badge-orange" },
  { value: "approved", label: "Approved", badge: "badge-green" },
  { value: "suspended",label: "Suspended",badge: "badge-red" },
]

const STATUS_BADGE: Record<string, string> = {
  approved:  "badge-green",
  pending:   "badge-orange",
  suspended: "badge-red",
}

export default function AdminVendorsPage() {
  const [status, setStatus] = useState("pending")
  const [search, setSearch]   = useState("")
  const qc = useQueryClient()

  const { data = [], isLoading } = useQuery({
    queryKey: ["admin-vendors", status],
    queryFn: () => adminApi.vendors({ status }).then(r => r.data.data ?? []),
  })

  const approveMutation = useMutation({
    mutationFn: (id: string) => adminApi.approveVendor(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-vendors"] }); toast.success("Vendor approved!") },
    onError: () => toast.error("Failed to approve"),
  })

  const suspendMutation = useMutation({
    mutationFn: (id: string) => adminApi.suspendVendor(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-vendors"] }); toast.success("Vendor suspended") },
    onError: () => toast.error("Failed to suspend"),
  })

  const filtered = (data as any[]).filter((v: any) =>
    v.store_name?.toLowerCase().includes(search.toLowerCase()) ||
    v.email?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="page-title">Vendor Management</h1>
        <p className="page-subtitle">Approve, review and manage all vendor accounts</p>
      </div>

      {/* Controls */}
      <div className="card mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 border-b border-slate-100">
          {/* Status tabs */}
          <div className="flex gap-1 bg-slate-50 p-1 rounded-xl w-fit">
            {STATUS_TABS.map(tab => (
              <button key={tab.value} onClick={() => setStatus(tab.value)}
                className={`filter-tab ${status === tab.value ? "filter-tab-active" : "filter-tab-inactive"}`}>
                {tab.label}
              </button>
            ))}
          </div>
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search vendors…"
              className="input pl-9 py-2 text-sm w-full sm:w-64" />
          </div>
        </div>

        {/* Table */}
        {isLoading ? (
          <div className="flex items-center justify-center h-40">
            <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <Clock className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p className="font-semibold">No vendors found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table-base">
              <thead>
                <tr>
                  {["Store", "Owner", "Email", "Registered", "Status", "Actions"].map(h => (
                    <th key={h} className="table-th">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <AnimatePresence>
                  {filtered.map((vendor: any) => (
                    <motion.tr key={vendor.id}
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      className="table-row">
                      {/* Store */}
                      <td className="table-td">
                        <div className="flex items-center gap-3">
                          {vendor.logo_url ? (
                            <img src={vendor.logo_url} alt={vendor.store_name}
                              className="w-9 h-9 rounded-xl object-cover" />
                          ) : (
                            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-400 to-brand-600
                              flex items-center justify-center text-white font-bold text-sm shrink-0">
                              {vendor.store_name?.charAt(0)?.toUpperCase()}
                            </div>
                          )}
                          <div>
                            <p className="font-semibold text-slate-800 text-sm">{vendor.store_name}</p>
                            <p className="text-slate-400 text-xs">{vendor.gst_number ? `GST: ${vendor.gst_number}` : "No GST"}</p>
                          </div>
                        </div>
                      </td>
                      {/* Owner */}
                      <td className="table-td font-medium">{vendor.first_name} {vendor.last_name}</td>
                      {/* Email */}
                      <td className="table-td text-slate-500">{vendor.email}</td>
                      {/* Registered */}
                      <td className="table-td text-slate-400 text-xs whitespace-nowrap">
                        {vendor.created_at ? format(new Date(vendor.created_at), "dd MMM yyyy") : "—"}
                      </td>
                      {/* Status */}
                      <td className="table-td">
                        <span className={`badge ${STATUS_BADGE[vendor.status] ?? "badge-gray"}`}>
                          {vendor.status}
                        </span>
                      </td>
                      {/* Actions */}
                      <td className="table-td">
                        <div className="flex items-center gap-2">
                          {vendor.status === "pending" && (
                            <button onClick={() => approveMutation.mutate(vendor.id)}
                              disabled={approveMutation.isPending} className="btn-success text-xs py-1 px-2.5">
                              <CheckCircle className="w-3.5 h-3.5" /> Approve
                            </button>
                          )}
                          {vendor.status === "approved" && (
                            <button onClick={() => suspendMutation.mutate(vendor.id)}
                              disabled={suspendMutation.isPending} className="btn-danger text-xs py-1 px-2.5">
                              <XCircle className="w-3.5 h-3.5" /> Suspend
                            </button>
                          )}
                          {vendor.status === "suspended" && (
                            <button onClick={() => approveMutation.mutate(vendor.id)}
                              disabled={approveMutation.isPending} className="btn-success text-xs py-1 px-2.5">
                              <CheckCircle className="w-3.5 h-3.5" /> Reinstate
                            </button>
                          )}
                          <Link href={`/dashboard/vendors/${vendor.id}`}
                            className="btn-secondary text-xs py-1 px-2.5 no-underline">
                            <Eye className="w-3.5 h-3.5" /> View
                          </Link>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
