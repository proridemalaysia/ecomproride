"use client"
import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

export default function DashboardTab() {
  const [stats, setStats] = useState({ totalSales: 0, orderCount: 0, productCount: 0, userCount: 0 })
  const [recentOrders, setRecentOrders] = useState<any[]>([])
  const [recentUsers, setRecentUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
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

    const { data: latestOrders } = await supabase.from('orders').select('*').order('created_at', { ascending: false }).limit(6);
    const { data: latestUsers } = await supabase.from('profiles').select('*').order('created_at', { ascending: false }).limit(6);

    setRecentOrders(latestOrders || []);
    setRecentUsers(latestUsers || []);
    setLoading(false)
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  if (loading) return <div className="py-20 text-center text-slate-300 animate-pulse font-bold tracking-widest">GATHERING SYSTEM DATA...</div>

  return (
    <div className="space-y-12">
      
      {/* 1. ANALYTICS GRID - Sharp & Bold */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
            { label: 'GROSS REVENUE', value: `RM ${stats.totalSales.toLocaleString('en-MY', { minimumFractionDigits: 2 })}`, color: 'text-blue-600' },
            { label: 'TOTAL ORDERS', value: stats.orderCount, color: 'text-slate-800' },
            { label: 'ACTIVE INVENTORY', value: stats.productCount, color: 'text-slate-800' },
            { label: 'REGISTERED USERS', value: stats.userCount, color: 'text-slate-800' }
        ].map((stat, i) => (
            <div key={i} className="bg-white border border-slate-200 p-8 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">{stat.label}</p>
                <p className={`text-4xl font-extrabold tracking-tighter ${stat.color}`}>{stat.value}</p>
            </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* 2. SALES ACTIVITY - Fills more space */}
          <section className="lg:col-span-2 space-y-4">
            <div className="flex justify-between items-center px-2">
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">Recent Sales Pipeline</h3>
                <span className="text-[10px] font-bold text-slate-400">Showing last 6</span>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                <div className="divide-y divide-slate-100">
                    {recentOrders.map(order => (
                        <div key={order.id} className="p-6 flex justify-between items-center hover:bg-slate-50 transition-colors">
                            <div className="flex items-center gap-5">
                                <div className="bg-slate-100 w-10 h-10 rounded-lg flex items-center justify-center font-black text-slate-400 text-[10px]">
                                    {order.status === 'PAID' ? '💰' : '📦'}
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-slate-800 uppercase">{order.customer_name}</p>
                                    <p className="text-[10px] text-slate-400 font-bold tracking-widest mt-1">Order Ref: #{order.id.slice(0,5).toUpperCase()}</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-base font-black text-slate-900 tracking-tight">RM {Number(order.total_amount).toFixed(2)}</p>
                                <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full mt-1 inline-block ${order.status === 'PAID' ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'}`}>
                                    {order.status}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
          </section>

          {/* 3. USER BASE ACTIVITY */}
          <section className="space-y-4">
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest ml-2">New Specialists</h3>
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6 space-y-6">
                {recentUsers.map(user => (
                    <div key={user.id} className="flex items-center justify-between group">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-slate-900 text-white flex items-center justify-center text-[10px] font-black tracking-tighter">
                                {user.email?.substring(0, 2).toUpperCase()}
                            </div>
                            <div>
                                <p className="text-xs font-bold text-slate-800 lowercase">{user.email}</p>
                                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">{user.role}</p>
                            </div>
                        </div>
                        <span className="text-[9px] font-bold text-slate-300 group-hover:text-blue-500 transition-colors">{new Date(user.created_at).toLocaleDateString()}</span>
                    </div>
                ))}
                <button className="w-full py-4 border-2 border-dashed border-slate-100 rounded-xl text-[10px] font-black text-slate-400 hover:border-slate-300 hover:text-slate-600 transition-all uppercase tracking-widest">
                    Manage All Users
                </button>
            </div>
          </section>

      </div>
    </div>
  )
}