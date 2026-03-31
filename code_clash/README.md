# Code Clash: Hunt the Treasure, Master the Logic

Welcome to **Code Clash**! This is an educational game component designed to teach programming fundamentals in an intuitive, action-packed way.

## 🕹️ Gameplay Loop
1. **Explore**: Move through the tactical grid using **WASD**.
2. **Eliminate Bugs**: Use your mouse to aim and shoot "Bug" enemies (buggy code).
3. **Decode Logic**: Every bug fixed reveals a **Treasure Chest**.
4. **Learn**: Open chests to unlock "Logic Decoders" that explain variables, if/else statements, and loops.

## 🚀 Integration
1. **Install Phaser**:
   ```bash
   npm install phaser
   ```
2. **Import & Use**:
   Drop `CodeClash.js` into your Next.js project and use it as a standard component:
   ```jsx
   import CodeClash from './components/game/CodeClash';

   export default function Page() {
     return <CodeClash />;
   }
   ```

## 🛠️ Tech Features
- **Procedural Assets**: 100% graphics-coded characters and environments.
- **Dynamic Learning**: Interactive modals that pause the game for focused learning.
- **Responsive Game Loop**: Smooth arcade physics and camera effects.

---
Built for learning logic in an intuitive way.
