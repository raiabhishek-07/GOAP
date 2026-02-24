# AI Agent Behavior Table — How the Agent Decides

## Goal Priority System (with Dynamic Escalation)

| Goal | Normal Priority | Critical Priority | Condition for Escalation |
|------|:--------------:|:-----------------:|--------------------------|
| **Keep Health Up** | 2 | **4** ⬆️ | When `health < 20` |
| **Keep Stamina Up** | 2 | **4** ⬆️ | When `stamina < 15` |
| **Seek & Destroy** | 3 | 3 (fixed) | Always 3 |
| **Wander** | 1 | 1 (fixed) | Always 1 |
| **Chill Out** | 1 | 1 (fixed) | Always 1 |

> **Rule:** The planner picks the highest-priority UNSATISFIED goal first.
> When health < 20, "Keep Health Up" jumps to priority **4**, which is HIGHER than "Seek & Destroy" (3).
> This means the agent will **stop attacking and go eat** when health is critical.

---

## Table 1: Agent Behavior — NO Player Nearby

When the player is far away (outside 150px chase range), "Seek & Destroy" cannot be planned because the precondition `PlayerInChaseRange` is false.

| Time | Health | Stamina | Check → Winner | Agent Action | Where Does It Go? |
|------|:------:|:-------:|----------------|--------------|-------------------|
| 0s | 100 | 100 | All survival goals satisfied → **Wander** (P1) | Wander Around | Random point nearby |
| ~3s | 100 | 100 | Still all satisfied → **Chill Out** (P1) | Relax (idle 3s) | Stays in place |
| ~6s | 95 | 80 | Still satisfied → **Wander** (P1) | Wander Around | Random point |
| ~10s | 85 | 50 | `stamina < 50` → AgentIsRested = false → **Keep Stamina Up** (P2) | Move to Door 2 | Door 2 (550, 400) |
| ~13s | 80 | 40 | Continues plan → | Door 2 → Rest Area | Rest Area (650, 130) |
| ~17s | 70 | 30→70 | At Rest Area → **Rest** (idle 3s) | Resting... | Stays at Rest Area |
| ~20s | 65 | 70→90 | Stamina restored! Goal satisfied. → **Wander** (P1) | Wander Around | Random point |
| ~28s | 45 | 50 | `health < 50` → AgentIsHealthy = false → **Keep Health Up** (P2) | Move to Food Shack | Food Shack (130, 130) |
| ~33s | 35 | 30 | At Food Shack → **Eat** (idle 3s) | Eating... | Stays at Food Shack |
| ~36s | 55 | 20 | Health restored! But stamina < 50 → **Keep Stamina Up** (P2) | Move to Door 2 | Door 2 → Rest Area |
| ~45s | 50 | 80 | Both restored → **Wander** (P1) | Wander Around | Random point |
| ... | ... | ... | **Cycle repeats indefinitely** | | |

### Summary (No Player):
```
Wander/Chill → Stamina drops → Go Rest → Health drops → Go Eat → Repeat ♻️
```

---

## Table 2: Agent Behavior — Player IS Nearby (in chase range)

When the player is within 150px, `PlayerInChaseRange = true`, making "Seek & Destroy" (priority 3) plannable.

| Health | Stamina | Priority Comparison | Winner | Agent Does | Explanation |
|:------:|:-------:|---------------------|--------|------------|-------------|
| **100** | **100** | Seek&Destroy(3) > Health(2) > Stamina(2) | **Seek & Destroy** | Chase → Attack | All stats fine, agent attacks! |
| **80** | **80** | Seek&Destroy(3) > Health(2) > Stamina(2) | **Seek & Destroy** | Chase → Attack | Stats still OK |
| **45** | **60** | Seek&Destroy(3) > Health(2) > Stamina(2) | **Seek & Destroy** | Chase → Attack | Health low but not critical |
| **30** | **30** | Seek&Destroy(3) > Health(2) > Stamina(2) | **Seek & Destroy** | Chase → Attack | Risky! But agent keeps fighting |
| **19** ⚠️ | **30** | **Health(4)** > Seek&Destroy(3) | **Keep Health Up** 🏥 | Go to Food Shack → Eat | **CRITICAL! Agent retreats to eat!** |
| **15** | **12** ⚠️ | **Health(4)** = **Stamina(4)** > Seek(3) | **Keep Health Up** 🏥 | Go to Food Shack → Eat | Both critical, picks health first |
| **50** | **12** ⚠️ | **Stamina(4)** > Seek&Destroy(3) > Health(2) | **Keep Stamina Up** 💤 | Move to Door 2 → Rest Area → Rest | Stamina critical, goes to rest! |
| **50** | **50** | Seek&Destroy(3) > Health(2) > Stamina(2) | **Seek & Destroy** | Chase → Attack | After healing, resumes attack! |

### Summary (Player Nearby):
```
Attack → Health/Stamina drop → Critical? → YES: Retreat to Eat/Rest → Healed? → Resume Attack ♻️
                                            → NO:  Keep attacking
```

---

## Table 3: Complete Decision Flowchart

