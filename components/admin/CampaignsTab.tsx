"use client"
import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

export default function CampaignsTab() {
  const [vouchers, setVouchers] = useState<any[]>([])
  const [gifts, setGifts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    setLoading(true)
    const [vRes, gRes] = await Promise.all([
      supabase.from('vouchers').select('*').order('id', { ascending: false }),
      supabase.from('free_gifts').select('*').order('id', { ascending: true })
    ]);
    setVouchers(vRes.data || [])
    setGifts(gRes.data || [])
    setLoading(false)
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const handleCreateVoucher = async () => {
    const code = prompt("Enter Voucher Code:");
    const amount = prompt("Enter Discount Amount (RM):");
    if (code && amount) {
        await supabase.from('vouchers').insert([{ code: code.toUpperCase(), discount_amount: parseFloat(amount) }]);
        fetchData();
    }
  }

  const updateStock = async (id: number, current: number) => {
    const next = prompt("Update stock count:", current.toString());
    if (next !== null) {
        await supabase.from('free_gifts').update({ stock: parseInt(next) }).eq('id', id);
        fetchData();
    }
  }

  // --- STANDARD STYLING VARIABLES ---
  const sectionHeader = "text-xl font-bold text-slate-800 tracking-tight mb-6 flex items-center gap-3";
  const cardLabel = "text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4 block";
  const containerClass = "bg-white border border-slate-200 rounded-3xl p-8 shadow-sm w-full";

  if (loading) return <div className="py-20 text-center text-slate-400 font-medium animate-pulse">Synchronizing Marketing Data...</div>

  return (
    <div className="space-y-10 max-w-6xl animate-in fade-in duration-500 font-sans">
      
      {/* 01. DISCOUNT VOUCHERS (FULL WIDTH) */}
      <section>
        <div className="flex justify-between items-center mb-6 px-2">
            <h2 className={sectionHeader}>
                <span className="w-2 h-6 bg-blue-600 rounded-full"></span>
                Discount Vouchers
            </h2>
            <button onClick={handleCreateVoucher} className="bg-blue-600 text-white px-6 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-slate-900 transition-all shadow-lg shadow-blue-600/20">
                + New Voucher
            </button>
        </div>
        <div className={containerClass}>
            <label className={cardLabel}>Active Promotional Codes</label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {vouchers.map(v => (
                    <div key={v.id} className="flex justify-between items-center p-5 bg-slate-50 rounded-2xl border border-slate-100 group hover:border-blue-200 transition-all">
                        <div>
                            <p className="font-bold text-blue-600 tracking-widest text-sm">{v.code}</p>
                            <p className="text-[11px] text-slate-500 font-medium mt-1">Value: RM {v.discount_amount.toFixed(2)}</p>
                        </div>
                        <button onClick={async () => { if(confirm("Delete voucher?")) { await supabase.from('vouchers').delete().eq('id', v.id); fetchData(); }}} className="text-[10px] text-slate-300 hover:text-red-500 font-bold uppercase">Delete</button>
                    </div>
                ))}
                {vouchers.length === 0 && <p className="text-sm text-slate-300 italic p-2">No vouchers active.</p>}
            </div>
        </div>
      </section>

      {/* 02. STICKER INVENTORY (FULL WIDTH) */}
      <section>
        <div className="px-2 mb-6">
            <h2 className={sectionHeader}>
                <span className="w-2 h-6 bg-blue-600 rounded-full"></span>
                Free Gift: Proride Sticker
            </h2>
        </div>
        <div className={containerClass}>
            <label className={cardLabel}>Warehouse Sticker Stock</label>
            {gifts.filter(g => g.name.toLowerCase().includes('sticker')).map(g => (
                <div key={g.id} className="flex flex-col md:flex-row items-center gap-8">
                    <div className="bg-slate-50 px-10 py-6 rounded-2xl border border-slate-100 text-center min-w-[200px]">
                        <p className="text-4xl font-black text-slate-800 tracking-tighter">{g.stock}</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Units In Hand</p>
                    </div>
                    <div className="flex-1 space-y-2">
                        <p className="text-sm font-bold text-slate-700">Official Proride Handling Specialist Sticker</p>
                        <p className="text-xs text-slate-400 leading-relaxed">Automatically available for all order types. Ensure stock is replenished when it falls below 20 units.</p>
                        <button onClick={() => updateStock(g.id, g.stock)} className="mt-4 text-blue-600 font-bold text-[10px] uppercase border-b-2 border-blue-100 hover:border-blue-600 transition-all pb-0.5">
                            Update Inventory Count
                        </button>
                    </div>
                </div>
            ))}
        </div>
      </section>

      {/* 03. T-SHIRT INVENTORY (FULL WIDTH) */}
      <section>
        <div className="px-2 mb-6">
            <h2 className={sectionHeader}>
                <span className="w-2 h-6 bg-blue-600 rounded-full"></span>
                Free Gift: Premium T-Shirt
            </h2>
        </div>
        <div className={containerClass}>
            <label className={cardLabel}>Stock count per size (Full Set Rewards)</label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                {gifts.filter(g => g.name.toLowerCase().includes('t-shirt')).map(g => (
                    <div key={g.id} className="group bg-slate-50 border border-slate-100 p-6 rounded-2xl text-center hover:border-blue-300 transition-all relative">
                        <p className="text-[10px] font-black text-blue-600 mb-2 tracking-widest">{g.size}</p>
                        <p className="text-2xl font-bold text-slate-800">{g.stock}</p>
                        <button 
                            onClick={() => updateStock(g.id, g.stock)} 
                            className="absolute inset-0 w-full h-full opacity-0 flex items-center justify-center bg-blue-600/90 rounded-2xl text-white text-[10px] font-bold uppercase transition-all group-hover:opacity-100"
                        >
                            Edit Stock
                        </button>
                    </div>
                ))}
            </div>
            <div className="mt-8 p-4 bg-blue-50/50 rounded-xl border border-blue-100/50">
                <p className="text-[10px] text-blue-500 font-medium italic">
                    * Information: T-Shirt options are restricted to customers purchasing "Full Set" (4pcs) packages only.
                </p>
            </div>
        </div>
      </section>

    </div>
  )
}