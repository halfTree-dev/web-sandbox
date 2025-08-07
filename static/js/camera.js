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
            return (a.posY + a.sizeY) - (b.posY + b.sizeY);
        });
        this.drawList.forEach(obj => {
            const drawPos = this.returnScalePos({ x: obj.posX, y: obj.posY });
            ctx.save();
            ctx.globalAlpha = 1 - obj.transparency;
            if (obj.angle !== 0) {
                ctx.translate(drawPos.x + obj.sizeX * this.scale / 2, drawPos.y + obj.sizeY * this.scale / 2);
                ctx.rotate(obj.angle);
                ctx.drawImage(
                    obj.image,
                    -obj.sizeX * this.scale / 2,
                    -obj.sizeY * this.scale / 2,
                    obj.sizeX * this.scale,
                    obj.sizeY * this.scale
                );
            } else {
                ctx.drawImage(
                    obj.image,
                    drawPos.x,
                    drawPos.y,
                    obj.sizeX * this.scale,
                    obj.sizeY * this.scale
                );
            }
            ctx.restore();
        });
        this.drawList = [];
    }
}

class DrawObject {
    constructor(image, posX, posY, sizeX=-1, sizeY=-1, angle=0, layer=1) {
        this.image = image;
        this.posX = posX;
        this.posY = posY;
        if (sizeX === -1 || sizeY === -1) {
            this.sizeX = this.image.width;
            this.sizeY = this.image.height;
        }
        else {
            this.sizeX = sizeX;
            this.sizeY = sizeY;
        }
        this.angle = angle;
        this.layer = layer;
        this.transparency = 0;
    }
}