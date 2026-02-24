// ============================================================
// AgentFactory.js — Creates the 7 agent types with unique GOAP behaviors
// Each type has distinct goals, actions, and combat style
// ============================================================

import * as Phaser from 'phaser';
import { BaseSurvivor } from '../../components/game/entities/BaseSurvivor.js';
import { AGENT_TYPE, AGENT_META } from './LevelConfig.js';
import {
    AgentBelief, AgentAction, AgentGoal,
    CountdownTimer, IdleStrategy, MoveStrategy,
    WanderStrategy, AttackStrategy, GoapPlanner,
} from '../goap/engine.js';

// ─── TACTICAL AGENT (base for all 7 types) ──────────────────

/**
 * TacticalAgent — extends BaseSurvivor with type-specific GOAP logic.
 * Unlike the old GameAgent which had hardcoded Eat/Rest/Chase,
 * each type dynamically adds only the behaviors it needs.
 */
export class TacticalAgent extends BaseSurvivor {
    constructor(scene, x, y, config) {
        const meta = AGENT_META[config.type] || AGENT_META.patrol;
        super(scene, x, y, meta.label, true, {
            skin: _skinFromType(config.type),
            hair: 0x1e293b,
            body: _bodyFromType(config.type),
        });

        this.agentType = config.type;
        this.meta = meta;
        this.config = config;

        // Core stats
        this.health = 100;
        this.maxHealth = 100;
        this.speed = meta.speed;
        this.chaseRange = meta.chaseRange;
        this.attackRange = meta.attackRange;
        this.canDoTasks = meta.canDoTasks;

        // GOAP systems
        this.beliefs = {};
        this.actions = new Set();
        this.goals = new Set();
        this.planner = new GoapPlanner();
        this.currentPlan = [];
        this.currentAction = null;
        this.currentGoal = null;

        // AI state
        this.position = { x, y };
        this.moveTarget = null;
        this.isMoving = false;
        this.playerTarget = null;
        this.currentTaskTarget = null;
        this.patrolPath = config.patrolPath || [];
        this.patrolIndex = 0;
        this.ambushPoints = config.ambushPoints || [];
        this.ambushIndex = 0;
        this.guardTarget = config.guardTarget || null;
        this.planTimer = new CountdownTimer(0.8);
        this.planTimer.start();
        this.actionLog = [];

        // Visual theming
        this._applyTheme();
    }

    /**
     * Set player target for chase/attack
     */
    setPlayerTarget(playerEntity) {
        this.playerTarget = playerEntity;
    }

    /**
     * Set the match manager reference for task interaction
     */
    setMatchManager(matchManager) {
        this.matchManager = matchManager;
    }

    /**
     * Standard movement command for GOAP strategies
     */
    moveTo(target) {
        this.moveTarget = target;
        this.isMoving = true;
    }

    /**
     * Standard stop command for GOAP strategies
     */
    stopMoving() {
        this.moveTarget = null;
        this.isMoving = false;
    }

    /**
     * Initialize GOAP beliefs, actions, and goals per agent type
     */
    initGOAP(locations) {
        this.locations = locations;
        this._setupBeliefs();
        this._setupActions();
        this._setupGoals();
    }

    // ─── BELIEFS ──────────────────────────────────────

    _setupBeliefs() {
        const b = (name, cond) => {
            const belief = new AgentBelief(name);
            belief._condition = cond;
            this.beliefs[name] = belief;
            return belief;
        };

        // Universal beliefs
        b('Nothing', () => false);
        b('AgentMoving', () => this.isMoving);
        b('PlayerInChaseRange', () => {
            if (!this.playerTarget) return false;
            return this._distTo(this.playerTarget.position) < this.chaseRange;
        });
        b('PlayerInAttackRange', () => {
            if (!this.playerTarget) return false;
            return this._distTo(this.playerTarget.position) < this.attackRange;
        });
        b('AttackingPlayer', () => false);
        b('HealthLow', () => this.health < 30);

        // Location beliefs
        if (this.locations.foodShack) {
            b('AtFood', () => this._distTo(this.locations.foodShack) < 30);
            b('IsHealthy', () => this.health > 60);
        }

        // Patrol beliefs
        if (this.patrolPath.length > 0) {
            b('AtPatrolPoint', () => {
                const target = this.patrolPath[this.patrolIndex];
                return target && this._distTo(target) < 20;
            });
            b('PatrolComplete', () => false);
        }

        // Task beliefs (for task-capable agents)
        if (this.canDoTasks) {
            b('NearTask', () => this.currentTaskTarget !== null);
            b('TaskComplete', () => false);
        }

        // Guard beliefs
        if (this.guardTarget) {
            b('AtGuardPost', () => {
                if (!this.guardPosition) return false;
                return this._distTo(this.guardPosition) < 40;
            });
            b('Guarding', () => false);
        }

        // Ambush beliefs
        if (this.ambushPoints.length > 0) {
            b('AtAmbushPoint', () => {
                const pt = this.ambushPoints[this.ambushIndex];
                return pt && this._distTo(pt) < 25;
            });
            b('Ambushing', () => false);
        }
    }

