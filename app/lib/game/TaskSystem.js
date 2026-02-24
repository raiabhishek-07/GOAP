// ============================================================
// TaskSystem.js — Task Types, Priority Calculator, Channeling
// Core system for MindArena's objective-based gameplay
// ============================================================

/**
 * Task States
 */
export const TASK_STATE = {
    LOCKED: 'locked',           // Cannot interact (dependency not met)
    AVAILABLE: 'available',     // Ready to interact
    IN_PROGRESS: 'in_progress', // Being channeled/worked on
    COMPLETED: 'completed',     // Done
    FAILED: 'failed',           // Expired or stolen by AI
    CONTESTED: 'contested',     // Both player and AI working on it
};

/**
 * Task Types — each with unique interaction mechanics
 */
export const TASK_TYPE = {
    TERMINAL: 'terminal',        // Hack — stand near 3s
    KEY_COLLECT: 'key_collect',      // Pick up — walk over
    DOOR_UNLOCK: 'door_unlock',      // Open — requires key
    RESOURCE_CACHE: 'resource_cache',   // Supply drop — walk over, limited uses
    ZONE_CAPTURE: 'zone_capture',     // Control — stand in 5s uninterrupted
    SEQUENCE_CHAIN: 'sequence_chain',   // Multi-step — do A→B→C in order
    INTEL_GATHER: 'intel_gather',     // Collect scattered orbs in area
    DEFENSE_HOLD: 'defense_hold',     // Survive in zone 10s
    EXTRACTION: 'extraction',       // Final — reach portal after all tasks
};

/**
 * Task type metadata — channel times, icons, colors
 */
export const TASK_META = {
    [TASK_TYPE.TERMINAL]: {
        icon: '🖥️', label: 'Terminal', color: '#26c6da',
        channelTime: 3.0, interruptible: true,
        description: 'Hack this terminal. Stand nearby and channel.',
    },
    [TASK_TYPE.KEY_COLLECT]: {
        icon: '🔑', label: 'Key', color: '#ffd740',
        channelTime: 0, interruptible: false,
        description: 'Collect this key item.',
    },
    [TASK_TYPE.DOOR_UNLOCK]: {
        icon: '🚪', label: 'Door', color: '#ab47bc',
        channelTime: 1.5, interruptible: true,
        description: 'Unlock this door. Requires a key.',
    },
    [TASK_TYPE.RESOURCE_CACHE]: {
        icon: '📦', label: 'Supply', color: '#66bb6a',
        channelTime: 0, interruptible: false,
        description: 'Grab supplies. Limited stock.',
    },
    [TASK_TYPE.ZONE_CAPTURE]: {
        icon: '🏴', label: 'Zone', color: '#ff7043',
        channelTime: 5.0, interruptible: true,
        description: 'Capture this zone. Hold position uninterrupted.',
    },
    [TASK_TYPE.SEQUENCE_CHAIN]: {
        icon: '🔗', label: 'Chain', color: '#7e57c2',
        channelTime: 2.0, interruptible: true,
        description: 'Complete this step in the chain sequence.',
    },
    [TASK_TYPE.INTEL_GATHER]: {
        icon: '📡', label: 'Intel', color: '#29b6f6',
        channelTime: 0, interruptible: false,
        description: 'Collect all intel fragments in this area.',
    },
    [TASK_TYPE.DEFENSE_HOLD]: {
        icon: '🛡️', label: 'Defend', color: '#ef5350',
        channelTime: 10.0, interruptible: true,
        description: 'Defend this position. Survive all waves.',
    },
    [TASK_TYPE.EXTRACTION]: {
        icon: '✈️', label: 'Extract', color: '#00e676',
        channelTime: 2.0, interruptible: false,
        description: 'Extraction point. Complete all objectives first.',
    },
};

// ─── SINGLE TASK ────────────────────────────────────────

/**
 * Represents one in-game task/objective.
 */
