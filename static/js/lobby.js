function lobbyInfoCallback(response) {
    const lobbyBox = document.getElementById('lobby-box');
    const connectedPlayers = document.getElementById('connected-players');
    const levelList = document.getElementById('level-list');
    lobbyBox.style.display = 'block';
    if (response.type === 'server_info') {
        connectedPlayers.textContent = `已连接人数: ${response.player_count}`;

        levelList.innerHTML = '';
        response.level_list.forEach(level => {
            const levelItem = document.createElement('div');
            levelItem.className = 'level-item';

            const levelInfo = document.createElement('span');
            levelInfo.textContent = `${level.name} (玩家数: ${level.player_count})`;

            const joinButton = document.createElement('button');
            joinButton.textContent = '加入';
            joinButton.addEventListener('click', () => {
                socket.send(JSON.stringify({
                    type: 'join_level',
                    id: level.id
                }));
                console.log(`请求加入关卡: ${level.id}`);
            });
            levelItem.appendChild(levelInfo);
            levelItem.appendChild(joinButton);
            levelList.appendChild(levelItem);
        });
    }
}

function hideLobby() {
    const lobbyBox = document.getElementById('lobby-box');
    lobbyBox.style.display = 'none';
}