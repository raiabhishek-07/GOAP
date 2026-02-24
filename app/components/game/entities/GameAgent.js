import { BaseSurvivor } from "./BaseSurvivor";
import { GoapAgent } from "../../../lib/goap/agent";

export class GameAgent extends BaseSurvivor {
    constructor(scene, x, y, label) {
        super(scene, x, y, label, true);
        this.logic = new GoapAgent();
        this.logic.position = { x, y };
    }

    update(dt) {
        this.logic.update(dt);

        // Sync Logic Position to Visuals (Phaser)
        this.x = this.logic.position.x;
        this.y = this.logic.position.y;

        const stats = this.logic.getDebugState();
        this.updateStats(stats.health);

        // Scale effect based on action
        if (stats.currentAction.toLowerCase().includes('attack')) {
            this.setScale(1.1 + Math.sin(this.scene.time.now / 50) * 0.05);
        } else {
            this.setScale(1);
        }
    }
}
