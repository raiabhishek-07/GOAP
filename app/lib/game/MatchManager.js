// ============================================================
// MatchManager.js — Orchestrates the match lifecycle
// Deploy → Plan Phase → Battle Phase → Score → Results
// ============================================================

import { TaskSystem } from './TaskSystem.js';
import { ScoringEngine } from './ScoringEngine.js';
import { getStageConfig, getStageTasks } from './LevelConfig.js';

/**
 * Match phases
 */
export const MATCH_PHASE = {
    LOADING: 'loading',      // Loading assets
    BRIEFING: 'briefing',     // Pre-mission briefing
    PLANNING: 'planning',     // 5-second plan phase (map overview)
    BATTLE: 'battle',       // Active gameplay
    SCORE: 'score',        // Calculating score
    RESULTS: 'results',      // Showing results
    ENDED: 'ended',        // Match over
};

/**
 * Match end reasons
 */
export const END_REASON = {
    VICTORY: 'victory',      // All tasks + extraction
    TIME_UP: 'time_up',      // Timer ran out
    ELIMINATED: 'eliminated',   // Player died
    OUTPLANNED: 'outplanned',   // AI completed all tasks first
};

// ─── MATCH MANAGER ──────────────────────────────────────

export class MatchManager {
    constructor() {
        this.phase = MATCH_PHASE.LOADING;
        this.level = 1;
        this.stage = 1;
        this.stageConfig = null;

        // Core systems
        this.taskSystem = new TaskSystem();
        this.scoringEngine = new ScoringEngine();

        // Timing
        this.matchStartTime = 0;
        this.matchDuration = 0;
        this.timeLimit = 120;
        this.planPhaseTime = 5.0;     // seconds for planning
        this.planPhaseTimer = 0;

        // Match data (accumulated during play)
        this.killCount = 0;
        this.totalEnemiesSpawned = 0;
        this.damageTaken = 0;
        this.distanceTraveled = 0;
        this.zoneControlTime = 0;
        this.shortcutsUsed = 0;
        this.powerCollected = 0;
        this.lastPlayerPos = null;

        // Results
        this.endReason = null;
        this.results = null;

        // Events (callbacks)
        this.onPhaseChange = [];        // (newPhase, oldPhase) => {}
        this.onTaskComplete = [];       // (task, who) => {}
        this.onMatchEnd = [];           // (endReason, results) => {}
        this.onTimerWarning = [];       // (secondsLeft) => {}
    }

    /**
     * Initialize a new match
     */
    init(level, stage) {
        this.level = level;
        this.stage = stage;
        this.stageConfig = getStageConfig(level, stage);

        if (!this.stageConfig) {
            console.error(`MatchManager: No config for Level ${level} Stage ${stage}`);
            return false;
        }

        // Reset match data
        this.matchStartTime = 0;
        this.matchDuration = 0;
        this.timeLimit = this.stageConfig.timeLimit || 600; // Longer for training
        this.planPhaseTime = (level === 0) ? 2.0 : 5.0; // Short plan phase for training
        this.planPhaseTimer = this.planPhaseTime;

        this.killCount = 0;
        this.totalEnemiesSpawned = this.stageConfig.agents?.length || 0;
        this.damageTaken = 0;
        this.distanceTraveled = 0;
        this.zoneControlTime = 0;
        this.shortcutsUsed = 0;
        this.powerCollected = 0;
        this.lastPlayerPos = null;
        this.endReason = null;
        this.results = null;

        // Initialize task system
        const tasks = getStageTasks(level, stage);
        this.taskSystem.init(tasks);

        // Start in briefing phase
        this.setPhase(MATCH_PHASE.BRIEFING);

        return true;
    }

    /**
     * Start the planning phase (5-second countdown)
     */
    startPlanPhase() {
        this.planPhaseTimer = this.planPhaseTime;
        this.setPhase(MATCH_PHASE.PLANNING);
    }

    /**
     * Start the battle phase
     */
    startBattle() {
        this.matchStartTime = Date.now();
        this.matchDuration = 0;
        this.setPhase(MATCH_PHASE.BATTLE);
    }

    /**
     * Update — call every frame during gameplay
     */
    update(dt, playerData = {}) {
        if (this.phase === MATCH_PHASE.PLANNING) {
            this.planPhaseTimer -= dt;
            if (this.planPhaseTimer <= 0) {
                this.startBattle();
            }
            return;
        }

        if (this.phase !== MATCH_PHASE.BATTLE) return;

        // Update match timer
        this.matchDuration += dt;

        // Track distance
        if (playerData.position && this.lastPlayerPos) {
            const dx = playerData.position.x - this.lastPlayerPos.x;
            const dy = playerData.position.y - this.lastPlayerPos.y;
            this.distanceTraveled += Math.sqrt(dx * dx + dy * dy);
        }
        if (playerData.position) {
            this.lastPlayerPos = { ...playerData.position };
        }

        // Timer warnings (disabled for training)
        if (this.level !== 0) {
            const remaining = this.getTimeRemaining();
            if ([30, 15, 10, 5].includes(Math.ceil(remaining)) && remaining > 0) {
                this._emit(this.onTimerWarning, Math.ceil(remaining));
            }
        }

        // Check time up
        if (this.matchDuration >= this.timeLimit) {
            this.endMatch(END_REASON.TIME_UP, playerData);
            return;
        }

        // Check player death
        if (playerData.health !== undefined && playerData.health <= 0) {
            this.endMatch(END_REASON.ELIMINATED, playerData);
            return;
        }

        // Check if AI completed everything (AI doesn't compete in training)
        if (this.level !== 0) {
            const totalTasks = this.taskSystem.getAllNonExtractionTasks().length;
            if (totalTasks > 0 && this.taskSystem.getAgentCompletedCount() >= totalTasks) {
                this.endMatch(END_REASON.OUTPLANNED, playerData);
                return;
            }
        }
    }

