"use client";
import styles from "./Walkthrough.module.css";

export default function Walkthrough() {
    return (
        <section id="walkthrough" className={styles.section}>
            <div className={styles.container}>
                <div className={styles.header}>
                    <span className={styles.sectionTag}>04 — Deep Dive</span>
                    <h2>
                        How It All <span className="gradient-text-cool">Comes Together</span>
                    </h2>
                    <p className={styles.lead}>
                        Understanding the search algorithm, sensors, and real-time
                        re-evaluation that makes GOAP truly intelligent.
                    </p>
                </div>

                <div className={styles.grid}>
                    {/* DFS Search */}
                    <div className={styles.featureCard}>
                        <div className={styles.cardGlow} aria-hidden="true" />
                        <div className={styles.cardTag}>Algorithm</div>
                        <h3>Depth-First Search</h3>
                        <p>
                            The planner uses DFS to explore the action graph. Starting from
                            the goal, it recursively finds actions that satisfy requirements,
                            building a tree of possibilities.
                        </p>
                        <div className={styles.codeBlock}>
                            <div className={styles.codeHeader}>
                                <span className={styles.codeDot} style={{ background: "#ef4444" }} />
                                <span className={styles.codeDot} style={{ background: "#f59e0b" }} />
                                <span className={styles.codeDot} style={{ background: "#10b981" }} />
                                <span className={styles.codeTitle}>planner.pseudo</span>
                            </div>
                            <pre className={styles.code}>
                                {`function plan(goal):
  for each action:
    if action.effects ⊇ goal.needs:
      if action.preconditions met:
        return [action]
      else:
        subplan = plan(action.preconditions)
        if subplan exists:
          return subplan + [action]
  return null  // no valid plan`}
                            </pre>
                        </div>
                    </div>

                    {/* Sensors */}
                    <div className={styles.featureCard}>
                        <div className={styles.cardGlow2} aria-hidden="true" />
                        <div className={styles.cardTag}>Reactivity</div>
                        <h3>Sensors & Re-evaluation</h3>
                        <p>
                            Sensors continuously monitor the environment. When conditions
                            change — like a player entering chase range — the current plan is
                            invalidated and the planner recalculates.
                        </p>
                        <div className={styles.sensorList}>
                            <div className={styles.sensorItem}>
                                <div className={styles.sensorIcon}>📡</div>
                                <div>
                                    <strong>Chase Range Sensor</strong>
                                    <span>Detects player in pursuit distance</span>
                                </div>
                            </div>
                            <div className={styles.sensorItem}>
                                <div className={styles.sensorIcon}>⚔️</div>
                                <div>
                                    <strong>Attack Range Sensor</strong>
                                    <span>Detects player in melee distance</span>
                                </div>
                            </div>
                            <div className={styles.sensorNotice}>
                                <span className={styles.noticeIcon}>⚠️</span>
                                When sensor state changes → current plan invalidated → planner
                                recalculates
                            </div>
                        </div>
                    </div>

                    {/* Why it's intelligent */}
                    <div className={`${styles.featureCard} ${styles.fullWidth}`}>
                        <div className={styles.cardTag}>Intelligence</div>
                        <h3>What Makes It Smart</h3>
                        <p>
                            The intelligence isn't from scripted behavior. It emerges from four
                            interconnected mechanisms working together in real-time.
                        </p>
                        <div className={styles.intelligenceGrid}>
                            <div className={styles.intItem}>
                                <div className={styles.intIcon}>🔄</div>
                                <h4>Backward Planning</h4>
                                <p>Reasoning from desired state to current state</p>
                            </div>
                            <div className={styles.intItem}>
                                <div className={styles.intIcon}>⚖️</div>
                                <h4>Cost Comparison</h4>
                                <p>Automatically selecting optimal paths</p>
                            </div>
                            <div className={styles.intItem}>
                                <div className={styles.intIcon}>🏆</div>
                                <h4>Priority Selection</h4>
                                <p>Focusing on the most important goals first</p>
                            </div>
                            <div className={styles.intItem}>
                                <div className={styles.intIcon}>🔁</div>
                                <h4>Real-time Re-evaluation</h4>
                                <p>Adapting to changing conditions instantly</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
