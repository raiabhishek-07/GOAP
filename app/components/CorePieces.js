"use client";
import { useState } from "react";
import styles from "./CorePieces.module.css";

const pieces = [
    {
        id: "beliefs",
        number: "01",
        emoji: "🧠",
        title: "Beliefs",
        subtitle: "What the Agent Thinks Is True",
        color: "cyan",
        description:
            "Beliefs are simple true/false conditions about the world state. They are the foundation — everything else depends on them.",
        details: [
            "Each belief has a name and evaluates to true or false",
            "May optionally have a location associated",
            "Updated using agent stats (health, stamina)",
            "Updated via sensors (detecting player proximity)",
            "Updated from navigation state",
        ],
        examples: [
            { name: '"I am healthy"', value: "true" },
            { name: '"Player is in chase range"', value: "false" },
            { name: '"I am at the food shack"', value: "true" },
            { name: '"I am moving"', value: "false" },
        ],
    },
    {
        id: "actions",
        number: "02",
        emoji: "⚡",
        title: "Actions",
        subtitle: "What the Agent Can Do",
        color: "purple",
        description:
            "Actions are reusable building blocks. Each has preconditions (what must be true), effects (what becomes true), a cost, and a strategy for execution.",
        details: [
            "Preconditions → what must be true to perform it",
            "Effects → what becomes true after performing it",
            "Cost → how expensive the action is",
            "Strategy → how the action actually executes",
            "Actions are NOT tied directly to goals — they're reusable",
        ],
        examples: [
            {
                name: "Eat",
                precondition: "At food shack",
                effect: "Healthy",
                cost: "1",
            },
            {
                name: "Move to Food Shack",
                precondition: "none",
                effect: "At food shack",
                cost: "1",
            },
            {
                name: "Rest",
                precondition: "At rest area",
                effect: "Rested",
                cost: "1",
            },
            {
                name: "Attack",
                precondition: "In attack range",
                effect: "Attacking player",
                cost: "2",
            },
        ],
    },
    {
        id: "goals",
        number: "03",
        emoji: "🎯",
        title: "Goals",
        subtitle: "What the Agent Wants",
        color: "green",
        description:
            "Goals are desired world states. Each has a priority level and a set of desired beliefs. Higher priority = more important.",
        details: [
            "Goals are just desired world states",
            "Each goal has a priority (higher = more important)",
            "Each goal has a set of desired beliefs",
            "The planner picks the highest-priority achievable goal",
            "Goals are decoupled from actions — modular design",
        ],
        examples: [
            { name: "Stay Healthy", belief: "Healthy", priority: "2" },
            { name: "Be Rested", belief: "Rested", priority: "1" },
            {
                name: "Seek and Destroy",
                belief: "Attacking Player",
                priority: "3",
            },
            { name: "Wander", belief: "Wandering", priority: "0" },
        ],
    },
    {
        id: "planner-piece",
        number: "04",
        emoji: "🔮",
        title: "The Planner",
        subtitle: "The Brain — Backward Search",
        color: "pink",
        description:
            "The planner is the most important part. It works backwards from the desired goal, finding chains of actions that satisfy all requirements at the lowest cost.",
        details: [
            "Pick highest-priority goal",
            "Look at its desired beliefs",
            "Find actions whose effects satisfy those beliefs",
            "Check preconditions of those actions",
            "Repeat until all requirements are satisfied",
            "Uses Depth-First Search (DFS) to explore possibilities",
        ],
        examples: [],
    },
];

