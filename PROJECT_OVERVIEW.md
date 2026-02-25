# 🌐 MindArena: The GOAP Strategic Ecosystem

## 🎯 Project Vision
**MindArena** is a comprehensive interactive platform designed to demystify **Goal-Oriented Action Planning (GOAP)**. It bridges the gap between complex AI theory and engaging tactical gameplay, providing users with both a deep-dive educational guide and a high-stakes AI-driven strategy game.

---

## 🚀 Core Features

### 1. Interactive Educational Guide
A high-fidelity web experience that explains the "Brain" of modern gaming AI:
*   **FSM vs GOAP**: Comparative analysis of Finite State Machines versus the dynamic nature of GOAP.
*   **Mental Models**: Visualizing how AI perceives individual states, costs, and requirements.
*   **3D Simulations**: Real-time interactive scenarios showing agents planning their next move in a dynamic world.

### 2. MindArena: Tactical Game Mode
A 2D tactical stealth-strategy game where you deploy against advanced AI agents:
*   **GOAP-Powered Opponents**: Every enemy uses a dedicated planner to calculate the most efficient way to stop you or complete their own objectives.
*   **Dynamic Task System**: From hacking terminals to capturing zones and gathering fragmented intel.
*   **Tactical HUD**: A unified interface showing your current goal, next action, and neural synchronization.

### 3. Integrated Tactical Interface
*   **Command Dashboard**: A central hub for managing your operational progress.
*   **Mission Control**: Selective deployment across three tiers of increasing complexity.
*   **Operational Dossier**: Real-time career tracking and performance metrics linked to the `SaveSystem`.

---

## 🧠 How It Works: The GOAP Engine

At the heart of Project MindArena is a modular **GOAP (Goal-Oriented Action Planning)** architecture:

1.  **World State**: A collection of boolean/numerical flags (e.g., `hasKey: true`, `atTerminal: false`).
2.  **Actions**: Modular behaviors with specific **Preconditions** (what is needed) and **Effects** (what changes).
    *   *Example*: `UnlockDoor` requires `hasKey: true` and results in `isDoorOpen: true`.
3.  **Goals**: Desired end-states with varying priorities. The AI identifies which goal is currently most valuable.
4.  **Planner (A*)**: The "Brain" that searches through all available actions to find the lowest-cost path to satisfy a Goal.

---

## 🎮 Game Progression & Levels

The game is structured into three distinct **Operational Tiers**, each introducing new mechanics and AI behaviors.

### Tier 1: Foundation — "Learn to Plan"
*Focus: Basics, movement, and simple priority management.*
*   **1.1: First Steps**: Introduction to terminals and simple patrol guards.
*   **1.2: Priority Call**: Introduction to keys, locked doors, and "Stalker" agents.
*   **1.3: Time Crunch**: Introduction to "Racer" agents who compete for your objectives.

### Tier 2: Strategy — "Learn to Adapt"
*Focus: Territory control, resource management, and coordination.*
*   **2.1: Multi-Front**: Introduction to **Zone Capture** points.
*   **2.2: Resource War**: Limited-use resource caches (Health/Stamina) where you must beat the AI to the supply.
*   **2.3: Counter-Intel**: Introduction to **Sequence Chains** and "Strategist" agents who coordinate with others.

### Tier 3: Mastery — "Become the Strategist"
*Focus: High-stakes environmental hazards and elite enemy units.*
*   **3.1: Full Arena**: Introduction to **Fog of War** (scouting is required).
*   **3.2: Elite Ops**: Facing coordinated squads of specialized AI units (Defender + Ambusher + Stalker).
*   **3.3: Final Mind**: The Boss Level. A duel against the **Master Mind** — an AI that utilizes all strategies, adapts to your playstyle, and guards multiple objectives simultaneously.

---

## 🤖 Known AI Agent Types

| Agent Type | Identification | Behavior |
| :--- | :--- | :--- |
| **Patrol** | Grey | Wanders set paths, low threat, easy to bypass. |
| **Stalker** | Red | Actively hunts the player once detected. High speed. |
| **Racer** | Blue | Ignores the player to complete tasks and steal points. |
| **Defender** | Orange | Stationary guard for high-value objectives (Zones/Doors). |
| **Ambusher** | Purple | Waits at chokepoints and chasers only when you are close. |
| **Strategist** | Cyan | Coordinates other agents and performs complex tasks. |
| **Mastermind** | Gold | Boss unit. High speed, high range, and hyper-adaptive planning. |

---

## 🛠️ Technical Stack
*   **Framework**: Next.js 14+ (App Router)
*   **Game Engine**: Phaser 3 (WebGL Rendering)
*   **Styling**: Tailwind CSS & Vanilla CSS (Tactical Aesthetic)
*   **Persistence**: LocalStorage-based `SaveSystem` for cross-session progression.
*   **Architecture**: Modular Action/Goal system allowing for easy expansion of AI behaviors.
