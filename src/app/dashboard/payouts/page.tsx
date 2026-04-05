"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { motion } from "framer-motion"
import { Wallet, CheckCircle, Clock, Loader2, DollarSign } from "lucide-react"
import { adminApi } from "@/lib/api"
import { format } from "date-fns"
import toast from "react-hot-toast"

const STATUS_BADGE: Record<string, string> = {
  pending:   "badge-yellow",
  completed: "badge-green",
  failed:    "badge-red",
}

export default function AdminPayoutsPage() {
  const qc = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ["admin-payouts"],
    queryFn: () => adminApi.payouts().then(r => r.data.data ?? []),
  })

  const completeMutation = useMutation({
    mutationFn: (id: string) => adminApi.completePayout(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-payouts"] }); toast.success("Payout marked complete") },
    onError: () => toast.error("Failed to update payout"),
  })

  const payouts = data ?? []
  const pending = payouts.filter((p: any) => p.status === "pending")
  const total = payouts.reduce((s: number, p: any) => s + Number(p.amount ?? 0), 0)
  const pendingTotal = pending.reduce((s: number, p: any) => s + Number(p.amount ?? 0), 0)

  const stats = [
    { label: "Total Payouts",    value: `₹${total.toLocaleString("en-IN")}`,        icon: Wallet,      grad: "from-brand-500 to-brand-600" },
    { label: "Pending Amount",   value: `₹${pendingTotal.toLocaleString("en-IN")}`, icon: Clock,       grad: "from-amber-500 to-orange-500" },
    { label: "Pending Requests", value: String(pending.length),                      icon: DollarSign,  grad: "from-red-500 to-red-600" },
  ]

  return (
    <div>
      <div className="mb-6">
        <h1 className="page-title">Payouts</h1>
        <p className="page-subtitle">Manage and process vendor payouts</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {stats.map(({ label, value, icon: Icon, grad }, i) => (
          <motion.div key={label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className={`stat-card bg-gradient-to-br ${grad}`}>
            <div className="absolute right-0 top-0 w-24 h-24 rounded-full bg-white/10 -translate-y-8 translate-x-8" />
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center mb-4">
              <Icon className="w-5 h-5 text-white" />
            </div>
            <div className="stat-card-value">{value}</div>
            <div className="stat-card-label">{label}</div>
          </motion.div>
        ))}
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center items-center h-48">
            <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
          </div>
        ) : payouts.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <Wallet className="w-12 h-12 mx-auto mb-4 opacity-40" />
            <p className="font-semibold">No payouts yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table-base">
              <thead>
                <tr>
                  {["Vendor", "Amount", "Status", "Order Ref", "Created", "Action"].map(h => (
                    <th key={h} className="table-th">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {payouts.map((p: any, i: number) => (
                  <motion.tr key={p.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.04 }} className="table-row">
                    <td className="table-td font-semibold text-slate-800">{p.vendor_name ?? "Vendor"}</td>
                    <td className="table-td">
                      <span className="font-bold text-slate-900 text-base">₹{Number(p.amount).toLocaleString("en-IN")}</span>
                    </td>
                    <td className="table-td">
                      <span className={`badge ${STATUS_BADGE[p.status] ?? "badge-gray"} capitalize`}>{p.status}</span>
                    </td>
                    <td className="table-td text-slate-400 text-xs font-mono">#{p.order_id?.slice(0, 8)}</td>
                    <td className="table-td text-slate-400 text-xs whitespace-nowrap">
                      {p.created_at ? format(new Date(p.created_at), "dd MMM yy") : "—"}
                    </td>
                    <td className="table-td">
                      {p.status === "pending" && (
                        <button onClick={() => completeMutation.mutate(p.id)}
                          disabled={completeMutation.isPending} className="btn-success py-1 px-3 text-xs">
                          <CheckCircle className="w-3.5 h-3.5" /> Complete
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
