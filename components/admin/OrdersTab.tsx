"use client"
import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

export default function OrdersTab() {
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const fetchOrders = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase.from('orders').select('*').order('created_at', { ascending: false })
    setOrders(data || [])
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchOrders()
  }, [fetchOrders])

  // 1. Logic to manually verify payment (if webhook fails)
  async function handleManualVerify(id: string) {
    const { error } = await supabase.from('orders').update({ status: 'PAID' }).eq('id', id)
    if (!error) fetchOrders()
  }

  // 2. Logic to save tracking and trigger Email Notification
  async function handleShipment(order: any) {
    const tracking = (document.getElementById(`track-${order.id}`) as HTMLInputElement).value
    const courier = (document.getElementById(`courier-${order.id}`) as HTMLSelectElement).value

    if (!tracking) return alert("Please enter a tracking number.")

    // Update Database
    const { error } = await supabase.from('orders')
        .update({ 
            tracking_number: tracking, 
            courier_provider: courier, 
            status: 'SHIPPED' 
        })
        .eq('id', order.id)

    if (!error) {
        // GENERATE EMAIL CONTENT (In-House Bridge)
        const subject = encodeURIComponent(`Shipment Update: Your order #${order.id.slice(0,5)} is on the way!`);
        const body = encodeURIComponent(
            `Hi ${order.customer_name},\n\n` +
            `Great news! Your order from Chassis Pro has been shipped.\n\n` +
            `Order ID: #${order.id.slice(0,8).toUpperCase()}\n` +
            `Courier: ${courier}\n` +
            `Tracking Number: ${tracking}\n\n` +
            `You can track your parcel on the ${courier} official website. Please allow 24 hours for the status to update.\n\n` +
            `Thank you for your support!\n` +
            `Chassis Pro Malaysia Team`
        );

        // Open user's email app (Gmail/Outlook)
        window.location.href = `mailto:${order.email}?subject=${subject}&body=${body}`;
        
        fetchOrders();
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center px-2">
        <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Order Management</h2>
        <button onClick={fetchOrders} className="text-xs font-bold text-blue-600 hover:underline uppercase">Refresh List</button>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 border-b">
                <tr className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    <th className="px-8 py-5">Order ID</th>
                    <th className="px-8 py-5">Customer Details</th>
                    <th className="px-8 py-5 text-center">Payment</th>
                    <th className="px-8 py-5 text-right">Amount</th>
                    <th className="px-8 py-5 text-right">Shipment Action</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
                {orders.map(order => (
                    <tr key={order.id} className="hover:bg-slate-50/50 transition-all">
                        <td className="px-8 py-6">
                            <span className="font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-lg text-xs tracking-tighter">
                                #{order.id.slice(0,8).toUpperCase()}
                            </span>
                        </td>
                        <td className="px-8 py-6">
                            <p className="font-bold text-slate-700 text-sm">{order.customer_name}</p>
                            <p className="text-[10px] text-slate-400 font-medium">{order.email} • {order.whatsapp}</p>
                        </td>
                        <td className="px-8 py-6 text-center">
                            <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase ${order.status === 'PAID' ? 'bg-green-100 text-green-600' : order.status === 'SHIPPED' ? 'bg-slate-100 text-slate-400' : 'bg-orange-100 text-brand-orange animate-pulse'}`}>
                                {order.status}
                            </span>
                        </td>
                        <td className="px-8 py-6 text-right font-black text-slate-700 text-sm">
                            RM {order.total_amount.toFixed(2)}
                        </td>
                        <td className="px-8 py-6 text-right">
                            {order.status === 'PENDING' && (
                                <button onClick={() => handleManualVerify(order.id)} className="text-[10px] font-bold text-blue-600 hover:underline">Verify Paid</button>
                            )}
                            
                            {order.status === 'PAID' && (
                                <div className="flex flex-col md:flex-row gap-2 justify-end items-center">
                                    <input id={`track-${order.id}`} className="bg-slate-100 border-none p-2 text-[10px] font-bold rounded w-32 outline-none focus:ring-1 focus:ring-blue-500" placeholder="TRACKING NO" />
                                    <select id={`courier-${order.id}`} className="bg-slate-100 border-none p-2 text-[10px] font-bold rounded outline-none">
                                        <option value="J&T Express">J&T</option>
                                        <option value="PosLaju">PosLaju</option>
                                        <option value="NinjaVan">NinjaVan</option>
                                    </select>
                                    <button onClick={() => handleShipment(order)} className="bg-blue-600 text-white px-4 py-2 rounded font-bold text-[9px] hover:bg-slate-900 transition-all">SHIP & EMAIL</button>
                                </div>
                            )}

                            {order.status === 'SHIPPED' && (
                                <div className="text-right">
                                    <p className="text-[9px] font-bold text-slate-400 uppercase">{order.courier_provider}</p>
                                    <p className="font-black text-xs text-slate-700 tracking-widest">{order.tracking_number}</p>
                                </div>
                            )}
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
        {orders.length === 0 && !loading && (
            <div className="p-20 text-center text-slate-300 text-sm italic">No orders received yet.</div>
        )}
      </div>
    </div>
  )
}