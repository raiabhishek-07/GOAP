let Phaser;
if (typeof window !== 'undefined') {
    Phaser = require("phaser");
}

export class CombatSystem {
    constructor(scene) {
        this.scene = scene;
    }

    agentFire(agent, player) {
        const dist = Phaser.Math.Distance.Between(agent.x, agent.y, player.x, player.y);
        const hasLineOfSight = true; // Simplified for Training Ground Mode

        if (dist < 400 && hasLineOfSight) {
            this.shoot(agent, player);
        } else {
            agent.moveTowardPlayer(player);
        }
    }

    shoot(agent, player) {
        // Draw visual bullet tracer
        const g = this.scene.add.graphics();
        g.lineStyle(2, 0xff0000, 1);
        g.lineBetween(agent.x, agent.y, player.x, player.y);

        this.scene.tweens.add({
            targets: g,
            alpha: 0,
            duration: 150,
            onComplete: () => g.destroy()
        });

        // 50% accuracy limit (Training Mode restraint)
        if (Math.random() < 0.5) {
            player.takeDamage(10);
        }

        agent.ammo--;

        // Contextual Hint
        this.scene.hintSystem.showHint("Enemies react dynamically using GOAP planning.", agent.x, agent.y - 40);
    }
}
