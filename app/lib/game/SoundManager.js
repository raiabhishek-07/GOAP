// ============================================================
// SoundManager.js — Procedural audio via Web Audio API
// Generates all game sounds programmatically (no audio files)
// ============================================================

let audioCtx = null;

function getContext() {
    if (!audioCtx) {
        try {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            console.warn('SoundManager: Web Audio not available');
            return null;
        }
    }
    // Resume if suspended (autoplay policy)
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
    return audioCtx;
}

// ─── VOLUME CONTROL ────────────────────────────────────────

let masterVolume = 0.5;
let sfxVolume = 0.7;
let musicVolume = 0.3;
let muted = false;

// ─── SOUND GENERATORS ──────────────────────────────────────

function playTone(freq, duration, type = 'square', volume = 0.3, fadeOut = true) {
    const ctx = getContext();
    if (!ctx || muted) return;

    const vol = volume * sfxVolume * masterVolume;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    gain.gain.setValueAtTime(vol, ctx.currentTime);

    if (fadeOut) {
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    }

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duration);
}

function playNoise(duration, volume = 0.1) {
    const ctx = getContext();
    if (!ctx || muted) return;

    const vol = volume * sfxVolume * masterVolume;
    const bufferSize = ctx.sampleRate * duration;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
    }

    const source = ctx.createBufferSource();
    source.buffer = buffer;

    // Bandpass filter for colored noise
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 800;
    filter.Q.value = 1;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(vol, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

    source.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    source.start();
}

// ─── GAME SOUND EFFECTS ────────────────────────────────────

export class SoundManager {

    /** Initialize audio (call on first user interaction) */
    static init() {
        getContext();
    }

    static setMasterVolume(v) { masterVolume = Math.max(0, Math.min(1, v)); }
    static setSfxVolume(v) { sfxVolume = Math.max(0, Math.min(1, v)); }
    static setMusicVolume(v) { musicVolume = Math.max(0, Math.min(1, v)); }
    static setMuted(m) { muted = m; }
    static isMuted() { return muted; }
    static toggleMute() { muted = !muted; return muted; }

    // ── UI SOUNDS ──────────────────────────────────────

    /** Button click / menu select */
    static uiClick() {
        playTone(800, 0.08, 'square', 0.15);
        playTone(1200, 0.06, 'square', 0.1);
    }

    /** Button hover */
    static uiHover() {
        playTone(600, 0.05, 'sine', 0.08);
    }

    /** Menu transition / scene change */
    static uiTransition() {
        playTone(400, 0.15, 'sine', 0.2);
        setTimeout(() => playTone(600, 0.15, 'sine', 0.15), 80);
        setTimeout(() => playTone(800, 0.2, 'sine', 0.12), 160);
    }

    /** Error / denied */
    static uiError() {
        playTone(200, 0.15, 'square', 0.2);
        setTimeout(() => playTone(150, 0.2, 'square', 0.2), 100);
    }

    // ── COMBAT SOUNDS ──────────────────────────────────

    /** Gun Shoot */
    static shoot() {
        playNoise(0.05, 0.4);
        playTone(600, 0.05, 'square', 0.3);
        setTimeout(() => playTone(300, 0.05, 'sawtooth', 0.2), 30);
    }

    /** Gun Reload */
    static reload() {
        playTone(800, 0.1, 'square', 0.1);
        setTimeout(() => playTone(1200, 0.05, 'square', 0.15), 150);
        setTimeout(() => playTone(1000, 0.05, 'sine', 0.1), 300);
    }

    /** Player attack / hit */
    static attackHit() {
        playNoise(0.08, 0.25);
        playTone(300, 0.1, 'sawtooth', 0.2);
    }

    /** Player takes damage */
    static damageTaken() {
        playTone(200, 0.15, 'sawtooth', 0.3);
        playNoise(0.12, 0.2);
        setTimeout(() => playTone(150, 0.1, 'square', 0.15), 50);
    }

    /** Enemy death */
    static enemyDeath() {
        playTone(400, 0.1, 'square', 0.2);
        setTimeout(() => playTone(300, 0.1, 'square', 0.15), 60);
        setTimeout(() => playTone(200, 0.15, 'sawtooth', 0.1), 120);
        playNoise(0.2, 0.15);
    }

    /** Player death */
    static playerDeath() {
        playTone(250, 0.3, 'sawtooth', 0.3);
        setTimeout(() => playTone(180, 0.3, 'sawtooth', 0.25), 150);
        setTimeout(() => playTone(100, 0.5, 'sawtooth', 0.2), 300);
        playNoise(0.4, 0.2);
    }

    /** Dash */
    static dash() {
        playTone(600, 0.08, 'sine', 0.15);
        playTone(900, 0.06, 'sine', 0.1);
        playNoise(0.05, 0.1);
    }

    /** Walk step */
    static walk() {
        playNoise(0.03, 0.05);
        playTone(200, 0.03, 'triangle', 0.05);
    }

    /** Run step */
    static run() {
        playNoise(0.04, 0.08);
        playTone(250, 0.04, 'triangle', 0.08);
    }

    /** Car Engine loop part */
    static carEngine() {
        playTone(100, 0.2, 'sawtooth', 0.05, false);
        playNoise(0.2, 0.02);
    }

    // ── TASK SOUNDS ────────────────────────────────────

    /** Start channeling a task */
    static channelStart() {
        playTone(500, 0.1, 'sine', 0.15);
        setTimeout(() => playTone(700, 0.1, 'sine', 0.12), 80);
    }

    /** Channeling tick (subtle beep during progress) */
    static channelTick() {
        playTone(800, 0.03, 'sine', 0.06);
    }

