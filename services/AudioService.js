const PREFIX_SOUND_PATH = "./assets/sounds/";

class AudioService {
    constructor() {
        this.audioContext = null;
        this.gainNode = null;
        this.currentMusicSource = null;
        this.playlist = [];
        this.currentTrackIndex = -1; // -1 indique qu'aucune piste n'est sélectionnée
        this.isInitialized = false;
        this.soundData = {}; // Stocke les ArrayBuffers
        this.decodedSoundBuffers = {}; // Stocke les AudioBuffers décodés
        this._musicPlaylistToPlay = null;
        this.currentPlaylistIdentifier = null; // Pour suivre la playlist active
        this.isLoading = false; // Verrou pour empêcher les lectures multiples

        this.musicVolume = 0.5; // Volume par défaut
        this.isMuted = false;
    }

    init() {
        if (this.isInitialized) return;

        const userInteraction = () => {
            if (this.audioContext === null) {
                try {
                    this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
                    this.gainNode = this.audioContext.createGain();
                    this.gainNode.connect(this.audioContext.destination);
                    this.setVolume(this.musicVolume);
                    if (this.isMuted) this.setMute(true);

                    console.log("AudioContext créé.");
                    this.decodeAllSounds();

                    if (this._musicPlaylistToPlay) {
                        this.playMusic(this._musicPlaylistToPlay.playlist, this._musicPlaylistToPlay.startWith);
                        this._musicPlaylistToPlay = null;
                    }
                } catch (e) {
                    console.error("Échec de la création de l'AudioContext:", e);
                    return;
                }
            }
            window.removeEventListener('click', userInteraction, true);
            window.removeEventListener('keydown', userInteraction, true);
            this.isInitialized = true;
        };

        window.addEventListener('click', userInteraction, true);
        window.addEventListener('keydown', userInteraction, true);
    }

    async loadSoundEffects(effects) {
        const promises = [];
        for (const key in effects) {
            promises.push(this.loadSound(key, effects[key]));
        }
        await Promise.all(promises);
    }

    async loadSound(key, url) {
        const trackUrl = PREFIX_SOUND_PATH + url;
        try {
            const response = await fetch(trackUrl);
            const arrayBuffer = await response.arrayBuffer();
            this.soundData[key] = arrayBuffer;
        } catch (error) {
            console.error(`Error loading data for ${key}:`, error);
        }
    }

    async decodeAllSounds() {
        if (!this.audioContext) return;
        console.log("Decoding all loaded sounds...");
        for (const key in this.soundData) {
            if (!this.decodedSoundBuffers[key]) {
                try {
                    const bufferCopy = this.soundData[key].slice(0);
                    const audioBuffer = await this.audioContext.decodeAudioData(bufferCopy);
                    this.decodedSoundBuffers[key] = audioBuffer;
                } catch (error) {
                    console.error(`Error decoding sound ${key}:`, error);
                }
            }
        }
        console.log("Sound decoding complete.");
    }

    playSoundEffect(key) {
        if (!this.audioContext || !this.decodedSoundBuffers[key]) {
            console.warn(`Sound effect '${key}' not found or not initialized.`);
            return;
        }
        const source = this.audioContext.createBufferSource();
        source.buffer = this.decodedSoundBuffers[key];
        source.connect(this.audioContext.destination);
        source.start(0);
    }

