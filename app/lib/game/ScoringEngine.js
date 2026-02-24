// ============================================================
// ScoringEngine.js — Multi-category scoring + rank system
// Evaluates player performance across 6 dimensions
// ============================================================

/**
 * Rank thresholds and metadata
 */
export const RANKS = {
    S: { min: 90, label: 'S', title: 'Master Strategist', color: '#ffd740', badge: '🏆', description: 'Perfect planning and execution' },
    A: { min: 75, label: 'A', title: 'Elite Planner', color: '#22c55e', badge: '⭐', description: 'Excellent strategic thinking' },
    B: { min: 50, label: 'B', title: 'Competent Tactician', color: '#42a5f5', badge: '🎖️', description: 'Good foundations, room to optimize' },
    C: { min: 25, label: 'C', title: 'Developing Thinker', color: '#aaaaaa', badge: '📋', description: 'Learning the basics' },
    D: { min: 0, label: 'D', title: 'Rookie', color: '#666666', badge: '🔰', description: 'Keep practicing!' },
};

/**
 * Scoring category weights (must sum to 1.0)
 */
export const SCORE_WEIGHTS = {
    taskCompletion: 0.30,  // How many objectives completed
    priorityScore: 0.25,  // Did you do them in optimal order
    timeEfficiency: 0.15,  // How quickly
    combatScore: 0.10,  // Enemies defeated
    resourceManagement: 0.10,  // Health/stamina remaining
    strategyScore: 0.10,  // Zone control, shortcuts, intel
};

// ─── SCORING ENGINE ─────────────────────────────────────

export class ScoringEngine {
    constructor() {
        this.categories = {};
        this.rawScores = {};
        this.totalScore = 0;
        this.rank = RANKS.D;
        this.percentScore = 0;
        this.maxPossibleScore = 0;
        this.cognitiveAnalysis = {};
    }

