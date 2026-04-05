"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { motion } from "framer-motion"
import { Search, Plus, Trash2, FolderOpen, Loader2 } from "lucide-react"
import { adminApi } from "@/lib/api"
import toast from "react-hot-toast"
import { format } from "date-fns"

export default function AdminCollectionsPage() {
  const [title, setTitle] = useState("")
  const [handle, setHandle] = useState("")
  const [search, setSearch] = useState("")
  const qc = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ["admin-collections"],
    queryFn: () => adminApi.collections().then(r => r.data.data ?? []),
  })

  const createMutation = useMutation({
    mutationFn: () => adminApi.createCollection({ title, handle }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-collections"] }); setTitle(""); setHandle(""); toast.success("Collection created!") },
    onError: () => toast.error("Failed to create"),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminApi.deleteCollection(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-collections"] }); toast.success("Deleted") },
    onError: () => toast.error("Failed to delete"),
  })

  const collections = (data ?? []).filter((c: any) => c.title?.toLowerCase().includes(search.toLowerCase()))

  return (
    <div>
      <div className="mb-6">
        <h1 className="page-title">Collections</h1>
        <p className="page-subtitle">Group products into curated collections</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Create form */}
        <div className="card-padded h-fit lg:sticky lg:top-6">
          <h2 className="font-bold text-slate-800 mb-5">New Collection</h2>
          <div className="flex flex-col gap-4">
            <div>
              <label className="label">Title *</label>
              <input value={title} onChange={e => { setTitle(e.target.value); setHandle(e.target.value.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "")) }}
                placeholder="Summer Sale" className="input" />
            </div>
            <div>
              <label className="label">Handle (URL slug)</label>
              <input value={handle} onChange={e => setHandle(e.target.value)}
                placeholder="summer-sale" className="input font-mono bg-slate-50 text-slate-500" />
            </div>
            <button onClick={() => title.trim() && createMutation.mutate()} disabled={!title.trim() || createMutation.isPending}
              className="btn-primary w-full mt-2">
              {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Create Collection
            </button>
          </div>
        </div>

        {/* List */}
        <div className="card overflow-hidden lg:col-span-2">
          <div className="p-4 border-b border-slate-100">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search collections…" className="input pl-9" />
            </div>
          </div>
          {isLoading ? (
            <div className="flex justify-center items-center h-48">
              <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
            </div>
          ) : collections.length === 0 ? (
            <div className="text-center py-16 text-slate-400">
              <FolderOpen className="w-10 h-10 mx-auto mb-3 opacity-40" />
              <p className="font-medium text-base">No collections yet</p>
            </div>
          ) : (
            <div className="p-3">
              {collections.map((c: any, i: number) => (
                <motion.div key={c.id}
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl mb-2 border border-slate-100 bg-slate-50 hover:bg-white hover:shadow-sm transition-all group">
                  <div className="flex gap-4 items-center mb-3 sm:mb-0">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center shrink-0 shadow-sm">
                      <FolderOpen className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <div className="font-bold text-slate-800 text-sm">{c.title}</div>
                      <div className="text-xs text-slate-400 font-mono mt-0.5">/{c.handle}</div>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="badge badge-gray text-xs px-2 py-0.5">
                      {c.products?.length ?? 0} products
                    </span>
                    <span className="text-xs text-slate-400 font-medium">
                      {c.created_at ? format(new Date(c.created_at), "dd MMM yy") : ""}
                    </span>
                    <button onClick={() => deleteMutation.mutate(c.id)}
                      className="btn-icon bg-red-50 text-red-500 hover:bg-red-100 opacity-1 sm:opacity-0 group-hover:opacity-100 transition-opacity ml-auto sm:ml-2">
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
