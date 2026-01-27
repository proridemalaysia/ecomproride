"use client"
import React, { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { useCart } from '@/context/CartContext'

export default function ProductDetailPage() {
  const params = useParams()
  const id = params?.id
  const { cart, addToCart } = useCart()
  
  const [product, setProduct] = useState<any>(null)
  const [activeVariants, setActiveVariants] = useState<any[]>([])
  const [selection, setSelection] = useState<string[]>([])
  const [activeVariant, setActiveVariant] = useState<any>(null)
  const [userRole, setUserRole] = useState('RETAIL')
  const [loading, setLoading] = useState(true)
  const [activeImage, setActiveImage] = useState('')
  const [showLightbox, setShowLightbox] = useState(false)

  // Professional Currency Formatter
  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('en-MY', {
      style: 'currency',
      currency: 'MYR',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const getDetails = useCallback(async () => {
    if (!id) return
    setLoading(true)
    
    const { data: { session } } = await supabase.auth.getSession()
    if (session) {
      const { data: profile } = await supabase.from('profiles').select('role').eq('id', session.user.id).single()
      if (profile) setUserRole(profile.role)
    }

    const { data } = await supabase.from('products').select('*, product_variants(*)').eq('id', id).single()

    if (data) {
      setProduct(data)
      setActiveImage(data.image_url)
      // Only show variants that are Active and have Stock > 0
      const filtered = data.product_variants.filter((v: any) => v.is_active && v.stock_quantity > 0)
      setActiveVariants(filtered)
      if (filtered.length > 0) setSelection(filtered[0].attributes)
    }
    setLoading(false)
  }, [id])

  useEffect(() => {
    getDetails()
  }, [getDetails])

  // Logic to update price when variant buttons are clicked
  useEffect(() => {
    if (product?.has_variants) {
        const match = activeVariants.find((v: any) => 
            JSON.stringify(v.attributes) === JSON.stringify(selection)
        );
        setActiveVariant(match);
    }
  }, [selection, activeVariants, product]);

  const variationLevels = product?.has_variants && activeVariants.length > 0 
    ? activeVariants[0].attributes.map((_: any, i: number) => ({
        name: i === 0 ? "Variation" : i === 1 ? "Position" : `Level ${i+1}`,
        options: Array.from(new Set(activeVariants.map(v => v.attributes[i])))
      }))
    : [];

  if (loading) return <div className="min-h-screen flex items-center justify-center text-slate-300 font-bold uppercase tracking-widest text-xs animate-pulse">Synchronizing Data...</div>

  const displayPrice = product?.has_variants 
    ? (userRole === 'DEALER' ? activeVariant?.price_b2b : activeVariant?.price_b2c)
    : (userRole === 'DEALER' ? product?.price_b2b : product?.price_b2c);

  return (
    <div className="min-h-screen bg-[#fcfcfd] text-slate-900 font-sans pb-20">
      
      {/* 1. LIGHTBOX MODULE (Enlarged View) */}
      {showLightbox && (
        <div className="fixed inset-0 z-[200] bg-slate-900/95 flex items-center justify-center p-6 backdrop-blur-md" onClick={() => setShowLightbox(false)}>
            <button className="absolute top-10 right-10 text-white font-bold hover:text-brand-orange transition-all">CLOSE [X]</button>
            <img src={activeImage} className="max-w-full max-h-full object-contain shadow-2xl rounded-lg" alt="Fullscreen view" />
        </div>
      )}

      {/* NAVIGATION */}
      <nav className="p-5 border-b border-slate-100 flex justify-between items-center bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <Link href="/products" className="text-slate-400 font-bold hover:text-blue-600 text-xs transition-all uppercase tracking-widest">← Back to Catalog</Link>
        <Link href="/checkout" className="bg-[#0f172a] text-white px-6 py-2 font-bold text-xs rounded-lg shadow-lg hover:bg-blue-600 transition-all">
            View Order ({cart.length})
        </Link>
      </nav>

      <main className="max-w-7xl mx-auto p-6 md:p-12 lg:p-20 grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-32">
        
        {/* LEFT COLUMN: MULTI-IMAGE GALLERY */}
        <div className="space-y-8">
          <div 
            className="bg-white border border-slate-100 aspect-square flex items-center justify-center p-12 overflow-hidden cursor-zoom-in relative group rounded-3xl shadow-sm hover:shadow-xl transition-all"
            onClick={() => setShowLightbox(true)}
          >
            <img src={activeImage} className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-700 mix-blend-multiply" alt={product.name_en} />
            <div className="absolute bottom-6 right-6 bg-slate-100/80 text-slate-500 p-3 text-[8px] font-bold tracking-widest opacity-0 group-hover:opacity-100 transition-opacity rounded-full uppercase">Tap to enlarge</div>
          </div>
          
          {/* Thumbnails List */}
          {product.gallery_urls?.length > 0 && (
            <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar">
                <button onClick={() => setActiveImage(product.image_url)} className={`w-20 h-20 flex-shrink-0 bg-white border-2 p-2 rounded-xl transition-all ${activeImage === product.image_url ? 'border-blue-600 shadow-lg scale-105' : 'border-slate-50 opacity-60'}`}>
                    <img src={product.image_url} className="w-full h-full object-contain mix-blend-multiply" />
                </button>
                {product.gallery_urls.map((url: string, i: number) => (
                    <button key={i} onClick={() => setActiveImage(url)} className={`w-20 h-20 flex-shrink-0 bg-white border-2 p-2 rounded-xl transition-all ${activeImage === url ? 'border-blue-600 shadow-lg scale-105' : 'border-slate-50 opacity-60'}`}>
                        <img src={url} className="w-full h-full object-contain mix-blend-multiply" />
                    </button>
                ))}
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: SALES & SELECTION */}
        <div className="flex flex-col">
          <div className="mb-8">
              <p className="text-blue-600 font-bold tracking-[0.3em] uppercase text-[10px] mb-2">{product.brand_name} ENGINEERED</p>
              <h1 className="text-3xl md:text-5xl font-extrabold text-slate-800 tracking-tight leading-tight mb-8">
                {product.name_en}
              </h1>
              
              <div className="bg-white border border-slate-100 p-10 rounded-3xl relative shadow-xl shadow-slate-100 flex items-center justify-between">
                <div className="absolute top-0 left-0 w-1.5 h-full bg-blue-600"></div>
                <div>
                    <p className="text-slate-400 text-[9px] font-bold uppercase tracking-widest mb-2">Price Tier: {userRole}</p>
                    <p className="text-4xl md:text-6xl font-black text-slate-900 tracking-tight">
                        {displayPrice ? formatMoney(Number(displayPrice)) : '---'}
                    </p>
                </div>
                {activeVariant?.sku && <div className="text-right"><p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">SKU</p><p className="font-bold text-slate-600 text-sm">{activeVariant.sku}</p></div>}
              </div>
          </div>

          {/* VARIATION SELECTORS (FIXED VISIBILITY) */}
          {product.has_variants && activeVariants.length > 0 && (
            <div className="space-y-10 mb-12">
                {variationLevels.map((level: any, levelIdx: number) => (
                    <div key={level.name} className="space-y-4">
                        <p className="text-slate-400 text-[10px] font-bold tracking-widest uppercase italic border-b border-slate-50 pb-2">Select {level.name}</p>
                        <div className="flex flex-wrap gap-3">
                            {level.options.map((val: string) => (
                                <button 
                                    key={val} 
                                    onClick={() => {
                                        const newSelection = [...selection];
                                        newSelection[levelIdx] = val;
                                        setSelection(newSelection);
                                    }}
                                    className={`px-8 py-3 text-xs font-bold border-2 transition-all rounded-xl uppercase tracking-wider ${selection[levelIdx] === val ? 'border-blue-600 bg-[#0f172a] text-white shadow-lg shadow-blue-200' : 'border-slate-50 bg-white text-slate-400 hover:border-slate-200'}`}
                                >
                                    {val}
                                </button>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
          )}

          {/* LOGISTICS PANEL */}
          <div className="flex gap-4 mb-10">
              <div className="flex-1 bg-slate-50 border border-slate-100 p-5 rounded-2xl text-center">
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Weight</p>
                  <p className="text-base font-bold text-slate-800">{product.weight_kg} KG</p>
              </div>
              <div className="flex-1 bg-slate-50 border border-slate-100 p-5 rounded-2xl text-center">
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Scale</p>
                  <p className="text-base font-bold text-slate-800 uppercase">{product.length_cm}x{product.width_cm}x{product.height_cm} CM</p>
              </div>
          </div>

          <button 
            onClick={() => {
                const finalPrice = Number(displayPrice);
                const cartItem = product.has_variants ? {
                    id: activeVariant.id, 
                    name_en: `${product.name_en} (${activeVariant.name})`,
                    brand_name: product.brand_name,
                    image_url: product.image_url,
                    weight_kg: product.weight_kg,
                    length_cm: product.length_cm,
                    width_cm: product.width_cm,
                    height_cm: product.height_cm
                } : { ...product };
                addToCart(cartItem, finalPrice);
                alert("SUCCESS: Added to order summary.");
            }} 
            disabled={product.has_variants && !activeVariant}
            className="w-full bg-[#0f172a] text-white py-8 font-bold uppercase tracking-widest hover:bg-blue-600 transition-all shadow-2xl rounded-2xl text-sm active:scale-95 disabled:opacity-20 mb-20"
          >
            Confirm & Add To Order
          </button>

          {/* BILINGUAL DESCRIPTION SECTION */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 border-t border-slate-100 pt-16">
              <div className="space-y-4">
                  <h3 className="text-blue-600 text-xs font-bold uppercase tracking-[0.4em]">Product Information (EN)</h3>
                  <p className="text-base text-slate-500 leading-relaxed font-medium whitespace-pre-wrap">
                    {product.description_en || 'Professional high-performance suspension component engineered for maximum precision and durability.'}
                  </p>
              </div>
              <div className="space-y-4">
                  <h3 className="text-brand-orange text-xs font-bold uppercase tracking-[0.4em]">Maklumat Produk (BM)</h3>
                  <p className="text-base text-slate-400 leading-relaxed font-medium italic whitespace-pre-wrap">
                    {product.description_bm || 'Komponen suspensi prestasi tinggi yang ditala khas untuk kawalan dan ketahanan yang unggul.'}
                  </p>
              </div>
          </div>
        </div>
      </main>
    </div>
  )
}