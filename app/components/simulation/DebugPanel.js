"use client";
import styles from "./DebugPanel.module.css";

export default function DebugPanel({ debugState }) {
    if (!debugState) {
        return (
            <div className={styles.panel}>
                <div className={styles.loading}>Initializing GOAP Engine...</div>
            </div>
        );
    }

    const {
        health, stamina, currentGoal, currentAction,
        planActions, beliefs, logs, playerInChaseRange, playerInAttackRange
    } = debugState;

    return (
        <div className={styles.panel}>
            {/* Stats */}
            <div className={styles.section}>
                <h4 className={styles.sectionTitle}>
                    <span className={styles.titleIcon}>📊</span> Agent Stats
                </h4>

                <div className={styles.statRow}>
                    <div className={styles.statInfo}>
                        <span className={styles.statLabel}>Health</span>
                        <span className={styles.statVal}>{Math.round(health)}</span>
                    </div>
                    <div className={styles.barBg}>
                        <div
                            className={styles.barFill}
                            style={{
                                width: `${health}%`,
                                background: health > 50 ? '#22c55e' : health > 25 ? '#f59e0b' : '#ef4444'
                            }}
                        />
                    </div>
                </div>

                <div className={styles.statRow}>
                    <div className={styles.statInfo}>
                        <span className={styles.statLabel}>Stamina</span>
                        <span className={styles.statVal}>{Math.round(stamina)}</span>
                    </div>
                    <div className={styles.barBg}>
                        <div
                            className={styles.barFill}
                            style={{ width: `${stamina}%`, background: '#3b82f6' }}
                        />
                    </div>
                </div>
            </div>

            {/* Current Plan */}
            <div className={styles.section}>
                <h4 className={styles.sectionTitle}>
                    <span className={styles.titleIcon}>🎯</span> Current Plan
                </h4>

                <div className={styles.planInfo}>
                    <div className={styles.planRow}>
                        <span className={styles.planLabel}>Goal</span>
                        <span className={`${styles.planValue} ${currentGoal !== 'None' ? styles.active : ''}`}>
                            {currentGoal}
                        </span>
                    </div>
                    <div className={styles.planRow}>
                        <span className={styles.planLabel}>Action</span>
                        <span className={`${styles.planValue} ${currentAction !== 'None' ? styles.active : ''}`}>
                            {currentAction}
                        </span>
                    </div>
                </div>

                {planActions.length > 0 && (
                    <div className={styles.planStack}>
                        <span className={styles.stackLabel}>Plan Stack:</span>
                        {planActions.map((a, i) => (
                            <span key={i} className={styles.stackItem}>{a}</span>
                        ))}
                    </div>
                )}
            </div>

            {/* Sensors */}
            <div className={styles.section}>
                <h4 className={styles.sectionTitle}>
                    <span className={styles.titleIcon}>📡</span> Sensors
                </h4>
                <div className={styles.sensorGrid}>
                    <div className={`${styles.sensorItem} ${playerInChaseRange ? styles.sensorActive : ''}`}>
                        <span className={styles.sensorDot} style={{ background: playerInChaseRange ? '#ef4444' : '#374151' }} />
                        <span>Chase Range</span>
                        <span className={styles.sensorStatus}>{playerInChaseRange ? 'DETECTED' : 'clear'}</span>
                    </div>
                    <div className={`${styles.sensorItem} ${playerInAttackRange ? styles.sensorActive : ''}`}>
                        <span className={styles.sensorDot} style={{ background: playerInAttackRange ? '#ef4444' : '#374151' }} />
                        <span>Attack Range</span>
                        <span className={styles.sensorStatus}>{playerInAttackRange ? 'IN RANGE' : 'clear'}</span>
                    </div>
                </div>
            </div>

            {/* Beliefs */}
            <div className={styles.section}>
                <h4 className={styles.sectionTitle}>
                    <span className={styles.titleIcon}>🧠</span> Beliefs
                </h4>
                <div className={styles.beliefsList}>
                    {Object.entries(beliefs).map(([key, value]) => (
                        <div key={key} className={styles.beliefRow}>
                            <span className={styles.beliefName}>{key}</span>
                            <span className={`${styles.beliefVal} ${value ? styles.trueVal : styles.falseVal}`}>
                                {value ? 'true' : 'false'}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Activity Log */}
            <div className={styles.section}>
                <h4 className={styles.sectionTitle}>
                    <span className={styles.titleIcon}>📝</span> Activity Log
                </h4>
                <div className={styles.logList}>
                    {logs.length === 0 ? (
                        <span className={styles.logEmpty}>Awaiting first plan...</span>
                    ) : (
                        logs.map((log, i) => (
                            <div key={i} className={styles.logEntry} style={{ opacity: 1 - i * 0.06 }}>
                                {log.message}
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
