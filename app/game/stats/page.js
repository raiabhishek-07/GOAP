"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { SaveSystem } from "../../../lib/game/SaveSystem";
import { switchScene } from "../../../components/game/GameClient";
import { TacticalPanel, TacticalStat, TacticalProgressBar } from "../../../components/game/TacticalUI";

export default function StatsPage() {
    const router = useRouter();
    const [summary, setSummary] = useState(null);

    useEffect(() => {
        setSummary(SaveSystem.getProgressionSummary());
        switchScene('StatsScene');
    }, []);

    return (
        <div className="min-h-screen flex flex-col bg-transparent p-12">
            {/* Header */}
            <header className="w-full max-w-6xl mx-auto mb-16 animate-in fade-in slide-in-from-top duration-700">
                <div className="flex items-end justify-between border-b border-white/10 pb-4">
                    <div>
                        <h2 className="text-4xl font-black tracking-[0.3em] text-white uppercase">
                            Operational Dossier
                        </h2>
                        <p className="text-[10px] font-black tracking-[0.4em] text-emerald-500/60 uppercase mt-2">
                            Career Metrics 📋 Neural Progress 📋 Tactical Archives
                        </p>
                    </div>
                    <div className="text-right">
                        <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">Operator Code</span>
                        <div className="text-xs font-black text-white tracking-widest">OP_7-VETERAN-II</div>
                    </div>
                </div>
            </header>

            <main className="w-full max-w-6xl mx-auto grid grid-cols-12 gap-10 animate-in fade-in zoom-in duration-700 delay-200">

                {/* Left Column: Profile */}
                <div className="col-span-12 lg:col-span-4 flex flex-col gap-8">
                    <TacticalPanel title="SERVICE RECORD">
                        <div className="flex flex-col items-center py-6">
                            <div className="relative w-28 h-28 mb-6">
                                <div className="absolute inset-0 border border-emerald-500/20 rounded-full animate-spin-slow" />
                                <div className="absolute inset-2 border border-emerald-500/40 rounded-full" />
                                <div className="absolute inset-4 bg-slate-800 rounded-full flex items-center justify-center text-4xl border border-white/10 shadow-[0_0_20px_rgba(16,185,129,0.15)]">
                                    👤
                                </div>
                            </div>
                            <h3 className="text-xl font-black text-white tracking-[0.2em] uppercase">OPERATIVE_07</h3>
                            <span className="text-[9px] font-black text-emerald-500 uppercase tracking-[0.3em] mt-2">CLASS: {summary?.stats.highestRank || 'VETERAN'}</span>
                        </div>

                        <div className="mt-6 space-y-6">
                            <TacticalProgressBar label="Neural Sync" val={summary?.completionPercent || 0} color="emerald" />
                            <TacticalProgressBar label="Tactical Planning" val={summary?.cognitiveAverages.planning || 0} color="amber" />
                            <TacticalProgressBar label="Combat Survival" val={summary?.cognitiveAverages.adaptability || 0} color="blue" />
                        </div>
                    </TacticalPanel>
                </div>

                {/* Right Column: Detailed Stats */}
                <div className="col-span-12 lg:col-span-8 flex flex-col gap-10">
                    <div className="grid grid-cols-2 gap-8">
                        <TacticalPanel title="MISSION LOGS">
                            <div className="space-y-4">
                                <StatsRow label="Operations Conducted" val={summary?.stats.gamesPlayed || 0} />
                                <StatsRow label="Completion Rate" val={`${summary?.completionPercent || 0}%`} />
                                <StatsRow label="Tactical Failures" val={summary?.stats.totalMissionsFailed || 0} />
                            </div>
                        </TacticalPanel>
                        <TacticalPanel title="HOSTILE ENGAGEMENTS">
                            <div className="space-y-4">
                                <StatsRow label="Automata Defeated" val={summary?.stats.totalKills || 0} />
                                <StatsRow label="Neural Deaths" val={summary?.stats.totalDeaths || 0} />
                                <StatsRow label="Tasks Optimized" val={summary?.stats.totalTasksCompleted || 0} />
                            </div>
                        </TacticalPanel>
                    </div>

                    <TacticalPanel title="SYSTEM ENHANCEMENTS" className="flex-1">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                            <AbilitySlot icon="⚡" name="Dash" unlocked={summary?.abilities.scanner} color="emerald" />
                            <AbilitySlot icon="👁️" name="Intel Ping" unlocked={summary?.abilities.quickHack} color="amber" />
                            <AbilitySlot icon="🛡️" name="Cloak" unlocked={summary?.abilities.ironWill} color="blue" />
                            <AbilitySlot icon="📡" name="Distract" unlocked={summary?.abilities.pathfinder} color="slate" />
                        </div>
                    </TacticalPanel>
                </div>
            </main>

            {/* Back Button */}
            <button
                onClick={() => router.push('/game')}
                className="mx-auto mt-20 text-[10px] font-black tracking-[0.3em] text-slate-600 hover:text-emerald-500 transition-colors uppercase flex items-center gap-3 animate-in fade-in duration-700 delay-500"
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
            <span className="text-md font-mono font-black text-white">{val}</span>
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
        <div className={`group relative flex flex-col items-center p-6 border transition-all duration-300 ${unlocked ? borderColors[color || 'emerald'] : 'border-white/5 grayscale opacity-30'}`}>
            {unlocked && (
                <>
                    <div className="absolute top-0 left-0 w-1 h-1 bg-current" />
                    <div className="absolute bottom-0 right-0 w-1 h-1 bg-current" />
                </>
            )}
            <span className="text-3xl mb-3 group-hover:scale-110 transition-transform">{icon}</span>
            <span className="text-[9px] font-black tracking-[0.2em] text-white uppercase">{name}</span>
            <span className="text-[7px] font-black mt-2 tracking-widest uppercase opacity-40">
                {unlocked ? 'Clearance Active' : 'Restricted'}
            </span>
        </div>
    );
}
