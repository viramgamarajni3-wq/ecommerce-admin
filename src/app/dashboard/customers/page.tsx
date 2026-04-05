"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { motion } from "framer-motion"
import { Search, Users, Loader2, ChevronRight } from "lucide-react"
import { adminApi } from "@/lib/api"
import { format } from "date-fns"
import Link from "next/link"

export default function AdminCustomersPage() {
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)

  const { data, isLoading } = useQuery({
    queryKey: ["admin-customers", search, page],
    queryFn: () => adminApi.customers({ search, page, limit: 20 }).then(r => r.data),
  })

  const customers = data?.data?.customers ?? []
  const total = data?.data?.total ?? 0
  const totalPages = Math.ceil(total / 20)

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="page-title">Customers</h1>
          <p className="page-subtitle">{total} registered customers</p>
        </div>
        <div className="flex gap-2">
          {[
            { label: "All", value: total },
            { label: "This Month", value: data?.data?.new_this_month ?? 0 },
          ].map(({ label, value }) => (
            <div key={label} className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-center shadow-sm">
              <div className="text-lg font-bold text-slate-800">{value}</div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{label}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input value={search} onChange={e => { setSearch(e.target.value); setPage(1) }}
              placeholder="Search by name or email…"
              className="input pl-9 w-full py-2" />
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-48">
            <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
          </div>
        ) : customers.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <Users className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p className="font-semibold text-base">No customers found</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="table-base">
                <thead>
                  <tr>
                    {["Customer", "Email", "Phone", "Orders", "Total Spent", "Joined", ""].map(h => (
                      <th key={h} className="table-th">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {customers.map((c: any, i: number) => (
                    <motion.tr key={c.id}
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                      className="table-row">
                      <td className="table-td">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-sm shrink-0"
                            style={{ background: `hsl(${(c.first_name?.charCodeAt(0) ?? 65) * 7 % 360},60%,50%)` }}>
                            {(c.first_name ?? "U").charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-semibold text-sm text-slate-800">{c.first_name} {c.last_name}</div>
                            <div className="text-xs text-slate-400 font-mono">ID: {c.id?.slice(0, 8)}…</div>
                          </div>
                        </div>
                      </td>
                      <td className="table-td text-sm text-slate-500">{c.email}</td>
                      <td className="table-td text-sm text-slate-500">{c.phone ?? "—"}</td>
                      <td className="table-td font-bold text-slate-800">{c.order_count ?? 0}</td>
                      <td className="table-td font-bold text-brand-500">
                        ₹{Number(c.total_spent ?? 0).toLocaleString("en-IN")}
                      </td>
                      <td className="table-td text-xs text-slate-400 whitespace-nowrap">
                        {c.created_at ? format(new Date(c.created_at), "dd MMM yy") : "—"}
                      </td>
                      <td className="table-td pr-4">
                        <Link href={`/dashboard/customers/${c.id}`}
                          className="btn-secondary py-1 px-3 text-xs w-auto no-underline flex items-center gap-1 opacity-0 group-hover:opacity-100 xl:opacity-100 transition-opacity">
                          View <ChevronRight className="w-3 h-3" />
                        </Link>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
            {totalPages > 1 && (
              <div className="p-4 border-t border-slate-100 flex justify-between items-center">
                <span className="text-xs font-semibold text-slate-400">Page {page} of {totalPages} · {total} total</span>
                <div className="flex gap-2">
                  <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                    className="btn-secondary py-1.5 px-3 text-xs">← Prev</button>
                  <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                    className="btn-secondary py-1.5 px-3 text-xs">Next →</button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
