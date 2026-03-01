// ============================================================
// SeededRandom.js — Deterministic PRNG for world generation
// Same seed = same world (critical for multiplayer sync)
// ============================================================

export class SeededRandom {
    constructor(seed = 42) {
        this.seed = seed;
        this.state = seed;
    }

    /** Returns float 0..1 */
    next() {
        this.state = (this.state * 1664525 + 1013904223) & 0xFFFFFFFF;
        return (this.state >>> 0) / 0xFFFFFFFF;
    }

    /** Returns int min..max (inclusive) */
    nextInt(min, max) {
        return Math.floor(this.next() * (max - min + 1)) + min;
    }

    /** Returns float min..max */
    nextFloat(min, max) {
        return this.next() * (max - min) + min;
    }

    /** Returns true with given probability (0..1) */
    chance(probability) {
        return this.next() < probability;
    }

    /** Pick random element from array */
    pick(arr) {
        return arr[this.nextInt(0, arr.length - 1)];
    }

    /** Shuffle array in-place (Fisher-Yates) */
    shuffle(arr) {
        for (let i = arr.length - 1; i > 0; i--) {
            const j = this.nextInt(0, i);
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        return arr;
    }

    /** Fork a new RNG with a derived seed (for chunk-level generation) */
    fork(salt) {
        return new SeededRandom(this.seed ^ (salt * 2654435761));
    }

    /** 2D noise-like value for position (0..1) — used for biome mapping */
    noise2D(x, y) {
        const n = Math.sin(x * 12.9898 + y * 78.233 + this.seed) * 43758.5453;
        return n - Math.floor(n);
    }

    /** Smoothed noise for terrain (averaged neighbors) */
    smoothNoise2D(x, y, scale = 1) {
        const sx = x / scale;
        const sy = y / scale;
        const ix = Math.floor(sx);
        const iy = Math.floor(sy);
        const fx = sx - ix;
        const fy = sy - iy;

        const n00 = this.noise2D(ix, iy);
        const n10 = this.noise2D(ix + 1, iy);
        const n01 = this.noise2D(ix, iy + 1);
        const n11 = this.noise2D(ix + 1, iy + 1);

        // Bilinear interpolation
        const nx0 = n00 * (1 - fx) + n10 * fx;
        const nx1 = n01 * (1 - fx) + n11 * fx;
        return nx0 * (1 - fy) + nx1 * fy;
    }
}
