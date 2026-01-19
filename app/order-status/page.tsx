"use client"
import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

function StatusContent() {
  const searchParams = useSearchParams()
  const orderId = searchParams.get('order_id')
  const [order, setOrder] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  // Currency Formatter
  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('en-MY', {
      style: 'currency',
      currency: 'MYR',
    }).format(amount);
  };

  useEffect(() => {
    if (orderId) {
      const fetchOrder = async () => {
        const { data } = await supabase
            .from('orders')
            .select('*')
            .eq('id', orderId)
            .single()
        setOrder(data)
        setLoading(false)
      }
      fetchOrder()
    }
  }, [orderId])

  if (loading) return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center text-slate-900">
        <div className="animate-spin h-10 w-10 border-t-2 border-[#e11d48] rounded-full mb-4"></div>
        <p className="font-black italic animate-pulse tracking-widest uppercase">Verifying Payment Details...</p>
    </div>
  )

  if (!order) return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 flex flex-col items-center justify-center p-10 text-center uppercase">
        <h1 className="text-2xl font-black mb-4 italic text-slate-300">Order Record Not Found</h1>
        <Link href="/products" className="text-[#f97316] font-bold underline tracking-widest">Return To Hub</Link>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans uppercase italic p-6 md:p-20">
      {/* Background decoration */}
      <div className="fixed inset-0 opacity-[0.4] pointer-events-none" 
           style={{backgroundImage: 'radial-gradient(#cbd5e1 1px, transparent 1px)', backgroundSize: '30px 30px'}}></div>

      <div className="max-w-4xl mx-auto bg-white border border-slate-200 p-8 md:p-16 shadow-[0_30px_60px_rgba(0,0,0,0.05)] rounded-3xl relative z-10 overflow-hidden">
        {/* Top Gradient Bar */}
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[#e11d48] to-[#f97316]"></div>
        
        <div className="flex flex-col md:flex-row justify-between items-start gap-8 mb-16">
            <div>
                <h1 className="text-5xl md:text-8xl font-black italic tracking-tighter leading-none mb-4 text-slate-900">
                    THANK <span className="text-[#e11d48]">YOU</span>
                </h1>
                <p className="text-slate-400 font-black tracking-[0.4em] text-[10px] italic">Your order is confirmed</p>
            </div>
            <div className="text-left md:text-right">
                <p className="text-slate-400 text-[10px] font-black tracking-widest mb-1 uppercase">Order Reference</p>
                <p className="font-black text-2xl italic tracking-tighter text-slate-900">#{order.id.slice(0,8).toUpperCase()}</p>
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-16 py-12 border-y border-slate-100">
            <div className="space-y-2">
                <p className="text-slate-400 text-[10px] font-black tracking-widest uppercase leading-none">Status</p>
                <p className={`font-black italic text-2xl uppercase ${order.status === 'PAID' ? 'text-green-500' : 'text-[#f97316] animate-pulse'}`}>
                    {order.status}
                </p>
            </div>
            <div className="space-y-2">
                <p className="text-slate-400 text-[10px] font-black tracking-widest uppercase leading-none">Amount Paid</p>
                <p className="font-black italic text-2xl text-slate-900 uppercase tracking-tighter">{formatMoney(order.total_amount)}</p>
            </div>
            <div className="space-y-2">
                <p className="text-slate-400 text-[10px] font-black tracking-widest uppercase leading-none">Shipment</p>
                {order.tracking_number ? (
                    <div className="flex flex-col">
                        <p className="font-black italic text-2xl text-[#e11d48] tracking-tighter">{order.tracking_number}</p>
                        <p className="text-[10px] text-[#f97316] font-bold uppercase mt-1">{order.courier_provider}</p>
                    </div>
                ) : (
                    <p className="font-black italic text-2xl text-slate-300 uppercase tracking-tighter">Preparing (HQ)</p>
                )}
            </div>
        </div>

        <div className="space-y-6 mb-16 not-italic">
            <h3 className="text-[10px] font-black tracking-[0.3em] text-slate-400 italic uppercase">Delivery Address</h3>
            <div className="bg-slate-50 p-8 rounded-2xl border border-slate-100 relative">
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-12 bg-[#e11d48] rounded-full"></div>
                <p className="text-slate-900 font-bold text-base leading-relaxed uppercase tracking-tight">
                    {order.customer_name}<br/>
                    {order.address}
                </p>
            </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-6">
            <Link href="/products" className="flex-1 bg-[#0f172a] text-white py-6 font-black text-center text-xs tracking-[0.2em] hover:bg-[#e11d48] transition-all italic rounded-xl shadow-xl shadow-slate-900/10">
                CONTINUE SHOPPING
            </Link>
            <button onClick={() => window.print()} className="flex-1 border-2 border-slate-100 text-slate-400 py-6 font-black text-xs tracking-[0.2em] hover:bg-slate-50 hover:text-slate-900 transition-all italic rounded-xl uppercase">
                Download Receipt
            </button>
        </div>
        
        <div className="mt-16 pt-8 border-t border-slate-50 text-center">
            <p className="text-[9px] text-slate-300 font-bold uppercase tracking-[0.4em] italic leading-relaxed">
                A digital receipt has been sent to your email by ToyyibPay. <br/>
                For support, quote reference #{order.id.slice(0,8).toUpperCase()}
            </p>
        </div>
      </div>

      <footer className="mt-20 text-center opacity-5 select-none pointer-events-none">
          <p className="text-[10vw] font-black italic tracking-tighter uppercase italic leading-none">CHASSIS PRO</p>
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