    /**
     * Calculate the full score breakdown after a match.
     *
     * @param {object} matchData - All data needed for scoring
     * @param {object} matchData.taskSystem - The TaskSystem instance
     * @param {number} matchData.matchDuration - Total match time in seconds
     * @param {number} matchData.timeLimit - Max time allowed
     * @param {number} matchData.killCount - Enemies defeated
     * @param {number} matchData.totalEnemies - Total enemies that spawned
     * @param {number} matchData.healthRemaining - Player health at end (0-100)
     * @param {number} matchData.staminaRemaining - Player stamina at end (0-100)
     * @param {number} matchData.powerCollected - Total power/orbs collected
     * @param {number} matchData.damageTaken - Total damage received
     * @param {number} matchData.distanceTraveled - Total distance walked
     * @param {number} matchData.zoneControlTime - Seconds spent controlling zones
     * @param {number} matchData.shortcutsUsed - Number of shortcuts/efficient paths taken
     * @param {boolean} matchData.won - Did the player win?
     * @param {number} matchData.level - Level number (1-3)
     * @param {number} matchData.stage - Stage number (1-3)
     */
    calculate(matchData) {
        const {
            taskSystem,
            matchDuration = 0,
            timeLimit = 120,
            killCount = 0,
            totalEnemies = 1,
            healthRemaining = 0,
            staminaRemaining = 0,
            powerCollected = 0,
            damageTaken = 0,
            distanceTraveled = 0,
            zoneControlTime = 0,
            shortcutsUsed = 0,
            won = false,
            level = 1,
            stage = 1,
        } = matchData;

        // ── 1. TASK COMPLETION (30%) ──
        const taskCompletionScore = this._calcTaskCompletion(taskSystem, won);

        // ── 2. PRIORITY SCORE (25%) ──
        const priorityScore = this._calcPriorityScore(taskSystem);

        // ── 3. TIME EFFICIENCY (15%) ──
        const timeScore = this._calcTimeEfficiency(matchDuration, timeLimit, won);

        // ── 4. COMBAT SCORE (10%) ──
        const combatScore = this._calcCombatScore(killCount, totalEnemies, damageTaken);

        // ── 5. RESOURCE MANAGEMENT (10%) ──
        const resourceScore = this._calcResourceScore(healthRemaining, staminaRemaining, powerCollected);

        // ── 6. STRATEGY SCORE (10%) ──
        const strategyScore = this._calcStrategyScore(
            zoneControlTime, shortcutsUsed, distanceTraveled, matchDuration, taskSystem
        );

        // Store raw scores (0-100 each)
        this.rawScores = {
            taskCompletion: taskCompletionScore,
            priorityScore: priorityScore,
            timeEfficiency: timeScore,
            combatScore: combatScore,
            resourceManagement: resourceScore,
            strategyScore: strategyScore,
        };

        // Calculate weighted total
        this.totalScore = 0;
        for (const [key, weight] of Object.entries(SCORE_WEIGHTS)) {
            this.totalScore += (this.rawScores[key] || 0) * weight;
        }
        this.totalScore = Math.round(this.totalScore);

        // Level/stage difficulty multiplier (higher levels = more max score)
        const difficultyMultiplier = 1 + ((level - 1) * 0.3) + ((stage - 1) * 0.1);
        this.maxPossibleScore = Math.round(100 * difficultyMultiplier);
        this.percentScore = Math.min(100, Math.round((this.totalScore / 100) * 100));

        // Win bonus
        if (won) {
            this.totalScore = Math.round(this.totalScore * 1.2); // +20% for winning
            this.percentScore = Math.min(100, this.percentScore + 10);
        }

        // Determine rank
        this.rank = this._determineRank(this.percentScore);

        // Generate cognitive analysis
        this.cognitiveAnalysis = this._generateCognitiveAnalysis();

        // Build category details for UI
        this.categories = {
            taskCompletion: {
                label: 'Task Completion',
                score: this.rawScores.taskCompletion,
                weight: SCORE_WEIGHTS.taskCompletion,
                weighted: Math.round(this.rawScores.taskCompletion * SCORE_WEIGHTS.taskCompletion),
                icon: '🎯',
                color: '#26c6da',
                detail: this._getTaskCompletionDetail(taskSystem),
            },
            priorityScore: {
                label: 'Priority & Planning',
                score: this.rawScores.priorityScore,
                weight: SCORE_WEIGHTS.priorityScore,
                weighted: Math.round(this.rawScores.priorityScore * SCORE_WEIGHTS.priorityScore),
                icon: '🧠',
                color: '#ffd740',
                detail: this._getPriorityDetail(taskSystem),
            },
            timeEfficiency: {
                label: 'Time Efficiency',
                score: this.rawScores.timeEfficiency,
                weight: SCORE_WEIGHTS.timeEfficiency,
                weighted: Math.round(this.rawScores.timeEfficiency * SCORE_WEIGHTS.timeEfficiency),
                icon: '⏱️',
                color: '#ff7043',
                detail: `${Math.round(matchDuration)}s / ${timeLimit}s`,
            },
            combatScore: {
                label: 'Combat',
                score: this.rawScores.combatScore,
                weight: SCORE_WEIGHTS.combatScore,
                weighted: Math.round(this.rawScores.combatScore * SCORE_WEIGHTS.combatScore),
                icon: '⚔️',
                color: '#ef5350',
                detail: `${killCount} kills, ${damageTaken} dmg taken`,
            },
            resourceManagement: {
                label: 'Resource Management',
                score: this.rawScores.resourceManagement,
                weight: SCORE_WEIGHTS.resourceManagement,
                weighted: Math.round(this.rawScores.resourceManagement * SCORE_WEIGHTS.resourceManagement),
                icon: '💊',
                color: '#66bb6a',
                detail: `HP: ${healthRemaining}%, Stamina: ${Math.round(staminaRemaining)}%`,
            },
            strategyScore: {
                label: 'Strategy',
                score: this.rawScores.strategyScore,
                weight: SCORE_WEIGHTS.strategyScore,
                weighted: Math.round(this.rawScores.strategyScore * SCORE_WEIGHTS.strategyScore),
                icon: '🗺️',
                color: '#ab47bc',
                detail: `Zone: ${Math.round(zoneControlTime)}s, ${shortcutsUsed} efficient paths`,
            },
        };

        return this.getResults();
    }

    // ─── INDIVIDUAL CATEGORY CALCULATORS ─────────────────

    _calcTaskCompletion(taskSystem, won) {
        if (!taskSystem) return 0;
        const total = taskSystem.getAllNonExtractionTasks().length;
        if (total === 0) return won ? 100 : 0;

        const playerDone = taskSystem.getPlayerCompletedCount();
        const completionPct = playerDone / total;

        // Base: 0-80 for completion percentage
        let score = completionPct * 80;

        // Bonus: +20 for winning the match
        if (won) score += 20;

        return Math.min(100, Math.round(score));
    }

    _calcPriorityScore(taskSystem) {
        if (!taskSystem) return 0;
        const optimalOrder = taskSystem.optimalOrder;
        const playerOrder = taskSystem.playerCompletionOrder;

        if (optimalOrder.length === 0 || playerOrder.length === 0) return 0;

        // Compare player's order against optimal order
        let matches = 0;
        let closeMatches = 0;
        const maxCompare = Math.min(optimalOrder.length, playerOrder.length);

        for (let i = 0; i < maxCompare; i++) {
            if (playerOrder[i] === optimalOrder[i]) {
                matches++;
            } else {
                // Check if it's within ±1 of correct position
                const optIdx = optimalOrder.indexOf(playerOrder[i]);
                if (optIdx >= 0 && Math.abs(optIdx - i) <= 1) {
                    closeMatches++;
                }
            }
        }

        const perfectPct = matches / optimalOrder.length;
        const closePct = closeMatches / optimalOrder.length;

        // Perfect matches worth full points, close matches worth half
        const score = (perfectPct * 80) + (closePct * 40) + (playerOrder.length > 0 ? 10 : 0);

        return Math.min(100, Math.round(score));
    }

