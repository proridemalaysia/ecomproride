"use client"
import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

export default function InventoryTab() {
  const [products, setProducts] = useState<any[]>([])
  const [showForm, setShowForm] = useState(false)
  const [categories, setCategories] = useState<any[]>([])
  const [brands, setBrands] = useState<any[]>([])
  const [vList, setVList] = useState<any[]>([])
  
  // Wizard Form State
  const [activeSubTab, setActiveSubTab] = useState<'basic' | 'spec' | 'desc' | 'sales' | 'ship'>('basic')
  const [formData, setFormData] = useState({
    name_en: '', name_bm: '', category_id: '', product_brand_id: '',
    description_en: '', description_bm: '', price_b2c: 0, price_b2b: 0,
    weight_kg: 0, length_cm: 0, width_cm: 0, height_cm: 0, image_url: '', gallery_input: '',
    spec_warranty: '12 Months', fit_car_brand: '', fit_vehicle_id: ''
  })

  const fetchProducts = useCallback(async () => {
    const { data } = await supabase.from('products').select('*, product_fitment(vehicle_id)').order('id', { ascending: false });
    setProducts(data || []);
  }, [])

  useEffect(() => {
    fetchProducts();
    async function getMeta() {
        const [c, pb, vl] = await Promise.all([
            supabase.from('categories').select('*'),
            supabase.from('product_brands').select('*'),
            supabase.from('vehicle_list').select('*')
        ]);
        setCategories(c.data || []); setBrands(pb.data || []); setVList(vl.data || []);
    }
    getMeta()
  }, [fetchProducts])

  const handleSave = async () => {
    const payload = {
        name_en: formData.name_en, name_bm: formData.name_bm || formData.name_en,
        category_id: formData.category_id || null, product_brand_id: formData.product_brand_id || null,
        description_en: formData.description_en, description_bm: formData.description_bm || formData.description_en,
        image_url: formData.image_url, weight_kg: formData.weight_kg, length_cm: formData.length_cm, width_cm: formData.width_cm, height_cm: formData.height_cm,
        price_b2c: formData.price_b2c, price_b2b: formData.price_b2b, brand_name: brands.find(b=>b.id.toString()===formData.product_brand_id)?.name || 'GENUINE',
        category: categories.find(c=>c.id.toString()===formData.category_id)?.name || 'PART'
    }
    const { data: p } = await supabase.from('products').insert([payload]).select().single()
    if (p && formData.fit_vehicle_id) {
        await supabase.from('product_fitment').insert({ product_id: p.id, vehicle_id: formData.fit_vehicle_id })
    }
    alert("Saved."); setShowForm(false); fetchProducts();
  }

  return (
    <div className="space-y-6">
      
      {/* HEADER SECTION */}
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-2xl font-bold text-slate-800">Inventory</h2>
        <button 
            onClick={() => setShowForm(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg font-bold text-sm flex items-center gap-2 shadow-lg shadow-blue-600/20 transition-all"
        >
          <span className="text-lg">+</span> Add New Item
        </button>
      </div>

      {/* THE ERP STYLE TABLE */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 border-b border-slate-200">
                <tr className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    <th className="px-6 py-4">Item Code / SKU</th>
                    <th className="px-6 py-4">Product Info</th>
                    <th className="px-6 py-4">Category / Brand</th>
                    <th className="px-6 py-4 text-center">Stock</th>
                    <th className="px-6 py-4 text-right">Sell (RM)</th>
                    <th className="px-6 py-4"></th>
                </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
                {products.map(p => (
                    <tr key={p.id} className="hover:bg-slate-50/50 transition-colors group">
                        <td className="px-6 py-5">
                            <p className="font-bold text-blue-600 text-sm">PRO-{p.id.toString().padStart(4, '0')}</p>
                            <p className="text-[10px] text-slate-400 mt-0.5">SKU: {p.id}</p>
                        </td>
                        <td className="px-6 py-5">
                            <p className="font-bold text-slate-700 text-sm">{p.name_en}</p>
                            <p className="text-[10px] text-slate-400 mt-0.5 uppercase tracking-tighter">{p.brand_name}</p>
                        </td>
                        <td className="px-6 py-5">
                            <p className="text-xs font-semibold text-slate-600 uppercase">{p.category}</p>
                        </td>
                        <td className="px-6 py-5 text-center">
                            <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-[10px] font-bold">10</span>
                        </td>
                        <td className="px-6 py-5 text-right font-bold text-slate-700 text-sm">
                            {p.price_b2c.toFixed(2)}
                        </td>
                        <td className="px-6 py-5 text-right">
                            <button className="text-slate-300 hover:text-blue-600 transition-colors">✎</button>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
      </div>

      {/* THE WIZARD MODAL (Matching ERP Color Palette) */}
      {showForm && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 flex items-start justify-center p-4 md:p-10 overflow-y-auto backdrop-blur-sm">
            <div className="max-w-5xl mx-auto w-full bg-white shadow-2xl rounded-2xl overflow-hidden flex flex-col min-h-[80vh]">
                <div className="p-8 border-b flex justify-between bg-white sticky top-0 z-10">
                    <h2 className="font-bold text-slate-800">Product Registration Wizard</h2>
                    <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-900">✕</button>
                </div>
                <div className="flex gap-8 px-8 py-4 border-b bg-slate-50 sticky top-[89px] z-10 overflow-x-auto no-scrollbar">
                    {['basic', 'spec', 'desc', 'sales', 'ship'].map(t => (
                        <button key={t} onClick={() => setActiveSubTab(t as any)} className={`text-[10px] font-bold pb-2 border-b-2 transition-all whitespace-nowrap ${activeSubTab === t ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400'}`}>{t.toUpperCase()}</button>
                    ))}
                </div>
                <div className="p-10 flex-1">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {activeSubTab === 'basic' && (
                            <>
                                <div><label className="text-xs font-bold text-slate-400 mb-2 block">Product Name (EN)</label><input className="w-full border p-3 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/20" value={formData.name_en} onChange={e => setFormData({...formData, name_en: e.target.value})} /></div>
                                <div><label className="text-xs font-bold text-slate-400 mb-2 block">Product Name (BM)</label><input className="w-full border p-3 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/20" value={formData.name_bm} onChange={e => setFormData({...formData, name_bm: e.target.value})} /></div>
                                <div><label className="text-xs font-bold text-slate-400 mb-2 block">Category</label><select className="w-full border p-3 rounded-lg" value={formData.category_id} onChange={e => setFormData({...formData, category_id: e.target.value})}><option value="">Select</option>{categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
                                <div><label className="text-xs font-bold text-slate-400 mb-2 block">Image URL</label><input className="w-full border p-3 rounded-lg" value={formData.image_url} onChange={e => setFormData({...formData, image_url: e.target.value})} /></div>
                            </>
                        )}
                        {/* Remaining tabs SPEC, DESC, SALES, SHIP would follow this exact ERP styling */}
                    </div>
                </div>
                <div className="p-8 border-t bg-slate-50 flex justify-end gap-4 sticky bottom-0 z-10">
                    <button onClick={() => setShowForm(false)} className="text-slate-400 font-bold text-xs px-6">Cancel</button>
                    <button onClick={handleSave} className="bg-blue-600 text-white px-12 py-4 rounded-xl font-bold shadow-lg hover:bg-blue-700 transition-all">Confirm & Publish</button>
                </div>
            </div>
        </div>
      )}
    </div>
  )
}