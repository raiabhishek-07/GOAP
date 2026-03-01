// ============================================================
// ModularPlayer.js — Phaser Container with independent limb animation
// Structure: Container → [ Legs (2), Body, Left Arm, Right Arm, Gun ]
// Procedural animation: walk cycle (sine), arm swing, recoil, breathing
// ============================================================

/**
 * Creates the modular player container and wires animation state.
 * Call updateAnimation(state) each frame from the scene.
 *
 * @param {Phaser.Scene} scene
 * @param {number} x
 * @param {number} y
 * @param {string} playerName
 * @returns {Phaser.GameObjects.Container} container with physics, playerData, visuals, animState, updateAnimation()
 */
export function createModularPlayer(scene, x, y, playerName = 'OPERATIVE_07') {
    const container = scene.add.container(x, y);
    container.setDepth(25);
    scene.physics.add.existing(container, false);

    const body = container.body;
    body.setSize(16, 18);
    body.setOffset(-8, -9);
    body.setCollideWorldBounds(true);
    body.setDrag(800, 800);
    body.setBounce(0);

    // ─── Visual parts (order = draw order: back → front) ───
    const leftLeg = scene.add.image(-6, 0, 'player_leg')
        .setOrigin(0.5, 0);
    const rightLeg = scene.add.image(6, 0, 'player_leg')
        .setOrigin(0.5, 0)
        .setFlipX(true);

    const bodySprite = scene.add.image(0, 0, 'player_body')
        .setOrigin(0.5, 0.5)
        .setScale(1.8);

    const leftArm = scene.add.image(-10, -6, 'player_arm')
        .setOrigin(0.5, 0)
        .setFlipX(true);
    const rightArm = scene.add.image(10, -6, 'player_arm')
        .setOrigin(0.5, 0);

    const gunSprite = scene.add.image(12, -14, 'loot_pistol')
        .setOrigin(0, 0.5)
        .setVisible(false);

    container.add([leftLeg, rightLeg, bodySprite, leftArm, rightArm, gunSprite]);

    container.playerData = {
        name: playerName,
        health: 100,
        maxHealth: 100,
        armor: 0,
        speed: 180,
        sprintSpeed: 300,
        stamina: 100,
        maxStamina: 100,
        weapons: [null, null, null],
        activeWeapon: -1,
        vehicle: null,
        inVehicle: false,
    };

    container.visuals = {
        leftLeg,
        rightLeg,
        body: bodySprite,
        leftArm,
        rightArm,
        gun: gunSprite,
    };

    container.animState = {
        walkCycle: 0,
        recoilOffset: 0,
        breathPhase: 0,
    };

    /**
     * Call every frame after movement. Updates leg/arm/gun/body animation.
     * @param {Object} state
     * @param {number} state.vx
     * @param {number} state.vy
     * @param {number} state.bodyAngle - container rotation (scene sets it)
     * @param {boolean} state.isMoving
     * @param {boolean} state.isSprinting
     * @param {boolean} state.isAiming - has weapon out
     * @param {Object|null} state.weaponDef - current weapon or null
     * @param {boolean} [state.triggerRecoil] - set true once when shot fired
     * @param {number} [state.delta=16]
     */
    container.updateAnimation = function (state) {
        const delta = state.delta ?? 16;
        const { vx, vy, isMoving, isSprinting, isAiming, weaponDef, triggerRecoil } = state;
        const vis = container.visuals;
        const anim = container.animState;

        const velMag = Math.sqrt(vx * vx + vy * vy);

        // ─── Walk cycle (velocity-based speed, decay when idle) ───
        if (isMoving) {
            const walkSpeedMult = isSprinting ? 0.028 : 0.018;
            anim.walkCycle += velMag * walkSpeedMult;
        } else {
            anim.walkCycle = Phaser.Math.Linear(anim.walkCycle, 0, 0.2);
            if (anim.walkCycle < 0.05) anim.walkCycle = 0;
        }

        const t = anim.walkCycle;
        const legSwingAmt = 12;
        const legRotateAmt = 0.2;

        // ─── Legs: sine wave Y offset + slight rotation (alternating) ───
        const legSwing = Math.sin(t) * legSwingAmt;
        vis.leftLeg.y = legSwing;
        vis.rightLeg.y = -legSwing;
        vis.leftLeg.rotation = Math.sin(t) * legRotateAmt;
        vis.rightLeg.rotation = -Math.sin(t) * legRotateAmt;

        // ─── Idle breathing: body scale ───
        anim.breathPhase += delta * 0.002;
        if (!isMoving) {
            const breathScale = 1 + Math.sin(anim.breathPhase) * 0.02;
            vis.body.setScale(1.8 * breathScale);
        } else {
            vis.body.setScale(1.8);
        }

        // ─── Recoil: decay, or kick when triggerRecoil ───
        if (triggerRecoil) {
            anim.recoilOffset = 8 + Math.random() * 4;
        }
        anim.recoilOffset = Phaser.Math.Linear(anim.recoilOffset, 0, 0.12);

        const recoilY = anim.recoilOffset;
        const weaponSway = isMoving ? Math.sin(t * 2) * 2 : 0;
        const gunBob = isMoving ? Math.sin(t * 1.5) * 1.5 : 0;

        if (isAiming && weaponDef) {
            vis.gun.setVisible(true);
            vis.gun.setTexture(`loot_${weaponDef.id}`);

            const gunX = 12;
            const gunY = -14 - recoilY + weaponSway + gunBob;
            vis.gun.setPosition(gunX, gunY);
            vis.gun.rotation = 0;

            // Arms grip weapon: follow gun position
            const gripY = gunY + 4;
            const foreY = gunY - 6;
            vis.rightArm.setPosition(gunX - 2, gripY);
            vis.rightArm.rotation = 0;
            vis.rightArm.setVisible(true);
            vis.leftArm.setPosition(gunX - 2, foreY);
            vis.leftArm.rotation = 0;
            vis.leftArm.setVisible(true);
        } else {
            vis.gun.setVisible(false);
            vis.leftArm.setVisible(true);
            vis.rightArm.setVisible(true);

            const handSwing = Math.cos(t) * 10;
            vis.leftArm.setPosition(-10, -6 + handSwing);
            vis.leftArm.rotation = Math.sin(t) * 0.1;
            vis.rightArm.setPosition(10, -6 - handSwing);
            vis.rightArm.rotation = -Math.sin(t) * 0.1;
        }
    };

    return container;
}
