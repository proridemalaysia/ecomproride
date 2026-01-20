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
  const [addedNote, setAddedNote] = useState(false)

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
      const filtered = data.product_variants.filter((v: any) => v.is_active && v.stock_quantity > 0)
      setActiveVariants(filtered)
      if (filtered.length > 0) setSelection(filtered[0].attributes)
    }
    setLoading(false)
  }, [id])

  useEffect(() => {
    getDetails()
  }, [getDetails])

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
        name: i === 0 ? "Specification" : i === 1 ? "Position" : `Option ${i + 1}`,
        options: Array.from(new Set(activeVariants.map(v => v.attributes[i])))
      }))
    : [];

  const handleAddToCart = () => {
    if (product.has_variants && !activeVariant) return;

    const price = product.has_variants 
      ? (userRole === 'DEALER' ? activeVariant.price_b2b : activeVariant.price_b2c)
      : (userRole === 'DEALER' ? product.price_b2b : product.price_b2c);

    const cartItem = product.has_variants ? {
        id: activeVariant.id, 
        name_en: `${product.name_en} (${activeVariant.name})`,
        brand_name: product.brand_name,
        image_url: product.image_url,
        weight_kg: product.weight_kg,
        category: product.category
    } : {
        id: product.id,
        name_en: product.name_en,
        brand_name: product.brand_name,
        image_url: product.image_url,
        weight_kg: product.weight_kg,
        category: product.category
    };

    addToCart(cartItem, price);
    setAddedNote(true);
    setTimeout(() => setAddedNote(false), 3000);
  }

  if (loading) return <div className="min-h-screen bg-[#fcfcfd] flex items-center justify-center text-slate-300 font-bold uppercase tracking-widest text-xs animate-pulse">Synchronizing Data...</div>
  if (!product) return <div className="min-h-screen bg-[#fcfcfd] flex items-center justify-center font-bold text-slate-300 uppercase">Product Not Found</div>

  const displayPrice = product?.has_variants 
    ? (userRole === 'DEALER' ? activeVariant?.price_b2b : activeVariant?.price_b2c)
    : (userRole === 'DEALER' ? product?.price_b2b : product?.price_b2c);

  return (
    <div className="min-h-screen bg-[#fcfcfd] text-slate-900 font-sans">
      {showLightbox && (
        <div className="fixed inset-0 z-[200] bg-slate-900/98 flex items-center justify-center p-6 backdrop-blur-md" onClick={() => setShowLightbox(false)}>
            <button className="absolute top-10 right-10 text-white font-bold hover:text-brand-orange">✕ CLOSE</button>
            <img src={activeImage} className="max-w-full max-h-full object-contain" alt="Enlarged" />
        </div>
      )}

      <nav className="p-5 border-b border-slate-100 flex justify-between items-center bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <Link href="/products" className="text-slate-400 font-bold hover:text-[#e11d48] text-xs transition-all tracking-tight uppercase">← Back to Hub</Link>
        <Link href="/checkout" className="bg-slate-900 text-white px-5 py-2 font-bold text-xs rounded-lg shadow-lg">View Order ({cart.length})</Link>
      </nav>

      <main className="max-w-7xl mx-auto p-6 md:p-12 lg:p-16 grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24 relative">
        {/* ADDED TO CART NOTIFICATION */}
        {addedNote && (
            <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[100] bg-green-500 text-white px-8 py-3 rounded-full font-bold text-xs shadow-xl animate-in slide-in-from-top-4">
                ✓ ITEM ADDED TO CART
            </div>
        )}

        {/* LEFT COLUMN: IMAGES */}
        <div className="space-y-6">
          <div 
            className="bg-white border border-slate-100 aspect-square flex items-center justify-center p-10 overflow-hidden cursor-zoom-in relative rounded-3xl shadow-sm"
            onClick={() => setShowLightbox(true)}
          >
            <img src={activeImage} className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-700 mix-blend-multiply" alt={product.name_en} />
          </div>
          {product.gallery_urls?.length > 0 && (
            <div className="grid grid-cols-5 gap-3">
                <button onClick={() => setActiveImage(product.image_url)} className={`aspect-square bg-white border-2 p-2 rounded-xl transition-all ${activeImage === product.image_url ? 'border-brand-orange shadow-md' : 'border-slate-50 opacity-60'}`}><img src={product.image_url} className="w-full h-full object-contain mix-blend-multiply" /></button>
                {product.gallery_urls.map((url: string, i: number) => (
                    <button key={i} onClick={() => setActiveImage(url)} className={`aspect-square bg-white border-2 p-2 rounded-xl transition-all ${activeImage === url ? 'border-brand-orange shadow-md' : 'border-slate-50 opacity-60'}`}><img src={url} className="w-full h-full object-contain mix-blend-multiply" /></button>
                ))}
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: INFO */}
        <div className="flex flex-col">
          <div className="mb-8">
              <p className="text-brand-orange text-[10px] font-bold tracking-[0.3em] uppercase mb-1">{product.brand_name} SPECIALIST</p>
              <h1 className="text-2xl md:text-4xl font-extrabold text-slate-800 tracking-tight leading-tight mb-6">
                {product.name_en}
              </h1>
              
              <div className="bg-white border border-slate-100 p-8 rounded-2xl relative shadow-xl shadow-slate-100">
                <div className="absolute top-0 left-0 w-1 h-full bg-brand-orange"></div>
                <p className="text-slate-400 text-[9px] font-bold uppercase tracking-widest mb-3 italic">Price Tier: {userRole}</p>
                <div className="flex items-baseline gap-2">
                    <span className="text-xl font-bold text-[#e11d48]">RM</span>
                    <p className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight">
                        {displayPrice ? formatMoney(Number(displayPrice)).replace('MYR', '').trim() : '---'}
                    </p>
                </div>
                {activeVariant?.sku && <p className="text-[10px] text-slate-400 font-bold mt-4 tracking-widest uppercase border-t pt-4">SKU: {activeVariant.sku}</p>}
              </div>
          </div>

          {/* VARIATION SELECTORS */}
          {product.has_variants && activeVariants.length > 0 && (
            <div className="space-y-8 mb-12">
                {variationLevels.map((level: any, levelIdx: number) => (
                    <div key={level.name} className="space-y-3">
                        <p className="text-slate-400 text-[10px] font-bold tracking-widest uppercase italic border-b border-slate-50 pb-1">Select {level.name}</p>
                        <div className="flex flex-wrap gap-2">
                            {level.options.map((val: string) => (
                                <button 
                                    key={val} 
                                    onClick={() => {
                                        const newSelection = [...selection];
                                        newSelection[levelIdx] = val;
                                        setSelection(newSelection);
                                    }}
                                    className={`px-6 py-3 text-[10px] font-bold border-2 transition-all rounded-lg uppercase tracking-wider ${selection[levelIdx] === val ? 'border-brand-orange bg-brand-orange text-white shadow-lg' : 'border-slate-50 bg-white text-slate-400 hover:border-slate-200'}`}
                                >{val}</button>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
          )}

          {/* LOGISTICS */}
          <div className="flex gap-4 mb-8">
              <div className="flex-1 bg-slate-50/50 border border-slate-100 p-4 rounded-xl text-center">
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Weight</p>
                  <p className="text-sm font-bold text-slate-700 uppercase">{product.weight_kg} KG</p>
              </div>
              <div className="flex-1 bg-slate-50/50 border border-slate-100 p-4 rounded-xl text-center">
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Scale</p>
                  <p className="text-sm font-bold text-slate-700 uppercase">{product.length_cm}x{product.width_cm}x{product.height_cm} CM</p>
              </div>
          </div>

          <button 
            onClick={handleAddToCart} 
            disabled={product.has_variants && !activeVariant}
            className="w-full bg-[#0f172a] text-white py-6 font-bold uppercase tracking-widest hover:bg-[#e11d48] transition-all shadow-xl rounded-xl text-xs disabled:opacity-20 active:scale-95 mb-16"
          >
            {product.has_variants && !activeVariant ? 'UNAVAILABLE' : 'ADD TO ORDER CART'}
          </button>

          {/* DESCRIPTION */}
          <div className="space-y-6 border-t border-slate-50 pt-16 mb-20">
              <h3 className="text-brand-orange text-[10px] font-bold uppercase tracking-[0.4em]">Product Specifications</h3>
              <div className="text-sm text-slate-500 leading-relaxed space-y-6">
                <p className="font-medium whitespace-pre-wrap">{product.description_en || 'High performance component engineered for maximum handling stability.'}</p>
                <hr className="border-slate-50" />
                <p className="font-medium italic text-slate-400 whitespace-pre-wrap lowercase">{product.description_bm || 'Komponen prestasi tinggi yang direka untuk kestabilan pengendalian maksimum.'}</p>
              </div>
          </div>
        </div>
      </main>
    </div>
  )
}