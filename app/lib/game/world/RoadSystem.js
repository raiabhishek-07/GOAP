// ============================================================
// RoadSystem.js — Realistic Curved Road Generation
// Creates natural-looking roads with curves, cracks, and details
// ============================================================

export class RoadSystem {
    constructor(scene) {
        this.scene = scene;
        this.roadSegments = new Map();
        this.roadMeshes = new Map();
        this.roadDetails = new Map();
        
        // Road configuration
        this.roadWidth = 40;
        this.roadTypes = {
            highway: { width: 60, lanes: 4, detail: 'high' },
            main: { width: 40, lanes: 2, detail: 'medium' },
            secondary: { width: 30, lanes: 2, detail: 'low' },
            dirt: { width: 20, lanes: 1, detail: 'minimal' }
        };
        
        // Road materials
        this.materials = {
            asphalt: { base: 0x333333, line: 0xffffff, crack: 0x222222 },
            concrete: { base: 0x666666, line: 0xffffff, crack: 0x555555 },
            dirt: { base: 0x8b7355, line: 0x9b8365, crack: 0x7b6345 },
            gravel: { base: 0x888888, line: 0x999999, crack: 0x777777 }
        };
    }

    // ═══════════════════════════════════════════════════════
    // ROAD GENERATION
    // ═══════════════════════════════════════════════════════

    /**
     * Generate curved road between two points
     */
    generateRoad(startX, startY, endX, endY, config = {}) {
        const roadType = config.type || 'main';
        const material = config.material || 'asphalt';
        const roadId = `${startX},${startY}-${endX},${endY}`;
        
        // Check if road already exists
        if (this.roadSegments.has(roadId)) {
            return this.roadSegments.get(roadId);
        }
        
        // Generate control points for curved road
        const controlPoints = this._generateCurvePoints(startX, startY, endX, endY, config);
        
        // Create road mesh
        const roadMesh = this._createRoadMesh(controlPoints, roadType, material);
        
        // Add road details
        this._addRoadDetails(roadMesh, controlPoints, roadType, material);
        
        // Store road segment
        const roadSegment = {
            id: roadId,
            points: controlPoints,
            mesh: roadMesh,
            type: roadType,
            material: material,
            config: config
        };
        
        this.roadSegments.set(roadId, roadSegment);
        this.roadMeshes.set(roadId, roadMesh);
        
        return roadSegment;
    }

    /**
     * Generate road network connecting multiple points
     */
    generateRoadNetwork(points, config = {}) {
        const network = [];
        
        // Generate minimum spanning tree for efficient road network
        const connections = this._generateRoadConnections(points);
        
        // Create roads for each connection
        connections.forEach(([start, end]) => {
            const road = this.generateRoad(
                points[start].x, points[start].y,
                points[end].x, points[end].y,
                config
            );
            network.push(road);
        });
        
        return network;
    }

    /**
     * Generate curved control points using Bezier curves
     */
    _generateCurvePoints(startX, startY, endX, endY, config) {
        const points = [];
        const segments = config.segments || 20;
        const curvature = config.curvature || 0.3;
        
        // Calculate control points for Bezier curve
        const midX = (startX + endX) / 2;
        const midY = (startY + endY) / 2;
        
        // Add perpendicular offset for curve
        const dx = endX - startX;
        const dy = endY - startY;
        const perpX = -dy * curvature;
        const perpY = dx * curvature;
        
        const controlX = midX + perpX;
        const controlY = midY + perpY;
        
        // Generate points along the curve
        for (let t = 0; t <= 1; t += 1 / segments) {
            const x = this._bezierPoint(startX, controlX, endX, t);
            const y = this._bezierPoint(startY, controlY, endY, t);
            points.push({ x, y, t });
        }
        
        return points;
    }

    /**
     * Bezier curve calculation
     */
    _bezierPoint(p0, p1, p2, t) {
        return (1 - t) * (1 - t) * p0 + 2 * (1 - t) * t * p1 + t * t * p2;
    }

