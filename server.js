const http = require("http");
const CONSTANTS = require("./utils/constants.js");
const fs = require("fs");
const path = require("path");
const WebSocket = require("ws");

const { PORT, CLIENT, SERVER } = CONSTANTS;
const server = http.createServer((req, res) => {
  const filePath = req.url === "/" ? "/public/index.html" : req.url;

  const extname = path.extname(filePath);
  let contentType = "text/html";
  if (extname === ".js") contentType = "text/javascript";
  else if (extname === ".css") contentType = "text/css";

  res.writeHead(200, { "Content-Type": contentType });
  fs.createReadStream(`${__dirname}/${filePath}`, "utf8").pipe(res);
});

const wsServer = new WebSocket.Server({ server });

wsServer.on("connection", (socket) => {
  console.log("A new client has connected!");
  socket.on("message", (data) => {
    const { type, payload } = JSON.parse(data);
    switch (type) {
      case CLIENT.MESSAGE.NEW_USER:
        const time = new Date().toLocaleString();
        payload.time = time;
        const dataWithTime = {
          type: SERVER.BROADCAST.NEW_USER_WITH_TIME,
          payload
        }
        broadcast(JSON.stringify(dataWithTime))
        break;
      case CLIENT.MESSAGE.NEW_MESSAGE:
        broadcast(data, socket);
        break;
      default:
        break;
    }
  });
});

function broadcast(data, socketToOmit) {
  wsServer.clients.forEach((connectedSocket) => {
    if (
      connectedSocket.readyState === WebSocket.OPEN &&
      connectedSocket !== socketToOmit
    ) {
      connectedSocket.send(data);
    }
  });
}

server.listen(PORT, () => {
  console.log(`Listening on: http://localhost:${server.address().port}`);
});
