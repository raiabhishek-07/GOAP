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

// ---- Planner Node (from GoapPlanner.cs) ----
class PlannerNode {
    constructor(parent, action, requiredEffects, cost) {
        this.parent = parent;
        this.action = action;
        this.requiredEffects = new Set(requiredEffects);
        this.leaves = [];
        this.cost = cost;
    }

    get isLeafDead() {
        return this.leaves.length === 0 && this.action === null;
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

// ---- GoapPlanner (from GoapPlanner.cs) ----
export class GoapPlanner {
    plan(agent, goals, mostRecentGoal = null) {
        if (!goals) return null;

        // Convert to array and check length/size
        const goalsList = goals instanceof Set ? [...goals] : (Array.isArray(goals) ? goals : [goals]);
        if (goalsList.length === 0) return null;

        // Order goals by priority, descending
        const orderedGoals = goalsList
            .filter(g => {
                if (!g || !g.desiredEffects) return false;
                // Only plan for goals that aren't already satisfied
                return [...g.desiredEffects].some(b => b && !b.evaluate());
            })
            .sort((a, b) => {
                const getP = (g) => {
                    const base = typeof g.priority === 'function' ? g.priority() : (g.priority || 0);
                    return g === mostRecentGoal ? base - 0.01 : base;
                };
                return getP(b) - getP(a);
            });

        for (const goal of orderedGoals) {
            const goalNode = new PlannerNode(null, null, goal.desiredEffects, 0);

            if (this._findPath(goalNode, agent.actions)) {
                if (goalNode.isLeafDead) continue;

                const actionStack = [];
                let current = goalNode;
                while (current.leaves.length > 0) {
                    const cheapestLeaf = current.leaves.reduce((min, leaf) =>
                        leaf.cost < min.cost ? leaf : min
                    );
                    current = cheapestLeaf;
                    actionStack.push(cheapestLeaf.action);
                }

                return new ActionPlan(goal, actionStack, current.cost);
            }
        }

        return null;
    }

    _findPath(parent, actions) {
        const orderedActions = [...actions].sort((a, b) => a.cost - b.cost);

        for (const action of orderedActions) {
            // WORK ON A COPY to avoid mutating the original goal/parent effects
            const requiredEffects = new Set(parent.requiredEffects);

            // Remove effects that already evaluate to true
            for (const b of [...requiredEffects]) {
                if (b.evaluate()) requiredEffects.delete(b);
            }

            if (requiredEffects.size === 0) return true;

            // Check if this action's effects satisfy any required effects
            const hasMatchingEffect = [...action.effects].some(e => requiredEffects.has(e));

            if (hasMatchingEffect) {
                const newRequired = new Set(requiredEffects);
                for (const e of action.effects) newRequired.delete(e);
                for (const p of action.preconditions) newRequired.add(p);

                const newAvailable = new Set(actions);
                newAvailable.delete(action);

                const newNode = new PlannerNode(parent, action, newRequired, parent.cost + action.cost);

                if (this._findPath(newNode, newAvailable)) {
                    parent.leaves.push(newNode);
                    for (const p of newNode.action.preconditions) {
                        newRequired.delete(p);
                    }
                }

                if (newRequired.size === 0) return true;
            }
        }

        return parent.leaves.length > 0;
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
