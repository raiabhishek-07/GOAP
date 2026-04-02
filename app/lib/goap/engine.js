// ============================================================
// GOAP Engine — Ported from Unity C# (Assets/_Project/Scripts/GOAP)
// Pure JavaScript, zero dependencies
// ============================================================

// ---- Timer Utility (from Timer.cs) ----
export class CountdownTimer {
    constructor(duration) {
        this.initialTime = duration;
        this.time = duration;
        this.isRunning = false;
        this.onTimerStart = [];
        this.onTimerStop = [];
    }

    start() {
        this.time = this.initialTime;
        if (!this.isRunning) {
            this.isRunning = true;
            this.onTimerStart.forEach(cb => cb());
        }
    }

    stop() {
        if (this.isRunning) {
            this.isRunning = false;
            this.onTimerStop.forEach(cb => cb());
        }
    }

    tick(deltaTime) {
        if (this.isRunning && this.time > 0) {
            this.time -= deltaTime;
        }
        if (this.isRunning && this.time <= 0) {
            this.stop();
        }
    }

    get isFinished() {
        return this.time <= 0;
    }

    reset(newTime) {
        if (newTime !== undefined) this.initialTime = newTime;
        this.time = this.initialTime;
    }
}

// ---- PriorityQueue Utility (for A* search) ----
class PriorityQueue {
    constructor(comparator = (a, b) => a - b) {
        this.heap = [];
        this.comparator = comparator;
    }
    push(item) {
        this.heap.push(item);
        this.siftUp();
    }
    pop() {
        if (this.size() === 0) return null;
        const top = this.heap[0];
        const last = this.heap.pop();
        if (this.size() > 0) {
            this.heap[0] = last;
            this.siftDown();
        }
        return top;
    }
    size() { return this.heap.length; }
    siftUp() {
        let index = this.heap.length - 1;
        while (index > 0) {
            const parent = Math.floor((index - 1) / 2);
            if (this.comparator(this.heap[index], this.heap[parent]) < 0) {
                [this.heap[index], this.heap[parent]] = [this.heap[parent], this.heap[index]];
                index = parent;
            } else break;
        }
    }
    siftDown() {
        let index = 0;
        while (true) {
            const left = 2 * index + 1;
            const right = 2 * index + 2;
            let smallest = index;
            if (left < this.heap.length && this.comparator(this.heap[left], this.heap[smallest]) < 0) smallest = left;
            if (right < this.heap.length && this.comparator(this.heap[right], this.heap[smallest]) < 0) smallest = right;
            if (smallest !== index) {
                [this.heap[index], this.heap[smallest]] = [this.heap[smallest], this.heap[index]];
                index = smallest;
            } else break;
        }
    }
}

// ---- AgentBelief (from Beliefs.cs) ----
export class AgentBelief {
    constructor(name) {
        this.name = name;
        this._condition = () => false;
        this._observedLocation = () => ({ x: 0, y: 0 });
    }

    get location() {
        return this._observedLocation();
    }

    evaluate() {
        return this._condition();
    }

    static builder(name) {
        return new AgentBeliefBuilder(name);
    }
}

class AgentBeliefBuilder {
    constructor(name) {
        this.belief = new AgentBelief(name);
    }

    withCondition(conditionFn) {
        this.belief._condition = conditionFn;
        return this;
    }

    withLocation(locationFn) {
        this.belief._observedLocation = locationFn;
        return this;
    }

    build() {
        return this.belief;
    }
}

// ---- BeliefFactory (from Beliefs.cs) ----
export class BeliefFactory {
    constructor(agent, beliefs) {
        this.agent = agent;
        this.beliefs = beliefs;
    }

    addBelief(key, conditionFn) {
        this.beliefs[key] = AgentBelief.builder(key)
            .withCondition(conditionFn)
            .build();
    }

    addSensorBelief(key, sensor) {
        this.beliefs[key] = AgentBelief.builder(key)
            .withCondition(() => sensor.isTargetInRange)
            .withLocation(() => sensor.targetPosition)
            .build();
    }

