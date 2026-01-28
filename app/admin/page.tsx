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

  if (loading) return <div className="min-h-screen flex items-center justify-center text-slate-300 font-medium">Syncing Admin Hub...</div>
  if (!isAdmin) return <div className="min-h-screen flex items-center justify-center font-bold uppercase">Access Denied</div>

  return (
    <div className="min-h-screen bg-[#f8fafc] flex font-sans">
      
      {/* SIDEBAR */}
      <aside className="w-64 bg-[#0f172a] text-white flex flex-col sticky top-0 h-screen hidden lg:flex border-r border-slate-800">
        <div className="p-8 border-b border-slate-800 flex flex-col items-center">
            <img src="https://vaqlsjjkcctuwrskssga.supabase.co/storage/v1/object/public/logo/KEsq.png" className="h-16 w-auto mb-4" alt="KE" />
            <h1 className="text-lg font-black tracking-tight text-white uppercase italic">CHASSIS <span className="text-blue-500">PRO</span></h1>
            <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mt-1">Enterprise Portal</p>
        </div>

        <nav className="flex-1 p-4 space-y-1 mt-6">
            <button onClick={() => setActiveTab('orders')} className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition-all ${activeTab === 'orders' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-slate-400 hover:bg-slate-800'}`}>Dashboard</button>
            <button onClick={() => setActiveTab('products')} className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition-all ${activeTab === 'products' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-slate-400 hover:bg-slate-800'}`}>Inventory</button>
            <button onClick={() => setActiveTab('users')} className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition-all ${activeTab === 'users' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-slate-400 hover:bg-slate-800'}`}>User Management</button>
        </nav>

        <div className="p-6 border-t border-slate-800">
            <p className="text-[10px] text-slate-500 truncate mb-2 font-bold lowercase">{userEmail}</p>
            <button onClick={handleLogout} className="text-xs font-bold text-slate-400 hover:text-red-400 transition-colors uppercase tracking-widest">Sign Out</button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 min-w-0">
        <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 p-6 flex justify-between items-center sticky top-0 z-40 h-20 px-10">
            <h2 className="text-xl font-bold text-slate-800 capitalize tracking-tight">{activeTab}</h2>
            <Link href="/products" className="text-xs font-bold text-blue-600 hover:underline uppercase">Launch Store →</Link>
        </header>

        <div className="p-10">
            {activeTab === 'orders' && <OrdersTab />}
            {activeTab === 'products' && <InventoryTab />}
            {activeTab === 'users' && <UsersTab />}
        </div>
      </main>
    </div>
  )
}