    /**
     * Create road mesh from control points
     */
    _createRoadMesh(points, roadType, material) {
        const roadConfig = this.roadTypes[roadType];
        const materialConfig = this.materials[material];
        const roadContainer = this.scene.add.container(0, 0);
        
        // Generate road surface
        const roadSurface = this._createRoadSurface(points, roadConfig.width, materialConfig);
        roadContainer.add(roadSurface);
        
        // Generate road markings
        const markings = this._createRoadMarkings(points, roadConfig, materialConfig);
        roadContainer.add(markings);
        
        // Generate road edges
        const edges = this._createRoadEdges(points, roadConfig.width, materialConfig);
        roadContainer.add(edges);
        
        // Set depth based on average Y position
        const avgY = points.reduce((sum, p) => sum + p.y, 0) / points.length;
        roadContainer.setDepth(Math.floor(avgY * 0.1) * 1000 + 150);
        
        return roadContainer;
    }

    /**
     * Create road surface with texture
     */
    _createRoadSurface(points, width, material) {
        const surface = this.scene.add.graphics();
        
        // Build road polygon from points
        const polygon = [];
        
        points.forEach((point, index) => {
            // Calculate perpendicular vector for road width
            if (index < points.length - 1) {
                const nextPoint = points[index + 1];
                const dx = nextPoint.x - point.x;
                const dy = nextPoint.y - point.y;
                const length = Math.sqrt(dx * dx + dy * dy);
                const perpX = (-dy / length) * width / 2;
                const perpY = (dx / length) * width / 2;
                
                // Add left and right edge points
                polygon.push({ x: point.x - perpX, y: point.y - perpY });
            }
        });
        
        // Add right edge points in reverse order
        for (let i = points.length - 1; i >= 0; i--) {
            const point = points[i];
            if (i > 0) {
                const prevPoint = points[i - 1];
                const dx = point.x - prevPoint.x;
                const dy = point.y - prevPoint.y;
                const length = Math.sqrt(dx * dx + dy * dy);
                const perpX = (-dy / length) * width / 2;
                const perpY = (dx / length) * width / 2;
                
                polygon.push({ x: point.x + perpX, y: point.y + perpY });
            }
        }
        
        // Draw filled polygon
        surface.fillStyle(material.base, 0.9);
        surface.fillPoints(polygon);
        
        // Add texture variation
        this._addRoadTexture(surface, polygon, material);
        
        return surface;
    }

    /**
     * Create road markings (lane lines, center lines)
     */
    _createRoadMarkings(points, roadConfig, material) {
        const markings = this.scene.add.graphics();
        
        if (roadConfig.lanes >= 2) {
            // Center line (dashed)
            this._drawDashedLine(markings, points, 2, material.line, 10, 5);
        }
        
        if (roadConfig.lanes >= 4) {
            // Lane divider lines
            const offset = roadConfig.width / 4;
            this._drawParallelLine(markings, points, offset, 1, material.line, true);
            this._drawParallelLine(markings, points, -offset, 1, material.line, true);
        }
        
        return markings;
    }

    /**
     * Create road edges with blending
     */
    _createRoadEdges(points, width, material) {
        const edges = this.scene.add.graphics();
        
        // Create soft edge blending
        points.forEach((point, index) => {
            if (index < points.length - 1) {
                const nextPoint = points[index + 1];
                const dx = nextPoint.x - point.x;
                const dy = nextPoint.y - point.y;
                const length = Math.sqrt(dx * dx + dy * dy);
                const perpX = (-dy / length) * width / 2;
                const perpY = (dx / length) * width / 2;
                
                // Draw edge lines with lower opacity for blending
                edges.lineStyle(3, material.crack, 0.3);
                edges.lineBetween(
                    point.x - perpX, point.y - perpY,
                    nextPoint.x - perpX, nextPoint.y - perpY
                );
                edges.lineBetween(
                    point.x + perpX, point.y + perpY,
                    nextPoint.x + perpX, nextPoint.y + perpY
                );
            }
        });
        
        return edges;
    }

