import { BaseSurvivor } from "./BaseSurvivor";
import { GoapAgent } from "../../../lib/goap/agent";

export class ShadowStalker extends BaseSurvivor {
    constructor(scene, x, y, label) {
        // Darker skin and red eyes for the zombie/stalker look
        super(scene, x, y, label, true, {
            skin: 0x64748b, // Ash/undead skin
            hair: 0x1e293b, // Dark hair
            body: 0x0f172a  // Dark uniform
        });

        this.logic = new GoapAgent();
        this.logic.position = { x, y };
        this.logic.speed = 110; // Faster than normal initiates

        this.applyShadowTheme();
    }

    applyShadowTheme() {
        // Add glowing red eyes
        const eyeL = this.scene.add.circle(-5, -2, 2, 0xff0000);
        const eyeR = this.scene.add.circle(5, -2, 2, 0xff0000);
        this.visuals.add([eyeL, eyeR]);

        // Red Pulsing Glow
        this.aura = this.scene.add.graphics();
        this.aura.fillStyle(0xef4444, 0.1);
        this.aura.fillCircle(0, 0, 30);
        this.visuals.addAt(this.aura, 0); // Behind character
    }

    update(dt) {
        this.logic.update(dt);

        this.x = this.logic.position.x;
        this.y = this.logic.position.y;

        const stats = this.logic.getDebugState();
        this.updateStats(stats.health);

        // Aggressive Aura Animation
        this.aura.alpha = 0.1 + Math.sin(this.scene.time.now / 100) * 0.1;
        this.aura.scale = 1 + Math.sin(this.scene.time.now / 200) * 0.1;

        if (stats.currentAction.toLowerCase().includes('attack')) {
            this.setScale(1.2);
            // Shake character when attacking
            this.visuals.x = (Math.random() - 0.5) * 4;
        } else {
            this.setScale(1.0);
            this.visuals.x = 0;
        }
    }
}
