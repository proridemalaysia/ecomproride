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
  const [addedNote, setAddedNote] = useState(false)

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('en-MY', {
      style: 'currency', currency: 'MYR', minimumFractionDigits: 2,
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

  useEffect(() => { getDetails() }, [getDetails])

  useEffect(() => {
    if (product?.has_variants) {
        const match = activeVariants.find((v: any) => JSON.stringify(v.attributes) === JSON.stringify(selection));
        setActiveVariant(match);
    }
  }, [selection, activeVariants, product]);

  const handleAddToCart = () => {
    if (product.has_variants && !activeVariant) return;
    
    const price = product.has_variants 
      ? (userRole === 'DEALER' ? activeVariant.price_b2b : activeVariant.price_b2c) 
      : (userRole === 'DEALER' ? product.price_b2b : product.price_b2c);

    // CONSTRUCT CART ITEM - EXPLICITLY CAPTURE ALL LOGISTICS
    const cartItem = {
        id: product.has_variants ? activeVariant.id : product.id, 
        name_en: product.has_variants ? `${product.name_en} (${activeVariant.name})` : product.name_en,
        brand_name: product.brand_name,
        image_url: product.image_url,
        // We use Number() to ensure these are not strings or nulls
        weight_kg: Number(product.weight_kg) || 0,
        length_cm: Number(product.length_cm) || 0,
        width_cm: Number(product.width_cm) || 0,
        height_cm: Number(product.height_cm) || 0,
        category: product.category
    };

    addToCart(cartItem, price);
    setAddedNote(true);
    setTimeout(() => setAddedNote(false), 3000);
  }

  if (loading) return <div className="min-h-screen bg-[#fcfcfd] flex items-center justify-center text-slate-400 font-medium italic">Synchronizing...</div>
  if (!product) return <div className="min-h-screen bg-[#fcfcfd] flex items-center justify-center font-bold text-slate-300 uppercase">Product Not Found</div>

  const displayPrice = product.has_variants ? (userRole === 'DEALER' ? activeVariant?.price_b2b : activeVariant?.price_b2c) : (userRole === 'DEALER' ? product.price_b2b : product.price_b2c);
  const variationLevels = product.has_variants && activeVariants.length > 0 ? activeVariants[0].attributes.map((_: any, i: number) => ({ name: i === 0 ? "Specification" : "Position", options: Array.from(new Set(activeVariants.map(v => v.attributes[i]))) })) : [];

  return (
    <div className="min-h-screen bg-[#fcfcfd] text-slate-900 font-sans">
      <nav className="p-5 border-b border-slate-100 flex justify-between items-center bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-6">
            <Link href="/products" className="text-slate-400 font-bold text-xs uppercase tracking-tight">← Back</Link>
            <div className="flex bg-slate-100 p-1 rounded-lg">
                <button onClick={() => setLang('en')} className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${lang === 'en' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400'}`}>EN</button>
                <button onClick={() => setLang('bm')} className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${lang === 'bm' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400'}`}>BM</button>
            </div>
        </div>
        <Link href="/checkout" className="bg-slate-900 text-white px-6 py-2 font-bold text-xs rounded-lg shadow-lg">Order Cart ({cart.length})</Link>
      </nav>

      <main className="max-w-7xl mx-auto p-6 md:p-12 lg:p-20 grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24 relative">
        {addedNote && <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[100] bg-green-600 text-white px-8 py-3 rounded-full font-bold text-xs shadow-xl animate-in slide-in-from-top-4">✓ ITEM ADDED TO CART</div>}
        
        <div className="space-y-6">
          <div className="bg-white border border-slate-100 aspect-square flex items-center justify-center p-12 overflow-hidden cursor-zoom-in relative rounded-3xl shadow-sm" onClick={() => setShowLightbox(true)}>
            <img src={activeImage} className="w-full h-full object-contain mix-blend-multiply" alt="Part" />
          </div>
        </div>

        <div className="flex flex-col">
          <div className="mb-8">
              <p className="text-brand-orange text-[10px] font-bold tracking-widest uppercase mb-1">{product.brand_name} PROFESSIONAL</p>
              <h1 className="text-2xl md:text-4xl font-extrabold text-slate-800 tracking-tight leading-tight mb-8 lowercase first-letter:uppercase">{lang === 'en' ? product.name_en : (product.name_bm || product.name_en)}</h1>
              <div className="bg-white border border-slate-100 p-8 rounded-3xl relative shadow-xl shadow-slate-100">
                <div className="absolute top-0 left-0 w-1.5 h-full bg-brand-orange"></div>
                <p className="text-slate-400 text-[9px] font-bold uppercase tracking-widest mb-3 italic">{lang === 'en' ? 'Price Tier' : 'Tahap Harga'}: {userRole}</p>
                <p className="text-4xl md:text-6xl font-black text-slate-900 tracking-tight">RM {displayPrice ? formatMoney(Number(displayPrice)).replace('MYR', '').trim() : '---'}</p>
              </div>
          </div>

          {product.has_variants && activeVariants.length > 0 && (
            <div className="space-y-8 mb-12">
                {variationLevels.map((level: any, levelIdx: number) => (
                    <div key={level.name} className="space-y-3">
                        <p className="text-slate-400 text-[10px] font-bold tracking-widest uppercase italic border-b border-slate-50 pb-1">{lang === 'en' ? 'Select' : 'Pilih'} {level.name}</p>
                        <div className="flex flex-wrap gap-2">
                            {level.options.map((val: string) => (
                                <button key={val} onClick={() => {const n = [...selection]; n[levelIdx] = val; setSelection(n);}} className={`px-8 py-3 text-xs font-bold border-2 transition-all rounded-xl uppercase ${selection[levelIdx] === val ? 'border-brand-orange bg-brand-orange text-white shadow-lg' : 'border-slate-50 bg-white text-slate-400 hover:border-slate-200'}`}>{val}</button>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
          )}

          <div className="flex gap-4 mb-8">
              <div className="flex-1 bg-slate-50 border border-slate-100 p-4 rounded-xl text-center"><p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">{lang === 'en' ? 'Weight' : 'Berat'}</p><p className="text-sm font-bold text-slate-700">{product.weight_kg} KG</p></div>
              <div className="flex-1 bg-slate-50 border border-slate-100 p-4 rounded-xl text-center"><p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">{lang === 'en' ? 'Scale' : 'Saiz'}</p><p className="text-sm font-bold text-slate-700 uppercase">{product.length_cm}x{product.width_cm}x{product.height_cm} CM</p></div>
          </div>

          <button onClick={handleAddToCart} disabled={product.has_variants && !activeVariant} className="w-full bg-[#0f172a] text-white py-8 font-bold uppercase tracking-widest hover:bg-[#e11d48] transition-all shadow-xl rounded-2xl text-sm active:scale-95 disabled:opacity-20 mb-20">
            {lang === 'en' ? 'Confirm & Add to Order' : 'Sahkan & Tambah Pesanan'}
          </button>

          <div className="space-y-6 border-t border-slate-100 pt-16 mb-20">
              <h3 className="text-blue-600 text-[10px] font-bold uppercase tracking-[0.4em]">{lang === 'en' ? 'Product Description' : 'Keterangan Produk'}</h3>
              <p className="text-base font-medium text-slate-500 leading-relaxed whitespace-pre-wrap lowercase">{lang === 'en' ? (product.description_en || 'Professional performance component.') : (product.description_bm || product.description_en)}</p>
          </div>
        </div>
      </main>
    </div>
  )
}