const keyState = {};

// 检查是否聚焦在聊天输入框
function isChatFocused() {
    const messageInput = document.getElementById('message');
    return document.activeElement === messageInput;
}

// 监听按键按下事件
window.addEventListener('keydown', (event) => {
    if (isChatFocused()) return; // 如果聚焦在聊天框中，忽略按键检测

    const key = event.key.toLowerCase();
    if (!keyState[key]) {
        keyState[key] = true;
        socket.send(JSON.stringify({
            type: 'keyboard',
            key: key,
            down: true
        }));
    }
    if (key === 't') {
        toggleChatboxVisibility();
    }
    if (key === 'escape') {
        updateMenuData();
        toggleMenuVisibility();
    }
});

// 监听按键松开事件
window.addEventListener('keyup', (event) => {
    if (isChatFocused()) return; // 如果聚焦在聊天框中，忽略按键检测

    const key = event.key.toLowerCase();
    if (keyState[key]) {
        keyState[key] = false;
        socket.send(JSON.stringify({
            type: 'keyboard',
            key: key,
            down: false
        }));
    }
});

let mousePosition = { x: 0, y: 0 };
let mousePositionInWorld = { x: 0, y: 0 };

document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('gameCanvas');
    if (!canvas) return;
    // 监听鼠标移动事件
    canvas.addEventListener('mousemove', (event) => {
        getMouseOnCanvas(canvas, event);
        updateMousePositionInWorld(camera);
    });
    // 监听鼠标点击事件
    canvas.addEventListener('mousedown', (event) => {
        getMouseOnCanvas(canvas, event);
        if (event.button !== 0) {
            event.preventDefault();
        }
        socket.send(JSON.stringify({
            type: 'mouse',
            button: event.button,
            down: true
        }));
    });
    canvas.addEventListener('mouseup', (event) => {
        getMouseOnCanvas(canvas, event);
        if (event.button !== 0) {
            event.preventDefault();
        }
        socket.send(JSON.stringify({
            type: 'mouse',
            button: event.button,
            down: false
        }));
    });
    canvas.addEventListener('contextmenu', (event) => {
        event.preventDefault();
    });
    canvas.addEventListener('wheel', (event) => {
        event.preventDefault();
        const direction = event.deltaY < 0 ? 'up' : 'down';
        socket.send(JSON.stringify({
            type: 'mouse',
            button: 3,
            direction: direction
        }));
    });
});

function getMouseOnCanvas(canvas, event) {
    const rect = canvas.getBoundingClientRect();
    mousePosition.x = event.clientX - rect.left;
    mousePosition.y = event.clientY - rect.top;
}

function updateMousePositionInWorld(camera) {
    mousePositionInWorld = camera.returnPointerPos(mousePosition);
}

/**
 * 获取鼠标指向的瓦片坐标
 * @returns {Object} - 包含字段 x 和 y，表示坐标
 */
function getMouseAimingTile() {
    const tileX = Math.floor((mousePositionInWorld.x + TILE_WIDTH / 2) / TILE_WIDTH);
    const tileY = Math.floor((mousePositionInWorld.y + TILE_HEIGHT / 2) / TILE_HEIGHT);
    return { x: tileX, y: tileY };
}

let lastmousePositionInWorld = mousePositionInWorld;

setInterval(() => {
    if (
        mousePositionInWorld.x !== lastmousePositionInWorld.x ||
        mousePositionInWorld.y !== lastmousePositionInWorld.y
    ) {
        socket.send(JSON.stringify({
            type: 'mouse_pos',
            x: mousePositionInWorld.x,
            y: mousePositionInWorld.y
        }));
        lastmousePositionInWorld = { ...mousePositionInWorld };
    }
}, 50);
