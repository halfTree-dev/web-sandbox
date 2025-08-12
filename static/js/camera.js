class Camera {
    /**
     * 创建摄像机对象
     * @param {Object} pos
     * @param {number} scale
     * @param {Object} drawRange
     * @param {Object} cameraRange
     * @returns {Camera}
     */
    constructor(pos, scale, drawRange, cameraRange) {
        this.pos = pos || { x: 0, y: 0 };
        this.scale = scale || 1;
        this.drawRange = drawRange || { width: 800, height: 600 };
        this.cameraRange = cameraRange || { width: 800, height: 600 };

        this.drawList = [];
    }

    addDrawObject(drawObject) {
        this.drawList.push(drawObject);
    }

    setDrawRangeByCanvas(canvas) {
        if (canvas) {
            this.drawRange.width = canvas.width;
            this.drawRange.height = canvas.height;
            this.cameraRange.width = canvas.width;
            this.cameraRange.height = canvas.height;
        }
    }

    returnScalePos(targetPos) {
        const swiftPos = {
            x: targetPos.x - this.pos.x,
            y: targetPos.y - this.pos.y
        };
        const halfCamera = {
            x: this.cameraRange.width / 2 / this.scale,
            y: this.cameraRange.height / 2 / this.scale
        };
        const swiftRatio = {
            x: swiftPos.x / halfCamera.x,
            y: swiftPos.y / halfCamera.y
        };
        const screenDrawCenter = {
            x: this.drawRange.width / 2,
            y: this.drawRange.height / 2
        };
        return {
            x: screenDrawCenter.x + (this.drawRange.width * swiftRatio.x) / 2,
            y: screenDrawCenter.y + (this.drawRange.height * swiftRatio.y) / 2
        };
    }

    returnPointerPos(pointerPos) {
        const screenDrawCenter = {
            x: this.drawRange.width / 2,
            y: this.drawRange.height / 2
        };
        const swiftPos = {
            x: pointerPos.x - screenDrawCenter.x,
            y: pointerPos.y - screenDrawCenter.y
        };
        const halfScreen = {
            x: this.drawRange.width / 2,
            y: this.drawRange.height / 2
        };
        const swiftRatio = {
            x: swiftPos.x / halfScreen.x,
            y: swiftPos.y / halfScreen.y
        };
        return {
            x: this.pos.x + (this.cameraRange.width / 2) * swiftRatio.x / this.scale,
            y: this.pos.y + (this.cameraRange.height / 2) * swiftRatio.y / this.scale
        };
    }

    drawAllObjects(ctx) {
        this.drawList.sort((a, b) => {
            if (a.layer !== b.layer) {
                return a.layer - b.layer;
            }
            return a.posY - b.posY;
        });
        this.drawList.forEach(obj => {
            const drawPos = this.returnScalePos({ x: obj.posX, y: obj.posY });
            ctx.save();

            ctx.translate(drawPos.x, drawPos.y);
            ctx.rotate(obj.angle);
            ctx.scale(obj.horFlip ? -obj.scaleX : obj.scaleX,
                obj.verFlip ? -obj.scaleY : obj.scaleY
            );

            obj.currFrame = obj.currFrame % (obj.rows * obj.columns);
            const sourceWidth = obj.image.width / obj.columns;
            const sourceHeight = obj.image.height / obj.rows;
            const sourceX = (obj.currFrame % obj.columns) * sourceWidth;
            const sourceY = Math.floor(obj.currFrame / obj.columns) * sourceHeight;

            ctx.drawImage(obj.image, sourceX, sourceY, sourceWidth, sourceHeight,
                -obj.anchorX * this.scale, -obj.anchorY * this.scale, sourceWidth * this.scale, sourceHeight * this.scale);

            ctx.restore();
        });
        this.drawList = [];
    }
}

class DrawObject {
    constructor(image, posX, posY,
        rows=1, columns=1, currFrame=0,
        anchorX=0, anchorY=0,
        scaleX=1, scaleY=1, angle=0, layer=1,
        horFlip=false, verFlip=false) {
        this.image = image;
        this.posX = posX;
        this.posY = posY;
        this.rows = rows;
        this.columns = columns;
        this.currFrame = currFrame;
        this.anchorX = anchorX;
        this.anchorY = anchorY;
        this.scaleX = scaleX;
        this.scaleY = scaleY;
        this.angle = angle;
        this.layer = layer;
        this.horFlip = horFlip;
        this.verFlip = verFlip;
    }
}