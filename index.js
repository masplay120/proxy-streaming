const express = require("express");
const request = require("request");

const app = express();
const PORT = process.env.PORT || 3000;

// 🎵 Lista de streams
const STREAMS = {
  radio10856355: "http://streamlive2.hearthis.at:8000/10856355.ogg",
  radio10778826: "https://streamlive2.hearthis.at:8000/10778826.ogg"
};

// Ruta de audio (proxy)
app.get("/:radio", (req, res) => {
  const radio = req.params.radio;
  const url = STREAMS[radio];
  if (!url) return res.status(404).send("Stream no encontrado");

  res.setHeader("Content-Type", "audio/mpeg");

  request({
    url,
    headers: { "Icy-MetaData": "1", "User-Agent": "Mozilla/5.0" }
  }).on("error", (err) => {
    console.error("Error con stream:", err.message);
    res.status(500).send("Error al conectar con el stream");
  }).pipe(res);
});

// Ruta de metadatos JSON
app.get("/metadata/:radio", (req, res) => {
  const radio = req.params.radio;
  const url = STREAMS[radio];
  if (!url) return res.status(404).json({ error: "Stream no encontrado" });

  const stream = request({
    url,
    headers: { "Icy-MetaData": "1", "User-Agent": "Mozilla/5.0" }
  });

  stream.on("response", (response) => {
    const metaInt = parseInt(response.headers["icy-metaint"]);
    if (!metaInt) {
      return res.json({ streamTitle: null });
    }

    let audioBytes = 0;
    let buffer = Buffer.alloc(0);

    stream.on("data", (chunk) => {
      audioBytes += chunk.length;
      buffer = Buffer.concat([buffer, chunk]);

      if (audioBytes >= metaInt) {
        const metaLen = buffer[metaInt] * 16;
        const meta = buffer.slice(metaInt + 1, metaInt + 1 + metaLen).toString();
        const match = /StreamTitle='([^']*)'/.exec(meta);
        const streamTitle = match ? match[1] : null;

        res.json({ streamTitle });
        stream.destroy();
      }
    });
  });

  stream.on("error", () => {
    res.status(500).json({ error: "No se pudo leer metadata" });
  });
});

app.listen(PORT, () => {
  console.log(`✅ Proxy en http://localhost:${PORT}`);
});