    addLocationBelief(key, distance, location) {
        this.beliefs[key] = AgentBelief.builder(key)
            .withCondition(() => this._inRangeOf(location, distance))
            .withLocation(() => (typeof location === 'function' ? location() : location))
            .build();
    }

    _inRangeOf(pos, range) {
        const loc = typeof pos === 'function' ? pos() : pos;
        const agentPos = this.agent.position;
        const dx = agentPos.x - loc.x;
        const dy = agentPos.y - loc.y;
        return Math.sqrt(dx * dx + dy * dy) < range;
    }
}

// ---- AgentAction (from Actions.cs) ----
export class AgentAction {
    constructor(name) {
        this.name = name;
        this.cost = 1;
        this.preconditions = new Set();
        this.effects = new Set();
        this._strategy = null;
    }

    get complete() {
        return this._strategy ? this._strategy.complete : true;
    }

    start() {
        if (this._strategy) this._strategy.start();
    }

    update(deltaTime) {
        if (this._strategy && this._strategy.canPerform) {
            this._strategy.update(deltaTime);
        }
        if (this._strategy && this._strategy.complete) {
            for (const effect of this.effects) {
                effect.evaluate();
            }
        }
    }

    stop() {
        if (this._strategy) this._strategy.stop();
    }

    static builder(name) {
        return new AgentActionBuilder(name);
    }
}

class AgentActionBuilder {
    constructor(name) {
        this.action = new AgentAction(name);
    }

    withCost(cost) {
        this.action.cost = cost;
        return this;
    }

    withStrategy(strategy) {
        this.action._strategy = strategy;
        return this;
    }

    addPrecondition(belief) {
        this.action.preconditions.add(belief);
        return this;
    }

    addEffect(belief) {
        this.action.effects.add(belief);
        return this;
    }

    build() {
        return this.action;
    }
}

// ---- AgentGoal (from Goals.cs) ----
export class AgentGoal {
    constructor(name) {
        this.name = name;
        this._priority = 0;  // Can be a number OR a function returning a number
        this.desiredEffects = new Set();
    }

    // Dynamic priority: supports both static numbers and functions
    get priority() {
        return typeof this._priority === 'function' ? this._priority() : this._priority;
    }

    static builder(name) {
        return new AgentGoalBuilder(name);
    }
}

class AgentGoalBuilder {
    constructor(name) {
        this.goal = new AgentGoal(name);
    }

    withPriority(priority) {
        this.goal._priority = priority;  // Accepts number or function
        return this;
    }

    withDesiredEffect(belief) {
        this.goal.desiredEffects.add(belief);
        return this;
    }

    build() {
        return this.goal;
    }
}

// ---- Planner Node (Architected for A*) ----
class PlannerNode {
    constructor(action, unsatisfiedPreconditions, parent = null, gCost = 0) {
        this.action = action;
        this.unsatisfiedPreconditions = new Set(unsatisfiedPreconditions);
        this.parent = parent;
        this.gCost = gCost; // Total cost from goal to here
        this.hCost = this.unsatisfiedPreconditions.size; // Heuristic: number of unsatisfied requirements
    }

    get fCost() {
        return this.gCost + this.hCost;
    }
}

// ---- ActionPlan (from GoapPlanner.cs) ----
export class ActionPlan {
    constructor(goal, actions, totalCost) {
        this.agentGoal = goal;
        this.actions = actions; // Array used as stack
        this.totalCost = totalCost;
    }
}

