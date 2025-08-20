const express = require("express");
const request = require("request");

const app = express();
const PORT = process.env.PORT || 3000;

// 🎵 Radios configuradas
const STREAMS = {
  radio10856355: "http://streamlive2.hearthis.at:8000/10856355.ogg",
  radio10778826: "https://streamlive2.hearthis.at:8000/10778826.ogg",
  radio3: "http://tu-servidor3:puerto/mountpoint3"
};

// 📌 Página principal con lista de radios
app.get("/", (req, res) => {
  let html = "<h1>📻 Radios disponibles</h1><ul>";
  Object.keys(STREAMS).forEach(radio => {
    html += `
      <li>
        <b>${radio}</b><br>
        ▶️ <a href="/radio/${radio}" target="_blank">Stream</a> | 
        ℹ️ <a href="/metadata/${radio}" target="_blank">Metadatos</a>
      </li>`;
  });
  html += "</ul>";
  res.send(html);
});

// 📌 Audio limpio (sin metadatos intercalados)
app.get("/radio/:radio", (req, res) => {
  const radio = req.params.radio;
  const url = STREAMS[radio];
  if (!url) return res.status(404).send("Stream no encontrado");

  res.setHeader("Content-Type", "audio/mpeg");

  request({
    url,
    headers: { "Icy-MetaData": "0", "User-Agent": "Mozilla/5.0" }
  }).on("error", (err) => {
    console.error("Error con stream:", err.message);
    res.status(500).send("Error al conectar con el stream");
  }).pipe(res);
});

// 📌 Endpoint JSON para metadatos
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

// 📌 Arrancar servidor
app.listen(PORT, () => {
  console.log(`✅ Proxy corriendo en http://localhost:${PORT}`);
  console.log("📻 Radios disponibles:");
  Object.keys(STREAMS).forEach(radio => {
    console.log(`   • /radio/${radio}  (stream)`);
    console.log(`   • /metadata/${radio}  (metadatos)`);
  });
});
