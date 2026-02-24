// ============================================================
// GOAP Agent — 2D version of GoapAgent.cs
// Wires beliefs, actions, goals and runs the simulation loop
// ============================================================

import {
    BeliefFactory, AgentAction, AgentGoal, GoapPlanner,
    IdleStrategy, MoveStrategy, WanderStrategy, AttackStrategy,
    Sensor, CountdownTimer
} from './engine.js';

// World location definitions (2D coordinates)
export const WORLD_LOCATIONS = {
    foodShack: { x: 130, y: 130, label: 'Food Shack', color: '#f59e0b', emoji: '🍖' },
    restArea: { x: 650, y: 130, label: 'Rest Area', color: '#8b5cf6', emoji: '🛏️' },
    doorOne: { x: 400, y: 250, label: 'Door 1', color: '#06b6d4', emoji: '🚪' },
    doorTwo: { x: 550, y: 400, label: 'Door 2', color: '#14b8a6', emoji: '🚪' },
    agentSpawn: { x: 400, y: 350, label: 'Agent Start', color: '#3b82f6' },
    playerSpawn: { x: 650, y: 450, label: 'Player Start', color: '#ef4444' },
};

export class GoapAgent {
    constructor(locationConfig = WORLD_LOCATIONS) {
        this.locations = locationConfig;
        this.position = { ...(this.locations.agentSpawn || WORLD_LOCATIONS.agentSpawn) };
        this.speed = 80; // pixels per second
        this.moveTarget = null;
        this.isMoving = false;

        // Stats
        this.health = 100;
        this.stamina = 100;

        // GOAP state
        this.beliefs = {};
        this.actions = new Set();
        this.goals = new Set();
        this.currentGoal = null;
        this.lastGoal = null;
        this.actionPlan = null;
        this.currentAction = null;
        this.planner = new GoapPlanner();

        // Sensors
        this.chaseSensor = new Sensor(this, 150, 'player');
        this.attackSensor = new Sensor(this, 40, 'player');

        // Stats timer (every 2 seconds)
        this.statsTimer = new CountdownTimer(2.0);
        this.statsTimer.onTimerStop.push(() => {
            this._updateStats();
            this.statsTimer.start();
        });
        this.statsTimer.start();

        // Log
        this.logs = [];
        this.maxLogs = 12;

        // Setup
        this._setupBeliefs();
        this._setupActions();
        this._setupGoals();

        // Sensor event: when target changes, invalidate plan
        this.chaseSensor.onTargetChanged.push(() => {
            this._log('⚡ Sensor triggered! Replanning...');
            this.currentAction = null;
            this.currentGoal = null;
        });
    }

    _log(message) {
        this.logs.unshift({ time: Date.now(), message });
        if (this.logs.length > this.maxLogs) this.logs.pop();
    }

    setPlayerTarget(playerEntity) {
        this.chaseSensor.setTarget(playerEntity);
        this.attackSensor.setTarget(playerEntity);
    }

    moveTo(target) {
        this.moveTarget = { ...target };
        this.isMoving = true;
    }

    stopMoving() {
        this.moveTarget = null;
        this.isMoving = false;
    }

    _setupBeliefs() {
        const factory = new BeliefFactory(this, this.beliefs);

        factory.addBelief('Nothing', () => false);
        factory.addBelief('AgentIdle', () => !this.isMoving);
        factory.addBelief('AgentMoving', () => this.isMoving);
        factory.addBelief('AgentHealthLow', () => this.health < 30);
        factory.addBelief('AgentIsHealthy', () => this.health >= 50);
        factory.addBelief('AgentStaminaLow', () => this.stamina < 10);
        factory.addBelief('AgentIsRested', () => this.stamina >= 50);

        factory.addLocationBelief('AgentAtDoorOne', 30, this.locations.doorOne || WORLD_LOCATIONS.doorOne);
        factory.addLocationBelief('AgentAtDoorTwo', 30, this.locations.doorTwo || WORLD_LOCATIONS.doorTwo);
        factory.addLocationBelief('AgentAtRestingPosition', 30, this.locations.restArea || WORLD_LOCATIONS.restArea);
        factory.addLocationBelief('AgentAtFoodShack', 30, this.locations.foodShack || WORLD_LOCATIONS.foodShack);

        factory.addSensorBelief('PlayerInChaseRange', this.chaseSensor);
        factory.addSensorBelief('PlayerInAttackRange', this.attackSensor);
        factory.addBelief('AttackingPlayer', () => false);
    }