    /**
     * Add road details (cracks, dirt, wear)
     */
    _addRoadDetails(roadMesh, points, roadType, material) {
        const details = this.scene.add.container(0, 0);
        
        if (roadConfig.detail === 'minimal') return details;
        
        // Add cracks along the road
        const crackCount = Math.floor(points.length / 10);
        for (let i = 0; i < crackCount; i++) {
            const pointIndex = Math.floor(Math.random() * points.length);
            const point = points[pointIndex];
            const crack = this._createCrack(point.x, point.y, material);
            details.add(crack);
        }
        
        // Add oil stains and dirt patches
        const stainCount = Math.floor(points.length / 15);
        for (let i = 0; i < stainCount; i++) {
            const pointIndex = Math.floor(Math.random() * points.length);
            const point = points[pointIndex];
            const stain = this._createStain(point.x, point.y, material);
            details.add(stain);
        }
        
        // Add shoulder details
        if (roadConfig.detail === 'high') {
            this._addShoulderDetails(details, points, roadConfig.width, material);
        }
        
        roadMesh.add(details);
        return details;
    }

    // ═══════════════════════════════════════════════════════
    // ROAD UTILITIES
    // ═══════════════════════════════════════════════════════

    /**
     * Generate minimum spanning tree for road network
     */
    _generateRoadConnections(points) {
        const connections = [];
        const visited = new Set([0]);
        const unvisited = new Set();
        
        // Initialize unvisited set
        for (let i = 1; i < points.length; i++) {
            unvisited.add(i);
        }
        
        // Connect points using minimum distance
        while (unvisited.size > 0) {
            let minDistance = Infinity;
            let minConnection = null;
            
            visited.forEach(visitedIndex => {
                unvisited.forEach(unvisitedIndex => {
                    const distance = this._calculateDistance(
                        points[visitedIndex], points[unvisitedIndex]
                    );
                    if (distance < minDistance) {
                        minDistance = distance;
                        minConnection = [visitedIndex, unvisitedIndex];
                    }
                });
            });
            
            if (minConnection) {
                connections.push(minConnection);
                visited.add(minConnection[1]);
                unvisited.delete(minConnection[1]);
            }
        }
        
        return connections;
    }

    /**
     * Draw dashed line along road
     */
    _drawDashedLine(graphics, points, width, color, dashLength, gapLength) {
        let currentDistance = 0;
        let drawing = true;
        
        for (let i = 0; i < points.length - 1; i++) {
            const start = points[i];
            const end = points[i + 1];
            const segmentLength = this._calculateDistance(start, end);
            
            let segmentProgress = 0;
            
            while (segmentProgress < segmentLength) {
                const remainingDash = drawing ? dashLength - currentDistance : gapLength - currentDistance;
                const segmentEnd = Math.min(segmentProgress + remainingDash, segmentLength);
                
                if (drawing) {
                    const startX = start.x + (end.x - start.x) * (segmentProgress / segmentLength);
                    const startY = start.y + (end.y - start.y) * (segmentProgress / segmentLength);
                    const endX = start.x + (end.x - start.x) * (segmentEnd / segmentLength);
                    const endY = start.y + (end.y - start.y) * (segmentEnd / segmentLength);
                    
                    graphics.lineStyle(width, color, 0.8);
                    graphics.lineBetween(startX, startY, endX, endY);
                }
                
                const progress = segmentEnd - segmentProgress;
                segmentProgress = segmentEnd;
                currentDistance += progress;
                
                if (currentDistance >= (drawing ? dashLength : gapLength)) {
                    drawing = !drawing;
                    currentDistance = 0;
                }
            }
        }
    }

    /**
     * Draw parallel line offset from main road
     */
    _drawParallelLine(graphics, points, offset, width, color, dashed = false) {
        const linePoints = [];
        
        points.forEach((point, index) => {
            if (index < points.length - 1) {
                const nextPoint = points[index + 1];
                const dx = nextPoint.x - point.x;
                const dy = nextPoint.y - point.y;
                const length = Math.sqrt(dx * dx + dy * dy);
                const perpX = (-dy / length) * offset;
                const perpY = (dx / length) * offset;
                
                linePoints.push({ x: point.x + perpX, y: point.y + perpY });
            }
        });
        
        if (dashed) {
            this._drawDashedLine(graphics, linePoints, width, color, 8, 4);
        } else {
            graphics.lineStyle(width, color, 0.6);
            for (let i = 0; i < linePoints.length - 1; i++) {
                graphics.lineBetween(
                    linePoints[i].x, linePoints[i].y,
                    linePoints[i + 1].x, linePoints[i + 1].y
                );
            }
        }
    }

