"use client";
import { useState, useEffect, useRef } from "react";
import styles from "./PlannerViz.module.css";

const scenarios = [
    {
        id: "health",
        title: "Stay Healthy",
        subtitle: "Health is low — agent needs food",
        goalBelief: "Healthy",
        goalPriority: 2,
        steps: [
            {
                type: "goal",
                label: "Goal: Stay Healthy",
                detail: 'Requires belief: "Healthy" = true',
            },
            {
                type: "search",
                label: "Planner searches...",
                detail: 'Which action produces effect "Healthy"?',
            },
            {
                type: "action",
                label: "Action: Eat",
                detail:
                    'Effect: "Healthy" ✓ | Precondition: "At Food Shack" | Cost: 1',
            },
            {
                type: "search",
                label: "Planner searches...",
                detail: 'Which action produces effect "At Food Shack"?',
            },
            {
                type: "action",
                label: "Action: Move to Food Shack",
                detail:
                    'Effect: "At Food Shack" ✓ | Precondition: none | Cost: 1',
            },
            {
                type: "result",
                label: "Plan Complete!",
                detail: "Total cost: 2",
            },
        ],
        plan: ["Move to Food Shack", "Eat"],
    },
    {
        id: "rest",
        title: "Be Rested",
        subtitle: "Agent is tired — needs to find rest area",
        goalBelief: "Rested",
        goalPriority: 1,
        steps: [
            {
                type: "goal",
                label: "Goal: Be Rested",
                detail: 'Requires belief: "Rested" = true',
            },
            {
                type: "search",
                label: "Planner searches...",
                detail: 'Which action produces effect "Rested"?',
            },
            {
                type: "action",
                label: "Action: Rest",
                detail:
                    'Effect: "Rested" ✓ | Precondition: "At Rest Area" | Cost: 1',
            },
            {
                type: "search",
                label: "Planner searches...",
                detail: 'Which action produces effect "At Rest Area"?',
            },
            {
                type: "branch",
                label: "Two options found!",
                detail: "Door 1 (cost 1) vs Door 2 (cost 2)",
            },
            {
                type: "action",
                label: "Action: Move through Door 1",
                detail:
                    'Effect: "At Rest Area" ✓ | Precondition: none | Cost: 1  ← Cheaper!',
            },
            {
                type: "result",
                label: "Plan Complete!",
                detail: "Total cost: 2 (chose cheapest path)",
            },
        ],
        plan: ["Move through Door 1", "Rest"],
    },
    {
        id: "combat",
        title: "Seek & Destroy",
        subtitle: "Player detected — highest priority goal activates",
        goalBelief: "Attacking Player",
        goalPriority: 3,
        steps: [
            {
                type: "goal",
                label: "Goal: Seek and Destroy",
                detail: 'Requires belief: "Attacking Player" = true | Priority: 3 (highest)',
            },
            {
                type: "search",
                label: "Planner searches...",
                detail: 'Which action produces effect "Attacking Player"?',
            },
            {
                type: "action",
                label: "Action: Attack",
                detail:
                    'Effect: "Attacking Player" ✓ | Precondition: "In Attack Range" | Cost: 2',
            },
            {
                type: "search",
                label: "Planner searches...",
                detail: 'Which action produces effect "In Attack Range"?',
            },
            {
                type: "action",
                label: "Action: Chase Player",
                detail:
                    'Effect: "In Attack Range" ✓ | Precondition: "Player Detected" | Cost: 1',
            },
            {
                type: "check",
                label: "Check: Player Detected?",
                detail: 'Sensor confirms: "Player Detected" = true  ✓',
            },
            {
                type: "result",
                label: "Plan Complete!",
                detail: "Total cost: 3",
            },
        ],
        plan: ["Chase Player", "Attack"],
    },
];

