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
      style: 'currency', currency: 'MYR', minimumFractionDigits: 2,
    }).format(amount);
  };

  useEffect(() => {
    async function getDetails() {
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
    }
    getDetails()
  }, [id])

  useEffect(() => {
    if (product?.has_variants) {
        const match = activeVariants.find((v: any) => JSON.stringify(v.attributes) === JSON.stringify(selection));
        setActiveVariant(match);
    }
  }, [selection, activeVariants, product]);

  const handleAddToCart = () => {
    if (product.has_variants && !activeVariant) return;
    const price = product.has_variants ? (userRole === 'DEALER' ? activeVariant.price_b2b : activeVariant.price_b2c) : (userRole === 'DEALER' ? product.price_b2b : product.price_b2c);

    // CONSTRUCT CART ITEM WITH FULL LOGISTICS DATA
    const cartItem = {
        id: product.has_variants ? activeVariant.id : product.id, 
        name_en: product.has_variants ? `${product.name_en} (${activeVariant.name})` : product.name_en,
        brand_name: product.brand_name,
        image_url: product.image_url,
        // PASSING THESE 4 FIELDS IS CRITICAL FOR SHIPPING CALCULATION
        weight_kg: product.weight_kg,
        length_cm: product.length_cm,
        width_cm: product.width_cm,
        height_cm: product.height_cm,
        category: product.category
    };

    addToCart(cartItem, price);
    setAddedNote(true);
    setTimeout(() => setAddedNote(false), 3000);
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center text-slate-400 font-bold uppercase tracking-widest text-xs">Loading...</div>
  if (!product) return <div className="min-h-screen flex items-center justify-center font-bold text-slate-300">Not Found</div>

  const displayPrice = product.has_variants ? (userRole === 'DEALER' ? activeVariant?.price_b2b : activeVariant?.price_b2c) : (userRole === 'DEALER' ? product.price_b2b : product.price_b2c);
  const variationLevels = product.has_variants && activeVariants.length > 0 ? activeVariants[0].attributes.map((_: any, i: number) => ({ name: i === 0 ? "Specification" : "Position", options: Array.from(new Set(activeVariants.map(v => v.attributes[i]))) })) : [];

  return (
    <div className="min-h-screen bg-[#fcfcfd] text-slate-900 font-sans">
      <nav className="p-5 border-b border-slate-100 flex justify-between items-center bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <Link href="/products" className="text-slate-400 font-bold text-xs">← CATALOG</Link>
        <Link href="/checkout" className="bg-slate-900 text-white px-5 py-2 font-bold text-xs rounded-lg">CART ({cart.length})</Link>
      </nav>

      <main className="max-w-7xl mx-auto p-6 md:p-12 lg:p-20 grid grid-cols-1 lg:grid-cols-2 gap-12 relative">
        {addedNote && <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[100] bg-green-500 text-white px-8 py-3 rounded-full font-bold text-xs shadow-xl animate-in slide-in-from-top-4">✓ ADDED TO CART</div>}
        
        <div className="space-y-6">
          <div className="bg-white border border-slate-100 aspect-square flex items-center justify-center p-10 rounded-3xl shadow-sm overflow-hidden" onClick={() => setShowLightbox(true)}>
            <img src={product.image_url} className="w-full h-full object-contain mix-blend-multiply" />
          </div>
        </div>

        <div className="flex flex-col">
          <div className="mb-8">
              <p className="text-brand-orange text-[10px] font-bold tracking-widest uppercase mb-1">{product.brand_name}</p>
              <h1 className="text-2xl md:text-4xl font-extrabold text-slate-800 tracking-tight leading-tight mb-6">{product.name_en}</h1>
              <div className="bg-white border border-slate-100 p-8 rounded-2xl relative shadow-xl">
                <div className="absolute top-0 left-0 w-1 h-full bg-brand-orange"></div>
                <p className="text-slate-400 text-[9px] font-bold uppercase tracking-widest mb-3 italic">Price Tier: {userRole}</p>
                <p className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight">RM {displayPrice ? formatMoney(Number(displayPrice)).replace('MYR', '') : '---'}</p>
              </div>
          </div>

          {product.has_variants && (
            <div className="space-y-8 mb-12">
                {variationLevels.map((level: any, idx: number) => (
                    <div key={idx} className="space-y-3">
                        <p className="text-slate-400 text-[10px] font-bold uppercase italic border-b pb-1">Select {level.name}</p>
                        <div className="flex flex-wrap gap-2">
                            {level.options.map((val: string) => (
                                <button key={val} onClick={() => {const n = [...selection]; n[idx] = val; setSelection(n);}} className={`px-6 py-3 text-[10px] font-bold border-2 rounded-lg uppercase tracking-wider ${selection[idx] === val ? 'border-brand-orange bg-brand-orange text-white shadow-lg' : 'border-slate-50 bg-white text-slate-400'}`}>{val}</button>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
          )}

          <div className="flex gap-4 mb-8">
              <div className="flex-1 bg-slate-50 border border-slate-100 p-4 rounded-xl text-center"><p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Weight</p><p className="text-sm font-bold text-slate-700">{product.weight_kg} KG</p></div>
              <div className="flex-1 bg-slate-50 border border-slate-100 p-4 rounded-xl text-center"><p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Scale</p><p className="text-sm font-bold text-slate-700">{product.length_cm}x{product.width_cm}x{product.height_cm} CM</p></div>
          </div>

          <button onClick={handleAddToCart} disabled={product.has_variants && !activeVariant} className="w-full bg-slate-900 text-white py-6 font-bold uppercase tracking-widest hover:bg-[#e11d48] transition-all shadow-xl rounded-xl text-xs active:scale-95 mb-16">CONFIRM & ADD TO ORDER</button>
        </div>
      </main>
    </div>
  )
}