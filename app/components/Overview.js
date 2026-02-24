"use client";
import styles from "./Overview.module.css";

export default function Overview() {
    return (
        <section id="overview" className={styles.section}>
            <div className={styles.container}>
                <div className={styles.header}>
                    <span className={styles.sectionTag}>01 — Introduction</span>
                    <h2>
                        What is <span className="gradient-text">GOAP</span>?
                    </h2>
                    <p className={styles.lead}>
                        GOAP is an AI architecture where agents don't follow pre-scripted
                        behaviors. Instead, they <em>reason</em> about their situation and
                        dynamically construct plans to achieve their goals.
                    </p>
                </div>

                <div className={styles.grid}>
                    <div className={styles.card}>
                        <div className={`${styles.cardIcon} ${styles.iconBeliefs}`}>
                            <svg
                                width="28"
                                height="28"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                            >
                                <circle cx="12" cy="12" r="10" />
                                <path d="M12 16v-4M12 8h.01" />
                            </svg>
                        </div>
                        <h3>Believes</h3>
                        <p>
                            The agent maintains beliefs about the world — simple true/false
                            facts like "I am healthy" or "Player is nearby."
                        </p>
                    </div>

                    <div className={styles.card}>
                        <div className={`${styles.cardIcon} ${styles.iconActions}`}>
                            <svg
                                width="28"
                                height="28"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                            >
                                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                            </svg>
                        </div>
                        <h3>Acts</h3>
                        <p>
                            Actions are modular building blocks with preconditions, effects,
                            and costs. They're not tied to any specific goal.
                        </p>
                    </div>

                    <div className={styles.card}>
                        <div className={`${styles.cardIcon} ${styles.iconGoals}`}>
                            <svg
                                width="28"
                                height="28"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                            >
                                <circle cx="12" cy="12" r="10" />
                                <circle cx="12" cy="12" r="6" />
                                <circle cx="12" cy="12" r="2" />
                            </svg>
                        </div>
                        <h3>Plans</h3>
                        <p>
                            A planner searches backward from goals through available actions
                            to build cost-optimal, multi-step plans automatically.
                        </p>
                    </div>
                </div>

                <div className={styles.highlight}>
                    <div className={styles.highlightIcon}>💡</div>
                    <div>
                        <h4>Key Insight</h4>
                        <p>
                            Instead of hardcoding behavior with state machines (
                            <code>if hungry → eat</code>), GOAP lets the AI figure out{" "}
                            <em>how</em> to achieve its goals by reasoning about what actions
                            are available and what they do.
                        </p>
                    </div>
                </div>
            </div>
        </section>
    );
}