    _setupActions() {
        this.actions.add(
            AgentAction.builder('Relax')
                .withStrategy(new IdleStrategy(3))
                .addEffect(this.beliefs.Nothing)
                .build()
        );

        this.actions.add(
            AgentAction.builder('Wander Around')
                .withStrategy(new WanderStrategy(this, 120))
                .addEffect(this.beliefs.AgentMoving)
                .build()
        );

        this.actions.add(
            AgentAction.builder('Move to Food Shack')
                .withStrategy(new MoveStrategy(this, () => this.locations.foodShack))
                .addEffect(this.beliefs.AgentAtFoodShack)
                .build()
        );

        this.actions.add(
            AgentAction.builder('Eat')
                .withStrategy(new IdleStrategy(3))
                .addPrecondition(this.beliefs.AgentAtFoodShack)
                .addEffect(this.beliefs.AgentIsHealthy)
                .build()
        );

        this.actions.add(
            AgentAction.builder('Move to Door 1')
                .withStrategy(new MoveStrategy(this, () => this.locations.doorOne))
                .addEffect(this.beliefs.AgentAtDoorOne)
                .build()
        );

        this.actions.add(
            AgentAction.builder('Move to Door 2')
                .withStrategy(new MoveStrategy(this, () => this.locations.doorTwo))
                .addEffect(this.beliefs.AgentAtDoorTwo)
                .build()
        );

        this.actions.add(
            AgentAction.builder('Door 1 → Rest Area')
                .withCost(2)
                .withStrategy(new MoveStrategy(this, () => this.locations.restArea))
                .addPrecondition(this.beliefs.AgentAtDoorOne)
                .addEffect(this.beliefs.AgentAtRestingPosition)
                .build()
        );

        this.actions.add(
            AgentAction.builder('Door 2 → Rest Area')
                .withStrategy(new MoveStrategy(this, () => this.locations.restArea))
                .addPrecondition(this.beliefs.AgentAtDoorTwo)
                .addEffect(this.beliefs.AgentAtRestingPosition)
                .build()
        );

        this.actions.add(
            AgentAction.builder('Rest')
                .withStrategy(new IdleStrategy(3))
                .addPrecondition(this.beliefs.AgentAtRestingPosition)
                .addEffect(this.beliefs.AgentIsRested)
                .build()
        );

        this.actions.add(
            AgentAction.builder('Chase Player')
                .withStrategy(new MoveStrategy(this, () => this.beliefs.PlayerInChaseRange.location, true))
                .addPrecondition(this.beliefs.PlayerInChaseRange)
                .addEffect(this.beliefs.PlayerInAttackRange)
                .build()
        );

        this.actions.add(
            AgentAction.builder('Attack Player')
                .withStrategy(new AttackStrategy(1.0))
                .addPrecondition(this.beliefs.PlayerInAttackRange)
                .addEffect(this.beliefs.AttackingPlayer)
                .build()
        );
    }

    _setupGoals() {
        this.goals.add(
            AgentGoal.builder('Chill Out').withPriority(1).withDesiredEffect(this.beliefs.Nothing).build()
        );
        this.goals.add(
            AgentGoal.builder('Wander').withPriority(1).withDesiredEffect(this.beliefs.AgentMoving).build()
        );

        // Dynamic priority: normally 2, but jumps to 4 (overriding combat) when critically low
        // This creates "fight → retreat → heal → fight" behavior
        this.goals.add(
            AgentGoal.builder('Keep Health Up')
                .withPriority(() => this.health < 20 ? 4 : 2)
                .withDesiredEffect(this.beliefs.AgentIsHealthy)
                .build()
        );
        this.goals.add(
            AgentGoal.builder('Keep Stamina Up')
                .withPriority(() => this.stamina < 15 ? 4 : 2)
                .withDesiredEffect(this.beliefs.AgentIsRested)
                .build()
        );

        this.goals.add(
            AgentGoal.builder('Seek & Destroy').withPriority(3).withDesiredEffect(this.beliefs.AttackingPlayer).build()
        );
    }

    _updateStats() {
        const nearRest = this._distTo(this.locations.restArea) < 30;
        const nearFood = this._distTo(this.locations.foodShack) < 30;

        this.stamina += nearRest ? 20 : -10;
        this.health += nearFood ? 20 : -5;
        this.stamina = Math.max(0, Math.min(100, this.stamina));
        this.health = Math.max(0, Math.min(100, this.health));
    }

