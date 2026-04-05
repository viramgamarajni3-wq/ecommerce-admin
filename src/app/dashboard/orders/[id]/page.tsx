"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { adminApi } from "@/lib/api"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { format } from "date-fns"
import { ArrowLeft, Loader2, Package, RefreshCw, CheckCircle, XCircle, User, MapPin, CreditCard } from "lucide-react"
import Link from "next/link"
import toast from "react-hot-toast"

const STATUS_BADGE: Record<string, string> = {
  pending:    "badge-yellow",
  confirmed:  "badge-blue",
  processing: "badge-purple",
  shipped:    "badge-green",
  delivered:  "badge-green",
  cancelled:  "badge-red",
  refunded:   "badge-gray",
}

const TIMELINE_STEPS = ["pending", "confirmed", "processing", "shipped", "delivered"]

export default function AdminOrderDetailPage({ params }: { params: { id: string } }) {
  const qc = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ["admin-order", params.id],
    queryFn: () => adminApi.getOrder(params.id).then(r => r.data.data),
  })

  const updateStatusMutation = useMutation({
    mutationFn: (status: string) => adminApi.updateOrderStatus(params.id, status),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-order", params.id] }); toast.success("Order status updated") },
    onError: () => toast.error("Failed to update status"),
  })

  const refundMutation = useMutation({
    mutationFn: () => adminApi.refundOrder(params.id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-order", params.id] }); toast.success("Refund initiated") },
    onError: () => toast.error("Failed to initiate refund"),
  })

  if (isLoading) return (
    <div className="flex justify-center items-center h-64">
      <Loader2 className="w-10 h-10 animate-spin text-brand-500" />
    </div>
  )

  if (!data) return (
    <div className="text-center py-20">
      <p className="text-slate-400 mb-4">Order not found</p>
      <Link href="/dashboard/orders" className="text-brand-500 font-bold no-underline hover:underline">← Back to Orders</Link>
    </div>
  )

  const order = data
  const ss = STATUS_BADGE[order.status] ?? "badge-yellow"
  const currentStepIndex = TIMELINE_STEPS.indexOf(order.status)

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/orders" className="btn-secondary w-9 h-9 !p-0 shrink-0 no-underline">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="page-title">Order #{order.order_number}</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className={`badge ${ss} capitalize`}>{order.status}</span>
              <span className="text-xs text-slate-400">
                {order.created_at ? format(new Date(order.created_at), "dd MMM yyyy, hh:mm a") : ""}
              </span>
            </div>
          </div>
        </div>
        
        {/* Actions */}
        <div className="flex gap-2">
          {order.status !== "cancelled" && order.status !== "refunded" && (
            <button onClick={() => { if (confirm("Cancel this order?")) updateStatusMutation.mutate("cancelled") }}
              className="btn-danger">
              <XCircle className="w-4 h-4" /> Cancel
            </button>
          )}
          {order.status === "delivered" && (
            <button onClick={() => { if (confirm("Process refund?")) refundMutation.mutate() }}
              className="btn-icon bg-yellow-50 text-yellow-600 hover:bg-yellow-100 flex gap-2 w-auto px-4 font-semibold text-sm">
              <RefreshCw className="w-4 h-4" /> Refund
            </button>
          )}
        </div>
      </div>

      {/* Status Timeline */}
      <div className="card-padded overflow-x-auto mb-4">
        <div className="flex items-center min-w-[600px]">
          {TIMELINE_STEPS.map((step, i) => {
            const done = i <= currentStepIndex
            const active = i === currentStepIndex
            return (
              <div key={step} className="flex-1 flex items-center">
                <div className="flex flex-col items-center gap-1.5 flex-1 relative">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center z-10 transition-colors
                    ${done ? "bg-gradient-to-br from-brand-500 to-brand-600 shadow-sm" : "bg-slate-100"}
                    ${active ? "ring-4 ring-brand-100" : ""}`}>
                    {done ? <CheckCircle className="w-4 h-4 text-white" /> : <div className="w-2.5 h-2.5 rounded-full bg-slate-300" />}
                  </div>
                  <span className={`text-[10px] font-bold capitalize text-center ${done ? "text-brand-500" : "text-slate-400"}`}>
                    {step}
                  </span>
                </div>
                {i < TIMELINE_STEPS.length - 1 && (
                  <div className={`h-0.5 flex-1 mx-1 mb-5 transition-colors ${i < currentStepIndex ? "bg-brand-500" : "bg-slate-100"}`} />
                )}
              </div>
            )
          })}
        </div>

        {/* Status update */}
        <div className="flex items-center gap-3 mt-4 pt-4 border-t border-slate-100">
          <select
            value={order.status}
            onChange={e => updateStatusMutation.mutate(e.target.value)}
            disabled={updateStatusMutation.isPending}
            className="input w-auto py-1.5 px-3 text-sm capitalize font-semibold cursor-pointer">
            {Object.keys(STATUS_BADGE).map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <span className="text-sm text-slate-400">Update order status</span>
          {updateStatusMutation.isPending && <Loader2 className="w-4 h-4 animate-spin text-brand-500" />}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        {/* Customer info */}
        <div className="card-padded">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center">
              <User className="w-4 h-4 text-brand-500" />
            </div>
            <div className="font-bold text-slate-800">Customer</div>
          </div>
          <div className="font-bold text-slate-800 text-sm mb-1">{order.first_name} {order.last_name}</div>
          <div className="text-sm text-slate-500">{order.email}</div>
          <div className="text-sm text-slate-500">{order.phone}</div>
        </div>

        {/* Shipping address */}
        <div className="card-padded">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
              <MapPin className="w-4 h-4 text-blue-500" />
            </div>
            <div className="font-bold text-slate-800">Shipping Address</div>
          </div>
          <div className="text-sm text-slate-500 leading-relaxed">
            {[order.shipping_address?.street, order.shipping_address?.city, order.shipping_address?.state, order.shipping_address?.pincode, order.shipping_address?.country].filter(Boolean).join(", ") || "No address provided"}
          </div>
        </div>
      </div>

      {/* Order items */}
      <div className="card-padded mb-4">
        <div className="font-bold text-slate-800 mb-4 flex items-center gap-2">
          <Package className="w-4 h-4 text-brand-500" /> Order Items
        </div>
        <div className="flex flex-col gap-3">
          {(order.items ?? []).map((item: any, i: number) => (
            <div key={item.id ?? i} className="flex items-center gap-3 py-3 border-b border-slate-50 last:border-0 last:pb-0">
              {item.image_url ? (
                <img src={item.image_url} alt={item.name} className="w-14 h-14 rounded-xl object-cover bg-slate-50 shrink-0" />
              ) : (
                <div className="w-14 h-14 rounded-xl bg-slate-50 flex items-center justify-center shrink-0">
                  <Package className="w-6 h-6 text-slate-300" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="font-bold text-sm text-slate-800 truncate">{item.name}</div>
                {item.variant && <div className="text-xs text-slate-400">Variant: {item.variant}</div>}
                {item.vendor_name && <div className="text-[10px] font-bold text-brand-500 uppercase tracking-wider mt-0.5">by {item.vendor_name}</div>}
              </div>
              <div className="text-right shrink-0">
                <div className="text-sm text-slate-500 font-medium">×{item.quantity}</div>
                <div className="font-bold text-slate-800 text-sm">₹{(Number(item.price) * item.quantity).toLocaleString("en-IN")}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Summary */}
        <div className="flex flex-col gap-2 mt-4 pt-4 border-t border-dashed border-slate-200">
          <div className="flex justify-between text-sm text-slate-500">
            <span>Subtotal</span>
            <span>₹{Number(order.subtotal ?? 0).toLocaleString("en-IN")}</span>
          </div>
          <div className="flex justify-between text-sm text-slate-500">
            <span>Tax (GST)</span>
            <span>₹{Number(order.tax ?? 0).toLocaleString("en-IN")}</span>
          </div>
          <div className="flex justify-between text-sm text-slate-500">
            <span>Shipping</span>
            <span>{order.shipping_cost > 0 ? `₹${Number(order.shipping_cost).toLocaleString("en-IN")}` : "FREE"}</span>
          </div>
          <div className="flex justify-between text-lg font-bold text-slate-800 pt-2 mt-2 border-t border-slate-100">
            <span>Total</span>
            <span className="text-brand-500">₹{Number(order.total ?? 0).toLocaleString("en-IN")}</span>
          </div>
        </div>
      </div>

      {/* Payment info */}
      <div className="card-padded">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
            <CreditCard className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="font-bold text-slate-800">Payment</div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <div className="text-xs text-slate-400 mb-1">Method</div>
            <div className="text-sm font-bold text-slate-800 capitalize">{order.payment_method ?? "Razorpay"}</div>
          </div>
          <div>
            <div className="text-xs text-slate-400 mb-1">Status</div>
            <span className="badge badge-green">
              {order.payment_status ?? "Paid"}
            </span>
          </div>
          <div>
            <div className="text-xs text-slate-400 mb-1">Transaction ID</div>
            <div className="text-xs font-mono font-medium text-slate-600">{order.razorpay_payment_id ?? "—"}</div>
          </div>
        </div>
      </div>
    </div>
  )
}
