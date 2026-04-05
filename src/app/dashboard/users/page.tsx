"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { motion } from "framer-motion"
import { Search, Loader2, ShieldCheck, User } from "lucide-react"
import { adminApi } from "@/lib/api"
import { format } from "date-fns"

const ROLE_STYLE: Record<string, string> = {
  admin:    "badge-red",
  vendor:   "badge-blue",
  customer: "badge-green",
}

export default function AdminUsersPage() {
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)

  const { data, isLoading } = useQuery({
    queryKey: ["admin-users", search, page],
    queryFn: () => adminApi.users({ search, page, limit: 20 }).then(r => r.data),
  })

  const users = data?.data?.users ?? []
  const total = data?.data?.total ?? 0
  const totalPages = Math.ceil(total / 20)

  return (
    <div>
      <div className="mb-6">
        <h1 className="page-title">Users</h1>
        <p className="page-subtitle">{total} registered accounts</p>
      </div>

      <div className="card overflow-hidden">
        {/* Search */}
        <div className="p-4 border-b border-slate-100 flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input value={search} onChange={e => { setSearch(e.target.value); setPage(1) }}
              placeholder="Search by name or email…"
              className="input pl-9 w-full py-2" />
          </div>
        </div>

        {/* List */}
        {isLoading ? (
          <div className="flex justify-center items-center h-48">
            <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <User className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p className="font-semibold">No users found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table-base">
              <thead>
                <tr>
                  {["User","Email","Phone","Role","Joined","Verified"].map(h => (
                    <th key={h} className="table-th">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.map((u: any, i: number) => {
                  const rs = ROLE_STYLE[u.role] ?? "badge-green"
                  return (
                    <motion.tr key={u.id}
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                      className="table-row">
                      <td className="table-td">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-sm shrink-0"
                            style={{ background: `hsl(${(u.first_name?.charCodeAt(0) ?? 65) * 7 % 360}, 60%, 50%)` }}>
                            {(u.first_name ?? "U").charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-semibold text-sm text-slate-800">{u.first_name} {u.last_name}</div>
                            <div className="text-xs text-slate-400 font-mono">ID: {u.id?.slice(0,8)}…</div>
                          </div>
                        </div>
                      </td>
                      <td className="table-td text-slate-500">{u.email}</td>
                      <td className="table-td text-slate-500">{u.phone ?? "—"}</td>
                      <td className="table-td">
                        <span className={`badge ${rs} capitalize`}>{u.role}</span>
                      </td>
                      <td className="table-td text-xs text-slate-400 whitespace-nowrap">
                        {u.created_at ? format(new Date(u.created_at), "dd MMM yy") : "—"}
                      </td>
                      <td className="table-td">
                        <ShieldCheck className={`w-4.5 h-4.5 w-[18px] h-[18px] ${u.is_verified ? "text-emerald-500" : "text-slate-300"}`} />
                      </td>
                    </motion.tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-100 flex justify-between items-center">
            <span className="text-xs font-semibold text-slate-400">Page {page} of {totalPages}</span>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page === 1}
                className="btn-secondary py-1.5 px-3 text-xs">← Prev</button>
              <button onClick={() => setPage(p => Math.min(totalPages, p+1))} disabled={page === totalPages}
                className="btn-secondary py-1.5 px-3 text-xs">Next →</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
