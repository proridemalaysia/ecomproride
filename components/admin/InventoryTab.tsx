"use client"
import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

export default function InventoryTab() {
  // --- DATA STATES ---
  const [products, setProducts] = useState<any[]>([])
  const [vouchers, setVouchers] = useState<any[]>([])
  const [gifts, setGifts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  
  // --- UI STATES ---
  const [showForm, setShowForm] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editId, setEditId] = useState<number | null>(null)
  const [activeSubTab, setActiveSubTab] = useState<'basic' | 'spec' | 'desc' | 'sales' | 'ship'>('basic')
  const subTabOrder: ('basic' | 'spec' | 'desc' | 'sales' | 'ship')[] = ['basic', 'spec', 'desc', 'sales', 'ship']

  // --- WIZARD METADATA ---
  const [categories, setCategories] = useState<any[]>([])
  const [productBrands, setProductBrands] = useState<any[]>([])
  const [vehicleList, setVehicleList] = useState<any[]>([])

  // --- VARIATION ENGINE ---
  const [hasVariations, setHasVariations] = useState(false)
  const [variationLevels, setVariationLevels] = useState([{ name: 'Spec', options: ['Standard'] }])
  const [variantGrid, setVariantGrid] = useState<any[]>([])

  // --- MASTER FORM STATE ---
  const [formData, setFormData] = useState({
    name_en: '', name_bm: '', category_id: '', product_brand_id: '',
    description_en: '', description_bm: '', price_b2c: 0, price_b2b: 0,
    weight_kg: 0, length_cm: 0, width_cm: 0, height_cm: 0, image_url: '', gallery_input: '',
    spec_origin: 'Malaysia', spec_warranty: '12 Months', spec_material: 'Steel',
    fit_car_brand: '', fit_vehicle_id: ''
  })

  // --- FETCH FUNCTIONS ---
  const fetchAllData = useCallback(async () => {
    setLoading(true)
    const [pRes, vRes, gRes, cRes, pbRes, vlRes] = await Promise.all([
      supabase.from('products').select('*, product_variants(*), product_fitment(vehicle_id)').order('id', { ascending: false }),
      supabase.from('vouchers').select('*').order('id', { ascending: false }),
      supabase.from('free_gifts').select('*').order('id', { ascending: true }),
      supabase.from('categories').select('*'),
      supabase.from('product_brands').select('*'),
      supabase.from('vehicle_list').select('*')
    ]);

    setProducts(pRes.data || [])
    setVouchers(vRes.data || [])
    setGifts(gRes.data || [])
    setCategories(cRes.data || [])
    setProductBrands(pbRes.data || [])
    setVehicleList(vlRes.data || [])
    setLoading(false)
  }, [])

  useEffect(() => { fetchAllData() }, [fetchAllData])

  // --- VARIATION GENERATOR ---
  useEffect(() => {
    if (hasVariations && !isEditing) {
        const combinations = (arrays: string[][]): string[][] => arrays.reduce((a, b) => a.flatMap(d => b.map(e => [d, e].flat())), [[]] as string[][]);
        const activeOptions = variationLevels.map(v => v.options.filter(o => o.trim() !== ''));
        if (activeOptions.length > 0 && activeOptions[0].length > 0) {
            const combos = combinations(activeOptions);
            setVariantGrid(prevGrid => combos.map((combo) => {
                const comboName = combo.join(' - ');
                const existing = prevGrid.find(g => g.name === comboName);
                return { name: comboName, attributes: combo, price_b2c: existing?.price_b2c || 0, price_b2b: existing?.price_b2b || 0, sku: existing?.sku || '', stock: existing?.stock || 0, is_active: existing?.is_active ?? true };
            }));
        }
    }
  }, [hasVariations, variationLevels, isEditing]);

  // --- HANDLERS ---
  const handleSaveProduct = async () => {
    setIsSaving(true);
    const firstV = variantGrid.find(v => v.is_active) || variantGrid[0];
    const payload = {
        name_en: formData.name_en, name_bm: formData.name_bm || formData.name_en,
        category_id: formData.category_id || null, product_brand_id: formData.product_brand_id || null,
        description_en: formData.description_en, description_bm: formData.description_bm || formData.description_en,
        image_url: formData.image_url, gallery_urls: formData.gallery_input.split('\n').filter(l => l.trim() !== ''),
        weight_kg: formData.weight_kg, length_cm: formData.length_cm, width_cm: formData.width_cm, height_cm: formData.height_cm,
        price_b2c: hasVariations ? firstV.price_b2c : formData.price_b2c,
        price_b2b: hasVariations ? firstV.price_b2b : formData.price_b2b,
        has_variants: hasVariations,
        brand_name: productBrands.find(b=>b.id.toString()===formData.product_brand_id)?.name || 'GENUINE',
        category: categories.find(c=>c.id.toString()===formData.category_id)?.name || 'PART',
        specs: { origin: formData.spec_origin, warranty: formData.spec_warranty, material: formData.spec_material }
    }
    const { data: p } = isEditing ? await supabase.from('products').update(payload).eq('id', editId as number).select().single() : await supabase.from('products').insert([payload]).select().single();
    if (p) {
        if (formData.fit_vehicle_id) { await supabase.from('product_fitment').delete().eq('product_id', p.id); await supabase.from('product_fitment').insert({ product_id: p.id, vehicle_id: formData.fit_vehicle_id }); }
        if (hasVariations) {
            await supabase.from('product_variants').delete().eq('product_id', p.id);
            await supabase.from('product_variants').insert(variantGrid.map(v => ({ product_id: p.id, name: v.name, price_b2c: v.price_b2c, price_b2b: v.price_b2b, sku: v.sku, stock_quantity: v.stock, is_active: v.is_active, attributes: v.attributes })));
        }
        alert("Inventory Updated."); setShowForm(false); fetchAllData();
    }
    setIsSaving(false);
  }

  const handleCreateVoucher = async () => {
    const code = prompt("Enter Voucher Code (e.g. SAVE10):");
    const amount = prompt("Enter Discount Amount (RM):");
    if (code && amount) {
        await supabase.from('vouchers').insert([{ code: code.toUpperCase(), discount_amount: parseFloat(amount) }]);
        fetchAllData();
    }
  }

  const updateGiftStock = async (id: number, currentStock: number) => {
    const newStock = prompt("Enter new stock count:", currentStock.toString());
    if (newStock !== null) {
        await supabase.from('free_gifts').update({ stock: parseInt(newStock) }).eq('id', id);
        fetchAllData();
    }
  }

  const isTabComplete = (t: string) => {
    if (t === 'basic') return formData.name_en && formData.category_id && formData.image_url;
    if (t === 'spec') return formData.fit_vehicle_id;
    return true;
  }

  const labelS = "text-[10px] font-bold text-slate-400 uppercase mb-2 block tracking-widest";
  const inputS = "w-full border border-slate-200 p-4 rounded-xl text-sm font-semibold outline-none focus:border-blue-600 transition-all";

  return (
    <div className="space-y-12 pb-20">
      
      {/* 1. PRODUCT INVENTORY TABLE */}
      <section className="space-y-6">
        <div className="flex justify-between items-center px-2">
            <div><h2 className="text-2xl font-bold text-slate-800 tracking-tight">Warehouse Stock</h2><p className="text-sm text-slate-400">Total active items: {products.length}</p></div>
            <button onClick={() => {setShowForm(true); setIsEditing(false); setActiveSubTab('basic');}} className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold text-xs shadow-xl shadow-blue-500/20 hover:bg-blue-700 transition-all">+ Add New Part</button>
        </div>
        <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
            <table className="w-full text-left">
                <thead className="bg-slate-50 border-b"><tr className="text-[10px] font-bold text-slate-400 uppercase tracking-widest"><th className="px-8 py-5">Code</th><th className="px-8 py-5">Product Info</th><th className="px-8 py-5 text-center">In Stock</th><th className="px-8 py-5 text-right">Price (RM)</th><th className="px-8 py-5"></th></tr></thead>
                <tbody className="divide-y divide-slate-50">
                    {products.map(p => (
                        <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-8 py-6"><span className="font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-lg text-xs uppercase italic">PRO-{p.id}</span></td>
                            <td className="px-8 py-6"><p className="font-bold text-slate-700 text-sm">{p.name_en}</p><p className="text-[10px] text-slate-400 font-bold uppercase">{p.brand_name}</p></td>
                            <td className="px-8 py-6 text-center"><span className="bg-green-50 text-green-700 px-3 py-1 rounded-full text-[10px] font-black uppercase italic">Available</span></td>
                            <td className="px-8 py-6 text-right font-black text-slate-700 text-sm">{p.price_b2c.toFixed(2)}</td>
                            <td className="px-8 py-6 text-right"><button onClick={() => { /* Edit trigger here */ }} className="text-slate-300 hover:text-blue-600 font-bold">✎</button></td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
      </section>

      {/* 2. CAMPAIGN & GIFTS SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          
          {/* VOUCHERS */}
          <section className="space-y-6">
            <div className="flex justify-between items-center px-2">
                <h2 className="text-xl font-bold text-slate-800 tracking-tight italic">Discount Vouchers</h2>
                <button onClick={handleCreateVoucher} className="text-[10px] font-bold text-blue-600 underline">CREATE NEW</button>
            </div>
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
                <div className="space-y-4">
                    {vouchers.map(v => (
                        <div key={v.id} className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl border border-slate-100 group">
                            <div><p className="font-black text-blue-600 tracking-widest">{v.code}</p><p className="text-[10px] text-slate-400 font-bold">Discount: RM {v.discount_amount}</p></div>
                            <button onClick={async () => { await supabase.from('vouchers').delete().eq('id', v.id); fetchAllData(); }} className="text-[10px] text-slate-300 group-hover:text-red-500 font-bold">Remove</button>
                        </div>
                    ))}
                    {vouchers.length === 0 && <p className="text-center py-10 text-slate-300 text-xs italic">No active vouchers.</p>}
                </div>
            </div>
          </section>

          {/* FREE GIFTS */}
          <section className="space-y-6">
            <div className="flex justify-between items-center px-2">
                <h2 className="text-xl font-bold text-slate-800 tracking-tight italic">Gift Stock Management</h2>
            </div>
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
                <div className="grid grid-cols-2 gap-4">
                    {gifts.map(g => (
                        <div key={g.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 relative">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{g.name}</p>
                            <p className="font-black text-slate-800 text-sm uppercase">{g.size || 'NO SIZE'}</p>
                            <div className="mt-3 flex justify-between items-center">
                                <span className={`text-[10px] font-black px-2 py-0.5 rounded ${g.stock < 5 ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>{g.stock} PCS LEFT</span>
                                <button onClick={() => updateGiftStock(g.id, g.stock)} className="text-[10px] font-bold text-blue-600 underline">Update</button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
          </section>
      </div>

      {/* 3. THE WIZARD MODAL */}
      {showForm && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 flex items-start justify-center p-4 md:p-10 overflow-y-auto backdrop-blur-sm">
            <div className="max-w-6xl mx-auto w-full bg-white shadow-2xl rounded-[2.5rem] overflow-hidden flex flex-col min-h-[85vh]">
                <div className="p-8 border-b flex justify-between bg-white sticky top-0 z-10">
                    <h2 className="text-xl font-bold text-slate-800">{isEditing ? 'Update Listing' : 'New Listing'}</h2>
                    <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-900 transition-all">✕</button>
                </div>
                <div className="flex gap-6 px-8 py-4 border-b bg-slate-50 sticky top-[89px] z-10 overflow-x-auto no-scrollbar">
                    {subTabOrder.map((t, idx) => (
                        <button key={t} onClick={() => setActiveSubTab(t)} className={`text-[10px] font-bold pb-2 border-b-2 transition-all whitespace-nowrap ${activeSubTab === t ? 'border-blue-600 text-blue-600' : isTabComplete(t) ? 'border-green-500 text-green-500' : 'border-transparent text-slate-400'}`}>{idx+1}. {t.toUpperCase()}</button>
                    ))}
                </div>
                <div className="p-10 flex-1 not-italic">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                        {activeSubTab === 'basic' && (
                            <>
                                <div><label className={labelS}>Name (EN)</label><input className="input-erp" value={formData.name_en} onChange={e => setFormData({...formData, name_en: e.target.value})} /></div>
                                <div><label className={labelS}>Category</label><select className="input-erp" value={formData.category_id || ''} onChange={e => setFormData({...formData, category_id: e.target.value})}><option value="">Select Category</option>{categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
                                <div><label className={labelS}>Image URL (Main)</label><input className="input-erp" value={formData.image_url} onChange={e => setFormData({...formData, image_url: e.target.value})} /></div>
                            </>
                        )}
                        {activeSubTab === 'spec' && (
                            <>
                                <div className="space-y-4 bg-slate-50 p-6 rounded-2xl border">
                                    <label className="text-blue-600 font-bold text-[10px] uppercase tracking-widest">Car Fitment</label>
                                    <select className="input-erp" value={formData.fit_car_brand} onChange={e => setFormData({...formData, fit_car_brand: e.target.value})}><option value="">Brand</option>{Array.from(new Set(vehicleList.map(v => v.brand))).map(b => <option key={b} value={b}>{b}</option>)}</select>
                                    <select className="input-erp" value={formData.fit_vehicle_id} onChange={e => setFormData({...formData, fit_vehicle_id: e.target.value})} disabled={!formData.fit_car_brand}><option value="">Model</option>{vehicleList.filter(v => v.brand === formData.fit_car_brand).map(v => <option key={v.id} value={v.id}>{v.model}</option>)}</select>
                                </div>
                                <div className="space-y-4">
                                    <div><label className={labelS}>Manufacturer</label><select className="input-erp" value={formData.product_brand_id || ''} onChange={e => setFormData({...formData, product_brand_id: e.target.value})}><option value="">Select</option>{productBrands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}</select></div>
                                    <div><label className={labelS}>Warranty</label><input className="input-erp" value={formData.spec_warranty} onChange={e => setFormData({...formData, spec_warranty: e.target.value})} /></div>
                                </div>
                            </>
                        )}
                        {activeSubTab === 'sales' && (
                            <div className="md:col-span-2 space-y-6">
                                <button type="button" onClick={() => setHasVariations(!hasVariations)} className={`px-12 py-3 rounded-xl font-bold text-xs ${hasVariations ? 'bg-blue-600 text-white shadow-lg' : 'bg-slate-200 text-slate-500'}`}>{hasVariations ? 'ON' : 'OFF'}</button>
                                {hasVariations && (
                                    <div className="overflow-x-auto border rounded-xl shadow-sm">
                                        <table className="w-full text-left text-sm">
                                            <thead className="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase italic">
                                                <tr><th className="p-4">Variant</th><th className="p-4">Retail RM</th><th className="p-4 text-blue-600">Dealer RM</th><th className="p-4">Stock</th></tr>
                                            </thead>
                                            <tbody>
                                                {variantGrid.map((v, i) => (
                                                    <tr key={i} className="border-b">
                                                        <td className="p-4 font-bold">{v.name}</td>
                                                        <td className="p-2"><input type="number" step="0.01" className="input-erp !p-2" value={variantGrid[i].price_b2c} onChange={e => { const g = [...variantGrid]; g[i].price_b2c = Number(e.target.value); setVariantGrid(g); }} /></td>
                                                        <td className="p-2"><input type="number" step="0.01" className="input-erp !p-2 font-bold text-blue-600" value={variantGrid[i].price_b2b} onChange={e => { const g = [...variantGrid]; g[i].price_b2b = Number(e.target.value); setVariantGrid(g); }} /></td>
                                                        <td className="p-2"><input type="number" className="input-erp !p-2 text-center" value={variantGrid[i].stock} onChange={e => { const g = [...variantGrid]; g[i].stock = Number(e.target.value); setVariantGrid(g); }} /></td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        )}
                        {activeSubTab === 'ship' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                <div><label className={labelS}>Weight (KG)</label><input type="number" step="0.1" className="input-erp" value={formData.weight_kg} onChange={e => setFormData({...formData, weight_kg: Number(e.target.value)})} /></div>
                                <div className="grid grid-cols-3 gap-6">
                                    <div><label className={labelS}>L (CM)</label><input type="number" className="input-erp" value={formData.length_cm} onChange={e => setFormData({...formData, length_cm: Number(e.target.value)})} /></div>
                                    <div><label className={labelS}>W (CM)</label><input type="number" className="input-erp" value={formData.width_cm} onChange={e => setFormData({...formData, width_cm: Number(e.target.value)})} /></div>
                                    <div><label className={labelS}>H (CM)</label><input type="number" className="input-erp" value={formData.height_cm} onChange={e => setFormData({...formData, height_cm: Number(e.target.value)})} /></div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
                <div className="p-10 border-t bg-slate-50 flex justify-end gap-6 mt-auto sticky bottom-0 z-10">
                    <button onClick={() => setShowForm(false)} className="px-10 py-5 font-bold text-xs text-slate-400">Cancel</button>
                    {activeSubTab !== 'ship' ? (
                        <button onClick={() => setActiveSubTab(subTabOrder[subTabOrder.indexOf(activeSubTab) + 1])} disabled={!isTabComplete(activeSubTab)} className={`px-24 py-6 font-bold rounded-xl text-sm transition-all shadow-xl ${isTabComplete(activeSubTab) ? 'bg-blue-600 text-white shadow-lg' : 'bg-slate-100 text-slate-400 cursor-not-allowed'}`}>Next Step →</button>
                    ) : (
                        <button onClick={handleSaveProduct} className="px-24 py-6 bg-slate-900 text-white font-bold rounded-xl text-sm hover:bg-blue-600 transition-all shadow-xl uppercase">{isSaving ? 'Processing...' : 'Publish Listing'}</button>
                    )}
                </div>
            </div>
        </div>
      )}
    </div>
  )
}