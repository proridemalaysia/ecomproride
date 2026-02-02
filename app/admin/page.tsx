"use client"
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import OrdersTab from '@/components/admin/OrdersTab'
import InventoryTab from '@/components/admin/InventoryTab'
import UsersTab from '@/components/admin/UsersTab'
import CampaignsTab from '@/components/admin/CampaignsTab'
import DashboardTab from '@/components/admin/DashboardTab' // Import New Component

export default function AdminDashboard() {
  // SET DEFAULT TAB TO DASHBOARD
  const [activeTab, setActiveTab] = useState<'dashboard' | 'orders' | 'products' | 'users' | 'campaigns'>('dashboard')
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

  if (loading) return <div className="min-h-screen flex items-center justify-center text-slate-300 font-medium">Syncing Chassis Pro Admin...</div>
  if (!isAdmin) return <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-white uppercase"><h1>Access Denied</h1><button onClick={handleLogout} className="bg-slate-900 text-white px-8 py-2 rounded-lg">Logout</button></div>

  return (
    <div className="min-h-screen bg-[#f8fafc] flex font-sans">
      {/* SIDEBAR */}
      <aside className="w-64 bg-[#0f172a] text-white flex flex-col sticky top-0 h-screen hidden lg:flex border-r border-slate-800">
        <div className="p-8 border-b border-slate-800 flex flex-col items-center">
            <img src="https://vaqlsjjkcctuwrskssga.supabase.co/storage/v1/object/public/logo/KEsq.png" className="h-12 w-auto mb-4" alt="KE" />
            <h1 className="text-xl font-bold tracking-tight">Management Hub</h1>
        </div>

        <nav className="flex-1 p-4 space-y-1 mt-6">
            <button onClick={() => setActiveTab('dashboard')} className={`w-full text-left px-4 py-3 rounded-lg text-sm font-semibold transition-all ${activeTab === 'dashboard' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800'}`}>
                Dashboard
            </button>
            <button onClick={() => setActiveTab('orders')} className={`w-full text-left px-4 py-3 rounded-lg text-sm font-semibold transition-all ${activeTab === 'orders' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800'}`}>
                Order Processing
            </button>
            <button onClick={() => setActiveTab('products')} className={`w-full text-left px-4 py-3 rounded-lg text-sm font-semibold transition-all ${activeTab === 'products' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800'}`}>
                Inventory Stock
            </button>
            <button onClick={() => setActiveTab('users')} className={`w-full text-left px-4 py-3 rounded-lg text-sm font-semibold transition-all ${activeTab === 'users' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800'}`}>
                User Access Control
            </button>
            <button onClick={() => setActiveTab('campaigns')} className={`w-full text-left px-4 py-3 rounded-lg text-sm font-semibold transition-all ${activeTab === 'campaigns' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800'}`}>
                Marketing & Gifts
            </button>
        </nav>

        <div className="p-6 border-t border-slate-800 mt-auto">
            <p className="text-[10px] text-slate-500 font-bold mb-3">{userEmail}</p>
            <button onClick={handleLogout} className="text-xs font-bold text-slate-500 hover:text-red-400 transition-colors uppercase tracking-widest">Sign Out</button>
        </div>
      </aside>

      {/* MAIN VIEW */}
      <main className="flex-1 overflow-y-auto">
        <header className="bg-white border-b border-slate-100 p-6 flex justify-between items-center sticky top-0 z-40 h-20 px-10">
            <h2 className="text-xl font-bold text-slate-800 capitalize">{activeTab.replace('-', ' ')}</h2>
            <Link href="/products" className="text-xs font-bold text-blue-600 hover:underline uppercase tracking-tight">View Shop →</Link>
        </header>
        <div className="p-10">
            {activeTab === 'dashboard' && <DashboardTab />}
            {activeTab === 'orders' && <OrdersTab />}
            {activeTab === 'products' && <InventoryTab />}
            {activeTab === 'users' && <UsersTab />}
            {activeTab === 'campaigns' && <CampaignsTab />}
        </div>
      </main>
    </div>
  )
}