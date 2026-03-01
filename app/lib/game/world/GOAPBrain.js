// ============================================================
// GOAPBrain.js — GOAP-powered AI for open world agents
// Uses the GOAP engine to plan: wander, patrol, chase, attack,
// flee, take cover, seek health
// ============================================================

import {
    AgentBelief, BeliefFactory,
    AgentAction, AgentGoal,
    GoapPlanner,
    IdleStrategy, MoveStrategy, WanderStrategy, AttackStrategy,
    Sensor, CountdownTimer,
} from '../../goap/engine';

/**
 * OpenWorldGOAPAgent — A GOAP-compatible agent wrapper.
 * Bridges between the Phaser sprite and the GOAP engine.
 */
export class OpenWorldGOAPAgent {
    constructor(sprite, scene, playerRef) {
        this.sprite = sprite;
        this.scene = scene;
        this.playerRef = playerRef;

        // GOAP-compatible interface
        this.position = { x: sprite.x, y: sprite.y };

        // State
        this.beliefs = {};
        this.actions = [];
        this.goals = [];
        this.currentPlan = null;
        this.currentAction = null;
        this.currentGoal = null;

        // Sensor for player detection
        this.sensor = new Sensor(this, sprite.aiData.detectionRange, 'player');
        this.sensor.setTarget({ position: { x: playerRef.x, y: playerRef.y } });

        // Planner
        this.planner = new GoapPlanner();

        // Planning cooldown (don't replan every frame)
        this.planCooldown = 0;
        this.planInterval = 1500; // ms

        // Combat state
        this.lastFireTime = 0;
        this.fireRate = 800 + Math.random() * 400; // ms between shots

        // Setup beliefs, actions, goals
        this._setupBeliefs();
        this._setupActions();
        this._setupGoals();

        // Status label for debugging
        this.stateLabel = '';
    }

    // ═══════════════════════════════════════════════════════
    // GOAP INTERFACE: moveTo / stopMoving (required by strategies)
    // ═══════════════════════════════════════════════════════

    moveTo(dest) {
        if (!this.sprite.active || !this.sprite.body) return;
        const speed = this.sprite.aiData.speed;
        this.scene.physics.moveTo(this.sprite, dest.x, dest.y, speed);
    }

    stopMoving() {
        if (!this.sprite.active || !this.sprite.body) return;
        this.sprite.body.setVelocity(0, 0);
    }

    // ═══════════════════════════════════════════════════════
    // BELIEFS — What the agent knows about the world
    // ═══════════════════════════════════════════════════════

    _setupBeliefs() {
        const factory = new BeliefFactory(this, this.beliefs);
        const sprite = this.sprite;
        const player = this.playerRef;

        // Sensor-based beliefs with LOS and Noise weighting
        factory.addBelief('PlayerInRange', () => {
            const dist = this._distToPlayer();
            const hasLOS = this.scene._checkLineOfSight?.(this.sprite, this.playerRef) ?? true;
            const noise = this.scene.noiseLevel || 0;
            
            // Detection logic:
            // 1. If has LOS, use base detection range
            // 2. If NO LOS, only detect if noise is high enough to 'hear' through walls
            if (hasLOS) return dist < sprite.aiData.detectionRange;
            return dist < (sprite.aiData.detectionRange * 0.4) && noise > 0.5;
        });

        // Conditional beliefs
        factory.addBelief('AgentIdle', () => {
            const vx = sprite.body?.velocity?.x || 0;
            const vy = sprite.body?.velocity?.y || 0;
            return Math.abs(vx) < 5 && Math.abs(vy) < 5;
        });

        factory.addBelief('AgentHealthy', () => sprite.aiData.health > 40);
        factory.addBelief('AgentLowHealth', () => sprite.aiData.health <= 40);
        factory.addBelief('AgentCriticalHealth', () => sprite.aiData.health <= 20);

        factory.addBelief('PlayerClose', () => {
            const hasLOS = this.scene._checkLineOfSight?.(this.sprite, this.playerRef) ?? true;
            if (!hasLOS && (this.scene.noiseLevel || 0) < 0.6) return false;
            return this._distToPlayer() < 120;
        });

        factory.addBelief('PlayerMedium', () => {
            const dist = this._distToPlayer();
            return dist >= 120 && this.beliefs['PlayerInRange'].evaluate();
        });

        factory.addBelief('PlayerFar', () => {
            return !this.beliefs['PlayerInRange'].evaluate();
        });

        factory.addBelief('AgentAtPatrolPoint', () => false); // updated by patrol action
        factory.addBelief('AgentWandered', () => false);
        factory.addBelief('AgentAttacked', () => false);
        factory.addBelief('AgentFled', () => false);
        factory.addBelief('AgentTookCover', () => false);
        factory.addBelief('AgentPatrolled', () => false);
    }

    // ═══════════════════════════════════════════════════════
    // ACTIONS — What the agent can do
    // ═══════════════════════════════════════════════════════

