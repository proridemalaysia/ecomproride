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

  const sectionHeader = "text-xl font-bold text-slate-800 tracking-tight mb-6 flex items-center gap-3";
  const subLabel = "text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-4 block";
  const cardClass = "bg-white border border-slate-200 rounded-2xl p-6 shadow-sm";

  if (loading) return <div className="py-20 text-center text-slate-400 animate-pulse">Loading Marketing Data...</div>

  return (
    <div className="space-y-12 max-w-5xl animate-in fade-in duration-500">
      
      {/* --- 01. DISCOUNT VOUCHER MODULE --- */}
      <section>
        <div className="flex justify-between items-center mb-6 px-2">
            <h2 className={sectionHeader}>
                <span className="w-2 h-6 bg-blue-600 rounded-full"></span>
                Discount Vouchers
            </h2>
            <button onClick={handleCreateVoucher} className="bg-slate-900 text-white px-6 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-blue-600 transition-all shadow-lg">
                + New Voucher
            </button>
        </div>
        <div className={cardClass}>
            <label className={subLabel}>Active Promotional Codes</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {vouchers.map(v => (
                    <div key={v.id} className="flex justify-between items-center p-4 bg-slate-50 rounded-xl border border-slate-100 group">
                        <div>
                            <p className="font-bold text-blue-600 tracking-widest text-sm">{v.code}</p>
                            <p className="text-[11px] text-slate-500 font-medium mt-1">Value: RM {v.discount_amount.toFixed(2)}</p>
                        </div>
                        <button onClick={async () => { if(confirm("Delete voucher?")) { await supabase.from('vouchers').delete().eq('id', v.id); fetchData(); }}} className="text-[10px] text-slate-300 hover:text-red-500 font-bold uppercase transition-colors">Remove</button>
                    </div>
                ))}
                {vouchers.length === 0 && <p className="text-sm text-slate-400 italic p-4">No active vouchers found.</p>}
            </div>
        </div>
      </section>

      {/* --- 02. FREE GIFT INVENTORY MODULE --- */}
      <section className="space-y-6">
        <h2 className={sectionHeader}>
            <span className="w-2 h-6 bg-blue-600 rounded-full"></span>
            Free Gift Inventory
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* SUB-MODULE: PRORIDE STICKER */}
            <div className={`${cardClass} md:col-span-1`}>
                <label className={subLabel}>Proride Sticker</label>
                {gifts.filter(g => g.name.toLowerCase().includes('sticker')).map(g => (
                    <div key={g.id} className="space-y-4">
                        <div className="bg-slate-50 p-6 rounded-xl border border-slate-100 text-center">
                            <p className="text-3xl font-bold text-slate-800">{g.stock}</p>
                            <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Units Remaining</p>
                        </div>
                        <button onClick={() => updateStock(g.id, g.stock)} className="w-full py-3 border-2 border-slate-100 text-slate-400 rounded-xl text-[10px] font-bold uppercase hover:bg-slate-50 hover:text-blue-600 transition-all">
                            Update Sticker Stock
                        </button>
                    </div>
                ))}
            </div>

            {/* SUB-MODULE: T-SHIRT SIZES */}
            <div className={`${cardClass} md:col-span-2`}>
                <label className={subLabel}>Premium T-Shirt Stock (By Size)</label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                    {gifts.filter(g => g.name.toLowerCase().includes('t-shirt')).map(g => (
                        <div key={g.id} className="flex flex-col">
                            <div className="flex-1 bg-slate-50 border border-slate-100 p-4 rounded-xl text-center group hover:border-blue-200 transition-all">
                                <p className="text-[10px] font-black text-blue-600 mb-1">{g.size}</p>
                                <p className="text-lg font-bold text-slate-800">{g.stock}</p>
                                <button onClick={() => updateStock(g.id, g.stock)} className="mt-2 opacity-0 group-hover:opacity-100 text-[9px] font-bold text-slate-400 underline transition-opacity">Edit</button>
                            </div>
                        </div>
                    ))}
                </div>
                <p className="mt-6 text-[10px] text-slate-400 italic">
                    * T-Shirt selection is automatically unlocked for "Full Set" orders at checkout.
                </p>
            </div>

        </div>
      </section>

    </div>
  )
}