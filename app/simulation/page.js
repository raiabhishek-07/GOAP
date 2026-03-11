"use client";
import dynamic from "next/dynamic";
import Navbar from "../components/Navbar";
import styles from "./page.module.css";

const SimulationPhaser = dynamic(() => import("../components/simulation/SimulationPhaser"), { ssr: false });

export default function SimulationPage() {
    return (
        <>
            <Navbar />
            <main className={styles.main}>
                <div className={styles.header}>
                    <div className={styles.tagRow}>
                        <span className={styles.tag}>Live Simulation</span>
                    </div>
                    <h1>
                        GOAP <span className={styles.accent}>2D</span> Simulation
                    </h1>
                    <p className={styles.subtitle}>
                        Watch the AI agent plan and act autonomously using the GOAP Engine.
                    </p>
                </div>

                <div className={styles.simContainer}>
                    <SimulationPhaser />
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
