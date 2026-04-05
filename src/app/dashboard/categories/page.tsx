"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { motion } from "framer-motion"
import { Search, Plus, Trash2, Tag, Loader2 } from "lucide-react"
import { adminApi } from "@/lib/api"
import toast from "react-hot-toast"

export default function AdminCategoriesPage() {
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [search, setSearch] = useState("")
  const qc = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ["admin-cats"],
    queryFn: () => adminApi.categories().then(r => r.data.data ?? []),
  })

  const createMutation = useMutation({
    mutationFn: () => adminApi.createCategory({ name, description }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-cats"] }); setName(""); setDescription(""); toast.success("Category created!") },
    onError: () => toast.error("Failed to create category"),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminApi.deleteCategory(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-cats"] }); toast.success("Category deleted") },
    onError: () => toast.error("Failed to delete"),
  })

  const cats = (data ?? []).filter((c: any) => c.name?.toLowerCase().includes(search.toLowerCase()))

  return (
    <div>
      <div className="mb-6">
        <h1 className="page-title">Categories</h1>
        <p className="page-subtitle">Manage product categories</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Create form */}
        <div className="card-padded h-fit">
          <h2 className="font-bold text-slate-800 mb-5">Add Category</h2>
          <div className="flex flex-col gap-4">
            <div>
              <label className="label">Category Name *</label>
              <input value={name} onChange={e => setName(e.target.value)}
                placeholder="e.g. Electronics" className="input" />
            </div>
            <div>
              <label className="label">Description</label>
              <textarea value={description} onChange={e => setDescription(e.target.value)}
                rows={3} placeholder="Brief description…" className="input resize-y" />
            </div>
            <button
              onClick={() => name.trim() && createMutation.mutate()}
              disabled={createMutation.isPending || !name.trim()}
              className="btn-primary w-full mt-2">
              {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Add Category
            </button>
          </div>
        </div>

        {/* Categories list */}
        <div className="card overflow-hidden lg:col-span-2">
          <div className="p-5 border-b border-slate-100">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search categories…" className="input pl-9" />
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center h-48">
              <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
            </div>
          ) : cats.length === 0 ? (
            <div className="text-center py-14 text-slate-400">
              <Tag className="w-10 h-10 mx-auto mb-3 opacity-40" />
              <p className="font-semibold">No categories yet</p>
            </div>
          ) : (
            <div className="p-4 flex flex-col gap-2">
              {cats.map((c: any, i: number) => (
                <motion.div key={c.id}
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                  className="flex items-center justify-between p-4 rounded-xl border border-slate-100 bg-slate-50 hover:bg-white transition-colors group">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center shrink-0 shadow-sm">
                      <Tag className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <div className="font-bold text-sm text-slate-800">{c.name}</div>
                      {c.description && <div className="text-xs text-slate-500 mt-0.5 line-clamp-1">{c.description}</div>}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-semibold text-slate-500 bg-white border border-slate-200 px-2.5 py-1 rounded-lg">
                      {c.product_count ?? 0} products
                    </span>
                    <button onClick={() => deleteMutation.mutate(c.id)}
                      className="btn-icon bg-red-50 text-red-500 hover:bg-red-100 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
