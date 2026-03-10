# 🔗 Shared Components

Common scenes and components used by both solo gameplay and open world systems.

## 📁 File Structure

```
shared/
├── components/
│   └── scenes/
│       ├── DeploymentLoadingScene.js  # Mission loading screen
│       ├── PauseScene.js              # Game pause menu
│       ├── VictoryScene.js            # Mission complete
│       └── GameOverScene.js           # Mission failed
└── README.md                          # This file
```

## 🎮 Shared Scenes

### DeploymentLoadingScene.js
**Purpose**: Mission deployment and loading screen
- **Features**: Loading animation, mission briefing
- **Used by**: Both solo and open world systems
- **Integration**: Automatically launched before missions

### PauseScene.js
**Purpose**: Game pause menu
- **Features**: Resume, restart, options, exit
- **Used by**: Both solo and open world systems
- **Controls**: ESC key or pause button

### VictoryScene.js
**Purpose**: Mission completion screen
- **Features**: Victory display, stats, next mission
- **Used by**: Both solo and open world systems
- **Integration**: Triggered on mission success

### GameOverScene.js
**Purpose**: Mission failure screen
- **Features**: Game over display, retry, exit
- **Used by**: Both solo and open world systems
- **Integration**: Triggered on mission failure

## 🔄 Integration

### In Solo Gameplay
```javascript
// GameClient.js scenes array
scenes = [
    DeploymentLoadingScene,
    GameScene,
    GameHUD,
    GameMap,
    PauseScene,
    GameOverScene,
    VictoryScene,
];
```

### In Open World
```javascript
// GameClient.js scenes array
scenes = [
    DeploymentLoadingScene,
    OpenWorldScene,
    OpenWorldHUD,
    GameMap,
    PauseScene,
    GameOverScene,
    VictoryScene,
];
```

## 🔧 Usage

1. **Copy to Main App**:
   ```bash
   cp -r shared/* /path/to/your/app/
   ```

2. **Import in GameClient**:
   ```javascript
   const { DeploymentLoadingScene } = await import("./scenes/DeploymentLoadingScene");
   const { PauseScene } = await import("./scenes/PauseScene");
   const { VictoryScene } = await import("./scenes/VictoryScene");
   const { GameOverScene } = await import("./scenes/GameOverScene");
   ```

3. **Add to Scenes Array**:
   ```javascript
   scenes = [
     // ... other scenes
     DeploymentLoadingScene,
     PauseScene,
     GameOverScene,
     VictoryScene,
   ];
   ```

## 📋 Scene Flow

```
Start → DeploymentLoadingScene → GameScene/OpenWorldScene
                                    ↓
                              PauseScene (ESC)
                                    ↓
                    VictoryScene (Success) or GameOverScene (Failure)
                                    ↓
                              Return to Menu or Next Mission
```

## 🎯 Customization

### Branding
- Update colors and logos in each scene
- Modify text to match your game theme
- Add custom animations and effects

### Functionality
- Add additional menu options
- Implement save/load systems
- Include settings and configuration

---

*System: Shared Components*
*Purpose: Common scenes for both game systems*
