"use client";
import React from "react";
import { useRouter } from "next/navigation";
import { TacticalButton } from "../components/game/TacticalUI";

/**
 * MainMenuPage — Pure React main menu. No Phaser dependency.
 */
export default function MainMenuPage() {
    const router = useRouter();

    const navigateTo = (path) => {
        router.push(path);
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-transparent">
            {/* Logo Section */}
            <div className="mb-14 text-center animate-in fade-in slide-in-from-top duration-1000">
                <div className="relative inline-block px-12 py-6 border border-emerald-500/20 backdrop-blur-sm bg-black/40">
                    {/* Tactical Brackets */}
                    <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-emerald-500" />
                    <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-emerald-500" />

                    <div className="flex items-center justify-center mb-4">
                        <div className="w-12 h-[1px] bg-gradient-to-r from-transparent to-emerald-500 mr-4" />
                        <span className="text-2xl text-emerald-500 font-black animate-pulse tracking-[0.3em]">M N D R N</span>
                        <div className="w-12 h-[1px] bg-gradient-to-l from-transparent to-emerald-500 ml-4" />
                    </div>

                    <h1 className="text-5xl sm:text-6xl font-black tracking-[0.25em] text-white mb-2 ml-[0.25em]">
                        MINDARENA
                    </h1>
                    <p className="text-[10px] font-black tracking-[0.5em] text-emerald-500/60 uppercase">
                        Tactical GOAP Simulation
                    </p>
                </div>
            </div>

            {/* Buttons Section */}
            <div className="flex flex-col gap-3 w-full max-w-[320px] animate-in fade-in slide-in-from-bottom duration-1000 delay-300">
                <TacticalButton
                    label="Solo Campaign"
                    sub="Command hub & deployment"
                    color="emerald"
                    onClick={() => navigateTo('/game/dashboard')}
                />
                <TacticalButton
                    label="Open World"
                    sub="1km procedural battleground"
                    color="blue"
                    onClick={() => navigateTo('/game/open-world')}
                />
                <TacticalButton
                    label="Mission Select"
                    sub="Browse & deploy missions"
                    color="amber"
                    onClick={() => navigateTo('/game/select')}
                />
                <TacticalButton
                    label="Player Dossier"
                    sub="Combat metrics & data"
                    color="slate"
                    onClick={() => navigateTo('/game/stats')}
                />
            </div>

            {/* Footer Nav */}
            <div className="absolute bottom-12 flex gap-10 text-[9px] font-black tracking-[0.3em] text-slate-500 uppercase">
                <button
                    onClick={() => navigateTo('/game/settings')}
                    className="hover:text-amber-500 transition-all border-b border-transparent hover:border-amber-500/50 pb-1"
                >
                    Settings
                </button>
                <button className="hover:text-amber-400 transition-all border-b border-transparent hover:border-amber-400/50 pb-1">Archives</button>
                <button className="hover:text-slate-300 transition-all border-b border-transparent hover:border-slate-300/50 pb-1">Terminal</button>
            </div>

            <div className="absolute bottom-4 left-6 text-[8px] font-mono text-slate-700 tracking-widest uppercase">
                System: Stable | Core: GOAP-v2.1 | Link: Established
            </div>
        </div>
    );
}