// ---- GoapPlanner (Refactored for A* Search) ----
export class GoapPlanner {
    plan(agent, goals, mostRecentGoal = null) {
        if (!goals) return null;

        const goalsList = goals instanceof Set ? [...goals] : (Array.isArray(goals) ? goals : [goals]);
        if (goalsList.length === 0) return null;

        const orderedGoals = goalsList
            .filter(g => {
                if (!g || !g.desiredEffects) return false;
                return [...g.desiredEffects].some(b => b && !b.evaluate());
            })
            .sort((a, b) => {
                const getP = (g) => {
                    const base = g.priority;
                    return g === mostRecentGoal ? base - 0.01 : base;
                };
                return getP(b) - getP(a);
            });

        for (const goal of orderedGoals) {
            const plan = this._search(agent, goal);
            if (plan) return plan;
        }

        return null;
    }

    _search(agent, goal) {
        const openSet = new PriorityQueue((a, b) => a.fCost - b.fCost);
        
        // Root node: Start with the goal's requirements
        const rootRequirements = new Set();
        for (const e of goal.desiredEffects) {
            if (!e.evaluate()) rootRequirements.add(e);
        }

        openSet.push(new PlannerNode(null, rootRequirements));

        while (openSet.size() > 0) {
            const current = openSet.pop();

            // If no unsatisfied preconditions, we found the path to current beliefs
            if (current.unsatisfiedPreconditions.size === 0) {
                return this._buildActionPlan(goal, current);
            }

            // A* Neighbors: Actions that satisfy any of the current unsatisfied preconditions
            for (const action of agent.actions) {
                // Check if this action satisfies at least one requirement
                const satisfiesSomething = [...action.effects].some(e => current.unsatisfiedPreconditions.has(e));
                
                if (satisfiesSomething) {
                    const nextRequirements = new Set(current.unsatisfiedPreconditions);
                    
                    // Satisfy what this action provides
                    for (const e of action.effects) nextRequirements.delete(e);
                    
                    // Add this action's preconditions as new requirements (if not already true)
                    for (const p of action.preconditions) {
                        if (!p.evaluate()) nextRequirements.add(p);
                    }

                    const newNode = new PlannerNode(action, nextRequirements, current, current.gCost + action.cost);
                    openSet.push(newNode);
                }
            }
        }

        return null;
    }

    _buildActionPlan(goal, node) {
        const actions = [];
        let totalCost = node.gCost;
        let current = node;

        // Path is built goal-to-start, so we walk up parents to get start-to-goal
        while (current.parent !== null) {
            actions.unshift(current.action);
            current = current.parent;
        }

        return new ActionPlan(goal, actions, totalCost);
    }
}


// ---- Action Strategies (from Strategies.cs) — 2D versions ----

export class IdleStrategy {
    constructor(duration) {
        this.timer = new CountdownTimer(duration);
        this._complete = false;
        this.timer.onTimerStart.push(() => { this._complete = false; });
        this.timer.onTimerStop.push(() => { this._complete = true; });
    }

    get canPerform() { return true; }
    get complete() { return this._complete; }

    start() { this.timer.start(); }
    update(dt) { this.timer.tick(dt); }
    stop() { }
}

export class MoveStrategy {
    constructor(agent, destinationFn, dynamic = false) {
        this.agent = agent;
        this.destinationFn = destinationFn;
        this._destination = { x: 0, y: 0 };
        this._dynamic = dynamic; // If true, re-evaluate destination every frame (for chasing moving targets)
    }

    get canPerform() { return !this.complete; }

    get complete() {
        if (!this._destination) return true;
        const dx = this.agent.position.x - (this._destination.x || this.agent.position.x);
        const dy = this.agent.position.y - (this._destination.y || this.agent.position.y);
        return Math.sqrt(dx * dx + dy * dy) < 8;
    }

    start() {
        const dest = this.destinationFn();
        if (!dest) {
            console.warn("MoveStrategy: destinationFn returned undefined. Staying put.");
            this._destination = { x: this.agent.position.x, y: this.agent.position.y };
        } else {
            this._destination = { x: dest.x, y: dest.y };
        }
        this.agent.moveTo(this._destination);
    }

    update(dt) {
        // For dynamic targets (e.g. chasing player), update destination each frame
        if (this._dynamic) {
            const dest = this.destinationFn();
            if (dest) {
                this._destination = { x: dest.x, y: dest.y };
                this.agent.moveTo(this._destination);
            }
        }
    }

