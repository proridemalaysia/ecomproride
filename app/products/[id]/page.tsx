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
  
  // States
  const [lang, setLang] = useState<'en' | 'bm'>('en')
  const [product, setProduct] = useState<any>(null)
  const [activeVariants, setActiveVariants] = useState<any[]>([])
  const [selection, setSelection] = useState<string[]>([])
  const [activeVariant, setActiveVariant] = useState<any>(null)
  const [userRole, setUserRole] = useState('RETAIL')
  const [loading, setLoading] = useState(true)
  const [activeImage, setActiveImage] = useState('')
  const [showLightbox, setShowLightbox] = useState(false)
  const [addedNote, setAddedNote] = useState(false)

  // Clean Currency Formatter (No double RM)
  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('en-MY', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const getDetails = useCallback(async () => {
    if (!id) return
    setLoading(true)
    
    // 1. Get User Role
    const { data: { session } } = await supabase.auth.getSession()
    if (session) {
      const { data: profile } = await supabase.from('profiles').select('role').eq('id', session.user.id).single()
      if (profile) setUserRole(profile.role)
    }

    // 2. Fetch Product & Variants exactly as they are in DB
    const { data } = await supabase
      .from('products')
      .select('*, product_variants(*)')
      .eq('id', id)
      .single()

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

  // Sync selection with active variant object
  useEffect(() => {
    if (product?.has_variants) {
        const match = activeVariants.find((v: any) => 
            JSON.stringify(v.attributes) === JSON.stringify(selection)
        );
        setActiveVariant(match);
    }
  }, [selection, activeVariants, product]);

  // Determine Level Names dynamically from DB attributes
  const variationLevels = product?.has_variants && activeVariants.length > 0 
    ? activeVariants[0].attributes.map((_: any, i: number) => ({
        name: i === 0 ? (lang === 'en' ? "Specification" : "Spesifikasi") : (lang === 'en' ? "Position" : "Kedudukan"),
        options: Array.from(new Set(activeVariants.map(v => v.attributes[i])))
      }))
    : [];

  const handleAddToCart = () => {
    if (product.has_variants && !activeVariant) return;

    const finalPrice = product.has_variants 
      ? (userRole === 'DEALER' ? activeVariant.price_b2b : activeVariant.price_b2c)
      : (userRole === 'DEALER' ? product.price_b2b : product.price_b2c);

    const cartItem = {
        id: product.has_variants ? activeVariant.id : product.id, 
        name_en: product.has_variants ? `${product.name_en} (${activeVariant.name})` : product.name_en,
        brand_name: product.brand_name,
        image_url: product.image_url,
        weight_kg: Number(product.weight_kg) || 0,
        length_cm: Number(product.length_cm) || 0,
        width_cm: Number(product.width_cm) || 0,
        height_cm: Number(product.height_cm) || 0,
        category: product.category
    };

    addToCart(cartItem, finalPrice);
    setAddedNote(true);
    setTimeout(() => setAddedNote(false), 2000);
  }

  if (loading) return <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center text-slate-400 font-medium animate-pulse uppercase text-xs tracking-widest">Loading...</div>
  if (!product) return <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center font-bold text-slate-300">Item Not Found</div>

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans pb-20">
      
      {/* LIGHTBOX */}
      {showLightbox && (
        <div className="fixed inset-0 z-[200] bg-slate-900/98 flex items-center justify-center p-6 backdrop-blur-md" onClick={() => setShowLightbox(false)}>
            <button className="absolute top-10 right-10 text-white font-bold text-xs tracking-widest">✕ CLOSE</button>
            <img src={activeImage} className="max-w-full max-h-full object-contain" alt="Preview" />
        </div>
      )}

      {/* NAV */}
      <nav className="p-6 border-b border-slate-100 flex justify-between items-center bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-6">
            <Link href="/products" className="text-slate-400 font-bold text-[10px] tracking-widest uppercase">← Back</Link>
            <div className="flex bg-slate-100 p-1 rounded-lg">
                <button onClick={() => setLang('en')} className={`px-4 py-1 text-[10px] font-bold rounded-md transition-all ${lang === 'en' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400'}`}>EN</button>
                <button onClick={() => setLang('bm')} className={`px-4 py-1 text-[10px] font-bold rounded-md transition-all ${lang === 'bm' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400'}`}>BM</button>
            </div>
        </div>
        <Link href="/checkout" className="bg-[#0f172a] text-white px-6 py-2 font-bold text-[10px] tracking-widest rounded-lg shadow-lg">CART ({cart.length})</Link>
      </nav>

      <main className="max-w-7xl mx-auto p-6 md:p-12 lg:p-20 grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-32 relative">
        {addedNote && (
            <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[100] bg-green-500 text-white px-8 py-3 rounded-full font-bold text-[10px] shadow-xl animate-in slide-in-from-top-4 uppercase tracking-widest">
                ✓ Added to order
            </div>
        )}

        {/* LEFT GALLERY */}
        <div className="space-y-8">
          <div className="bg-white border border-slate-100 aspect-square flex items-center justify-center p-12 overflow-hidden cursor-zoom-in relative group rounded-[2.5rem] shadow-sm" onClick={() => setShowLightbox(true)}>
            <img src={activeImage} className="w-full h-full object-contain mix-blend-multiply transition-transform duration-700 group-hover:scale-110" alt="Product" />
          </div>
          {product.gallery_urls?.length > 0 && (
            <div className="flex gap-4 overflow-x-auto no-scrollbar">
                <button onClick={() => setActiveImage(product.image_url)} className={`w-20 h-20 flex-shrink-0 bg-white border-2 p-2 rounded-2xl transition-all ${activeImage === product.image_url ? 'border-blue-600 shadow-lg' : 'border-slate-50 opacity-50'}`}>
                    <img src={product.image_url} className="w-full h-full object-contain mix-blend-multiply" />
                </button>
                {product.gallery_urls.map((url: string, i: number) => (
                    <button key={i} onClick={() => setActiveImage(url)} className={`w-20 h-20 flex-shrink-0 bg-white border-2 p-2 rounded-2xl transition-all ${activeImage === url ? 'border-blue-600 shadow-lg' : 'border-slate-50 opacity-50'}`}>
                        <img src={url} className="w-full h-full object-contain mix-blend-multiply" />
                    </button>
                ))}
            </div>
          )}
        </div>

        {/* RIGHT INFO */}
        <div className="flex flex-col">
          <div className="mb-10">
              <span className="text-brand-orange text-[10px] font-bold tracking-[0.3em] uppercase mb-3 block">{product.brand_name} PROFESSIONAL</span>
              {/* FIXED: Title is used directly from DB */}
              <h1 className="text-3xl md:text-5xl font-extrabold text-slate-800 tracking-tight leading-tight mb-8">
                {lang === 'en' ? product.name_en : (product.name_bm || product.name_en)}
              </h1>
              
              <div className="bg-white border border-slate-100 p-8 rounded-3xl relative shadow-xl shadow-slate-100">
                <div className="absolute top-0 left-0 w-1.5 h-full bg-brand-orange"></div>
                <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-4 italic">Price Tier: {userRole}</p>
                <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-slate-400">RM</span>
                    {/* FIXED: No double RM, clean number formatting */}
                    <p className="text-4xl md:text-6xl font-black text-slate-900 tracking-tighter">
                        {displayPrice ? formatMoney(Number(displayPrice)) : '---'}
                    </p>
                </div>
              </div>
          </div>

          {/* VARIATIONS (FIXED COLORS) */}
          {product.has_variants && activeVariants.length > 0 && (
            <div className="space-y-10 mb-12">
                {variationLevels.map((level, levelIdx) => (
                    <div key={level.name} className="space-y-4">
                        <p className="text-slate-400 text-[10px] font-bold tracking-widest uppercase italic border-b pb-2">Select {level.name}</p>
                        <div className="flex flex-wrap gap-3">
                            {level.options.map((val: string) => (
                                <button 
                                    key={val} 
                                    onClick={() => {
                                        const newSelection = [...selection];
                                        newSelection[levelIdx] = val;
                                        setSelection(newSelection);
                                    }}
                                    className={`px-8 py-4 text-xs font-bold border-2 transition-all rounded-xl uppercase ${selection[levelIdx] === val ? 'border-slate-900 bg-slate-900 text-white shadow-xl' : 'border-slate-100 bg-white text-slate-400 hover:border-slate-200'}`}
                                >
                                    {val}
                                </button>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
          )}

          {/* LOGISTICS */}
          <div className="flex gap-4 mb-10">
              <div className="flex-1 bg-slate-50 border border-slate-100 p-5 rounded-2xl text-center">
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Weight</p>
                  <p className="text-sm font-bold text-slate-700">{product.weight_kg} KG</p>
              </div>
              <div className="flex-1 bg-slate-50 border border-slate-100 p-4 rounded-xl text-center">
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Dimensions</p>
                  <p className="text-sm font-bold text-slate-700 uppercase">{product.length_cm}x{product.width_cm}x{product.height_cm} CM</p>
              </div>
          </div>

          <button 
            onClick={handleAddToCart} 
            disabled={product.has_variants && !activeVariant}
            className="w-full bg-[#0f172a] text-white py-8 font-bold uppercase tracking-widest hover:bg-blue-600 transition-all shadow-2xl rounded-[2rem] text-sm active:scale-95 disabled:opacity-20 mb-16"
          >
            {lang === 'en' ? 'Confirm & Add to Order' : 'Sahkan & Tambah Pesanan'}
          </button>

          {/* DESCRIPTION (FIXED SYNC) */}
          <div className="space-y-6 border-t border-slate-100 pt-16">
              <h3 className="text-brand-orange text-[10px] font-bold uppercase tracking-[0.4em]">Product Information</h3>
              <p className="text-base font-medium text-slate-500 leading-relaxed whitespace-pre-wrap">
                {lang === 'en' ? (product.description_en || 'Professional high-performance part.') : (product.description_bm || product.description_en)}
              </p>
          </div>
        </div>
      </main>
    </div>
  )
}