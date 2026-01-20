"use client"
import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

function StatusContent() {
  const searchParams = useSearchParams()
  
  // Parameters returned by ToyyibPay
  const orderId = searchParams.get('order_id')
  const statusId = searchParams.get('status_id') // '1' = Success, '2' = Pending, '3' = Fail

  const [order, setOrder] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('en-MY', {
      style: 'currency',
      currency: 'MYR',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  useEffect(() => {
    async function verifyAndFetch() {
      if (!orderId) return;

      // 1. FAIL-SAFE: If URL parameters confirm success, update database immediately
      // This ensures the status turns to PAID even if the webhook is blocked by dev firewalls
      if (statusId === '1') {
        await supabase
          .from('orders')
          .update({ status: 'PAID' })
          .eq('id', orderId);
      }

      // 2. Fetch the latest record from Supabase
      const { data } = await supabase
          .from('orders')
          .select('*')
          .eq('id', orderId)
          .single()
      
      setOrder(data)
      setLoading(false)
    }

    verifyAndFetch()
  }, [orderId, statusId])

  if (loading) return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center">
        <div className="animate-spin h-10 w-10 border-t-2 border-[#e11d48] rounded-full mb-4"></div>
        <p className="font-bold text-slate-400 italic animate-pulse uppercase tracking-widest text-xs">Syncing Transaction Details...</p>
    </div>
  )

  if (!order) return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 flex flex-col items-center justify-center p-10 text-center uppercase">
        <h1 className="text-2xl font-black mb-4 italic text-slate-200">No Record Found</h1>
        <Link href="/products" className="text-brand-orange font-bold underline italic tracking-widest text-sm">Return To Hub</Link>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans p-6 md:p-20">
      {/* Subtle background decoration */}
      <div className="fixed inset-0 opacity-[0.4] pointer-events-none" 
           style={{backgroundImage: 'radial-gradient(#cbd5e1 1px, transparent 1px)', backgroundSize: '30px 30px'}}></div>

      <div className="max-w-4xl mx-auto bg-white border border-slate-200 p-8 md:p-16 shadow-[0_30px_60px_rgba(0,0,0,0.05)] rounded-[2.5rem] relative z-10 overflow-hidden">
        {/* Brand Accent Bar */}
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-[#e11d48] to-[#f97316]"></div>
        
        <div className="flex flex-col md:flex-row justify-between items-start gap-8 mb-16">
            <div>
                <h1 className="text-5xl md:text-8xl font-black italic tracking-tighter leading-none mb-4 text-slate-900 uppercase">
                    {order.status === 'PAID' ? 'Success' : 'Pending'}
                </h1>
                <p className="text-slate-400 font-bold tracking-[0.4em] text-[10px] uppercase italic">
                    {order.status === 'PAID' ? 'Your order is confirmed' : 'Transaction Processing'}
                </p>
            </div>
            <div className="text-left md:text-right">
                <p className="text-slate-400 text-[10px] font-bold tracking-widest mb-1 uppercase italic">Order Reference</p>
                <p className="font-black text-2xl italic tracking-tighter text-slate-900">#{order.id.slice(0,8).toUpperCase()}</p>
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-16 py-12 border-y border-slate-50">
            <div className="space-y-2">
                <p className="text-slate-400 text-[10px] font-bold tracking-widest uppercase leading-none italic">Payment</p>
                <p className={`font-black italic text-2xl uppercase ${order.status === 'PAID' ? 'text-green-500' : 'text-brand-orange animate-pulse'}`}>
                    {order.status}
                </p>
            </div>
            <div className="space-y-2">
                <p className="text-slate-400 text-[10px] font-bold tracking-widest uppercase leading-none italic">Total Paid</p>
                <p className="font-black italic text-2xl text-slate-900 uppercase tracking-tighter">{formatMoney(order.total_amount)}</p>
            </div>
            <div className="space-y-2">
                <p className="text-slate-400 text-[10px] font-bold tracking-widest uppercase leading-none italic">Shipment</p>
                {order.tracking_number ? (
                    <div className="flex flex-col">
                        <p className="font-black italic text-2xl text-[#e11d48] tracking-tighter">{order.tracking_number}</p>
                        <p className="text-[10px] text-brand-orange font-bold uppercase mt-1 italic">{order.courier_provider}</p>
                    </div>
                ) : (
                    <p className="font-black italic text-2xl text-slate-300 uppercase tracking-tighter">Preparing (HQ)</p>
                )}
            </div>
        </div>

        <div className="space-y-6 mb-16">
            <h3 className="text-[10px] font-bold tracking-[0.3em] text-slate-400 uppercase italic">Delivery Address</h3>
            <div className="bg-slate-50/50 p-8 rounded-2xl border border-slate-100">
                <p className="text-slate-900 font-bold text-base leading-relaxed uppercase tracking-tight italic">
                    {order.customer_name}<br/>
                    {order.address}
                </p>
            </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-6">
            <Link href="/products" className="flex-1 bg-slate-900 text-white py-6 font-bold text-center text-xs tracking-[0.2em] hover:bg-[#e11d48] transition-all italic rounded-xl shadow-xl shadow-slate-900/10 uppercase">
                Continue Shopping
            </Link>
            <button onClick={() => window.print()} className="flex-1 border-2 border-slate-100 text-slate-400 py-6 font-bold text-xs tracking-[0.2em] hover:bg-slate-50 hover:text-slate-900 transition-all italic rounded-xl uppercase">
                Download Receipt
            </button>
        </div>
        
        <div className="mt-16 pt-8 border-t border-slate-50 text-center">
            <p className="text-[9px] text-slate-300 font-bold uppercase tracking-[0.4em] italic leading-relaxed">
                A digital copy has been logged in our hub. <br/>
                For support, contact admin via WhatsApp with reference #{order.id.slice(0,8).toUpperCase()}
            </p>
        </div>
      </div>

      <footer className="mt-20 text-center opacity-5 select-none pointer-events-none uppercase">
          <p className="text-[10vw] font-black italic tracking-tighter leading-none">Chassis Pro</p>
      </footer>
    </div>
  )
}

export default function OrderStatusPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#f8fafc]"></div>}>
      <StatusContent />
    </Suspense>
  )
}