    // ─── ACTIONS ──────────────────────────────────────

    _setupActions() {
        const type = this.agentType;

        // ── UNIVERSAL: Relax ──
        this.actions.add(
            AgentAction.builder('Relax')
                .withStrategy(new IdleStrategy(2))
                .addEffect(this.beliefs.Nothing)
                .build()
        );

        // ── TYPE-SPECIFIC ACTIONS ──

        if (type === AGENT_TYPE.PATROL) {
            this._addPatrolActions();
        }

        if (type === AGENT_TYPE.STALKER) {
            this._addChaseActions();
        }

        if (type === AGENT_TYPE.RACER) {
            this._addTaskRacingActions();
        }

        if (type === AGENT_TYPE.DEFENDER) {
            this._addGuardActions();
            this._addChaseActions(); // Chase if player gets close
        }

        if (type === AGENT_TYPE.AMBUSHER) {
            this._addAmbushActions();
            this._addChaseActions();
        }

        if (type === AGENT_TYPE.STRATEGIST) {
            this._addTaskRacingActions();
            this._addChaseActions();
        }

        if (type === AGENT_TYPE.MASTERMIND) {
            this._addPatrolActions();
            this._addChaseActions();
            this._addTaskRacingActions();
            this._addGuardActions();
        }
    }

    _addPatrolActions() {
        if (this.patrolPath.length === 0) {
            // No path — wander instead
            this.actions.add(
                AgentAction.builder('Patrol Wander')
                    .withStrategy(new WanderStrategy(this, 200))
                    .addEffect(this.beliefs.AgentMoving)
                    .build()
            );
            return;
        }

        this.actions.add(
            AgentAction.builder('Move to Patrol Point')
                .withStrategy(new MoveStrategy(this, () => this.patrolPath[this.patrolIndex]))
                .addEffect(this.beliefs.AtPatrolPoint)
                .build()
        );

        this.actions.add(
            AgentAction.builder('Patrol Wait')
                .withStrategy({
                    canPerform: () => true,
                    start: () => { },
                    update: (dt) => {
                        // Wait at patrol point, then advance
                        this._patrolWaitTime = (this._patrolWaitTime || 0) + dt;
                        if (this._patrolWaitTime >= 2.0) {
                            this._patrolWaitTime = 0;
                            this.patrolIndex = (this.patrolIndex + 1) % this.patrolPath.length;
                            return true; // Complete
                        }
                        return false;
                    },
                    stop: () => { },
                    complete: () => this._patrolWaitTime >= 2.0,
                })
                .addPrecondition(this.beliefs.AtPatrolPoint)
                .addEffect(this.beliefs.PatrolComplete)
                .build()
        );
    }

    _addChaseActions() {
        this.actions.add(
            AgentAction.builder('Chase Player')
                .withCost(1)
                .withStrategy(new MoveStrategy(this, () => this.playerTarget?.position, true))
                .addPrecondition(this.beliefs.PlayerInChaseRange)
                .addEffect(this.beliefs.PlayerInAttackRange)
                .build()
        );

        this.actions.add(
            AgentAction.builder('Attack Player')
                .withStrategy(new AttackStrategy(0.8))
                .addPrecondition(this.beliefs.PlayerInAttackRange)
                .addEffect(this.beliefs.AttackingPlayer)
                .build()
        );
    }

    _addTaskRacingActions() {
        if (!this.canDoTasks) return;

        this.actions.add(
            AgentAction.builder('Race to Task')
                .withCost(1)
                .withStrategy({
                    canPerform: () => true,
                    start: () => {
                        this._findBestTask();
                    },
                    update: (dt) => {
                        if (!this.currentTaskTarget) {
                            this._findBestTask();
                            if (!this.currentTaskTarget) return true; // No tasks
                        }

                        // Move toward task
                        const task = this.currentTaskTarget;
                        const dx = task.position.x - this.position.x;
                        const dy = task.position.y - this.position.y;
                        const dist = Math.sqrt(dx * dx + dy * dy);

                        if (dist < 30) {
                            // At the task — interact
                            if (this.matchManager) {
                                const result = this.matchManager.agentInteract(
                                    task.id, this.agentType, dt
                                );
                                if (result?.reward > 0) {
                                    this.currentTaskTarget = null;
                                    return true; // Task done
                                }
                            }
                            return false;
                        }

                        // Move toward
                        this.moveTo(task.position);
                        return false;
                    },
                    stop: () => { this.stopMoving(); },
                    complete: () => false,
                })
                .addEffect(this.beliefs.TaskComplete)
                .build()
        );
    }

