// ============================================================
// SaveSystem.js — localStorage persistence for MindArena
// Saves: stage completion, best ranks, stats, unlocked abilities
// ============================================================

const SAVE_KEY = 'mindarena_save_v1';

/**
 * Default save structure
 */
function createDefaultSave() {
    return {
        version: 1,
        createdAt: Date.now(),
        lastPlayedAt: null,

        // ── Stage Progress ──
        // progress[level][stage] = { completed, bestRank, bestScore, bestPercentScore, attempts, bestTime }
        progress: {},

        // ── Cumulative Stats ──
        stats: {
            totalPlaytime: 0,       // seconds
            totalKills: 0,
            totalDeaths: 0,
            totalTasksCompleted: 0,
            totalMissionsCompleted: 0,
            totalMissionsFailed: 0,
            highestRank: null,       // 'S','A','B','C','D'
            averageScore: 0,
            totalScore: 0,
            gamesPlayed: 0,

            // Cognitive averages (tracked per game, averaged)
            cognitiveHistory: [],    // Array of { planning, prioritization, adaptability, efficiency, combat, awareness }
        },

        // ── Unlocked Abilities ──
        abilities: {
            // Unlockable by mastering levels
            scanner: false,       // Reveal nearest task through fog (Level 1 mastery)
            quickHack: false,     // 20% faster terminal hacking (Level 1 S-rank any stage)
            ironWill: false,      // Survive one lethal hit per match (Level 2 mastery)
            pathfinder: false,    // Show optimal task path on minimap (Level 2 S-rank any stage)
            ghostStep: false,     // Enemies can't detect you for 3s after dash (Level 3 mastery)
            masterPlan: false,    // See enemy planned moves during plan phase (Level 3 S-rank any stage)
        },

        // ── Settings ──
        settings: {
            musicVolume: 0.5,
            sfxVolume: 0.7,
        },
    };
}

// ─── RANK ORDERING (for comparisons) ───────────────────────

const RANK_ORDER = { S: 5, A: 4, B: 3, C: 2, D: 1 };

function isRankBetter(newRank, oldRank) {
    if (!oldRank) return true;
    return (RANK_ORDER[newRank] || 0) > (RANK_ORDER[oldRank] || 0);
}

// ─── CORE SAVE/LOAD ────────────────────────────────────────

export class SaveSystem {

    /**
     * Load save data from localStorage. Returns default if none exists.
     */
    static load() {
        try {
            if (typeof window === 'undefined') return createDefaultSave();
            const raw = localStorage.getItem(SAVE_KEY);
            if (!raw) return createDefaultSave();
            const data = JSON.parse(raw);
            // Merge with defaults (in case new fields were added)
            return SaveSystem._merge(createDefaultSave(), data);
        } catch (e) {
            console.warn('SaveSystem: Failed to load, using defaults', e);
            return createDefaultSave();
        }
    }

    /**
     * Save data to localStorage.
     */
    static save(data) {
        try {
            if (typeof window === 'undefined') return;
            data.lastPlayedAt = Date.now();
            localStorage.setItem(SAVE_KEY, JSON.stringify(data));
        } catch (e) {
            console.warn('SaveSystem: Failed to save', e);
        }
    }

    /**
     * Deep merge defaults with saved data (handles new fields gracefully)
     */
    static _merge(defaults, saved) {
        const result = { ...defaults };
        for (const key of Object.keys(saved)) {
            if (key in defaults && typeof defaults[key] === 'object' && !Array.isArray(defaults[key]) && defaults[key] !== null) {
                result[key] = SaveSystem._merge(defaults[key], saved[key] || {});
            } else {
                result[key] = saved[key];
            }
        }
        return result;
    }

    /**
     * Check if a specific stage has been completed
     */
    static isStageCompleted(level, stage) {
        const data = SaveSystem.load();
        return !!(data.progress[level]?.[stage]?.completed);
    }

    /**
     * Get best rank for a stage
     */
    static getStageBestRank(level, stage) {
        const data = SaveSystem.load();
        return data.progress[level]?.[stage]?.bestRank || null;
    }