export default function CorePieces() {
    const [activePiece, setActivePiece] = useState("beliefs");

    const current = pieces.find((p) => p.id === activePiece);

    return (
        <section id="core-pieces" className={styles.section}>
            <div className={styles.container}>
                <div className={styles.header}>
                    <span className={styles.sectionTag}>02 — Architecture</span>
                    <h2>
                        The 4 <span className="gradient-text">Core Pieces</span>
                    </h2>
                    <p className={styles.lead}>
                        GOAP is built from four fundamental components that work together to
                        create intelligent, adaptive behavior.
                    </p>
                </div>

                {/* Tab Switcher */}
                <div className={styles.tabs}>
                    {pieces.map((p) => (
                        <button
                            key={p.id}
                            id={`tab-${p.id}`}
                            className={`${styles.tab} ${styles[`tab${p.color}`]} ${activePiece === p.id ? styles.active : ""
                                }`}
                            onClick={() => setActivePiece(p.id)}
                        >
                            <span className={styles.tabEmoji}>{p.emoji}</span>
                            <span className={styles.tabLabel}>{p.title}</span>
                        </button>
                    ))}
                </div>

                {/* Content Panel */}
                <div
                    className={`${styles.panel} ${styles[`panel${current.color}`]}`}
                    key={current.id}
                >
                    <div className={styles.panelHeader}>
                        <div className={styles.panelNumber}>{current.number}</div>
                        <div>
                            <h3>
                                {current.emoji} {current.title}
                            </h3>
                            <span className={styles.panelSubtitle}>{current.subtitle}</span>
                        </div>
                    </div>

                    <p className={styles.panelDesc}>{current.description}</p>

                    <div className={styles.panelContent}>
                        <div className={styles.detailsList}>
                            <h4>How It Works</h4>
                            <ul>
                                {current.details.map((d, i) => (
                                    <li key={i}>
                                        <span className={styles.bullet}>→</span>
                                        {d}
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {current.id === "beliefs" && (
                            <div className={styles.examplesPanel}>
                                <h4>Example Beliefs</h4>
                                <div className={styles.beliefsList}>
                                    {current.examples.map((ex, i) => (
                                        <div key={i} className={styles.beliefItem}>
                                            <span className={styles.beliefName}>{ex.name}</span>
                                            <span
                                                className={`${styles.beliefValue} ${ex.value === "true"
                                                        ? styles.valueTrue
                                                        : styles.valueFalse
                                                    }`}
                                            >
                                                {ex.value}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {current.id === "actions" && (
                            <div className={styles.examplesPanel}>
                                <h4>Example Actions</h4>
                                <div className={styles.actionsTable}>
                                    <div className={styles.tableHeader}>
                                        <span>Action</span>
                                        <span>Precondition</span>
                                        <span>Effect</span>
                                        <span>Cost</span>
                                    </div>
                                    {current.examples.map((ex, i) => (
                                        <div key={i} className={styles.tableRow}>
                                            <span className={styles.actionName}>{ex.name}</span>
                                            <span className={styles.precondition}>
                                                {ex.precondition}
                                            </span>
                                            <span className={styles.effect}>{ex.effect}</span>
                                            <span className={styles.cost}>{ex.cost}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {current.id === "goals" && (
                            <div className={styles.examplesPanel}>
                                <h4>Example Goals</h4>
                                <div className={styles.goalsList}>
                                    {current.examples.map((ex, i) => (
                                        <div key={i} className={styles.goalItem}>
                                            <div className={styles.goalMain}>
                                                <span className={styles.goalName}>{ex.name}</span>
                                                <span className={styles.goalBelief}>
                                                    Desires: {ex.belief}
                                                </span>
                                            </div>
                                            <div className={styles.goalPriority}>
                                                <span className={styles.priorityLabel}>Priority</span>
                                                <span className={styles.priorityValue}>
                                                    {ex.priority}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {current.id === "planner-piece" && (
                            <div className={styles.examplesPanel}>
                                <h4>Backward Planning Process</h4>
                                <div className={styles.plannerFlow}>
                                    <div className={styles.flowStep}>
                                        <div className={styles.flowNum}>1</div>
                                        <div className={styles.flowText}>
                                            Pick <strong>highest-priority</strong> goal
                                        </div>
                                    </div>
                                    <div className={styles.flowArrow}>↓</div>
                                    <div className={styles.flowStep}>
                                        <div className={styles.flowNum}>2</div>
                                        <div className={styles.flowText}>
                                            What <strong>beliefs</strong> does it need?
                                        </div>
                                    </div>
                                    <div className={styles.flowArrow}>↓</div>
                                    <div className={styles.flowStep}>
                                        <div className={styles.flowNum}>3</div>
                                        <div className={styles.flowText}>
                                            Which <strong>actions</strong> produce those effects?
                                        </div>
                                    </div>
                                    <div className={styles.flowArrow}>↓</div>
                                    <div className={styles.flowStep}>
                                        <div className={styles.flowNum}>4</div>
                                        <div className={styles.flowText}>
                                            What are <strong>their preconditions</strong>?
                                        </div>
                                    </div>
                                    <div className={styles.flowArrow}>↓</div>
                                    <div className={styles.flowStep}>
                                        <div className={styles.flowNum}>5</div>
                                        <div className={styles.flowText}>
                                            <strong>Repeat</strong> until all satisfied
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </section>
    );
}
