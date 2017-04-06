var socket = io('http://127.0.0.1:8000');
console.log("here");
socket.on('who are you', function (incoming) {
    socket.emit('check in', {id: savedphonenumber});
});