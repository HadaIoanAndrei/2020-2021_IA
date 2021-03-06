class WallMerger {

    private static _instance: WallMerger;

    private constructor() {
    }

    public static getInstance(): WallMerger {
        if (!WallMerger._instance) WallMerger._instance = new WallMerger();
        return WallMerger._instance;
    }

    readonly angleEpsilon = 0.5; //A value in radians that represents the acceptable user error of a wall placed on top of another
    readonly distanceEpsilon = 15 // A value that represents the acceptable distance from 2 non touching lines that should still be merged

    /**
     * Returns the cos of the angle between 2 walls
     *
     * @param firstWall
     * @param secondWall
     * @private
     */
    private _calculateCosOfAngleBetween2Walls(firstWall, secondWall) {
        const magnitudeProduct = this._calculateWallMagnitude(firstWall) * this._calculateWallMagnitude(secondWall);
        return this._calculateDotProduct(firstWall, secondWall) / magnitudeProduct;
    }

    /**
     * Calculates the magnitude based on a line equation
     *
     * @param wallEquation
     * @private
     */
    private _calculateWallMagnitude(wallEquation: number[]) {
        return Math.sqrt(Math.pow(wallEquation[0], 2) + Math.pow(wallEquation[1], 2))
    }

    /**
     * Calculates the dot product between 2 walls
     *
     * @param firstWall
     * @param secondWall
     * @private
     */
    private _calculateDotProduct(firstWall: number[], secondWall: number[]): number {
        return firstWall[0] * secondWall[0] + firstWall[1] * secondWall[1];
    }

    /**
     * returns the line's equation based on coords
     * @example ai + bj = 0 => [a,b]
     *
     * @param wallCoords
     * @private
     */
    private _makeNormalVectorForAWall(wallCoords: number[]): number[] {
        return [wallCoords[2] - wallCoords[0], wallCoords[3] - wallCoords[1]]
    }

    /**
     * Part 2 of the calculation I stole from stackOverFlow that I do not really understand
     *
     * @param A - first point coords
     * @param B - second point coords
     * @param C - third point coords
     * @private
     */
    private ccw(A: number[], B: number[], C: number[]): boolean {
        return (C[1] - A[1]) * (B[0] - A[0]) > (B[1] - A[1]) * (C[0] - A[0])
    }

    /**
     * Some function that checks intersection of 2 lines I stole from stackOverFlow, I have no idea how it works
     *
     * @param firstWall - coords of the first wall
     * @param secondWall- coords of the second wall
     * @private
     */
    private _checkIntersection(firstWall: number[], secondWall: number[]): boolean {
        const A = [firstWall[0], firstWall[1]];
        const B = [firstWall[2], firstWall[3]];
        const C = [secondWall[0], secondWall[1]];
        const D = [secondWall[2], secondWall[3]];
        return (this.ccw(A, C, D) != this.ccw(B, C, D) && this.ccw(A, B, C) != this.ccw(A, B, D))
    }

    /**
     * Returns true if the target wall isn't linked with main wall
     *
     * @param mainWall
     * @param currentWall
     * @private
     */
    private _shouldIMerge(mainWall: any, currentWall: any): boolean {
        const linkedSegments = mainWall.getLinkedSegments().walls;
        for (const segment of linkedSegments) {
            if (segment === currentWall) return false;
        }
        return true;
    }

    /**
     * Checks if the targetPoint is between the first and second points
     *
     * @param firstPoint - first point
     * @param secondPoint - second point
     * @param targetPoint - the point that is checked
     * @private
     */
    private _isBetween(firstPoint, secondPoint, targetPoint): boolean {
        const crossProduct = (targetPoint[1] - firstPoint[1]) * (secondPoint[0] - firstPoint[0]) - (targetPoint[0] - firstPoint[0]) * (secondPoint[1] - firstPoint[1]);
        if (Math.abs(crossProduct) !== 0) return false;

        const dotProduct = (targetPoint[0] - firstPoint[0]) * (secondPoint[0] - firstPoint[0]) + (targetPoint[1] - firstPoint[1]) * (secondPoint[1] - firstPoint[1]);
        if (dotProduct < 0) return false;

        const squaredLength = Math.pow(secondPoint[0] - firstPoint[0], 2) + Math.pow(secondPoint[1] - firstPoint[1], 2);
        return dotProduct <= squaredLength;
    }

    /**
     * Calculates the distance between 2 points
     *
     * @param firstPoint
     * @param secondPoint
     * @private
     */
    private _distance2(firstPoint: [number, number], secondPoint: [number, number]): number {
        return Math.pow(firstPoint[0] - secondPoint[0], 2) + Math.pow(firstPoint[1] - secondPoint[1], 2);
    }

    /**
     * Calculates the square of the distance from a point to a line
     *
     * @param targetPoint - the point to calculate the distance from
     * @param firstPointOfLine
     * @param secondPointOfLine
     * @private
     */
    private _distToSegmentSquared(targetPoint: [number, number], firstPointOfLine: [number, number], secondPointOfLine: [number, number]): number {
        const l2 = this._distance2(firstPointOfLine, secondPointOfLine);
        if (l2 === 0) return this._distance2(targetPoint, firstPointOfLine);
        let t = ((targetPoint[0] - firstPointOfLine[0]) * (secondPointOfLine[0] - firstPointOfLine[0]) + (targetPoint[1] - firstPointOfLine[1]) * (secondPointOfLine[1] - firstPointOfLine[1])) / l2;
        t = Math.max(0, Math.min(1, t));
        return this._distance2(targetPoint, [firstPointOfLine[0] + t * (secondPointOfLine[0] - firstPointOfLine[0]), firstPointOfLine[1] + t * (secondPointOfLine[1] - firstPointOfLine[1])]);
    }

    /**
     * Calculates the distance from a point to a line
     *
     * @param targetPoint - the point to calculate the distance from
     * @param firstPointOfLine
     * @param secondPointOfLine
     * @private
     */
    private _distanceToSegment(targetPoint: [number, number], firstPointOfLine: [number, number], secondPointOfLine: [number, number]): number {
        return Math.sqrt(this._distToSegmentSquared(targetPoint, firstPointOfLine, secondPointOfLine));
    }

    /**
     * Decides if 2 non-linked walls should be merged
     *
     * @param targetWall - wall to merge
     * @param mainWall - main wall to merge into
     * @param angleBetweenWalls - angle between the walls in radians
     * @private
     */
    private _shouldAddToList(targetWall: number[], mainWall: number[], angleBetweenWalls: number): boolean {
        const mainLineFirstPoint: [number, number] = [mainWall[0], mainWall[1]];
        const mainLineSecondPoint: [number, number] = [mainWall[2], mainWall[3]];
        const wallFirstPoint: [number, number] = [targetWall[0], targetWall[1]];
        const wallSecondPoint: [number, number] = [targetWall[2], targetWall[3]];

        if (this._checkIntersection(mainWall, targetWall) && angleBetweenWalls < this.angleEpsilon) return true;

        else if (this._isBetween(mainLineFirstPoint, mainLineSecondPoint, wallFirstPoint)) return true;

        else if (this._isBetween(mainLineFirstPoint, mainLineSecondPoint, wallSecondPoint)) return true;

        else if (this._distanceToSegment(wallFirstPoint, mainLineFirstPoint, mainLineSecondPoint) < this.distanceEpsilon &&
            this._distanceToSegment(wallSecondPoint, mainLineFirstPoint, mainLineSecondPoint) < this.distanceEpsilon) return true;

        return false;
    }

    /**
     * Returns a list of the walls that are overlapping with a main wall
     *
     * @param mainWallCoords - point values of the main wall
     * @param mainWall - main wall structure
     * @private
     */
    private _findOverlappingWalls(mainWallCoords: any, mainWall: any) {
        const walls = canvas.walls.objects.children;
        const mainWallEquation = this._makeNormalVectorForAWall(mainWallCoords);
        let toMergeList = [];

        walls.forEach((wall) => {
            if (!this._shouldIMerge(mainWall, wall)) return;
            const wallCoords = wall.data.c;
            const wallEquation = this._makeNormalVectorForAWall(wallCoords);
            const angleBetweenWalls = Math.acos(this._calculateCosOfAngleBetween2Walls(mainWallEquation, wallEquation))
            if (this._shouldAddToList(wallCoords, mainWallCoords, angleBetweenWalls)) toMergeList.push(wall);
        })

        return toMergeList;
    }

    /**
     * Here is another function that I cannot understand. If for some reason I have to touch this again, I will not.
     * This function has been sent by God, or by his real name @MBo on stackOverFlow, since it is made by God I cannot question him
     * So I do not dare edit this code.
     *
     * @param line - base line
     * @param point - point to be projected
     * @private
     */
    private _findProjectionOfPointsOnALine(line: number[], point: [number, number]): [number, number] {
        const CF = ((line[2] - line[0]) * (point[0] - line[0]) + (line[3] - line[1]) * (point[1] - line[1])) / (Math.pow(line[2] - line[0], 2) + Math.pow(line[3] - line[1], 2))
        return [Math.floor(line[0] + (line[2] - line[0]) * CF), Math.floor(line[1] + (line[3] - line[1]) * CF)];
    }

    /**
     * Checks in the worst way if two objects are equivalent
     *
     * @param a - first object
     * @param b - second object
     * @private
     */
    private _isEquivalent(a: any, b: any) {
        const aProps = Object.getOwnPropertyNames(a);
        const bProps = Object.getOwnPropertyNames(b);

        if (aProps.length !== bProps.length) {
            return false;
        }
        for (let i = 0; i < aProps.length; i++) {
            const propName = aProps[i];

            if (a[propName] !== b[propName]) {
                return false;
            }
        }
        return true;
    }

    /**
     * Creates new walls from a list of points
     *
     * @param pointsArray - a list of points
     * @param mainWallData - the data of the support wall
     * @private
     */
    private async _createNewWallFromPointsArray(pointsArray: any, mainWallData: any): Promise<void> {
        let wallData;
        for (let index = 0; index < pointsArray.length - 1; index++) {
            this._isEquivalent(pointsArray[index].data, pointsArray[index + 1].data) ? wallData = pointsArray[index].data : wallData = mainWallData;
            // @ts-ignore
            await Wall.create({
                c: pointsArray[index].c.concat(pointsArray[index + 1].c),
                ...wallData
            })
        }
    }

    /**
     * Creates an object for each point of the new line
     *
     * @param pointCoords - coordinates of the point
     * @param pointData - the data of the point
     * @private
     */
    private createPointObject(pointCoords: [number, number], pointData: any): any {
        const returnObject = {
            c: pointCoords,
            data: {
                ...pointData
            }
        }
        delete returnObject.data.c;
        delete returnObject.data._id;
        return returnObject;
    }

    /**
     * I was very high on coffee, I have no idee what the fuck does this do
     *
     * @param mainWall - the main wall object
     */
    public async mergeWalls(mainWall: any) {
        const wallsToMerge = this._findOverlappingWalls(mainWall.data.c, mainWall);
        const projectedPoints = [];

        projectedPoints.push(this.createPointObject([mainWall.data.c[0], mainWall.data.c[1]], mainWall.data));
        projectedPoints.push(this.createPointObject([mainWall.data.c[2], mainWall.data.c[3]], mainWall.data));

        const mainWallData = projectedPoints[0].data;

        for (const wall of wallsToMerge) {
            const firstPoint = this._findProjectionOfPointsOnALine(mainWall.data.c, [wall.data.c[0], wall.data.c[1]]);
            projectedPoints.push(this.createPointObject(firstPoint, wall.data));

            const secondPoint = this._findProjectionOfPointsOnALine(mainWall.data.c, [wall.data.c[2], wall.data.c[3]]);
            projectedPoints.push(this.createPointObject(secondPoint, wall.data));

            await wall.delete();
        }

        projectedPoints.sort((a, b): number => {
            if (a.c[0] === b.c[0]) return a.c[1] - b.c[1];
            return a.c[0] - b.c[0];
        });

        mainWall.release();
        await mainWall.delete();
        await this._createNewWallFromPointsArray(projectedPoints, mainWallData);
    }
}

export default WallMerger.getInstance();