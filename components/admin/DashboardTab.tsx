"use client"
import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

export default function DashboardTab() {
  const [stats, setStats] = useState({ totalSales: 0, orderCount: 0, productCount: 0, userCount: 0 })
  const [recentOrders, setRecentOrders] = useState<any[]>([])
  const [recentUsers, setRecentUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const fetchDashboardData = useCallback(async () => {
    setLoading(true)
    const [orders, products, users] = await Promise.all([
      supabase.from('orders').select('*'),
      supabase.from('products').select('id'),
      supabase.from('profiles').select('id')
    ]);

    const totalRevenue = (orders.data || [])
      .filter(o => o.status === 'PAID' || o.status === 'SHIPPED')
      .reduce((acc, curr) => acc + Number(curr.total_amount), 0);

    setStats({
      totalSales: totalRevenue,
      orderCount: orders.data?.length || 0,
      productCount: products.data?.length || 0,
      userCount: users.data?.length || 0
    });

    // Get 5 most recent items for the activity feed
    const { data: latestOrders } = await supabase.from('orders').select('*').order('created_at', { ascending: false }).limit(5);
    const { data: latestUsers } = await supabase.from('profiles').select('*').order('created_at', { ascending: false }).limit(5);

    setRecentOrders(latestOrders || []);
    setRecentUsers(latestUsers || []);
    setLoading(false)
  }, [])

  useEffect(() => { fetchDashboardData() }, [fetchDashboardData])

  if (loading) return <div className="py-20 text-center text-slate-300 animate-pulse font-medium">Gathering business intelligence...</div>

  return (
    <div className="space-y-10 animate-in fade-in duration-500 font-sans">
      
      {/* 1. KEY STATS CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white border border-slate-100 p-8 rounded-3xl shadow-sm">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Revenue</p>
            <p className="text-3xl font-black text-slate-800 tracking-tight">RM {stats.totalSales.toLocaleString('en-MY', { minimumFractionDigits: 2 })}</p>
        </div>
        <div className="bg-white border border-slate-100 p-8 rounded-3xl shadow-sm">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Orders</p>
            <p className="text-3xl font-black text-slate-800 tracking-tight">{stats.orderCount}</p>
        </div>
        <div className="bg-white border border-slate-100 p-8 rounded-3xl shadow-sm">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Active SKUs</p>
            <p className="text-3xl font-black text-slate-800 tracking-tight">{stats.productCount}</p>
        </div>
        <div className="bg-white border border-slate-100 p-8 rounded-3xl shadow-sm">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Users</p>
            <p className="text-3xl font-black text-slate-800 tracking-tight">{stats.userCount}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          
          {/* 2. RECENT ORDERS FEED */}
          <section className="space-y-4">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest ml-2">Recent Sales Activity</h3>
            <div className="bg-white border border-slate-100 rounded-[2rem] overflow-hidden shadow-sm">
                <div className="divide-y divide-slate-50">
                    {recentOrders.map(order => (
                        <div key={order.id} className="p-5 flex justify-between items-center hover:bg-slate-50 transition-all">
                            <div>
                                <p className="text-xs font-bold text-slate-800">{order.customer_name}</p>
                                <p className="text-[10px] text-slate-400 font-medium">Order #{order.id.slice(0,5).toUpperCase()}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-sm font-black text-blue-600">RM {Number(order.total_amount).toFixed(2)}</p>
                                <p className="text-[9px] font-bold text-slate-300 uppercase">{order.status}</p>
                            </div>
                        </div>
                    ))}
                    {recentOrders.length === 0 && <p className="p-10 text-center text-slate-300 italic text-xs">No orders yet.</p>}
                </div>
            </div>
          </section>

          {/* 3. RECENT USERS FEED */}
          <section className="space-y-4">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest ml-2">New Registrations</h3>
            <div className="bg-white border border-slate-100 rounded-[2rem] overflow-hidden shadow-sm">
                <div className="divide-y divide-slate-50">
                    {recentUsers.map(user => (
                        <div key={user.id} className="p-5 flex justify-between items-center hover:bg-slate-50 transition-all">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-400">
                                    {user.email?.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-slate-800 lowercase">{user.email}</p>
                                    <p className="text-[9px] text-slate-400 font-medium uppercase">{user.role}</p>
                                </div>
                            </div>
                            <span className="text-[9px] font-bold text-slate-300">{new Date(user.created_at).toLocaleDateString()}</span>
                        </div>
                    ))}
                    {recentUsers.length === 0 && <p className="p-10 text-center text-slate-300 italic text-xs">No users yet.</p>}
                </div>
            </div>
          </section>

      </div>
    </div>
  )
}