    playMusic(playlist, startWith = null) {
        const playlistId = JSON.stringify(playlist);
        if (this.isLoading || this.currentPlaylistIdentifier === playlistId) {
            console.log("Music already playing or loading for this playlist.");
            return;
        }
        
        this.stopMusic(); // Arrête toute musique précédente

        if (!this.audioContext) {
            console.warn("AudioContext not ready, music playback is delayed.");
            this._musicPlaylistToPlay = { playlist, startWith };
            return;
        }

        if (!playlist || playlist.length === 0) {
            return;
        }

        this.playlist = [...playlist];
        this.currentPlaylistIdentifier = playlistId;
        this.currentTrackIndex = 0; // On commence à la première piste

        // Logique pour mélanger et choisir la piste de départ
        if (startWith && Array.isArray(startWith) && startWith.length > 0) {
            const startTrack = startWith[Math.floor(Math.random() * startWith.length)];
            const startIndex = this.playlist.indexOf(startTrack);
            if (startIndex !== -1) {
                this.playlist.splice(startIndex, 1); // Retire l'élément
                this.playlist.sort(() => Math.random() - 0.5); // Mélange le reste
                this.playlist.unshift(startTrack); // Le place au début
            } else {
                this.playlist.sort(() => Math.random() - 0.5); // Mélange tout si non trouvé
            }
        } else {
            this.playlist.sort(() => Math.random() - 0.5); // Mélange si pas de piste de départ
        }
        
        this._playTrack();
    }

    async _playTrack() {
        if (this.currentTrackIndex === -1 || this.playlist.length === 0 || this.isLoading) {
            return;
        }

        this.isLoading = true;
        this.currentMusicSource = null;

        const trackUrl = PREFIX_SOUND_PATH + this.playlist[this.currentTrackIndex];
        console.log(`Track loading: ${trackUrl}`);

        try {
            const response = await fetch(trackUrl);
            const arrayBuffer = await response.arrayBuffer();
            const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
            
            this.isLoading = false;

            // Vérifie si une autre commande (stopMusic, etc.) n'a pas été appelée pendant le chargement
            if (this.currentTrackIndex === -1) {
                 console.log("Playback was canceled while loading.");
                 return;
            }

            this.currentMusicSource = this.audioContext.createBufferSource();
            this.currentMusicSource.buffer = audioBuffer;
            this.currentMusicSource.connect(this.gainNode);
            
            // L'événement onended est la seule source de vérité pour passer à la piste suivante
            this.currentMusicSource.onended = () => {
                this.currentTrackIndex = (this.currentTrackIndex + 1) % this.playlist.length;
                this._playTrack(); // Enchaîne avec la piste suivante
            };

            this.currentMusicSource.start(0);
            console.log(`Reading of : ${trackUrl}`);

        } catch (error) {
            console.error(`Error reading track${trackUrl}:`, error);
            this.isLoading = false;
            // Passe à la piste suivante après un court délai en cas d'erreur
            setTimeout(() => {
                 if (this.currentTrackIndex !== -1) { // Ne pas continuer si la musique a été arrêtée
                    this.currentTrackIndex = (this.currentTrackIndex + 1) % this.playlist.length;
                    this._playTrack();
                 }
            }, 2000);
        }
    }

    stopMusic() {
        if (this.currentMusicSource) {
            this.currentMusicSource.onended = null; // Très important pour éviter l'enchaînement
            this.currentMusicSource.stop(0);
            this.currentMusicSource = null;
        }
        // Réinitialise l'état pour permettre une nouvelle lecture
        this.playlist = [];
        this.currentPlaylistIdentifier = null;
        this.currentTrackIndex = -1;
        this.isLoading = false;
    }

    isPlaying() {
        return this.currentMusicSource !== null && !this.isLoading;
    }

    // ... Le reste des méthodes (setVolume, toggleMute, etc.) reste inchangé ...
    setVolume(volume) {
        this.musicVolume = parseFloat(volume);
        if (this.gainNode && !this.isMuted) {
            this.gainNode.gain.setValueAtTime(this.musicVolume, this.audioContext.currentTime);
        }
    }

    toggleMute() {
        this.setMute(!this.isMuted);
    }

    setMute(isMuted) {
        this.isMuted = isMuted;
        if (this.gainNode) {
            if (this.isMuted) {
                this.gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
            } else {
                this.setVolume(this.musicVolume);
            }
        }
    }

    getSettings() {
        return {
            volume: this.musicVolume,
            isMuted: this.isMuted
        };
    }
}

export default new AudioService();