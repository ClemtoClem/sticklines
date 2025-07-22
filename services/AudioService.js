const PREFIX_SOUND_PATH = "./assets/sounds/";

class AudioService {
    constructor() {
        this.audioContext = null;
        this.currentMusicSource = null;
        this.playlist = [];
        this.currentTrackIndex = 0;
        this.isInitialized = false;
        this.soundData = {}; // Will store ArrayBuffers
        this.decodedSoundBuffers = {}; // Will store decoded AudioBuffers
    }

    init() {
        if (this.isInitialized) return;
        
        const userInteraction = () => {
            if (this.audioContext === null) {
                try {
                    this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
                    console.log("AudioContext created.");
                    this.decodeAllSounds();
                } catch (e) {
                    console.error("Failed to create AudioContext:", e);
                    return; // Can't proceed without an audio context
                }
            }
            // Remove the event listener after the first interaction
            window.removeEventListener('click', userInteraction, true);
            window.removeEventListener('keydown', userInteraction, true);
            this.isInitialized = true;
        };

        // AudioContext can only be started after a user interaction.
        // Use capture phase to ensure it runs before other click handlers.
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
        const fullPath = PREFIX_SOUND_PATH + url;
        try {
            const response = await fetch(fullPath);
            const arrayBuffer = await response.arrayBuffer();
            this.soundData[key] = arrayBuffer;
        } catch (error) {
            console.error(`Error loading sound data for ${fullPath}:`, error);
        }
    }

    async decodeAllSounds() {
        if (!this.audioContext) return;
        console.log("Decoding all loaded sounds...");
        for (const key in this.soundData) {
            if (!this.decodedSoundBuffers[key]) { // Don't re-decode
                try {
                    // We need to copy the buffer because decodeAudioData can sometimes be destructive.
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
             if (!this.isInitialized) {
                console.warn(`Audio not initialized. Can't play ${key}.`);
             } else {
                console.warn(`Sound effect '${key}' not found or not decoded.`);
             }
            return;
        }
        const source = this.audioContext.createBufferSource();
        source.buffer = this.decodedSoundBuffers[key];
        source.connect(this.audioContext.destination);
        source.start(0);
    }

    async playMusic(playlist) {
        if (this.isPlaying()) {
            return; // Already playing, do nothing.
        }

        if (!this.audioContext) {
            console.warn("AudioContext not ready, music deferred.");
            // We can try to play music once the context is initialized
            const playWhenReady = (e) => {
                if(this.audioContext && !this.isPlaying()) {
                    this.playMusic(playlist);
                    window.removeEventListener('click', playWhenReady, true);
                    window.removeEventListener('keydown', playWhenReady, true);
                }
            };
            window.addEventListener('click', playWhenReady, true);
            window.addEventListener('keydown', playWhenReady, true);
            return;
        }

        this.playlist = playlist;
        this.currentTrackIndex = Math.floor(Math.random() * this.playlist.length);
        this.playNextTrack();
    }

    async playNextTrack() {
        if (this.playlist.length === 0 || this.currentMusicSource) return;

        const fullPath = PREFIX_SOUND_PATH + this.playlist[this.currentTrackIndex];
        
        try {
            const response = await fetch(fullPath);
            const arrayBuffer = await response.arrayBuffer();
            const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);

            this.currentMusicSource = this.audioContext.createBufferSource();
            this.currentMusicSource.buffer = audioBuffer;
            this.currentMusicSource.connect(this.audioContext.destination);
            this.currentMusicSource.start();

            this.currentMusicSource.onended = () => {
                this.currentMusicSource = null; // Clear the source before playing next
                this.currentTrackIndex = (this.currentTrackIndex + 1) % this.playlist.length;
                this.playNextTrack();
            };
        } catch (error) {
            console.error(`Error playing audio track ${fullPath}:`, error);
            // In case of error, clear source and try next track after a delay
            this.currentMusicSource = null; 
            setTimeout(() => {
                 this.currentTrackIndex = (this.currentTrackIndex + 1) % this.playlist.length;
                 this.playNextTrack();
            }, 1000);
        }
    }

    stopMusic() {
        if (this.currentMusicSource) {
            this.currentMusicSource.onended = null; // Prevent looping
            this.currentMusicSource.stop();
            this.currentMusicSource = null;
        }
        this.playlist = [];
    }

    isPlaying() {
        return this.currentMusicSource !== null;
    }
}

export default new AudioService();