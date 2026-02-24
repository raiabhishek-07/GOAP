/**
 * MindArena Analytics & Scoring System
 * Evaluates decision efficiency, planning depth, and resource management.
 */
export class AnalyticsManager {
    constructor() {
        this.reset();
    }

    reset() {
        this.stats = {
            startTime: Date.now(),
            decisions: 0,
            optimalDecisions: 0,
            tasksCompleted: 0,
            combatScore: 0,
            survivalTime: 0,
            resourceEfficiency: 100
        };
        this.history = [];
    }

    logDecision(isOptimal) {
        this.stats.decisions++;
        if (isOptimal) this.stats.optimalDecisions++;
    }

    logTask() {
        this.stats.tasksCompleted++;
    }

    logCombat(points) {
        this.stats.combatScore += points;
    }

    calculateScore() {
        const timeAlive = (Date.now() - this.stats.startTime) / 1000;
        const decisionQuality = (this.stats.optimalDecisions / Math.max(1, this.stats.decisions)) * 100;

        const survivalScore = timeAlive * 10;
        const taskScore = this.stats.tasksCompleted * 50;
        const cognitiveBonus = (decisionQuality * 2);

        return {
            total: Math.round(survivalScore + taskScore + this.stats.combatScore + cognitiveBonus),
            metrics: {
                decisionQuality: Math.round(decisionQuality),
                survivalTime: Math.round(timeAlive),
                tasks: this.stats.tasksCompleted,
                planningDepth: 85 // Mocked for now
            }
        };
    }
}
