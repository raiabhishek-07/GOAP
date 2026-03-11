# GOAP Agent Design & Behavior Analysis

This document provides a comprehensive breakdown of the GOAP (Goal-Oriented Action Planning) agent architecture, specifically focusing on how they are designed to challenge the player at each level.

## 1. Core Architecture: The GOAP Engine
Unlike traditional AI that uses simple state machines (FSMs), our agents use **GOAP**. This allows them to "think" about their environment and plan a sequence of actions to achieve a high-level goal.

### The GOAP Loop
1.  **Observe**: Agents check their surroundings (e.g., is the player nearby? is my health low?).
2.  **Believing**: These observations are translated into **Beliefs** (predicates like `HealthLow: true`).
3.  **Goal Selection**: The agent evaluates its **Goals** (e.g., `Survive`, `Hunt Player`) and picks the one with the highest current priority.
4.  **Action Planning**: The **Planner** looks at all available **Actions** and builds a chain that leads from the current state to the goal.
5.  **Execution**: The agent performs the actions one by one. If anything changes (e.g., the player moves), it re-plans.

---

## 2. Agent Archetypes
We have designed 7 specialized agents, each with a unique GOAP profile:

| Archetype | Icon | Behavior | Primary Goals |
| :--- | :--- | :--- | :--- |
| **Patrol Guard** | 🛡️ | Wanders a set path. Low threat. | `Patrol` |
| **Shadow Stalker** | 🔪 | Actively hunts the player globaly. | `Hunt Player`, `Survive` |
| **Task Racer** | ⚡ | Ignores combat. Races to finish objectives. | `Complete Tasks` |
| **Defender** | 🧱 | Guards specific points (Terminals/Vaults). | `Guard Target`, `Defend` |
| **Ambusher** | 🪤 | Waits at chokepoints. Attacks when you're close. | `Set Ambush`, `Ambush Attack` |
| **Strategist** | 🧠 | Coordinates with others and completes tasks. | `Strategic Tasks`, `Engage Player` |
| **Master Mind** | 👑 | Boss AI. Uses ALL strategies simultaneously. | `Dominate Tasks`, `Destroy Player` |

---

## 3. Level-Specific Behavior Logic
The game is designed to progressively teach the player how to outsmart more complex AI.

### Level 1: Foundation (Learning the Basics)
*   **Focus**: Single-agent threats.
*   **AI Behavior**: Agents are relatively predictable. You are introduced to the **Stalker** and **Defender**.
*   **Player Lesson**: Learn to time your movements. Observe the AI's "overhead plan" to see what it's thinking.

### Level 2: Strategy (Adapting to Change)
*   **Focus**: Multi-agent coordination and resource competition.
*   **AI Behavior**: You face combinations like a **Strategist** and **Ambusher**. Agents will contest you for **Health Kits** if they are low on health.
*   **Player Lesson**: You cannot brute-force. You must use chokepoints and prioritize tasks based on AI positions.

### Level 3: Mastery (Strategic Dominance)
*   **Focus**: Coordinated squads and environmental hazards.
*   **AI Behavior**: Full squad deployment. Introducing **Fog of War**, which allows agents like **Ambushers** to hide effectively. The **Mastermind** boss adapts its goal priorities mid-fight based on your successes.
*   **Player Lesson**: Predictive planning. You must anticipate where the AI is moving in the darkness and plan your extraction route before you even deploy.

---

## 4. Design Patterns in GOAP
Each agent in `AgentFactory.js` is built with these specific data structures:

*   **Beliefs**: Logical conditions (e.g., `PlayerInAttackRange`).
*   **Actions**: Small atomic steps (e.g., `Move to Home` -> `Heal`).
*   **Goals**: Desired states (e.g., `IsHealthy`).
*   **Costs**: Planning weights. If an action is expensive, the AI will try to find a cheaper path.

> [!TIP]
> **Pro-Tip for Stage 3.3**: The Mastermind AI has a priority 10 difficulty. It will actively try to intercept you at the **Extraction Point** if it believes you have completed the primary objectives.