export class Task {
    constructor(config) {
        this.id = config.id;                        // Unique identifier e.g. 'terminal_alpha'
        this.type = config.type;                    // TASK_TYPE enum
        this.name = config.name;                    // Display name
        this.position = { ...config.position };     // { x, y } world coordinates
        this.basePoints = config.basePoints || 100; // Base score value
        this.priority = config.priority || 1;       // 1-5, higher = more important
        this.state = TASK_STATE.LOCKED;

        // Dependencies
        this.requiredTasks = config.requiredTasks || [];   // IDs of tasks that must complete first
        this.requiredKey = config.requiredKey || null;      // Key item ID required (for doors)

        // Channeling
        this.meta = TASK_META[this.type] || TASK_META[TASK_TYPE.TERMINAL];
        this.channelTime = config.channelTime ?? this.meta.channelTime;
        this.channelProgress = 0;       // 0 to channelTime
        this.interruptible = this.meta.interruptible;

        // Zone capture specific
        this.captureRadius = config.captureRadius || 60;
        this.controlledBy = null;       // 'player' | 'agent' | null

        // Resource specific
        this.uses = config.uses ?? 1;           // How many times can be used
        this.maxUses = config.uses ?? 1;

        // Sequence chain specific
        this.sequenceGroup = config.sequenceGroup || null;  // Group ID
        this.sequenceOrder = config.sequenceOrder || 0;     // Order within chain

        // Intel gather specific
        this.intelFragments = config.intelFragments || 0;
        this.intelCollected = 0;

        // Timing
        this.completedAt = null;        // Timestamp when completed
        this.startedAt = null;          // When player first started channeling
        this.expiresAt = config.expiresAt || null;  // Optional expiry timer

        // Who completed it
        this.completedBy = null;        // 'player' | 'agent_<id>'

        // Optimal order (calculated by TaskSystem)
        this.optimalOrder = 0;          // Set by priority calculator

        // Visual
        this.visible = config.visible !== false;
    }

    /** Get the metadata for this task type */
    getMeta() {
        return this.meta;
    }

    /** Check if all dependencies are met */
    areDependenciesMet(completedTaskIds, playerInventory = []) {
        // Check required tasks
        for (const reqId of this.requiredTasks) {
            if (!completedTaskIds.has(reqId)) return false;
        }
        // Check required key
        if (this.requiredKey && !playerInventory.includes(this.requiredKey)) {
            return false;
        }
        return true;
    }

    /** Start channeling this task */
    startChannel(who = 'player') {
        if (this.state !== TASK_STATE.AVAILABLE) return false;
        if (this.channelTime <= 0) {
            // Instant completion (keys, resources)
            this.complete(who);
            return true;
        }
        this.state = TASK_STATE.IN_PROGRESS;
        this.channelProgress = 0;
        this.startedAt = Date.now();
        return true;
    }

    /** Update channeling progress. Returns true if completed this frame. */
    updateChannel(dt, who = 'player') {
        if (this.state !== TASK_STATE.IN_PROGRESS) return false;

        this.channelProgress += dt;
        if (this.channelProgress >= this.channelTime) {
            this.complete(who);
            return true;
        }
        return false;
    }

    /** Get channel progress as 0-1 */
    getChannelPercent() {
        if (this.channelTime <= 0) return this.state === TASK_STATE.COMPLETED ? 1 : 0;
        return Math.min(1, this.channelProgress / this.channelTime);
    }

    /** Interrupt channeling (enemy hit you, left zone, etc.) */
    interruptChannel() {
        if (this.state !== TASK_STATE.IN_PROGRESS) return;
        if (!this.interruptible) return; // Can't interrupt non-interruptible tasks
        this.state = TASK_STATE.AVAILABLE;
        this.channelProgress = 0; // Reset progress
    }

    /** Mark this task as completed */
    complete(who = 'player') {
        this.state = TASK_STATE.COMPLETED;
        this.completedBy = who;
        this.completedAt = Date.now();
        this.channelProgress = this.channelTime;
    }

    /** Mark as failed (expired, stolen) */
    fail() {
        this.state = TASK_STATE.FAILED;
    }

