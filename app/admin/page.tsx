// Inside the return of AdminDashboard, look for the <header> section:
<header className="bg-white border-b border-slate-200 p-6 flex justify-between items-center sticky top-0 z-40 h-24 px-12">
    <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase italic leading-none">
        {activeTab === 'dashboard' ? 'DASHBOARD' : activeTab}
    </h2>
    <div className="flex gap-4">
        <Link href="/products" className="text-xs font-black text-slate-500 hover:text-blue-600 px-6 py-2.5 border-2 border-slate-100 rounded-xl transition-all uppercase tracking-widest">
          Launch Store
        </Link>
    </div>
</header>