export default function PlannerViz() {
    const [activeScenario, setActiveScenario] = useState("health");
    const [visibleSteps, setVisibleSteps] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const timerRef = useRef(null);

    const scenario = scenarios.find((s) => s.id === activeScenario);

    const startAnimation = () => {
        setVisibleSteps(0);
        setIsPlaying(true);
    };

    useEffect(() => {
        if (isPlaying && visibleSteps < scenario.steps.length) {
            timerRef.current = setTimeout(() => {
                setVisibleSteps((v) => v + 1);
            }, 800);
        } else if (visibleSteps >= scenario.steps.length) {
            setIsPlaying(false);
        }
        return () => clearTimeout(timerRef.current);
    }, [isPlaying, visibleSteps, scenario.steps.length]);

    const switchScenario = (id) => {
        setActiveScenario(id);
        setVisibleSteps(0);
        setIsPlaying(false);
    };

    return (
        <section id="planner" className={styles.section}>
            <div className={styles.container}>
                <div className={styles.header}>
                    <span className={styles.sectionTag}>03 — The Brain</span>
                    <h2>
                        Watch the <span className="gradient-text-pink">Planner</span> Think
                    </h2>
                    <p className={styles.lead}>
                        See how the planner works backward from a goal, chaining actions
                        together to build a cost-optimal plan.
                    </p>
                </div>

                {/* Scenario Selector */}
                <div className={styles.scenarioTabs}>
                    {scenarios.map((s) => (
                        <button
                            key={s.id}
                            id={`scenario-${s.id}`}
                            className={`${styles.scenarioTab} ${activeScenario === s.id ? styles.active : ""
                                }`}
                            onClick={() => switchScenario(s.id)}
                        >
                            <span className={styles.scenarioTitle}>{s.title}</span>
                            <span className={styles.scenarioSub}>{s.subtitle}</span>
                        </button>
                    ))}
                </div>

                <div className={styles.vizContainer}>
                    {/* Steps Timeline */}
                    <div className={styles.timeline}>
                        <div className={styles.timelineHeader}>
                            <h4>Backward Planning Process</h4>
                            <button
                                id="planner-play-btn"
                                className={styles.playBtn}
                                onClick={startAnimation}
                                disabled={isPlaying}
                            >
                                {isPlaying ? "Running..." : visibleSteps > 0 ? "Replay" : "▶ Play"}
                            </button>
                        </div>

                        <div className={styles.steps}>
                            {scenario.steps.map((step, i) => (
                                <div
                                    key={i}
                                    className={`${styles.step} ${styles[`step${step.type}`]} ${i < visibleSteps ? styles.visible : ""
                                        }`}
                                    style={{ transitionDelay: `${i * 0.05}s` }}
                                >
                                    <div className={styles.stepConnector}>
                                        <div className={styles.stepDot} />
                                        {i < scenario.steps.length - 1 && (
                                            <div className={styles.stepLine} />
                                        )}
                                    </div>
                                    <div className={styles.stepContent}>
                                        <span className={styles.stepLabel}>{step.label}</span>
                                        <span className={styles.stepDetail}>{step.detail}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Result Plan */}
                    <div className={styles.resultPanel}>
                        <h4>Generated Plan</h4>
                        <div className={styles.planSteps}>
                            {visibleSteps >= scenario.steps.length ? (
                                scenario.plan.map((step, i) => (
                                    <div key={i} className={styles.planStep}>
                                        <span className={styles.planNum}>{i + 1}</span>
                                        <span className={styles.planAction}>{step}</span>
                                    </div>
                                ))
                            ) : (
                                <div className={styles.planPending}>
                                    <span className={styles.pendingIcon}>⏳</span>
                                    <span>Run the planner to see the plan</span>
                                </div>
                            )}
                        </div>

                        <div className={styles.loopInfo}>
                            <h4>Real-Time Behavior Loop</h4>
                            <div className={styles.loopSteps}>
                                <div className={styles.loopStep}>
                                    <span className={styles.loopNum}>1</span>
                                    <span>If no current action → ask planner for plan</span>
                                </div>
                                <div className={styles.loopStep}>
                                    <span className={styles.loopNum}>2</span>
                                    <span>If plan exists → pop & execute next action</span>
                                </div>
                                <div className={styles.loopStep}>
                                    <span className={styles.loopNum}>3</span>
                                    <span>If action finishes → pop next action</span>
                                </div>
                                <div className={styles.loopStep}>
                                    <span className={styles.loopNum}>4</span>
                                    <span>If plan finishes → mark goal complete</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
