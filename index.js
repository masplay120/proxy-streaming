const express = require("express");
const request = require("request");

const app = express();
const PORT = process.env.PORT || 3000;

// 🎵 Lista de streams (puedes agregar los que quieras)
const STREAMS = {
  radiohot: "http://streamlive2.hearthis.at:8000/10856355.ogg",
  radio2: "http://tu-servidor2:puerto/mountpoint2",
  radio3: "http://tu-servidor3:puerto/mountpoint3"
};

// Ruta dinámica: http://localhost:3000/radio1
app.get("/:radio", (req, res) => {
  const radio = req.params.radio;
  const url = STREAMS[radio];

  if (!url) {
    return res.status(404).send("Stream no encontrado");
  }

  res.setHeader("Content-Type", "audio/mpeg");
  request(url).on("error", (err) => {
    console.error(`Error con stream ${radio}:`, err.message);
    res.status(500).send("Error al conectar con el stream");
  }).pipe(res);
});

app.listen(PORT, () => {
  console.log(`Proxy corriendo en http://localhost:${PORT}/radiohot, /radio2, /radio3`);
});
