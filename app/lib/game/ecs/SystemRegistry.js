export class SystemRegistry {
    constructor(scene, entityManager) {
        this.scene = scene;
        this.entityManager = entityManager;
        this.systems = [];
    }

    addSystem(system) {
        this.systems.push(system);
        if (system.init) {
            system.init(this.scene, this.entityManager);
        }
    }

    updateAll(time, delta) {
        for (const system of this.systems) {
            system.update(time, delta, this.entityManager);
        }
    }
}
