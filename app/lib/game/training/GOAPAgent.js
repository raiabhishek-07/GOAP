import { GETSDecisionEngine } from './GETSDecisionEngine';
import { GOAPPlanner } from './GOAPPlanner';

let Phaser;
if (typeof window !== 'undefined') {
    Phaser = require("phaser");
}

export class GOAPAgent {
    constructor(scene, x, y, blackboard, combatSystem) {
        this.scene = scene;
        this.sprite = scene.add.rectangle(x, y, 24, 24, 0xef4444).setDepth(40);
        scene.physics.add.existing(this.sprite);
        this.sprite.body.setCollideWorldBounds(true);

        this.health = 100;
        this.ammo = 10;

        this.blackboard = blackboard;
        this.combatSystem = combatSystem;
        this.gets = new GETSDecisionEngine();
        this.planner = new GOAPPlanner();

        this.lastThinkTime = 0;
        this.worldState = {
            playerVisible: false,
            hasAmmo: true,
            lowHealth: false,
            nearCover: false,
            teammateNearby: false,
            playerLowHealth: false,
            nearPlayer: false
        };
    }

    get x() { return this.sprite.x; }
    get y() { return this.sprite.y; }

    // Step 1: Sense environment
    sense(player) {
        const dist = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y);
        this.worldState.playerVisible = dist < 500;
        this.worldState.nearPlayer = dist < 200;
        this.worldState.lowHealth = this.health < 30;
        this.worldState.hasAmmo = this.ammo > 0;

        if (this.worldState.playerVisible) {
            this.blackboard.broadcast('PlayerSpotted', { position: { x: player.x, y: player.y } });
        }
    }

    // Step 3 & 4: Score goals and select highest
    evaluateGoals_GETS() {
        this.currentGoal = this.gets.evaluateGoals(this.worldState);
    }

    // Step 5: Run GOAP planner
    plan_GOAP() {
        this.currentAction = this.planner.plan(this.currentGoal, this.worldState);
    }

    // Step 6: Execute action plan
    executePlan(player) {
        if (this.currentAction === 'ReloadWeapon') {
            this.ammo = 10;
            this.scene.hintSystem.showHint("Enemy is reloading (Ammo was empty).", this.x, this.y - 40);
        } else if (this.currentAction === 'MoveToCover') {
            this.moveTowardCover();
            this.scene.hintSystem.showHint("Enemy is taking cover because its health is low.", this.x, this.y - 40);
        } else if (this.currentAction === 'ShootPlayer') {
            this.combatSystem.agentFire(this, player);
        } else if (this.currentAction === 'MoveToPlayer') {
            this.moveTowardPlayer(player);
        } else {
            this.sprite.body.setVelocity(0, 0);
        }
    }

    moveTowardPlayer(player) {
        this.scene.physics.moveToObject(this.sprite, player.sprite, 80);
    }

    moveTowardCover() {
        // Simplified fallback movement
        this.sprite.body.setVelocity(-50, -50);
    }

    update(time, player) {
        // GETS decision loop every 500ms
        if (time > this.lastThinkTime + 500) {
            this.lastThinkTime = time;
            this.sense(player);
            this.evaluateGoals_GETS();
            this.plan_GOAP();
            this.executePlan(player);
        }
    }
}
