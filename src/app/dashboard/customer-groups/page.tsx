"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { motion } from "framer-motion"
import { Users, Plus, Trash2, Edit3, Loader2, Check, X, ChevronRight } from "lucide-react"
import { adminApi } from "@/lib/api"
import toast from "react-hot-toast"

const GROUP_COLORS = ["#f97316","#3b82f6","#10b981","#8b5cf6","#ec4899","#f59e0b","#06b6d4","#ef4444"]

export default function AdminCustomerGroupsPage() {
  const qc = useQueryClient()
  const [form, setForm] = useState({ name: "", description: "" })
  const [editId, setEditId] = useState<string | null>(null)
  const [editData, setEditData] = useState<any>({})
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ["admin-customer-groups"],
    queryFn: () => adminApi.customerGroups().then(r => r.data.data ?? []),
  })

  const createMutation = useMutation({
    mutationFn: () => adminApi.createCustomerGroup(form),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-customer-groups"] }); setForm({ name: "", description: "" }); toast.success("Group created!") },
    onError: () => toast.error("Failed to create"),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: any) => adminApi.updateCustomerGroup(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-customer-groups"] }); setEditId(null); toast.success("Updated!") },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminApi.deleteCustomerGroup(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-customer-groups"] }); toast.success("Group deleted") },
  })

  const groups = data ?? []

  return (
    <div>
      <div className="mb-6">
        <h1 className="page-title">Customer Groups</h1>
        <p className="page-subtitle">Segment customers for targeted pricing and promotions</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Create form */}
        <div className="card-padded h-fit lg:sticky lg:top-6">
          <h2 className="font-bold text-slate-800 mb-5">New Group</h2>
          <div className="flex flex-col gap-4">
            <div>
              <label className="label">Group Name *</label>
              <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. VIP Customers"
                className="input" />
            </div>
            <div>
              <label className="label">Description</label>
              <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2}
                className="input resize-y" />
            </div>
            <button onClick={() => form.name.trim() && createMutation.mutate()} disabled={!form.name.trim() || createMutation.isPending}
              className="btn-primary w-full mt-2">
              {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} Create Group
            </button>
          </div>

          {/* Stats */}
          {groups.length > 0 && (
            <div className="mt-6 p-5 rounded-2xl bg-slate-50 border border-slate-100">
              <div className="text-3xl font-extrabold text-brand-500">{groups.length}</div>
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-widest mt-1">Total groups</div>
              
              <div className="w-full h-px bg-slate-200 my-4"></div>
              
              <div className="text-3xl font-extrabold text-blue-500">
                {groups.reduce((s: number, g: any) => s + (g.customer_count ?? 0), 0)}
              </div>
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-widest mt-1">Segmented customers</div>
            </div>
          )}
        </div>

        {/* Groups list */}
        <div className="flex flex-col gap-4 lg:col-span-2">
          {isLoading ? (
            <div className="card-padded flex justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
            </div>
          ) : groups.length === 0 ? (
            <div className="card-padded text-center py-16 text-slate-400">
              <Users className="w-10 h-10 mx-auto mb-3 opacity-40" />
              <p className="font-medium text-base">No customer groups yet</p>
            </div>
          ) : groups.map((g: any, i: number) => {
            const color = GROUP_COLORS[i % GROUP_COLORS.length]
            const isEditing = editId === g.id
            const isExpanded = expandedId === g.id
            return (
              <motion.div key={g.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                className="card overflow-hidden hover:shadow-md transition-shadow">
                <div className="flex items-center gap-4 p-5 cursor-pointer hover:bg-slate-50 transition-colors"
                  onClick={() => setExpandedId(isExpanded ? null : g.id)}>
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border-[2px]"
                    style={{ background: `${color}18`, borderColor: `${color}33` }}>
                    <Users className="w-5 h-5" style={{ color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    {isEditing ? (
                      <input value={editData.name ?? g.name} onChange={e => setEditData((d: any) => ({ ...d, name: e.target.value }))}
                        onClick={e => e.stopPropagation()}
                        className="input py-1 px-2 text-sm font-bold w-full" />
                    ) : (
                      <div className="font-bold text-base text-slate-800 truncate">{g.name}</div>
                    )}
                    <div className="text-xs text-slate-500 font-medium tracking-wide mt-1 truncate">
                      <span className="text-slate-700 font-bold">{g.customer_count ?? 0}</span> customers{g.description ? ` · ${g.description}` : ""}
                    </div>
                  </div>
                  <div className="flex gap-2 items-center shrink-0">
                    {isEditing ? (
                      <>
                        <button onClick={e => { e.stopPropagation(); updateMutation.mutate({ id: g.id, data: editData }) }}
                          className="btn-icon bg-green-50 text-green-600 hover:bg-green-100 p-2">
                          <Check className="w-4 h-4" />
                        </button>
                        <button onClick={e => { e.stopPropagation(); setEditId(null) }}
                          className="btn-icon bg-slate-100 text-slate-500 hover:bg-slate-200 p-2">
                          <X className="w-4 h-4" />
                        </button>
                      </>
                    ) : (
                      <>
                        <button onClick={e => { e.stopPropagation(); setEditId(g.id); setEditData({ name: g.name, description: g.description }) }}
                          className="btn-icon bg-blue-50 text-blue-500 hover:bg-blue-100 opacity-0 group-hover:opacity-100 xl:opacity-100 transition-opacity p-2">
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button onClick={e => { e.stopPropagation(); deleteMutation.mutate(g.id) }}
                          className="btn-icon bg-red-50 text-red-500 hover:bg-red-100 opacity-0 group-hover:opacity-100 xl:opacity-100 transition-opacity p-2">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                    <div className="w-px h-6 bg-slate-200 mx-1"></div>
                    <ChevronRight className={`w-5 h-5 text-slate-300 transition-transform ${isExpanded ? "rotate-90" : ""}`} />
                  </div>
                </div>

                {/* Expanded: customer list preview */}
                {isExpanded && (
                  <div className="border-t border-slate-100 p-4 bg-slate-50/50">
                    {(g.customers ?? []).length === 0 ? (
                      <p className="text-sm text-slate-500 text-center py-4">No customers in this group yet. Assign customers via the Customers page.</p>
                    ) : (
                      <div className="flex flex-col gap-2">
                        {(g.customers ?? []).slice(0, 5).map((c: any) => (
                          <div key={c.id} className="flex items-center gap-3 bg-white p-2 rounded-lg border border-slate-100">
                            <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                              style={{ background: color }}>
                              {(c.first_name ?? "U").charAt(0)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <span className="text-sm font-semibold text-slate-700 block truncate">{c.first_name} {c.last_name}</span>
                              <span className="text-xs text-slate-400 block truncate">{c.email}</span>
                            </div>
                          </div>
                        ))}
                        {(g.customers ?? []).length > 5 && (
                          <p className="text-xs font-bold text-center text-slate-400 mt-2">+{g.customers.length - 5} more customers</p>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
