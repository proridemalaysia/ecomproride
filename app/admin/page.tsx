"use client"
import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import OrdersTab from '@/components/admin/OrdersTab'
import InventoryTab from '@/components/admin/InventoryTab'
import UsersTab from '@/components/admin/UsersTab'

export default function AdminDashboard() {
  // --- UI & SECURITY STATES ---
  const [activeTab, setActiveTab] = useState<'orders' | 'products' | 'users'>('products')
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [userEmail, setUserEmail] = useState('')

  // --- AUTH CHECK ---
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

  if (loading) return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center">
        <div className="animate-spin h-10 w-10 border-t-2 border-blue-600 rounded-full mb-4"></div>
        <p className="text-slate-400 font-medium animate-pulse">Syncing Enterprise Portal...</p>
    </div>
  )
  
  if (!isAdmin) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 bg-white uppercase">
        <h1 className="text-xl font-bold text-slate-300 tracking-widest">Unauthorized Access</h1>
        <Link href="/login" className="bg-blue-600 text-white px-10 py-4 rounded-xl font-bold text-xs tracking-widest">Back to Login</Link>
    </div>
  )

  return (
    <div className="min-h-screen flex bg-[#f8fafc] font-sans">
      
      {/* SIDEBAR - ERP DESIGN */}
      <aside className="w-64 bg-[#0f172a] text-white flex flex-col sticky top-0 h-screen hidden lg:flex border-r border-slate-800">
        <div className="p-8 border-b border-slate-800 flex flex-col items-center">
            {/* SHORT LOGO */}
            <img 
                src="https://vaqlsjjkcctuwrskssga.supabase.co/storage/v1/object/public/logo/KEsq.png" 
                className="h-16 w-auto mb-4 drop-shadow-lg" 
                alt="KE Logo" 
            />
            <h1 className="text-xl font-black tracking-tight text-white uppercase italic leading-none">
                CHASSIS <span className="text-blue-500">PRO</span>
            </h1>
            <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mt-2 italic">Enterprise Hub</p>
        </div>

        <nav className="flex-1 px-4 space-y-1 mt-8">
            <button 
                onClick={() => setActiveTab('orders')} 
                className={`w-full flex items-center px-4 py-3.5 rounded-xl text-sm font-semibold transition-all ${activeTab === 'orders' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
            >
                Dashboard
            </button>
            <button 
                onClick={() => setActiveTab('products')} 
                className={`w-full flex items-center px-4 py-3.5 rounded-xl text-sm font-semibold transition-all ${activeTab === 'products' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
            >
                Inventory
            </button>
            <button 
                onClick={() => setActiveTab('users')} 
                className={`w-full flex items-center px-4 py-3.5 rounded-xl text-sm font-semibold transition-all ${activeTab === 'users' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
            >
                User Roles
            </button>
        </nav>

        <div className="p-6 border-t border-slate-800 bg-black/20">
            <p className="text-[10px] text-slate-500 truncate mb-3 font-bold lowercase tracking-tight">{userEmail}</p>
            <button onClick={handleLogout} className="text-xs font-bold text-slate-400 hover:text-red-400 transition-colors uppercase tracking-widest">Sign Out</button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col min-w-0">
        <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 p-6 flex items-center justify-between sticky top-0 z-40 h-20 px-10">
            <h2 className="text-xl font-bold text-slate-800 capitalize tracking-tight">{activeTab}</h2>
            
            <div className="flex items-center gap-6">
                <Link href="/products" className="text-xs font-bold text-blue-600 hover:underline uppercase italic">Launch Store →</Link>
                {/* Mobile Logout (Icon only) */}
                <button onClick={handleLogout} className="lg:hidden text-slate-400 font-bold text-xs">LOGOUT</button>
            </div>
        </header>

        <div className="p-6 lg:p-10 max-w-[1600px]">
            {activeTab === 'orders' && <OrdersTab />}
            {activeTab === 'products' && <InventoryTab />}
            {activeTab === 'users' && <UsersTab />}
        </div>
      </main>
    </div>
  )
}