    _setupActions() {
        const self = this;
        const sprite = this.sprite;

        // 1. WANDER — Low-cost idle behavior
        this.actions.push(
            AgentAction.builder('Wander')
                .withCost(1)
                .withStrategy(new WanderStrategy(this, 300))
                .addEffect(this.beliefs['AgentWandered'])
                .build()
        );

        // 2. PATROL — Move to a random patrol point
        this.actions.push(
            AgentAction.builder('Patrol')
                .withCost(2)
                .withStrategy(new MoveStrategy(this, () => {
                    const rx = sprite.x + (Math.random() - 0.5) * 600;
                    const ry = sprite.y + (Math.random() - 0.5) * 600;
                    return {
                        x: Math.max(200, Math.min(15800, rx)),
                        y: Math.max(200, Math.min(15800, ry)),
                    };
                }))
                .addEffect(this.beliefs['AgentPatrolled'])
                .build()
        );

        // 3. CHASE PLAYER — Move toward the player
        this.actions.push(
            AgentAction.builder('ChasePlayer')
                .withCost(3)
                .withStrategy(new MoveStrategy(this, () => ({
                    x: self.playerRef.x,
                    y: self.playerRef.y,
                }), true)) // dynamic = chase
                .addPrecondition(this.beliefs['PlayerInRange'])
                .addEffect(this.beliefs['PlayerClose'])
                .build()
        );

        // 4. ATTACK — Stand and fight (fires bullets via callback)
        this.actions.push(
            AgentAction.builder('AttackPlayer')
                .withCost(4)
                .withStrategy({
                    get canPerform() { return true; },
                    get complete() { return !self.beliefs['PlayerClose']?.evaluate(); },
                    start: () => { self.stateLabel = 'ATTACKING'; },
                    update: (dt) => { self._tryAIFire(); },
                    stop: () => { },
                })
                .addPrecondition(this.beliefs['PlayerClose'])
                .addEffect(this.beliefs['AgentAttacked'])
                .build()
        );

        // 5. FLEE — Low health, run away
        this.actions.push(
            AgentAction.builder('Flee')
                .withCost(2)
                .withStrategy(new MoveStrategy(this, () => {
                    const dx = sprite.x - self.playerRef.x;
                    const dy = sprite.y - self.playerRef.y;
                    const dist = Math.sqrt(dx * dx + dy * dy) || 1;
                    return {
                        x: Math.max(200, Math.min(15800, sprite.x + (dx / dist) * 400)),
                        y: Math.max(200, Math.min(15800, sprite.y + (dy / dist) * 400)),
                    };
                }))
                .addPrecondition(this.beliefs['AgentLowHealth'])
                .addEffect(this.beliefs['AgentFled'])
                .build()
        );

        // 6. TAKE COVER — Duck behind nearest obstacle
        this.actions.push(
            AgentAction.builder('TakeCover')
                .withCost(3)
                .withStrategy(new MoveStrategy(this, () => {
                    const dx = sprite.x - self.playerRef.x;
                    const dy = sprite.y - self.playerRef.y;
                    const dist = Math.sqrt(dx * dx + dy * dy) || 1;
                    // Move sideways and away
                    return {
                        x: Math.max(200, Math.min(15800, sprite.x + (dy / dist) * 200)),
                        y: Math.max(200, Math.min(15800, sprite.y - (dx / dist) * 200)),
                    };
                }))
                .addPrecondition(this.beliefs['AgentLowHealth'])
                .addPrecondition(this.beliefs['PlayerInRange'])
                .addEffect(this.beliefs['AgentTookCover'])
                .build()
        );

        // 7. IDLE — Do nothing for a moment
        this.actions.push(
            AgentAction.builder('Idle')
                .withCost(1)
                .withStrategy(new IdleStrategy(2.0))
                .addEffect(this.beliefs['AgentIdle'])
                .build()
        );
    }

    // ═══════════════════════════════════════════════════════
    // GOALS — What the agent wants
    // ═══════════════════════════════════════════════════════

