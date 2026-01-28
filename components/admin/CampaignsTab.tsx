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
    const amount = prompt("Enter Discount RM:");
    if (code && amount) {
        await supabase.from('vouchers').insert([{ code: code.toUpperCase(), discount_amount: parseFloat(amount) }]);
        fetchData();
    }
  }

  const updateGiftStock = async (id: number, current: number) => {
    const next = prompt("Update stock count:", current.toString());
    if (next) {
        await supabase.from('free_gifts').update({ stock: parseInt(next) }).eq('id', id);
        fetchData();
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 animate-in fade-in duration-500">
      
      {/* Vouchers Section */}
      <section className="space-y-6">
        <div className="flex justify-between items-center px-2">
            <h2 className="text-xl font-bold text-slate-800">Discount Vouchers</h2>
            <button onClick={handleCreateVoucher} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-[10px] font-bold uppercase">Create Code</button>
        </div>
        <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-4">
            {vouchers.map(v => (
                <div key={v.id} className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <div><p className="font-black text-blue-600 tracking-widest">{v.code}</p><p className="text-[10px] text-slate-400 font-bold">Value: RM {v.discount_amount}</p></div>
                    <button onClick={async () => { await supabase.from('vouchers').delete().eq('id', v.id); fetchData(); }} className="text-xs text-slate-300 hover:text-red-500 font-bold">Remove</button>
                </div>
            ))}
        </div>
      </section>

      {/* Gifts Section */}
      <section className="space-y-6">
        <h2 className="text-xl font-bold text-slate-800 px-2">Free Gift Inventory</h2>
        <div className="bg-white border border-slate-200 rounded-3xl p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {gifts.map(g => (
                    <div key={g.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <p className="text-[10px] font-bold text-slate-400 uppercase">{g.name}</p>
                        <p className="font-black text-slate-800 text-sm">{g.size || 'STICKER'}</p>
                        <div className="mt-3 flex justify-between items-center border-t pt-2 border-slate-200">
                            <span className="text-[10px] font-black text-blue-600">{g.stock} PCS</span>
                            <button onClick={() => updateGiftStock(g.id, g.stock)} className="text-[10px] font-bold text-slate-400 underline">Sync Stock</button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
      </section>

    </div>
  )
}