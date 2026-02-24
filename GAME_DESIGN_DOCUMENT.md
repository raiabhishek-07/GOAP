# 🧠 MINDARENA — Complete Game Design Document
## "Master Critical Thinking. Outplan the AI. Become the Strategist."

---

## 📋 TABLE OF CONTENTS
1. [Core Vision](#1-core-vision)
2. [Game Concept](#2-game-concept)
3. [Level Architecture](#3-level-architecture)
4. [Task System](#4-task-system)
5. [Scoring Engine](#5-scoring-engine)
6. [GOAP AI Opponents](#6-goap-ai-opponents)
7. [Multiplayer System](#7-multiplayer-system)
8. [UI/UX Design](#8-uiux-design)
9. [Technical Architecture](#9-technical-architecture)
10. [Implementation Roadmap](#10-implementation-roadmap)

---

## 1. CORE VISION

### What is MindArena?
MindArena is a **strategic planning battle game** where you compete against intelligent 
GOAP AI agents. Unlike a typical shooter, **winning requires thinking**.

### The Core Question the Game Asks:
> "Given 5 tasks and 3 enemies — **what do you do first, second, third?**"
> The AI knows the optimal path. Can you beat it?

### What Skills Does the Player Develop?
| Skill | How the Game Trains It |
|---|---|
| **Prioritization** | Tasks have different urgency levels. Wrong order = wasted time = AI wins |
| **Planning Under Pressure** | Enemies attack while you plan. You must think AND fight |
| **Resource Management** | Stamina, Health, Time — spend wisely or lose |
| **Adaptive Thinking** | AI adapts its strategy. You must counter-adapt |
| **Strategic Positioning** | Map awareness, zone control, shortcut discovery |
| **Decision Making** | Every second counts — hesitation is death |

---

## 2. GAME CONCEPT

### The Arena
- **Top-down 2D arena** (2400×1600 pixels, camera follows player)
- **Terrain**: Military outdoor theme — mountains, trees, terrain variation
- **Fog of War**: Initially dark — explore to reveal map
- **Zones**: Safe zones, combat zones, task zones, extraction zone

### Match Flow
```
DEPLOY → PLAN PHASE (5s) → BATTLE PHASE → SCORE → RANK UP
```

1. **Deploy**: Player spawns. Brief overview of map and tasks
2. **Plan Phase** (5 seconds): See all task locations on map. No movement. Think.
3. **Battle Phase**: Execute! Complete tasks, fight enemies, reach extraction
4. **Score**: Detailed breakdown — priority score, time, combat, strategy
5. **Rank Up**: Unlock next stage or retry for better rank

### Win Condition
Complete all **Mission Objectives** before the timer runs out OR before the AI completes them first.

### Lose Conditions
- Health reaches 0 (Eliminated)
- Timer runs out (Mission Failed)  
- AI completes all objectives before you (Outplanned)

---

## 3. LEVEL ARCHITECTURE

### 3 Levels × 3 Stages = 9 Total Missions

```
LEVEL 1: FOUNDATION          "Learn to Plan"
├── Stage 1.1: First Steps    (1 agent, 3 tasks, tutorial)
├── Stage 1.2: Priority Call   (1 agent, 4 tasks, task ordering matters)
└── Stage 1.3: Time Crunch     (2 agents, 4 tasks, tight timer)

LEVEL 2: STRATEGY             "Learn to Adapt"
├── Stage 2.1: Multi-Front     (2 agents, 5 tasks, zones introduced)
├── Stage 2.2: Resource War    (3 agents, 5 tasks, resource scarcity)
└── Stage 2.3: Counter-Intel   (3 agents, 6 tasks, AI adapts to you)

LEVEL 3: MASTERY              "Become the Strategist"
├── Stage 3.1: Full Arena      (4 agents, 7 tasks, fog of war)
├── Stage 3.2: Elite Ops       (5 agents, 8 tasks, elite AI difficulty)
└── Stage 3.3: Final Mind      (6 agents, 10 tasks, everything combined)
```

### Detailed Stage Breakdown

#### LEVEL 1: FOUNDATION — "Learn to Plan"

**Stage 1.1 — First Steps** (Tutorial)
- **Objective**: Complete 3 tasks in any order
- **Enemies**: 1 patrol agent (doesn't attack)
- **Tasks**: Activate 3 terminals (A → B → C)
- **Learning**: Basic movement, task interaction, understanding the GOAP agent
- **Timer**: 120 seconds (generous)
- **Special**: Tutorial arrows show you where to go. Agent's plan is visible.
- **Optimal Play**: The player who visits terminals in the closest-first order wins

**Stage 1.2 — Priority Call**
- **Objective**: Complete 4 tasks. BUT tasks have priority levels (1-4)
- **Enemies**: 1 active agent (chases + completes tasks)
- **Tasks**: 4 terminals with different point values
  - Terminal Alpha (300 pts, easy to reach)
  - Terminal Beta (500 pts, guarded area)
  - Terminal Gamma (200 pts, far away)
  - Terminal Delta (800 pts, requires key item first)
- **Learning**: Not all tasks are equal. Prioritize high-value targets.
- **Timer**: 90 seconds
- **Twist**: The AI ALWAYS goes for optimal order. You must match or beat its efficiency.

**Stage 1.3 — Time Crunch**
- **Objective**: Complete 4 tasks under extreme time pressure
- **Enemies**: 2 agents (one chaser, one task-completer)
- **Tasks**: Same as 1.2 but adds a locked door requiring a key
- **Learning**: Time management + dealing with multiple threats
- **Timer**: 60 seconds
- **Special**: One agent focuses on attacking you, the other races to complete tasks

#### LEVEL 2: STRATEGY — "Learn to Adapt"

**Stage 2.1 — Multi-Front**
- **Objective**: Control 3 zones while completing 5 objectives
- **Enemies**: 2 agents (both intelligent, both do tasks AND fight)
- **Tasks**: 5 objectives spread across 3 map zones
  - Zone A (North): 2 terminals
  - Zone B (Center): 1 terminal + supply cache
  - Zone C (South): 2 terminals
- **Learning**: Multi-zone awareness. Can't be everywhere at once.
- **Timer**: 120 seconds
- **New Mechanic**: Zones show who controls them (player/AI). Control gives score bonus.

**Stage 2.2 — Resource War**
- **Objective**: Complete 5 tasks, but resources (health packs, stamina) are limited
- **Enemies**: 3 agents compete for the same resources
- **Tasks**: 5 objectives + 3 resource caches (shared between player and AI)
- **Learning**: Resource scarcity forces hard choices. Heal now or push objective?
- **Timer**: 100 seconds
- **New Mechanic**: Resource stations deplete. First to use them gets the benefit.

**Stage 2.3 — Counter-Intel**
- **Objective**: Complete 6 tasks while the AI actively counter-plans
- **Enemies**: 3 agents with improved AI (wider sensor range, faster speed)
- **Tasks**: 6 objectives, some with dependencies (B requires A first)
- **Learning**: The AI watches YOUR behavior and adjusts. Go left too often? AI repositions.
- **Timer**: 120 seconds
- **New Mechanic**: AI adapts after each attempt. Second playthrough enemies are smarter.

#### LEVEL 3: MASTERY — "Become the Strategist"

**Stage 3.1 — Full Arena**
- **Objective**: Complete 7 tasks in a fully revealed arena with fog of war
- **Enemies**: 4 agents (mixed types: 2 chasers, 1 task-racer, 1 defender)
- **Tasks**: 7 objectives including one multi-step chain (A→B→C sequence)
- **Learning**: Information is power. Fog of war means you must scout.
- **Timer**: 150 seconds
- **New Mechanic**: Fog of war — areas not recently visited go dark

**Stage 3.2 — Elite Ops**
- **Objective**: Complete 8 tasks against elite AI
- **Enemies**: 5 agents, each with unique behavior profiles:
  - **Guardian**: Defends key objectives
  - **Hunter**: Specifically tracks the player
  - **Racer**: Rushes to complete tasks
  - **Ambusher**: Sets up at chokepoints
  - **Strategist**: Coordinates with other agents
- **Tasks**: 8 with complex dependencies and hidden bonus objectives
- **Timer**: 120 seconds
- **Special**: AI agents can communicate with each other (coordinated behavior)

**Stage 3.3 — Final Mind** (Boss Level)
- **Objective**: Complete ALL 10 objectives to unlock extraction. Defeat the Master Agent.
- **Enemies**: 6 agents + 1 "Master Mind" boss (has access to all GOAP strategies)
- **Tasks**: 10 objectives across the entire map, with traps and decoys
- **Learning**: EVERYTHING combined. True mastery test.
- **Timer**: 180 seconds
- **Special**: Master Mind can lay traps, block doors, and steal completed objectives
- **Victory condition**: Complete all 10 tasks AND reach the extraction portal

---

## 4. TASK SYSTEM

### Task Types

| Type | Icon | Description | Interaction |
|---|---|---|---|
| **Terminal** | 🖥️ | Hack a terminal | Stand near for 3 seconds (channeled) |
| **Key Collection** | 🔑 | Pick up a key item | Walk over to collect |
| **Door Unlock** | 🚪 | Open a locked door | Requires specific key |
| **Resource Cache** | 📦 | Supply drop | Walk over, limited uses |
| **Zone Capture** | 🏴 | Control a territory | Stand in zone for 5s uninterrupted |
| **Sequence Chain** | 🔗 | Multi-step task | Must do A→B→C in exact order |
| **Intel Gather** | 📡 | Collect intel orbs | Scattered, collect all in area |
| **Defense Hold** | 🛡️ | Defend a position | Stay alive in zone for 10s |
| **Extraction** | ✈️ | Final objective | Reach portal after all tasks done |

### Task Priority System
Each task has:
- **Priority Score** (100-1000 points): How valuable is this task?
- **Urgency Timer**: Some tasks expire if not done quickly
- **Dependency Chain**: Some require other tasks first
- **Difficulty**: Proximity to enemies, channeling time
- **Optimal Order**: The game calculates the mathematically optimal sequence

### Priority Score Calculation
```
TaskPriorityScore = BasePoints × TimeMultiplier × OrderBonus

TimeMultiplier = 1.5 if done in first 30s, 1.0 if 30-60s, 0.7 if 60-90s, 0.5 if 90s+
OrderBonus = 2.0 if done in optimal order, 1.0 otherwise
```

This means: **Doing the RIGHT task FIRST gives 3× more points than doing it last.**

---

## 5. SCORING ENGINE

### Score Breakdown (after each match)

| Category | Weight | Description |
|---|---|---|
| **Task Completion** | 30% | How many objectives completed (of total) |
| **Priority Score** | 25% | Did you do tasks in the optimal order? |
| **Time Efficiency** | 15% | How quickly you completed objectives |
| **Combat Score** | 10% | Enemies defeated, damage dealt |
| **Resource Management** | 10% | Health/stamina remaining at end |
| **Strategy Score** | 10% | Zone control time, shortcuts used, intel gathered |

### Rank System (after each stage)
| Rank | Score % | Title | Badge |
|---|---|---|---|
| **S** | 90-100% | Master Strategist | 🏆 Gold Crown |
| **A** | 75-89% | Elite Planner | ⭐ Silver Star |
| **B** | 50-74% | Competent Tactician | 🎖️ Bronze Medal |
| **C** | 25-49% | Developing Thinker | 📋 Clipboard |
| **D** | 0-24% | Rookie | 🔰 Beginner |

### Cognitive Analysis (Post-Match Screen)
After each match, the player sees a radar chart showing:
1. **Planning** — Did you pause to think or rush in?
2. **Prioritization** — Did you do high-value tasks first?
3. **Adaptability** — Did you change strategy when needed?
4. **Efficiency** — How much wasted movement?
5. **Combat** — Fighting skill when necessary
6. **Awareness** — Map knowledge, zone control

---

## 6. GOAP AI OPPONENTS

### Agent Types (used across levels)

| Agent Type | Speed | Chase Range | Attack | Task Ability | Personality |
|---|---|---|---|---|---|
| **Patrol Guard** | Slow | Short | Low | None | Wanders set path |
| **Shadow Stalker** | Medium | Long | Medium | None | Hunts the player |
| **Task Racer** | Fast | None | None | High | Races to complete objectives |
| **Defender** | Slow | Medium | High | Low | Guards specific objective |
| **Ambusher** | Medium | Medium | High | None | Waits at chokepoints |
| **Strategist** | Medium | Long | Medium | High | Plans and coordinates |
| **Master Mind** | Variable | Full Map | High | Maximum | Uses all strategies |

### How AI Uses GOAP (already built)
The GOAP engine already supports:
- **Beliefs**: AgentHealthLow, PlayerInChaseRange, AgentAtLocation, etc.
- **Goals**: Keep Health Up, Wander, Seek & Destroy (with dynamic priorities)
- **Actions**: Move to location, Eat, Rest, Chase Player, Attack Player
- **Planning**: Automatic plan generation based on current beliefs and goals

### New AI Behaviors to Add
1. **Task Completion Goal**: AI goes to task locations and channels them
2. **Resource Racing Goal**: AI prioritizes resource caches when low
3. **Coordinated Goal**: AI shares information with other agents
4. **Adaptive Goal**: AI changes priority based on player behavior
5. **Objective Defense Goal**: AI guards high-value objectives

---

## 7. MULTIPLAYER SYSTEM

### Two Game Modes

#### Mode 1: Solo vs AI
- Player competes against GOAP agents
- Classic campaign mode (9 stages)
- All levels and progression apply

#### Mode 2: Room-Based Multiplayer
- Create a room → share code → friend joins
- Both players compete against EACH OTHER and AI agents
- Same map, same tasks — who completes more, faster?
- Real-time via WebSocket (Socket.IO or WebRTC)

### Multiplayer Room Flow
```
CREATE ROOM → Get Room Code (e.g., "MIND-7492")
    ↓
SHARE CODE → Friend enters code
    ↓
LOBBY → Both players see each other, select stage
    ↓
COUNTDOWN → 3... 2... 1... DEPLOY!
    ↓
BATTLE → Both play simultaneously on same map with same AI
    ↓
RESULTS → Compare scores, ranks, cognitive analysis
```

### Multiplayer Scoring
- Same scoring system as solo
- **Bonus**: Additional "vs Human" score comparisons
- Both players' scores shown side-by-side
- "Challenge Rematch" option after completion

---

## 8. UI/UX DESIGN

### Visual Style: Military-Tactical (inspired by Mini Militia + PUBG)

#### Color Palette
| Element | Color | Usage |
|---|---|---|
| Background | `#1a2a1a` | Dark olive |
| Ground | `#4a6a3a` | Military green |
| Sky | `#87a5c0` | Soft blue |
| UI Panels | `#222222` @ 85% | Dark translucent |
| Accent Gold | `#f59e0b` | Titles, borders, ranks |
| Health | `#e74c8b` | HP bar |
| Stamina | `#42a5f5` | Stamina bar |
| Power/Tasks | `#26c6da` | Task progress |
| Danger | `#ff4444` | Enemies, damage |
| Success | `#22c55e` | Completed tasks |

#### HUD Layout (In-Game)
```
┌──────────────────────────────────────────────────────────────────┐
│ [AVATAR+BARS]  [TASK LIST]               [TIMER] [KILLS] [SCORE]│
│                                                                  │
│                                                                  │
│                        GAMEPLAY AREA                             │
│                        (Camera follows player)                   │
│                                                                  │
│                                                                  │
│ [MINIMAP]           [OBJECTIVE HINT]     [ATTACK][DASH][INTERACT]│
└──────────────────────────────────────────────────────────────────┘
```

#### Key UI Screens
1. **Main Menu**: Title + SOLO/MULTIPLAYER mode buttons + SETTINGS
2. **Level Select**: 3 levels as large tabs, 3 stages per level as cards
3. **Pre-Mission Briefing**: Map overview, task list, enemy count
4. **In-Game HUD**: Bars, timer, task tracker, minimap, action buttons
5. **Plan Phase Overlay**: Full-map view with task markers (5s countdown)
6. **Pause Menu**: Resume, Restart, Settings, Exit
7. **Mission Complete**: Score breakdown, rank, cognitive analysis radar
8. **Mission Failed**: Stats + retry/exit
9. **Lobby (Multiplayer)**: Room code, player list, stage select

---

## 9. TECHNICAL ARCHITECTURE

### Stack
- **Engine**: Phaser 3 (already integrated)
- **Framework**: Next.js (React for launcher only)
- **AI**: GOAP Engine (already built — `engine.js` + `agent.js`)
- **Multiplayer**: Socket.IO (future) or WebRTC
- **Assets**: Procedural textures via `TextureFactory.js`

### File Structure (Proposed)
```
app/
├── lib/
│   ├── goap/
│   │   ├── engine.js          ← Core GOAP (beliefs, actions, goals, planner)
│   │   └── agent.js           ← GoapAgent + PlayerEntity
│   └── game/
│       ├── TextureFactory.js  ← Procedural asset generation
│       ├── UIFactory.js       ← Reusable UI components
│       ├── WorldGenerator.js  ← Map terrain generation
│       ├── TaskSystem.js      ← NEW: Task types, priority calculator, chains
│       ├── ScoringEngine.js   ← NEW: Multi-category scoring + rank calculation
│       ├── LevelConfig.js     ← REWRITE: Full 9-stage configuration
│       ├── AgentFactory.js    ← NEW: Creates different agent types per level
│       └── MatchManager.js    ← NEW: Match flow (deploy→plan→battle→score)
├── components/game/
│   ├── GameLauncher.js        ← React→Phaser bridge
│   ├── entities/
│   │   ├── BaseSurvivor.js    ← Base character class
│   │   ├── GamePlayer.js      ← Player controller
│   │   ├── GameAgent.js       ← AI agent entity wrapper
│   │   ├── ShadowStalker.js   ← Enemy type
│   │   ├── TaskRacer.js       ← NEW: AI that races to complete tasks
│   │   ├── Defender.js        ← NEW: AI that guards objectives
│   │   ├── MindOrb.js         ← Collectible orb
│   │   └── TaskTerminal.js    ← NEW: Interactive task object
│   └── scenes/
│       ├── BootScene.js       ← Fast boot
│       ├── PreloadScene.js    ← Loading screen
│       ├── MainMenuScene.js   ← Mode selection
│       ├── LevelSelectScene.js← Level/stage picker
│       ├── BriefingScene.js   ← NEW: Pre-mission briefing
│       ├── GameScene.js       ← Core gameplay
│       ├── GameHUD.js         ← In-game HUD overlay
│       ├── PlanPhaseScene.js  ← NEW: 5-second planning overlay
│       ├── PauseScene.js      ← Pause menu
│       ├── ScoreScene.js      ← NEW: Detailed score breakdown
│       ├── VictoryScene.js    ← Mission complete
│       └── GameOverScene.js   ← Mission failed
```

---

## 10. IMPLEMENTATION ROADMAP

### Phase 1: Core Systems (Current Sprint)
- [x] Phaser scene architecture
- [x] Player movement, combat, dash, stamina
- [x] GOAP AI agents (chase, eat, rest, attack)
- [x] Procedural texture generation
- [x] Basic HUD and menu
- [ ] **Redesign UI for professional quality**
- [ ] **Implement Task System (TaskSystem.js)**
- [ ] **Implement Scoring Engine (ScoringEngine.js)**
- [ ] **Rewrite LevelConfig for 9 stages**

### Phase 2: Gameplay Loop
- [ ] Match Manager (deploy → plan → battle → score)
- [ ] Pre-mission briefing screen
- [ ] Plan phase overlay (5s map view)
- [ ] Task interaction system (channeling, keys, doors)
- [ ] AI task completion behavior
- [ ] Detailed score breakdown screen
- [ ] Cognitive analysis radar chart

### Phase 3: Content & Polish
- [ ] All 9 stages with unique layouts
- [ ] 7 agent types with distinct GOAP behaviors
- [ ] Fog of war system
- [ ] Zone control mechanic
- [ ] Particle effects, screen shake, juice
- [ ] Sound effects and background music
- [ ] Save/load progress

### Phase 4: Multiplayer
- [ ] Room creation/joining system
- [ ] WebSocket/WebRTC real-time sync
- [ ] Lobby UI
- [ ] Side-by-side score comparison
- [ ] Challenge rematch system

---

## SUMMARY

MindArena is NOT just a game. It's a **cognitive training platform disguised as a game**.

Every match asks: "Can you out-THINK the AI?"

The GOAP agents represent **optimal planning** — they always know the best order, 
the best path, the best strategy. The player must observe, learn, adapt, and eventually 
**beat the AI at its own game**.

By Level 3, the player has developed:
✅ Strategic planning skills
✅ Prioritization under pressure
✅ Resource management
✅ Adaptive thinking
✅ Decision-making speed
✅ Multi-threat awareness

**This is what makes MindArena different from every other game.**
