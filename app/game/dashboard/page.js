"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { SaveSystem } from "../../lib/game/SaveSystem";
import { TacticalPanel, TacticalStat, TacticalProgressBar } from "../../components/game/TacticalUI";

/**
 * Tactical Command Dashboard
 * Central hub for player progress and mission oversight.
 */
export default function CommandDashboard() {
    const router = useRouter();
    const [summary, setSummary] = useState(null);
    const [currentTime, setCurrentTime] = useState("");

    useEffect(() => {
        try {
            setSummary(SaveSystem.getProgressionSummary());
        } catch (e) {
            // Fallback if save system has issues
            setSummary({
                completionPercent: 0,
                cognitiveAverages: { planning: 0, adaptability: 0, efficiency: 0 },
                stats: { highestRank: 'INITIATE', totalKills: 0, totalTasksCompleted: 0, totalTimeSeconds: 0, totalScore: 0, gamesPlayed: 0 },
                abilities: {}
            });
        }

        const tick = () => {
            const now = new Date();
            setCurrentTime(now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }));
        };
        tick();
        const timer = setInterval(tick, 1000);
        return () => clearInterval(timer);
    }, []);

    if (!summary) return null;

    const safeStats = summary.stats || {};
    const safeCog = summary.cognitiveAverages || {};

    return (
        <div className="flex flex-col min-h-screen bg-slate-950/60 text-slate-200 p-8 space-y-8 animate-in fade-in duration-700">
            {/* Header / ID Bar */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-white/10 pb-6 gap-4">
                <div className="flex gap-6 items-center">
                    <div className="w-14 h-14 border-2 border-emerald-500/50 flex items-center justify-center bg-black/40 rotate-45 shrink-0">
                        <span className="-rotate-45 text-xl">◈</span>
                    </div>
                    <div className="flex flex-col">
                        <h1 className="text-2xl font-black tracking-[0.4em] text-white uppercase">COMMAND_HUB</h1>
                        <span className="text-[10px] font-mono text-emerald-500 tracking-[0.2em] uppercase">Status: Authorization_Verified</span>
                    </div>
                </div>

                <div className="flex gap-8 sm:gap-12 text-right">
                    <div className="flex flex-col">
                        <span className="text-[9px] font-black text-slate-500 tracking-widest uppercase mb-1">Local Time</span>
                        <span className="text-lg font-mono font-black text-emerald-400">{currentTime}</span>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[9px] font-black text-slate-500 tracking-widest uppercase mb-1">Neural Rank</span>
                        <span className="text-lg font-mono font-black text-white">{safeStats.highestRank || 'INITIATE'}</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 flex-1">
                {/* Left Column - Core Metrics */}
                <div className="md:col-span-4 space-y-6">
                    <TacticalPanel title="OPERATIONAL_SYNC">
                        <div className="space-y-5 pt-2">
                            <TacticalProgressBar label="Overall Completion" val={summary.completionPercent || 0} color="emerald" />
                            <TacticalProgressBar label="Adaptability Index" val={safeCog.adaptability || 0} color="amber" />
                            <TacticalProgressBar label="Strategic Depth" val={safeCog.planning || 0} color="blue" />
                        </div>
                    </TacticalPanel>

                    <TacticalPanel title="SYSTEM_ALERTS">
                        <div className="space-y-3 font-mono text-[9px] text-slate-400">
                            <div className="flex gap-2">
                                <span className="text-emerald-500">[OK]</span>
                                <span>Neural link stability at 98.4%</span>
                            </div>
                            <div className="flex gap-2">
                                <span className="text-amber-500">[!]</span>
                                <span>New mission profile detected in Sector 2</span>
                            </div>
                            <div className="flex gap-2 text-slate-600">
                                <span>[INFO]</span>
                                <span>Auto-save sequence complete</span>
                            </div>
                        </div>
                    </TacticalPanel>
                </div>

                {/* Right Column - Mission Control & Launch */}
                <div className="md:col-span-8 flex flex-col gap-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <NavCard
                            onClick={() => router.push('/game/select')}
                            icon="⚔"
                            title="Solo Campaign"
                            desc="Deploy against advanced AI agents in tactical scenarios."
                            cta="LAUNCH_SELECTOR"
                            accentClass="bg-emerald-950/20 border-emerald-500/30 hover:border-emerald-500"
                            ctaClass="border-emerald-500/50 group-hover:bg-emerald-500"
                            titleClass="text-emerald-400"
                        />
                        <NavCard
                            onClick={() => router.push('/game/open-world')}
                            icon="🌍"
                            title="Open World"
                            desc="Explore a vast 1km procedural battleground with AI agents."
                            cta="ENTER_WORLD"
                            accentClass="bg-purple-950/20 border-purple-500/30 hover:border-purple-500"
                            ctaClass="border-purple-500/50 group-hover:bg-purple-500"
                            titleClass="text-purple-400"
                        />
                        <NavCard
                            onClick={() => router.push('/game/lobby')}
                            icon="📡"
                            title="Multiplayer"
                            desc="Connect with other operatives via tactical network links."
                            cta="OPEN_NETWORK"
                            accentClass="bg-blue-950/20 border-blue-500/30 hover:border-blue-500"
                            ctaClass="border-blue-500/50 group-hover:bg-blue-500"
                            titleClass="text-blue-400"
                        />
                        <NavCard
                            onClick={() => router.push('/game/select')}
                            icon="🎯"
                            title="Mission Select"
                            desc="Browse tiers & deploy to any unlocked mission zone."
                            cta="OPEN_MISSIONS"
                            accentClass="bg-amber-950/20 border-amber-500/30 hover:border-amber-500"
                            ctaClass="border-amber-500/50 group-hover:bg-amber-500"
                            titleClass="text-amber-400"
                        />
                        <NavCard
                            onClick={() => router.push('/game/stats')}
                            icon="👤"
                            title="Operative Dossier"
                            desc="Career metrics, neural analysis, and combat certifications."
                            cta="ACCESS_FILE"
                            accentClass="bg-slate-900/40 border-white/5 hover:border-white/20"
                            ctaClass="border-white/20 group-hover:bg-white"
                            titleClass="text-white"
                        />
                    </div>

                    <TacticalPanel title="RECENT_PERFORMANCE">
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 py-2">
                            <TacticalStat label="Total Kills" value={safeStats.totalKills || 0} icon="🎯" />
                            <TacticalStat label="Tasks Finished" value={safeStats.totalTasksCompleted || 0} icon="⚙" />
                            <TacticalStat label="Mission Time" value={`${((safeStats.totalTimeSeconds || 0) / 60).toFixed(1)}m`} icon="⏱" />
                            <TacticalStat label="Rank Pts" value={safeStats.totalScore || 0} icon="⭐" />
                        </div>
                    </TacticalPanel>

                    <div className="flex gap-4 mt-auto">
                        <button
                            onClick={() => router.push('/game/settings')}
                            className="flex-1 py-4 border border-white/5 bg-black/20 text-[10px] font-black tracking-widest text-slate-500 hover:text-white hover:bg-white/5 transition-all uppercase"
                        >
                            ⚙ Settings
                        </button>
                        <button className="flex-1 py-4 border border-white/5 bg-black/20 text-[10px] font-black tracking-widest text-slate-500 hover:text-white hover:bg-white/5 transition-all uppercase">
                            📁 Archives
                        </button>
                        <button
                            onClick={() => router.push('/game')}
                            className="px-6 py-4 border border-red-500/30 text-red-500 text-[10px] font-black tracking-widest hover:bg-red-500 hover:text-black transition-all uppercase"
                        >
                            Log Out
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

function NavCard({ onClick, icon, title, desc, cta, accentClass, ctaClass, titleClass }) {
    return (
        <button
            onClick={onClick}
            className={`group relative h-44 ${accentClass} border overflow-hidden transition-all text-left p-5`}
        >
            <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                <span className="text-7xl">{icon}</span>
            </div>
            <h3 className={`text-lg font-black tracking-widest ${titleClass} mb-2 uppercase`}>{title}</h3>
            <p className="text-[10px] text-slate-400 leading-relaxed w-3/4">{desc}</p>
            <div className={`absolute bottom-5 right-5 px-3 py-1.5 border ${ctaClass} group-hover:text-black transition-all`}>
                <span className="text-[9px] font-black tracking-widest">{cta}</span>
            </div>
        </button>
    );
}
