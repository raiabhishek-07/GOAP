export class GOAPPlanner {
    constructor() {
        // Predefined action set for GOAP
        this.actions = [
            { name: "MoveToPlayer", pre: (ws) => ws.playerVisible, effect: (ws) => { ws.nearPlayer = true; }, cost: 2 },
            { name: "ShootPlayer", pre: (ws) => ws.nearPlayer && ws.hasAmmo, effect: (ws) => { ws.playerHealthReduced = true; }, cost: 3 },
            { name: "MoveToCover", pre: (ws) => ws.lowHealth, effect: (ws) => { ws.nearCover = true; }, cost: 2 },
            { name: "ReloadWeapon", pre: (ws) => !ws.hasAmmo, effect: (ws) => { ws.hasAmmo = true; }, cost: 1 },
            { name: "FlankLeft", pre: (ws) => ws.teammateNearby && ws.playerVisible, effect: (ws) => { ws.advantageousPosition = true; }, cost: 4 }
        ];
    }

    plan(goal, worldState) {
        // Simple mapping representing GOAP resolution
        switch (goal) {
            case 'Reload':
                return 'ReloadWeapon';
            case 'TakeCover':
                return 'MoveToCover';
            case 'FlankPlayer':
                return 'FlankLeft';
            case 'EliminatePlayer':
                if (worldState.nearPlayer && worldState.hasAmmo) return 'ShootPlayer';
                return 'MoveToPlayer';
            default:
                return 'Wait';
        }
    }
}
