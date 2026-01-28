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
  
  // States
  const [customer, setCustomer] = useState({ name: '', email: '', whatsapp: '' })
  const [address, setAddress] = useState({ street: '', postcode: '', town: '', state: '' })
  const [shippingData, setShippingData] = useState<{weightInfo: string, options: any[]}>({ weightInfo: '0.00', options: [] })
  const [selectedCourier, setSelectedCourier] = useState<any>(null)

  // Gifts & Vouchers States
  const [availableGifts, setAvailableGifts] = useState<any[]>([])
  const [selectedGift, setSelectedGift] = useState<string>('')
  const [voucherCode, setVoucherCode] = useState('')
  const [appliedVoucher, setAppliedVoucher] = useState<any>(null)

  const formatMoney = (amount: any) => {
    const num = parseFloat(amount);
    if (isNaN(num)) return '0.00';
    return new Intl.NumberFormat('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(num);
  };

  // 1. Calculations
  const hasFullSet = cart.some((item: any) => item.name_en.toLowerCase().includes('full set'));
  const itemsTotal = cart.reduce((acc: number, item: any) => acc + (Number(item.price || 0) * item.qty), 0)
  const discount = appliedVoucher ? Number(appliedVoucher.discount_amount) : 0
  const grandTotal = Math.max(0, itemsTotal + Number(selectedCourier?.totalCost || 0) - discount)

  useEffect(() => {
    async function getGifts() {
        const { data } = await supabase.from('free_gifts').select('*').gt('stock', 0)
        setAvailableGifts(data || [])
    }
    getGifts()
  }, [])

  const applyVoucher = async () => {
    const { data, error } = await supabase.from('vouchers').select('*').eq('code', voucherCode.toUpperCase()).eq('is_active', true).single()
    if (data) {
        setAppliedVoucher(data)
        alert(`Voucher Applied: -RM ${data.discount_amount}`)
    } else {
        alert("Invalid or expired voucher code.")
    }
  }

  const updateLogistics = useCallback(() => {
    if (address.postcode.length === 5 && cart.length > 0) {
      const result = calculateShipping(address.postcode, cart)
      setShippingData(result)
      if (result.options.length > 0) setSelectedCourier(result.options[0])
      const detectedState = getStateByPostcode(address.postcode)
      setAddress(prev => ({ ...prev, state: detectedState }))
    }
  }, [address.postcode, cart])

  useEffect(() => { updateLogistics() }, [updateLogistics])

  const handlePlaceOrder = async () => {
    if (!customer.name || !customer.whatsapp || !selectedCourier) return alert('Sila lengkapkan maklumat.');
    setLoading(true)
    try {
      const { data: order, error: dbError } = await supabase.from('orders').insert([{
        customer_name: customer.name, email: customer.email, whatsapp: customer.whatsapp,
        address: `${address.street}, ${address.town}, ${address.postcode}, ${address.state}`,
        total_amount: grandTotal, status: 'PENDING', items_json: cart,
        free_gift_info: selectedGift, voucher_code: appliedVoucher?.code || null, discount_applied: discount
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

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans pb-20 p-4 md:p-12 pt-32 md:pt-40">
      <nav className="fixed top-0 w-full left-0 p-6 bg-white/80 backdrop-blur-md border-b border-slate-100 z-50">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
            <Link href="/" className="text-xl font-black tracking-tight text-slate-800 uppercase">CHASSIS <span className="text-blue-600">PRO</span></Link>
            <Link href="/products" className="text-xs font-bold text-slate-400">← BACK</Link>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-12 relative z-10">
          <div className="lg:col-span-2 space-y-8">
            
            {/* 01. FREE GIFT SELECTION */}
            <section className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
                <h3 className="font-bold text-sm mb-6 text-blue-600 uppercase tracking-widest italic">01. Select Your Free Gift</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Always available sticker */}
                    <div onClick={() => setSelectedGift('Proride Sticker')} className={`p-4 border-2 rounded-xl cursor-pointer transition-all ${selectedGift === 'Proride Sticker' ? 'border-blue-600 bg-blue-50' : 'border-slate-100'}`}>
                        <p className="font-bold text-sm">Proride Performance Sticker</p>
                        <p className="text-[10px] text-slate-400">Available for all orders</p>
                    </div>

                    {/* T-Shirt option - only if Full Set is in cart */}
                    {hasFullSet ? (
                        <div className="space-y-3">
                            <p className="text-[10px] font-bold text-slate-400 uppercase">Premium T-Shirt (Full Set Reward)</p>
                            <select 
                                onChange={(e) => setSelectedGift(`T-Shirt Size: ${e.target.value}`)}
                                className="w-full bg-slate-50 border border-slate-200 p-4 rounded-xl text-sm font-bold outline-none focus:border-blue-600"
                            >
                                <option value="">Select Size</option>
                                {availableGifts.filter(g => g.name.includes('T-Shirt')).map(g => (
                                    <option key={g.id} value={g.size}>{g.size} ({g.stock} left)</option>
                                ))}
                            </select>
                        </div>
                    ) : (
                        <div className="p-4 border border-dashed border-slate-200 rounded-xl opacity-50">
                            <p className="text-[10px] font-bold text-slate-400">Order a "Full Set" to unlock a Free T-Shirt</p>
                        </div>
                    )}
                </div>
            </section>

            {/* 02. VOUCHER SYSTEM */}
            <section className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
                <h3 className="font-bold text-sm mb-6 text-blue-600 uppercase tracking-widest italic">02. Promotion Code</h3>
                <div className="flex gap-3">
                    <input 
                        className="flex-1 bg-slate-50 border border-slate-200 p-4 rounded-xl text-sm font-bold outline-none focus:border-blue-600 uppercase" 
                        placeholder="ENTER VOUCHER CODE"
                        value={voucherCode}
                        onChange={(e) => setVoucherCode(e.target.value)}
                    />
                    <button onClick={applyVoucher} className="bg-slate-900 text-white px-8 rounded-xl font-bold text-xs uppercase hover:bg-blue-600 transition-all">Apply</button>
                </div>
            </section>

            {/* 03. CONTACT & ADDRESS (Unified) */}
            <section className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 space-y-8">
                <h3 className="font-bold text-sm text-blue-600 uppercase tracking-widest italic">03. Shipping Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <input onChange={e => setCustomer({...customer, name: e.target.value})} className="md:col-span-2 w-full border border-slate-200 p-4 rounded-xl text-sm font-semibold outline-none focus:border-blue-600" placeholder="FULL NAME" />
                    <input onChange={e => setCustomer({...customer, whatsapp: e.target.value})} className="w-full border border-slate-200 p-4 rounded-xl text-sm font-semibold outline-none focus:border-blue-600" placeholder="WHATSAPP NO" />
                    <input onChange={e => setCustomer({...customer, email: e.target.value})} className="w-full border border-slate-200 p-4 rounded-xl text-sm font-semibold outline-none focus:border-blue-600" placeholder="EMAIL" />
                    <input onChange={e => setAddress({...address, street: e.target.value})} className="md:col-span-2 w-full border border-slate-200 p-4 rounded-xl text-sm font-semibold outline-none focus:border-blue-600" placeholder="STREET ADDRESS" />
                    <input value={address.postcode} onChange={e => setAddress({...address, postcode: e.target.value})} className="w-full border border-slate-200 p-4 rounded-xl text-lg font-black text-blue-600 outline-none focus:border-blue-600" placeholder="POSTCODE" maxLength={5} />
                    <input value={address.town} onChange={e => setAddress({...address, town: e.target.value})} className="w-full border border-slate-200 p-4 rounded-xl text-sm font-semibold outline-none focus:border-blue-600" placeholder="TOWN" />
                </div>
            </section>

            {/* 04. COURIER */}
            <section className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
                <div className="flex justify-between items-center mb-8 border-b pb-4">
                    <h3 className="font-bold text-sm text-blue-600 uppercase tracking-widest italic">04. Courier</h3>
                    <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full uppercase">Weight: {shippingData.weightInfo} KG</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {shippingData.options.map(c => (
                        <div key={c.name} onClick={() => setSelectedCourier(c)} className={`p-6 border-2 rounded-2xl cursor-pointer transition-all ${selectedCourier?.name === c.name ? 'border-blue-600 bg-blue-50 shadow-md' : 'border-slate-100'}`}>
                            <p className="font-bold text-[10px] text-slate-400 uppercase italic tracking-tighter">{c.name}</p>
                            <p className="font-black text-xl text-slate-900 mt-2">RM {formatMoney(c.totalCost)}</p>
                        </div>
                    ))}
                </div>
            </section>
          </div>

          {/* SIDEBAR SUMMARY */}
          <div className="lg:sticky lg:top-32 h-fit">
            <div className="bg-white border border-slate-200 p-8 rounded-3xl shadow-2xl space-y-8 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1.5 bg-blue-600"></div>
              <h2 className="text-xl font-black border-b pb-4 uppercase text-slate-900 italic">Order Total</h2>
              
              <div className="space-y-4 pt-4">
                <div className="flex justify-between text-xs font-bold text-slate-400"><span>Items Total</span><span className="text-slate-900">RM {formatMoney(itemsTotal)}</span></div>
                <div className="flex justify-between text-xs font-bold text-slate-400"><span>Shipping</span><span className="text-slate-900">RM {formatMoney(selectedCourier?.totalCost || 0)}</span></div>
                {appliedVoucher && (
                    <div className="flex justify-between text-xs font-bold text-green-600 uppercase"><span>Voucher ({appliedVoucher.code})</span><span>- RM {formatMoney(discount)}</span></div>
                )}
                
                <div className="pt-8 border-t-2 border-slate-900 flex justify-between items-center gap-4">
                    <span className="font-bold text-xs text-slate-400 uppercase tracking-widest">Grand Total</span>
                    <span className="text-3xl md:text-4xl font-black text-blue-600 tracking-tighter italic">RM {formatMoney(grandTotal)}</span>
                </div>
              </div>

              {selectedGift && (
                <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                    <p className="text-[10px] font-bold text-blue-400 uppercase">Selected Gift:</p>
                    <p className="text-xs font-black text-blue-700 italic uppercase">✓ {selectedGift}</p>
                </div>
              )}

              <button onClick={handlePlaceOrder} disabled={loading || cart.length === 0 || !selectedCourier} className="w-full bg-[#0f172a] text-white py-7 font-black uppercase italic hover:bg-blue-600 transition-all shadow-xl rounded-2xl active:scale-95 disabled:opacity-30">
                {loading ? 'PROCESSING...' : 'PLACE ORDER & PAY'}
              </button>
            </div>
          </div>
      </div>
    </div>
  )
}