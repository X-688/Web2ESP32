// DOM 元素
const portInfo = document.getElementById('port-info');
const disconnectBtn = document.getElementById('disconnect-btn');
const messageInput = document.getElementById('message-input');
const sendBtn = document.getElementById('send-btn');
const messageContainer = document.getElementById('message-container');

// 快捷指令相关变量
const SHORTCUTS_STORAGE_KEY = 'serialport_shortcuts';
const shortcutsContainer = document.getElementById('shortcuts-container');
const addShortcutBtn = document.getElementById('add-shortcut-btn');
const shortcutDialog = document.getElementById('shortcut-dialog');
const shortcutNameInput = document.getElementById('shortcut-name');
const shortcutCommandInput = document.getElementById('shortcut-command');
const saveShortcutBtn = document.getElementById('save-shortcut-btn');
const cancelShortcutBtn = document.getElementById('cancel-shortcut-btn');

// 浏览器支持检测
function checkBrowserSupport() {
    return true;
}

// 添加消息到聊天界面
function addMessage(message, isSent) {
    const messageElement = document.createElement('div');
    messageElement.classList.add('message');
    messageElement.classList.add(isSent ? 'sent' : 'received');
    messageElement.textContent = message;
    messageContainer.appendChild(messageElement);
    messageContainer.scrollTop = messageContainer.scrollHeight;
}

let receiveBuffer = '';

// // 处理接收到的数据
// function processReceivedData(text) {
//     receiveBuffer += text;
    
//     // 查找换行符
//     let messages = receiveBuffer.split('\n');
    
//     // 如果没有完整的行，直接返回
//     if (messages.length === 1) {
//         return;
//     }
    
//     // 处理完整的行
//     for (let i = 0; i < messages.length - 1; i++) {
//         if (messages[i].trim().length > 0) {
//             addMessage(messages[i].trim(), false);
//         }
//     }
    
//     // 保存最后一个不完整的行（如果有）
//     receiveBuffer = messages[messages.length - 1];
// }

// 处理接收到的数据（去除对换行符的要求）
function processReceivedData(text) {
    receiveBuffer += text;
    const trimmedText = receiveBuffer.trim();
    if (trimmedText.length > 0) {
        addMessage(trimmedText, false);
        receiveBuffer = '';
    }
}

let socket = null;

// 更新连接状态显示
function updateConnectionStatus(connected) {
    if (connected) {
        portInfo.textContent = '已连接';
        portInfo.classList.add('connected');
    } else {
        portInfo.textContent = '未连接';
        portInfo.classList.remove('connected');
    }
}

// 连接按钮事件监听
const connectBtn = document.getElementById('connect-btn');
connectBtn.addEventListener('click', connectWebSocket);

// 连接WebSocket
async function connectWebSocket() {
    const ip = document.getElementById('esp32-ip').value;
    const port = document.getElementById('esp32-port').value;
    const url = `ws://${ip}:${port}`;
    console.log(`尝试连接到 WebSocket: ${url}`);

    try {
        socket = new WebSocket(url);

        socket.onopen = () => {
            console.log('WebSocket 连接成功！');
            updateConnectionStatus(true);
            addMessage('WebSocket连接成功！', false);
            document.getElementById('connect-btn').disabled = true;
            disconnectBtn.disabled = false;
        };

        socket.onmessage = (event) => {
            console.log('收到消息:', event.data);
            processReceivedData(event.data);
        };

        socket.onclose = () => {
            console.log('WebSocket 连接已关闭');
            updateConnectionStatus(false);
            document.getElementById('connect-btn').disabled = false;
            disconnectBtn.disabled = true;
            addMessage('连接已关闭', false);
        };

        socket.onerror = (error) => {
            console.error('WebSocket错误:', error);
            addMessage(`连接错误: ${error.message}`, false);
        };

    } catch (error) {
        alert(`连接失败: ${error}`);
        console.error('连接失败:', error);
    }
}

// 发送消息
function sendData() {
    const message = messageInput.value.trim();
    if (!message || !socket || socket.readyState !== WebSocket.OPEN) return;

    try {
        socket.send(message);
        addMessage(message, true);
        messageInput.value = '';
    } catch (error) {
        console.error('发送失败:', error);
        addMessage(`发送失败: ${error.message}`, false);
    }
}

// 断开连接
function disconnect() {
    if (socket) {
        socket.close();
        socket = null;
    }
}

// 显示快捷指令对话框
function showShortcutDialog() {
    shortcutDialog.style.display = 'block';
}

// 保存快捷指令
function saveShortcut() {
    const name = shortcutNameInput.value.trim();
    const command = shortcutCommandInput.value.trim();
    if (name && command) {
        const shortcuts = JSON.parse(localStorage.getItem(SHORTCUTS_STORAGE_KEY)) || [];
        shortcuts.push({ name, command });
        localStorage.setItem(SHORTCUTS_STORAGE_KEY, JSON.stringify(shortcuts));
        loadShortcuts();
        hideShortcutDialog();
    }
}

// 隐藏快捷指令对话框
function hideShortcutDialog() {
    shortcutDialog.style.display = 'none';
    shortcutNameInput.value = '';
    shortcutCommandInput.value = '';
}

// 加载快捷指令
function loadShortcuts() {
    const shortcuts = JSON.parse(localStorage.getItem(SHORTCUTS_STORAGE_KEY)) || [];
    shortcutsContainer.innerHTML = '';
    shortcuts.forEach(({ name, command }) => {
        const shortcutButton = document.createElement('button');
        shortcutButton.classList.add('shortcut-btn');

        // 创建显示快捷指令名称的元素
        const shortcutName = document.createElement('span');
        shortcutName.classList.add('shortcut-name');
        shortcutName.textContent = name;
        shortcutButton.appendChild(shortcutName);

        // 创建显示快捷指令具体内容的元素
        const shortcutCommand = document.createElement('span');
        shortcutCommand.classList.add('shortcut-command');
        shortcutCommand.textContent = command;
        shortcutButton.appendChild(shortcutCommand);

        shortcutButton.addEventListener('click', () => {
            messageInput.value = command;
            sendData();
        });
        shortcutsContainer.appendChild(shortcutButton);
    });
}

// 更新事件监听
disconnectBtn.addEventListener('click', disconnect);
sendBtn.addEventListener('click', sendData);
messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        sendData();
    }
});
addShortcutBtn.addEventListener('click', showShortcutDialog);
saveShortcutBtn.addEventListener('click', saveShortcut);
cancelShortcutBtn.addEventListener('click', hideShortcutDialog);

// 按Enter保存，按Esc取消
shortcutDialog.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        saveShortcut();
    } else if (e.key === 'Escape') {
        hideShortcutDialog();
    }
});

// 点击对话框外部关闭
shortcutDialog.addEventListener('click', (e) => {
    if (e.target === shortcutDialog) {
        hideShortcutDialog();
    }
});

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    // 加载快捷指令
    loadShortcuts();
});

// 监听浏览器关闭事件，防止浏览器意外关闭导致WebSocket连接未关闭
window.addEventListener('beforeunload', () => {
    if (socket) {
        socket.close();
    }
});
