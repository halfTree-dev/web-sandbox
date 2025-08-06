document.addEventListener('DOMContentLoaded', () => {
    const loginModal = document.getElementById('login-modal');
    const loginSubmit = document.getElementById('login-submit');

    // 显示登录弹窗
    loginModal.style.display = 'block';

    loginSubmit.addEventListener('click', async () => {
        const username = document.getElementById('login-username').value;
        const password = document.getElementById('login-password').value;

        if (!username || !password) {
            alert('请输入用户ID和密码！');
            return;
        }

        const encoder = new TextEncoder();
        const data = encoder.encode(password);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashedPassword = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

        socket.send(JSON.stringify({
            type: 'login',
            username: username,
            password: hashedPassword
        }));
    });
});

function loginSuccessCallback() {
    alert('登录成功！');
    const loginModal = document.getElementById('login-modal');
    loginModal.style.display = 'none';
    socket.send(JSON.stringify({
        type: 'server_info'
    }));
}

function loginFailedCallback(reason) {
    alert('登录失败：' + reason);
    const loginModal = document.getElementById('login-modal');
    loginModal.style.display = 'block';
}