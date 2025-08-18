const express = require("express");
const request = require("request");
const fetch = require("node-fetch");

const app = express();
const PORT = process.env.PORT || 3000;

// Configuración de radios
const STREAMS = {
  radiohot: {
    url: "https://streamlive2.hearthis.at:8000/10856355.ogg",
    mount: "10856355.ogg",
    statusUrl: "https://streamlive2.hearthis.at:8000/status-json.xsl"
  },
  radioestacionmix: {
    url: "https://streamlive2.hearthis.at:8000/10778826.ogg",
    mount: "10778826.ogg",
    statusUrl: "https://streamlive2.hearthis.at:8000/status-json.xsl"
  }
};

// 🎵 Proxy de audio (ej: /radio1 o /radio2)
app.get("/:radio", (req, res) => {
  const radio = STREAMS[req.params.radio];
  if (!radio) return res.status(404).send("Stream no encontrado");

  res.setHeader("Content-Type", "audio/mpeg");
  request(radio.url).pipe(res);
});

// 📡 Metadatos desde status-json.xsl
app.get("/:radio/meta", async (req, res) => {
  const radio = STREAMS[req.params.radio];
  if (!radio) return res.status(404).json({ error: "Stream no encontrado" });

  try {
    const response = await fetch(radio.statusUrl);
    const data = await response.json();

    // Buscar el mountPoint correcto
    let mount = null;

    if (Array.isArray(data.icestats.source)) {
      mount = data.icestats.source.find(
        (s) => s.listenurl && s.listenurl.includes(radio.mount)
      );
    } else if (data.icestats.source.listenurl.includes(radio.mount)) {
      mount = data.icestats.source;
    }

    if (!mount) return res.json({ metadata: null });

    res.json({
      listeners: mount.listeners,
      title: mount.title || null,
      artist: mount.artist || null,
      stream: mount.server_name || null
    });
  } catch (err) {
    console.error("Error obteniendo metadata:", err);
    res.status(500).json({ error: "No se pudo obtener metadata" });
  }
});

app.listen(PORT, () => {
  console.log("✅ Radios disponibles:");
  console.log(`http://localhost:${PORT}/radiohot (audio)`);
  console.log(`http://localhost:${PORT}/radiohot/meta (metadata)`);
  console.log(`http://localhost:${PORT}/radioestacionmix (audio)`);
  console.log(`http://localhost:${PORT}/radioestacionmix/meta (metadata)`);
});