    _setupGoals() {
        const self = this;

        // 1. SURVIVE (highest priority when low health)
        this.goals.push(
            AgentGoal.builder('Survive')
                .withPriority(() => self.sprite.aiData.health <= 40 ? 10 : 0)
                .withDesiredEffect(this.beliefs['AgentFled'])
                .build()
        );

        // 2. ELIMINATE PLAYER (high priority when detected)
        this.goals.push(
            AgentGoal.builder('EliminatePlayer')
                .withPriority(() => {
                    if (this.scene.isInSafeZone) return 0;
                    if (!self.beliefs['PlayerInRange']?.evaluate()) return 0;
                    if (self.sprite.aiData.health <= 40) return 2; // deprioritize if low hp
                    return 8;
                })
                .withDesiredEffect(this.beliefs['AgentAttacked'])
                .build()
        );

        // 3. CHASE (medium priority when player detected at medium range)
        this.goals.push(
            AgentGoal.builder('ChasePlayer')
                .withPriority(() => {
                    if (!self.beliefs['PlayerInRange']?.evaluate()) return 0;
                    if (self.beliefs['PlayerClose']?.evaluate()) return 0; // already close, attack instead
                    return 6;
                })
                .withDesiredEffect(this.beliefs['PlayerClose'])
                .build()
        );

        // 4. PATROL (default, always active)
        this.goals.push(
            AgentGoal.builder('Patrol')
                .withPriority(3)
                .withDesiredEffect(this.beliefs['AgentPatrolled'])
                .build()
        );

        // 5. WANDER (lowest priority fallback)
        this.goals.push(
            AgentGoal.builder('Wander')
                .withPriority(1)
                .withDesiredEffect(this.beliefs['AgentWandered'])
                .build()
        );

        // 6. TAKE COVER (when damaged and player nearby)
        this.goals.push(
            AgentGoal.builder('TakeCover')
                .withPriority(() => {
                    if (self.sprite.aiData.health <= 30 && self.beliefs['PlayerInRange']?.evaluate()) return 9;
                    return 0;
                })
                .withDesiredEffect(this.beliefs['AgentTookCover'])
                .build()
        );
    }

    // ═══════════════════════════════════════════════════════
    // UPDATE — Called every frame
    // ═══════════════════════════════════════════════════════

    update(time, delta) {
        if (!this.sprite.active) return;

        // Sync position
        this.position.x = this.sprite.x;
        this.position.y = this.sprite.y;

        // Update sensor (track player position)
        this.sensor.setTarget({
            position: { x: this.playerRef.x, y: this.playerRef.y }
        });
        this.sensor.update();

        // Too far from player — freeze
        const distToPlayer = this._distToPlayer();
        if (distToPlayer > 2000) {
            this.stopMoving();
            this.stateLabel = 'DORMANT';
            return;
        }

        // Replan periodically
        this.planCooldown -= delta;
        if (this.planCooldown <= 0 || !this.currentPlan) {
            this._replan();
            this.planCooldown = this.planInterval;
        }

        // Execute current action
        if (this.currentAction) {
            const strategy = this.currentAction._strategy;
            if (strategy) {
                if (strategy.complete) {
                    // Action completed — move to next in plan
                    strategy.stop();
                    this.currentAction = this.currentPlan?.actions?.shift() || null;
                    if (this.currentAction?._strategy) {
                        this.currentAction._strategy.start();
                        this.stateLabel = this.currentAction.name.toUpperCase();
                    } else {
                        // Plan exhausted, force replan
                        this.currentPlan = null;
                    }
                } else {
                    strategy.update(delta / 1000);
                }
            }
        }
    }

    // ═══════════════════════════════════════════════════════
    // PLANNER
    // ═══════════════════════════════════════════════════════

    _replan() {
        try {
            const plan = this.planner.plan(this, this.goals, this.currentGoal);
            if (plan) {
                // Stop current action
                if (this.currentAction?._strategy) {
                    this.currentAction._strategy.stop();
                }

                this.currentPlan = plan;
                this.currentGoal = plan.agentGoal;

                // Start first action
                this.currentAction = plan.actions.shift() || null;
                if (this.currentAction?._strategy) {
                    this.currentAction._strategy.start();
                    this.stateLabel = this.currentAction.name.toUpperCase();
                }
            }
        } catch (e) {
            // Fallback to wander if planning fails
            this.stateLabel = 'WANDER';
        }
    }

    // ═══════════════════════════════════════════════════════
    // COMBAT — AI shooting
    // ═══════════════════════════════════════════════════════

    _tryAIFire() {
        const now = this.scene.time.now;
        if (now - this.lastFireTime < this.fireRate) return;

        const dist = this._distToPlayer();
        if (dist > 250) return; // Too far to shoot

        this.lastFireTime = now;

        const angle = Math.atan2(
            this.playerRef.y - this.sprite.y,
            this.playerRef.x - this.sprite.x
        );

        // Fire bullet through scene's bullet pool
        if (this.scene.bulletPool) {
            const weaponDef = {
                id: 'ai_rifle',
                damage: 8 + Math.floor(Math.random() * 5),
                fireRate: this.fireRate,
                bulletSpeed: 400,
                bulletRange: 350,
                spread: 8,
                bulletsPerShot: 1,
            };

            const spreadRad = (weaponDef.spread * (Math.random() - 0.5) * 2) * (Math.PI / 180);
            this.scene.bulletPool.fire(
                this.sprite.x, this.sprite.y,
                angle + spreadRad,
                weaponDef,
                this.sprite.aiData.id
            );
        }
    }

    // ═══════════════════════════════════════════════════════
    // HELPERS
    // ═══════════════════════════════════════════════════════

    _distToPlayer() {
        return Math.sqrt(
            (this.sprite.x - this.playerRef.x) ** 2 +
            (this.sprite.y - this.playerRef.y) ** 2
        );
    }

    destroy() {
        this.currentPlan = null;
        this.currentAction = null;
    }
}
