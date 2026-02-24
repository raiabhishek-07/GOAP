# 🤖 GOAP Autonomous Simulation: Project Overview

This project is a sophisticated **Goal-Oriented Action Planning (GOAP)** simulation platform. It demonstrates how an AI agent can make autonomous decisions in a dynamic world to satisfy its survival needs and interact with a player.

The simulation features a dual-rendering system, allowing users to switch between a **2D Professional Game Engine (Phaser.js)** and an **Interactive 3D Physics World (Three.js + Rapier)**.

---

## 🛠️ Technology Stack

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Frontend** | [Next.js 15+](https://nextjs.org/) | Framework, Routing, and UI components. |
| **2D Engine** | [Phaser.js](https://phaser.io/) | Professional 2D game rendering and scene management. |
| **3D Engine** | [Three.js](https://threejs.org/) | 3D rendering via `@react-three/fiber` and `@react-three/drei`. |
| **3D Physics** | [Rapier.js](https://rapier.rs/) | High-performance WASD character controller and collision detection. |
| **AI Architecture** | Custom GOAP Engine | Decoupled planning logic (Sensors, Beliefs, Planner, Actions). |

---

## 🧠 How the AI Works (GOAP Architecture)

Unlike standard AI which uses fixed state machines (FSM), this agent uses **GOAP**. Instead of being told *what to do*, it is told *what it wants* (Goals) and *what it can do* (Actions), and it calculates the path itself.

### 1. The Decision Loop
1.  **Sensors**: The agent "sees" the world (e.g., *Is the player close? Is my health low? Am I near a cabin?*).
2.  **Beliefs**: Sensors update the agent's internal "Brain" (World State).
3.  **Planner**: The agent looks at its goals (sorted by priority) and searches for a sequence of actions that satisfies the one with the highest priority.
4.  **Action Plan**: A stack of actions (e.g., `MoveTo` -> `Enter Cabin` -> `Rest`).
5.  **Execution**: The agent performs the actions one by one until the goal is met or the world changes (triggering a replan).

### 2. Dynamic Priority System
The agent has a "Survival Instinct" built into its goal system:
*   **Wander (Priority 1)**: Default state when everything is fine.
*   **Keep Stats Up (Priority 2 → 4)**: Normally low priority, but if **Health < 20%** or **Stamina < 15%**, this goal jumps to Priority 4, overriding everything else.
*   **Seek & Destroy (Priority 3)**: Triggered when the player enters detection range. The agent will chase the player *unless* its survival needs (Priority 4) are critical.

---

## 🌎 The Simulation Worlds

### 🖼️ 2D Phaser.js View
*   **Stylized Graphics**: Features a "Chibi" style agent with a large red bow (🎀).
*   **Minimap**: A real-time radar in the corner tracking all entities.
*   **HUD**: Displays the current active "Executing" action plan.
*   **Interaction**: Click anywhere on the map to reposition the Player.

### 🧊 3D Pro Physics View
*   **Physically Modeled**: Uses Rapier for gravity, collisions with buildings, and smooth player movement.
*   **WASD Controls**: Users can manually control the Player character to "kite" the AI or test its detection ranges.
*   **Procedural Design**: High-quality 3D primitives used to create a stylized forest environment with high performance and zero external dependencies.

---

## 📂 Key File Structure

```text
/app
  /lib/goap
    - engine.js      # Core GOAP Engine (Planner, Goals, Actions)
    - agent.js       # Agent-specific beliefs and action definitions
  /components/simulation
    - SimulationPhaser.js # Phaser.js (2D) implementation
    - Simulation3D.js     # Three.js + Rapier (3D) implementation
    - DebugPanel.js       # Live metrics (Health, Stamina, Planning Log)
  /simulation
    - page.js        # Main entry point with View Switching
```

---

## 🚀 How it "Explains Everything"

This project proves that **AI consistency** can be maintained across different levels of abstraction. Whether you are in a flat 2D map or a complex 3D world, the agent's **intentions** remain the same. 

When you move the player:
1. The **3D Physics engine** updates the player's 3D coordinates.
2. The **GOAP Sensors** detect the player has moved.
3. The **GOAP Planner** decides to "Chase Player."
4. The **2D Phaser engine** smoothly slides the 2D sprite toward the project's logic coordinates.

This represents a **modular, scalable approach to AI** in game development, where the "brain" is completely separate from the "eyes" (Rendering).
