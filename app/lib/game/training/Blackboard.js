export class Blackboard {
    constructor() {
        this.lastKnownPlayerPosition = null;
        this.attackMode = false;
        this.squadState = 'patrol';
    }

    broadcast(event, data) {
        if (event === 'PlayerSpotted') {
            this.lastKnownPlayerPosition = { ...data.position };
            this.attackMode = true;
            this.squadState = 'attack';
        }
    }
}