    /** Task completed successfully */
    static taskComplete() {
        playTone(600, 0.12, 'sine', 0.25);
        setTimeout(() => playTone(800, 0.12, 'sine', 0.2), 100);
        setTimeout(() => playTone(1000, 0.15, 'sine', 0.18), 200);
        setTimeout(() => playTone(1200, 0.2, 'sine', 0.15), 310);
    }

    /** Task failed / interrupted */
    static taskFailed() {
        playTone(400, 0.12, 'square', 0.2);
        setTimeout(() => playTone(300, 0.15, 'square', 0.15), 100);
    }

    /** Intel fragment collected */
    static intelCollect() {
        playTone(1000, 0.08, 'sine', 0.15);
        playTone(1400, 0.06, 'sine', 0.1);
    }

    /** Zone capture progress tick */
    static zoneTick() {
        playTone(700, 0.04, 'triangle', 0.08);
    }

    /** Zone contested */
    static zoneContested() {
        playTone(300, 0.1, 'sawtooth', 0.2);
        playTone(350, 0.1, 'sawtooth', 0.15);
    }

    /** Defense wave incoming */
    static waveIncoming() {
        playTone(200, 0.2, 'sawtooth', 0.25);
        setTimeout(() => playTone(250, 0.2, 'sawtooth', 0.2), 200);
        setTimeout(() => playTone(300, 0.3, 'sawtooth', 0.18), 400);
        playNoise(0.3, 0.15);
    }

    // ── COLLECTIBLE SOUNDS ─────────────────────────────

    /** Power orb collected */
    static orbCollect() {
        playTone(800, 0.08, 'sine', 0.15);
        setTimeout(() => playTone(1100, 0.08, 'sine', 0.12), 50);
    }

    /** Health pickup */
    static healthPickup() {
        playTone(600, 0.1, 'sine', 0.2);
        setTimeout(() => playTone(900, 0.12, 'sine', 0.15), 80);
    }

    /** Healing channel tick */
    static heal() {
        playTone(400, 0.1, 'sine', 0.15);
        setTimeout(() => playTone(800, 0.15, 'sine', 0.2), 150);
    }

    // ── GAME STATE SOUNDS ──────────────────────────────

    /** Match start / briefing */
    static matchStart() {
        playTone(300, 0.2, 'triangle', 0.2);
        setTimeout(() => playTone(450, 0.2, 'triangle', 0.18), 150);
        setTimeout(() => playTone(600, 0.3, 'triangle', 0.15), 300);
    }

    /** Victory fanfare */
    static victory() {
        const notes = [523, 659, 784, 1047]; // C5, E5, G5, C6
        notes.forEach((freq, i) => {
            setTimeout(() => playTone(freq, 0.3, 'sine', 0.2), i * 150);
        });
    }

    /** Game over */
    static gameOver() {
        playTone(300, 0.3, 'sawtooth', 0.25);
        setTimeout(() => playTone(250, 0.3, 'sawtooth', 0.2), 200);
        setTimeout(() => playTone(200, 0.4, 'sawtooth', 0.15), 400);
        setTimeout(() => playTone(150, 0.5, 'sawtooth', 0.12), 600);
    }

    /** Extraction point activated */
    static extractionReady() {
        playTone(500, 0.15, 'sine', 0.2);
        setTimeout(() => playTone(750, 0.15, 'sine', 0.18), 120);
        setTimeout(() => playTone(1000, 0.2, 'sine', 0.15), 240);
    }

    /** Timer warning (last 10s) */
    static timerWarning() {
        playTone(800, 0.08, 'square', 0.2);
    }

    /** Plan phase start */
    static planPhaseStart() {
        playTone(400, 0.15, 'triangle', 0.15);
        setTimeout(() => playTone(500, 0.2, 'triangle', 0.12), 100);
    }

    // ── AMBIENT MUSIC (simple procedural) ──────────────

    static _musicOsc = null;
    static _musicGain = null;

    /** Start ambient background drone */
    static startAmbientMusic() {
        const ctx = getContext();
        if (!ctx || muted) return;

        // Stop existing
        SoundManager.stopAmbientMusic();

        const vol = 0.06 * musicVolume * masterVolume;

        // Deep pad drone
        const osc1 = ctx.createOscillator();
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(55, ctx.currentTime); // A1

        const osc2 = ctx.createOscillator();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(82.41, ctx.currentTime); // E2

        const osc3 = ctx.createOscillator();
        osc3.type = 'triangle';
        osc3.frequency.setValueAtTime(110, ctx.currentTime); // A2

        // Subtle LFO tremolo
        const lfo = ctx.createOscillator();
        lfo.frequency.setValueAtTime(0.3, ctx.currentTime);
        const lfoGain = ctx.createGain();
        lfoGain.gain.setValueAtTime(vol * 0.3, ctx.currentTime);
        lfo.connect(lfoGain);

        const masterGain = ctx.createGain();
        masterGain.gain.setValueAtTime(vol, ctx.currentTime);

        lfoGain.connect(masterGain.gain);

        // Lowpass filter for warmth
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(200, ctx.currentTime);

        osc1.connect(filter);
        osc2.connect(filter);
        osc3.connect(filter);
        filter.connect(masterGain);
        masterGain.connect(ctx.destination);

        osc1.start();
        osc2.start();
        osc3.start();
        lfo.start();

        SoundManager._musicOsc = [osc1, osc2, osc3, lfo];
        SoundManager._musicGain = masterGain;
    }

    /** Stop ambient music */
    static stopAmbientMusic() {
        if (SoundManager._musicOsc) {
            SoundManager._musicOsc.forEach(o => { try { o.stop(); } catch (e) { /* */ } });
            SoundManager._musicOsc = null;
        }
        SoundManager._musicGain = null;
    }
}
