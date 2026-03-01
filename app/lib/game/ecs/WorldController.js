import { ProceduralWorld } from '../world/ProceduralWorld';
import { ChunkManager } from '../world/ChunkManager';

export class WorldController {
    constructor(scene, seed) {
        this.scene = scene;

        // Setup Procedural World Gen
        this.worldGen = new ProceduralWorld(seed);

        // Setup Data-Driven Chunk Manager (To be upgraded with Tilemaps)
        this.chunkManager = new ChunkManager(scene, this.worldGen);
    }

    update(time, delta, centerMapX, centerMapY) {
        // Keeps the world running dynamically ahead of processing entities
        if (this.chunkManager) {
            this.chunkManager.update(centerMapX, centerMapY);
        }
    }
}
