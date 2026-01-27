"use client"
import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

export default function InventoryTab() {
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editId, setEditId] = useState<number | null>(null)

  // Wizard Data States
  const [categories, setCategories] = useState<any[]>([])
  const [productBrands, setProductBrands] = useState<any[]>([])
  const [vehicleList, setVehicleList] = useState<any[]>([])
  const [activeSubTab, setActiveSubTab] = useState<'basic' | 'spec' | 'desc' | 'sales' | 'ship'>('basic')

  const [formData, setFormData] = useState({
    name_en: '', name_bm: '', category_id: '', product_brand_id: '',
    description_en: '', description_bm: '', price_b2c: 0, price_b2b: 0,
    weight_kg: 0, length_cm: 0, width_cm: 0, height_cm: 0, image_url: '', gallery_input: '',
    spec_origin: 'Malaysia', spec_warranty: '12 Months', spec_material: 'Steel',
    fit_car_brand: '', fit_vehicle_id: ''
  })

  const fetchProducts = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase.from('products').select('*, product_fitment(vehicle_id)').order('id', { ascending: false });
    setProducts(data || []);
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchProducts();
    async function getMeta() {
        const [c, pb, vl] = await Promise.all([
            supabase.from('categories').select('*'),
            supabase.from('product_brands').select('*'),
            supabase.from('vehicle_list').select('*')
        ]);
        setCategories(c.data || []); setProductBrands(pb.data || []); setVehicleList(vl.data || []);
    }
    getMeta()
  }, [fetchProducts])

  const handleEditClick = async (p: any) => {
    const fitment = p.product_fitment?.[0];
    const vehicle = vehicleList.find(v => v.id.toString() === fitment?.vehicle_id?.toString());
    setFormData({
      name_en: p.name_en, name_bm: p.name_bm || '', category_id: p.category_id?.toString() || '', product_brand_id: p.product_brand_id?.toString() || '',
      description_en: p.description_en || '', description_bm: p.description_bm || '', price_b2c: p.price_b2c, price_b2b: p.price_b2b,
      weight_kg: p.weight_kg, length_cm: p.length_cm, width_cm: p.width_cm, height_cm: p.height_cm,
      image_url: p.image_url, gallery_input: p.gallery_urls?.join('\n') || '',
      spec_origin: p.specs?.origin || 'Malaysia', spec_warranty: p.specs?.warranty || '12 Months', spec_material: p.specs?.material || 'Steel',
      fit_car_brand: vehicle?.brand || '', fit_vehicle_id: fitment?.vehicle_id?.toString() || ''
    });
    setEditId(p.id); setIsEditing(true); setShowForm(true); setActiveSubTab('basic');
  }

  const handleSave = async () => {
    setLoading(true);
    const selectedCat = categories.find(c => c.id.toString() === formData.category_id);
    const selectedPBrand = productBrands.find(b => b.id.toString() === formData.product_brand_id);

    const payload = {
        name_en: formData.name_en, name_bm: formData.name_bm || formData.name_en,
        category: selectedCat?.name || 'PART', category_id: formData.category_id || null,
        brand_name: selectedPBrand?.name || 'GENUINE', product_brand_id: formData.product_brand_id || null,
        description_en: formData.description_en, description_bm: formData.description_bm || formData.description_en,
        image_url: formData.image_url, gallery_urls: formData.gallery_input.split('\n').filter(l => l.trim() !== ''),
        weight_kg: formData.weight_kg, length_cm: formData.length_cm, width_cm: formData.width_cm, height_cm: formData.height_cm,
        price_b2c: formData.price_b2c, price_b2b: formData.price_b2b,
        specs: { origin: formData.spec_origin, warranty: formData.spec_warranty, material: formData.spec_material }
    }

    const { data: p, error } = isEditing 
        ? await supabase.from('products').update(payload).eq('id', editId).select().single() 
        : await supabase.from('products').insert([payload]).select().single();

    if (p) {
        if (formData.fit_vehicle_id) {
            await supabase.from('product_fitment').delete().eq('product_id', p.id);
            await supabase.from('product_fitment').insert({ product_id: p.id, vehicle_id: formData.fit_vehicle_id });
        }
        alert("Inventory Synced."); setShowForm(false); setIsEditing(false); fetchProducts();
    } else { alert(error?.message); }
    setLoading(false);
  }

  const labelS = "text-[10px] font-bold text-slate-400 uppercase mb-2 block tracking-widest";
  const inputS = "w-full border border-slate-200 p-4 rounded-xl text-sm font-semibold outline-none focus:border-blue-600 transition-all";

  return (
    <div className="space-y-8">
      {/* HEADER SECTION */}
      <div className="flex justify-between items-center px-2">
        <div>
            <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Inventory</h2>
            <p className="text-sm text-slate-400">Total active items: {products.length}</p>
        </div>
        <button 
            onClick={() => {setShowForm(true); setIsEditing(false); setActiveSubTab('basic'); setFormData({name_en: '', name_bm: '', category_id: '', product_brand_id: '', description_en: '', description_bm: '', price_b2c: 0, price_b2b: 0, weight_kg: 0, length_cm: 0, width_cm: 0, height_cm: 0, image_url: '', gallery_input: '', spec_origin: 'Malaysia', spec_warranty: '12 Months', spec_material: 'Steel', fit_car_brand: '', fit_vehicle_id: ''})}} 
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl font-bold text-xs shadow-lg shadow-blue-500/20 transition-all"
        >
          + Add New Item
        </button>
      </div>

      {/* ERP TABLE */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 border-b border-slate-200">
                <tr className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    <th className="px-8 py-5">Item Code</th>
                    <th className="px-8 py-5">Product Info</th>
                    <th className="px-8 py-5">Pos / Type</th>
                    <th className="px-8 py-5 text-center">Stock</th>
                    <th className="px-8 py-5 text-right">Sell (RM)</th>
                    <th className="px-8 py-5"></th>
                </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
                {products.map(p => (
                    <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-8 py-6">
                            <p className="font-bold text-blue-800 text-sm tracking-tight uppercase">PRO-{p.id.toString().padStart(4, '0')}</p>
                        </td>
                        <td className="px-8 py-6">
                            <p className="font-bold text-slate-700 text-sm">{p.name_en}</p>
                            <p className="text-[10px] text-slate-400 font-semibold uppercase">{p.brand_name}</p>
                        </td>
                        <td className="px-8 py-6">
                            <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md uppercase">{p.category}</span>
                        </td>
                        <td className="px-8 py-6 text-center">
                            <span className="bg-green-50 text-green-700 px-3 py-1 rounded-md text-[10px] font-bold border border-green-100">10</span>
                        </td>
                        <td className="px-8 py-6 text-right font-bold text-slate-700 text-sm">{p.price_b2c.toFixed(2)}</td>
                        <td className="px-8 py-6 text-right">
                            <button onClick={() => handleEditClick(p)} className="text-slate-300 hover:text-blue-600 transition-colors">✎</button>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
      </div>

      {/* WIZARD MODAL */}
      {showForm && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 flex items-start justify-center p-4 md:p-10 overflow-y-auto backdrop-blur-md">
            <div className="max-w-5xl mx-auto w-full bg-white shadow-2xl rounded-[2.5rem] overflow-hidden flex flex-col min-h-[85vh]">
                <div className="p-8 border-b flex justify-between bg-white sticky top-0 z-10">
                    <h2 className="text-xl font-bold text-slate-800">{isEditing ? 'Update Listing' : 'New Listing'}</h2>
                    <button onClick={() => setShowForm(false)} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-slate-50 text-slate-400">✕</button>
                </div>
                <div className="flex gap-4 md:gap-8 px-8 py-4 border-b bg-slate-50 sticky top-[89px] z-10 overflow-x-auto no-scrollbar">
                    {['basic', 'spec', 'desc', 'sales', 'ship'].map((t, idx) => (
                        <button key={t} onClick={() => setActiveSubTab(t as any)} className={`text-[10px] font-bold tracking-widest pb-2 border-b-2 transition-all whitespace-nowrap ${activeSubTab === t ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400'}`}>
                            {idx + 1}. {t.toUpperCase()}
                        </button>
                    ))}
                </div>
                <div className="p-10 flex-1">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {activeSubTab === 'basic' && (
                            <>
                                <div><label className={labelS}>Name (EN)</label><input className={inputS} value={formData.name_en} onChange={e => setFormData({...formData, name_en: e.target.value})} /></div>
                                <div><label className={labelS}>Name (BM)</label><input className={inputS} value={formData.name_bm} onChange={e => setFormData({...formData, name_bm: e.target.value})} /></div>
                                <div><label className={labelS}>Category</label><select className={inputS} value={formData.category_id} onChange={e => setFormData({...formData, category_id: e.target.value})}><option value="">Select</option>{categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
                                <div><label className={labelS}>Main Image Link</label><input className={inputS} value={formData.image_url} onChange={e => setFormData({...formData, image_url: e.target.value})} /></div>
                            </>
                        )}
                        {activeSubTab === 'spec' && (
                            <>
                                <div className="space-y-4 bg-slate-50 p-6 rounded-xl border">
                                    <label className="text-blue-600 font-bold text-[10px] uppercase block mb-2 tracking-widest">Car Fitment</label>
                                    <select className={inputS} value={formData.fit_car_brand} onChange={e => setFormData({...formData, fit_car_brand: e.target.value})}><option value="">Select Brand</option>{Array.from(new Set(vehicleList.map(v => v.brand))).map(b => <option key={b} value={b}>{b}</option>)}</select>
                                    <select className={inputS} value={formData.fit_vehicle_id} onChange={e => setFormData({...formData, fit_vehicle_id: e.target.value})} disabled={!formData.fit_car_brand}><option value="">Select Model</option>{vehicleList.filter(v => v.brand === formData.fit_car_brand).map(v => <option key={v.id} value={v.id}>{v.model}</option>)}</select>
                                </div>
                                <div className="space-y-4">
                                    <div><label className={labelS}>Part Manufacturer</label><select className={inputS} value={formData.product_brand_id} onChange={e => setFormData({...formData, product_brand_id: e.target.value})}><option value="">Select</option>{productBrands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}</select></div>
                                    <div><label className={labelS}>Warranty</label><input className={inputS} value={formData.spec_warranty} onChange={e => setFormData({...formData, spec_warranty: e.target.value})} /></div>
                                </div>
                            </>
                        )}
                        {activeSubTab === 'desc' && (
                            <>
                                <div><label className={labelS}>Description (EN)</label><textarea className={`${inputS} h-64 resize-none`} value={formData.description_en} onChange={e => setFormData({...formData, description_en: e.target.value})} /></div>
                                <div><label className={labelS}>Description (BM)</label><textarea className={`${inputS} h-64 resize-none`} value={formData.description_bm} onChange={e => setFormData({...formData, description_bm: e.target.value})} /></div>
                            </>
                        )}
                        {activeSubTab === 'sales' && (
                            <div className="grid grid-cols-2 gap-8">
                                <div><label className={labelS}>Retail Price RM</label><input type="number" step="0.01" className={inputS} value={formData.price_b2c} onChange={e => setFormData({...formData, price_b2c: Number(e.target.value)})} /></div>
                                <div><label className={labelS}>Dealer Price RM</label><input type="number" step="0.01" className={`${inputS} text-blue-600`} value={formData.price_b2b} onChange={e => setFormData({...formData, price_b2b: Number(e.target.value)})} /></div>
                            </div>
                        )}
                        {activeSubTab === 'ship' && (
                            <>
                                <div><label className={labelS}>Weight (KG)</label><input type="number" step="0.1" className={inputS} value={formData.weight_kg} onChange={e => setFormData({...formData, weight_kg: Number(e.target.value)})} /></div>
                                <div className="grid grid-cols-3 gap-4">
                                    <div><label className={labelS}>L(CM)</label><input type="number" className={inputS} value={formData.length_cm} onChange={e => setFormData({...formData, length_cm: Number(e.target.value)})} /></div>
                                    <div><label className={labelS}>W(CM)</label><input type="number" className={inputS} value={formData.width_cm} onChange={e => setFormData({...formData, width_cm: Number(e.target.value)})} /></div>
                                    <div><label className={labelS}>H(CM)</label><input type="number" className={inputS} value={formData.height_cm} onChange={e => setFormData({...formData, height_cm: Number(e.target.value)})} /></div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
                <div className="p-8 border-t bg-slate-50 flex justify-end gap-4 sticky bottom-0 z-10">
                    <button onClick={() => setShowForm(false)} className="text-slate-400 font-bold text-xs px-6">Cancel</button>
                    <button onClick={handleSave} className="bg-blue-600 text-white px-16 py-4 rounded-2xl font-bold shadow-lg hover:bg-blue-700 transition-all text-sm tracking-widest uppercase">{isEditing ? 'Commit Updates' : 'Publish Listing'}</button>
                </div>
            </div>
        </div>
      )}
    </div>
  )
}