    _addGuardActions() {
        this.actions.add(
            AgentAction.builder('Move to Guard Post')
                .withStrategy({
                    canPerform: () => true,
                    start: () => {
                        // Find the position of the guarded task
                        if (this.matchManager?.taskSystem) {
                            const task = this.matchManager.taskSystem.getTask(this.guardTarget);
                            if (task) {
                                this.guardPosition = { ...task.position };
                            }
                        }
                        if (!this.guardPosition && this.locations) {
                            this.guardPosition = this.locations.agentSpawn || this.position;
                        }
                    },
                    update: (dt) => {
                        if (!this.guardPosition) return true;
                        this.moveTo(this.guardPosition);
                        return false;
                    },
                    stop: () => { this.stopMoving(); },
                    complete: () => {
                        if (!this.guardPosition) return true;
                        return this._distTo(this.guardPosition) < 30;
                    },
                })
                .addEffect(this.beliefs.AtGuardPost)
                .build()
        );

        this.actions.add(
            AgentAction.builder('Guard Position')
                .withStrategy(new IdleStrategy(3))
                .addPrecondition(this.beliefs.AtGuardPost)
                .addEffect(this.beliefs.Guarding)
                .build()
        );
    }

    _addAmbushActions() {
        if (this.ambushPoints.length === 0) return;

        this.actions.add(
            AgentAction.builder('Move to Ambush')
                .withStrategy(new MoveStrategy(this, () => this.ambushPoints[this.ambushIndex]))
                .addEffect(this.beliefs.AtAmbushPoint)
                .build()
        );

        this.actions.add(
            AgentAction.builder('Wait in Ambush')
                .withStrategy({
                    canPerform: () => true,
                    start: () => { this._ambushWait = 0; },
                    update: (dt) => {
                        this._ambushWait += dt;
                        // Check if player is nearby while ambushing
                        if (this.playerTarget) {
                            const dist = this._distTo(this.playerTarget.position);
                            if (dist < 150) {
                                return true; // Break ambush, switch to chase
                            }
                        }
                        // After 8 seconds, move to next ambush point
                        if (this._ambushWait >= 8) {
                            this.ambushIndex = (this.ambushIndex + 1) % this.ambushPoints.length;
                            return true;
                        }
                        return false;
                    },
                    stop: () => { },
                    complete: () => this._ambushWait >= 8,
                })
                .addPrecondition(this.beliefs.AtAmbushPoint)
                .addEffect(this.beliefs.Ambushing)
                .build()
        );
    }

    // ─── GOALS ────────────────────────────────────────

