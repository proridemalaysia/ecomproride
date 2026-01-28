// Inside the return of ProductsList function:
<nav className="p-5 border-b border-slate-100 flex justify-between items-center bg-white/90 sticky top-0 z-50 backdrop-blur-md">
  <Link href="/" className="flex items-center gap-3 group">
    <img src="https://vaqlsjjkcctuwrskssga.supabase.co/storage/v1/object/public/logo/KEsq.png" className="h-8 w-auto group-hover:scale-110 transition-transform" alt="KE" />
    <span className="text-xl font-black tracking-tighter text-slate-800 uppercase italic">CHASSIS <span className="text-[#e11d48]">PRO</span></span>
  </Link>
  <Link href="/checkout" className="bg-slate-900 text-white px-5 py-2 rounded-lg font-bold text-xs flex items-center gap-3 hover:bg-brand-orange transition-all shadow-lg shadow-slate-200">
      Order Cart <span className="bg-[#e11d48] text-white px-2 py-0.5 rounded text-[10px]">{cart.length}</span>
  </Link>
</nav>