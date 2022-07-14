const express = require("express");
const figlet = require("figlet");
const http = require("http");
const path = require("path");
const socketio = require("socket.io");
const formatMessage = require("./utils/messages");
const {
  userJoin,
  getCurrentUser,
  userLeave,
  getRoomUsers,
} = require("./utils/users");

const app = express();
const PORT = 3000 || process.env.PORT;

app.use(express.static(path.join(__dirname, "public")));
const server = http.createServer(app);
const io = socketio(server);

const botName = "Textify";

io.on("connection", (socket) => {
  socket.on("joinRoom", ({ username, room }) => {
    const user = userJoin(socket.id, username, room);
    console.log(`${user.username} joined the ${user.room} room`);
    socket.join(user.room);

    //welcome message to current user.
    socket.emit("message", formatMessage(botName, "Welcome to Textify."));

    //Broadcasts when user connects.
    socket.broadcast
      .to(user.room)
      .emit(
        "message",
        formatMessage(botName, `${user.username} has joined the room.`)
      );
    //Send information of room and user.
    io.to(user.room).emit("roomUsers", {
      room: user.room,
      users: getRoomUsers(user.room),
    });
  });

  //listen for a chat message.
  socket.on("chatMessage", (msg) => {
    const user = getCurrentUser(socket.id);
    console.log(`${user.username} : ${msg}`);
    io.emit("message", formatMessage(user.username, msg));
  });

  //Broadcast when user disconnects.
  socket.on("disconnect", () => {
    const user = userLeave(socket.id);
    if (user) {
      console.log(`${user.username} has left the ${user.room} room.`);
      io.to(user.room).emit(
        "message",
        formatMessage(botName, `${user.username} has left the chat`)
      );
      //Send information of room and user.
      io.to(user.room).emit("roomUsers", {
        room: user.room,
        users: getRoomUsers(user.room),
      });
    }
  });
});

server.listen(PORT, () => {
  figlet(`server: ${PORT}`, function (err, data) {
    if (err) {
      console.log("Something went wrong...");
      console.dir(err);
      return;
    }
    console.log(data);
  });
});
