const express = require("express");
const request = require("request");
const fetch = require("node-fetch");

const app = express();
const PORT = process.env.PORT || 3000;

// Configuración de radios
const STREAMS = {
  radiohot: {
    url: "http://streamlive2.hearthis.at:8000/10856355.ogg",
    mount: "10856355.ogg",
    statusUrl: "http://streamlive2.hearthis.at:8000/status-json.xsl"
  },
  radioestacionmix: {
    url: "http://streamlive2.hearthis.at:8000/10778826.ogg",
    mount: "10778826.ogg",
    statusUrl: "http://streamlive2.hearthis.at:8000/status-json.xsl"
  }
};

// 🎵 Proxy de audio - rutas fijas
app.get("/radiohot", (req, res) => {
  const radio = STREAMS.radiohot;
  res.setHeader("Content-Type", "audio/ogg");
  request(radio.url).pipe(res);
});

app.get("/radioestacionmix", (req, res) => {
  const radio = STREAMS.radioestacionmix;
  res.setHeader("Content-Type", "audio/ogg");
  request(radio.url).pipe(res);
});

// 📡 Metadatos - rutas fijas
app.get("/radiohot/meta", async (req, res) => {
  const radio = STREAMS.radiohot;
  try {
    const response = await fetch(radio.statusUrl);
    const data = await response.json();

    let mount = null;
    if (Array.isArray(data.icestats.source)) {
      mount = data.icestats.source.find(s => s.listenurl && s.listenurl.includes(radio.mount));
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
    console.error(err);
    res.status(500).json({ error: "No se pudo obtener metadata" });
  }
});

app.get("/radioestacionmix/meta", async (req, res) => {
  const radio = STREAMS.radioestacionmix;
  try {
    const response = await fetch(radio.statusUrl);
    const data = await response.json();

    let mount = null;
    if (Array.isArray(data.icestats.source)) {
      mount = data.icestats.source.find(s => s.listenurl && s.listenurl.includes(radio.mount));
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
    console.error(err);
    res.status(500).json({ error: "No se pudo obtener metadata" });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Servidor corriendo en puerto ${PORT}`);
  console.log("✅ Rutas disponibles:");
  console.log(`http://localhost:${PORT}/radiohot`);
  console.log(`http://localhost:${PORT}/radiohot/meta`);
  console.log(`http://localhost:${PORT}/radioestacionmix`);
  console.log(`http://localhost:${PORT}/radioestacionmix/meta`);
});
