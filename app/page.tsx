"use client"
import Link from 'next/link'
import FitmentSelector from '@/components/FitmentSelector'

export default function Home() {
  return (
    <main className="min-h-screen relative flex flex-col items-center pt-24 md:pt-48 p-6 overflow-hidden bg-[#f8fafc]">
      
      {/* Navigation */}
      <nav className="fixed top-0 w-full p-6 md:p-10 flex justify-between items-center max-w-7xl z-50">
        <img src="https://vaqlsjjkcctuwrskssga.supabase.co/storage/v1/object/public/logo/KEsq.png" className="h-10 w-auto" alt="KE Logo" />
        <div className="flex gap-8 items-center">
            <Link href="/products" className="text-[10px] font-bold tracking-widest text-slate-400 hover:text-[#f97316] transition-all uppercase italic">Catalog</Link>
            <Link href="/login" className="bg-[#0f172a] text-white px-6 py-2.5 text-[10px] font-black tracking-widest uppercase rounded-sm hover:bg-[#e11d48] transition-all shadow-lg">Partner Login</Link>
        </div>
      </nav>

      {/* Hero Content Area */}
      <div className="relative z-10 text-center space-y-10 w-full max-w-6xl">
        <div className="flex flex-col items-center space-y-6">
            <img src="https://vaqlsjjkcctuwrskssga.supabase.co/storage/v1/object/public/logo/KEfullsq.png" className="h-32 md:h-48 w-auto drop-shadow-2xl" alt="Chassis Pro Full Logo" />
            <span className="inline-block border border-orange-200 bg-orange-50 text-[#f97316] text-[9px] font-black tracking-[0.4em] px-4 py-1.5 rounded-full uppercase">
                Malaysia Specialized Handling Hub
            </span>
        </div>
        
        <p className="text-slate-400 text-sm md:text-lg max-w-2xl mx-auto leading-relaxed font-medium uppercase tracking-tight italic">
            Authorized Specialist for <span className="text-slate-900 font-bold">Proride, KYB, 4Flex</span> and more. 
        </p>
        
        <div className="pt-4 w-full">
            <FitmentSelector />
        </div>
      </div>

      <div className="fixed bottom-0 right-0 opacity-[0.03] select-none pointer-events-none text-slate-900">
        <h2 className="text-[25vw] font-black leading-none uppercase italic">PRO</h2>
      </div>
      <div className="fixed bottom-0 left-0 w-full h-2 bg-gradient-to-r from-[#e11d48] via-[#f97316] to-[#e11d48] opacity-30"></div>
    </main>
  )
}