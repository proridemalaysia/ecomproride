"use client"
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import OrdersTab from '@/components/admin/OrdersTab'
import InventoryTab from '@/components/admin/InventoryTab'
import UsersTab from '@/components/admin/UsersTab'

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<'orders' | 'products' | 'users'>('products')
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    async function checkAccess() {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        const { data: profile } = await supabase.from('profiles').select('role').eq('id', session.user.id).single()
        if (profile?.role === 'ADMIN') {
          setIsAdmin(true)
        }
      }
      setLoading(false)
    }
    checkAccess()
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center text-slate-300 font-medium">Verifying Credentials...</div>

  if (!isAdmin) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 bg-[#f8fafc]">
        <h1 className="text-xl font-bold text-slate-400">ADMIN ACCESS DENIED</h1>
        <Link href="/login" className="bg-slate-900 text-white px-10 py-4 rounded-xl font-bold text-xs uppercase tracking-widest">Return to Login</Link>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans">
      <div className="max-w-7xl mx-auto p-6 md:p-12">
        
        {/* HEADER WITH LOGOUT */}
        <header className="flex justify-between items-center mb-16 border-b border-slate-200 pb-8">
            <h1 className="text-2xl font-black tracking-tight text-slate-800">CHASSIS<span className="text-[#e11d48]">PRO</span> <span className="font-light text-slate-300 ml-2">MANAGEMENT</span></h1>
            <button 
                onClick={handleLogout}
                className="bg-white border border-slate-200 text-slate-400 px-6 py-2 rounded-lg font-bold text-[10px] tracking-widest uppercase hover:bg-[#e11d48] hover:text-white hover:border-[#e11d48] transition-all shadow-sm"
            >
                Logout Session
            </button>
        </header>

        {/* TAB NAVIGATION */}
        <nav className="flex bg-slate-100 p-1.5 rounded-2xl mb-12 shadow-inner max-w-md">
            <button onClick={() => setActiveTab('orders')} className={`flex-1 py-4 text-[10px] font-bold transition-all rounded-xl ${activeTab === 'orders' ? 'bg-white text-[#f97316] shadow-lg' : 'text-slate-400'}`}>01. ORDERS</button>
            <button onClick={() => setActiveTab('products')} className={`flex-1 py-4 text-[10px] font-bold transition-all rounded-xl ${activeTab === 'products' ? 'bg-white text-[#f97316] shadow-lg' : 'text-slate-400'}`}>02. INVENTORY</button>
            <button onClick={() => setActiveTab('users')} className={`flex-1 py-4 text-[10px] font-bold transition-all rounded-xl ${activeTab === 'users' ? 'bg-white text-[#f97316] shadow-lg' : 'text-slate-400'}`}>03. USERS</button>
        </nav>

        {/* MODULAR TABS */}
        <div className="animate-in fade-in duration-500">
            {activeTab === 'orders' && <OrdersTab />}
            {activeTab === 'products' && <InventoryTab />}
            {activeTab === 'users' && <UsersTab />}
        </div>
        
      </div>
    </div>
  )
}