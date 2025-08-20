const audioPlayer = document.getElementById('audioPlayer');
const playPauseBtn = document.getElementById('playPauseBtn');
const playIcon = document.getElementById('playIcon');
const pauseIcon = document.getElementById('pauseIcon');
const volumeSlider = document.getElementById('volumeSlider');
const statusDisplay = document.getElementById('status');
const volumeIcon = document.getElementById('volumeIcon');
const listenersCountEl = document.getElementById('listeners-count'); 
const trackTitleEl = document.getElementById('trackTitle'); 
const trackTitleWrapperEl = document.querySelector('.track-title-wrapper'); 
const artworkImageEl = document.getElementById('artworkImage'); 
const defaultLogoImageEl = document.getElementById('defaultLogoImage'); 

let isPlaying = false; 
const defaultStationName = ""; 

function togglePlayPause() {
    if (audioPlayer.paused || audioPlayer.ended) {
        audioPlayer.play().then(() => {
            // Success handled by 'play' event listener
        }).catch(error => {
            console.error("Error playing audio:", error);
            updateStatus('Error al reproducir');
             playIcon.style.display = 'block';
             pauseIcon.style.display = 'none';
        });
    } else {
        audioPlayer.pause();
    }
}

function updateStatus(message) {
    statusDisplay.textContent = message;
}

function checkTitleScroll() {
    trackTitleEl.classList.remove('scrolling');
    requestAnimationFrame(() => {
        const isOverflowing = trackTitleEl.scrollWidth > trackTitleWrapperEl.clientWidth;
        if (isOverflowing) {
            trackTitleEl.classList.add('scrolling');
        } else {
            trackTitleEl.classList.remove('scrolling');
        }
    });
}

playPauseBtn.addEventListener('click', togglePlayPause);

volumeSlider.addEventListener('input', () => {
    audioPlayer.volume = volumeSlider.value;
     if (audioPlayer.volume === 0) {
         volumeIcon.innerHTML = `
             <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>
             <path d="M0 0h24v24H0z" fill="none"/>`;
     } else {
         volumeIcon.innerHTML = `
             <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
             <path d="M0 0h24v24H0z" fill="none"/>`;
     }
});

audioPlayer.addEventListener('play', () => {
    playIcon.style.display = 'none';
    pauseIcon.style.display = 'block';
    updateStatus('Reproduciendo...');
    isPlaying = true;
});

audioPlayer.addEventListener('pause', () => {
    playIcon.style.display = 'block';
    pauseIcon.style.display = 'none';
     if (!audioPlayer.ended && !audioPlayer.seeking) {
        updateStatus('Pausado');
    }
    isPlaying = false;
});

audioPlayer.addEventListener('ended', () => {
    playIcon.style.display = 'block';
    pauseIcon.style.display = 'none';
    updateStatus('Stream finalizado');
    trackTitleEl.textContent = defaultStationName; 
    checkTitleScroll(); 
    artworkImageEl.src = ''; 
    artworkImageEl.classList.remove('loaded');
    defaultLogoImageEl.style.opacity = '1'; 
});

audioPlayer.addEventListener('waiting', () => {
    updateStatus('Cargando...');
});

audioPlayer.addEventListener('playing', () => {
     updateStatus('Reproduciendo...');
});

audioPlayer.addEventListener('error', (e) => {
    console.error("Audio Error:", e);
    let errorMsg = 'Error de Stream';
    if (audioPlayer.error) {
        switch (audioPlayer.error.code) {
            case MediaError.MEDIA_ERR_ABORTED: errorMsg = 'Playback aborted'; break;
            case MediaError.MEDIA_ERR_NETWORK: errorMsg = 'Error de red'; break;
            case MediaError.MEDIA_ERR_DECODE: errorMsg = 'Error de decodificación'; break;
            case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED: errorMsg = 'Fuente no soportada'; break;
            default: errorMsg = 'Error desconocido'; break;
        }
    }
    updateStatus(errorMsg);
    playIcon.style.display = 'block';
    pauseIcon.style.display = 'none';
    trackTitleEl.textContent = defaultStationName; 
    checkTitleScroll(); 
    listenersCountEl.textContent = `Offline`;
    listenersCountEl.classList.remove('animate-pulse-custom');
    artworkImageEl.src = ''; 
    artworkImageEl.classList.remove('loaded');
    defaultLogoImageEl.style.opacity = '1'; 
});

const mountPoint = "10856355.ogg";
const statusUrl = "https://streamlive2.hearthis.at:8000/status-json.xsl";

