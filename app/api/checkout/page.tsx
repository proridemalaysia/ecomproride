"use client"
import { useCart } from '@/context/CartContext'
import { useState, useEffect } from 'react'
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
  const [shippingData, setShippingData] = useState<{weightInfo: string, options: any[]}>({ weightInfo: '0', options: [] })
  const [selectedCourier, setSelectedCourier] = useState<any>(null)

  // 3. CURRENCY FORMATTER
  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('en-MY', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const itemsTotal = cart.reduce((acc: number, item: any) => acc + (item.price * item.qty), 0)
  const grandTotal = itemsTotal + (selectedCourier?.totalCost || 0)

  // 4. SMART LOOKUP (Postcode -> State/Town/Shipping)
  useEffect(() => {
    if (address.postcode.length === 5) {
      // Auto-detect State
      const detectedState = getStateByPostcode(address.postcode)
      setAddress(prev => ({ ...prev, state: detectedState }))

      // Auto-suggest Towns
      const towns = commonTowns[address.postcode] || []
      setTownSuggestions(towns)
      if (towns.length > 0 && !address.town) setAddress(prev => ({ ...prev, town: towns[0] }))

      // Calculate Weight & Shipping
      const result = calculateShipping(address.postcode, cart)
      setShippingData(result)
      if (result.options.length > 0) setSelectedCourier(result.options[0])
    }
  }, [address.postcode, cart])

  // 5. FINAL PAYMENT ACTION (TOYYIBPAY)
  const handlePlaceOrder = async () => {
    if (!customer.name || !customer.whatsapp || !customer.email || !selectedCourier || !address.state) {
      alert('Sila lengkapkan maklumat perhubungan dan alamat penghantaran.')
      return
    }

    setLoading(true)
    try {
      // A. SAVE ORDER TO SUPABASE (Status: PENDING)
      const { data: order, error: dbError } = await supabase.from('orders').insert([{
        customer_name: customer.name,
        email: customer.email,
        whatsapp: customer.whatsapp,
        address: `${address.street}, ${address.town}, ${address.postcode}, ${address.state}`,
        total_amount: grandTotal,
        status: 'PENDING'
      }]).select().single()

      if (dbError) throw dbError

      // B. TRIGGER STAGE 1 EMAIL (Order Received)
      await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer,
          address,
          cart,
          shipping: selectedCourier.totalCost,
          total: grandTotal,
          orderId: order.id
        })
      })

      // C. CREATE TOYYIBPAY BILL & GET REDIRECT URL
      const payResponse = await fetch('/api/checkout/toyyibpay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: order.id,
          total: grandTotal,
          customer: {
            name: customer.name,
            email: customer.email,
            whatsapp: customer.whatsapp
          }
        })
      })

      const payData = await payResponse.json()

      if (payData.url) {
        // D. REDIRECT TO PAYMENT GATEWAY
        clearCart()
        window.location.href = payData.url
      } else {
        throw new Error('Sistem pembayaran ToyyibPay tidak dapat dihubungi.')
      }

    } catch (err: any) {
      alert('Ralat: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-black text-white p-4 md:p-12 font-sans uppercase">
      <div className="max-w-7xl mx-auto">
        <Link href="/products" className="text-zinc-600 text-xs font-bold tracking-widest hover:text-brand-red transition-all">← Back To Hub</Link>
        <h1 className="text-4xl md:text-6xl font-black italic mt-4 mb-12 border-l-8 border-brand-red pl-6 tracking-tighter">
            CHASSIS <span className="text-brand-red font-black">PRO</span> CHECKOUT
        </h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          
          {/* LEFT: FORM FIELDS */}
          <div className="lg:col-span-2 space-y-12">
            
            {/* 01. CONTACT INFO */}
            <section className="space-y-6">
              <h3 className="text-brand-red font-black text-sm tracking-widest italic uppercase">01. Contact Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input onChange={e => setCustomer({...customer, name: e.target.value})} className="md:col-span-2 bg-zinc-900 border border-zinc-800 p-5 outline-none focus:border-brand-red font-bold text-base" placeholder="CUSTOMER FULL NAME" />
                <input onChange={e => setCustomer({...customer, whatsapp: e.target.value})} className="bg-zinc-900 border border-zinc-800 p-5 outline-none focus:border-brand-red font-bold text-base" placeholder="WHATSAPP NO (601...)" />
                <input onChange={e => setCustomer({...customer, email: e.target.value})} className="bg-zinc-900 border border-zinc-800 p-5 outline-none focus:border-brand-red font-bold text-base" placeholder="EMAIL ADDRESS" />
              </div>
            </section>

            {/* 02. ADDRESS */}
            <section className="space-y-6">
              <h3 className="text-brand-red font-black text-sm tracking-widest italic uppercase">02. Shipping Destination</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input onChange={e => setAddress({...address, street: e.target.value})} className="md:col-span-2 bg-zinc-900 border border-zinc-800 p-5 outline-none focus:border-brand-red text-base" placeholder="UNIT / STREET ADDRESS" />
                <div className="space-y-2">
                  <label className="text-xs text-zinc-500 font-bold tracking-widest">POSTCODE</label>
                  <input value={address.postcode} onChange={e => setAddress({...address, postcode: e.target.value})} className="w-full bg-zinc-900 border border-zinc-800 p-5 outline-none focus:border-brand-red font-black text-brand-red text-2xl tracking-[0.2em]" placeholder="43000" maxLength={5} />
                </div>
                <div className="space-y-2">
                  <label className="text-xs text-zinc-500 font-bold tracking-widest">TOWN / CITY</label>
                  {townSuggestions.length > 0 ? (
                    <select value={address.town} onChange={e => setAddress({...address, town: e.target.value})} className="w-full bg-zinc-900 border border-zinc-800 p-[22px] outline-none focus:border-brand-red text-base font-bold">
                      {townSuggestions.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  ) : (
                    <input value={address.town} onChange={e => setAddress({...address, town: e.target.value})} className="w-full bg-zinc-900 border border-zinc-800 p-5 outline-none focus:border-brand-red text-base font-bold uppercase" placeholder="ENTER TOWN" />
                  )}
                </div>
                <div className="md:col-span-2 space-y-2">
                  <label className="text-xs text-zinc-500 font-bold tracking-widest">STATE (AUTO-DETECTED)</label>
                  <input value={address.state} readOnly className="w-full bg-zinc-800/50 border border-zinc-800 p-5 text-zinc-500 text-sm font-black italic uppercase" />
                </div>
              </div>
            </section>

            {/* 03. COURIER */}
            <section className="space-y-6">
                <div className="flex justify-between items-end border-b border-zinc-900 pb-2">
                   <h3 className="text-brand-red font-black text-sm tracking-widest italic uppercase">03. Courier selection</h3>
                   <span className="text-xs font-black italic text-zinc-500">CHARGEABLE WEIGHT: <span className="text-white">{shippingData.weightInfo} KG</span></span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {shippingData.options.map(c => (
                        <div key={c.name} onClick={() => setSelectedCourier(c)} className={`p-6 border-2 cursor-pointer transition-all ${selectedCourier?.name === c.name ? 'border-brand-red bg-brand-red/10 shadow-[0_0_20px_rgba(225,29,72,0.1)]' : 'border-zinc-900 hover:border-zinc-700'}`}>
                            <div className="flex flex-col text-center gap-2">
                                <span className="font-black text-xs italic uppercase tracking-widest">{c.name}</span>
                                <span className="text-brand-red font-black text-2xl italic tracking-tighter">RM {formatMoney(c.totalCost)}</span>
                                <span className="text-zinc-600 text-[10px] font-bold">EST: {c.time}</span>
                            </div>
                        </div>
                    ))}
                </div>
                <p className="text-[9px] text-zinc-600 italic font-bold tracking-widest">* VOLUMETRIC CALCULATION APPLIED FOR LARGE PARCELS.</p>
            </section>
          </div>

          {/* RIGHT: DETAILED SUMMARY */}
          <div className="lg:sticky lg:top-10 h-fit">
            <div className="bg-zinc-900 border border-zinc-800 p-8 shadow-2xl space-y-8 relative">
              <div className="absolute top-0 left-0 w-full h-1 bg-brand-red shadow-lg"></div>
              <h2 className="text-2xl font-black italic border-b border-zinc-800 pb-4 tracking-tighter uppercase italic">Order Summary</h2>
              
              <div className="space-y-6 max-h-[450px] overflow-y-auto pr-2 custom-scrollbar">
                {cart.map((item: any) => (
                    <div key={item.id} className="bg-black/30 p-5 border border-zinc-800 group">
                        <div className="flex justify-between items-start mb-4 gap-4">
                            <div className="w-full">
                                <p className="font-black text-white text-sm leading-tight italic uppercase">{item.brand_name} - {item.name_en}</p>
                                <p className="text-zinc-600 text-[10px] mt-2 font-bold tracking-widest uppercase italic">RM {formatMoney(item.price)} / UNIT</p>
                            </div>
                            <span className="font-black text-white text-sm tracking-tighter">RM {formatMoney(item.price * item.qty)}</span>
                        </div>
                        
                        <div className="flex items-center justify-between border-t border-zinc-800/50 pt-4">
                            <div className="flex items-center bg-zinc-800 rounded overflow-hidden">
                                <button onClick={() => updateQty(item.id, -1)} className="px-4 py-2 hover:bg-brand-red transition-all font-black text-lg">-</button>
                                <span className="px-5 py-2 text-sm font-black border-l border-r border-zinc-700">{item.qty}</span>
                                <button onClick={() => updateQty(item.id, 1)} className="px-4 py-2 hover:bg-brand-red transition-all font-black text-lg">+</button>
                            </div>
                            <button onClick={() => removeItem(item.id)} className="text-[10px] font-black text-zinc-600 hover:text-brand-red transition-colors uppercase italic tracking-tighter">Remove Part</button>
                        </div>
                    </div>
                ))}
              </div>

              <div className="space-y-4 pt-6 border-t border-zinc-800">
                <div className="flex justify-between text-xs font-black text-zinc-500 tracking-widest uppercase italic">
                    <span>Subtotal Products</span>
                    <span className="text-white">RM {formatMoney(itemsTotal)}</span>
                </div>
                <div className="flex justify-between text-xs font-black text-zinc-500 tracking-widest uppercase italic">
                    <span>Courier ({shippingData.weightInfo} KG)</span>
                    <span className="text-brand-red">{selectedCourier ? `RM ${formatMoney(selectedCourier.totalCost)}` : '--'}</span>
                </div>
                
                <div className="pt-8 mt-6 border-t-2 border-brand-red">
                    <p className="font-black text-[11px] italic opacity-60 uppercase mb-2 tracking-[0.2em]">Grand Total Payment</p>
                    <div className="text-4xl md:text-5xl font-black text-brand-red tracking-tighter italic leading-none truncate">
                        RM {formatMoney(grandTotal)}
                    </div>
                </div>
              </div>

              <button 
                onClick={handlePlaceOrder} 
                disabled={loading || cart.length === 0 || !selectedCourier}
                className="w-full bg-white text-black py-7 font-black uppercase italic tracking-[0.2em] hover:bg-brand-red hover:text-white transition-all shadow-xl disabled:opacity-20 active:scale-95"
              >
                {loading ? 'STORING ORDER...' : 'PLACE ORDER & PAY'}
              </button>
              
              <p className="text-[9px] text-center text-zinc-700 font-black tracking-[0.3em] uppercase italic opacity-60">
                Shipment Center: Kajang HQ (43000)
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}