    /** Check if task has expired */
    isExpired(currentTime) {
        if (!this.expiresAt) return false;
        return currentTime >= this.expiresAt;
    }
}

// ─── TASK SYSTEM (manages all tasks in a match) ─────────

/**
 * TaskSystem — manages all tasks, calculates priorities, handles interactions
 */
export class TaskSystem {
    constructor() {
        this.tasks = new Map();           // id → Task
        this.completedIds = new Set();    // Quick lookup for completed tasks
        this.playerInventory = [];        // Keys, items collected by player
        this.matchStartTime = 0;
        this.optimalOrder = [];           // Calculated optimal task order
        this.playerCompletionOrder = [];  // Actual order player completed tasks
        this.agentCompletionOrder = [];   // Actual order agents completed tasks
    }

    /** Initialize with a list of task configs */
    init(taskConfigs, matchStartTime = Date.now()) {
        this.tasks.clear();
        this.completedIds.clear();
        this.playerInventory = [];
        this.matchStartTime = matchStartTime;
        this.playerCompletionOrder = [];
        this.agentCompletionOrder = [];

        for (const config of taskConfigs) {
            const task = new Task(config);
            this.tasks.set(task.id, task);
        }

        // Calculate optimal order
        this.optimalOrder = this.calculateOptimalOrder();

        // Set optimal order index on each task
        this.optimalOrder.forEach((taskId, idx) => {
            const task = this.tasks.get(taskId);
            if (task) task.optimalOrder = idx + 1;
        });

        // Initial state update
        this.updateTaskStates();
    }

    /** Update all task states based on current dependencies */
    updateTaskStates() {
        for (const [id, task] of this.tasks) {
            if (task.state === TASK_STATE.COMPLETED || task.state === TASK_STATE.FAILED) continue;
            if (task.state === TASK_STATE.IN_PROGRESS) continue;

            if (task.areDependenciesMet(this.completedIds, this.playerInventory)) {
                // Special: Extraction requires ALL non-extraction tasks complete
                if (task.type === TASK_TYPE.EXTRACTION) {
                    const allOthersDone = this.getAllNonExtractionTasks()
                        .every(t => t.state === TASK_STATE.COMPLETED);
                    task.state = allOthersDone ? TASK_STATE.AVAILABLE : TASK_STATE.LOCKED;
                } else {
                    task.state = TASK_STATE.AVAILABLE;
                }
            } else {
                task.state = TASK_STATE.LOCKED;
            }
        }
    }

    /** Get all tasks excluding extraction */
    getAllNonExtractionTasks() {
        return [...this.tasks.values()].filter(t => t.type !== TASK_TYPE.EXTRACTION);
    }

    /** Get all tasks as array */
    getAllTasks() {
        return [...this.tasks.values()];
    }

    /** Get task by ID */
    getTask(id) {
        return this.tasks.get(id);
    }

    /** Get available tasks (can be started now) */
    getAvailableTasks() {
        return [...this.tasks.values()].filter(t => t.state === TASK_STATE.AVAILABLE);
    }

    /** Get completed tasks */
    getCompletedTasks() {
        return [...this.tasks.values()].filter(t => t.state === TASK_STATE.COMPLETED);
    }

    /** Get completion percentage (0-1) */
    getCompletionPercent() {
        const total = this.getAllNonExtractionTasks().length;
        if (total === 0) return 1;
        const done = this.getCompletedTasks().filter(t => t.type !== TASK_TYPE.EXTRACTION).length;
        return done / total;
    }

    /** Get count of player-completed tasks */
    getPlayerCompletedCount() {
        return [...this.tasks.values()].filter(
            t => t.state === TASK_STATE.COMPLETED && t.completedBy === 'player'
        ).length;
    }

    /** Get count of AI-completed tasks */
    getAgentCompletedCount() {
        return [...this.tasks.values()].filter(
            t => t.state === TASK_STATE.COMPLETED && t.completedBy !== 'player' && t.completedBy !== null
        ).length;
    }

