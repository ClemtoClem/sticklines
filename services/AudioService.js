const PREFIX_SOUND_PATH = "./assets/sounds/";

class AudioService {
    constructor() {
        this.audioContext = null;
        this.gainNode = null;
        this.currentMusicSource = null;
        this.playlist = [];
        this.currentTrackIndex = 0;
        this.isInitialized = false;
        this.soundData = {}; // Will store ArrayBuffers
        this.decodedSoundBuffers = {}; // Will store decoded AudioBuffers
        this._musicPlaylistToPlay = null; // To hold music requested before init
        this.currentPlaylist = null; // Track the current playlist for checks
        this.isLoading = false; // To prevent starting new music while one is loading

        this.musicVolume = 0.5; // Default volume at 50%
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

                    console.log("AudioContext created.");
                    this.decodeAllSounds();
                    // If music was requested before context was ready, play it now.
                    if (this._musicPlaylistToPlay) {
                        this.playMusic(this._musicPlaylistToPlay.playlist, this._musicPlaylistToPlay.startWith);
                        this._musicPlaylistToPlay = null;
                    }
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
        const trackUrl = PREFIX_SOUND_PATH + url;
        try {
            const response = await fetch(trackUrl);
            const arrayBuffer = await response.arrayBuffer();
            this.soundData[key] = arrayBuffer;
        } catch (error) {
            console.error(`Error loading sound data for ${key}:`, error);
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
        source.connect(this.audioContext.destination); // Sound effects play at full volume
        source.start(0);
    }

    playMusic(playlist, startWith = null) {
        // If music is already playing or currently loading, do nothing.
        if (this.isPlaying() || this.isLoading) {
            // And if it's the same playlist, we definitely don't need to do anything.
            if (this.currentPlaylist && JSON.stringify(this.currentPlaylist) === JSON.stringify(playlist)) {
                return;
            }
        }
        
        // If other music is playing, stop it first.
        this.stopMusic();
        
        if (!this.audioContext) {
            console.warn("AudioContext not ready, music deferred.");
            this._musicPlaylistToPlay = { playlist, startWith }; // Store playlist and start track
            return;
        }

        this.playlist = [...playlist]; // Make a copy
        this.currentPlaylist = playlist; // Store reference for comparison
        if (this.playlist.length === 0) return;
        
        if (startWith && Array.isArray(startWith) && startWith.length > 0) {
            // Pick a random starting track from the provided list
            const startTrack = startWith[Math.floor(Math.random() * startWith.length)];
            const startIndex = this.playlist.indexOf(startTrack);

            if (startIndex !== -1) {
                // Move the chosen start track to the beginning of the shuffled playlist
                this.playlist.splice(startIndex, 1);
                this.playlist.sort(() => Math.random() - 0.5); // Shuffle the rest
                this.playlist.unshift(startTrack); // Add start track to the front
                this.currentTrackIndex = 0;
            } else {
                // If start track not in playlist, just shuffle
                this.playlist.sort(() => Math.random() - 0.5);
                this.currentTrackIndex = 0;
            }
        } else {
             this.currentTrackIndex = Math.floor(Math.random() * this.playlist.length);
        }

        this.playNextTrack();
    }

    async playNextTrack() {
        if (this.playlist.length === 0 || this.currentMusicSource || this.isLoading) return;

        this.isLoading = true;
        const trackUrl = PREFIX_SOUND_PATH + this.playlist[this.currentTrackIndex];
        
        try {
            const response = await fetch(trackUrl);
            const arrayBuffer = await response.arrayBuffer();
            const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);

            this.currentMusicSource = this.audioContext.createBufferSource();
            this.currentMusicSource.buffer = audioBuffer;
            this.currentMusicSource.connect(this.gainNode);
            this.currentMusicSource.start();
            this.isLoading = false; // Finished loading and is now playing

            this.currentMusicSource.onended = () => {
                this.currentMusicSource = null; // Clear the source before playing next
                this.currentTrackIndex = (this.currentTrackIndex + 1) % this.playlist.length;
                this.playNextTrack();
            };
        } catch (error) {
            console.error(`Error playing audio track ${trackUrl}:`, error);
            this.isLoading = false; // Reset loading state on error
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
        this.currentPlaylist = null;
        this.isLoading = false; // Ensure loading is reset when stopping
    }

    isPlaying() {
        return this.currentMusicSource !== null;
    }

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