async function updateStreamInfo() {
    if (isPlaying) {
        listenersCountEl.textContent = 'Cargando...';
    } else {
        listenersCountEl.textContent = 'Offline'
    }

    if (!listenersCountEl.classList.contains('animate-pulse-custom')) {
        listenersCountEl.classList.add('animate-pulse-custom');
        listenersCountEl.textContent = 'Actualizando...'; 
    }

    let currentTitle = trackTitleEl.textContent; 

    try {
        const response = await fetch(statusUrl + '?_=' + new Date().getTime()); 

        if (!response.ok) {
            console.error(`Error fetching status: ${response.status} ${response.statusText}`);
            listenersCountEl.textContent = `N/A`;
            listenersCountEl.classList.remove('animate-pulse-custom');
            if (currentTitle !== defaultStationName) { 
                trackTitleEl.textContent = defaultStationName;
                checkTitleScroll();
            }
            artworkImageEl.src = ''; 
            artworkImageEl.classList.remove('loaded');
            defaultLogoImageEl.style.opacity = '1';
            return;
        }

        const data = await response.json();

        if (!data || !data.icestats || !data.icestats.source) {
            console.error("Invalid data structure received:", data);
            listenersCountEl.textContent = `N/A`;
            listenersCountEl.classList.remove('animate-pulse-custom');
             if (currentTitle !== defaultStationName) {
                trackTitleEl.textContent = defaultStationName;
                checkTitleScroll();
            }
            artworkImageEl.src = '';
            artworkImageEl.classList.remove('loaded');
            defaultLogoImageEl.style.opacity = '1';
            return;
        }

        const source = data.icestats.source;
        let currentSource = null;
        let title = defaultStationName; 
        let listeners = 0;
        let artworkUrl = null;

        if (Array.isArray(source)) {
            currentSource = source.find(s => s && s.listenurl && s.listenurl.includes(mountPoint));
        } else if (source && source.listenurl && source.listenurl.includes(mountPoint)) {
            currentSource = source;
        }

        if (currentSource) {
            listeners = currentSource.listeners !== undefined ? currentSource.listeners : 0;
            title = currentSource.title || currentSource.server_description || defaultStationName; 
            artworkUrl = currentSource.artwork_url || currentSource.track_image_url || null;

        } else {
             console.log(`Mount point ${mountPoint} not found.`);
             title = defaultStationName; 
        }

        listenersCountEl.textContent = `${listeners} oyentes`;
        listenersCountEl.classList.remove('animate-pulse-custom'); 

        if (trackTitleEl.textContent !== title) {
            trackTitleEl.textContent = title;
            checkTitleScroll(); 
        }

        if (artworkUrl) {
            if (artworkImageEl.src !== artworkUrl) {
                artworkImageEl.src = artworkUrl;
                artworkImageEl.classList.remove('loaded'); 
                defaultLogoImageEl.style.opacity = '0'; 

                artworkImageEl.onload = () => {
                    artworkImageEl.classList.add('loaded');
                 };
                 artworkImageEl.onerror = () => {
                    console.error("Error loading artwork image:", artworkUrl);
                    artworkImageEl.src = ''; 
                    artworkImageEl.classList.remove('loaded');
                    defaultLogoImageEl.style.opacity = '1'; 
                 };
            }
        } else {
             if (artworkImageEl.src !== '') {
                artworkImageEl.src = '';
                artworkImageEl.classList.remove('loaded');
            }
            defaultLogoImageEl.style.opacity = '1';
        }


    } catch (e) {
        console.error("Error al obtener información del stream:", e);
        listenersCountEl.textContent = `Offline`;
        listenersCountEl.classList.remove('animate-pulse-custom');
        if (trackTitleEl.textContent !== defaultStationName) {
            trackTitleEl.textContent = defaultStationName;
            checkTitleScroll();
        }
        artworkImageEl.src = ''; 
        artworkImageEl.classList.remove('loaded');
        defaultLogoImageEl.style.opacity = '1';

        if (e instanceof TypeError && e.message.includes('Failed to fetch')) {
             console.warn("Fetch failed, possibly due to CORS. Check browser console.");
             listenersCountEl.textContent = `CORS?`;
             if (trackTitleEl.textContent !== 'Error CORS?') {
                trackTitleEl.textContent = 'Error CORS?';
                checkTitleScroll();
             }
        }
    }
}

audioPlayer.volume = volumeSlider.value;
updateStatus('Listo');
trackTitleEl.textContent = defaultStationName; 
checkTitleScroll(); 
updateStreamInfo(); 
setInterval(updateStreamInfo, 15000); 

window.addEventListener('resize', checkTitleScroll);