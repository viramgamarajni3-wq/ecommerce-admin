"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { motion } from "framer-motion"
import { Tag, Plus, Trash2, Edit3, Check, X, Loader2, Hash } from "lucide-react"
import { adminApi } from "@/lib/api"
import toast from "react-hot-toast"

const TAG_COLORS = [
  "#f97316", "#3b82f6", "#10b981", "#8b5cf6", "#ec4899",
  "#f59e0b", "#06b6d4", "#ef4444", "#d946ef", "#14b8a6", "#6366f1", "#84cc16",
]

export default function AdminTagsPage() {
  const qc = useQueryClient()
  const [name, setName]     = useState("")
  const [color, setColor]   = useState(TAG_COLORS[0])
  const [editId, setEditId] = useState<string | null>(null)
  const [editData, setEditData] = useState<any>({})
  const [search, setSearch] = useState("")

  const { data, isLoading } = useQuery({
    queryKey: ["admin-tags"],
    queryFn: () => adminApi.tags().then(r => r.data.data ?? []),
  })

  const createMutation = useMutation({
    mutationFn: () => adminApi.createTag({ name: name.trim(), color }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-tags"] }); setName(""); toast.success("Tag created!") },
    onError: () => toast.error("Failed to create"),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: any) => adminApi.updateTag(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-tags"] }); setEditId(null); toast.success("Updated!") },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminApi.deleteTag(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-tags"] }); toast.success("Tag deleted") },
  })

  const tags = ((data ?? []) as any[]).filter((t: any) =>
    !search || t.name?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div>
      <div className="mb-6">
        <h1 className="page-title">Product Tags</h1>
        <p className="page-subtitle">Organise products with custom coloured labels</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-6">
        {/* Create form */}
        <div className="card-padded h-fit">
          <h2 className="font-bold text-slate-800 mb-5">Create Tag</h2>

          <div className="mb-4">
            <label className="label">Tag Name *</label>
            <input value={name} onChange={e => setName(e.target.value)}
              onKeyDown={e => e.key === "Enter" && name.trim() && createMutation.mutate()}
              placeholder="e.g. New Arrival" className="input" />
          </div>

          <div className="mb-5">
            <label className="label mb-2">Colour</label>
            <div className="flex gap-1.5 flex-wrap">
              {TAG_COLORS.map(c => (
                <button key={c} onClick={() => setColor(c)}
                  style={{ backgroundColor: c, boxShadow: color === c ? `0 0 0 3px white, 0 0 0 5px ${c}` : "none" }}
                  className={`w-6 h-6 rounded-full border-none cursor-pointer transition-all outline-none`} />
              ))}
            </div>
          </div>

          {/* Preview */}
          {name && (
            <div className="mb-5">
              <label className="label">Preview</label>
              <span style={{ backgroundColor: `${color}20`, color, borderColor: `${color}40` }}
                className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-bold border">
                # {name}
              </span>
            </div>
          )}

          <button onClick={() => name.trim() && createMutation.mutate()}
            disabled={!name.trim() || createMutation.isPending}
            className="btn-primary w-full justify-center">
            {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            Create Tag
          </button>

          <div className="mt-5 bg-slate-50 rounded-xl p-4">
            <p className="text-2xl font-extrabold text-brand-500">{(data as any[] ?? []).length}</p>
            <p className="text-sm text-slate-500">Total tags</p>
          </div>
        </div>

        {/* Tags grid */}
        <div>
          {/* Search */}
          <div className="relative mb-4">
            <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search tags…" className="input pl-9" />
          </div>

          {isLoading ? (
            <div className="card-padded flex justify-center py-10">
              <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
            </div>
          ) : tags.length === 0 ? (
            <div className="card-padded text-center py-14 text-slate-400">
              <Tag className="w-10 h-10 mx-auto mb-3 opacity-40" />
              <p className="font-semibold">{search ? "No matching tags" : "No tags yet"}</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
              {tags.map((t: any, i: number) => {
                const tc = t.color ?? TAG_COLORS[i % TAG_COLORS.length]
                const isEditing = editId === t.id
                return (
                  <motion.div key={t.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.03 }} className="card p-4">
                    {isEditing ? (
                      <>
                        <input value={editData.name ?? t.name}
                          onChange={e => setEditData((d: any) => ({ ...d, name: e.target.value }))}
                          className="input mb-2 text-sm py-1.5" />
                        <div className="flex gap-1 flex-wrap mb-2">
                          {TAG_COLORS.map(c => (
                            <button key={c} onClick={() => setEditData((d: any) => ({ ...d, color: c }))}
                              style={{ backgroundColor: c, boxShadow: (editData.color ?? t.color) === c ? `0 0 0 2px white, 0 0 0 4px ${c}` : "none" }}
                              className="w-4 h-4 rounded-full border-none cursor-pointer" />
                          ))}
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => updateMutation.mutate({ id: t.id, data: editData })}
                            className="flex-1 btn-success py-1.5 justify-center">
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => setEditId(null)}
                            className="flex-1 btn-secondary py-1.5 justify-center">
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="mb-2">
                          <span style={{ backgroundColor: `${tc}20`, color: tc, borderColor: `${tc}35` }}
                            className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border">
                            # {t.name}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mb-3">{t.product_count ?? 0} products</p>
                        <div className="flex gap-2">
                          <button onClick={() => { setEditId(t.id); setEditData({ name: t.name, color: t.color }) }}
                            className="flex-1 btn-icon bg-blue-50 text-blue-400 hover:bg-blue-100 w-auto h-auto py-1.5 rounded-lg">
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => deleteMutation.mutate(t.id)}
                            className="flex-1 btn-icon bg-red-50 text-red-400 hover:bg-red-100 w-auto h-auto py-1.5 rounded-lg">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </>
                    )}
                  </motion.div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
