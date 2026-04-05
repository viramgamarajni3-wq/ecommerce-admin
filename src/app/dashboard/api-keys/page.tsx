"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { motion } from "framer-motion"
import { Key, Plus, Trash2, Copy, Eye, EyeOff, Loader2, CheckCircle } from "lucide-react"
import { adminApi } from "@/lib/api"
import toast from "react-hot-toast"
import { format } from "date-fns"

export default function AdminApiKeysPage() {
  const qc = useQueryClient()
  const [title, setTitle] = useState("")
  const [showKey, setShowKey] = useState<Record<string, boolean>>({})
  const [newKeyData, setNewKeyData] = useState<any>(null)

  const { data, isLoading } = useQuery({
    queryKey: ["admin-api-keys"],
    queryFn: () => adminApi.apiKeys().then(r => r.data.data ?? []),
  })

  const createMutation = useMutation({
    mutationFn: () => adminApi.createApiKey({ title }),
    onSuccess: (res: any) => {
      qc.invalidateQueries({ queryKey: ["admin-api-keys"] })
      setNewKeyData(res.data.data)
      setTitle("")
      toast.success("API key created!")
    },
    onError: () => toast.error("Failed to create key"),
  })

  const revokeMutation = useMutation({
    mutationFn: (id: string) => adminApi.revokeApiKey(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-api-keys"] }); toast.success("Key revoked") },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminApi.deleteApiKey(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-api-keys"] }); toast.success("Key deleted") },
  })

  const copy = (text: string) => { navigator.clipboard.writeText(text); toast.success("Copied!") }
  const keys = data ?? []

  return (
    <div className="max-w-3xl">
      <div className="mb-6">
        <h1 className="page-title">API Keys</h1>
        <p className="page-subtitle">Manage publishable API keys for storefronts and third-party integrations</p>
      </div>

      {/* New key reveal */}
      {newKeyData && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 mb-5">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle className="w-5 h-5 text-emerald-600" />
            <span className="font-bold text-emerald-800 text-sm">New API key — copy it now, it won't show again</span>
          </div>
          <div className="flex gap-2">
            <code className="flex-1 bg-white border border-emerald-200 px-3 py-2 rounded-xl text-xs font-mono text-emerald-700 break-all">
              {newKeyData.secret_key ?? newKeyData.token}
            </code>
            <button onClick={() => copy(newKeyData.secret_key ?? newKeyData.token)} className="btn-success text-xs px-3">
              <Copy className="w-3.5 h-3.5" /> Copy
            </button>
          </div>
          <button onClick={() => setNewKeyData(null)} className="text-xs text-slate-400 mt-2 hover:text-slate-600">
            I've copied it — dismiss
          </button>
        </motion.div>
      )}

      {/* Create form */}
      <div className="card-padded mb-6">
        <h2 className="font-bold text-slate-800 mb-4">Create New Key</h2>
        <div className="flex flex-col sm:flex-row gap-2">
          <input value={title} onChange={e => setTitle(e.target.value)}
            onKeyDown={e => e.key === "Enter" && title.trim() && createMutation.mutate()}
            placeholder="e.g. Storefront Production, Mobile App"
            className="input flex-1" />
          <button onClick={() => title.trim() && createMutation.mutate()}
            disabled={!title.trim() || createMutation.isPending}
            className="btn-primary whitespace-nowrap">
            {createMutation.isPending
              ? <Loader2 className="w-4 h-4 animate-spin" />
              : <Plus className="w-4 h-4" />}
            Create Key
          </button>
        </div>
      </div>

      {/* Keys list */}
      {isLoading ? (
        <div className="card-padded flex justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
        </div>
      ) : keys.length === 0 ? (
        <div className="card-padded text-center text-slate-400 py-12">
          <Key className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p className="font-semibold">No API keys yet</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {keys.map((k: any, i: number) => (
            <motion.div key={k.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="card p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-4">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0
                ${k.revoked_at ? "bg-slate-100" : "bg-gradient-to-br from-brand-400 to-brand-600"}`}>
                <Key className={`w-4.5 h-4.5 ${k.revoked_at ? "text-slate-400" : "text-white"} w-[18px] h-[18px]`} />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="font-bold text-slate-800 text-sm">{k.title}</span>
                  {k.revoked_at && <span className="badge badge-red">Revoked</span>}
                </div>
                <div className="flex items-center gap-2">
                  <code className="text-xs font-mono text-slate-500 bg-slate-50 px-2 py-0.5 rounded-lg">
                    {showKey[k.id]
                      ? (k.token ?? k.publishable_key ?? "pk_*****")
                      : "••••••••••••••••••••"}
                  </code>
                  <button onClick={() => setShowKey(s => ({ ...s, [k.id]: !s[k.id] }))}
                    className="btn-icon bg-slate-50 text-slate-400 hover:text-slate-700 w-6 h-6">
                    {showKey[k.id] ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                  </button>
                  <button onClick={() => copy(k.token ?? k.publishable_key ?? "")}
                    className="btn-icon bg-slate-50 text-slate-400 hover:text-slate-700 w-6 h-6">
                    <Copy className="w-3 h-3" />
                  </button>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Created {k.created_at ? format(new Date(k.created_at), "dd MMM yyyy") : "—"}
                  {k.last_used_at && ` · Last used ${format(new Date(k.last_used_at), "dd MMM yyyy")}`}
                </p>
              </div>

              <div className="flex gap-2 shrink-0">
                {!k.revoked_at && (
                  <button onClick={() => revokeMutation.mutate(k.id)}
                    className="btn-secondary text-xs py-1.5 px-3 text-red-500 border-red-100 hover:bg-red-50">
                    Revoke
                  </button>
                )}
                <button onClick={() => deleteMutation.mutate(k.id)} className="btn-icon bg-red-50 text-red-400 hover:bg-red-100">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