    /**
     * Player tries to interact with a task
     */
    playerInteract(taskId, dt) {
        if (this.phase !== MATCH_PHASE.BATTLE) return null;

        const result = this.taskSystem.tryInteract(taskId, 'player', dt);

        if (result.success && result.reward > 0) {
            this._emit(this.onTaskComplete, result.task, 'player');
        }

        return result;
    }

    /**
     * AI agent tries to interact with a task
     */
    agentInteract(taskId, agentId, dt) {
        if (this.phase !== MATCH_PHASE.BATTLE) return null;

        const result = this.taskSystem.tryInteract(taskId, `agent_${agentId}`, dt);

        if (result.success && result.reward > 0) {
            this._emit(this.onTaskComplete, result.task, `agent_${agentId}`);
        }

        return result;
    }

    /**
     * Record a kill
     */
    recordKill() {
        this.killCount++;
    }

    /**
     * Record damage taken
     */
    recordDamage(amount) {
        this.damageTaken += amount;
    }

    /**
     * Record power collected
     */
    recordPower(amount) {
        this.powerCollected += amount;
    }

    /**
     * Record zone control time
     */
    addZoneControlTime(dt) {
        this.zoneControlTime += dt;
    }

    /**
     * Check victory (all tasks done + reached extraction)
     */
    checkVictory(playerData) {
        if (this.phase !== MATCH_PHASE.BATTLE) return false;

        const allTasksDone = this.taskSystem.getCompletionPercent() >= 1.0;
        if (!allTasksDone) return false;

        // Check if player is near extraction point
        const extraction = this.stageConfig.extraction;
        if (!extraction || !playerData.position) return false;

        const dist = Math.sqrt(
            (playerData.position.x - extraction.x) ** 2 +
            (playerData.position.y - extraction.y) ** 2
        );

        if (dist < 60) {
            this.endMatch(END_REASON.VICTORY, playerData);
            return true;
        }

        return false;
    }

    /**
     * End the match and calculate score
     */
    endMatch(reason, playerData = {}) {
        if (this.phase === MATCH_PHASE.ENDED) return;

        this.endReason = reason;

        // Calculate final score
        this.results = this.scoringEngine.calculate({
            taskSystem: this.taskSystem,
            matchDuration: this.matchDuration,
            timeLimit: this.timeLimit,
            killCount: this.killCount,
            totalEnemies: this.totalEnemiesSpawned,
            healthRemaining: playerData.health || 0,
            staminaRemaining: playerData.stamina || 0,
            powerCollected: this.powerCollected,
            damageTaken: this.damageTaken,
            distanceTraveled: this.distanceTraveled,
            zoneControlTime: this.zoneControlTime,
            shortcutsUsed: this.shortcutsUsed,
            won: reason === END_REASON.VICTORY,
            level: this.level,
            stage: this.stage,
        });

        this.setPhase(MATCH_PHASE.ENDED);
        this._emit(this.onMatchEnd, reason, this.results);
    }

    // ─── GETTERS ────────────────────────────────────────

    getTimeRemaining() {
        return Math.max(0, this.timeLimit - this.matchDuration);
    }

    getTimeElapsed() {
        return this.matchDuration;
    }

    getFormattedTime() {
        const remaining = this.getTimeRemaining();
        const mins = Math.floor(remaining / 60);
        const secs = Math.floor(remaining % 60);
        return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }

    getPlanPhaseRemaining() {
        return Math.max(0, this.planPhaseTimer);
    }

    isInBattle() {
        return this.phase === MATCH_PHASE.BATTLE;
    }

    isPlanning() {
        return this.phase === MATCH_PHASE.PLANNING;
    }

    hasEnded() {
        return this.phase === MATCH_PHASE.ENDED;
    }

    didWin() {
        return this.endReason === END_REASON.VICTORY;
    }

    /**
     * Get full HUD data packet for the UI
     */
    getHUDData() {
        return {
            phase: this.phase,
            time: this.getFormattedTime(),
            timeRemaining: this.getTimeRemaining(),
            timeLimit: this.timeLimit,
            planTimeRemaining: this.getPlanPhaseRemaining(),
            kills: this.killCount,
            tasks: this.taskSystem.getHUDData(),
            level: this.level,
            stage: this.stage,
            stageName: this.stageConfig?.name || '',
            stageObjective: this.stageConfig?.objective || '',
        };
    }

    // ─── INTERNAL ───────────────────────────────────────

    setPhase(newPhase) {
        const oldPhase = this.phase;
        this.phase = newPhase;
        this._emit(this.onPhaseChange, newPhase, oldPhase);
    }

    _emit(listeners, ...args) {
        for (const cb of listeners) {
            try { cb(...args); } catch (e) { console.error('MatchManager event error:', e); }
        }
    }
}
