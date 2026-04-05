"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { motion } from "framer-motion"
import { Bell, CheckCircle, Trash2, Loader2, ShoppingBag, Users, Package, AlertTriangle, RefreshCw, DollarSign } from "lucide-react"
import { adminApi } from "@/lib/api"
import { formatDistanceToNow } from "date-fns"
import toast from "react-hot-toast"

const NOTIF_META: Record<string, { icon: any; color: string; bg: string }> = {
  order:    { icon: ShoppingBag, color: "text-violet-600", bg: "bg-violet-100" },
  customer: { icon: Users,       color: "text-pink-600",   bg: "bg-pink-100" },
  product:  { icon: Package,     color: "text-blue-600",   bg: "bg-blue-100" },
  return:   { icon: RefreshCw,   color: "text-amber-600",  bg: "bg-amber-100" },
  payout:   { icon: DollarSign,  color: "text-emerald-600",bg: "bg-emerald-100" },
  alert:    { icon: AlertTriangle,color: "text-red-600",   bg: "bg-red-100" },
}

const FILTERS = ["all", "order", "customer", "product", "return", "payout", "alert"]

export default function AdminNotificationsPage() {
  const qc = useQueryClient()
  const [filter, setFilter] = useState("all")

  const { data, isLoading } = useQuery({
    queryKey: ["admin-notifications", filter],
    queryFn: () => adminApi.notifications({ type: filter === "all" ? undefined : filter }).then(r => r.data.data ?? []),
  })

  const markReadMutation = useMutation({
    mutationFn: (id: string) => adminApi.markNotificationRead(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-notifications"] }),
  })

  const markAllMutation = useMutation({
    mutationFn: () => adminApi.markAllNotificationsRead(),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-notifications"] }); toast.success("All marked as read") },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminApi.deleteNotification(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-notifications"] }),
  })

  const notifications = data ?? []
  const unread = notifications.filter((n: any) => !n.read_at).length

  return (
    <div className="max-w-3xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="page-title">Notifications</h1>
            {unread > 0 && (
              <span className="bg-red-500 text-white text-xs font-bold px-2.5 py-0.5 rounded-full">
                {unread}
              </span>
            )}
          </div>
          <p className="page-subtitle">Platform activity and alerts</p>
        </div>
        {unread > 0 && (
          <button onClick={() => markAllMutation.mutate()} className="btn-secondary text-xs">
            <CheckCircle className="w-3.5 h-3.5" /> Mark all read
          </button>
        )}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 bg-white p-1.5 rounded-2xl border border-slate-100 shadow-sm w-fit mb-5 flex-wrap">
        {FILTERS.map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`filter-tab ${filter === f ? "filter-tab-active" : "filter-tab-inactive"}`}>
            {f}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <Bell className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p className="font-semibold">All caught up!</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {notifications.map((n: any, i: number) => {
              const meta = NOTIF_META[n.type] ?? { icon: Bell, color: "text-slate-500", bg: "bg-slate-100" }
              const Icon = meta.icon
              const isUnread = !n.read_at
              return (
                <motion.div key={n.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.02 }}
                  onClick={() => isUnread && markReadMutation.mutate(n.id)}
                  className={`flex items-start gap-4 px-5 py-4 transition-colors cursor-pointer
                    ${isUnread ? "bg-orange-50/40 hover:bg-orange-50/70" : "hover:bg-slate-50"}`}>
                  {/* Icon */}
                  <div className={`relative w-10 h-10 rounded-xl ${meta.bg} flex items-center justify-center shrink-0`}>
                    <Icon className={`w-4.5 h-4.5 ${meta.color} w-[18px] h-[18px]`} />
                    {isUnread && (
                      <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white" />
                    )}
                  </div>
                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm ${isUnread ? "font-bold text-slate-900" : "font-medium text-slate-700"} leading-snug`}>
                      {n.title ?? n.message}
                    </p>
                    {n.body && <p className="text-xs text-slate-500 mt-0.5">{n.body}</p>}
                    <p className="text-xs text-slate-400 mt-1.5">
                      {n.created_at ? formatDistanceToNow(new Date(n.created_at), { addSuffix: true }) : ""}
                    </p>
                  </div>
                  {/* Delete */}
                  <button onClick={e => { e.stopPropagation(); deleteMutation.mutate(n.id) }}
                    className="btn-icon bg-transparent text-slate-300 hover:text-red-400 hover:bg-red-50 shrink-0">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
