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
  
  const [lang, setLang] = useState<'en' | 'bm'>('en')
  const [product, setProduct] = useState<any>(null)
  const [activeVariants, setActiveVariants] = useState<any[]>([])
  const [selection, setSelection] = useState<string[]>([])
  const [activeVariant, setActiveVariant] = useState<any>(null)
  const [userRole, setUserRole] = useState('RETAIL')
  const [loading, setLoading] = useState(true)
  const [activeImage, setActiveImage] = useState('')
  const [showLightbox, setShowLightbox] = useState(false)

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('en-MY', { style: 'currency', currency: 'MYR', minimumFractionDigits: 2 }).format(amount);
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
      const filtered = data.product_variants.filter((v: any) => v.is_active && v.stock_quantity > 0)
      setActiveVariants(filtered)
      if (filtered.length > 0) setSelection(filtered[0].attributes)
    }
    setLoading(false)
  }, [id])

  useEffect(() => { getDetails() }, [getDetails])

  useEffect(() => {
    if (product?.has_variants) {
        const match = activeVariants.find((v: any) => JSON.stringify(v.attributes) === JSON.stringify(selection));
        setActiveVariant(match);
    }
  }, [selection, activeVariants, product]);

  const variationLevels = product?.has_variants && activeVariants.length > 0 
    ? activeVariants[0].attributes.map((_: any, i: number) => ({
        name: i === 0 ? (lang === 'en' ? "Specification" : "Spesifikasi") : (lang === 'en' ? "Position" : "Kedudukan"),
        options: Array.from(new Set(activeVariants.map(v => v.attributes[i])))
      }))
    : [];

  if (loading) return <div className="min-h-screen flex items-center justify-center text-slate-300 font-bold uppercase tracking-widest text-xs animate-pulse">Syncing...</div>

  const displayPrice = product?.has_variants 
    ? (userRole === 'DEALER' ? activeVariant?.price_b2b : activeVariant?.price_b2c)
    : (userRole === 'DEALER' ? product?.price_b2b : product?.price_b2c);

  return (
    <div className="min-h-screen bg-[#fcfcfd] text-slate-900 font-sans">
      {showLightbox && (
        <div className="fixed inset-0 z-[200] bg-slate-900/98 flex items-center justify-center p-6 backdrop-blur-md" onClick={() => setShowLightbox(false)}>
            <img src={activeImage} className="max-w-full max-h-full object-contain" alt="Gallery" />
        </div>
      )}

      <nav className="p-5 border-b border-slate-100 flex justify-between items-center bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-6">
            <Link href="/products" className="text-slate-400 font-bold text-xs uppercase tracking-tight">← Back</Link>
            <div className="flex bg-slate-100 p-1 rounded-lg">
                <button onClick={() => setLang('en')} className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${lang === 'en' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400'}`}>EN</button>
                <button onClick={() => setLang('bm')} className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${lang === 'bm' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400'}`}>BM</button>
            </div>
        </div>
        <Link href="/checkout" className="bg-slate-900 text-white px-6 py-2 rounded-lg font-bold text-xs shadow-lg">Order Cart ({cart.length})</Link>
      </nav>

      <main className="max-w-7xl mx-auto p-6 md:p-12 lg:p-20 grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-32">
        <div className="space-y-8">
          <div className="bg-white border border-slate-100 aspect-square flex items-center justify-center p-12 overflow-hidden cursor-zoom-in relative rounded-3xl shadow-sm" onClick={() => setShowLightbox(true)}>
            <img src={activeImage} className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-700 mix-blend-multiply" alt="Main" />
          </div>
          {product.gallery_urls?.length > 0 && (
            <div className="flex gap-3 overflow-x-auto no-scrollbar">
                <button onClick={() => setActiveImage(product.image_url)} className={`w-20 h-20 flex-shrink-0 bg-white border-2 p-2 rounded-xl transition-all ${activeImage === product.image_url ? 'border-blue-600 shadow-lg' : 'border-slate-50 opacity-60'}`}><img src={product.image_url} className="w-full h-full object-contain mix-blend-multiply" /></button>
                {product.gallery_urls.map((url: string, i: number) => (
                    <button key={i} onClick={() => setActiveImage(url)} className={`w-20 h-20 flex-shrink-0 bg-white border-2 p-2 rounded-xl transition-all ${activeImage === url ? 'border-blue-600 shadow-lg' : 'border-slate-50 opacity-60'}`}><img src={url} className="w-full h-full object-contain mix-blend-multiply" /></button>
                ))}
            </div>
          )}
        </div>

        <div className="flex flex-col">
          <div className="mb-8">
              <p className="text-blue-600 font-bold tracking-[0.3em] uppercase text-[10px] mb-2">{product.brand_name} ENGINEERED</p>
              <h1 className="text-3xl md:text-5xl font-extrabold text-slate-800 tracking-tight leading-tight mb-8">
                {lang === 'en' ? product.name_en : (product.name_bm || product.name_en)}
              </h1>
              <div className="bg-white border border-slate-100 p-8 rounded-3xl relative shadow-xl shadow-slate-100">
                <div className="absolute top-0 left-0 w-1.5 h-full bg-blue-600"></div>
                <p className="text-slate-400 text-[9px] font-bold uppercase tracking-widest mb-3 italic">Price Tier: {userRole}</p>
                <p className="text-4xl md:text-6xl font-black text-slate-900 tracking-tight">{displayPrice ? formatMoney(Number(displayPrice)) : '---'}</p>
              </div>
          </div>

          {/* VARIATIONS */}
          {product.has_variants && activeVariants.length > 0 && (
            <div className="space-y-8 mb-12">
                {variationLevels.map((level: any, levelIdx: number) => (
                    <div key={level.name} className="space-y-3">
                        <p className="text-slate-400 text-[10px] font-bold tracking-widest uppercase italic border-b pb-1">Select {level.name}</p>
                        <div className="flex flex-wrap gap-2">
                            {level.options.map((val: string) => (
                                <button key={val} onClick={() => {const n = [...selection]; n[levelIdx] = val; setSelection(n);}} className={`px-8 py-3 text-xs font-bold border-2 transition-all rounded-xl uppercase ${selection[levelIdx] === val ? 'border-blue-600 bg-[#0f172a] text-white shadow-lg shadow-blue-200' : 'border-slate-50 bg-white text-slate-400 hover:border-slate-200'}`}>{val}</button>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
          )}

          <div className="flex gap-4 mb-8">
              <div className="flex-1 bg-slate-50 border border-slate-100 p-4 rounded-xl text-center"><p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Weight</p><p className="text-sm font-bold text-slate-700">{product.weight_kg} KG</p></div>
              <div className="flex-1 bg-slate-50 border border-slate-100 p-4 rounded-xl text-center"><p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Scale</p><p className="text-sm font-bold text-slate-700 uppercase">{product.length_cm}x{product.width_cm}x{product.height_cm} CM</p></div>
          </div>

          <button 
            onClick={() => {
                const finalPrice = Number(displayPrice);
                const cartItem = product.has_variants ? { id: activeVariant.id, name_en: `${product.name_en} (${activeVariant.name})`, brand_name: product.brand_name } : { ...product };
                addToCart(cartItem, finalPrice); alert("Added to cart.");
            }} 
            disabled={product.has_variants && !activeVariant}
            className="w-full bg-[#0f172a] text-white py-8 font-bold uppercase tracking-widest hover:bg-blue-600 transition-all shadow-xl rounded-2xl text-sm active:scale-95 disabled:opacity-20 mb-20"
          >Confirm & Add to Order</button>

          {/* SINGLE BILINGUAL DESCRIPTION */}
          <div className="space-y-6 border-t border-slate-100 pt-16">
              <h3 className="text-blue-600 text-[10px] font-bold uppercase tracking-[0.4em]">{lang === 'en' ? 'Product Description' : 'Keterangan Produk'}</h3>
              <p className="text-base font-medium text-slate-500 leading-relaxed whitespace-pre-wrap">{lang === 'en' ? product.description_en : (product.description_bm || product.description_en)}</p>
          </div>
        </div>
      </main>
    </div>
  )
}