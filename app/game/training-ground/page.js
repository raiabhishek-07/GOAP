"use client";
import React from "react";
import { useRouter } from "next/navigation";

export default function TrainingGroundPage() {
    const router = useRouter();

    return (
        <div className="absolute inset-0 pointer-events-none">
            {/* Phaser handles the game in the background */}
            <div className="absolute top-6 right-8 pointer-events-auto z-50">
                <button
                    onClick={() => router.push('/game/dashboard')}
                    className="group relative px-6 py-2 bg-slate-900/60 border border-white/10 hover:border-orange-500/50 transition-all duration-300 backdrop-blur-sm"
                >
                    <div className="absolute top-0 left-0 w-1 h-1 bg-white/20 group-hover:bg-orange-500" />
                    <div className="absolute bottom-0 right-0 w-1 h-1 bg-white/20 group-hover:bg-orange-500" />
                    <span className="text-[9px] font-black tracking-[0.2em] text-slate-500 group-hover:text-orange-400 uppercase">
                        Abort_Training
                    </span>
                </button>
            </div>
        </div>
    );
}
