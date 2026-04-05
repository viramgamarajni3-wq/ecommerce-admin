"use client"

import { useQuery } from "@tanstack/react-query"
import { adminApi } from "@/lib/api"
import { Loader2, ShoppingBag, MapPin, Phone, Mail, ChevronLeft } from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"
import { motion } from "framer-motion"

const STATUS_BADGE: Record<string, string> = {
  pending:   "badge-yellow",
  delivered: "badge-green",
  cancelled: "badge-red",
  shipped:   "badge-green",
}

export default function CustomerDetailPage({ params }: { params: { id: string } }) {
  const { data, isLoading } = useQuery({
    queryKey: ["admin-customer", params.id],
    queryFn: () => adminApi.getCustomer(params.id).then(r => r.data.data),
  })

  if (isLoading) return (
    <div className="flex justify-center items-center h-64">
      <Loader2 className="w-10 h-10 animate-spin text-brand-500" />
    </div>
  )

  const customer = data
  if (!customer) return <div className="text-center py-20 text-slate-400 font-medium">Customer not found</div>

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/dashboard/customers" className="btn-secondary w-9 h-9 !p-0 shrink-0 no-underline">
          <ChevronLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="page-title">{customer.first_name} {customer.last_name}</h1>
          <p className="page-subtitle">Customer since {customer.created_at ? format(new Date(customer.created_at), "MMM yyyy") : "—"}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Left panel */}
        <div className="flex flex-col gap-5">
          <div className="card-padded">
            <div className="text-center pb-5 border-b border-slate-100 mb-5">
              <div className="w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-2xl mx-auto mb-3 shadow-md"
                style={{ background: `hsl(${(customer.first_name?.charCodeAt(0) ?? 65) * 7 % 360},60%,50%)` }}>
                {(customer.first_name ?? "U").charAt(0).toUpperCase()}
              </div>
              <div className="font-bold text-lg text-slate-800">{customer.first_name} {customer.last_name}</div>
            </div>
            <div className="flex flex-col gap-3">
              {[
                { icon: Mail, value: customer.email },
                { icon: Phone, value: customer.phone ?? "Not provided" },
              ].map(({ icon: Icon, value }, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center shrink-0">
                    <Icon className="w-4 h-4 text-slate-400" />
                  </div>
                  <span className="text-sm font-medium text-slate-600">{value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="card-padded">
            <h3 className="font-bold text-slate-800 mb-4">Customer Stats</h3>
            <div className="flex flex-col gap-1">
              {[
                { label: "Total Orders", value: customer.order_count ?? 0 },
                { label: "Total Spent", value: `₹${Number(customer.total_spent ?? 0).toLocaleString("en-IN")}` },
                { label: "Avg. Order Value", value: customer.order_count > 0 ? `₹${Math.round(customer.total_spent / customer.order_count).toLocaleString("en-IN")}` : "—" },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between items-center py-2 border-b border-slate-50 last:border-0">
                  <span className="text-sm text-slate-500">{label}</span>
                  <span className="text-sm font-bold text-slate-800">{value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right panel — orders */}
        <div className="md:col-span-2">
          <h3 className="font-bold text-slate-800 mb-4 px-1">Order History</h3>
          {(customer.orders ?? []).length === 0 ? (
            <div className="card-padded text-center py-14 text-slate-400">
              <ShoppingBag className="w-10 h-10 mx-auto mb-3 opacity-40" />
              <p className="font-medium">No orders yet</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {(customer.orders ?? []).map((order: any, i: number) => {
                const badge = STATUS_BADGE[order.status] ?? "badge-yellow"
                return (
                  <motion.div key={order.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                    className="card p-4 flex items-center gap-4 hover:shadow-md transition-shadow">
                    <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center shrink-0">
                      <ShoppingBag className="w-4 h-4 text-brand-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-sm text-slate-800">#{order.order_number}</span>
                        <span className={`badge ${badge} capitalize`}>{order.status}</span>
                      </div>
                      <div className="text-xs text-slate-400">
                        {order.created_at ? format(new Date(order.created_at), "dd MMM yy") : "—"} · {order.item_count} item{order.item_count !== 1 ? "s" : ""}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="font-bold text-base text-slate-800">₹{Number(order.total).toLocaleString("en-IN")}</div>
                      <Link href={`/dashboard/orders/${order.id}`} className="text-xs font-bold text-brand-500 no-underline hover:underline">View →</Link>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          )}

          {/* Addresses */}
          {(customer.addresses ?? []).length > 0 && (
            <div className="mt-8">
              <h3 className="font-bold text-slate-800 mb-4 px-1">Saved Addresses</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {(customer.addresses ?? []).map((addr: any, i: number) => (
                  <div key={addr.id ?? i} className="card p-4 flex gap-3">
                    <MapPin className="w-4 h-4 text-brand-500 shrink-0 mt-0.5" />
                    <div className="text-sm text-slate-600 leading-relaxed">
                      {[addr.street, addr.city, addr.state, addr.pincode].filter(Boolean).join(", ")}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
