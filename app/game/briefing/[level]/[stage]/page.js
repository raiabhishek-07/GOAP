"use client";
import React, { use, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getStageConfig, MIND_ARENA_LEVELS, AGENT_META } from "../../../../lib/game/LevelConfig";
import { TASK_META } from "../../../../lib/game/TaskSystem";
import { switchScene } from "../../../../components/game/GameClient";
import { TacticalPanel, TacticalButton, TacticalStat } from "../../../../components/game/TacticalUI";

export default function BriefingPage({ params }) {
    const { level, stage } = use(params);
    const router = useRouter();
    const config = getStageConfig(level, stage);
    const levelMeta = MIND_ARENA_LEVELS[level];

    useEffect(() => {
        switchScene('BriefingScene', { level, stage });
    }, [level, stage]);

    if (!config) return <div className="p-20 text-center">Config Not Found</div>;

    const deploy = () => {
        router.push(`/game/play/${level}/${stage}`);
    };

    return (
        <div className="min-h-screen flex flex-col bg-transparent text-slate-200">
            {/* Header Bar */}
            <header className="bg-black/40 border-b border-white/10 py-6 px-12 flex items-center justify-between animate-in fade-in slide-in-from-top duration-700 backdrop-blur-sm relative overflow-hidden">
                <div className="absolute top-0 left-0 w-2 h-full bg-emerald-500/50" />

                <div>
                    <span className="text-[10px] font-black tracking-[0.5em] text-emerald-500 mb-1 block uppercase opacity-60">Mission Parameters</span>
                    <h1 className="text-3xl font-black tracking-widest text-white uppercase">
                        {config.name} — <span className="text-slate-500">{config.subtitle}</span>
                    </h1>
                </div>

                <div className="text-right">
                    <div className="text-[9px] font-mono text-slate-500 uppercase tracking-widest mb-1">Authorization Code</div>
                    <div className="text-xs font-black text-white tracking-widest bg-emerald-500/10 px-3 py-1 border border-emerald-500/30">L{level}-S{stage}-BETA</div>
                </div>
            </header>

            <main className="flex-1 p-8 max-w-7xl mx-auto w-full grid grid-cols-12 gap-8 animate-in fade-in zoom-in duration-700 delay-200">

                {/* Left Column: Tactical Map */}
                <div className="col-span-12 lg:col-span-5 flex flex-col gap-6">
                    <TacticalPanel title="TACTICAL TOPOGRAPHY" className="flex-1">
                        <TacticalMap config={config} />
                        <div className="mt-8 grid grid-cols-2 gap-4">
                            <LegendItem color="#22c55e" label="Initial Insertion" />
                            <LegendItem color="#ef4444" label="Hostile Presence" />
                            <LegendItem color="#26c6da" label="Operational Node" />
                            <LegendItem color="#00e676" label="Extraction Zone" isTriangle />
                        </div>
                    </TacticalPanel>
                </div>

                {/* Right Column: Intel & Objectives */}
                <div className="col-span-12 lg:col-span-7 flex flex-col gap-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Enemy Intel */}
                        <TacticalPanel title="ADVERSARY DATA" borderColor="border-red-500/20" titleColor="text-red-400">
                            <div className="flex flex-col gap-5">
                                {config.agents?.map((agent, i) => {
                                    const meta = AGENT_META[agent.type];
                                    const colorHex = '#' + (meta.color || 0xffffff).toString(16).padStart(6, '0');
                                    return (
                                        <div key={i} className="flex items-center gap-4 bg-red-500/5 p-2 border-l-2 border-red-500/20">
                                            <div className="w-2 h-2 rounded-full shadow-[0_0_8px_rgba(239,68,68,0.5)]" style={{ backgroundColor: colorHex }} />
                                            <div>
                                                <div className="text-[10px] font-black tracking-widest uppercase text-white leading-tight">{meta.label}</div>
                                                <div className="text-[8px] font-mono text-red-400/60 uppercase mt-0.5">
                                                    THREAT_LVL: CLASS {meta.speed > 5 ? 'A' : 'B'}
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })}
                                <div className="mt-2 grid grid-cols-2 gap-4 pt-4 border-t border-red-500/10">
                                    <TacticalStat label="Window" value={`${config.timeLimit}s`} color="text-red-500" />
                                    <TacticalStat label="Zones" value={config.agents?.length || 0} color="text-red-500" />
                                </div>
                            </div>
                        </TacticalPanel>

                        {/* Tactical Tips */}
                        <TacticalPanel title="OPERATIONAL GUIDANCE" titleColor="text-amber-500" borderColor="border-amber-500/20">
                            <ul className="flex flex-col gap-4">
                                {config.tips?.map((tip, i) => (
                                    <li key={i} className="text-[9px] text-slate-400 leading-relaxed flex gap-3">
                                        <span className="text-amber-500 font-black tracking-tighter shrink-0 opacity-40">»</span>
                                        <span className="font-bold tracking-tight">{tip}</span>
                                    </li>
                                ))}
                            </ul>
                        </TacticalPanel>
                    </div>

                    {/* Objective List */}
                    <TacticalPanel title="MISSION OBJECTIVES" className="flex-1">
                        <div className="grid grid-cols-1 gap-y-3">
                            {config.tasks?.map((task, i) => {
                                const meta = TASK_META[task.type];
                                return (
                                    <div key={i} className="group flex items-center justify-between bg-white/5 border border-white/5 px-4 py-3 hover:bg-emerald-500/5 hover:border-emerald-500/20 transition-all">
                                        <div className="flex items-center gap-4">
                                            <span className="text-base grayscale opacity-40 group-hover:grayscale-0 group-hover:opacity-100 transition-all">{meta.icon}</span>
                                            <div>
                                                <span className="text-[10px] font-black text-slate-200 uppercase tracking-widest">{task.name}</span>
                                                <div className="text-[7px] text-slate-500 font-mono mt-0.5 uppercase tracking-tighter">Objective Identifier: {task.type}-00{i + 1}</div>
                                            </div>
                                        </div>
                                        <div className="flex gap-6 font-mono text-[9px]">
                                            <span className="text-emerald-500 font-black">{task.basePoints}V</span>
                                            <span className={`font-black ${task.priority >= 4 ? 'text-red-500' : 'text-slate-600'}`}>PRIORITY_{task.priority}</span>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </TacticalPanel>
                </div>
            </main>

            {/* Footer / Deploy Button */}
            <footer className="py-12 px-24 flex items-center justify-between border-t border-white/5 bg-black/20 backdrop-blur-sm animate-in fade-in slide-in-from-bottom duration-700 delay-500">
                <button
                    onClick={() => router.push('/game/select')}
                    className="group flex items-center gap-4 text-[10px] font-black tracking-[0.4em] text-slate-600 hover:text-white transition-all uppercase"
                >
                    <div className="w-12 h-[1px] bg-slate-800 group-hover:w-16 group-hover:bg-emerald-500 transition-all" />
                    Abort Sequence
                </button>

                <div className="flex items-center gap-12">
                    <div className="hidden lg:block text-right">
                        <span className="text-[9px] font-mono text-slate-600 uppercase tracking-widest block">Ready to deploy?</span>
                        <span className="text-[10px] font-black text-emerald-500/60 uppercase tracking-widest">Awaiting Command Link...</span>
                    </div>

                    <TacticalButton
                        label="Execute Deployment"
                        sub="Neural Link Initiation"
                        color="emerald"
                        className="w-[300px]"
                        onClick={deploy}
                    />
                </div>
            </footer>
        </div>
    );
}

/* TacticalPanel is imported from TacticalUI.js — no local override needed */

function LegendItem({ color, label, isTriangle }) {
    return (
        <div className="flex items-center gap-2">
            {isTriangle ? (
                <div className="w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-b-[8px]" style={{ borderBottomColor: color }} />
            ) : (
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
            )}
            <span className="text-[7px] font-mono font-bold text-slate-500 uppercase tracking-widest">{label}</span>
        </div>
    )
}

function TacticalMap({ config }) {
    // World size is 2400x1600. Let's scale it to fit aspect ratio
    return (
        <div className="relative aspect-[3/2] bg-[#1a2a1a] border border-emerald-900/30 overflow-hidden shadow-inner">
            {/* Grid */}
            <div className="absolute inset-0 opacity-10 bg-[linear-gradient(to_right,#2a4a2a_1px,transparent_1px),linear-gradient(to_bottom,#2a4a2a_1px,transparent_1px)] bg-[size:10%_15%]" />

            {/* Player */}
            {config.playerSpawn && (
                <Point x={config.playerSpawn.x} y={config.playerSpawn.y} color="#22c55e" size={8} glow label="YOU" />
            )}

            {/* Enemies */}
            {config.agents?.map((agent, i) => (
                <Point key={i} x={agent.spawn.x} y={agent.spawn.y} color={AGENT_META[agent.type].color} size={6} />
            ))}

            {/* Tasks */}
            {config.tasks?.map((task, i) => (
                <Point key={i} x={task.position.x} y={task.position.y} color="#26c6da" size={5} square />
            ))}

            {/* Extraction */}
            {config.extraction && (
                <Point x={config.extraction.x} y={config.extraction.y} color="#00e676" size={8} triangle label="EXIT" />
            )}
        </div>
    )
}

function Point({ x, y, color, size, glow, label, square, triangle }) {
    // Convert 2400x1600 to percentage
    const left = (x / 2400) * 100;
    const top = (y / 1600) * 100;
    const colorHex = typeof color === 'string' ? color : '#' + color.toString(16).padStart(6, '0');

    return (
        <div
            className="absolute -translate-x-1/2 -translate-y-1/2 group"
            style={{ left: `${left}%`, top: `${top}%` }}
        >
            <div
                className={`
                    ${triangle ? 'w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-b-[10px]' : (square ? 'w-2 h-2 rotate-45' : 'rounded-full')}
                    ${glow ? 'animate-pulse' : ''}
                `}
                style={{
                    backgroundColor: triangle ? 'transparent' : colorHex,
                    borderBottomColor: triangle ? colorHex : 'transparent',
                    width: triangle ? 0 : size,
                    height: triangle ? 0 : size,
                    boxShadow: glow ? `0 0 10px ${colorHex}` : 'none'
                }}
            />
            {label && (
                <span
                    className="absolute top-0 left-4 text-[7px] font-mono font-black tracking-widest uppercase opacity-80"
                    style={{ color: colorHex }}
                >
                    {label}
                </span>
            )}
        </div>
    )
}