    /**
     * Get best score for a stage
     */
    static getStageBestScore(level, stage) {
        const data = SaveSystem.load();
        return data.progress[level]?.[stage]?.bestScore || 0;
    }

    /**
     * Get the full progress object for unlock checks
     */
    static getProgress() {
        const data = SaveSystem.load();
        return data.progress;
    }

    /**
     * Get cumulative player stats
     */
    static getStats() {
        const data = SaveSystem.load();
        return data.stats;
    }

    /**
     * Get unlocked abilities
     */
    static getAbilities() {
        const data = SaveSystem.load();
        return data.abilities;
    }

    // ─── RECORD A MATCH RESULT ─────────────────────────────

    /**
     * Save the result of a completed match (victory or defeat).
     *
     * @param {number} level
     * @param {number} stage
     * @param {boolean} won
     * @param {object} results - From ScoringEngine.getResults()
     * @param {object} matchStats - { duration, kills, deaths, tasksCompleted }
     */
    static recordMatch(level, stage, won, results, matchStats = {}) {
        const data = SaveSystem.load();

        // ── Update stage progress ──
        if (!data.progress[level]) data.progress[level] = {};
        if (!data.progress[level][stage]) {
            data.progress[level][stage] = {
                completed: false,
                bestRank: null,
                bestScore: 0,
                bestPercentScore: 0,
                bestTime: Infinity,
                attempts: 0,
                firstCompletedAt: null,
                lastPlayedAt: null,
            };
        }

        const stageData = data.progress[level][stage];
        stageData.attempts++;
        stageData.lastPlayedAt = Date.now();

        if (won && results) {
            stageData.completed = true;
            if (!stageData.firstCompletedAt) {
                stageData.firstCompletedAt = Date.now();
            }

            // Update bests
            if ((results.totalScore || 0) > stageData.bestScore) {
                stageData.bestScore = results.totalScore;
            }
            if ((results.percentScore || 0) > stageData.bestPercentScore) {
                stageData.bestPercentScore = results.percentScore;
            }
            if (results.rank && isRankBetter(results.rank.label, stageData.bestRank)) {
                stageData.bestRank = results.rank.label;
            }
            const duration = matchStats.duration || 0;
            if (duration > 0 && duration < stageData.bestTime) {
                stageData.bestTime = duration;
            }
        }

        // ── Update cumulative stats ──
        data.stats.gamesPlayed++;
        data.stats.totalPlaytime += (matchStats.duration || 0);
        data.stats.totalKills += (matchStats.kills || 0);
        data.stats.totalDeaths += (matchStats.deaths || 0);
        data.stats.totalTasksCompleted += (matchStats.tasksCompleted || 0);

        if (won) {
            data.stats.totalMissionsCompleted++;
        } else {
            data.stats.totalMissionsFailed++;
        }

        if (results) {
            data.stats.totalScore += (results.totalScore || 0);
            if (data.stats.gamesPlayed > 0) {
                data.stats.averageScore = Math.round(data.stats.totalScore / data.stats.gamesPlayed);
            }

            // Track highest rank overall
            if (results.rank && isRankBetter(results.rank.label, data.stats.highestRank)) {
                data.stats.highestRank = results.rank.label;
            }

            // Cognitive analysis history (keep last 20)
            if (results.cognitiveAnalysis) {
                data.stats.cognitiveHistory.push(results.cognitiveAnalysis);
                if (data.stats.cognitiveHistory.length > 20) {
                    data.stats.cognitiveHistory = data.stats.cognitiveHistory.slice(-20);
                }
            }
        }

        // ── Check ability unlocks ──
        SaveSystem._checkAbilityUnlocks(data);

        // ── Persist ──
        SaveSystem.save(data);

        return data;
    }

    // ─── ABILITY UNLOCK CHECKS ─────────────────────────────

