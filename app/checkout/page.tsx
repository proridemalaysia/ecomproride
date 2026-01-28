"use client"
import { useCart } from '@/context/CartContext'
import { useState, useEffect, useCallback } from 'react'
import { calculateShipping } from '@/lib/shipping'
import { getStateByPostcode, commonTowns } from '@/lib/postcodes'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

export default function CheckoutPage() {
  const { cart, clearCart, updateQty, removeItem } = useCart()
  const [loading, setLoading] = useState(false)
  
  // Form States
  const [customer, setCustomer] = useState({ name: '', email: '', whatsapp: '' })
  const [address, setAddress] = useState({ street: '', postcode: '', town: '', state: '' })
  const [townSuggestions, setTownSuggestions] = useState<string[]>([])
  
  // Shipping States
  const [shippingData, setShippingData] = useState<{weightInfo: string, options: any[]}>({ weightInfo: '0.00', options: [] })
  const [selectedCourier, setSelectedCourier] = useState<any>(null)

  // Currency Formatter
  const formatMoney = (amount: any) => {
    const num = parseFloat(amount);
    if (isNaN(num)) return '0.00';
    return new Intl.NumberFormat('en-MY', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(num);
  };

  const itemsTotal = cart.reduce((acc: number, item: any) => acc + (Number(item.price || 0) * item.qty), 0)
  const grandTotal = itemsTotal + Number(selectedCourier?.totalCost || 0)

  // Logistics logic
  const updateLogistics = useCallback(() => {
    if (address.postcode.length === 5 && cart.length > 0) {
      const detectedState = getStateByPostcode(address.postcode)
      setAddress(prev => ({ ...prev, state: detectedState }))
      
      const towns = commonTowns[address.postcode] || []
      setTownSuggestions(towns)
      if (towns.length > 0 && !address.town) setAddress(prev => ({ ...prev, town: towns[0] }))
      
      const result = calculateShipping(address.postcode, cart)
      setShippingData(result)
      if (result.options.length > 0) setSelectedCourier(result.options[0])
    } else {
        setShippingData({ weightInfo: '0.00', options: [] })
        setSelectedCourier(null)
    }
  }, [address.postcode, cart])

  useEffect(() => {
    updateLogistics()
  }, [updateLogistics])

  const handlePlaceOrder = async () => {
    if (!customer.name || !customer.whatsapp || !customer.email || !selectedCourier || !address.state) {
      alert('Sila lengkapkan maklumat perhubungan dan penghantaran.'); return;
    }
    setLoading(true)
    try {
      const { data: order, error: dbError } = await supabase.from('orders').insert([{
        customer_name: customer.name, email: customer.email, whatsapp: customer.whatsapp,
        address: `${address.street}, ${address.town}, ${address.postcode}, ${address.state}`,
        total_amount: grandTotal, status: 'PENDING'
      }]).select().single()

      if (dbError) throw dbError
      
      const payResponse = await fetch('/api/checkout/toyyibpay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: order.id, total: grandTotal, customer, cart })
      })
      const payData = await payResponse.json()
      if (payData.url) { clearCart(); window.location.href = payData.url; }
    } catch (err: any) { alert(err.message) } finally { setLoading(false) }
  }

  const labelStyle = "text-[10px] font-bold text-slate-400 tracking-widest mb-1.5 block uppercase"
  const inputStyle = "w-full bg-white border border-slate-200 p-4 rounded-xl text-sm font-semibold text-slate-700 outline-none focus:border-brand-orange transition-all"

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans pb-20">
      <nav className="fixed top-0 w-full left-0 p-5 bg-white/80 backdrop-blur-md border-b border-slate-100 z-50">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
            <Link href="/" className="text-xl font-black tracking-tight text-slate-800 uppercase">CHASSIS <span className="text-[#e11d48]">PRO</span></Link>
            <Link href="/products" className="text-[10px] font-bold text-slate-400 hover:text-brand-orange transition-colors uppercase tracking-widest">← Back to shop</Link>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto p-4 md:p-12 pt-28 md:pt-36 relative z-10">
        <header className="mb-12 border-l-8 border-[#e11d48] pl-6">
            <h1 className="text-3xl md:text-5xl font-extrabold text-slate-800 tracking-tight">Checkout Portal</h1>
            <p className="text-slate-400 text-[10px] mt-2 font-bold tracking-widest uppercase italic">Secure multi-brand fulfillment</p>
        </header>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-start">
          
          <div className="lg:col-span-2 space-y-10">
            {/* 01. CONTACT */}
            <section className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
                <h3 className="text-xs font-bold text-[#e11d48] tracking-widest mb-8 flex items-center gap-3 uppercase italic">
                    <span className="bg-[#e11d48] text-white w-6 h-6 flex items-center justify-center not-italic rounded-full text-[10px] font-bold">01</span>
                    Contact Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="md:col-span-2">
                        <label className={labelStyle}>Full Name</label>
                        <input onChange={e => setCustomer({...customer, name: e.target.value})} className={inputStyle} placeholder="Mohammad Ali" />
                    </div>
                    <div>
                        <label className={labelStyle}>WhatsApp Number</label>
                        <input onChange={e => setCustomer({...customer, whatsapp: e.target.value})} className={inputStyle} placeholder="60123456789" />
                    </div>
                    <div>
                        <label className={labelStyle}>Email Address</label>
                        <input onChange={e => setCustomer({...customer, email: e.target.value})} className={inputStyle} placeholder="ali@email.com" />
                    </div>
                </div>
            </section>

            {/* 02. ADDRESS */}
            <section className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
                <h3 className="text-xs font-bold text-[#e11d48] tracking-widest mb-8 flex items-center gap-3 uppercase italic">
                    <span className="bg-[#e11d48] text-white w-6 h-6 flex items-center justify-center not-italic rounded-full text-[10px] font-bold">02</span>
                    Shipping Destination
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="md:col-span-2">
                        <label className={labelStyle}>Street Address</label>
                        <input onChange={e => setAddress({...address, street: e.target.value})} className={inputStyle} placeholder="Unit No, Street name" />
                    </div>
                    <div>
                        <label className={labelStyle}>Postcode</label>
                        <input value={address.postcode} onChange={e => setAddress({...address, postcode: e.target.value})} className={`${inputStyle} text-brand-orange text-lg font-bold`} placeholder="43000" maxLength={5} />
                    </div>
                    <div>
                        <label className={labelStyle}>Town / City</label>
                        <input value={address.town} onChange={e => setAddress({...address, town: e.target.value})} className={inputStyle} />
                    </div>
                    <div className="md:col-span-2">
                        <label className={labelStyle}>State</label>
                        <input value={address.state} readOnly className="w-full bg-slate-50 border border-slate-100 p-4 rounded-xl text-slate-400 text-xs font-bold italic" />
                    </div>
                </div>
            </section>

            {/* 03. COURIER */}
            <section className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
                <div className="flex justify-between items-center mb-8 border-b border-slate-50 pb-4">
                    <h3 className="text-xs font-bold text-[#e11d48] tracking-widest uppercase italic">03. Courier selection</h3>
                    <span className="text-[10px] font-bold text-brand-orange bg-orange-50 px-3 py-1 rounded-full border border-orange-100">Billable Weight: {shippingData.weightInfo} KG</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {shippingData.options.map(c => (
                        <div key={c.name} onClick={() => setSelectedCourier(c)} className={`p-6 border-2 rounded-2xl cursor-pointer transition-all ${selectedCourier?.name === c.name ? 'border-brand-orange bg-orange-50/30' : 'border-slate-50 bg-white hover:border-slate-200'}`}>
                            <p className="font-bold text-[10px] text-slate-400 uppercase tracking-tight leading-none mb-2">{c.name}</p>
                            <p className="font-black text-xl text-slate-900">RM {formatMoney(c.totalCost)}</p>
                            <p className="text-[9px] text-slate-400 font-medium mt-1 uppercase">{c.time}</p>
                        </div>
                    ))}
                    {shippingData.options.length === 0 && <p className="col-span-3 py-10 text-center text-slate-300 text-[10px] font-bold italic">Enter postcode to calculate shipping</p>}
                </div>
            </section>
          </div>

          {/* RIGHT: EDITABLE ORDER SUMMARY */}
          <div className="lg:sticky lg:top-32 h-fit">
            <div className="bg-white border border-slate-200 p-8 rounded-[2rem] shadow-2xl shadow-slate-200/50 space-y-8 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-[#e11d48] to-[#f97316]"></div>
              <h2 className="text-xl font-bold border-b border-slate-100 pb-4 tracking-tighter uppercase text-slate-900 italic">Order Summary</h2>
              
              <div className="space-y-6 max-h-[450px] overflow-y-auto pr-2 custom-scrollbar">
                {cart.map((item: any) => (
                    <div key={item.id} className="bg-slate-50 p-5 rounded-2xl border border-slate-100 relative group">
                        <div className="flex justify-between items-start gap-4">
                            <div className="flex-1">
                                <p className="font-bold text-slate-900 text-sm leading-tight italic">{item.name_en}</p>
                                <p className="text-slate-400 text-[9px] mt-1 font-bold tracking-widest uppercase leading-none">{item.brand_name}</p>
                            </div>
                            <button onClick={() => removeItem(item.id)} className="text-slate-300 hover:text-[#e11d48] transition-colors p-1">✕</button>
                        </div>
                        
                        <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-200">
                            <div className="flex items-center bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
                                <button onClick={() => updateQty(item.id, -1)} className="px-3 py-1 hover:bg-slate-100 text-slate-500 font-bold transition-all">-</button>
                                <span className="px-4 py-1 text-xs font-bold text-slate-900 border-x border-slate-100">{item.qty}</span>
                                <button onClick={() => updateQty(item.id, 1)} className="px-3 py-1 hover:bg-slate-100 text-slate-500 font-bold transition-all">+</button>
                            </div>
                            <span className="font-black text-slate-900 text-sm">RM {formatMoney(Number(item.price || 0) * item.qty)}</span>
                        </div>
                    </div>
                ))}
                {cart.length === 0 && <p className="text-center py-10 text-slate-300 font-bold text-[10px] uppercase tracking-widest">Your cart is empty</p>}
              </div>

              <div className="space-y-3 pt-6 border-t border-slate-100">
                <div className="flex justify-between text-xs font-bold text-slate-400 uppercase italic">
                    <span>Subtotal</span>
                    <span className="text-slate-900">RM {formatMoney(itemsTotal)}</span>
                </div>
                <div className="flex justify-between text-xs font-bold text-slate-400 uppercase italic">
                    <span>Delivery ({shippingData.weightInfo} KG)</span>
                    <span className="text-brand-orange">{selectedCourier ? `RM ${formatMoney(selectedCourier.totalCost)}` : '--'}</span>
                </div>
                <div className="pt-8 mt-4 border-t-2 border-slate-900 flex justify-between items-center gap-4">
                    <span className="font-bold text-xs text-slate-400 uppercase tracking-widest">Final Total</span>
                    <span className="text-2xl md:text-3xl font-black text-[#e11d48] tracking-tighter italic leading-none">
                        RM {formatMoney(grandTotal)}
                    </span>
                </div>
              </div>

              <button 
                onClick={handlePlaceOrder} 
                disabled={loading || cart.length === 0 || !selectedCourier}
                className="w-full bg-[#0f172a] text-white py-7 font-bold uppercase italic tracking-widest hover:bg-[#e11d48] transition-all shadow-xl shadow-red-500/10 rounded-2xl text-xs active:scale-95 disabled:opacity-30"
              >
                {loading ? 'PROCESSING...' : 'PLACE ORDER & PAY'}
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}