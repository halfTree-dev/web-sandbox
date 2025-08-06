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
}