    /**
     * Try to interact with a task (player or agent)
     * @returns {object} { success, task, message, reward }
     */
    tryInteract(taskId, who = 'player', dt = 0) {
        const task = this.tasks.get(taskId);
        if (!task) return { success: false, message: 'Task not found' };

        if (task.state === TASK_STATE.COMPLETED) {
            return { success: false, message: 'Already completed' };
        }
        if (task.state === TASK_STATE.LOCKED) {
            return { success: false, message: 'Locked — complete prerequisites first' };
        }

        // Instant tasks (keys, resources)
        if (task.channelTime <= 0) {
            task.complete(who);
            this.completedIds.add(taskId);
            this._recordCompletion(taskId, who);

            // Handle key collection → add to inventory
            if (task.type === TASK_TYPE.KEY_COLLECT && who === 'player') {
                this.playerInventory.push(taskId);
            }

            // Handle resource cache
            if (task.type === TASK_TYPE.RESOURCE_CACHE) {
                task.uses--;
                if (task.uses > 0) {
                    // Reset for next use
                    task.state = TASK_STATE.AVAILABLE;
                    task.completedBy = null;
                    this.completedIds.delete(taskId);
                }
            }

            this.updateTaskStates();
            return {
                success: true,
                task,
                message: `${task.name} completed!`,
                reward: this.calculateTaskScore(task),
            };
        }

        // Channeled tasks
        if (task.state === TASK_STATE.AVAILABLE) {
            task.startChannel(who);
            return { success: true, task, message: `Channeling ${task.name}...`, reward: 0 };
        }

        if (task.state === TASK_STATE.IN_PROGRESS) {
            const completed = task.updateChannel(dt, who);
            if (completed) {
                this.completedIds.add(taskId);
                this._recordCompletion(taskId, who);
                this.updateTaskStates();
                return {
                    success: true,
                    task,
                    message: `${task.name} completed!`,
                    reward: this.calculateTaskScore(task),
                };
            }
            return {
                success: true,
                task,
                message: `Channeling... ${Math.round(task.getChannelPercent() * 100)}%`,
                reward: 0,
            };
        }

        return { success: false, message: 'Cannot interact' };
    }

    /** Record completion order */
    _recordCompletion(taskId, who) {
        if (who === 'player') {
            this.playerCompletionOrder.push(taskId);
        } else {
            this.agentCompletionOrder.push(taskId);
        }
    }

    /**
     * Calculate the score for a completed task.
     * Factors: base points, time multiplier, optimal order bonus.
     */
    calculateTaskScore(task) {
        if (!task || task.state !== TASK_STATE.COMPLETED) return 0;

        const elapsed = (task.completedAt - this.matchStartTime) / 1000; // seconds

        // Time multiplier — early completion = more points
        let timeMultiplier = 1.0;
        if (elapsed < 30) timeMultiplier = 1.5;
        else if (elapsed < 60) timeMultiplier = 1.2;
        else if (elapsed < 90) timeMultiplier = 1.0;
        else if (elapsed < 120) timeMultiplier = 0.8;
        else timeMultiplier = 0.6;

        // Order bonus — did player do this in the optimal order?
        let orderBonus = 1.0;
        if (task.completedBy === 'player') {
            const playerIdx = this.playerCompletionOrder.indexOf(task.id);
            if (playerIdx >= 0 && playerIdx < this.optimalOrder.length) {
                const optimalIdx = this.optimalOrder.indexOf(task.id);
                if (playerIdx === optimalIdx) {
                    orderBonus = 2.0; // Perfect order match
                } else if (Math.abs(playerIdx - optimalIdx) <= 1) {
                    orderBonus = 1.5; // Close to optimal
                }
            }
        }

        // Priority multiplier
        const priorityMult = 0.8 + (task.priority * 0.2); // priority 1=1.0, 5=1.8

        return Math.round(task.basePoints * timeMultiplier * orderBonus * priorityMult);
    }

