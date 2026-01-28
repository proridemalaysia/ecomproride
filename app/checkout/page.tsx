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
  
  // 1. FORM STATES
  const [customer, setCustomer] = useState({ name: '', email: '', whatsapp: '' })
  const [address, setAddress] = useState({ street: '', postcode: '', town: '', state: '' })
  const [townSuggestions, setTownSuggestions] = useState<string[]>([])
  
  // 2. SHIPPING STATES
  const [shippingData, setShippingData] = useState<{weightInfo: string, options: any[]}>({ weightInfo: '0.00', options: [] })
  const [selectedCourier, setSelectedCourier] = useState<any>(null)

  // 3. SAFE CURRENCY FORMATTER
  const formatMoney = (amount: any) => {
    const num = parseFloat(amount);
    if (isNaN(num)) return '0.00';
    return new Intl.NumberFormat('en-MY', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(num);
  };

  // 4. TOTALS CALCULATION
  const itemsTotal = cart.reduce((acc: number, item: any) => acc + (Number(item.price || 0) * item.qty), 0)
  const grandTotal = itemsTotal + Number(selectedCourier?.totalCost || 0)

  // 5. SMART LOGISTICS ENGINE
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

  // 6. TOYYIBPAY INTEGRATION & DATABASE SAVE
  const handlePlaceOrder = async () => {
    if (!customer.name || !customer.whatsapp || !customer.email || !selectedCourier || !address.state) {
      alert('Sila lengkapkan maklumat perhubungan dan penghantaran.'); 
      return;
    }

    setLoading(true)
    try {
      // SAVE ORDER TO DATABASE (Including items_json for the receipt)
      const { data: order, error: dbError } = await supabase.from('orders').insert([{
        customer_name: customer.name, 
        email: customer.email, 
        whatsapp: customer.whatsapp,
        address: `${address.street}, ${address.town}, ${address.postcode}, ${address.state}`,
        total_amount: grandTotal, 
        status: 'PENDING',
        items_json: cart // <--- THIS SAVES THE BOUGHT ITEMS
      }]).select().single()

      if (dbError) throw dbError
      
      // Request ToyyibPay URL
      const payResponse = await fetch('/api/checkout/toyyibpay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: order.id, total: grandTotal, customer, cart })
      })
      const payData = await payResponse.json()
      
      if (payData.url) { 
        clearCart(); 
        window.location.href = payData.url; 
      } else {
          throw new Error("ToyyibPay Error")
      }
    } catch (err: any) { 
        alert('Ralat: ' + err.message) 
    } finally { 
        setLoading(false) 
    }
  }

  const labelStyle = "text-[10px] font-bold text-slate-400 tracking-widest mb-1.5 block uppercase italic"
  const inputStyle = "w-full bg-white border border-slate-200 p-4 rounded-xl text-sm font-semibold text-slate-700 outline-none focus:border-[#f97316] transition-all shadow-sm"

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans pb-20 uppercase italic">
      <nav className="fixed top-0 w-full left-0 p-5 bg-white/80 backdrop-blur-md border-b border-slate-100 z-50">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
            <Link href="/" className="text-xl font-black italic tracking-tighter not-italic">CHASSIS <span className="text-[#e11d48]">PRO</span></Link>
            <Link href="/products" className="text-[10px] font-bold text-slate-400 hover:text-[#f97316]">← CONTINUE SHOPPING</Link>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto p-4 md:p-12 pt-28 md:pt-36 relative z-10">
        <header className="mb-12 border-l-8 border-[#e11d48] pl-6 not-italic">
            <h1 className="text-3xl md:text-5xl font-extrabold text-slate-800 tracking-tight">Checkout Portal</h1>
            <p className="text-slate-400 text-[10px] mt-2 font-bold tracking-widest uppercase italic">Secure multi-brand fulfillment</p>
        </header>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-start">
          
          <div className="lg:col-span-2 space-y-10">
            {/* 01. CONTACT INFO */}
            <section className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
                <h3 className="text-xs font-bold text-[#e11d48] tracking-widest mb-8 flex items-center gap-3">
                    <span className="bg-[#e11d48] text-white w-6 h-6 flex items-center justify-center not-italic rounded-full text-[10px] font-bold">01</span>
                    Contact Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 not-italic">
                    <div className="md:col-span-2">
                        <label className={labelStyle}>Full Name</label>
                        <input onChange={e => setCustomer({...customer, name: e.target.value})} className={inputStyle} />
                    </div>
                    <div>
                        <label className={labelStyle}>WhatsApp Number</label>
                        <input onChange={e => setCustomer({...customer, whatsapp: e.target.value})} className={inputStyle} placeholder="601..." />
                    </div>
                    <div>
                        <label className={labelStyle}>Email Address</label>
                        <input onChange={e => setCustomer({...customer, email: e.target.value})} className={inputStyle} />
                    </div>
                </div>
            </section>

            {/* 02. SHIPPING ADDRESS */}
            <section className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
                <h3 className="text-xs font-bold text-[#e11d48] tracking-widest mb-8 flex items-center gap-3">
                    <span className="bg-[#e11d48] text-white w-6 h-6 flex items-center justify-center not-italic rounded-full text-[10px] font-bold">02</span>
                    Shipping Destination
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 not-italic">
                    <div className="md:col-span-2">
                        <label className={labelStyle}>Street Address</label>
                        <input onChange={e => setAddress({...address, street: e.target.value})} className={inputStyle} />
                    </div>
                    <div>
                        <label className={labelStyle}>Postcode</label>
                        <input value={address.postcode} onChange={e => setAddress({...address, postcode: e.target.value})} className={`${inputStyle} text-[#f97316] text-xl font-black`} maxLength={5} />
                    </div>
                    <div>
                        <label className={labelStyle}>Town / City</label>
                        {townSuggestions.length > 0 ? (
                            <select value={address.town} onChange={e => setAddress({...address, town: e.target.value})} className={inputStyle}>
                                {townSuggestions.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                        ) : (
                            <input value={address.town} onChange={e => setAddress({...address, town: e.target.value})} className={inputStyle} />
                        )}
                    </div>
                    <div className="md:col-span-2">
                        <label className={labelStyle}>State (Auto-detected)</label>
                        <input value={address.state} readOnly className="w-full bg-slate-50 border border-slate-100 p-4 rounded-xl text-slate-400 text-xs font-bold italic" />
                    </div>
                </div>
            </section>

            {/* 03. COURIER */}
            <section className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
                <div className="flex justify-between items-center mb-8 border-b border-slate-50 pb-4">
                    <h3 className="text-xs font-bold text-[#e11d48] tracking-widest">03. Courier selection</h3>
                    <span className="text-[10px] font-bold text-[#f97316] bg-orange-50 px-3 py-1 rounded-full">Chargeable: {shippingData.weightInfo} KG</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 not-italic">
                    {shippingData.options.map(c => (
                        <div key={c.name} onClick={() => setSelectedCourier(c)} className={`p-6 border-2 rounded-2xl cursor-pointer transition-all ${selectedCourier?.name === c.name ? 'border-[#f97316] bg-orange-50 shadow-md scale-[1.02]' : 'border-slate-100'}`}>
                            <p className="font-bold text-[10px] text-slate-400 uppercase">{c.name}</p>
                            <p className="font-black text-2xl text-slate-900 mt-2">RM {formatMoney(c.totalCost)}</p>
                            <p className="text-[9px] text-slate-400 font-bold mt-1 uppercase italic">{c.time}</p>
                        </div>
                    ))}
                </div>
            </section>
          </div>

          {/* RIGHT: EDITABLE ORDER SUMMARY */}
          <div className="lg:sticky lg:top-32 h-fit">
            <div className="bg-white border border-slate-100 p-8 rounded-[2rem] shadow-2xl shadow-slate-200/60 space-y-8 relative overflow-hidden not-italic">
              <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-[#e11d48] to-[#f97316]"></div>
              <h2 className="text-xl font-black border-b border-slate-100 pb-4 tracking-tighter uppercase text-slate-900 italic">Order Summary</h2>
              
              <div className="space-y-6 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {cart.map((item: any) => (
                    <div key={item.id} className="bg-slate-50 p-5 rounded-2xl border border-slate-100 relative group">
                        <div className="flex justify-between items-start mb-4 gap-4">
                            <div className="w-full">
                                <p className="font-black text-slate-900 text-xs leading-tight uppercase italic">{item.brand_name} - {item.name_en}</p>
                                <p className="text-slate-400 text-[9px] mt-1 font-bold italic tracking-widest">RM {formatMoney(item.price)} / UNIT</p>
                            </div>
                            <button onClick={() => removeItem(item.id)} className="text-slate-200 hover:text-[#e11d48] transition-all">✕</button>
                        </div>
                        
                        <div className="flex items-center justify-between border-t border-slate-200 pt-4">
                            <div className="flex items-center bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
                                <button onClick={() => updateQty(item.id, -1)} className="px-4 py-2 hover:bg-[#e11d48] hover:text-white transition-all font-black text-lg">-</button>
                                <span className="px-5 py-2 text-sm font-black text-slate-900">{item.qty}</span>
                                <button onClick={() => updateQty(item.id, 1)} className="px-4 py-2 hover:bg-[#e11d48] hover:text-white transition-all font-black text-lg">+</button>
                            </div>
                            <span className="font-black text-slate-900 text-sm tracking-tighter">RM {formatMoney(Number(item.price || 0) * item.qty)}</span>
                        </div>
                    </div>
                ))}
              </div>

              <div className="space-y-4 pt-6 border-t-2 border-slate-100">
                <div className="flex justify-between text-xs font-black text-slate-400 italic">
                    <span>Subtotal</span>
                    <span className="text-slate-900">RM {formatMoney(itemsTotal)}</span>
                </div>
                <div className="flex justify-between text-xs font-black text-slate-400 italic">
                    <span>Courier ({shippingData.weightInfo} KG)</span>
                    <span className="text-[#f97316]">{selectedCourier ? `RM ${formatMoney(selectedCourier.totalCost)}` : '--'}</span>
                </div>
                
                <div className="pt-8 mt-6 border-t-2 border-slate-900">
                    <p className="font-black text-[10px] italic opacity-60 uppercase mb-2 tracking-[0.2em]">Grand Total Payment</p>
                    <div className="text-4xl md:text-5xl font-black text-[#e11d48] tracking-tighter italic leading-none truncate">
                        RM {formatMoney(grandTotal)}
                    </div>
                </div>
              </div>

              <button 
                onClick={handlePlaceOrder} 
                disabled={loading || cart.length === 0 || !selectedCourier}
                className="w-full bg-slate-900 text-white py-7 font-black uppercase italic tracking-[0.2em] hover:bg-[#e11d48] transition-all shadow-xl rounded-2xl active:scale-95 disabled:opacity-20"
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