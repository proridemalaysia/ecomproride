"use client"
import Link from 'next/link'
import FitmentSelector from '@/components/FitmentSelector'

export default function Home() {
  return (
    <main className="min-h-screen bg-[#ffffff]">
      {/* Elegant Nav */}
      <nav className="p-8 md:p-12 flex justify-between items-center max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
            <img src="https://vaqlsjjkcctuwrskssga.supabase.co/storage/v1/object/public/logo/KEsq.png" className="h-10 w-auto" alt="Logo" />
            <span className="text-xl font-bold tracking-tighter uppercase italic">Chassis Pro</span>
        </div>
        <div className="flex gap-10 items-center">
            <Link href="/products" className="text-sm font-semibold text-slate-500 hover:text-black transition-colors">Catalog</Link>
            <Link href="/login" className="text-sm font-bold border-b-2 border-black pb-1 hover:border-brand-accent transition-all">Hub Access</Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-5xl mx-auto px-8 pt-20 pb-32 text-center">
        <h1 className="text-6xl md:text-[7rem] font-bold tracking-tight leading-[0.9] mb-12 text-[#111111]">
          Engineered <br/>
          <span className="text-slate-300 font-medium">Balance.</span>
        </h1>
        
        <p className="text-lg md:text-xl text-slate-500 max-w-2xl mx-auto mb-16 leading-relaxed">
            authorized handling specialists for premium malaysian suspension brands. 
            precision fitment for proton, perodua, and beyond.
        </p>
        
        <FitmentSelector />
      </section>

      {/* Partners Footer */}
      <footer className="border-t border-slate-100 py-20">
          <div className="max-w-7xl mx-auto px-8 flex flex-wrap justify-center gap-16 opacity-30 grayscale grayscale-100">
              {['PRORIDE', 'KYB', '4FLEX', 'APM', 'FTUNED'].map(b => (
                  <span key={b} className="font-bold tracking-tighter text-xl">{b}</span>
              ))}
          </div>
      </footer>
    </div>
  )
}