    _distTo(pos) {
        const dx = this.position.x - pos.x;
        const dy = this.position.y - pos.y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    update(deltaTime) {
        try {
            // Tick timers
            this.statsTimer.tick(deltaTime);

            // Update sensors
            this.chaseSensor.update();
            this.attackSensor.update();

            // Handle movement
            if (this.isMoving && this.moveTarget) {
                const dx = this.moveTarget.x - this.position.x;
                const dy = this.moveTarget.y - this.position.y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < 5) {
                    this.isMoving = false;
                    this.moveTarget = null;
                } else {
                    const step = this.speed * deltaTime;
                    this.position.x += (dx / dist) * Math.min(step, dist);
                    this.position.y += (dy / dist) * Math.min(step, dist);
                }
            }

            // GOAP planning loop
            if (this.currentAction === null) {
                this._calculatePlan();

                if (this.actionPlan && this.actionPlan.actions.length > 0) {
                    this.stopMoving();
                    this.currentGoal = this.actionPlan.agentGoal;
                    // FIX: Use .pop() to match Unity's Stack.Pop() (LIFO)
                    // The planner builds actions goal→leaf, so the LAST item
                    // in the array is the first action to execute.
                    this.currentAction = this.actionPlan.actions.pop();
                    this._log(`📋 Goal: ${this.currentGoal.name}`);
                    this._log(`▶ Action: ${this.currentAction.name}`);

                    const allPreconditionsMet = [...this.currentAction.preconditions].every(b => b.evaluate());
                    if (allPreconditionsMet) {
                        this.currentAction.start();
                    } else {
                        this._log(`❌ Preconditions not met for: ${this.currentAction.name}`);
                        this.currentAction = null;
                        this.currentGoal = null;
                        // Clear the failed plan so we replan fully next frame
                        this.actionPlan = null;
                    }
                } else {
                    // No plan found — fallback to wandering so agent never freezes
                    this._fallbackBehavior(deltaTime);
                }
            }

            // Execute current action
            if (this.actionPlan && this.currentAction) {
                this.currentAction.update(deltaTime);

                if (this.currentAction.complete) {
                    this._log(`✅ ${this.currentAction.name} complete`);
                    this.currentAction.stop();
                    this.currentAction = null;

                    if (this.actionPlan.actions.length === 0) {
                        this._log(`🎯 Plan complete: ${this.currentGoal?.name}`);
                        this.lastGoal = this.currentGoal;
                        this.currentGoal = null;
                    }
                }
            }
        } catch (err) {
            // Never let an error kill the simulation loop
            console.error('GOAP Agent update error:', err);
            // Reset to safe state
            this.currentAction = null;
            this.currentGoal = null;
            this.actionPlan = null;
        }
    }

    _calculatePlan() {
        try {
            const priorityLevel = this.currentGoal?.priority ?? 0;
            let goalsToCheck = this.goals;

            if (this.currentGoal) {
                goalsToCheck = new Set([...this.goals].filter(g => g.priority > priorityLevel));
            }

            const potentialPlan = this.planner.plan(this, goalsToCheck, this.lastGoal);
            if (potentialPlan) {
                this.actionPlan = potentialPlan;
            }
        } catch (err) {
            console.error('GOAP planning error:', err);
        }
    }

    // Fallback: if no plan found, wander a bit so the agent doesn't freeze
    _fallbackBehavior(deltaTime) {
        if (!this._fallbackTimer) {
            this._fallbackTimer = new CountdownTimer(2.0);
            this._fallbackTimer.onTimerStop.push(() => {
                // Pick a random point to wander to
                const angle = Math.random() * Math.PI * 2;
                const dist = 50 + Math.random() * 80;
                const tx = Math.max(40, Math.min(760, this.position.x + Math.cos(angle) * dist));
                const ty = Math.max(40, Math.min(560, this.position.y + Math.sin(angle) * dist));
                this.moveTo({ x: tx, y: ty });
                this._fallbackTimer.start();
            });
            this._fallbackTimer.start();
        }
        this._fallbackTimer.tick(deltaTime);
    }

    // Get debug state for the panel
    getDebugState() {
        const beliefStates = {};
        for (const [key, belief] of Object.entries(this.beliefs)) {
            if (key === 'Nothing') continue;
            beliefStates[key] = belief.evaluate();
        }

        // Show plan actions in execution order (reversed, since we .pop() from end)
        const remainingActions = this.actionPlan?.actions
            ? [...this.actionPlan.actions].reverse().map(a => a.name)
            : [];

        return {
            health: this.health,
            stamina: this.stamina,
            position: { ...this.position },
            isMoving: this.isMoving,
            currentGoal: this.currentGoal?.name || 'None',
            currentAction: this.currentAction?.name || 'None',
            planActions: remainingActions,
            beliefs: beliefStates,
            logs: this.logs,
            chaseRange: this.chaseSensor.detectionRadius,
            attackRange: this.attackSensor.detectionRadius,
            playerInChaseRange: this.chaseSensor.isTargetInRange,
            playerInAttackRange: this.attackSensor.isTargetInRange,
        };
    }
}

// ---- Player Entity (the "enemy" the agent chases) ----
export class PlayerEntity {
    constructor() {
        this.position = { ...WORLD_LOCATIONS.playerSpawn };
        this.speed = 100;
        this.moveTarget = null;
        this.isMoving = false;
    }

    moveTo(target) {
        this.moveTarget = { ...target };
        this.isMoving = true;
    }

    update(deltaTime) {
        if (this.isMoving && this.moveTarget) {
            const dx = this.moveTarget.x - this.position.x;
            const dy = this.moveTarget.y - this.position.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < 3) {
                this.isMoving = false;
                this.moveTarget = null;
            } else {
                const step = this.speed * deltaTime;
                this.position.x += (dx / dist) * Math.min(step, dist);
                this.position.y += (dy / dist) * Math.min(step, dist);
            }
        }
    }
}
