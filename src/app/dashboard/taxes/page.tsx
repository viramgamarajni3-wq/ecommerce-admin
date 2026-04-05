"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { motion } from "framer-motion"
import { Plus, Trash2, Globe, Edit3, Check, X, Loader2 } from "lucide-react"
import { adminApi } from "@/lib/api"
import toast from "react-hot-toast"

export default function AdminTaxesPage() {
  const qc = useQueryClient()
  const [editId, setEditId] = useState<string | null>(null)
  const [editData, setEditData] = useState<any>({})
  const [showAdd, setShowAdd] = useState<string | null>(null) // regionId
  const [newRate, setNewRate] = useState({ name: "", rate: "", code: "" })

  const { data, isLoading } = useQuery({
    queryKey: ["admin-taxes"],
    queryFn: () => adminApi.taxRates().then(r => r.data.data ?? []),
  })

  const { data: regionsData } = useQuery({
    queryKey: ["admin-regions-for-tax"],
    queryFn: () => adminApi.regions().then(r => r.data.data ?? []),
  })

  const createMutation = useMutation({
    mutationFn: ({ regionId }: any) => adminApi.createTaxRate({
      region_id: regionId,
      name: newRate.name,
      rate: Number(newRate.rate),
      code: newRate.code,
    }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-taxes"] }); setShowAdd(null); setNewRate({ name: "", rate: "", code: "" }); toast.success("Tax rate added!") },
    onError: () => toast.error("Failed to add"),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: any) => adminApi.updateTaxRate(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-taxes"] }); setEditId(null); toast.success("Updated!") },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminApi.deleteTaxRate(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-taxes"] }); toast.success("Deleted") },
  })

  const regions = regionsData ?? []
  // Group tax rates by region
  const ratesByRegion = (data ?? []).reduce((acc: any, rate: any) => {
    const key = rate.region_id ?? "global"
    if (!acc[key]) acc[key] = []
    acc[key].push(rate)
    return acc
  }, {} as Record<string, any[]>)

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="page-title">Tax Rates</h1>
        <p className="page-subtitle">Configure GST, VAT, and other tax rates per region</p>
      </div>

      {isLoading ? (
        <div className="card-padded py-16 flex justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
        </div>
      ) : regions.length === 0 ? (
        <div className="card-padded py-16 text-center text-slate-400">
          <Globe className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p className="font-semibold text-base">Create regions first to add tax rates</p>
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          {regions.map((region: any, ri: number) => {
            const rates = ratesByRegion[region.id] ?? []
            const isAddingHere = showAdd === region.id
            return (
              <motion.div key={region.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: ri * 0.06 }}
                className="card overflow-hidden">
                {/* Region header */}
                <div className="p-4 bg-gradient-to-br from-slate-800 to-slate-900 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                      <Globe className="w-5 h-5 text-brand-400" />
                    </div>
                    <div>
                      <div className="font-bold text-white text-base">{region.name}</div>
                      <div className="text-xs text-slate-400 font-medium tracking-wide">
                        {region.currency_code?.toUpperCase()} · {rates.length} tax rate{rates.length !== 1 ? "s" : ""}
                      </div>
                    </div>
                  </div>
                  <button onClick={() => setShowAdd(isAddingHere ? null : region.id)}
                    className="btn-secondary py-1.5 px-3 bg-white/10 text-white border-white/20 hover:bg-white/20 text-sm h-9">
                    <Plus className="w-4 h-4" /> Add Rate
                  </button>
                </div>

                {/* Add rate form */}
                {isAddingHere && (
                  <div className="p-4 bg-orange-50/50 border-b border-orange-100">
                    <div className="flex flex-wrap items-end gap-3">
                      <div className="flex-1 min-w-[150px]">
                        <label className="label text-[11px] mb-1">Name *</label>
                        <input value={newRate.name} onChange={e => setNewRate(r => ({ ...r, name: e.target.value }))} placeholder="GST Standard"
                          className="input py-1.5 px-3 bg-white" />
                      </div>
                      <div className="w-24">
                        <label className="label text-[11px] mb-1">Rate (%) *</label>
                        <input type="number" value={newRate.rate} onChange={e => setNewRate(r => ({ ...r, rate: e.target.value }))} placeholder="18"
                          className="input py-1.5 px-3 bg-white" />
                      </div>
                      <div className="w-28">
                        <label className="label text-[11px] mb-1">Code</label>
                        <input value={newRate.code} onChange={e => setNewRate(r => ({ ...r, code: e.target.value }))} placeholder="GST_STD"
                          className="input py-1.5 px-3 bg-white font-mono uppercase text-xs" />
                      </div>
                      <div className="flex gap-2 w-full sm:w-auto mt-2 sm:mt-0">
                        <button onClick={() => newRate.name && newRate.rate && createMutation.mutate({ regionId: region.id })}
                          className="btn-primary py-1.5 px-4 h-[34px] flex-1 sm:flex-none">
                          {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} Add
                        </button>
                        <button onClick={() => setShowAdd(null)}
                          className="btn-secondary py-1.5 px-3 h-[34px] flex-1 sm:flex-none bg-white">Cancel</button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Rates table */}
                {rates.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 text-sm">
                    No tax rates configured for this region
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="table-base">
                      <thead>
                        <tr>
                          {["Name", "Code", "Rate", "Type", "Actions"].map(h => (
                            <th key={h} className="table-th">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {rates.map((rate: any) => {
                          const isEditing = editId === rate.id
                          return (
                            <tr key={rate.id} className="table-row">
                              <td className="table-td">
                                {isEditing ? (
                                  <input value={editData.name ?? rate.name} onChange={e => setEditData((d: any) => ({ ...d, name: e.target.value }))}
                                    className="input py-1 px-2 text-sm w-40" />
                                ) : (
                                  <span className="font-bold text-sm text-slate-800">{rate.name}</span>
                                )}
                              </td>
                              <td className="table-td text-xs font-mono font-medium text-slate-500 uppercase tracking-widest">{rate.code ?? "—"}</td>
                              <td className="table-td">
                                {isEditing ? (
                                  <input type="number" value={editData.rate ?? rate.rate} onChange={e => setEditData((d: any) => ({ ...d, rate: Number(e.target.value) }))}
                                    className="input py-1 px-2 text-sm w-20" />
                                ) : (
                                  <span className="badge badge-blue text-sm px-2.5 py-0.5">{rate.rate}%</span>
                                )}
                              </td>
                              <td className="table-td text-xs text-slate-500">{rate.is_combined ? "Combined" : "Standard"}</td>
                              <td className="table-td">
                                {isEditing ? (
                                  <div className="flex gap-2">
                                    <button onClick={() => updateMutation.mutate({ id: rate.id, data: editData })}
                                      className="btn-icon bg-green-50 text-green-600 hover:bg-green-100 w-8 h-8">
                                      <Check className="w-4 h-4" />
                                    </button>
                                    <button onClick={() => setEditId(null)}
                                      className="btn-icon bg-slate-100 text-slate-500 hover:bg-slate-200 w-8 h-8">
                                      <X className="w-4 h-4" />
                                    </button>
                                  </div>
                                ) : (
                                  <div className="flex gap-2">
                                    <button onClick={() => { setEditId(rate.id); setEditData({ name: rate.name, rate: rate.rate, code: rate.code }) }}
                                      className="btn-icon bg-blue-50 text-blue-500 hover:bg-blue-100 w-8 h-8">
                                      <Edit3 className="w-3.5 h-3.5" />
                                    </button>
                                    <button onClick={() => deleteMutation.mutate(rate.id)}
                                      className="btn-icon bg-red-50 text-red-500 hover:bg-red-100 w-8 h-8">
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                )}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}
