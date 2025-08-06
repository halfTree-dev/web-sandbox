function updateMenuData() {
    if (!currLevel || typeof currLevel.players !== 'object') { return; } // 确保 currLevel.players 是对象
    const levelLabel = document.getElementById('current-level');
    levelLabel.textContent = `当前关卡: ${currLevel.name || '未命名'}`;

    const playerList = document.getElementById('player-list');
    playerList.innerHTML = ''; // 清空列表

    Object.values(currLevel.players) // 遍历字典中的值
        .filter(player => player.online) // 筛选在线玩家
        .forEach(player => {
            const listItem = document.createElement('li');
            listItem.textContent = player.name || '未知玩家';
            playerList.appendChild(listItem);
        });
}

function toggleMenuVisibility() {
    const menu = document.getElementById('menu-box');
    if (!menu) { return; } // 检查 menu 是否存在
    if (menu.style.display === 'none' || menu.style.display === '') {
        menu.style.display = 'block';
    } else {
        menu.style.display = 'none';
    }
}

const disconnectButton = document.getElementById('disconnect-button');
disconnectButton.addEventListener('click', () => {
    currLevel = {};
    socket.send(JSON.stringify({
        type: 'leave_level'
    }));
    socket.send(JSON.stringify({
        type: 'server_info'
    }));
});