"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { adminApi } from "@/lib/api"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Image as ImageIcon, Search, Package, Check, X, 
  Loader2, ChevronRight, Globe, Filter, Grid, List as ListIcon 
} from "lucide-react"
import toast from "react-hot-toast"

export default function VariantImagesPage() {
  const qc = useQueryClient()
  const [search, setSearch] = useState("")
  const [selectedProduct, setSelectedProduct] = useState<any>(null)
  const [selectedVariant, setSelectedVariant] = useState<any>(null)

  // 1. Fetch all products
  const { data: productsData, isLoading: loadingProducts } = useQuery({
    queryKey: ["admin-products", search],
    queryFn: () => adminApi.products({ q: search }).then(r => r.data.data.products),
  })

  // 2. Fetch specific product with variants & images
  const { data: productDetails, isLoading: loadingDetails } = useQuery({
    queryKey: ["admin-product-details", selectedProduct?.id],
    queryFn: () => adminApi.getProduct(selectedProduct.id).then(r => r.data.data),
    enabled: !!selectedProduct,
  })

  // 3. Fetch images linked to the specific variant
  const { data: variantImages = [], isLoading: loadingImages } = useQuery({
    queryKey: ["admin-variant-images", selectedVariant?.id],
    queryFn: () => adminApi.getVariantImages(selectedProduct.id, selectedVariant.id).then(r => r.data.data),
    enabled: !!selectedVariant,
  })

  const linkMutation = useMutation({
    mutationFn: (imageIds: string[]) => adminApi.linkVariantImages(selectedProduct.id, selectedVariant.id, imageIds),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-variant-images", selectedVariant?.id] })
      toast.success("Images linked successfully!")
    }
  })

  const unlinkMutation = useMutation({
    mutationFn: (imageId: string) => adminApi.unlinkVariantImage(selectedProduct.id, selectedVariant.id, imageId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-variant-images", selectedVariant?.id] })
      toast.success("Image unlinked")
    }
  })

  const isImageLinked = (imgId: string) => variantImages.some((i: any) => i.id === imgId)

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <Globe className="w-6 h-6 text-brand-500" />
            Variant Visuals
          </h1>
          <p className="page-subtitle text-slate-500">Assign specific gallery images to product variants for enterprise-grade display</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Step 1: Product Selection */}
        <div className="lg:col-span-4 space-y-4">
          <div className="card-padded">
            <h2 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-[10px] text-slate-500">1</span>
              Select Product
            </h2>
            
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                value={search} 
                onChange={e => setSearch(e.target.value)}
                placeholder="Search products..." 
                className="input pl-9"
              />
            </div>

            <div className="max-height-[500px] overflow-y-auto space-y-2 pr-2 custom-scrollbar">
              {loadingProducts ? (
                <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-brand-500" /></div>
              ) : productsData?.map((p: any) => (
                <button
                  key={p.id}
                  onClick={() => { setSelectedProduct(p); setSelectedVariant(null); }}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all border text-left ${
                    selectedProduct?.id === p.id 
                    ? "bg-brand-50 border-brand-200 shadow-sm" 
                    : "bg-white border-slate-100 hover:border-slate-300"
                  }`}
                >
                  <div className="w-10 h-10 rounded-lg bg-slate-100 overflow-hidden shrink-0 border border-slate-200">
                    {p.thumbnail ? <img src={p.thumbnail} className="w-full h-full object-cover" /> : <Package className="w-full h-full p-2 text-slate-300" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-bold truncate ${selectedProduct?.id === p.id ? "text-brand-600" : "text-slate-800"}`}>{p.name}</p>
                    <p className="text-[10px] text-slate-400 font-mono tracking-tighter uppercase">{p.id.slice(0,8)}...</p>
                  </div>
                  <ChevronRight className={`w-4 h-4 ${selectedProduct?.id === p.id ? "text-brand-400" : "text-slate-300"}`} />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Step 2 & 3: Variant & Image Mapping */}
        <div className="lg:col-span-8 space-y-6">
          <AnimatePresence mode="wait">
            {!selectedProduct ? (
              <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="card-padded border-dashed border-2 flex flex-col items-center justify-center py-32 text-slate-400"
              >
                <ImageIcon className="w-12 h-12 mb-4 opacity-10" />
                <p className="font-medium text-lg">Select a product to start mapping visuals</p>
                <p className="text-sm opacity-60 mt-1">Enhance your store experience with variant-specific galleries</p>
              </motion.div>
            ) : (
              <motion.div 
                key={selectedProduct.id}
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                {/* Variant Selector */}
                <div className="card-padded">
                   <h2 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-5 flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-[10px] text-slate-500">2</span>
                    Choose Variant
                  </h2>
                  <div className="flex gap-2 flex-wrap">
                    {productDetails?.variants?.map((v: any) => (
                      <button
                        key={v.id}
                        onClick={() => setSelectedVariant(v)}
                        className={`px-4 py-2.5 rounded-xl font-bold text-sm transition-all border flex items-center gap-2 ${
                          selectedVariant?.id === v.id 
                          ? "bg-slate-800 border-slate-800 text-white shadow-lg shadow-slate-200" 
                          : "bg-white border-slate-200 text-slate-600 hover:border-slate-400"
                        }`}
                      >
                        {v.title}
                        {selectedVariant?.id === v.id && <div className="w-2 h-2 rounded-full bg-brand-400 animate-pulse" />}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Image Mapper */}
                {selectedVariant && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}
                    className="card-padded overflow-hidden"
                  >
                    <div className="flex items-center justify-between mb-6">
                       <h2 className="text-sm font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-[10px] text-slate-500">3</span>
                        Map Visuals for {selectedVariant.title}
                      </h2>
                      <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 bg-slate-50 px-3 py-1 rounded-full uppercase tracking-widest border border-slate-100">
                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                        Live Sync
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
                      {productDetails?.images?.map((img: any) => {
                        const linked = isImageLinked(img.id)
                        return (
                          <div key={img.id} className="relative group aspect-square">
                            <div className={`w-full h-full rounded-2xl overflow-hidden border-2 transition-all ${
                              linked ? "border-brand-500 ring-4 ring-brand-50" : "border-slate-100 grayscale-[0.6] group-hover:grayscale-0"
                            }`}>
                              <img src={img.url} className="w-full h-full object-cover" />
                            </div>
                            
                            <button
                              onClick={() => linked ? unlinkMutation.mutate(img.id) : linkMutation.mutate([img.id])}
                              className={`absolute -top-2 -right-2 w-8 h-8 rounded-full flex items-center justify-center shadow-xl border-2 transition-all ${
                                linked 
                                ? "bg-brand-500 border-white text-white rotate-0" 
                                : "bg-white border-slate-100 text-slate-300 rotate-90 opacity-0 group-hover:opacity-100"
                              }`}
                            >
                              {linked ? <Check className="w-4 h-4 stroke-[3px]" /> : <X className="w-4 h-4" />}
                            </button>
                            
                            {linked && (
                              <div className="absolute inset-0 bg-brand-500/10 pointer-events-none rounded-2xl" />
                            )}
                          </div>
                        )
                      })}
                      {(!productDetails?.images || productDetails?.images.length === 0) && (
                        <div className="col-span-full py-10 bg-slate-50 rounded-2xl border border-dashed text-center text-slate-400">
                          <p className="text-sm font-medium">No gallery images found for this product.</p>
                          <p className="text-[10px] uppercase tracking-widest mt-1">Upload images in product editor first</p>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
