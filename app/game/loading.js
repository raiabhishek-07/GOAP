"use client";
import React from "react";

/**
 * Tactical Loading Screen — Next.js Suspense Loading
 * This component is automatically shown by Next.js while game pages are loading.
 */
export default function GameLoading() {
    return (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#020617]">
            {/* Background elements */}
            <div className="absolute inset-0 opacity-10">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.2),transparent_70%)]" />
                <div className="h-full w-full bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px]" />
            </div>

            <div className="relative flex flex-col items-center">
                {/* Spinning Loader */}
                <div className="relative w-28 h-28 mb-10">
                    <div className="absolute inset-0 border-2 border-emerald-500/20 rounded-full animate-ping" style={{ animationDuration: '2s' }} />
                    <div className="absolute inset-2 border border-emerald-500/40 rounded-full animate-pulse" />
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-14 h-14 border-t-2 border-r-2 border-emerald-500 animate-spin" />
                    </div>

                    {/* Decorative markers */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 w-1 h-3 bg-emerald-500" />
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-2 w-1 h-3 bg-emerald-500" />
                </div>

                {/* Progress Text */}
                <div className="text-center">
                    <h2 className="text-lg font-black tracking-[0.4em] text-white mb-2 ml-[0.4em]">
                        SYNCHRONIZING
                    </h2>
                    <div className="flex items-center gap-3">
                        <div className="w-20 h-[1px] bg-gradient-to-r from-transparent to-emerald-500" />
                        <span className="text-[10px] font-mono text-emerald-500/60 tracking-[0.2em] animate-pulse">
                            ESTABLISHING_NEURAL_LINK
                        </span>
                        <div className="w-20 h-[1px] bg-gradient-to-l from-transparent to-emerald-500" />
                    </div>
                </div>

                {/* Status Log */}
                <div className="mt-10 w-60 overflow-hidden text-[8px] font-mono text-slate-600 flex flex-col gap-1 items-center">
                    <span className="animate-pulse">{">> "}MOUNTING_GOAP_CORE... OK</span>
                    <span className="animate-pulse" style={{ animationDelay: '0.2s' }}>{">> "}LOADING_BATTLE_ASSETS... OK</span>
                    <span className="animate-pulse" style={{ animationDelay: '0.4s' }}>{">> "}CALIBRATING_PERCEPTION_MODULE... OK</span>
                    <span className="animate-pulse" style={{ animationDelay: '0.6s' }}>{">> "}HANDSHAKE_PROTOCOL_ACTIVE...</span>
                </div>
            </div>
        </div>
    );
}
