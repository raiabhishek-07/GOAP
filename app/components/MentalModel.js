"use client";
import styles from "./MentalModel.module.css";

export default function MentalModel() {
    return (
        <section id="mental-model" className={styles.section}>
            <div className={styles.container}>
                <div className={styles.header}>
                    <span className={styles.sectionTag}>06 — Summary</span>
                    <h2>
                        The <span className="gradient-text-warm">Mental Model</span>
                    </h2>
                    <p className={styles.lead}>
                        Think of GOAP as an AI that asks itself five questions in a loop.
                    </p>
                </div>

                {/* Big mental model flow */}
                <div className={styles.flowContainer}>
                    <div className={styles.flowStep}>
                        <div className={styles.flowNum}>1</div>
                        <div className={styles.flowContent}>
                            <h3>"What do I want?"</h3>
                            <p>Select highest-priority achievable goal</p>
                        </div>
                    </div>

                    <div className={styles.flowConnector}>
                        <svg width="40" height="60" viewBox="0 0 40 60">
                            <path
                                d="M20 0 L20 50 L12 42 M20 50 L28 42"
                                stroke="url(#arrowGrad)"
                                strokeWidth="2"
                                fill="none"
                            />
                            <defs>
                                <linearGradient id="arrowGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="var(--accent-orange)" />
                                    <stop offset="100%" stopColor="var(--accent-pink)" />
                                </linearGradient>
                            </defs>
                        </svg>
                    </div>

                    <div className={styles.flowStep}>
                        <div className={styles.flowNum}>2</div>
                        <div className={styles.flowContent}>
                            <h3>"What must be true for that?"</h3>
                            <p>Identify required beliefs for the goal</p>
                        </div>
                    </div>

                    <div className={styles.flowConnector}>
                        <svg width="40" height="60" viewBox="0 0 40 60">
                            <path
                                d="M20 0 L20 50 L12 42 M20 50 L28 42"
                                stroke="url(#arrowGrad)"
                                strokeWidth="2"
                                fill="none"
                            />
                        </svg>
                    </div>

                    <div className={styles.flowStep}>
                        <div className={styles.flowNum}>3</div>
                        <div className={styles.flowContent}>
                            <h3>"What actions make that true?"</h3>
                            <p>Find actions whose effects satisfy requirements</p>
                        </div>
                    </div>

                    <div className={styles.flowConnector}>
                        <svg width="40" height="60" viewBox="0 0 40 60">
                            <path
                                d="M20 0 L20 50 L12 42 M20 50 L28 42"
                                stroke="url(#arrowGrad)"
                                strokeWidth="2"
                                fill="none"
                            />
                        </svg>
                    </div>

                    <div className={styles.flowStep}>
                        <div className={styles.flowNum}>4</div>
                        <div className={styles.flowContent}>
                            <h3>"What must be true for THOSE actions?"</h3>
                            <p>Check preconditions of selected actions</p>
                        </div>
                    </div>

                    <div className={styles.flowConnector}>
                        <svg width="40" height="60" viewBox="0 0 40 60">
                            <path
                                d="M20 0 L20 50 L12 42 M20 50 L28 42"
                                stroke="url(#arrowGrad)"
                                strokeWidth="2"
                                fill="none"
                            />
                        </svg>
                    </div>

                    <div className={`${styles.flowStep} ${styles.flowRepeat}`}>
                        <div className={styles.flowNum}>5</div>
                        <div className={styles.flowContent}>
                            <h3>"Repeat until everything is satisfied"</h3>
                            <p>Then execute the chain from start to finish</p>
                        </div>
                    </div>
                </div>

                {/* Summary Cards */}
                <div className={styles.summaryGrid}>
                    <div className={styles.summaryCard}>
                        <div className={styles.summaryIcon}>🧠</div>
                        <div className={styles.summaryLabel}>Beliefs</div>
                        <div className={styles.summaryDesc}>World state (true/false)</div>
                    </div>
                    <div className={styles.summaryPlus}>+</div>
                    <div className={styles.summaryCard}>
                        <div className={styles.summaryIcon}>⚡</div>
                        <div className={styles.summaryLabel}>Actions</div>
                        <div className={styles.summaryDesc}>
                            Preconditions & Effects
                        </div>
                    </div>
                    <div className={styles.summaryPlus}>+</div>
                    <div className={styles.summaryCard}>
                        <div className={styles.summaryIcon}>🎯</div>
                        <div className={styles.summaryLabel}>Goals</div>
                        <div className={styles.summaryDesc}>Desired states</div>
                    </div>
                    <div className={styles.summaryPlus}>+</div>
                    <div className={styles.summaryCard}>
                        <div className={styles.summaryIcon}>🔮</div>
                        <div className={styles.summaryLabel}>Planner</div>
                        <div className={styles.summaryDesc}>Search algorithm</div>
                    </div>
                </div>

                <div className={styles.resultBox}>
                    <div className={styles.resultArrow}>↓</div>
                    <h3>
                        Dynamic, cost-aware, multi-step plans
                    </h3>
                    <p>
                        Generated in real-time, adapting to the ever-changing world state.
                    </p>
                </div>

                {/* Credits */}
                <div className={styles.credits}>
                    <div className={styles.creditLine} />
                    <p>
                        GOAP was developed by{" "}
                        <strong>Jeff Orkin</strong> at the{" "}
                        <strong>Massachusetts Institute of Technology</strong> and was
                        famously implemented in the game{" "}
                        <strong>F.E.A.R.</strong> (2005), setting a new standard for
                        game AI behavior.
                    </p>
                </div>
            </div>
        </section>
    );
}
