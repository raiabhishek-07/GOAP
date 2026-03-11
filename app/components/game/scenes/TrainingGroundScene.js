import { PlayerController } from "../../../lib/game/training/PlayerController";
import { TreasureSystem } from "../../../lib/game/training/TreasureSystem";
import { GOAPAgent } from "../../../lib/game/training/GOAPAgent";
import { Blackboard } from "../../../lib/game/training/Blackboard";
import { TrainingHintSystem } from "../../../lib/game/training/TrainingHintSystem";
import { CombatSystem } from "../../../lib/game/training/CombatSystem";
import { WorldGenerator } from "../../../lib/game/WorldGenerator";
import { MIND_ARENA_LEVELS, WORLD_W, WORLD_H } from "../../../lib/game/LevelConfig";

let Phaser;
if (typeof window !== 'undefined') {
    Phaser = require("phaser");
}

/**
 * TrainingGroundScene — Dedicated Game Mode Manager for Training
 */
export class TrainingGroundScene extends (Phaser ? Phaser.Scene : Object) {
    constructor() {
        super({ key: 'TrainingGroundScene' });
    }

    create() {
        // Core World
        this.physics.world.setBounds(0, 0, WORLD_W, WORLD_H);
        this.cameras.main.setBounds(0, 0, WORLD_W, WORLD_H);

        // Map reuse logic
        const levelConfig = MIND_ARENA_LEVELS[1].stages[1]; // Use existing blueprint level
        WorldGenerator.generate(this, WORLD_W, WORLD_H, levelConfig);

        // Initialize Training Architectural Systems
        this.hintSystem = new TrainingHintSystem(this);
        this.combatSystem = new CombatSystem(this);
        this.blackboard = new Blackboard();

        // Spawn Player
        this.player = new PlayerController(this, 300, 300);

        // Spawn Objectives
        this.treasureSystem = new TreasureSystem(this, this.player);
        this.treasureSystem.spawn(1200, 800);
        this.treasureSystem.spawn(800, 600);
        this.treasureSystem.spawn(1800, 400);

        // Spawn GOAP Agents (Max 2 for guided mode)
        this.agents = [
            new GOAPAgent(this, 1000, 500, this.blackboard, this.combatSystem),
            new GOAPAgent(this, 1200, 600, this.blackboard, this.combatSystem)
        ];

        // Camera Tracking
        this.cameras.main.startFollow(this.player.sprite);

        // Basic HUD Overlay
        this.scoreText = this.add.text(20, 20, 'Treasures: 0/3\nHealth: 100', {
            fontSize: '18px',
            fontFamily: 'monospace',
            color: '#fff',
            backgroundColor: '#000',
            padding: { x: 10, y: 10 }
        }).setScrollFactor(0).setDepth(200);

        // Initial Guide
        this.time.delayedCall(1000, () => {
            this.hintSystem.showHint("INITIATION PROTOCOL: Find 3 Treasure Boxes using WASD. Press E to collect.", 640, 200);
        });
    }

    update(time, delta) {
        // MAIN UPDATE LOOP
        this.player.update();
        this.treasureSystem.update();

        // Agent Update Loop
        this.agents.forEach(agent => agent.update(time, this.player));

        this.scoreText.setText(`Treasures: ${this.player.treasuresCollected}/3\nHealth: ${this.player.health}`);

        // WIN / LOSE CONDITIONS
        if (this.player.treasuresCollected >= 3) {
            this.hintSystem.showHint("VICTORY! ALL TREASURES COLLECTED!", 640, 360);
            this.scene.pause();
        } else if (this.player.health <= 0) {
            this.hintSystem.showHint("DEFEAT. YOU WERE ELIMINATED.", 640, 360);
            this.scene.pause();
        }
    }
}
