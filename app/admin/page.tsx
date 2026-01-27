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
  const [userEmail, setUserEmail] = useState('')

  useEffect(() => {
    async function checkAccess() {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        setUserEmail(session.user.email || '')
        const { data: profile } = await supabase.from('profiles').select('role').eq('id', session.user.id).single()
        if (profile?.role === 'ADMIN') setIsAdmin(true)
      }
      setLoading(false)
    }
    checkAccess()
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  if (loading) return <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center text-slate-400">Loading Enterprise System...</div>
  if (!isAdmin) return <div className="min-h-screen flex flex-col items-center justify-center gap-4"><h1>Access Denied</h1><button onClick={handleLogout} className="bg-slate-900 text-white px-6 py-2 rounded">Logout</button></div>

  return (
    <div className="min-h-screen bg-[#f8fafc] flex font-sans">
      
      {/* SIDEBAR - Exactly like the ERP image */}
      <aside className="w-64 bg-[#0f172a] text-white flex flex-col sticky top-0 h-screen hidden md:flex">
        <div className="p-8 border-b border-slate-800">
            <h1 className="text-2xl font-black tracking-tight">CHASSIS <span className="text-blue-500">PRO</span></h1>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mt-1">Enterprise System</p>
        </div>

        <nav className="flex-1 p-4 space-y-2 mt-4">
            <button onClick={() => setActiveTab('orders')} className={`w-full flex items-center gap-4 px-4 py-3 rounded-lg text-sm font-semibold transition-all ${activeTab === 'orders' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}>
                <span>Dashboard</span>
            </button>
            <button onClick={() => setActiveTab('products')} className={`w-full flex items-center gap-4 px-4 py-3 rounded-lg text-sm font-semibold transition-all ${activeTab === 'products' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}>
                <span>Inventory</span>
            </button>
            <button onClick={() => setActiveTab('users')} className={`w-full flex items-center gap-4 px-4 py-3 rounded-lg text-sm font-semibold transition-all ${activeTab === 'users' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}>
                <span>Customers / Users</span>
            </button>
        </nav>

        <div className="p-6 border-t border-slate-800">
            <p className="text-[10px] text-slate-500 truncate mb-2">{userEmail}</p>
            <button onClick={handleLogout} className="text-xs font-bold text-slate-400 hover:text-white uppercase">Sign Out</button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 overflow-y-auto">
        {/* TOP BAR SEARCH PLACEHOLDER */}
        <header className="bg-white border-b border-slate-200 p-6 flex flex-col md:flex-row justify-between items-center gap-4 sticky top-0 z-40">
            <h2 className="text-2xl font-bold text-slate-800 capitalize">{activeTab}</h2>
            <div className="flex-1 max-w-xl w-full mx-4">
                <input className="w-full bg-slate-100 border-none px-4 py-2.5 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20" placeholder="Search Item Code, SKU, Name..." />
            </div>
            <div className="flex items-center gap-4">
                <Link href="/products" className="text-xs font-bold text-slate-400 hover:text-slate-600 uppercase">View Shop</Link>
            </div>
        </header>

        <div className="p-6 md:p-10">
            {activeTab === 'orders' && <OrdersTab />}
            {activeTab === 'products' && <InventoryTab />}
            {activeTab === 'users' && <UsersTab />}
        </div>
      </main>
    </div>
  )
}