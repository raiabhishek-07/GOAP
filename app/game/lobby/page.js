"use client";
import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { TacticalPanel, TacticalButton, TacticalStat } from "../../components/game/TacticalUI";

export default function LobbyPage() {
    const router = useRouter();

    const rooms = [
        { id: 1, name: "Alpha Sector Recon", players: 2, max: 4, mode: "Co-op", status: "In Briefing" },
        { id: 2, name: "Mastermind's Lair", players: 1, max: 2, mode: "PvP", status: "Waiting" },
        { id: 3, name: "Tutorial Squad", players: 3, max: 8, mode: "Training", status: "Starting" },
    ];

    return (
        <div className="min-h-screen flex flex-col bg-slate-950/60 text-slate-200 p-8 lg:p-12">
            {/* Header */}
            <header className="w-full max-w-6xl mx-auto mb-12 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 animate-in fade-in slide-in-from-top duration-700">
                <div className="flex-1 border-b border-white/10 pb-4">
                    <h2 className="text-3xl font-black tracking-[0.3em] text-white uppercase">
                        Network Hub
                    </h2>
                    <p className="text-[10px] font-black tracking-[0.4em] text-blue-500/60 uppercase mt-2">
                        Multiplayer Tactical Links
                    </p>
                </div>

                <div className="mb-2">
                    <TacticalButton
                        label="Create Mission"
                        sub="Initiate Node"
                        color="blue"
                        className="py-2 px-12"
                        onClick={() => { }}
                    />
                </div>
            </header>

            <main className="w-full max-w-6xl mx-auto grid grid-cols-12 gap-8 flex-1 animate-in fade-in duration-700 delay-200">
                {/* Room List */}
                <div className="col-span-12 lg:col-span-8 flex flex-col gap-5">
                    {rooms.map((room) => (
                        <TacticalPanel
                            key={room.id}
                            title={`Link ID: 00${room.id}`}
                            borderColor="border-white/10"
                            titleColor="text-blue-400"
                            className="group transition-all duration-300 hover:border-blue-500/50 cursor-pointer"
                        >
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                <div className="flex items-center gap-6">
                                    <div className="w-14 h-14 bg-blue-500/5 border border-blue-500/20 flex items-center justify-center font-black text-blue-500 text-lg group-hover:bg-blue-500/20 transition-all shrink-0">
                                        {room.name[0]}
                                    </div>
                                    <div>
                                        <h4 className="text-base font-black tracking-widest text-white uppercase group-hover:text-blue-400 transition-all">{room.name}</h4>
                                        <div className="flex gap-4 mt-2 font-mono text-[9px] uppercase tracking-widest text-slate-500">
                                            <span className="bg-white/5 px-2 py-0.5 border border-white/10">{room.mode}</span>
                                            <span className="flex items-center gap-2">
                                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                                {room.status}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-6">
                                    <div className="grid grid-cols-2 gap-4">
                                        <TacticalStat label="Players" value={`${room.players}/${room.max}`} color="text-blue-500" />
                                        <TacticalStat label="Latency" value="24ms" color="text-blue-500" />
                                    </div>
                                    <button className="px-8 py-3 bg-blue-500 border border-blue-400 text-[10px] font-black tracking-[0.2em] text-white hover:bg-blue-400 hover:scale-105 transition-all shadow-lg active:scale-95 shrink-0">
                                        JOIN LINK
                                    </button>
                                </div>
                            </div>
                        </TacticalPanel>
                    ))}

                    <div className="flex-1 flex items-center justify-center min-h-[100px] border border-dashed border-white/5 text-[10px] text-slate-600 font-mono tracking-widest uppercase">
                        Scanning for additional nodes...
                    </div>
                </div>

                {/* Sidebar Info */}
                <div className="col-span-12 lg:col-span-4 flex flex-col gap-8">
                    <TacticalPanel title="SECURE COMMS" titleColor="text-amber-500" borderColor="border-amber-500/20" className="flex-1">
                        <div className="flex flex-col gap-4 h-[350px]">
                            <div className="flex-1 space-y-4 overflow-y-auto pr-2">
                                <ChatMessage user="Ghost_Plan" msg="Need 1 more for tut mission" timestamp="20:21" />
                                <ChatMessage user="Nullptr_King" msg="GG that last run was insane. The AI is way tighter now." timestamp="20:19" />
                                <ChatMessage user="AI_Stalker" msg="Who wants to PvP in the Neural Nexus?" color="text-red-400" timestamp="20:15" />
                                <ChatMessage user="Sys_Admin" msg="Network stability at 98.4%. Deployment ready." color="text-emerald-500" timestamp="20:12" />
                            </div>

                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Enter encrypted message..."
                                    className="w-full bg-black/40 border border-white/10 px-4 py-3 text-[10px] font-mono text-white placeholder:text-slate-600 focus:border-amber-500/50 outline-none transition-all"
                                />
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[8px] font-black text-amber-500/50 uppercase tracking-widest">Send [Enter]</div>
                            </div>
                        </div>
                    </TacticalPanel>
                </div>
            </main>

            {/* Back Button */}
            <button
                onClick={() => router.push('/game')}
                className="mx-auto mt-12 text-[10px] font-black tracking-[0.3em] text-slate-600 hover:text-blue-500 transition-colors uppercase flex items-center gap-3 animate-in fade-in duration-700 delay-500"
            >
                <div className="w-8 h-[1px] bg-current" />
                Return to Command
            </button>
        </div>
    );
}

function ChatMessage({ user, msg, timestamp, color = "text-blue-500" }) {
    return (
        <div className="flex flex-col gap-1 border-l-2 border-white/5 pl-4 py-1 hover:border-white/20 transition-all">
            <div className="flex items-center justify-between">
                <span className={`text-[9px] font-black uppercase tracking-widest ${color}`}>{user}</span>
                <span className="text-[7px] font-mono text-slate-700">{timestamp}</span>
            </div>
            <span className="text-[10px] text-slate-400 font-medium leading-relaxed tracking-tight">{msg}</span>
        </div>
    );
}
