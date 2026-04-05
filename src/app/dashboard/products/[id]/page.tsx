"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useForm } from "react-hook-form"
import { adminApi } from "@/lib/api"
import { useRouter } from "next/navigation"
import toast from "react-hot-toast"
import { useEffect } from "react"
import { 
  Save, Loader2, ArrowLeft, Trash2, Boxes as BoxesIcon, 
  Settings2, Package, Truck, Globe2, MoreHorizontal, Image as ImageIcon
} from "lucide-react"
import Link from "next/link"
import { ImageUpload } from "@/components/common/ImageUpload"

export default function AdminEditProductPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const qc = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ["admin-product", params.id],
    queryFn: () => adminApi.getProduct(params.id).then(r => r.data.data),
  })

  const { data: catData } = useQuery({
    queryKey: ["admin-cats"],
    queryFn: () => adminApi.categories().then(r => r.data.data ?? []),
  })

  const { data: collections = [] } = useQuery({
    queryKey: ["admin-collections"],
    queryFn: () => adminApi.collections().then(r => r.data.data ?? []),
  })

  const { data: vendors = [] } = useQuery({
    queryKey: ["admin-vendors-approved"],
    queryFn: () => adminApi.vendors({ status: 'approved' }).then(r => r.data.data ?? []),
  })

  // Use reset() instead of 'values' to avoid the race condition where
  // dropdown options load AFTER form initialization, causing pre-select to fail.
  const { register, handleSubmit, reset } = useForm<any>()

  useEffect(() => {
    // Wait until the product data AND all dropdown lists are available
    // so the <select> elements have their <option>s rendered when we set values
    if (data && catData && collections && vendors) {
      reset({
        ...data,
        vendor_id: data.vendor_id ?? "",
        category_id: data.category_id ?? "",
        collection_id: data.collection_id ?? "",
      })
    }
  }, [data, catData, collections, vendors, reset])

  const updateMutation = useMutation({
    mutationFn: (d: any) => adminApi.updateProduct(params.id, { 
      ...d, 
      price: Number(d.price), 
      compare_at_price: d.compare_at_price ? Number(d.compare_at_price) : null,
      cost_price: d.cost_price ? Number(d.cost_price) : null,
      stock_quantity: Number(d.stock_quantity),
      weight_grams: d.weight_grams ? Number(d.weight_grams) : null,
      length_mm: d.length_mm ? Number(d.length_mm) : null,
      height_mm: d.height_mm ? Number(d.height_mm) : null,
      width_mm: d.width_mm ? Number(d.width_mm) : null,
    }),
    onSuccess: () => { 
      qc.invalidateQueries({ queryKey: ["admin-products"] })
      qc.invalidateQueries({ queryKey: ["admin-product", params.id] })
      toast.success("Product updated successfully!")
    },
    onError: () => toast.error("Failed to update"),
  })

  const deleteMutation = useMutation({
    mutationFn: () => adminApi.deleteProduct(params.id),
    onSuccess: () => { router.push("/dashboard/products"); toast.success("Product deleted") },
  })

  if (isLoading) return (
    <div className="flex justify-center items-center py-40">
      <Loader2 className="w-10 h-10 animate-spin text-brand-500" />
    </div>
  )

  return (
    <div className="max-w-5xl mx-auto pb-20">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/products" className="btn-secondary w-10 h-10 !p-0 shrink-0 no-underline">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="page-title text-2xl">Edit Product</h1>
            <p className="page-subtitle text-slate-500">{data?.name} — {data?.handle}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => { if (confirm("Delete this product?")) deleteMutation.mutate() }}
            className="btn-danger-outline px-4">
            <Trash2 className="w-4 h-4 mr-2" /> Delete
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit(d => updateMutation.mutate(d))} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main content */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* General Information */}
            <div className="card-padded shadow-sm">
              <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                <Settings2 className="w-5 h-5 text-brand-500" />
                General Information
              </h2>
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                   <div className="sm:col-span-2">
                    <label className="label">Product Name *</label>
                    <input {...register("name")} className="input" placeholder="Enter product name" />
                  </div>
                  <div>
                    <label className="label">Subtitle</label>
                    <input {...register("subtitle")} className="input" placeholder="Short catchphrase" />
                  </div>
                   <div>
                    <label className="label">Handle (URL)</label>
                    <input {...register("handle")} className="input font-mono text-xs" placeholder="my-cool-product" />
                  </div>
                </div>
                <div>
                  <label className="label">Full Description</label>
                  <textarea {...register("description")} rows={6} className="input resize-y" placeholder="Describe your product in detail..." />
                </div>
              </div>
            </div>

            {/* Pricing & Inventory */}
            <div className="card-padded shadow-sm">
              <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                <Package className="w-5 h-5 text-brand-500" />
                Pricing & Inventory
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                <div>
                  <label className="label">Price (₹) *</label>
                  <input type="number" step="0.01" {...register("price")} className="input font-bold" />
                </div>
                <div>
                  <label className="label">Compare At (₹)</label>
                  <input type="number" step="0.01" {...register("compare_at_price")} className="input text-slate-400" />
                </div>
                <div>
                  <label className="label">Cost Price (₹)</label>
                  <input type="number" step="0.01" {...register("cost_price")} className="input text-emerald-600" />
                </div>
                <div>
                  <label className="label">SKU</label>
                  <input {...register("sku")} className="input font-mono uppercase text-xs" />
                </div>
                <div>
                  <label className="label">Current Stock</label>
                  <input type="number" {...register("stock_quantity")} className="input" />
                </div>
                 <div>
                  <label className="label">Low Stock Threshold</label>
                  <input type="number" {...register("low_stock_threshold")} className="input" />
                </div>
              </div>
            </div>

            {/* Logistic & Dimensions */}
            <div className="card-padded shadow-sm">
              <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                <Truck className="w-5 h-5 text-brand-500" />
                Dimensions & Logistics
              </h2>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div>
                      <label className="label">Weight (g)</label>
                      <input type="number" {...register("weight_grams")} className="input" placeholder="0" />
                    </div>
                    <div>
                      <label className="label">Length (mm)</label>
                      <input type="number" {...register("length_mm")} className="input" placeholder="0" />
                    </div>
                    <div>
                      <label className="label">Width (mm)</label>
                      <input type="number" {...register("width_mm")} className="input" placeholder="0" />
                    </div>
                    <div>
                      <label className="label">Height (mm)</label>
                      <input type="number" {...register("height_mm")} className="input" placeholder="0" />
                    </div>
                  </div>
                </div>

                {/* Hardware Specification */}
                <div className="card-padded shadow-sm">
                  <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                    <Settings2 className="w-5 h-5 text-blue-500" />
                    Hardware Specifications
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                    <div>
                      <label className="label">Brand</label>
                      <input {...register("brand")} className="input" placeholder="e.g. Dell, Intel" />
                    </div>
                    <div>
                      <label className="label">Model</label>
                      <input {...register("model")} className="input" placeholder="e.g. Latitude 5420" />
                    </div>
                    <div>
                      <label className="label">Condition</label>
                      <select {...register("condition")} className="input">
                        <option value="new">New</option>
                        <option value="refurbished">Refurbished</option>
                      </select>
                    </div>
                    <div>
                      <label className="label">Processor</label>
                      <input {...register("processor")} className="input" placeholder="e.g. Core i7" />
                    </div>
                    <div>
                      <label className="label">CPU Gen</label>
                      <input {...register("cpu_generation")} className="input" placeholder="e.g. 12th Gen" />
                    </div>
                    <div>
                      <label className="label">GPU</label>
                      <input {...register("gpu")} className="input" placeholder="e.g. RTX 3060" />
                    </div>
                    <div>
                      <label className="label">RAM</label>
                      <input {...register("ram")} className="input" placeholder="e.g. 16GB DDR4" />
                    </div>
                    <div>
                      <label className="label">Storage</label>
                      <input {...register("storage")} className="input" placeholder="e.g. 512GB" />
                    </div>
                    <div>
                      <label className="label">Storage Type</label>
                      <select {...register("storage_type")} className="input">
                        <option value="SSD">SSD</option>
                        <option value="HDD">HDD</option>
                        <option value="NVMe">NVMe</option>
                      </select>
                    </div>
                    <div>
                      <label className="label">Display Size</label>
                      <input {...register("display_size")} className="input" placeholder="e.g. 15.6 inch" />
                    </div>
                    <div>
                      <label className="label">OS</label>
                      <input {...register("operating_system")} className="input" placeholder="e.g. Windows 11" />
                    </div>
                    <div>
                      <label className="label">Warranty</label>
                      <input {...register("warranty")} className="input" placeholder="e.g. 1 Year" />
                    </div>
                  </div>
                </div>

                {/* Bulk Pricing */}
                <div className="card-padded shadow-sm border-2 border-emerald-50 bg-emerald-50/10">
                  <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                    <Package className="w-5 h-5 text-emerald-500" />
                    Bulk & Business Pricing
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="label">Bulk Price (₹)</label>
                      <input type="number" step="0.01" {...register("bulk_price")} className="input border-emerald-200" placeholder="Price for bulk orders" />
                    </div>
                    <div>
                      <label className="label">Min Bulk Qty</label>
                      <input type="number" {...register("minimum_bulk_quantity")} className="input border-emerald-200" placeholder="10" />
                    </div>
                    <div>
                      <label className="label">Wholesale Price (₹)</label>
                      <input type="number" step="0.01" {...register("wholesale_price")} className="input" />
                    </div>
                  </div>
                </div>

            {/* Customs & Origin */}
            <div className="card-padded shadow-sm">
              <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                <Globe2 className="w-5 h-5 text-brand-500" />
                Customs & Origin
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="label">Origin Country</label>
                  <input {...register("origin_country")} className="input" placeholder="e.g. India" />
                </div>
                <div>
                  <label className="label">Material</label>
                  <input {...register("material")} className="input" placeholder="e.g. Cotton, Steel" />
                </div>
                <div>
                  <label className="label">HS Code</label>
                  <input {...register("hs_code")} className="input font-mono text-xs" />
                </div>
                <div>
                  <label className="label">MID Code</label>
                  <input {...register("mid_code")} className="input font-mono text-xs" />
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar content */}
          <div className="lg:col-span-4 space-y-6">
            {/* Stock & Variants Summary (Medusa-like) */}
            <div className="card-padded shadow-sm bg-white">
                <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                    <BoxesIcon className="w-5 h-5 text-brand-500" />
                    Stock & Variants
                </h2>
                <div className="space-y-3">
                    {data?.variants?.length > 0 ? (
                        data.variants.map((v: any) => (
                            <div key={v.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-200">
                                <div className="min-w-0">
                                    <div className="text-sm font-bold text-slate-800 truncate">{v.title}</div>
                                    <div className="text-[10px] font-mono text-slate-400 uppercase">{v.sku || "No SKU"}</div>
                                </div>
                                <div className="text-right shrink-0">
                                    <div className={`text-sm font-black ${(v.inventory_quantity ?? 0) > 10 ? 'text-emerald-600' : 'text-red-500'}`}>
                                        {v.inventory_quantity ?? 0}
                                    </div>
                                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">₹{v.price}</div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-6 text-slate-400 text-sm italic">
                            No variants found. Stock is managed per variant.
                        </div>
                    )}
                    <Link href={`/dashboard/products/${params.id}/variants`} className="btn-secondary w-full text-center py-2 text-xs font-bold no-underline block mt-2">
                        Manage All Variants & Stock
                    </Link>
                </div>
            </div>
            
            {/* Status & Options */}
            <div className="card-padded shadow-sm bg-slate-50 border-slate-200">
               <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400 mb-5">Product Status</h3>
               <select {...register("status")} className="input mb-4 font-bold border-2">
                <option value="draft">Draft</option>
                <option value="active">Active</option>
                <option value="archived">Archived</option>
              </select>
              
               <div className="flex items-center gap-2 mb-4 p-3 bg-white rounded-lg border border-slate-200">
                <input type="checkbox" {...register("is_featured")} id="is_featured" className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500" />
                <label htmlFor="is_featured" className="text-sm font-bold text-slate-700 cursor-pointer">Featured Product</label>
              </div>
              <div className="flex items-center gap-2 p-3 bg-white rounded-lg border border-slate-200">
                <input type="checkbox" {...register("is_digital")} id="is_digital" className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500" />
                <label htmlFor="is_digital" className="text-sm font-bold text-slate-700 cursor-pointer">Digital Product</label>
              </div>
            </div>

            {/* Media */}
            <div className="card-padded shadow-sm bg-white">
               <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400 mb-5">Media</h3>
               <ImageUpload 
                productId={params.id} 
                onUploadSuccess={(url) => {
                  qc.invalidateQueries({ queryKey: ["admin-product", params.id] })
                }} 
                label="Product Thumbnail"
               />
               {data?.thumbnail && (
                 <div className="mt-4 p-2 border rounded-lg bg-slate-50 group relative">
                    <img src={data.thumbnail} className="w-full h-auto rounded" alt="Thumbnail" />
                    <div className="absolute top-4 right-4 badge badge-blue shadow-lg">Primary</div>
                 </div>
               )}
            </div>

            {/* Organization */}
            <div className="card-padded shadow-sm bg-white">
              <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400 mb-5">Organization</h3>
              <div className="space-y-4">
                <div>
                  <label className="label">Vendor</label>
                  {/* Hidden input keeps vendor_id in form data — vendor cannot be changed after creation */}
                  <input type="hidden" {...register("vendor_id")} />
                  <div className="flex items-center gap-2 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white font-black text-xs shrink-0">
                      {(data?.vendor_name ?? "V").charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-800 truncate">{data?.vendor_name ?? "—"}</p>
                      <p className="text-xs text-slate-400">Vendor · Cannot be changed</p>
                    </div>
                    {data?.vendor_id && (
                      <Link href={`/dashboard/vendors/${data.vendor_id}`}
                        className="text-xs text-brand-500 font-semibold hover:underline no-underline shrink-0">
                        View →
                      </Link>
                    )}
                  </div>
                </div>
                <div>
                  <label className="label">Category</label>
                  <select {...register("category_id")} className="input cursor-pointer">
                    <option value="">No category</option>
                    {(catData ?? []).map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Collection</label>
                  <select {...register("collection_id")} className="input cursor-pointer">
                    <option value="">No collection</option>
                    {(collections ?? []).map((c: any) => <option key={c.id} value={c.id}>{c.title}</option>)}
                  </select>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="pt-4">
              <button type="submit" disabled={updateMutation.isPending} 
                className="btn-primary w-full h-14 justify-center text-lg rounded-2xl shadow-xl shadow-brand-100 uppercase tracking-widest font-black">
                {updateMutation.isPending ? <Loader2 className="w-6 h-6 animate-spin" /> : <Save className="w-6 h-6" />}
                Save Changes
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}
