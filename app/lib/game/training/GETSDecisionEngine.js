export class GETSDecisionEngine {
    constructor() { }

    evaluateGoals(worldState) {
        // Goal Evaluation + Tactical Search (GETS)
        let goals = {
            EliminatePlayer: 0,
            TakeCover: 0,
            Reload: 0,
            FlankPlayer: 0
        };

        // Scoring rules based on MASTER PROMPT
        if (worldState.playerVisible) goals.EliminatePlayer += 50;
        if (worldState.lowHealth) goals.TakeCover += 70;
        if (worldState.ammo === 0) goals.Reload += 80;
        if (worldState.teammateNearby && worldState.playerVisible) goals.FlankPlayer += 40;

        let bestGoal = 'EliminatePlayer';
        let maxScore = -1;

        for (const [goal, score] of Object.entries(goals)) {
            if (score > maxScore) {
                maxScore = score;
                bestGoal = goal;
            }
        }

        return bestGoal;
    }
}
