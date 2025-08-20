<?php
// Radios configuradas
$RADIOS = [
    "radio10856355" => "http://streamlive2.hearthis.at:8000/10856355.ogg",
    "radio10778826" => "http://streamlive2.hearthis.at:8000/10778826.ogg",
    "radio3" => "http://127.0.0.1:8000/mount3"
];

// Detectar la radio solicitada
$path = basename($_SERVER['REQUEST_URI']);
$radio = str_replace(".mp3","",$path); // si usas URLs tipo radio1.mp3

if (!isset($RADIOS[$radio])) {
    header("HTTP/1.0 404 Not Found");
    echo "Radio no encontrada";
    exit;
}

$url = $RADIOS[$radio];

// CORS
if (isset($_SERVER['HTTP_ORIGIN'])) {
    header("Access-Control-Allow-Origin: {$_SERVER['HTTP_ORIGIN']}");
}

// Tipo de contenido
header("Content-Type: audio/mpeg");

// Abrir stream remoto
$ctx = stream_context_create([
    "http" => [
        "header" => "Icy-MetaData:1\r\nUser-Agent: Mozilla/5.0\r\n"
    ]
]);

$stream = fopen($url, 'r', false, $ctx);
if (!$stream) {
    header("HTTP/1.0 500 Internal Server Error");
    echo "No se pudo conectar con la radio";
    exit;
}

// Leer y enviar chunks más grandes para audio más fluido
while (!feof($stream)) {
    echo fread($stream, 8192);
    flush();
}

fclose($stream);
?>
