const express = require("express");
const request = require("request");

const app = express();
const PORT = process.env.PORT || 3000;

// URL de tu streaming original (cámbiala por la tuya)
const STREAM_URL = "http://streamlive2.hearthis.at:8000/10856355.ogg";

app.get("/radio", (req, res) => {
  res.setHeader("Content-Type", "audio/mpeg");
  request(STREAM_URL).pipe(res);
});

app.listen(PORT, () => {
  console.log(`Proxy escuchando en http://localhost:${PORT}/radio`);
});
