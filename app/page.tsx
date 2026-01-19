import Link from 'next/link'
import FitmentSelector from '@/components/FitmentSelector'

export default function Home() {
  return (
    <main className="min-h-screen relative flex flex-col items-center pt-24 md:pt-48 p-6 overflow-hidden">
      
      {/* Navigation */}
      <nav className="fixed top-0 w-full p-6 md:p-10 flex justify-between items-center max-w-7xl z-50">
        <div className="text-xl font-black tracking-tighter uppercase">
          CHASSIS<span className="text-[#e11d48] italic">PRO</span>
        </div>
        <div className="flex gap-8 items-center">
            <Link href="/products" className="text-[10px] font-bold tracking-widest text-slate-400 hover:text-[#f97316] transition-all uppercase">
              Full Catalog
            </Link>
            <Link href="/login" className="bg-[#0f172a] text-white px-6 py-2.5 text-[10px] font-black tracking-widest uppercase rounded-sm hover:bg-[#e11d48] transition-all">
              Partner Login
            </Link>
        </div>
      </nav>

      {/* Hero Content Area */}
      <div className="relative z-10 text-center space-y-10 w-full max-w-6xl">
        <div className="space-y-4">
            <span className="inline-block border border-orange-200 bg-orange-50 text-[#f97316] text-[9px] font-black tracking-[0.4em] px-4 py-1.5 rounded-full uppercase">
                Malaysia Specialized Hub
            </span>
            
            <h1 className="text-6xl md:text-9xl font-black tracking-tighter leading-[0.85] text-slate-900 uppercase italic">
                Better <br/>
                <span className="text-[#e11d48] not-italic underline decoration-[#f97316] decoration-8 underline-offset-16">Control</span>
            </h1>
        </div>
        
        <p className="text-slate-400 text-sm md:text-lg max-w-2xl mx-auto leading-relaxed font-medium uppercase tracking-tight">
            AUTHORIZED SPECIALIST FOR <span className="text-slate-900 font-bold">PRORIDE, KYB, 4FLEX</span> AND MORE. 
        </p>
        
        {/* FITMENT SELECTOR CONTAINER */}
        <div className="pt-4 w-full">
            <FitmentSelector />
          
            <div className="mt-16 flex flex-wrap justify-center gap-x-12 gap-y-6 opacity-20 grayscale">
                <span className="font-black italic text-2xl">PRORIDE</span>
                <span className="font-black italic text-2xl">KYB</span>
                <span className="font-black italic text-2xl">4FLEX</span>
                <span className="font-black italic text-2xl">APM</span>
            </div>
        </div>
      </div>

      {/* Watermark Decoration */}
      <div className="fixed bottom-0 right-0 opacity-[0.03] select-none pointer-events-none text-slate-900">
        <h2 className="text-[25vw] font-black leading-none uppercase italic">PRO</h2>
      </div>

      {/* Bottom Aesthetic Accent */}
      <div className="fixed bottom-0 left-0 w-full h-2 bg-gradient-to-r from-[#e11d48] via-[#f97316] to-[#e11d48] opacity-30"></div>
    </main>
  )
}