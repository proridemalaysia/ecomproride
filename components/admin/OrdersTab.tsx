"use client"
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function OrdersTab() {
  const [orders, setOrders] = useState<any[]>([])

  useEffect(() => {
    fetchOrders()
  }, [])

  async function fetchOrders() {
    const { data } = await supabase.from('orders').select('*').order('created_at', { ascending: false })
    setOrders(data || [])
  }

  async function handleManualVerify(id: string) {
    await supabase.from('orders').update({ status: 'PAID' }).eq('id', id)
    fetchOrders()
  }

  return (
    <div className="space-y-6">
      {orders.map(order => (
        <div key={order.id} className="bg-white border border-slate-100 p-8 rounded-3xl shadow-sm flex flex-col md:flex-row justify-between items-center gap-6 group hover:border-brand-orange transition-all">
          <div className="flex-1">
              <p className="text-brand-orange font-bold text-[10px] mb-2">#{order.id.slice(0,8).toUpperCase()}</p>
              <h3 className="text-lg font-bold text-slate-800">{order.customer_name}</h3>
              <p className="text-slate-400 text-xs mt-1">{order.email} • {order.whatsapp}</p>
          </div>
          <div className="text-right">
              <p className="text-2xl font-black text-slate-900">RM {order.total_amount.toFixed(2)}</p>
              <span className={`inline-block px-4 py-1 rounded-full text-[9px] font-black mt-2 uppercase ${order.status === 'PAID' ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-brand-orange'}`}>{order.status}</span>
          </div>
          <button onClick={() => handleManualVerify(order.id)} className="bg-slate-50 text-slate-400 p-4 rounded-2xl hover:bg-brand-orange hover:text-white transition-all text-[10px] font-bold">Verify Paid</button>
        </div>
      ))}
    </div>
  )
}