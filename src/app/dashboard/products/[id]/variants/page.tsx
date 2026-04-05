"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { adminApi } from "@/lib/api"
import { useRouter } from "next/navigation"
import toast from "react-hot-toast"
import { ArrowLeft, Loader2, Plus, Trash2, Edit3, Check, X, ChevronDown, ImageIcon, Upload } from "lucide-react"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { ImageUpload } from "@/components/common/ImageUpload"

export default function AdminProductVariantsPage({ params }: { params: { id: string } }) {
  const qc = useQueryClient()
  const [newOption, setNewOption] = useState({ name: "", values: "" })
  const [newVariant, setNewVariant] = useState({ title: "", sku: "", price: "", stock: "", thumbnail_url: "", attributes: {} })
  const [editVariantId, setEditVariantId] = useState<string | null>(null)
  const [editVariant, setEditVariant] = useState<any>({})

  const { data: product, isLoading } = useQuery({
    queryKey: ["admin-product-variants", params.id],
    queryFn: () => adminApi.getProduct(params.id).then(r => r.data.data),
  })

  const addOptionMutation = useMutation({
    mutationFn: () => adminApi.addProductOption(params.id, {
      name: newOption.name,
      values: newOption.values.split(",").map(v => v.trim()).filter(Boolean),
    }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-product-variants", params.id] }); setNewOption({ name: "", values: "" }); toast.success("Option added!") },
    onError: () => toast.error("Failed to add option"),
  })

  const deleteOptionMutation = useMutation({
    mutationFn: (optId: string) => adminApi.deleteProductOption(params.id, optId),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-product-variants", params.id] }); toast.success("Option deleted") },
  })

  const [editingOptionId, setEditingOptionId] = useState<string | null>(null)
  const [editOptionData, setEditOptionData] = useState<any>({ name: "", values: "" })

  const updateOptionMutation = useMutation({
    mutationFn: () => adminApi.updateProductOption(params.id, editingOptionId!, {
      name: editOptionData.name,
      values: editOptionData.values.split(",").map((v: any) => v.trim()).filter(Boolean),
    }),
    onSuccess: () => { 
      qc.invalidateQueries({ queryKey: ["admin-product-variants", params.id] }); 
      setEditingOptionId(null);
      toast.success("Option updated!"); 
    },
    onError: () => toast.error("Update failed"),
  })

  const addVariantMutation = useMutation({
    mutationFn: () => adminApi.addProductVariant(params.id, {
      title: newVariant.title,
      sku: newVariant.sku,
      price: Number(newVariant.price),
      stock_quantity: Number(newVariant.stock),
      thumbnail_url: newVariant.thumbnail_url,
      attributes: newVariant.attributes
    }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-product-variants", params.id] }); setNewVariant({ title: "", sku: "", price: "", stock: "", thumbnail_url: "", attributes: {} }); toast.success("Variant added!") },
    onError: () => toast.error("Failed to add variant"),
  })

  const updateVariantMutation = useMutation({
    mutationFn: ({ variantId, data }: { variantId: string; data: any }) => 
      adminApi.updateProductVariant(params.id, variantId, { ...data, stock_quantity: data.inventory_quantity }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-product-variants", params.id] }); setEditVariantId(null); toast.success("Variant updated!") },
  })

  const deleteVariantMutation = useMutation({
    mutationFn: (variantId: string) => adminApi.deleteProductVariant(params.id, variantId),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-product-variants", params.id] }); toast.success("Variant deleted") },
  })

  // ─── Generate Variants Logic ─────────────────────────────────
  const generateVariantsMutation = useMutation({
    mutationFn: async () => {
      if (!product?.options?.length) return;
      
      const optionSets = product.options.map((o: any) => ({
        title: o.title,
        values: o.metadata?.values || o.values || []
      }));

      // Cartesian product to get all combinations
      const cartesian = (...args: any[]) => args.reduce((a, b) => a.flatMap((d: any) => b.map((e: any) => [...d, e])), [[]]);
      const combinations = cartesian(...optionSets.map((o: any) => o.values));
      const existingSkus = new Set((product.variants || []).map((v: any) => v.sku?.toUpperCase()));

      for (const combo of combinations) {
        const sku = `${product.slug}-${combo.join("-")}`.toUpperCase();
        if (existingSkus.has(sku)) continue;

        const title = combo.join(" / ");
        const attributes = combo.reduce((acc: any, val: any, idx: number) => {
          acc[optionSets[idx].title.toLowerCase()] = val;
          return acc;
        }, {});

        try {
          await adminApi.addProductVariant(params.id, {
            title,
            sku,
            price: product.price || 0,
            stock_quantity: 0,
            attributes
          });
        } catch (err: any) {
          console.warn("Skipping variant creation:", sku, err.response?.data?.error);
        }
      }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-product-variants", params.id] }); toast.success("Variants generated!") },
    onError: () => toast.error("Generation failed"),
  })

  if (isLoading) return <div className="flex justify-center items-center py-20"><Loader2 className="w-10 h-10 animate-spin text-brand-500" /></div>

  const options = product?.options ?? []
  const variants = product?.variants ?? []

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/dashboard/products/${params.id}`} className="btn-secondary w-10 h-10 !p-0 shrink-0 no-underline">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="page-title">Product Variants</h1>
          <p className="page-subtitle">{product?.name} — {variants.length} variants</p>
        </div>
      </div>

      {/* ── Product Options ────────────────────────────── */}
      <div className="card-padded">
        <h2 className="font-bold text-slate-800 mb-5">Product Options <span className="text-xs text-slate-400 font-medium ml-2">(e.g. Size, Color)</span></h2>

        {/* Existing options */}
        {options.length > 0 && (
          <div className="space-y-3 mb-6">
            {options.map((opt: any) => {
              const isEditing = editingOptionId === opt.id
              const currentValues = (opt.metadata?.values ?? opt.values ?? []).map((v: any) => v.value ?? v).join(", ")
              
              return (
                <motion.div key={opt.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="flex-1">
                    {isEditing ? (
                      <div className="flex flex-col sm:flex-row gap-3">
                        <div className="flex-1">
                          <label className="text-[10px] uppercase font-bold text-slate-400">Option Name</label>
                          <input value={editOptionData.name} onChange={e => setEditOptionData((d: any) => ({ ...d, name: e.target.value }))} className="input h-9 text-sm" />
                        </div>
                        <div className="flex-[2]">
                          <label className="text-[10px] uppercase font-bold text-slate-400">Values (comma separated)</label>
                          <input value={editOptionData.values} onChange={e => setEditOptionData((d: any) => ({ ...d, values: e.target.value }))} className="input h-9 text-sm" />
                        </div>
                      </div>
                    ) : (
                      <>
                        <span className="font-bold text-sm text-slate-800">{opt.title ?? opt.name}</span>
                        <div className="flex gap-2 flex-wrap mt-2">
                          {(opt.metadata?.values ?? opt.values ?? []).map((v: any) => (
                            <span key={v.id ?? v} className="badge badge-blue px-2.5 py-1">
                              {v.value ?? v}
                            </span>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                  <div className="flex gap-2 shrink-0 self-end sm:self-center">
                    {isEditing ? (
                      <>
                        <button onClick={() => updateOptionMutation.mutate()} className="btn-icon bg-emerald-50 text-emerald-600 hover:bg-emerald-100 w-8 h-8">
                          <Check className="w-4 h-4" />
                        </button>
                        <button onClick={() => setEditingOptionId(null)} className="btn-icon bg-slate-100 text-slate-500 hover:bg-slate-200 w-8 h-8">
                          <X className="w-4 h-4" />
                        </button>
                      </>
                    ) : (
                      <>
                        <button onClick={() => { setEditingOptionId(opt.id); setEditOptionData({ name: opt.title ?? opt.name, values: currentValues }) }}
                          className="btn-icon bg-blue-50 text-blue-500 hover:bg-blue-100 w-8 h-8">
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button onClick={() => deleteOptionMutation.mutate(opt.id)}
                          className="btn-icon bg-red-50 text-red-500 hover:bg-red-100 shrink-0 w-8 h-8">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}

        {/* Add option form */}
        <div className="flex flex-col sm:flex-row gap-4 items-end bg-slate-50 p-4 rounded-xl border border-slate-100">
          <div className="w-full sm:flex-1">
            <label className="label">Option Name</label>
            <input value={newOption.name} onChange={e => setNewOption(o => ({ ...o, name: e.target.value }))}
              placeholder="e.g. Size" className="input bg-white" />
          </div>
          <div className="w-full sm:flex-[2]">
            <label className="label">Values (comma separated)</label>
            <input value={newOption.values} onChange={e => setNewOption(o => ({ ...o, values: e.target.value }))}
              placeholder="e.g. S, M, L, XL" className="input bg-white" />
          </div>
          <button onClick={() => newOption.name.trim() && addOptionMutation.mutate()} disabled={!newOption.name.trim() || addOptionMutation.isPending}
            className="btn-primary w-full sm:w-auto mt-2 sm:mt-0">
            {addOptionMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            Add Option
          </button>
        </div>
      </div>

      {/* ── Variants Table ─────────────────────────────── */}
      <div className="card overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-white">
          <h2 className="font-bold text-slate-800 text-lg m-0">Variants ({variants.length})</h2>
          {options.length > 0 && (
            <button onClick={() => generateVariantsMutation.mutate()} disabled={generateVariantsMutation.isPending}
              className="btn-secondary text-xs uppercase tracking-widest font-black py-2">
              Generate All Combinations
            </button>
          )}
        </div>

        {/* Add variant row */}
        <div className="p-5 bg-slate-50 border-b border-slate-100 flex flex-col sm:flex-row gap-4 sm:items-end flex-wrap">
          <div className="flex-1 min-w-[200px]">
            <label className="label">Title *</label>
            <input value={newVariant.title} onChange={e => setNewVariant(v => ({ ...v, title: e.target.value }))}
              placeholder="e.g. S / Red" className="input bg-white" />
          </div>
          <div className="w-full sm:w-32">
            <label className="label">SKU</label>
            <input value={newVariant.sku} onChange={e => setNewVariant(v => ({ ...v, sku: e.target.value }))}
              placeholder="SHIRT-S" className="input font-mono text-xs bg-white uppercase" />
          </div>
          <div className="flex-1 min-w-[150px]">
            <ImageUpload productId={params.id} onUploadSuccess={(url) => setNewVariant(v => ({ ...v, thumbnail_url: url }))} />
          </div>
          <div className="w-[48%] sm:w-28">
            <label className="label">Price (₹) *</label>
            <input type="number" value={newVariant.price} onChange={e => setNewVariant(v => ({ ...v, price: e.target.value }))}
              placeholder="999" className="input bg-white" />
          </div>
          <div className="w-[48%] sm:w-24">
            <label className="label">Stock</label>
            <input type="number" value={newVariant.stock} onChange={e => setNewVariant(v => ({ ...v, stock: e.target.value }))}
              placeholder="50" className="input bg-white" />
          </div>
          <button onClick={() => newVariant.title.trim() && newVariant.price && addVariantMutation.mutate()}
            disabled={!newVariant.title.trim() || !newVariant.price || addVariantMutation.isPending}
            className="btn-primary bg-gradient-to-r w-full sm:w-auto from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 border-none shadow-sm h-[42px]">
            {addVariantMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            Add Variant
          </button>
        </div>

        {/* Variants list */}
        {variants.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <p className="font-medium text-base">No variants yet — add your first variant above</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table-base w-full">
              <thead>
                <tr>
                  {["Image", "Variant Title", "SKU", "Price (₹)", "Stock", "Status", "Actions"].map(h => (
                    <th key={h} className="table-th whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {variants.map((v: any) => {
                  const isEditing = editVariantId === v.id
                  return (
                    <tr key={v.id} className="table-row">
                      <td className="table-td w-16">
                        {isEditing ? (
                          <div className="w-24">
                            <ImageUpload productId={params.id} initialPreview={v.thumbnail_url || v.image_url} onUploadSuccess={(url) => setEditVariant((ev: any) => ({ ...ev, thumbnail_url: url }))} />
                          </div>
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-slate-100 overflow-hidden border border-slate-200">
                            {v.thumbnail_url ? (
                              <img src={v.thumbnail_url} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-[10px] text-slate-400">NA</div>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="table-td">
                        {isEditing ? (
                          <input value={editVariant.title ?? v.title} onChange={e => setEditVariant((ev: any) => ({ ...ev, title: e.target.value }))}
                            className="input py-1.5 min-w-[140px]" />
                        ) : (
                          <span className="font-bold text-slate-800 text-sm">{v.title}</span>
                        )}
                      </td>
                      <td className="table-td">
                        {isEditing ? (
                          <input value={editVariant.sku ?? v.sku ?? ""} onChange={e => setEditVariant((ev: any) => ({ ...ev, sku: e.target.value }))}
                            className="input py-1.5 font-mono text-xs uppercase min-w-[100px]" />
                        ) : (
                          <span className="text-xs font-mono text-slate-500 bg-slate-50 px-2 py-1 rounded border border-slate-100">{v.sku ?? "—"}</span>
                        )}
                      </td>
                      <td className="table-td">
                        {isEditing ? (
                          <input type="number" value={editVariant.price ?? v.price} onChange={e => setEditVariant((ev: any) => ({ ...ev, price: Number(e.target.value) }))}
                            className="input py-1.5 w-24" />
                        ) : (
                          <span className="font-bold text-slate-800">₹{Number(v.price ?? 0).toLocaleString("en-IN")}</span>
                        )}
                      </td>
                      <td className="table-td">
                        {isEditing ? (
                          <input type="number" value={editVariant.inventory_quantity ?? v.inventory_quantity ?? 0} onChange={e => setEditVariant((ev: any) => ({ ...ev, inventory_quantity: Number(e.target.value) }))}
                            className="input py-1.5 w-20" />
                        ) : (
                          <span className={`font-bold ${(v.inventory_quantity ?? 0) === 0 ? "text-red-500" : "text-emerald-500"}`}>
                            {v.inventory_quantity ?? 0}
                          </span>
                        )}
                      </td>
                      <td className="table-td">
                        <span className={`badge ${v.allow_backorder ? "badge-blue" : "badge-green"}`}>
                          {v.allow_backorder ? "Backorder" : "Normal"}
                        </span>
                      </td>
                      <td className="table-td w-1 whitespace-nowrap">
                        {isEditing ? (
                          <div className="flex gap-2">
                            <button onClick={() => updateVariantMutation.mutate({ variantId: v.id, data: editVariant })}
                              className="btn-icon bg-green-50 text-green-600 hover:bg-green-100 w-8 h-8">
                              <Check className="w-4 h-4" />
                            </button>
                            <button onClick={() => setEditVariantId(null)}
                              className="btn-icon bg-slate-100 text-slate-500 hover:bg-slate-200 w-8 h-8">
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex gap-2">
                            <button onClick={() => { setEditVariantId(v.id); setEditVariant({ title: v.title, sku: v.sku, price: v.price, inventory_quantity: v.inventory_quantity, thumbnail_url: v.thumbnail_url || v.image_url }) }}
                              className="btn-icon bg-blue-50 text-blue-500 hover:bg-blue-100 w-8 h-8">
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button onClick={() => deleteVariantMutation.mutate(v.id)}
                              className="btn-icon bg-red-50 text-red-500 hover:bg-red-100 w-8 h-8">
                              <Trash2 className="w-4 h-4" />
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
      </div>
    </div>
  )
}
