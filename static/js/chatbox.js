// 发送消息
document.getElementById('send').addEventListener('click', () => {
    const message = document.getElementById('message').value;
    if (message) {
        socket.send(JSON.stringify({
            "type": "chat",
            "content": message
        }));
        document.getElementById('message').value = '';
    }
    console.log(`发送消息: ${message}`);
});

const chatbox = document.getElementById('chatbox');

function toggleChatboxVisibility() {
    if (chatbox.style.display === 'none' || !chatbox.style.display) {
        chatbox.style.display = 'block';
    } else {
        chatbox.style.display = 'none';
    }
}

toggleChatboxVisibility();