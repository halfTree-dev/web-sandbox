// 创建 WebSocket 连接
const socket = new WebSocket(`ws://${window.location.host}`);
const log = document.getElementById('log');

// 连接打开时触发
socket.addEventListener('open', () => {
    logMessage('已连接服务器');
});



// 接收消息时触发
socket.addEventListener('message', (event) => {
    try {
        const data = JSON.parse(event.data); // 尝试解析为 JSON
        if (data.type) {
            switch (data.type) {
                case 'login_callback':
                    if (data.success) {
                        loginSuccessCallback();
                    } else {
                        loginFailedCallback(data.reason);
                    }
                    break;

                case 'join_level_callback':
                    if (data.success) {
                        logMessage(`成功加入地图: ${data.info}`);
                    } else {
                        logMessage(`加入地图失败: ${data.info}`);
                    }
                    break;

                case 'server_info':
                    lobbyInfoCallback(data);
                    break;

                case 'chat':
                    logMessage(`<${data.player_name}> ${data.content}`);
                    break;

                case 'global_sync':
                    logMessage(`收到来自主机的同步消息：${data.player_id}`);
                    syncGlobalLevel(data);
                    break;

                case 'update_player':
                    updatePlayer(data.player);
                    break;

                case 'update_tile':
                    updateTile(data.chunkX, data.chunkY, data.tile);
                    break;

                default:
                    logMessage(`[未知类型] 收到未知类型的消息: ${data.type}`);
                    break;
            }
        } else {
            logMessage('[错误] 消息缺少 type 字段');
        }
    } catch (error) {
        logMessage('[错误] 收到的消息不是合法的 JSON 格式');
    }
});

// 连接关闭时触发
socket.addEventListener('close', () => {
    logMessage('WebSocket 连接已关闭');
});

// 连接出错时触发
socket.addEventListener('error', (error) => {
    logMessage('WebSocket 错误: ' + error);
});

// 日志记录函数
function logMessage(message) {
    const p = document.createElement('p');
    p.textContent = message;
    log.appendChild(p);
    log.scrollTop = log.scrollHeight;
}