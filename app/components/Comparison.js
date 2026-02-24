"use client";
import styles from "./Comparison.module.css";

export default function Comparison() {
    return (
        <section id="comparison" className={styles.section}>
            <div className={styles.container}>
                <div className={styles.header}>
                    <span className={styles.sectionTag}>05 — Comparison</span>
                    <h2>
                        FSM vs <span className="gradient-text">GOAP</span>
                    </h2>
                    <p className={styles.lead}>
                        Why GOAP is a paradigm shift over traditional Finite State Machines
                        for game AI.
                    </p>
                </div>

                <div className={styles.compGrid}>
                    {/* FSM Side */}
                    <div className={styles.compCard}>
                        <div className={styles.compBadge}>
                            <span className={styles.badgeFSM}>FSM</span>
                            Finite State Machine
                        </div>
                        <div className={styles.codeBlock}>
                            <div className={styles.codeHeader}>
                                <span className={styles.codeDot} style={{ background: "#ef4444" }} />
                                <span className={styles.codeDot} style={{ background: "#f59e0b" }} />
                                <span className={styles.codeDot} style={{ background: "#10b981" }} />
                            </div>
                            <pre className={styles.code}>
                                {`if (hungry) {
  eat();
} else if (enemy_nearby) {
  attack();
} else if (tired) {
  rest();
} else {
  wander();
}`}
                            </pre>
                        </div>
                        <ul className={styles.consList}>
                            <li>
                                <span className={styles.consIcon}>✗</span>
                                Hardcoded transitions
                            </li>
                            <li>
                                <span className={styles.consIcon}>✗</span>
                                Combinatorial explosion as states grow
                            </li>
                            <li>
                                <span className={styles.consIcon}>✗</span>
                                New behavior = rewrite logic
                            </li>
                            <li>
                                <span className={styles.consIcon}>✗</span>
                                Tightly coupled states
                            </li>
                            <li>
                                <span className={styles.consIcon}>✗</span>
                                No emergent behavior
                            </li>
                        </ul>
                    </div>

                    {/* VS Divider */}
                    <div className={styles.vsDivider}>
                        <div className={styles.vsCircle}>VS</div>
                    </div>

                    {/* GOAP Side */}
                    <div className={`${styles.compCard} ${styles.goapCard}`}>
                        <div className={styles.compBadge}>
                            <span className={styles.badgeGOAP}>GOAP</span>
                            Goal-Oriented Action Planning
                        </div>
                        <div className={styles.codeBlock}>
                            <div className={styles.codeHeader}>
                                <span className={styles.codeDot} style={{ background: "#ef4444" }} />
                                <span className={styles.codeDot} style={{ background: "#f59e0b" }} />
                                <span className={styles.codeDot} style={{ background: "#10b981" }} />
                            </div>
                            <pre className={styles.codeGOAP}>
                                {`Goal: Survive
  priority: highest

// Planner figures out HOW
// based on current world state
// and available actions

plan = planner.search(goals, 
                      actions,
                      beliefs)`}
                            </pre>
                        </div>
                        <ul className={styles.prosList}>
                            <li>
                                <span className={styles.prosIcon}>✓</span>
                                Flexible — add actions without rewriting
                            </li>
                            <li>
                                <span className={styles.prosIcon}>✓</span>
                                Dynamic — adapts to environment changes
                            </li>
                            <li>
                                <span className={styles.prosIcon}>✓</span>
                                Emergent — unexpected solutions appear
                            </li>
                            <li>
                                <span className={styles.prosIcon}>✓</span>
                                Scalable — complex plans form automatically
                            </li>
                            <li>
                                <span className={styles.prosIcon}>✓</span>
                                Decoupled goals, actions & execution
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Architecture Advantage */}
                <div className={styles.archBox}>
                    <h3>The Architectural Advantage</h3>
                    <div className={styles.archGrid}>
                        <div className={styles.archItem}>
                            <div className={styles.archLabel}>Goals</div>
                            <div className={styles.archDesc}>
                                Define <em>what</em> the AI wants
                            </div>
                        </div>
                        <div className={styles.archArrow}>⟷</div>
                        <div className={styles.archItem}>
                            <div className={styles.archLabel}>Actions</div>
                            <div className={styles.archDesc}>
                                Define <em>what</em> it can do
                            </div>
                        </div>
                        <div className={styles.archArrow}>⟷</div>
                        <div className={styles.archItem}>
                            <div className={styles.archLabel}>Execution</div>
                            <div className={styles.archDesc}>
                                Define <em>how</em> it does it
                            </div>
                        </div>
                    </div>
                    <p className={styles.archNote}>
                        Each layer is fully decoupled. Adding a new action doesn&apos;t require
                        changing goals or execution logic. This makes the system modular
                        and extensible.
                    </p>
                </div>
            </div>
        </section>
    );
}
