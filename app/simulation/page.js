"use client";
import { useState } from "react";
import dynamic from "next/dynamic";
import Navbar from "../components/Navbar";
import styles from "./page.module.css";

const SimulationPhaser = dynamic(() => import("../components/simulation/SimulationPhaser"), { ssr: false });
const Simulation3D = dynamic(() => import("../components/simulation/Simulation3D"), { ssr: false });
const SimulationPlayCanvas = dynamic(() => import("../components/simulation/SimulationPlayCanvas"), { ssr: false });

export default function SimulationPage() {
    const [viewMode, setViewMode] = useState("2d");

    return (
        <>
            <Navbar />
            <main className={styles.main}>
                <div className={styles.header}>
                    <div className={styles.tagRow}>
                        <span className={styles.tag}>Live Simulation</span>
                        <div className={styles.viewToggle}>
                            <button
                                className={`${styles.toggleBtn} ${viewMode === '2d' ? styles.toggleActive : ''}`}
                                onClick={() => setViewMode('2d')}
                            >
                                🖼️ 2D (Phaser)
                            </button>
                            <button
                                className={`${styles.toggleBtn} ${viewMode === '3d' ? styles.toggleActive : ''}`}
                                onClick={() => setViewMode('3d')}
                            >
                                🧊 3D (Three.js)
                            </button>
                            <button
                                className={`${styles.toggleBtn} ${viewMode === 'play' ? styles.toggleActiveHighlight : ''}`}
                                onClick={() => setViewMode('play')}
                                style={{ borderLeft: '1px solid rgba(255,255,255,0.1)' }}
                            >
                                🚀 3D (PlayCanvas)
                            </button>
                        </div>
                    </div>
                    <h1>
                        GOAP <span className={styles.accent}>
                            {viewMode === '2d' ? '2D (Phaser)' : viewMode === '3d' ? '3D (Three.js)' : 'Pro 3D (PlayCanvas)'}
                        </span> Simulation
                    </h1>
                    <p className={styles.subtitle}>
                        Watch the AI agent plan and act autonomously using {viewMode === 'play' ? 'Production-grade PlayCanvas engine' : 'Modern Web Engines'}.
                    </p>
                </div>

                <div className={styles.simContainer}>
                    {viewMode === "2d" && <SimulationPhaser />}
                    {viewMode === "3d" && <Simulation3D />}
                    {viewMode === "play" && <SimulationPlayCanvas />}
                </div>

                <div className={styles.instructions}>
                    <div className={styles.instructionCard}>
                        <span className={styles.instructionIcon}>🖱️</span>
                        <div>
                            <h4>Interaction</h4>
                            <p>Click the ground to move the red Player. In 3D, use mouse to rotate/zoom.</p>
                        </div>
                    </div>
                    <div className={styles.instructionCard}>
                        <span className={styles.instructionIcon}>👁️</span>
                        <div>
                            <h4>Agent Brain</h4>
                            <p>The AI uses the same GOAP engine in both 2D and 3D views.</p>
                        </div>
                    </div>
                    <div className={styles.instructionCard}>
                        <span className={styles.instructionIcon}>📊</span>
                        <div>
                            <h4>Real-time Tracking</h4>
                            <p>Debug panel updates live as the agent satisfies its survival needs.</p>
                        </div>
                    </div>
                    <div className={styles.instructionCard}>
                        <span className={styles.instructionIcon}>⚡</span>
                        <div>
                            <h4>Dynamic Goals</h4>
                            <p>Watch the priority shift from "Wander" to "Attack" to "Eat" based on stats.</p>
                        </div>
                    </div>
                </div>
            </main>
        </>
    );
}
