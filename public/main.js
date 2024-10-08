const socket = io();
let localStream = null;
let peerConnection = null;
const servers = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' }, // STUN сервер для проброса NAT
  ],
};

// Элементы DOM
const joinCallButton = document.getElementById('joinCall');
const leaveCallButton = document.getElementById('leaveCall');
const remoteAudio = document.getElementById('remoteAudio');
const chatInput = document.getElementById('chatInput');
const sendMessageButton = document.getElementById('sendMessage');
const chatWindow = document.getElementById('chatWindow');

// Подключение к звонку
joinCallButton.onclick = async () => {
    joinCallButton.disabled = true;
    leaveCallButton.disabled = false;

    localStream = await navigator.mediaDevices.getUserMedia({ audio: true });

    socket.emit('join', { roomId: '12345' });

    peerConnection = new RTCPeerConnection(servers);
    localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));

    peerConnection.ontrack = event => {
        remoteAudio.srcObject = event.streams[0];
    };

    peerConnection.onicecandidate = event => {
        if (event.candidate) {
            socket.emit('ice-candidate', event.candidate);
        }
    };

    socket.on('offer', async (offer) => {
        await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answer);
        socket.emit('answer', answer);
    });

    socket.on('answer', async (answer) => {
        await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
    });

    socket.on('ice-candidate', async (candidate) => {
        try {
            await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (e) {
            console.error('Ошибка при добавлении ICE кандидата', e);
        }
    });

    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);
    socket.emit('offer', offer);
};

// Отключение от звонка
leaveCallButton.onclick = () => {
    joinCallButton.disabled = false;
    leaveCallButton.disabled = true;

    localStream.getTracks().forEach(track => track.stop());
    peerConnection.close();
    socket.emit('leave', { roomId: '12345' });
};

// Функции для текстового чата

// Отправка сообщения
sendMessageButton.onclick = () => {
    const message = chatInput.value;
    if (message) {
        socket.emit('chatMessage', message);
        appendMessage(`Вы: ${message}`);
        chatInput.value = ''; // Очистка поля ввода
    }
};

// Получение сообщений
socket.on('chatMessage', (message) => {
    appendMessage(`Другой: ${message}`);
});

// Функция добавления сообщений в окно чата
function appendMessage(message) {
    const messageElement = document.createElement('div');
    messageElement.textContent = message;
    chatWindow.appendChild(messageElement);
    chatWindow.scrollTop = chatWindow.scrollHeight; // Автопрокрутка
}
