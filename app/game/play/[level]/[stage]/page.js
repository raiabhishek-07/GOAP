"use client";
import React, { use } from "react";
import { useRouter } from "next/navigation";

/**
 * PlayPage — The gameplay overlay.
 * Phaser handles all rendering and HUD in the background (via layout.js).
 * This React layer provides escape/abort controls.
 */
export default function PlayPage({ params }) {
    const { level, stage } = use(params);
    const router = useRouter();

    return (
        <div className="absolute inset-0 pointer-events-none">
            {/* Phaser game is rendering in the background layer (layout.js) */}

            {/* Abort / Back to Select button */}
            <div className="absolute top-6 right-8 pointer-events-auto z-50">
                <button
                    onClick={() => router.push('/game/select')}
                    className="group relative px-6 py-2 bg-slate-900/60 border border-white/10 hover:border-red-500/50 transition-all duration-300 backdrop-blur-sm"
                >
                    <div className="absolute top-0 left-0 w-1 h-1 bg-white/20 group-hover:bg-red-500" />
                    <div className="absolute bottom-0 right-0 w-1 h-1 bg-white/20 group-hover:bg-red-500" />
                    <span className="text-[9px] font-black tracking-[0.2em] text-slate-500 group-hover:text-red-400 uppercase">
                        Abort_Mission
                    </span>
                </button>
            </div>
        </div>
    );
}
