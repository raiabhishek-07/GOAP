"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { MIND_ARENA_LEVELS, isStageUnlocked, isLevelUnlocked } from "../../lib/game/LevelConfig";
import { SaveSystem } from "../../lib/game/SaveSystem";
import { TacticalPanel, TacticalStat, TacticalProgressBar } from "../../components/game/TacticalUI";

export default function MissionSelectDashboard() {
    const router = useRouter();
    const [activeLevel, setActiveLevel] = useState(1);
    const [progress, setProgress] = useState({});
    const [summary, setSummary] = useState(null);

    useEffect(() => {
        try {
            const p = SaveSystem.getProgress();
            setProgress(p);
            setSummary(SaveSystem.getProgressionSummary());
        } catch (e) {
            setProgress({});
            setSummary(null);
        }
    }, []);

    const level = MIND_ARENA_LEVELS[activeLevel];

    // Gather all unlocked stages for quick deploy
    const allUnlocked = [];
    for (const [lk, lv] of Object.entries(MIND_ARENA_LEVELS)) {
        const ln = parseInt(lk);
        for (const [sk] of Object.entries(lv.stages)) {
            const sn = parseInt(sk);
            if (isStageUnlocked(ln, sn, progress)) {
                allUnlocked.push({ ln, sn });
            }
        }
    }

    const launchRandom = () => {
        if (allUnlocked.length === 0) return;
        const pick = allUnlocked[Math.floor(Math.random() * allUnlocked.length)];
        router.push(`/game/briefing/${pick.ln}/${pick.sn}`);
    };

    return (
        <div className="flex flex-col min-h-screen bg-slate-950/40 text-slate-200 p-8 pt-12">
            {/* Top Stat Bar */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-12 border-b border-white/5 pb-6 gap-4 animate-in fade-in slide-in-from-top duration-700">
                <div className="flex flex-col">
                    <h1 className="text-3xl font-black tracking-[0.4em] text-white uppercase">
                        Mission_Control
                    </h1>
                    <div className="flex items-center gap-4 mt-2">
                        <span className="text-[10px] font-mono text-emerald-500 font-bold tracking-widest uppercase animate-pulse">
                            System Status: Ready
                        </span>
                        <div className="w-1 h-1 rounded-full bg-emerald-500" />
                        <span className="text-[10px] font-mono text-slate-500 tracking-widest uppercase">
                            Operator: Guest_User_Alpha
                        </span>
                    </div>
                </div>

                <div className="flex gap-6 items-center">
                    {/* Quick Deploy Button */}
                    <button
                        onClick={launchRandom}
                        className="group flex items-center gap-3 px-6 py-3 border border-amber-500/30 bg-amber-500/5 hover:border-amber-500 hover:bg-amber-500/10 transition-all active:scale-95"
                        title="Randomly deploy to any unlocked mission"
                    >
                        <span className="text-xl group-hover:animate-bounce">🎲</span>
                        <div className="flex flex-col">
                            <span className="text-[10px] font-black tracking-widest text-amber-400 uppercase">Quick Deploy</span>
                            <span className="text-[8px] text-slate-500 tracking-wider uppercase">{allUnlocked.length} available</span>
                        </div>
                    </button>

                    {summary && (
                        <div className="hidden sm:flex gap-8">
                            <div className="w-48">
                                <TacticalProgressBar
                                    label="Overall Completion"
                                    val={summary.completionPercent || 0}
                                    color="emerald"
                                />
                            </div>
                            <div className="flex flex-col items-end">
                                <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Career Score</span>
                                <span className="text-xl font-mono font-black text-white">{summary.stats?.averageScore || 0}</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 flex-1">
                {/* Left Sidebar - Levels */}
                <div className="lg:col-span-1 space-y-4 animate-in fade-in slide-in-from-left duration-700 delay-200">
                    <h2 className="text-[10px] font-black tracking-[0.3em] text-slate-500 uppercase mb-6 px-2">Operational Tiers</h2>
                    {[1, 2, 3].map((num) => {
                        const l = MIND_ARENA_LEVELS[num];
                        const unlocked = isLevelUnlocked(num, progress);
                        const active = activeLevel === num;

                        return (
                            <button
                                key={num}
                                onClick={() => unlocked && setActiveLevel(num)}
                                className={`
                                    w-full group relative flex flex-col p-4 transition-all duration-300
                                    border ${active ? 'bg-emerald-500/10 border-emerald-500/50' : 'bg-black/20 border-white/5 hover:border-white/20'}
                                    ${!unlocked && 'opacity-30 grayscale cursor-not-allowed'}
                                `}
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <span className="text-[8px] font-mono text-slate-500">TIER_0{num}</span>
                                    {unlocked ? (active && <span className="w-1 h-4 bg-emerald-500" />) : <span>🔒</span>}
                                </div>
                                <span className={`text-sm font-black tracking-[0.2em] uppercase ${active ? 'text-white' : 'text-slate-400'}`}>
                                    {l.name}
                                </span>
                                <span className="text-[9px] text-slate-600 mt-1 uppercase tracking-wider">{l.description || 'Neural link testing'}</span>
                            </button>
                        );
                    })}

                    <div className="mt-12 p-4 border border-white/5 bg-black/20">
                        <span className="text-[8px] font-black text-slate-600 uppercase tracking-[0.2em] mb-4 block underline">Terminal Hints</span>
                        <p className="text-[9px] text-slate-500 leading-relaxed italic">
                            Observe agent belief patterns before initiating task priority. Adapt to neural shifts in Real-Time.
                        </p>
                    </div>

                    <button
                        onClick={() => router.push('/game/dashboard')}
                        className="w-full mt-auto py-3 text-[10px] font-black tracking-[0.3em] text-slate-600 hover:text-white border border-transparent hover:bg-white/5 transition-all uppercase"
                    >
                        ← Back to Command
                    </button>
                </div>

                {/* Main Content - Stages */}
                <div className="lg:col-span-3">
                    <div className="flex items-center justify-between mb-8 animate-in fade-in duration-700 delay-300">
                        <div className="flex gap-2 items-center">
                            <div className="px-3 py-1 bg-emerald-500 text-black text-[10px] font-black uppercase tracking-widest rounded-sm">
                                Level {activeLevel}
                            </div>
                            <h3 className="text-lg font-black tracking-[0.2em] text-white ml-2 uppercase">
                                Selected_Zones
                            </h3>
                        </div>
                        <span className="text-[10px] font-mono text-slate-500">
                            {Object.keys(level.stages).length} REGIONS
                        </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom duration-1000">
                        {Object.entries(level.stages).map(([sNum, stage], idx) => {
                            const stageNum = parseInt(sNum);
                            const unlocked = isStageUnlocked(activeLevel, stageNum, progress);
                            const stageProgress = progress[activeLevel]?.[stageNum] || null;

                            return (
                                <StageDashboardCard
                                    key={idx}
                                    levelNum={activeLevel}
                                    stageNum={stageNum}
                                    stage={stage}
                                    unlocked={unlocked}
                                    progress={stageProgress}
                                    onClick={() => unlocked && router.push(`/game/briefing/${activeLevel}/${stageNum}`)}
                                />
                            );
                        })}
                    </div>

                    {/* Ambient Visualization */}
                    <div className="mt-12 h-32 w-full relative overflow-hidden border border-white/5 bg-black/40 rounded-sm opacity-50">
                        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-px bg-emerald-500/20" />
                        <div className="flex justify-around items-end h-full p-4 pb-2">
                            {Array.from({ length: 48 }).map((_, i) => {
                                const seed = ((i * 1327 + 7) % 97) / 97;
                                const h = 10 + seed * 80;
                                const op = ((i * 31) % 7) > 3 ? 0.3 : 0.1;
                                return (
                                    <div
                                        key={i}
                                        className="w-1 bg-emerald-500/20 animate-pulse"
                                        style={{
                                            height: `${h.toFixed(1)}%`,
                                            animationDelay: `${i * 0.1}s`,
                                            opacity: op
                                        }}
                                    />
                                );
                            })}
                        </div>
                        <span className="absolute bottom-2 left-4 text-[7px] font-mono text-emerald-500/40 uppercase tracking-widest">Neural_Waveform_Active</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

function StageDashboardCard({ levelNum, stageNum, stage, unlocked, progress, onClick }) {
    return (
        <div
            onClick={onClick}
            className={`
                group relative flex flex-col bg-slate-900/40 border transition-all duration-300 p-5
                ${unlocked ? 'border-white/10 hover:border-emerald-500/50 cursor-pointer hover:-translate-y-1' : 'border-white/5 opacity-40 grayscale-[0.8]'}
            `}
        >
            {/* Corner Decorative */}
            <div className="absolute top-0 right-0 w-8 h-8 opacity-20 pointer-events-none overflow-hidden">
                <div className="absolute top-[-20px] right-[-20px] w-10 h-10 border border-white rotate-45" />
            </div>

            <div className="flex items-center gap-3 mb-4">
                <div className={`w-10 h-10 flex items-center justify-center font-mono font-black text-xs border ${unlocked ? 'border-emerald-500/50 text-emerald-400' : 'border-slate-800 text-slate-700'}`}>
                    {levelNum}.{stageNum}
                </div>
                <div className="flex flex-col">
                    <h4 className="text-xs font-black tracking-widest text-white uppercase">{stage.name}</h4>
                    <span className="text-[8px] font-bold text-slate-500 uppercase tracking-tighter">Sector Deployment</span>
                </div>
            </div>

            <p className="text-[10px] text-slate-500 italic mb-6 leading-relaxed line-clamp-2 min-h-[30px]">
                &quot;{stage.subtitle}&quot;
            </p>

            <div className="grid grid-cols-2 gap-4 mb-6">
                <TacticalStat label="Enemy Agents" value={stage.agents?.length || 0} icon="🤖" />
                <TacticalStat label="Tasks" value={stage.tasks?.length || 0} icon="📋" />
            </div>

            <div className="mt-auto pt-4 border-t border-white/5 flex items-center justify-between">
                {progress?.completed ? (
                    <>
                        <div className="flex flex-col">
                            <span className="text-[8px] font-black text-emerald-500 uppercase tracking-widest">Clearance: High</span>
                            <span className="text-[10px] font-mono font-black text-white">{progress.bestScore} PTS</span>
                        </div>
                        <div className="text-emerald-500 text-xl font-black">✓</div>
                    </>
                ) : (
                    <>
                        <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest">Status: {unlocked ? 'Awaiting Data' : 'Encrypted'}</span>
                        {unlocked && (
                            <div className="px-3 py-1 bg-transparent border border-emerald-500/50 group-hover:bg-emerald-500 group-hover:text-black transition-all">
                                <span className="text-[9px] font-black tracking-tighter">DEPLOY</span>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
