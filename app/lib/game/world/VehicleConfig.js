// ============================================================
// VehicleConfig.js — Vehicle type definitions
// Cars, bikes, trucks with distinct handling
// ============================================================

export const VEHICLE = {
    CAR: {
        id: 'car',
        name: 'SEDAN',
        maxSpeed: 350,
        acceleration: 200,
        braking: 400,
        turnSpeed: 2.5,       // radians/sec
        drag: 100,
        health: 200,
        width: 20,
        height: 36,
        seats: 4,
        color: 0x3388cc,
        fuelMax: 100,
        fuelRate: 0.05,       // fuel per frame at full throttle
    },
    TRUCK: {
        id: 'truck',
        name: 'PICKUP',
        maxSpeed: 280,
        acceleration: 140,
        braking: 300,
        turnSpeed: 1.8,
        drag: 120,
        health: 400,
        width: 24,
        height: 44,
        seats: 2,
        color: 0x666666,
        fuelMax: 150,
        fuelRate: 0.08,
    },
    BIKE: {
        id: 'bike',
        name: 'DIRT BIKE',
        maxSpeed: 420,
        acceleration: 300,
        braking: 350,
        turnSpeed: 3.5,
        drag: 80,
        health: 80,
        width: 10,
        height: 24,
        seats: 1,
        color: 0xcc3333,
        fuelMax: 60,
        fuelRate: 0.03,
    },
};

export const ALL_VEHICLES = Object.values(VEHICLE);
