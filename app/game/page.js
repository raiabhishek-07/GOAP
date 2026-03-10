"use client";
import React from "react";
import { useRouter } from "next/navigation";

/**
 * MainMenuPage — Ultra-premium entry point for the simulation.
 */
export default function MainMenuPage() {
    const router = useRouter();

    return (
        <div className="relative flex flex-col items-center justify-center min-h-screen bg-[#020617] overflow-hidden">
            {/* Holographic Background Elements */}
            <div className="absolute inset-0 z-0">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(16,185,129,0.05),transparent_70%)]" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-500/5 blur-[120px] rounded-full animate-pulse" />
                <div className="absolute inset-0 opacity-[0.03]"
                    style={{ backgroundImage: 'linear-gradient(#10b981 1px, transparent 1px), linear-gradient(90deg, #10b981 1px, transparent 1px)', backgroundSize: '50px 50px' }}
                />
            </div>

            {/* Central Scanner Motif */}
            <div className="relative z-10 flex flex-col items-center">
                <div className="relative mb-12 group cursor-pointer">
                    {/* Hexagonal Frame */}
                    <div className="w-48 h-48 border border-emerald-500/20 rotate-45 flex items-center justify-center relative backdrop-blur-md bg-black/20 group-hover:border-emerald-500/50 transition-all duration-700">
                        <div className="absolute inset-2 border border-emerald-500/10 group-hover:scale-110 transition-transform duration-1000" />

                        {/* Inner Content */}
                        <div className="-rotate-45 flex flex-col items-center">
                            <span className="text-4xl text-emerald-500 font-thin mb-1">◊</span>
                            <span className="text-[8px] font-mono text-emerald-500/50 tracking-[0.5em] uppercase">Auth_Req</span>
                        </div>
                    </div>

                    {/* Orbiting Elements */}
                    <div className="absolute -inset-8 border border-emerald-500/5 rounded-full animate-[spin_10s_linear_infinite]" />
                    <div className="absolute -inset-16 border border-emerald-500/5 rounded-full animate-[spin_15s_linear_infinite_reverse]" />
                </div>

                {/* Typography */}
                <div className="text-center space-y-4 mb-16 px-4">
                    <h1 className="text-6xl sm:text-8xl font-black tracking-[0.4em] text-white uppercase drop-shadow-[0_0_15px_rgba(16,185,129,0.3)]">
                        MIND<span className="text-emerald-500">ARENA</span>
                    </h1>
                    <div className="flex items-center justify-center gap-6">
                        <div className="h-[1px] w-20 bg-gradient-to-r from-transparent to-emerald-500/50" />
                        <span className="text-[10px] font-mono text-emerald-500 tracking-[0.8em] uppercase">Tactical_Intelligence_OS</span>
                        <div className="h-[1px] w-20 bg-gradient-to-l from-transparent to-emerald-500/50" />
                    </div>
                </div>

                {/* Primary Action */}
                <button
                    onClick={() => router.push('/game/dashboard')}
                    className="group relative px-12 py-5 overflow-hidden border border-emerald-500/30 bg-black/40 hover:border-emerald-500 transition-all duration-500"
                >
                    <div className="absolute inset-0 w-full h-full bg-emerald-500/0 group-hover:bg-emerald-500/10 transition-colors" />

                    {/* Corner Brackets */}
                    <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-emerald-500" />
                    <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-emerald-500" />

                    <div className="relative flex flex-col items-center">
                        <span className="text-lg font-black tracking-[0.3em] text-white uppercase group-hover:scale-105 transition-transform">
                            Initialize_System
                        </span>
                        <span className="text-[8px] font-mono text-emerald-500/50 mt-1 uppercase tracking-widest group-hover:text-emerald-500">
                            Confirm Identity & Deployment
                        </span>
                    </div>

                    {/* Animated Progress Bar at bottom */}
                    <div className="absolute bottom-0 left-0 h-[2px] bg-emerald-500/50 w-full animate-[loading_2s_infinite]" />
                </button>
            </div>

            {/* Footer Intel */}
            <div className="absolute bottom-8 left-8 flex flex-col gap-2 font-mono text-[8px] text-slate-500 uppercase tracking-widest z-10">
                <span>Core_Version: 3.8.4_ALPHA</span>
                <span>Kernel_Status: OPTIMIZED</span>
            </div>

            <div className="absolute bottom-8 right-8 flex gap-4 font-mono text-[8px] text-slate-500 uppercase tracking-widest z-10">
                <span className="text-emerald-500/50 animate-pulse">● CONNECTION_STABLE</span>
                <span>SECURED_LINK_V7</span>
            </div>

            <style jsx>{`
                @keyframes loading {
                    0% { transform: translateX(-100%); }
                    100% { transform: translateX(100%); }
                }
            `}</style>
        </div>
    );
}
