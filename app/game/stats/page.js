"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { SaveSystem } from "../../lib/game/SaveSystem";
import { TacticalPanel, TacticalStat, TacticalProgressBar } from "../../components/game/TacticalUI";

export default function StatsPage() {
    const router = useRouter();
    const [summary, setSummary] = useState(null);

    useEffect(() => {
        try {
            setSummary(SaveSystem.getProgressionSummary());
        } catch (e) {
            setSummary({
                completionPercent: 0,
                cognitiveAverages: { planning: 0, adaptability: 0, efficiency: 0 },
                stats: { highestRank: 'INITIATE', gamesPlayed: 0, totalKills: 0, totalDeaths: 0, totalTasksCompleted: 0, totalMissionsFailed: 0 },
                abilities: { scanner: false, quickHack: false, ironWill: false, pathfinder: false }
            });
        }
    }, []);

    const safeStats = summary?.stats || {};
    const safeCog = summary?.cognitiveAverages || {};
    const safeAbilities = summary?.abilities || {};

    return (
        <div className="min-h-screen flex flex-col bg-slate-950/60 text-slate-200 p-8 lg:p-12">
            {/* Header */}
            <header className="w-full max-w-6xl mx-auto mb-12 animate-in fade-in slide-in-from-top duration-700">
                <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between border-b border-white/10 pb-4 gap-4">
                    <div>
                        <h2 className="text-3xl font-black tracking-[0.3em] text-white uppercase">
                            Operational Dossier
                        </h2>
                        <p className="text-[10px] font-black tracking-[0.3em] text-emerald-500/60 uppercase mt-2">
                            Career Metrics &middot; Neural Progress &middot; Tactical Archives
                        </p>
                    </div>
                    <div className="text-right">
                        <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">Operator Code</span>
                        <div className="text-xs font-black text-white tracking-widest">OP_7-{safeStats.highestRank || 'INITIATE'}</div>
                    </div>
                </div>
            </header>

            <main className="w-full max-w-6xl mx-auto grid grid-cols-12 gap-8 animate-in fade-in duration-700 delay-200">

                {/* Left Column: Profile */}
                <div className="col-span-12 lg:col-span-4 flex flex-col gap-8">
                    <TacticalPanel title="SERVICE RECORD">
                        <div className="flex flex-col items-center py-6">
                            <div className="relative w-24 h-24 mb-6">
                                <div className="absolute inset-0 border border-emerald-500/20 rounded-full animate-[spin_8s_linear_infinite]" />
                                <div className="absolute inset-2 border border-emerald-500/40 rounded-full" />
                                <div className="absolute inset-4 bg-slate-800 rounded-full flex items-center justify-center text-3xl border border-white/10 shadow-[0_0_20px_rgba(16,185,129,0.15)]">
                                    👤
                                </div>
                            </div>
                            <h3 className="text-lg font-black text-white tracking-[0.2em] uppercase">OPERATIVE_07</h3>
                            <span className="text-[9px] font-black text-emerald-500 uppercase tracking-[0.3em] mt-2">CLASS: {safeStats.highestRank || 'INITIATE'}</span>
                        </div>

                        <div className="mt-4 space-y-5">
                            <TacticalProgressBar label="Neural Sync" val={summary?.completionPercent || 0} color="emerald" />
                            <TacticalProgressBar label="Tactical Planning" val={safeCog.planning || 0} color="amber" />
                            <TacticalProgressBar label="Combat Survival" val={safeCog.adaptability || 0} color="blue" />
                        </div>
                    </TacticalPanel>
                </div>

                {/* Right Column: Detailed Stats */}
                <div className="col-span-12 lg:col-span-8 flex flex-col gap-8">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <TacticalPanel title="MISSION LOGS">
                            <div className="space-y-4">
                                <StatsRow label="Operations Conducted" val={safeStats.gamesPlayed || 0} />
                                <StatsRow label="Completion Rate" val={`${summary?.completionPercent || 0}%`} />
                                <StatsRow label="Tactical Failures" val={safeStats.totalMissionsFailed || 0} />
                            </div>
                        </TacticalPanel>
                        <TacticalPanel title="HOSTILE ENGAGEMENTS">
                            <div className="space-y-4">
                                <StatsRow label="Automata Defeated" val={safeStats.totalKills || 0} />
                                <StatsRow label="Neural Deaths" val={safeStats.totalDeaths || 0} />
                                <StatsRow label="Tasks Optimized" val={safeStats.totalTasksCompleted || 0} />
                            </div>
                        </TacticalPanel>
                    </div>

                    <TacticalPanel title="SYSTEM ENHANCEMENTS" className="flex-1">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
                            <AbilitySlot icon="⚡" name="Dash" unlocked={safeAbilities.scanner} color="emerald" />
                            <AbilitySlot icon="👁️" name="Intel Ping" unlocked={safeAbilities.quickHack} color="amber" />
                            <AbilitySlot icon="🛡️" name="Cloak" unlocked={safeAbilities.ironWill} color="blue" />
                            <AbilitySlot icon="📡" name="Distract" unlocked={safeAbilities.pathfinder} color="slate" />
                        </div>
                    </TacticalPanel>
                </div>
            </main>

            {/* Back Button */}
            <button
                onClick={() => router.push('/game/dashboard')}
                className="mx-auto mt-12 text-[10px] font-black tracking-[0.3em] text-slate-600 hover:text-emerald-500 transition-colors uppercase flex items-center gap-3 animate-in fade-in duration-700 delay-500"
            >
                <div className="w-8 h-[1px] bg-current" />
                Return to Command
            </button>
        </div>
    );
}

function StatsRow({ label, val }) {
    return (
        <div className="flex justify-between items-end border-b border-white/5 pb-2">
            <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest">{label}</span>
            <span className="text-sm font-mono font-black text-white">{val}</span>
        </div>
    );
}

function AbilitySlot({ icon, name, unlocked, color }) {
    const borderColors = {
        emerald: "border-emerald-500/20 bg-emerald-500/5 text-emerald-500",
        amber: "border-amber-500/20 bg-amber-500/5 text-amber-500",
        blue: "border-blue-500/20 bg-blue-500/5 text-blue-500",
        slate: "border-white/5 bg-white/5 text-slate-700",
    };

    return (
        <div className={`group relative flex flex-col items-center p-5 border transition-all duration-300 ${unlocked ? borderColors[color || 'emerald'] : 'border-white/5 grayscale opacity-30'}`}>
            {unlocked && (
                <>
                    <div className="absolute top-0 left-0 w-1 h-1 bg-current" />
                    <div className="absolute bottom-0 right-0 w-1 h-1 bg-current" />
                </>
            )}
            <span className="text-2xl mb-2 group-hover:scale-110 transition-transform">{icon}</span>
            <span className="text-[9px] font-black tracking-[0.2em] text-white uppercase">{name}</span>
            <span className="text-[7px] font-black mt-1 tracking-widest uppercase opacity-40">
                {unlocked ? 'Clearance Active' : 'Restricted'}
            </span>
        </div>
    );
}