    /**
     * Calculate the mathematically optimal order to complete tasks.
     * Uses a greedy nearest-neighbor approach weighted by priority and distance.
     */
    calculateOptimalOrder(startPos = null) {
        const available = [...this.tasks.values()].filter(
            t => t.type !== TASK_TYPE.EXTRACTION && t.visible
        );

        if (available.length === 0) return [];

        // Build dependency graph
        const canDo = (task, done) => {
            return task.requiredTasks.every(reqId => done.has(reqId));
        };

        const order = [];
        const done = new Set();
        let currentPos = startPos || { x: 400, y: 400 };

        while (order.length < available.length) {
            // Find best next task (from those whose dependencies are met)
            let bestTask = null;
            let bestScore = -Infinity;

            for (const task of available) {
                if (done.has(task.id)) continue;
                if (!canDo(task, done)) continue;

                // Score combines priority and proximity (inverse distance)
                const dist = Math.sqrt(
                    (task.position.x - currentPos.x) ** 2 +
                    (task.position.y - currentPos.y) ** 2
                );
                const proximityScore = 1 / (1 + dist / 200);
                const priorityScore = task.priority / 5;
                const pointScore = task.basePoints / 1000;

                // Weighted combination
                const score = (priorityScore * 0.4) + (proximityScore * 0.35) + (pointScore * 0.25);

                if (score > bestScore) {
                    bestScore = score;
                    bestTask = task;
                }
            }

            if (bestTask) {
                order.push(bestTask.id);
                done.add(bestTask.id);
                currentPos = bestTask.position;
            } else {
                break; // No more reachable tasks
            }
        }

        return order;
    }

    /**
     * Find the nearest available task to a position.
     */
    findNearestTask(position, filter = null) {
        let nearest = null;
        let minDist = Infinity;

        for (const task of this.getAvailableTasks()) {
            if (filter && !filter(task)) continue;
            const dist = Math.sqrt(
                (task.position.x - position.x) ** 2 +
                (task.position.y - position.y) ** 2
            );
            if (dist < minDist) {
                minDist = dist;
                nearest = task;
            }
        }

        return nearest;
    }

    /**
     * Find tasks near a position within a given radius.
     */
    findTasksInRange(position, radius) {
        return [...this.tasks.values()].filter(task => {
            if (task.state === TASK_STATE.COMPLETED || task.state === TASK_STATE.FAILED) return false;
            const dist = Math.sqrt(
                (task.position.x - position.x) ** 2 +
                (task.position.y - position.y) ** 2
            );
            return dist <= radius;
        });
    }

    /** Export state for HUD display */
    getHUDData() {
        const all = this.getAllNonExtractionTasks();
        const completed = all.filter(t => t.state === TASK_STATE.COMPLETED);
        const playerDone = completed.filter(t => t.completedBy === 'player');
        const agentDone = completed.filter(t => t.completedBy !== 'player');
        const inProgress = all.filter(t => t.state === TASK_STATE.IN_PROGRESS);

        return {
            total: all.length,
            completed: completed.length,
            playerCompleted: playerDone.length,
            agentCompleted: agentDone.length,
            inProgress: inProgress.length,
            percent: this.getCompletionPercent(),
            currentTask: inProgress[0] || null,
            nextOptimal: this._getNextOptimalTask(),
            tasks: all.map(t => ({
                id: t.id,
                name: t.name,
                type: t.type,
                state: t.state,
                priority: t.priority,
                icon: t.meta.icon,
                color: t.meta.color,
                position: t.position,
                channelPercent: t.getChannelPercent(),
                completedBy: t.completedBy,
                optimalOrder: t.optimalOrder,
            })),
        };
    }

    /** Get the next task in optimal order that hasn't been completed */
    _getNextOptimalTask() {
        for (const taskId of this.optimalOrder) {
            const task = this.tasks.get(taskId);
            if (task && task.state !== TASK_STATE.COMPLETED && task.state !== TASK_STATE.FAILED) {
                return task;
            }
        }
        return null;
    }
}