    stop() {
        this.agent.stopMoving();
    }
}

export class WanderStrategy {
    constructor(agent, wanderRadius) {
        this.agent = agent;
        this.wanderRadius = wanderRadius;
        this._destination = { x: 0, y: 0 };
        this._started = false;
    }

    get canPerform() { return !this.complete; }

    get complete() {
        if (!this._started) return false;
        const dx = this.agent.position.x - this._destination.x;
        const dy = this.agent.position.y - this._destination.y;
        return Math.sqrt(dx * dx + dy * dy) < 8;
    }

    start() {
        const angle = Math.random() * Math.PI * 2;
        const dist = Math.random() * this.wanderRadius;
        this._destination = {
            x: Math.max(40, Math.min(760, this.agent.position.x + Math.cos(angle) * dist)),
            y: Math.max(40, Math.min(560, this.agent.position.y + Math.sin(angle) * dist))
        };
        this.agent.moveTo(this._destination);
        this._started = true;
    }

    update(dt) { }
    stop() { this.agent.stopMoving(); }
}

export class AttackStrategy {
    constructor(duration = 1.0) {
        this.timer = new CountdownTimer(duration);
        this._complete = false;
        this.timer.onTimerStart.push(() => { this._complete = false; });
        this.timer.onTimerStop.push(() => { this._complete = true; });
    }

    get canPerform() { return true; }
    get complete() { return this._complete; }

    start() {
        this.timer.start();
    }

    update(dt) {
        this.timer.tick(dt);
    }

    stop() { }
}

export class HealStrategy {
    constructor(agent, healRate = 5) {
        this.agent = agent;
        this.healRate = healRate; // Health per second
        this._complete = false;
    }

    get canPerform() { return this.agent.health < this.agent.maxHealth; }
    get complete() { return this._complete; }

    start() {
        this._complete = false;
    }

    update(dt) {
        if (this.agent.health < this.agent.maxHealth) {
            this.agent.health = Math.min(this.agent.maxHealth, this.agent.health + (this.healRate * dt));
        } else {
            this._complete = true;
        }
    }

    stop() { }
}

export class FleeAndHealStrategy {
    constructor(agent, targetFn, obstacles = [], healRate = 4, fleeDistance = 350) {
        this.agent = agent;
        this.targetFn = targetFn;
        this.obstacles = obstacles; // Array of {x, y, w, h}
        this.healRate = healRate;
        this.fleeDistance = fleeDistance;
        this._destination = null;
    }

    get canPerform() { return true; }
    get complete() {
        if (!this._destination) return true;
        const dx = this.agent.position.x - this._destination.x;
        const dy = this.agent.position.y - this._destination.y;
        const atDest = Math.sqrt(dx * dx + dy * dy) < 20;
        return atDest || this.agent.health >= 100;
    }

    start() {
        const target = this.targetFn();
        if (!target) return;

        // 🧠 Strategic Cover Algorithm
        // 1. Find the nearest obstacle that can block LOS to the player
        let bestCover = null;
        let bestDist = Infinity;

        for (const obs of this.obstacles) {
            const dist = Math.sqrt(Math.pow(obs.x - this.agent.position.x, 2) + Math.pow(obs.y - this.agent.position.y, 2));
            if (dist < bestDist && dist < 600) { // Only consider nearby obstacles
                bestDist = dist;
                bestCover = obs;
            }
        }

        if (bestCover) {
            // 2. Calculate "Shadow Point" (opposite side of obstacle from player)
            const vx = bestCover.x - target.x;
            const vy = bestCover.y - target.y;
            const vDist = Math.sqrt(vx * vx + vy * vy) || 1;
            
            this._destination = {
                x: bestCover.x + (vx / vDist) * 40, // Move 40px beyond the obstacle center
                y: bestCover.y + (vy / vDist) * 40
            };
        } else {
            // 3. Fallback: Pure directional flee
            const vx = this.agent.position.x - target.x;
            const vy = this.agent.position.y - target.y;
            const dist = Math.sqrt(vx * vx + vy * vy) || 1;
            this._destination = {
                x: Math.max(100, Math.min(3900, this.agent.position.x + (vx / dist) * this.fleeDistance)),
                y: Math.max(100, Math.min(2900, this.agent.position.y + (vy / dist) * this.fleeDistance))
            };
        }

        this.agent.moveTo(this._destination);
    }

