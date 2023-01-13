const express = require("express");
const cors = require("cors");
const postgres = require("./postgres.js");
const userRoutes = require("./routes/userRoutes");
const messagesRoute = require("./routes/messagesRoute");
const app = express();
const socket = require("socket.io");
require("dotenv").config();

app.use(cors());
app.use(express.json());
app.use(express.static("public"));

app.use("/api/auth", userRoutes);
app.use("/api/messages", messagesRoute);

postgres.connect((err) => {
  if (err) {
    console.log(err);
  } else {
    console.log("PSQL CONNECTED");
  }
});

const server = app.listen(process.env.PORT, () => {
  console.log(`SERVER CONNECTED ON PORT ${process.env.PORT}`);
});

const io = socket(server, {
  cors: {
    origin: [
      "http://localhost:3000",
      "https://luminous-crisp-c26c0b.netlify.app",
    ],
    credentials: true,
  },
});

global.onlineUsers = new Map();

io.on("connection", (socket) => {
  global.chatSocket = socket;
  socket.on("add-user", (userId) => {
    onlineUsers.set(userId, socket.id);
  });

  socket.on("send-msg", (data) => {
    const sendUserSocket = onlineUsers.get(data.to);

    if (sendUserSocket) {
      socket.to(sendUserSocket).emit("msg-recieve", data.message);
    }
  });
});