```
┌──────────────────────────────────────────────────────┐
│               Agent's Decision Loop                   │
│            (runs every frame ~60 FPS)                 │
└──────────────┬───────────────────────────────────────┘
               ▼
        ┌──────────────┐
        │ Health < 20? │
        └──────┬───────┘
           YES │                    NO
               ▼                     ▼
    ┌──────────────────┐    ┌──────────────┐
    │ PRIORITY 4       │    │ Stamina < 15?│
    │ Keep Health Up   │    └──────┬───────┘
    │                  │       YES │          NO
    │ Move to Food     │          ▼            ▼
    │ Shack → Eat      │  ┌──────────────┐  ┌──────────────────┐
    └──────────────────┘  │ PRIORITY 4   │  │ Player in chase  │
                          │ Keep Stamina │  │ range (< 150px)? │
                          │ Up           │  └──────┬───────────┘
                          │              │     YES │          NO
                          │ Door 2 →     │        ▼            ▼
                          │ Rest → Rest  │  ┌──────────┐  ┌──────────────┐
                          └──────────────┘  │PRIORITY 3│  │ Health < 50? │
                                            │Seek &    │  └──────┬───────┘
                                            │Destroy   │     YES │     NO
                                            │          │        ▼       ▼
                                            │Chase →   │  ┌────────┐ ┌──────────┐
                                            │Attack    │  │PRIO 2  │ │Stamina   │
                                            └──────────┘  │Eat     │ │< 50?     │
                                                          └────────┘ └──┬───────┘
                                                                    YES │     NO
                                                                       ▼       ▼
                                                                 ┌────────┐ ┌────────┐
                                                                 │PRIO 2  │ │PRIO 1  │
                                                                 │Rest    │ │Wander/ │
                                                                 └────────┘ │Chill   │
                                                                            └────────┘
```

---

## Table 4: Stat Decay & Restoration Rates

| Situation | Health Change | Stamina Change | Timer |
|-----------|:------------:|:--------------:|:-----:|
| **NOT near any building** | -5 | -10 | Every 2s |
| **At Food Shack** (< 30px) | **+20** | -10 | Every 2s |
| **At Rest Area** (< 30px) | -5 | **+20** | Every 2s |
| **At Food Shack AND Rest Area** (impossible) | +20 | +20 | Every 2s |

### Threshold Summary

| Stat | Threshold | Belief | Goal Activated | Priority |
|------|:---------:|--------|----------------|:--------:|
| Health ≥ 50 | — | AgentIsHealthy = ✅ | None (satisfied) | — |
| Health < 50 | Low | AgentIsHealthy = ❌ | Keep Health Up | 2 |
| Health < 20 | **CRITICAL** | AgentIsHealthy = ❌ | Keep Health Up | **4** ⬆️ |
| Stamina ≥ 50 | — | AgentIsRested = ✅ | None (satisfied) | — |
| Stamina < 50 | Low | AgentIsRested = ❌ | Keep Stamina Up | 2 |
| Stamina < 15 | **CRITICAL** | AgentIsRested = ❌ | Keep Stamina Up | **4** ⬆️ |

---

## Table 5: Action Execution Plans

### Plan: "Keep Health Up" (Eat)
```
Move to Food Shack (130, 130)  →  Eat (idle 3 seconds)
       cost: 1                       cost: 1
    no preconditions            precondition: AgentAtFoodShack
                                     effect: AgentIsHealthy ✅
```

### Plan: "Keep Stamina Up" (Rest via Door 2 — cheapest route)
```
Move to Door 2 (550, 400)  →  Door 2 → Rest Area (650, 130)  →  Rest (idle 3s)
       cost: 1                        cost: 1                       cost: 1
    no preconditions            precondition: AtDoor2          precondition: AtRestArea
                                     effect: AtRestArea              effect: AgentIsRested ✅
```

### Plan: "Seek & Destroy" (Attack)
```
Chase Player (→ player pos)  →  Attack Player (1 second)
       cost: 1                       cost: 1
  precondition: PlayerInChaseRange  precondition: PlayerInAttackRange
       effect: PlayerInAttackRange       effect: AttackingPlayer
```

### Plan: "Wander"
```
Wander Around (random point within 120px)
       cost: 1
    no preconditions
       effect: AgentMoving ✅
```

### Plan: "Chill Out"
```
Relax (idle 3 seconds)
       cost: 1
    no preconditions
       effect: Nothing (always false → goal is always unsatisfied → agent always has something to do)
```

---

## Expected Simulation Flow (Full Lifecycle)

```
t=0    ► Agent spawns. Health=100 Stamina=100
       ► Wander/Chill cycle begins

t=10s  ► Stamina drops to ~50
       ► Agent WALKS to Door 2 → Rest Area → Rests

t=20s  ► Stamina restored. Health ~60.
       ► Back to Wander/Chill

t=30s  ► Health drops to ~45
       ► Agent WALKS to Food Shack → Eats

t=40s  ► Health restored. 
       ► Cycle continues...

--- USER MOVES PLAYER CLOSE ---

t=45s  ► Player enters 150px chase range!
       ► Agent: SEEK & DESTROY! Chase → Attack
       ► Agent fights. Stats continue to drop.

t=55s  ► Health = 18 (CRITICAL!)
       ► Priority escalates: Health(4) > Seek&Destroy(3)
       ► Agent: RETREAT! Move to Food Shack → Eat
       
t=65s  ► Health restored to 60
       ► Player still in range?
       ► YES → Seek & Destroy resumes
       ► NO  → Wander/Chill continues

--- USER MOVES PLAYER AWAY ---

t=70s  ► Chase sensor clears
       ► Agent returns to survival cycle
```
