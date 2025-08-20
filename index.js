const express = require("express");
const request = require("request");

const app = express();
const PORT = process.env.PORT || 3000;

// 🎵 Lista de streams
const STREAMS = {
  radio10856355: "http://streamlive2.hearthis.at:8000/10856355.ogg",
  radio10778826: "https://streamlive2.hearthis.at:8000/10778826.ogg",
  radio3: "http://tu-servidor3:puerto/mountpoint3"
};

// Ruta dinámica
app.get("/:radio", (req, res) => {
  const radio = req.params.radio;
  const url = STREAMS[radio];

  if (!url) {
    return res.status(404).send("Stream no encontrado");
  }

  // 🚨 Pedimos metadatos ICY
  const stream = request({
    url,
    headers: {
      "Icy-MetaData": "1", // 👈 Importante
      "User-Agent": "Mozilla/5.0"
    }
  });

  stream.on("response", (response) => {
    // Algunos servidores responden con cabeceras ICY
    if (response.headers["icy-metaint"]) {
      console.log("MetaInt:", response.headers["icy-metaint"]);
    }
    if (response.headers["icy-name"]) {
      console.log("Radio:", response.headers["icy-name"]);
    }
    if (response.headers["icy-genre"]) {
      console.log("Género:", response.headers["icy-genre"]);
    }
  });

  // 🚀 Retransmitimos el stream con audio y metadatos
  res.setHeader("Content-Type", "audio");
  stream.pipe(res);
});

app.listen(PORT, () => {
  console.log(`Proxy corriendo en http://localhost:${PORT}/radio10856355, /radio10778826, /radio3`);
});