    static _checkAbilityUnlocks(data) {
        const p = data.progress;

        // Scanner: Complete all Level 1 stages
        if (SaveSystem._isLevelMastered(p, 1)) {
            data.abilities.scanner = true;
        }

        // Quick Hack: Get S-rank on any Level 1 stage
        if (SaveSystem._hasRankInLevel(p, 1, 'S')) {
            data.abilities.quickHack = true;
        }

        // Iron Will: Complete all Level 2 stages
        if (SaveSystem._isLevelMastered(p, 2)) {
            data.abilities.ironWill = true;
        }

        // Pathfinder: Get S-rank on any Level 2 stage
        if (SaveSystem._hasRankInLevel(p, 2, 'S')) {
            data.abilities.pathfinder = true;
        }

        // Ghost Step: Complete all Level 3 stages
        if (SaveSystem._isLevelMastered(p, 3)) {
            data.abilities.ghostStep = true;
        }

        // Master Plan: Get S-rank on any Level 3 stage
        if (SaveSystem._hasRankInLevel(p, 3, 'S')) {
            data.abilities.masterPlan = true;
        }
    }

    static _isLevelMastered(progress, level) {
        const levelProgress = progress[level];
        if (!levelProgress) return false;
        // Need stages 1, 2, 3 all completed
        return [1, 2, 3].every(s => levelProgress[s]?.completed);
    }

    static _hasRankInLevel(progress, level, rank) {
        const levelProgress = progress[level];
        if (!levelProgress) return false;
        return Object.values(levelProgress).some(s => s.bestRank === rank);
    }

    // ─── COGNITIVE AVERAGES ────────────────────────────────

    /**
     * Get averaged cognitive scores from recent matches
     */
    static getCognitiveAverages() {
        const data = SaveSystem.load();
        const history = data.stats.cognitiveHistory;
        if (history.length === 0) {
            return { planning: 0, prioritization: 0, adaptability: 0, efficiency: 0, combat: 0, awareness: 0 };
        }

        const keys = ['planning', 'prioritization', 'adaptability', 'efficiency', 'combat', 'awareness'];
        const averages = {};
        keys.forEach(key => {
            const sum = history.reduce((acc, h) => acc + (h[key] || 0), 0);
            averages[key] = Math.round(sum / history.length);
        });

        return averages;
    }

    // ─── NEXT STAGE CALCULATOR ─────────────────────────────

    /**
     * Get the next stage after the given one (1.1→1.2→1.3→2.1→...)
     * Returns null if no more stages.
     */
    static getNextStage(currentLevel, currentStage) {
        let nextLevel = currentLevel;
        let nextStage = currentStage + 1;
        if (nextStage > 3) {
            nextLevel++;
            nextStage = 1;
        }
        if (nextLevel > 3) return null;
        return { level: nextLevel, stage: nextStage };
    }

    // ─── RESET ─────────────────────────────────────────────

    /**
     * Wipe all save data (with confirmation)
     */
    static reset() {
        try {
            if (typeof window === 'undefined') return;
            localStorage.removeItem(SAVE_KEY);
        } catch (e) {
            console.warn('SaveSystem: Failed to reset', e);
        }
    }

    /**
     * Get formatted playtime string
     */
    static formatPlaytime(seconds) {
        const hrs = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        if (hrs > 0) return `${hrs}h ${mins}m`;
        return `${mins}m`;
    }

    /**
     * Get a summary of overall progression
     */
    static getProgressionSummary() {
        const data = SaveSystem.load();
        const p = data.progress;

        let stagesCompleted = 0;
        let totalStages = 9;
        const ranks = { S: 0, A: 0, B: 0, C: 0, D: 0 };

        for (const level of [1, 2, 3]) {
            for (const stage of [1, 2, 3]) {
                const sd = p[level]?.[stage];
                if (sd?.completed) {
                    stagesCompleted++;
                    if (sd.bestRank && ranks[sd.bestRank] !== undefined) {
                        ranks[sd.bestRank]++;
                    }
                }
            }
        }

        return {
            stagesCompleted,
            totalStages,
            completionPercent: Math.round((stagesCompleted / totalStages) * 100),
            ranks,
            stats: data.stats,
            abilities: data.abilities,
            cognitiveAverages: SaveSystem.getCognitiveAverages(),
        };
    }
}
