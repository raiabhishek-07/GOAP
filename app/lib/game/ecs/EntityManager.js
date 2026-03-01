import { Entity } from './Entity';

export class EntityManager {
    constructor(scene) {
        this.scene = scene;
        this.entities = new Map(); // id -> Entity
    }

    createEntity() {
        const entity = new Entity();
        this.entities.set(entity.id, entity);
        return entity;
    }

    removeEntity(id) {
        const entity = this.entities.get(id);
        if (entity) {
            entity.isDestroyed = true;
            this.entities.delete(id);
        }
    }

    // Returns all entities having all the specified component classes
    query(componentClasses) {
        const result = [];
        for (const entity of this.entities.values()) {
            if (!entity.isDestroyed && entity.hasAllComponents(componentClasses)) {
                result.push(entity);
            }
        }
        return result;
    }
}