    _setupGoals() {
        const type = this.agentType;

        // Universal fallback
        this.goals.add(
            AgentGoal.builder('Idle').withPriority(1).withDesiredEffect(this.beliefs.Nothing).build()
        );

        switch (type) {
            case AGENT_TYPE.PATROL:
                this.goals.add(
                    AgentGoal.builder('Patrol').withPriority(2)
                        .withDesiredEffect(this.beliefs.PatrolComplete || this.beliefs.AgentMoving).build()
                );
                break;

            case AGENT_TYPE.STALKER:
                this.goals.add(
                    AgentGoal.builder('Hunt Player').withPriority(3)
                        .withDesiredEffect(this.beliefs.AttackingPlayer).build()
                );
                break;

            case AGENT_TYPE.RACER:
                if (this.beliefs.TaskComplete) {
                    this.goals.add(
                        AgentGoal.builder('Complete Tasks').withPriority(4)
                            .withDesiredEffect(this.beliefs.TaskComplete).build()
                    );
                }
                break;

            case AGENT_TYPE.DEFENDER:
                this.goals.add(
                    AgentGoal.builder('Guard Target').withPriority(3)
                        .withDesiredEffect(this.beliefs.Guarding || this.beliefs.Nothing).build()
                );
                this.goals.add(
                    AgentGoal.builder('Defend').withPriority(() => {
                        if (!this.playerTarget) return 1;
                        return this._distTo(this.playerTarget.position) < 120 ? 4 : 2;
                    }).withDesiredEffect(this.beliefs.AttackingPlayer).build()
                );
                break;

            case AGENT_TYPE.AMBUSHER:
                this.goals.add(
                    AgentGoal.builder('Set Ambush').withPriority(2)
                        .withDesiredEffect(this.beliefs.Ambushing || this.beliefs.Nothing).build()
                );
                this.goals.add(
                    AgentGoal.builder('Ambush Attack').withPriority(() => {
                        if (!this.playerTarget) return 1;
                        return this._distTo(this.playerTarget.position) < 120 ? 5 : 1;
                    }).withDesiredEffect(this.beliefs.AttackingPlayer).build()
                );
                break;

            case AGENT_TYPE.STRATEGIST:
                if (this.beliefs.TaskComplete) {
                    this.goals.add(
                        AgentGoal.builder('Strategic Tasks').withPriority(3)
                            .withDesiredEffect(this.beliefs.TaskComplete).build()
                    );
                }
                this.goals.add(
                    AgentGoal.builder('Engage Player').withPriority(2)
                        .withDesiredEffect(this.beliefs.AttackingPlayer).build()
                );
                break;

            case AGENT_TYPE.MASTERMIND:
                if (this.beliefs.TaskComplete) {
                    this.goals.add(
                        AgentGoal.builder('Dominate Tasks').withPriority(4)
                            .withDesiredEffect(this.beliefs.TaskComplete).build()
                    );
                }
                this.goals.add(
                    AgentGoal.builder('Destroy Player').withPriority(3)
                        .withDesiredEffect(this.beliefs.AttackingPlayer).build()
                );
                break;
        }
    }

    // ─── TASK FINDING ─────────────────────────────────

    _findBestTask() {
        if (!this.matchManager?.taskSystem) {
            this.currentTaskTarget = null;
            return;
        }

        const nearest = this.matchManager.taskSystem.findNearestTask(
            this.position,
            (task) => task.type !== 'extraction'
        );

        this.currentTaskTarget = nearest;
    }

    // ─── UPDATE LOOP ──────────────────────────────────

    update(dt) {
        // Update plan timer
        this.planTimer.tick(dt);
        if (this.planTimer.isFinished) {
            this._calculatePlan();
            this.planTimer.reset(1.0 + Math.random() * 0.5);
            this.planTimer.start();
        }

        // Handle pathfinding/movement toward moveTarget
        if (this.isMoving && this.moveTarget) {
            const dx = this.moveTarget.x - this.position.x;
            const dy = this.moveTarget.y - this.position.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist > 5) {
                const speed = this.speed * dt;
                this.position.x += (dx / dist) * speed;
                this.position.y += (dy / dist) * speed;
            } else {
                this.isMoving = false;
            }
        }

        // Execute current action
        if (this.currentAction) {
            const result = this.currentAction.update(dt);
            if (this.currentAction.complete) {
                this.currentAction.stop();
                this.currentPlan.shift();
                this.currentAction = this.currentPlan[0] || null;
                if (this.currentAction) {
                    this.currentAction.start();
                }
            }
        } else if (this.currentPlan.length > 0) {
            this.currentAction = this.currentPlan[0];
            this.currentAction.start();
        } else {
            this._fallbackBehavior(dt);
        }

        // Sync visual position
        this.x = this.position.x;
        this.y = this.position.y;
        this.updateStats(this.health);