    update(dt) {
        if (this.agent.health < 100) {
            this.agent.health = Math.min(100, this.agent.health + (this.healRate * dt));
        }
    }

    stop() { this.agent.stopMoving(); }
}

/**
 * Suppress and Flee Strategy
 * Shoot at target while running to cover and healing
 */
export class SuppressAndFleeStrategy {
    constructor(agent, targetFn, obstacles = [], healRate = 5) {
        this.agent = agent;
        this.targetFn = targetFn;
        this.flee = new FleeAndHealStrategy(agent, targetFn, obstacles, healRate);
        this.shootTimer = 0;
        this.shootInterval = 0.6; // Shoot every 0.6s
    }

    get canPerform() { return true; }
    get complete() { return this.flee.complete; }

    start() {
        this.flee.start();
        this.shootTimer = 0;
    }

    update(dt) {
        this.flee.update(dt);
        
        // Suppress target while fleeing
        this.shootTimer += dt;
        if (this.shootTimer >= this.shootInterval) {
            const target = this.targetFn();
            if (target) {
                // If agent has shoot method, use it
                if (this.agent.shoot) {
                    this.agent.shoot(target.position || target);
                }
            }
            this.shootTimer = 0;
        }
    }

    stop() { this.flee.stop(); }
}

/**
 * Reinforce Teammate Strategy
 * Move to a teammate's position who is in distress
 */
export class ReinforceTeammateStrategy {
    constructor(agent, distressPosFn) {
        this.agent = agent;
        this.distressPosFn = distressPosFn;
        this._complete = false;
    }

    get canPerform() { return !!this.distressPosFn(); }
    get complete() { 
        if (this._complete) return true;
        const dist = this.distressPosFn();
        if (!dist) return true;
        const dx = this.agent.position.x - dist.x;
        const dy = this.agent.position.y - dist.y;
        return Math.sqrt(dx * dx + dy * dy) < 80; // Close enough to assist
    }

    start() {
        const target = this.distressPosFn();
        if (target) {
            this.agent.moveTo(target);
        }
    }

    update(dt) {
        const target = this.distressPosFn();
        if (!target) {
            this._complete = true;
            return;
        }
        // Update destination in case teammate is moving
        this.agent.moveTo(target);
    }

    stop() { this.agent.stopMoving(); }
}

// ---- Sensor (from Sensor.cs) — 2D distance-based ----
export class Sensor {
    constructor(agent, detectionRadius, targetTag = 'player') {
        this.agent = agent;
        this.detectionRadius = detectionRadius;
        this.targetTag = targetTag;
        this._target = null;
        this._lastInRange = false;
        this.onTargetChanged = [];
    }

    get targetPosition() {
        return this._target ? this._target.position : { x: 0, y: 0 };
    }

    get isTargetInRange() {
        return this._target !== null && this._isInRange();
    }

    setTarget(targetEntity) {
        this._target = targetEntity;
    }

    update() {
        if (!this._target) return;

        const inRange = this._isInRange();
        if (inRange !== this._lastInRange) {
            this._lastInRange = inRange;
            this.onTargetChanged.forEach(cb => cb());
        }
    }

    _isInRange() {
        if (!this._target) return false;
        const dx = this.agent.position.x - this._target.position.x;
        const dy = this.agent.position.y - this._target.position.y;
        return Math.sqrt(dx * dx + dy * dy) < this.detectionRadius;
    }
}
