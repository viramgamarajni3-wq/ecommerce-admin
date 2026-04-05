"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { motion } from "framer-motion"
import { Plus, Trash2, Truck, Loader2 } from "lucide-react"
import { adminApi } from "@/lib/api"
import toast from "react-hot-toast"

export default function AdminShippingPage() {
  const qc = useQueryClient()
  const [form, setForm] = useState({ name: "", price: "", freeAbove: "", deliveryDays: "", carrier: "" })

  const { data, isLoading } = useQuery({
    queryKey: ["admin-shipping"],
    queryFn: () => adminApi.shippingOptions().then(r => r.data.data ?? []),
  })

  const createMutation = useMutation({
    mutationFn: () => adminApi.createShippingOption({
      name: form.name,
      price: Number(form.price),
      freeAbove: form.freeAbove ? Number(form.freeAbove) : null,
      deliveryDays: form.deliveryDays,
      carrier: form.carrier,
    }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-shipping"] }); setForm({ name: "", price: "", freeAbove: "", deliveryDays: "", carrier: "" }); toast.success("Shipping option created!") },
    onError: () => toast.error("Failed to create"),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminApi.deleteShippingOption(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-shipping"] }); toast.success("Deleted") },
  })

  const options = data ?? []

  return (
    <div>
      <div className="mb-6">
        <h1 className="page-title">Shipping Options</h1>
        <p className="page-subtitle">Configure delivery methods and pricing for your platform</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form */}
        <div className="card-padded h-fit lg:sticky lg:top-6">
          <h2 className="font-bold text-slate-800 mb-5">Add Shipping Method</h2>
          <div className="flex flex-col gap-4">
            {[
              { label: "Method Name *", key: "name",         placeholder: "Standard Delivery" },
              { label: "Price (₹)",     key: "price",        placeholder: "60",  type: "number" },
              { label: "Free if above (₹)", key: "freeAbove", placeholder: "500", type: "number" },
              { label: "Delivery Days", key: "deliveryDays", placeholder: "3–5 business days" },
              { label: "Carrier",       key: "carrier",      placeholder: "DTDC / Delhivery / Bluedart" },
            ].map(({ label, key, placeholder, type }) => (
              <div key={key}>
                <label className="label">{label}</label>
                <input type={type ?? "text"} value={(form as any)[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                  placeholder={placeholder}
                  className="input" />
              </div>
            ))}
            <button onClick={() => form.name.trim() && createMutation.mutate()} disabled={!form.name.trim() || createMutation.isPending}
              className="btn-primary w-full mt-2 bg-gradient-to-r from-violet-500 to-purple-600 border-none hover:from-violet-600 hover:to-purple-700 shadow-md">
              {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Add Method
            </button>
          </div>
        </div>

        {/* List */}
        <div className="flex flex-col gap-4 lg:col-span-2">
          {isLoading ? (
            <div className="card flex justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
            </div>
          ) : options.length === 0 ? (
            <div className="card text-center py-16 text-slate-400">
              <Truck className="w-12 h-12 mx-auto mb-4 opacity-40" />
              <p className="font-medium text-base">No shipping methods configured</p>
            </div>
          ) : options.map((o: any, i: number) => (
            <motion.div key={o.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
              className="card p-5 hover:shadow-md transition-shadow group">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex gap-4 items-center">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shrink-0 shadow-sm">
                    <Truck className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className="font-bold text-lg text-slate-800">{o.name}</div>
                    <div className="text-sm font-medium text-slate-500 mt-0.5">{o.delivery_days} · {o.carrier}</div>
                    {o.free_above && <div className="text-xs font-bold text-emerald-500 mt-1.5 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Free above ₹{o.free_above}
                    </div>}
                  </div>
                </div>
                <div className="flex gap-4 items-center pl-[64px] sm:pl-0 border-t sm:border-0 border-slate-100 pt-3 sm:pt-0">
                  <div className="text-right flex-1 sm:flex-initial">
                    <div className={`text-2xl font-extrabold ${o.price === 0 ? "text-emerald-500" : "text-slate-800"}`}>
                      {o.price === 0 ? "Free" : `₹${o.price}`}
                    </div>
                  </div>
                  <button onClick={() => deleteMutation.mutate(o.id)}
                    className="btn-icon bg-red-50 text-red-500 hover:bg-red-100 opacity-1 sm:opacity-0 group-hover:opacity-100 transition-opacity w-9 h-9">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}
