import { Link } from 'react-router-dom';
import { Leaf, ShieldCheck, Zap, Sparkles } from 'lucide-react';

function AuthLayout({ children }) {
  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-slate-900 font-sans flex items-center justify-center p-4 sm:p-6 lg:p-8">
      {/* Animated Ambient Glow Mesh */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Deep background gradient */}
        <div className="absolute inset-0 bg-radial from-slate-900 via-emerald-950/40 to-slate-950" />

        {/* Floating animated glowing orbs */}
        <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-emerald-500/20 blur-[100px] animate-pulse duration-7000" />
        <div className="absolute top-1/2 -right-32 h-[450px] w-[450px] rounded-full bg-teal-500/15 blur-[120px] animate-pulse duration-10000 delay-1000" />
        <div className="absolute -bottom-32 left-1/3 h-96 w-96 rounded-full bg-emerald-600/20 blur-[100px] animate-pulse duration-8000 delay-3000" />

        {/* Subtle grid mesh overlay */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              'linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />
      </div>

      <div className="relative z-10 w-full max-w-lg">
        {/* Brand Header */}
        <div className="mb-6 flex flex-col items-center text-center">
          <Link
            to="/"
            className="group flex items-center gap-2.5 rounded-full border border-emerald-500/30 bg-emerald-950/60 px-4 py-2 backdrop-blur-md transition hover:border-emerald-400 hover:bg-emerald-900/60 shadow-lg shadow-emerald-950/50"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-600 text-white shadow-xs group-hover:scale-110 transition-transform">
              <Leaf size={16} />
            </span>
            <span className="text-base font-bold text-white tracking-tight">
              FreshBasket<span className="text-emerald-400">.</span>
            </span>
            <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-semibold text-emerald-300">
              UNN Nsukka
            </span>
          </Link>
        </div>

        {/* Glassmorphic Auth Card */}
        <div className="overflow-hidden rounded-3xl border border-white/20 bg-white/95 p-6 sm:p-10 shadow-2xl backdrop-blur-2xl ring-1 ring-black/5">
          {children}
        </div>

        {/* Bottom Trust Badges */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-[11px] text-gray-400">
          <span className="flex items-center gap-1.5 rounded-full bg-white/5 border border-white/10 px-3 py-1">
            <ShieldCheck size={13} className="text-emerald-400" />
            Verified Ogige Traders
          </span>
          <span className="flex items-center gap-1.5 rounded-full bg-white/5 border border-white/10 px-3 py-1">
            <Zap size={13} className="text-amber-400" />
            Campus Hostel Delivery
          </span>
          <span className="flex items-center gap-1.5 rounded-full bg-white/5 border border-white/10 px-3 py-1">
            <Sparkles size={13} className="text-teal-400" />
            Zero Commission
          </span>
        </div>
      </div>
    </div>
  );
}

export default AuthLayout;