    _calcTimeEfficiency(duration, timeLimit, won) {
        if (!won) {
            // If lost, score based on how long you survived vs time limit
            return Math.min(50, Math.round((duration / timeLimit) * 50));
        }

        // Faster = better
        const timeRatio = duration / timeLimit;
        if (timeRatio <= 0.3) return 100;       // Under 30% of time limit
        if (timeRatio <= 0.5) return 85;        // Under 50%
        if (timeRatio <= 0.7) return 70;        // Under 70%
        if (timeRatio <= 0.9) return 55;        // Under 90%
        return 40;                               // Used almost all time
    }

    _calcCombatScore(kills, totalEnemies, damageTaken) {
        // Kill ratio: how many enemies did you defeat
        const killRatio = totalEnemies > 0 ? Math.min(1, kills / totalEnemies) : 0;

        // Damage efficiency: less damage taken = better
        const damageEfficiency = Math.max(0, 1 - (damageTaken / 200));

        // Weighted: kills 60%, damage efficiency 40%
        const score = (killRatio * 60) + (damageEfficiency * 40);

        return Math.min(100, Math.round(score));
    }

    _calcResourceScore(health, stamina, power) {
        // Health remaining (0-100) → 50% weight
        const healthScore = health * 0.5;

        // Stamina remaining (0-100) → 20% weight
        const staminaScore = (stamina / 100) * 20;

        // Power collected → 30% weight (capped at 100)
        const powerScore = Math.min(100, power) * 0.3;

        return Math.min(100, Math.round(healthScore + staminaScore + powerScore));
    }

    _calcStrategyScore(zoneTime, shortcuts, distance, duration, taskSystem) {
        // Zone control time → 30 points max
        const zoneScore = Math.min(30, zoneTime * 2);

        // Efficiency: less distance per task = smarter pathing
        let efficiencyScore = 30;
        if (taskSystem) {
            const completedCount = taskSystem.getPlayerCompletedCount();
            if (completedCount > 0 && distance > 0) {
                const distPerTask = distance / completedCount;
                // Under 200px per task = perfect, over 600px = bad
                efficiencyScore = Math.max(0, Math.min(30, 30 - ((distPerTask - 200) / 400) * 30));
            }
        }

        // Shortcuts / efficient decisions → 20 points max
        const shortcutScore = Math.min(20, shortcuts * 5);

        // Base participation → 20 points
        const baseScore = duration > 10 ? 20 : (duration / 10) * 20;

        return Math.min(100, Math.round(zoneScore + efficiencyScore + shortcutScore + baseScore));
    }

    // ─── RANK DETERMINATION ─────────────────────────────

    _determineRank(percentScore) {
        if (percentScore >= RANKS.S.min) return RANKS.S;
        if (percentScore >= RANKS.A.min) return RANKS.A;
        if (percentScore >= RANKS.B.min) return RANKS.B;
        if (percentScore >= RANKS.C.min) return RANKS.C;
        return RANKS.D;
    }

    // ─── COGNITIVE ANALYSIS ─────────────────────────────

    _generateCognitiveAnalysis() {
        const s = this.rawScores;

        return {
            planning: Math.round((s.priorityScore * 0.6 + s.timeEfficiency * 0.4)),
            prioritization: Math.round(s.priorityScore),
            adaptability: Math.round((s.strategyScore * 0.5 + s.combatScore * 0.3 + s.resourceManagement * 0.2)),
            efficiency: Math.round((s.timeEfficiency * 0.5 + s.strategyScore * 0.5)),
            combat: Math.round(s.combatScore),
            awareness: Math.round((s.taskCompletion * 0.4 + s.strategyScore * 0.6)),
        };
    }

    // ─── DETAIL STRINGS ─────────────────────────────────

    _getTaskCompletionDetail(taskSystem) {
        if (!taskSystem) return 'N/A';
        const total = taskSystem.getAllNonExtractionTasks().length;
        const playerDone = taskSystem.getPlayerCompletedCount();
        const agentDone = taskSystem.getAgentCompletedCount();
        return `You: ${playerDone}/${total} | AI: ${agentDone}/${total}`;
    }

    _getPriorityDetail(taskSystem) {
        if (!taskSystem) return 'N/A';
        const optLen = taskSystem.optimalOrder.length;
        const playerLen = taskSystem.playerCompletionOrder.length;
        let matches = 0;
        for (let i = 0; i < Math.min(optLen, playerLen); i++) {
            if (taskSystem.playerCompletionOrder[i] === taskSystem.optimalOrder[i]) matches++;
        }
        return `${matches}/${optLen} in optimal order`;
    }

    // ─── RESULTS EXPORT ─────────────────────────────────

    getResults() {
        return {
            totalScore: this.totalScore,
            percentScore: this.percentScore,
            rank: this.rank,
            categories: this.categories,
            rawScores: this.rawScores,
            cognitiveAnalysis: this.cognitiveAnalysis,
        };
    }
}
