# 2D GOAP Simulation — Complete Specification

> **Source**: Ported from `C:\Users\Abhi\Desktop\project_g\Unity-GOAP`  
> **Target**: `C:\Users\Abhi\Desktop\project_g\web-Goap\app\simulation`  
> **Engine**: HTML5 Canvas + JavaScript (no external libraries)  
> **Algorithm**: Greedy Depth-First Search (DFS) — backward chaining

---

## Table of Contents

1. [Overview](#1-overview)
2. [World Layout](#2-world-layout)
3. [The Agent (AI Character)](#3-the-agent)
4. [Beliefs System](#4-beliefs-system)
5. [Actions System](#5-actions-system)
6. [Goals System](#6-goals-system)
7. [The Planner (DFS Algorithm)](#7-the-planner)
8. [Sensors](#8-sensors)
9. [Stats & Decay System](#9-stats--decay-system)
10. [The Game Loop](#10-the-game-loop)
11. [Complete Behavior Scenarios](#11-complete-behavior-scenarios)
12. [Player Interaction](#12-player-interaction)
13. [Debug Panel](#13-debug-panel)
14. [File Architecture](#14-file-architecture)
15. [Unity → Web Mapping](#15-unity--web-mapping)

---

## 1. Overview

The simulation is a **top-down 2D world** where an AI agent uses **Goal-Oriented Action Planning (GOAP)** to autonomously decide what to do. The agent has:

- **Health** and **Stamina** that decay over time
- **5 Goals** it wants to achieve, ranked by priority
- **11 Actions** it can take, each with preconditions and effects
- **13 Beliefs** about the world that it evaluates in real-time
- **2 Sensors** that detect the player's proximity

The agent **does NOT follow a scripted sequence**. Instead, every time it needs to act, the **GOAP Planner** builds a fresh plan by:

1. Picking the highest-priority unsatisfied goal
2. Working **backward** from the goal's desired effect
3. Finding a chain of actions whose effects satisfy the requirements
4. Executing the plan step by step

If the world changes (e.g., the player enters chase range), the agent **drops its current plan** and replans from scratch.

---

## 2. World Layout

The simulation canvas is **800×600 pixels**. The world contains these locations:

```
┌──────────────────────────────────────────────────────────┐
│                                                          │
│    🍖 Food Shack                    🛏️ Rest Area         │
│    (130, 130)                       (650, 130)           │
│         │                              ▲                 │
│         │                             ╱ ╲                │
│         │                            ╱   ╲               │
│         │              🚪 Door 1    ╱     ╲              │
│         │              (400, 250)──╱       ╲             │
│         │                 │       ╱    cost=2╲           │
│         │                 │      ╱            ╲          │
│    Agent Spawn ───────────┘     ╱              ╲         │
│    (400, 350)                  ╱                ╲        │
│         │                     ╱                  ╲       │
│         └────────────── 🚪 Door 2               ╱       │
│                         (550, 400)──────────────╱        │
│                                       cost=1             │
│                         🔴 Player Spawn                  │
│                         (650, 450)                       │
│                                                          │
│    🌳🌳    🌳        🌳🌳      🌳        🌳🌳           │
└──────────────────────────────────────────────────────────┘
```

### Location Purposes

| Location | Coordinates | Purpose |
|----------|-------------|---------|
| **Food Shack** | (130, 130) | Agent comes here to **eat** and restore **health** |
| **Rest Area** | (650, 130) | Agent comes here to **rest** and restore **stamina** |
| **Door 1** | (400, 250) | Waypoint to Rest Area (**cost = 2** through this route) |
| **Door 2** | (550, 400) | Waypoint to Rest Area (**cost = 1** through this route — cheaper!) |
| **Agent Spawn** | (400, 350) | Where the AI agent starts |
| **Player Spawn** | (650, 450) | Where the player entity starts |

### Path Cost Design

There are **two routes** from the agent to the Rest Area:

- **Route A**: Agent → Door 1 → Rest Area (total cost: **1 + 2 = 3**)
- **Route B**: Agent → Door 2 → Rest Area (total cost: **1 + 1 = 2**)

The planner will **always choose Route B** (via Door 2) because it's cheaper. This demonstrates GOAP's **cost optimization** — the planner finds the cheapest sequence of actions.

### Proximity Ranges

- **"At location" range**: **30 pixels** — the agent is considered "at" a location when within 30px
- **"Movement complete" range**: **8 pixels** — movement stops when within 8px of target
- **Chase sensor range**: **150 pixels** — detects player to trigger chase behavior
- **Attack sensor range**: **40 pixels** — close enough to attack

---

## 3. The Agent (AI Character)

### Visual Appearance

- **Blue circle** (radius 14px) with gradient shading
- **Eyes** that look in the direction of movement
- **Health bar** (green/yellow/red) above the agent
- **Stamina bar** (blue) below the health bar
- **Label**: "AI Agent" above
- **Current action label** below (e.g., "Move to Food Shack")
- **Bobbing animation** (sine wave, 4Hz)
- **Attack glow** (red aura when attacking)

### Properties

| Property | Initial Value | Range |
|----------|--------------|-------|
| Health | 100 | 0 – 100 |
| Stamina | 100 | 0 – 100 |
| Speed | 80 px/sec | Fixed |
| Position | (400, 350) | Anywhere on canvas |

### Movement

Movement uses **linear interpolation** toward the target position:

```
dx = target.x - position.x
dy = target.y - position.y
distance = sqrt(dx² + dy²)

if distance < 5:
    stop moving
else:
    step = speed × deltaTime
    position.x += (dx / distance) × min(step, distance)
    position.y += (dy / distance) × min(step, distance)
```

A **dashed line** is drawn from the agent to its move target while moving.

---

## 4. Beliefs System

Beliefs are **dynamic facts** about the world. Each belief has:
- A **name** (string)
- A **condition function** that returns `true` or `false` when evaluated
- An optional **location function** that returns a position `{x, y}`

### All 13 Beliefs

| # | Belief Name | Condition | Type |
|---|-------------|-----------|------|
| 1 | `Nothing` | Always `false` | Static |
| 2 | `AgentIdle` | `!isMoving` | Dynamic |
| 3 | `AgentMoving` | `isMoving` | Dynamic |
| 4 | `AgentHealthLow` | `health < 30` | Dynamic |
| 5 | `AgentIsHealthy` | `health >= 50` | Dynamic |
| 6 | `AgentStaminaLow` | `stamina < 10` | Dynamic |
| 7 | `AgentIsRested` | `stamina >= 50` | Dynamic |
| 8 | `AgentAtDoorOne` | distance to Door 1 < 30px | Location |
| 9 | `AgentAtDoorTwo` | distance to Door 2 < 30px | Location |
| 10 | `AgentAtRestingPosition` | distance to Rest Area < 30px | Location |
| 11 | `AgentAtFoodShack` | distance to Food Shack < 30px | Location |
| 12 | `PlayerInChaseRange` | chase sensor detecting player | Sensor |
| 13 | `PlayerInAttackRange` | attack sensor detecting player | Sensor |
| 14 | `AttackingPlayer` | Always `false` | Static |

> **Important**: `Nothing` and `AttackingPlayer` are always `false`. This is intentional:
> - `Nothing` ensures the "Chill Out" goal is always unsatisfied (agent always has something to do)
> - `AttackingPlayer` means the "Seek & Destroy" goal is never satisfied → the agent will keep attacking as long as the player is in range

### How Beliefs Are Evaluated

Beliefs are **lazy** — they are not updated every frame. Instead, they are evaluated **on demand** when the planner checks them or when actions check preconditions.

```javascript
// Example: AgentIsHealthy is evaluated in real-time
const belief = { condition: () => agent.health >= 50 };
belief.evaluate(); // returns true if health is 50+, false otherwise
```

### Belief Categories

1. **State beliefs**: `AgentIdle`, `AgentMoving`, `AgentHealthLow`, etc.
   - These read the agent's internal state directly

2. **Location beliefs**: `AgentAtDoorOne`, `AgentAtFoodShack`, etc.
   - These calculate distance: `sqrt((agent.x - loc.x)² + (agent.y - loc.y)²) < range`

3. **Sensor beliefs**: `PlayerInChaseRange`, `PlayerInAttackRange`
   - These delegate to the Sensor system

4. **Static beliefs**: `Nothing`, `AttackingPlayer`
   - Always return `false` — used as permanent goals

---

## 5. Actions System

Each action has:
- **Name** — human-readable label
- **Cost** — used by planner to find cheapest plan (default: 1)
- **Preconditions** — beliefs that must be `true` before this action can start
- **Effects** — beliefs that this action makes `true`
- **Strategy** — the behavior that executes the action

### All 11 Actions

| # | Action | Cost | Preconditions | Effects | Strategy |
|---|--------|------|---------------|---------|----------|
| 1 | Relax | 1 | — | Nothing | Idle (3 sec) |
| 2 | Wander Around | 1 | — | AgentMoving | Wander (radius 120px) |
| 3 | Move to Food Shack | 1 | — | AgentAtFoodShack | Move → (130, 130) |
| 4 | Eat | 1 | AgentAtFoodShack | AgentIsHealthy | Idle (3 sec) |
| 5 | Move to Door 1 | 1 | — | AgentAtDoorOne | Move → (400, 250) |
| 6 | Move to Door 2 | 1 | — | AgentAtDoorTwo | Move → (550, 400) |
| 7 | Door 1 → Rest Area | **2** | AgentAtDoorOne | AgentAtRestingPosition | Move → (650, 130) |
| 8 | Door 2 → Rest Area | 1 | AgentAtDoorTwo | AgentAtRestingPosition | Move → (650, 130) |
| 9 | Rest | 1 | AgentAtRestingPosition | AgentIsRested | Idle (3 sec) |
| 10 | Chase Player | 1 | PlayerInChaseRange | PlayerInAttackRange | Move → player position |
| 11 | Attack Player | 1 | PlayerInAttackRange | AttackingPlayer | Attack (1 sec) |

### Action Strategies (how actions physically execute)

#### IdleStrategy(duration)
- Agent stands still for `duration` seconds
- Uses a countdown timer
- `complete = true` when timer expires
- Used by: Relax, Eat, Rest

#### MoveStrategy(agent, destinationFn)
- Agent moves toward the destination position
- `complete = true` when within 8px of target
- `destinationFn` is a function so the target can be dynamic (e.g., player position)
- Used by: Move to Food Shack, Move to Door 1/2, Door→Rest, Chase Player

#### WanderStrategy(agent, radius)
- Picks a random point within `radius` pixels of current position
- Clamps to canvas bounds (40px margin)
- Agent moves toward random point
- `complete = true` when within 8px
- Used by: Wander Around

#### AttackStrategy(duration)
- Agent performs attack for `duration` seconds
- Triggers red glow visual on agent
- `complete = true` when timer expires
- Used by: Attack Player

### How Actions Execute

```
1. Action.start() → calls strategy.start()
2. Every frame: Action.update(deltaTime) → calls strategy.update(deltaTime)
3. When strategy.complete === true:
   a. Action evaluates all its effects
   b. Action reports as complete
4. Agent pops next action from plan, or marks plan as complete
```

---

## 6. Goals System

Goals represent **what the agent wants**. Each goal has:
- **Name** — human-readable label
- **Priority** — higher = more important (checked first)
- **Desired Effects** — set of beliefs that must be `true` for this goal to be satisfied

### All 5 Goals

| # | Goal | Priority | Desired Effect | When Active |
|---|------|----------|----------------|-------------|
| 1 | Chill Out | 1 (lowest) | Nothing = true | Always (Nothing is always false) |
| 2 | Wander | 1 (lowest) | AgentMoving = true | When agent is idle |
| 3 | Keep Health Up | 2 (medium) | AgentIsHealthy = true | When health drops below 50 |
| 4 | Keep Stamina Up | 2 (medium) | AgentIsRested = true | When stamina drops below 50 |
| 5 | Seek & Destroy | **3 (highest)** | AttackingPlayer = true | Always (AttackingPlayer is always false) |

### Goal Selection Logic

The planner processes goals in **descending priority order**:

```
1. Seek & Destroy (priority 3) — checked FIRST
   → BUT: requires PlayerInChaseRange to be true (precondition of Chase)
   → If player is NOT in range, planner can't build a plan → SKIP

2. Keep Health Up (priority 2) — checked if health < 50
   → Builds plan: Move to Food Shack → Eat

3. Keep Stamina Up (priority 2) — checked if stamina < 50
   → Builds plan: Move to Door 2 → Door 2 → Rest Area → Rest

4. Wander / Chill Out (priority 1) — fallback behaviors
   → Wander: agent walks to random point
   → Chill Out: agent stands still for 3 seconds
```

### Why Seek & Destroy Has Highest Priority

Even though "Seek & Destroy" is priority 3, the planner **cannot always build a plan** for it. The plan requires:

```
Goal: AttackingPlayer = true
  └─ Action: Attack Player
       Precondition: PlayerInAttackRange = true
       └─ Action: Chase Player  
            Precondition: PlayerInChaseRange = true
            └─ This is a SENSOR belief — only true if player is physically within 150px
```

So the goal is only achievable when the **player is within chase range**. When the player is far away, the planner falls through to lower-priority goals.

**This is the key emergent behavior**: The agent peacefully wanders, eats, and rests — but the MOMENT the player gets close, priority 3 kicks in and the agent drops everything to chase and attack!

---

## 7. The Planner (DFS Algorithm)

### Algorithm: Greedy DFS Backward Search

The planner works **backward** from the goal:

```
FUNCTION Plan(agent, goals, mostRecentGoal):
    1. Filter goals to only those with unsatisfied desired effects
    2. Sort by priority (descending), slightly down-rank mostRecentGoal
    
    3. FOR each goal (highest priority first):
        a. Create root Node with goal's desired effects as "required effects"
        b. Call FindPath(rootNode, allActions)
        c. If path found AND node has leaves:
            - Walk the tree, always picking cheapest leaf
            - Build an action stack (sequence of actions)
            - Return ActionPlan(goal, actionStack, totalCost)
    
    4. If no plan found for any goal, return null


FUNCTION FindPath(parentNode, availableActions):
    1. Sort actions by cost (ascending)
    
    2. FOR each action:
        a. Remove any required effects that already evaluate to TRUE
           (they're already satisfied, no action needed)
        
        b. If no required effects remain → plan is complete, return TRUE
        
        c. Check if this action's EFFECTS satisfy any required effects
        
        d. If yes:
            - New required = (old required - action's effects) + action's preconditions
            - Remove this action from available set (can't use same action twice)
            - Create child Node(parent, action, newRequired, parent.cost + action.cost)
            - RECURSE: FindPath(childNode, newAvailableActions)
            - If recursion succeeded, add childNode as leaf of parent
            - If all required effects now satisfied, return TRUE
    
    3. Return TRUE if parent has any leaves, FALSE otherwise
```

### Example: Planning "Keep Health Up"

```
Goal: AgentIsHealthy = true (currently false because health < 50)

Step 1: Need to satisfy AgentIsHealthy
        → Found action "Eat" with effect AgentIsHealthy
        → Eat has precondition: AgentAtFoodShack
        → New required: {AgentAtFoodShack}

Step 2: Need to satisfy AgentAtFoodShack  
        → Found action "Move to Food Shack" with effect AgentAtFoodShack
        → No preconditions
        → New required: {} (empty — all satisfied!)

Result: Plan = [Move to Food Shack, Eat]  (total cost = 2)
```

### Example: Planning "Keep Stamina Up"

```
Goal: AgentIsRested = true (currently false because stamina < 50)

Step 1: Need to satisfy AgentIsRested
        → Found action "Rest" with effect AgentIsRested
        → Rest has precondition: AgentAtRestingPosition
        → New required: {AgentAtRestingPosition}

Step 2: Need to satisfy AgentAtRestingPosition
        → Option A: "Door 1 → Rest Area" (cost 2, precondition: AgentAtDoorOne)
        → Option B: "Door 2 → Rest Area" (cost 1, precondition: AgentAtDoorTwo)
        → Planner picks cheapest → Option B

Step 3: Need to satisfy AgentAtDoorTwo
        → Found action "Move to Door 2" (cost 1, no preconditions)
        → New required: {} (done!)

Result: Plan = [Move to Door 2, Door 2 → Rest Area, Rest]  (total cost = 3)

Alternative (Door 1 route): [Move to Door 1, Door 1 → Rest Area, Rest] (total cost = 4)
→ Planner rejects this because it's more expensive!
```

### Example: Planning "Seek & Destroy"

```
Goal: AttackingPlayer = true

Step 1: Need to satisfy AttackingPlayer
        → Found action "Attack Player" (effect: AttackingPlayer)
        → Precondition: PlayerInAttackRange
        → New required: {PlayerInAttackRange}

Step 2: Need to satisfy PlayerInAttackRange
        → Found action "Chase Player" (effect: PlayerInAttackRange)
        → Precondition: PlayerInChaseRange (SENSOR BELIEF)
        → New required: {PlayerInChaseRange}

Step 3: Need to satisfy PlayerInChaseRange
        → This is a sensor belief — no action can create it
        → It either IS true (player is within 150px) or ISN'T
        
        IF PlayerInChaseRange = true:
            → Required empty, plan succeeds
            → Plan = [Chase Player, Attack Player] (cost 2)
        
        IF PlayerInChaseRange = false:
            → No action can satisfy this → plan FAILS
            → Planner moves to next lower-priority goal
```

---

## 8. Sensors

Sensors are **proximity detectors** that trigger reactive replanning.

### Chase Sensor
- **Range**: 150 pixels
- **Purpose**: Detect when player is close enough to start chasing
- **Feeds belief**: `PlayerInChaseRange`
- **Visual**: Large dashed circle (blue when idle, red when detecting)

### Attack Sensor  
- **Range**: 40 pixels
- **Purpose**: Detect when player is close enough to attack
- **Feeds belief**: `PlayerInAttackRange`
- **Visual**: Smaller dashed circle (yellow when idle, red when detecting)

### Sensor Update Logic

Every frame, sensors check distance:

```javascript
isInRange = sqrt((agent.x - player.x)² + (agent.y - player.y)²) < detectionRadius
```

### Reactive Replanning (The Key Feature)

When the chase sensor's state **changes** (player enters or leaves range):

```
1. Sensor fires OnTargetChanged event
2. Agent receives event
3. Agent sets currentAction = null
4. Agent sets currentGoal = null
5. On next frame, agent calls CalculatePlan()
6. Since "Seek & Destroy" is highest priority AND player is now in range:
   → Planner builds [Chase Player, Attack Player] plan
7. Agent immediately starts chasing!
```

**This means**: If the agent is walking to eat food and the player gets close, the agent **INSTANTLY abandons** its food plan and switches to attacking. Once the player runs away (out of range), the agent goes back to its previous needs.

---

## 9. Stats & Decay System

### Stat Decay Timer

Every **2 seconds**, the stats update:

```javascript
// If near Rest Area (within 30px): stamina +20, else: stamina -10
// If near Food Shack (within 30px): health +20, else: health -5
// Both clamped to [0, 100]
```

### Stat Decay Timeline

Starting from full health (100) and stamina (100):

| Time (sec) | Health | Stamina | Trigger |
|-----------|--------|---------|---------|
| 0 | 100 | 100 | — |
| 2 | 95 | 90 | First decay |
| 4 | 90 | 80 | — |
| 6 | 85 | 70 | — |
| 8 | 80 | 60 | — |
| 10 | 75 | 50 | — |
| 12 | 70 | 40 | **Stamina < 50 → "Keep Stamina Up" activates** |
| 14 | 65 | 30 | — |
| 16 | 60 | 20 | — |
| 18 | 55 | 10 | — |
| 20 | 50 | 0 | — |
| 22 | 45 | 0 | **Health < 50 → "Keep Health Up" activates** |

> **Note**: Stamina decays faster (-10 vs -5), so the agent will typically need to rest BEFORE it needs to eat.

### What Triggers Goal Activation

| Stat Value | Belief | Goal Affected |
|-----------|--------|---------------|
| Health < 50 | `AgentIsHealthy` = false | "Keep Health Up" (priority 2) becomes plannable |
| Health ≥ 50 | `AgentIsHealthy` = true | Goal already satisfied, planner skips |
| Stamina < 50 | `AgentIsRested` = false | "Keep Stamina Up" (priority 2) becomes plannable |
| Stamina ≥ 50 | `AgentIsRested` = true | Goal already satisfied, planner skips |

### Restoration

When near a restorative location, stats **increase** instead:

- **At Food Shack**: Health +20 per tick (reaches 100 quickly)
- **At Rest Area**: Stamina +20 per tick (reaches 100 quickly)

---

## 10. The Game Loop

### Per-Frame Update (60 FPS target)

```
EVERY FRAME (deltaTime ≈ 0.016 seconds):

  1. TICK TIMERS
     └─ statsTimer.tick(dt)  → triggers stat decay every 2 seconds

  2. UPDATE SENSORS
     └─ chaseSensor.update()  → check if player in range
     └─ attackSensor.update() → check if player in attack range
     └─ If range status CHANGED → fire event → clear current plan

  3. HANDLE MOVEMENT
     └─ If agent has moveTarget:
        └─ Calculate direction vector
        └─ Move agent position by (speed × dt) pixels
        └─ If within 5px of target → stop moving

  4. GOAP PLANNING
     └─ IF currentAction is null (no action executing):
        │
        ├─ CalculatePlan():
        │   ├─ Get goals to check (if has current goal, only check higher priority)
        │   └─ Run planner.plan(agent, goals, lastGoal)
        │
        └─ IF plan found:
            ├─ Set currentGoal = plan.goal
            ├─ Pop first action from plan
            ├─ Check preconditions
            │   ├─ All met → action.start()
            │   └─ Not met → clear action, clear goal, try next frame
            └─ Log: "Goal: X", "Action: Y"

  5. EXECUTE CURRENT ACTION
     └─ IF currentAction exists:
        ├─ action.update(dt) → runs strategy logic
        │
        └─ IF action.complete:
            ├─ action.stop()
            ├─ currentAction = null
            │
            ├─ IF more actions in plan:
            │   └─ (next frame will pop the next action)
            │
            └─ IF plan empty:
                ├─ Log: "Plan complete"
                ├─ lastGoal = currentGoal
                └─ currentGoal = null → will replan next frame

  6. RENDER (separate from logic)
     └─ Clear canvas
     └─ Draw: ground → paths → trees → buildings → sensors → player → agent → labels
     └─ Update debug panel (every 3rd frame to optimize)
```

---

## 11. Complete Behavior Scenarios

### Scenario A: Normal Lifecycle (No Player Nearby)

```
t=0s    Agent spawns at (400, 350). Health=100, Stamina=100.
        All survival goals satisfied → falls to priority 1 goals.
        Plan: "Wander" → [Wander Around]
        Agent walks to random point nearby.

t=3s    Wander complete. Agent replans.
        Still healthy → Plan: "Chill Out" → [Relax]
        Agent stands still for 3 seconds.

t=6s    Relax complete. Agent replans.
        Plan: "Wander" → [Wander Around]
        Agent walks to another random point.

  ...   (alternates between Wander and Chill Out)

t=12s   Stats timer fires. Stamina drops to ~40 (below 50).
        AgentIsRested = false → "Keep Stamina Up" (priority 2) activates!
        Plan: [Move to Door 2, Door 2 → Rest Area, Rest]

t=15s   Agent arrives at Door 2 (550, 400).
        AgentAtDoorTwo = true → precondition met for "Door 2 → Rest Area"
        Agent moves toward Rest Area (650, 130).

t=20s   Agent arrives at Rest Area (650, 130).
        AgentAtRestingPosition = true → precondition met for "Rest"
        Agent rests (idle 3 seconds). Stamina restores +20 per tick.

t=23s   Rest complete. Stamina back to ~90.
        AgentIsRested = true → goal satisfied.
        Replans: Health may now be low → "Keep Health Up"
        Plan: [Move to Food Shack, Eat]

t=30s   Agent arrives at Food Shack (130, 130).
        Eats for 3 seconds. Health restores to 100.

t=33s   All stats healthy. Back to Wander/Chill routine.
```

### Scenario B: Player Enters Chase Range

```
t=0s    Agent is wandering peacefully.
        Player is at (650, 450) — far away, out of range.

t=5s    User clicks canvas at (300, 300).
        Player starts moving toward (300, 300).

t=8s    Player reaches (380, 350) — within 150px of agent at (400, 350)!
        Chase sensor fires OnTargetChanged!
        
        Agent IMMEDIATELY:
        1. Drops current "Wander" action
        2. Clears current goal
        3. Replans with all goals
        
        "Seek & Destroy" (priority 3) is now plannable!
        Plan: [Chase Player, Attack Player]

t=8.1s  Agent starts chasing player.
        MoveStrategy targets player's position.
        Dashed line shows path to player.
        Sensor circles turn RED.

t=10s   Agent reaches within 40px of player.
        PlayerInAttackRange = true.
        Chase action completes → Attack action starts.
        Agent glows red. Attack timer: 1 second.

t=11s   Attack complete. AttackingPlayer effect evaluated.
        But AttackingPlayer is ALWAYS false → goal still unsatisfied!
        Agent replans → [Chase Player, Attack Player] again!
        
        KEEPS ATTACKING as long as player stays in range!

t=15s   User clicks canvas far away (100, 500).
        Player starts moving away.

t=18s   Player exits 150px range.
        Chase sensor: inRange changes from true → false.
        OnTargetChanged fires!
        
        Agent drops attack plan.
        PlayerInChaseRange = false → "Seek & Destroy" no longer plannable.
        
        Falls back to lower priority goals.
        If stamina is low → Rest plan
        If health is low → Eat plan
        Otherwise → Wander/Chill
```

### Scenario C: Competing Goals (Health AND Stamina Low)

```
t=0s    Health = 25 (< 30, critically low)
        Stamina = 8 (< 10, critically low)
        
        Both "Keep Health Up" and "Keep Stamina Up" are priority 2.
        The planner checks both:
        
        If most recent goal was "Keep Health Up":
            → Planner slightly deprioritizes it (priority - 0.01)
            → Picks "Keep Stamina Up" first
            → Plan: [Move to Door 2, Door 2 → Rest Area, Rest]
        
        After resting, stamina is restored.
        Now only health is low → "Keep Health Up"
        → Plan: [Move to Food Shack, Eat]
```

### Scenario D: Chase Interrupts Survival

```
t=0s    Agent's health is at 35, heading to Food Shack.
        Currently executing "Move to Food Shack" action.

t=3s    Player walks into chase range!
        
        "Seek & Destroy" (priority 3) > "Keep Health Up" (priority 2)
        
        Agent ABANDONS food plan!
        New plan: [Chase Player, Attack Player]
        
        Health continues to decay while chasing... dangerous!

t=8s    Player runs away. Agent stops chasing.
        Health now at 20 (critical!).
        
        "Keep Health Up" reactivates.
        Plan: [Move to Food Shack, Eat]
        Agent rushes to Food Shack.
```

---

## 12. Player Interaction

### How the User Interacts

The **red Player entity** is user-controlled:

- **Click anywhere** on the canvas to set the player's move target
- Player moves at **100 px/sec** (faster than agent's 80 px/sec)
- Player can outrun the agent!

### Interaction Experiments Users Can Try

1. **Get close to the agent** → Watch it switch from wandering to chasing
2. **Run away** → Watch it switch back to survival goals
3. **Stay near the agent** → Watch it repeatedly attack
4. **Stand near Rest Area** → The agent might have to chase you there
5. **Kite the agent** → Lead it around and watch stats decay
6. **Stay far away** → Watch the full survival cycle unfold

---

## 13. Debug Panel

The right-side panel shows real-time data:

### 📊 Agent Stats
- Health bar: green (>50), yellow (25-50), red (<25)
- Stamina bar: blue, filled proportionally

### 🎯 Current Plan
- **Goal**: Name of active goal (e.g., "Keep Stamina Up")
- **Action**: Currently executing action (e.g., "Move to Door 2")
- **Plan Stack**: Remaining actions in queue

### 📡 Sensors
- Chase Range: "DETECTED" (red) or "clear" (gray)
- Attack Range: "IN RANGE" (red) or "clear" (gray)

### 🧠 Beliefs
- All 13 beliefs listed with current true/false values
- Green = true, Gray = false
- Updates in real-time as agent moves and world changes

### 📝 Activity Log
- Scrollable log of agent decisions
- Shows: plans created, actions started/completed, sensor triggers
- Most recent entries at top

---

## 14. File Architecture

```
web-Goap/
├── app/
│   ├── lib/
│   │   └── goap/
│   │       ├── engine.js         ← GOAP core (Belief, Action, Goal, Planner, Strategies, Sensor, Timer)
│   │       └── agent.js          ← GoapAgent + PlayerEntity + World locations
│   │
│   ├── components/
│   │   └── simulation/
│   │       ├── SimulationCanvas.js         ← Canvas renderer + game loop
│   │       ├── SimulationCanvas.module.css  ← Canvas container styles
│   │       ├── DebugPanel.js               ← Live debug panel
│   │       └── DebugPanel.module.css       ← Debug panel styles
│   │
│   └── simulation/
│       ├── page.js                ← Next.js page at /simulation
│       └── page.module.css        ← Page layout styles
```

### Code Size Summary

| File | Lines | Purpose |
|------|-------|---------|
| `engine.js` | ~350 | All GOAP data structures + planner algorithm |
| `agent.js` | ~280 | Agent wiring (beliefs, actions, goals, sensors, stats) |
| `SimulationCanvas.js` | ~420 | 2D rendering + game loop |
| `DebugPanel.js` | ~130 | React component for live debug info |
| **Total** | ~1180 | Complete GOAP simulation |

---

## 15. Unity → Web Mapping

### Direct Translations

| Unity (C#) | Web (JavaScript) | Notes |
|------------|-------------------|-------|
| `AgentBelief` | `AgentBelief` | Same builder pattern, same Evaluate() |
| `AgentAction` | `AgentAction` | Same preconditions, effects, cost, strategy |
| `AgentGoal` | `AgentGoal` | Same priority, desired effects |
| `GoapPlanner.FindPath()` | `GoapPlanner._findPath()` | Identical DFS backward search |
| `Node` | `PlannerNode` | Same tree structure |
| `ActionPlan` | `ActionPlan` | Same goal + action stack + cost |
| `BeliefFactory` | `BeliefFactory` | Same addBelief, addLocationBelief, addSensorBelief |
| `CountdownTimer` | `CountdownTimer` | Same start/stop/tick pattern |
| `Sensor` | `Sensor` | SphereCollider → distance check |

### Key Adaptations for 2D Web

| Unity 3D | Web 2D | How Adapted |
|----------|--------|------------|
| `Vector3` (x, y, z) | `{x, y}` | Dropped z-axis |
| `NavMeshAgent` | Linear interpolation | No pathfinding mesh needed in open 2D world |
| `NavMesh.SamplePosition()` | Canvas bounds clamping | Wander targets clamped to 40-760, 40-560 |
| `SphereCollider` trigger | `Math.hypot(dx, dy) < range` | Distance check each frame |
| `Time.deltaTime` | `requestAnimationFrame` delta | Same concept, browser API |
| `MonoBehaviour.Update()` | Game loop callback | Single `requestAnimationFrame` loop |
| `Transform.position` | `agent.position = {x, y}` | Simple object property |
| `Animator` | Canvas drawing + sine bob | Visual approximation |
| `Debug.Log()` | `agent.logs[]` | Displayed in debug panel |
| `[SerializeField]` | `WORLD_LOCATIONS` const | Hardcoded positions |
| `HashSet<T>` | `Set` (ES6) | Native JavaScript |
| `Dictionary<K,V>` | Plain object `{}` | JavaScript idiom |
| `Action<T>` delegate | Array of callbacks `[]` | Event pattern |
| `Stack<T>` | Array with `.shift()` | Pop from front |

### Behaviors Preserved 1:1

✅ Same 13 beliefs  
✅ Same 11 actions with identical preconditions/effects/costs  
✅ Same 5 goals with identical priorities  
✅ Same DFS backward planner algorithm  
✅ Same stats decay rates (health -5, stamina -10, restore +20)  
✅ Same sensor-triggered replanning  
✅ Same cost optimization (Door 2 route preferred over Door 1)  
✅ Same "most recent goal" de-prioritization  

---

## Summary

The 2D web simulation is a **pixel-perfect logical port** of the Unity 3D GOAP system. While the rendering changes from 3D models + NavMesh to 2D canvas + linear movement, the **AI decision-making is identical**:

- The agent evaluates the same beliefs
- The planner runs the same DFS backward search
- Actions have the same preconditions, effects, and costs
- Sensor-driven replanning works the same way
- Stats decay at the same rates

The result is an **interactive educational tool** where users can directly observe and experiment with GOAP behavior in real-time.
