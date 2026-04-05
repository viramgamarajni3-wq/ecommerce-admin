"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { motion } from "framer-motion"
import { Plus, Trash2, Monitor, Loader2, Globe, Smartphone, ShoppingBag } from "lucide-react"
import { adminApi } from "@/lib/api"
import toast from "react-hot-toast"

const CHANNEL_ICONS: Record<string, any> = {
  web:    Globe,
  mobile: Smartphone,
  pos:    ShoppingBag,
}

export default function AdminSalesChannelsPage() {
  const qc = useQueryClient()
  const [form, setForm] = useState({ name: "", description: "", type: "web" })

  const { data, isLoading } = useQuery({
    queryKey: ["admin-sales-channels"],
    queryFn: () => adminApi.salesChannels().then(r => r.data.data ?? []),
  })

  const createMutation = useMutation({
    mutationFn: () => adminApi.createSalesChannel(form),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-sales-channels"] }); setForm({ name: "", description: "", type: "web" }); toast.success("Sales channel created!") },
    onError: () => toast.error("Failed to create"),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminApi.deleteSalesChannel(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-sales-channels"] }); toast.success("Channel deleted") },
  })

  const toggleMutation = useMutation({
    mutationFn: ({ id, active }: any) => adminApi.toggleSalesChannel(id, active),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-sales-channels"] }),
  })

  const channels = data ?? []

  return (
    <div>
      <div className="mb-6">
        <h1 className="page-title">Sales Channels</h1>
        <p className="page-subtitle">Manage where your products are available (Web, Mobile, POS)</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Create form */}
        <div className="card-padded h-fit lg:sticky lg:top-6">
          <h2 className="font-bold text-slate-800 mb-5">Add Channel</h2>
          <div className="flex flex-col gap-4">
            <div>
              <label className="label">Channel Name *</label>
              <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="My Webstore"
                className="input" />
            </div>
            <div>
              <label className="label">Type</label>
              <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                className="input cursor-pointer">
                <option value="web">Web</option>
                <option value="mobile">Mobile App</option>
                <option value="pos">Point of Sale</option>
              </select>
            </div>
            <div>
              <label className="label">Description</label>
              <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2}
                className="input resize-y" />
            </div>
            <button onClick={() => form.name.trim() && createMutation.mutate()} disabled={!form.name.trim() || createMutation.isPending}
              className="btn-primary w-full mt-2">
              {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Add Channel
            </button>
          </div>
        </div>

        {/* List */}
        <div className="flex flex-col gap-4 lg:col-span-2">
          {isLoading ? (
            <div className="card-padded py-16 flex justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
            </div>
          ) : channels.length === 0 ? (
            <div className="card-padded py-16 text-center text-slate-400">
              <Monitor className="w-10 h-10 mx-auto mb-3 opacity-40" />
              <p className="font-semibold text-base">No sales channels yet</p>
            </div>
          ) : channels.map((ch: any, i: number) => {
            const Icon = CHANNEL_ICONS[ch.type] ?? Globe
            return (
              <motion.div key={ch.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
                className="card p-5 flex items-center gap-4 group hover:shadow-md transition-shadow">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-sm
                  ${ch.is_active ? "bg-gradient-to-br from-brand-500 to-brand-600" : "bg-slate-100"}`}>
                  <Icon className={`w-5 h-5 ${ch.is_active ? "text-white" : "text-slate-400"}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-slate-800 text-sm">{ch.name}</div>
                  <div className="text-xs text-slate-500 font-medium tracking-wide mt-0.5 capitalize truncate">{ch.description || ch.type}</div>
                </div>
                <div className="flex gap-4 items-center shrink-0">
                  {/* Toggle active */}
                  <div className="flex items-center gap-2">
                    <button onClick={() => toggleMutation.mutate({ id: ch.id, active: !ch.is_active })}
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${ch.is_active ? 'bg-brand-500' : 'bg-slate-200'}`}>
                      <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${ch.is_active ? 'translate-x-4' : 'translate-x-0'}`} />
                    </button>
                    <span className={`text-[10px] font-bold uppercase tracking-wider ${ch.is_active ? "text-emerald-500" : "text-slate-400"} hidden sm:block w-12`}>
                      {ch.is_active ? "Active" : "Inactive"}
                    </span>
                  </div>
                  
                  <div className="w-px h-6 bg-slate-200 mx-1 hidden sm:block"></div>

                  <button onClick={() => deleteMutation.mutate(ch.id)}
                    className="btn-icon bg-red-50 text-red-500 hover:bg-red-100 opacity-0 group-hover:opacity-100 xl:opacity-100 transition-opacity">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
