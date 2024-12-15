import express from "express";
import config from "./config/servers.json";

const app = express();
const PORT = process.env.HTTP_PORT || 5050;

app.get("/server1", (req, res) => {
  const server = config.servers[0];
  res.redirect(`steam://connect/${server.host}:${server.port}`);
});

app.get("/server2", (req, res) => {
  const server = config.servers[1];
  res.redirect(`steam://connect/${server.host}:${server.port}`);
});

export function startHttpServer() {
  app.listen(PORT, () => {
    console.log(`HTTP Server running on port ${PORT}`);
  });
}
