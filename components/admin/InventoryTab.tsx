"use client"
import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

export default function InventoryTab() {
  const [products, setProducts] = useState<any[]>([])
  const [showForm, setShowForm] = useState(false)
  const [activeSubTab, setActiveSubTab] = useState<'basic' | 'spec' | 'desc' | 'sales' | 'ship'>('basic')
  
  // Wizards State
  const [formData, setFormData] = useState({
    name_en: '', name_bm: '', category_id: '', product_brand_id: '',
    description_en: '', description_bm: '', price_b2c: 0, price_b2b: 0,
    weight_kg: 0, length_cm: 0, width_cm: 0, height_cm: 0, image_url: '', gallery_input: '',
    spec_origin: 'Malaysia', spec_warranty: '12 Months', spec_material: 'Steel',
    fit_car_brand: '', fit_vehicle_id: ''
  })
  
  // Data for Selects
  const [categories, setCategories] = useState<any[]>([])
  const [pBrands, setPBrands] = useState<any[]>([])
  const [vBrands, setVBrands] = useState<any[]>([])
  const [vList, setVList] = useState<any[]>([])

  const fetchProducts = useCallback(async () => {
    const { data } = await supabase.from('products').select('*, product_variants(*), product_fitment(vehicle_id)').order('id', { ascending: false });
    setProducts(data || []);
  }, [])

  useEffect(() => {
    fetchProducts()
    async function getMeta() {
        const [c, pb, vl] = await Promise.all([
            supabase.from('categories').select('*'),
            supabase.from('product_brands').select('*'),
            supabase.from('vehicle_list').select('*')
        ]);
        setCategories(c.data || []); setPBrands(pb.data || []); setVList(vl.data || []);
        const uniqueV = Array.from(new Set((vl.data || []).map(v => v.brand)));
        setVBrands(uniqueV);
    }
    getMeta()
  }, [fetchProducts])

  const handleSave = async () => {
    const payload = {
        name_en: formData.name_en, name_bm: formData.name_bm || formData.name_en,
        category_id: formData.category_id || null, product_brand_id: formData.product_brand_id || null,
        description_en: formData.description_en, description_bm: formData.description_bm || formData.description_en,
        image_url: formData.image_url, gallery_urls: formData.gallery_input.split('\n'),
        weight_kg: formData.weight_kg, length_cm: formData.length_cm, width_cm: formData.width_cm, height_cm: formData.height_cm,
        price_b2c: formData.price_b2c, price_b2b: formData.price_b2b,
        specs: { origin: formData.spec_origin, warranty: formData.spec_warranty, material: formData.spec_material }
    }
    const { data: p } = await supabase.from('products').insert([payload]).select().single()
    if (p && formData.fit_vehicle_id) {
        await supabase.from('product_fitment').insert({ product_id: p.id, vehicle_id: formData.fit_vehicle_id })
    }
    alert("Saved."); setShowForm(false); fetchProducts();
  }

  const isComplete = (tab: string) => {
    if (tab === 'basic') return formData.name_en !== '' && formData.category_id !== '' && formData.image_url !== '';
    return true;
  }

  const labelS = "text-[10px] font-bold text-slate-400 uppercase mb-2 block";
  const inputS = "w-full bg-white border border-slate-200 p-4 rounded-xl text-sm font-semibold outline-none focus:border-brand-orange";

  return (
    <div className="space-y-12">
      {showForm && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 flex items-start justify-center p-4 md:p-10 overflow-y-auto">
            <div className="max-w-5xl mx-auto w-full bg-white shadow-2xl rounded-3xl overflow-hidden flex flex-col min-h-[80vh]">
                <div className="p-8 border-b flex justify-between bg-white sticky top-0 z-10">
                    <h2 className="font-bold">Inventory Wizard</h2>
                    <button onClick={() => setShowForm(false)}>✕</button>
                </div>
                <div className="flex gap-4 p-4 border-b bg-slate-50 sticky top-[73px] z-10 overflow-x-auto">
                    {['basic', 'spec', 'desc', 'sales', 'ship'].map(t => (
                        <button key={t} onClick={() => setActiveSubTab(t as any)} className={`text-[10px] font-bold px-4 py-2 border-b-2 ${activeSubTab === t ? 'border-brand-orange text-brand-orange' : 'border-transparent text-slate-400'}`}>{t.toUpperCase()}</button>
                    ))}
                </div>
                <div className="p-10 flex-1">
                    {activeSubTab === 'basic' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div><label className={labelS}>Product Name (English)</label><input className={inputS} value={formData.name_en} onChange={e => setFormData({...formData, name_en: e.target.value})} /></div>
                            <div><label className={labelS}>Product Name (BM)</label><input className={inputS} value={formData.name_bm} onChange={e => setFormData({...formData, name_bm: e.target.value})} /></div>
                            <div><label className={labelS}>Category</label><select className={inputS} value={formData.category_id} onChange={e => setFormData({...formData, category_id: e.target.value})}><option value="">Select</option>{categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
                            <div><label className={labelS}>Main Image</label><input className={inputS} value={formData.image_url} onChange={e => setFormData({...formData, image_url: e.target.value})} /></div>
                        </div>
                    )}
                    {/* (Other subtabs follow same pattern using formData state) */}
                </div>
                <div className="p-8 border-t bg-slate-50 sticky bottom-0 flex justify-end gap-4">
                    <button onClick={handleSave} className="bg-slate-900 text-white px-12 py-4 rounded-xl font-bold">Publish Listing</button>
                </div>
            </div>
        </div>
      )}

      <button onClick={() => setShowForm(true)} className="bg-brand-orange text-white w-full py-10 rounded-[2.5rem] font-black text-xl shadow-xl">+ Add New Product</button>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {products.map(p => (
            <div key={p.id} className="bg-white border p-8 rounded-[2rem] hover:shadow-xl transition-all border-slate-100 flex flex-col justify-between">
                <div className="flex gap-4">
                    <img src={p.image_url} className="w-20 h-20 bg-slate-50 p-2 object-contain rounded-xl" alt={p.name_en} />
                    <div className="overflow-hidden">
                        <h3 className="font-bold text-slate-800 truncate text-sm">{p.name_en}</h3>
                        <p className="text-[10px] text-slate-400 font-bold uppercase">{p.brand_name}</p>
                    </div>
                </div>
                <div className="mt-8 pt-6 border-t flex justify-between items-end">
                    <span className="font-black text-lg text-slate-900">RM{p.price_b2c?.toFixed(2)}</span>
                    <button onClick={async () => { await supabase.from('products').delete().eq('id', p.id); fetchProducts(); }} className="text-[10px] font-bold text-slate-300 hover:text-red-500">Delete</button>
                </div>
            </div>
        ))}
      </div>
    </div>
  )
}