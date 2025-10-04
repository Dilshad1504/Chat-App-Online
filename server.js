const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

const PORT = process.env.PORT || 3000;

// Serve static files from public
app.use(express.static(__dirname + '/public'));

let visitorSocket = null;

io.on('connection', (socket) => {
  console.log('Socket connected:', socket.id);

  // Visitor joins
  socket.on('visitor:join', (data) => {
    visitorSocket = socket.id;
    const name = data.name || 'Visitor';
    io.emit('admin:updateVisitor', { socketId: visitorSocket, name });
    console.log('Visitor joined:', name);
  });

  // Visitor sends message
  socket.on('visitor:message', (data) => {
    if(visitorSocket){
      io.emit('admin:incomingMessage', {
        fromSocketId: socket.id,
        name: 'Visitor',
        text: data.text
      });
    }
  });

  // Admin sends reply
  socket.on('admin:reply', (data) => {
    if(visitorSocket){
      io.to(visitorSocket).emit('visitor:incomingMessage', {
        from: 'Admin',
        text: data.text
      });
    }
  });

  // Disconnect
  socket.on('disconnect', () => {
    console.log('Socket disconnected:', socket.id);
    if(socket.id === visitorSocket){
      visitorSocket = null;
      io.emit('admin:updateVisitor', null);
    }
  });
});

http.listen(PORT, () => {
  console.log('Server running on port', PORT);
});
