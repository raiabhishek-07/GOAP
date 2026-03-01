let _nextId = 1;

export class Entity {
    constructor() {
        this.id = _nextId++;
        this.components = new Map();
        this.isDestroyed = false;
    }

    addComponent(component) {
        this.components.set(component.constructor.name, component);
        return this;
    }

    removeComponent(componentClass) {
        this.components.delete(componentClass.name);
        return this;
    }

    getComponent(componentClass) {
        return this.components.get(componentClass.name);
    }

    hasComponent(componentClass) {
        return this.components.has(componentClass.name);
    }

    hasAllComponents(componentClasses) {
        for (const cls of componentClasses) {
            if (!this.components.has(cls.name)) return false;
        }
        return true;
    }
}