        // Visual feedback for attacking
        const isAttacking = this.currentAction?.name?.toLowerCase().includes('attack');
        if (isAttacking) {
            this.setScale(1.1 + Math.sin(this.scene.time.now / 50) * 0.05);
        } else {
            this.setScale(1);
        }
    }

    _calculatePlan() {
        // The GoapPlanner.plan method handles sorting goals by priority internally.
        // It returns an ActionPlan object containing { agentGoal, actions, totalCost }.
        const planResult = this.planner.plan(this, this.goals, this.currentGoal);

        if (planResult && planResult.actions.length > 0) {
            // If the goal changed or current plan is different, switch
            if (this.currentGoal !== planResult.agentGoal || planResult.actions[0] !== this.currentAction) {
                if (this.currentAction) {
                    this.currentAction.stop();
                }
                this.currentPlan = planResult.actions;
                this.currentAction = this.currentPlan[0];
                this.currentAction.start();
                this.currentGoal = planResult.agentGoal;
            }
        }
    }

    _fallbackBehavior(dt) {
        // Wander randomly
        if (!this._wanderTarget || this._distTo(this._wanderTarget) < 20) {
            this._wanderTarget = {
                x: this.position.x + (Math.random() - 0.5) * 200,
                y: this.position.y + (Math.random() - 0.5) * 200,
            };
        }

        this.moveTo(this._wanderTarget);
    }

    _distTo(pos) {
        if (!pos) return Infinity;
        const dx = pos.x - this.position.x;
        const dy = pos.y - this.position.y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    /**
     * Take damage
     */
    takeDamage(amount) {
        this.health = Math.max(0, this.health - amount);
    }

    /**
     * Get debug state
     */
    getDebugState() {
        return {
            type: this.agentType,
            label: this.meta.label,
            health: this.health,
            currentAction: this.currentAction?.name || 'Idle',
            currentGoal: this.currentGoal?.name || 'None',
            position: { ...this.position },
            isMoving: this.isMoving,
            taskTarget: this.currentTaskTarget?.name || null,
        };
    }

    // ─── VISUAL THEME ─────────────────────────────────

    _applyTheme() {
        const type = this.agentType;
        const color = this.meta.color;

        // Colored aura ring
        const aura = this.scene.add.graphics();
        aura.fillStyle(color, 0.1);
        aura.fillCircle(0, 0, 28);
        this.visuals.addAt(aura, 0);

        // Pulsing aura
        this.scene.tweens.add({
            targets: aura,
            alpha: 0.03,
            duration: 1800,
            yoyo: true,
            repeat: -1,
        });

        // Type-specific eyes
        if (type === AGENT_TYPE.STALKER || type === AGENT_TYPE.MASTERMIND) {
            const eyeL = this.scene.add.circle(-5, -2, 2, 0xff0000);
            const eyeR = this.scene.add.circle(5, -2, 2, 0xff0000);
            this.visuals.add([eyeL, eyeR]);
        }

        if (type === AGENT_TYPE.AMBUSHER) {
            const eyeL = this.scene.add.circle(-5, -2, 2, 0x9333ea);
            const eyeR = this.scene.add.circle(5, -2, 2, 0x9333ea);
            this.visuals.add([eyeL, eyeR]);
        }

        // Type label
        const typeLabel = this.scene.add.text(0, 22, this.meta.label.toUpperCase(), {
            fontSize: '7px',
            fontFamily: '"Courier New", monospace',
            color: `#${color.toString(16).padStart(6, '0')}`,
            fontStyle: 'bold',
        }).setOrigin(0.5);
        this.visuals.add(typeLabel);
    }
}

// ─── COLOR HELPERS ──────────────────────────────────────

function _skinFromType(type) {
    switch (type) {
        case AGENT_TYPE.STALKER: return 0x64748b;
        case AGENT_TYPE.RACER: return 0x8ab4f8;
        case AGENT_TYPE.DEFENDER: return 0xc9a66b;
        case AGENT_TYPE.AMBUSHER: return 0x7c6fa0;
        case AGENT_TYPE.STRATEGIST: return 0x6bcdcd;
        case AGENT_TYPE.MASTERMIND: return 0xd4a844;
        default: return 0x94a3b8;
    }
}

function _bodyFromType(type) {
    switch (type) {
        case AGENT_TYPE.STALKER: return 0x3b0000;
        case AGENT_TYPE.RACER: return 0x002244;
        case AGENT_TYPE.DEFENDER: return 0x442200;
        case AGENT_TYPE.AMBUSHER: return 0x220044;
        case AGENT_TYPE.STRATEGIST: return 0x004444;
        case AGENT_TYPE.MASTERMIND: return 0x443300;
        default: return 0x1e293b;
    }
}

// ─── FACTORY FUNCTION ───────────────────────────────────

/**
 * Create all agents for a stage from its config.
 * @param {Phaser.Scene} scene
 * @param {object} stageConfig - The stage config from LevelConfig
 * @param {object} matchManager - MatchManager instance
 * @param {object} playerTarget - Player entity for chase/attack
 * @returns {TacticalAgent[]}
 */
export function createAgentsForStage(scene, stageConfig, matchManager, playerTarget) {
    const agents = [];

    if (!stageConfig?.agents) return agents;

    for (const agentConfig of stageConfig.agents) {
        const agent = new TacticalAgent(scene, agentConfig.spawn.x, agentConfig.spawn.y, agentConfig);
        agent.setPlayerTarget(playerTarget);
        agent.setMatchManager(matchManager);
        agent.initGOAP(stageConfig.locations || {});
        agent.setDepth(40);
        agents.push(agent);
    }

    return agents;
}