    /**
     * Add texture variation to road surface
     */
    _addRoadTexture(surface, polygon, material) {
        // Add subtle texture variation
        for (let i = 0; i < 20; i++) {
            const x = polygon[0].x + Math.random() * 100 - 50;
            const y = polygon[0].y + Math.random() * 100 - 50;
            const size = Math.random() * 5 + 2;
            
            surface.fillStyle(material.crack, 0.1);
            surface.fillCircle(x, y, size);
        }
    }

    /**
     * Create crack detail
     */
    _createCrack(x, y, material) {
        const crack = this.scene.add.graphics();
        crack.lineStyle(1, material.crack, 0.6);
        
        // Generate random crack pattern
        const points = [];
        let currentX = x;
        let currentY = y;
        
        for (let i = 0; i < 5; i++) {
            points.push({ x: currentX, y: currentY });
            currentX += (Math.random() - 0.5) * 10;
            currentY += Math.random() * 5 + 2;
        }
        
        // Draw crack
        for (let i = 0; i < points.length - 1; i++) {
            crack.lineBetween(points[i].x, points[i].y, points[i + 1].x, points[i + 1].y);
        }
        
        return crack;
    }

    /**
     * Create stain detail
     */
    _createStain(x, y, material) {
        const stain = this.scene.add.circle(x, y, Math.random() * 8 + 4, 0x333333, 0.3);
        return stain;
    }

    /**
     * Add shoulder details (gravel, grass, etc.)
     */
    _addShoulderDetails(container, points, width, material) {
        points.forEach((point, index) => {
            if (index % 3 === 0) { // Add details every third point
                const shoulderLeft = this.scene.add.circle(
                    point.x - width / 2 - 5,
                    point.y,
                    3,
                    0x666666,
                    0.4
                );
                const shoulderRight = this.scene.add.circle(
                    point.x + width / 2 + 5,
                    point.y,
                    3,
                    0x666666,
                    0.4
                );
                
                container.add(shoulderLeft);
                container.add(shoulderRight);
            }
        });
    }

    /**
     * Calculate distance between two points
     */
    _calculateDistance(p1, p2) {
        return Math.sqrt((p2.x - p1.x) ** 2 + (p2.y - p1.y) ** 2);
    }

    // ═══════════════════════════════════════════════════════
    // ROAD UPDATES
    // ═══════════════════════════════════════════════════════

    /**
     * Update road appearance based on time of day
     */
    updateLighting(timeOfDay) {
        const config = this.getLightingConfig(timeOfDay);
        
        this.roadMeshes.forEach(mesh => {
            mesh.setTint(config.tint);
            mesh.setAlpha(config.intensity);
        });
    }

    getLightingConfig(timeOfDay) {
        const hour = timeOfDay % 24;
        
        if (hour >= 6 && hour < 8) {
            return { tint: 0xffddaa, intensity: 0.8 };
        } else if (hour >= 8 && hour < 17) {
            return { tint: 0xffffff, intensity: 1.0 };
        } else if (hour >= 17 && hour < 19) {
            return { tint: 0xffaa88, intensity: 0.7 };
        } else {
            return { tint: 0x4466aa, intensity: 0.4 };
        }
    }

    /**
     * Add road damage (potholes, cracks)
     */
    addRoadDamage(x, y, type = 'pothole') {
        const damage = this.scene.add.circle(x, y, 8, 0x222222, 0.8);
        this.roadDetails.add(damage);
        
        // Add to all road meshes for proper layering
        this.roadMeshes.forEach(mesh => {
            mesh.add(damage);
        });
        
        return damage;
    }

    // ═══════════════════════════════════════════════════════
    // CLEANUP
    // ═══════════════════════════════════════════════════════

    /**
     * Clean up road system
     */
    destroy() {
        this.roadSegments.clear();
        this.roadMeshes.clear();
        this.roadDetails.clear();
    }
}
