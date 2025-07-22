import AudioService     from '../services/AudioService.js';
import GamepadService   from '../services/GamepadService.js';

class SettingsModal {
    constructor(container, audioService) {
        this.container = container;
        this.audioService = audioService;
        this.isVisible = false;
        
        this.handleKeyDown = this.handleKeyDown.bind(this);
        this.handleGamepadInput = this.handleGamepadInput.bind(this);
        this.handleAnyGamepadInput = this.handleAnyGamepadInput.bind(this);

        this.selectableElements = [];
        this.selectedControlIndex = 0;
        this.isGamepadActive = false;
    }

    render() {
        const settings = this.audioService.getSettings();
        this.container.innerHTML = `
            <div class="settings-modal-overlay ${this.isVisible ? 'active' : ''}">
                <div class="settings-modal-content">
                    <h2>Settings</h2>
                    
                    <div class="settings-row">
                        <div class="settings-label">
                            <label for="music-volume">Music Volume</label>
                            <output id="volume-output" name="result" for="music-volume">${settings.volume}</output>
                        </div>
                        <input type="range" id="music-volume" min="0" max="1" step="0.05" value="${settings.volume}">
                    </div>
                    
                    <div class="settings-row">
                        <label>Sound</label>
                        <button class="menu-button small-button" id="mute-toggle-btn">${settings.isMuted ? 'Unmute' : 'Mute'}</button>
                    </div>

                    <div class="settings-modal-footer">
                        <button class="menu-button small-button" id="settings-close-btn">Close</button>
                    </div>
                </div>
            </div>
        `;
        this.addEventListeners();
        this.updateSelectableElements();
    }

    updateSelectableElements() {
        this.selectableElements = [
            this.container.querySelector('#music-volume'),
            this.container.querySelector('#mute-toggle-btn'),
            this.container.querySelector('#settings-close-btn')
        ];
        if (this.isGamepadActive) {
            this.updateSelection();
        }
    }

    updateSelection() {
        this.selectableElements.forEach(el => el.classList.remove('gamepad-selected'));
        if (!this.isGamepadActive || this.selectableElements.length === 0) return;

        this.selectedControlIndex = (this.selectedControlIndex + this.selectableElements.length) % this.selectableElements.length;
        const selectedEl = this.selectableElements[this.selectedControlIndex];

        if (selectedEl) {
            selectedEl.classList.add('gamepad-selected');
            selectedEl.focus();
        }
    }

    addEventListeners() {
        const closeBtn = this.container.querySelector('#settings-close-btn');
        const volumeSlider = this.container.querySelector('#music-volume');
        const volumeOutput = this.container.querySelector('#volume-output');
        const muteBtn = this.container.querySelector('#mute-toggle-btn');
        const overlay = this.container.querySelector('.settings-modal-overlay');

        if (closeBtn) {
            closeBtn.onclick = () => this.hide();
        }
        if (muteBtn) {
            muteBtn.onclick = () => {
                this.audioService.toggleMute();
                AudioService.playSoundEffect('ui_click');
                this.render(); // Re-render to update button text
            };
        }
        if (overlay) {
            overlay.onclick = (e) => {
                if (e.target === overlay) {
                    this.hide();
                }
            };
        }
        if (volumeSlider) {
            volumeSlider.oninput = (e) => {
                volumeOutput.value = e.target.value;
                this.audioService.setVolume(e.target.value);
            };
        }
    }

    handleAnyGamepadInput() {
        if (!this.isGamepadActive && this.isVisible) {
            this.isGamepadActive = true;
            this.updateSelection();
        }
    }

    handleGamepadInput(e) {
        if (!this.isVisible) return;
        const { detail } = e;

        if (detail.button === 'B' && detail.down) {
            this.hide();
            return;
        }

        const currentSelection = this.selectableElements[this.selectedControlIndex];
        let selectionChanged = false;

        if (detail.button === 'up' && detail.down) {
            this.selectedControlIndex--;
            selectionChanged = true;
        }
        if (detail.button === 'down' && detail.down) {
            this.selectedControlIndex++;
            selectionChanged = true;
        }

        if (detail.button === 'A' && detail.down) {
            currentSelection?.click();
        }

        if (currentSelection?.type === 'range') {
             if (detail.button === 'left' && detail.down) {
                currentSelection.stepDown();
                currentSelection.dispatchEvent(new Event('input'));
            }
            if (detail.button === 'right' && detail.down) {
                currentSelection.stepUp();
                currentSelection.dispatchEvent(new Event('input'));
            }
        }
        
        if (selectionChanged) {
            this.updateSelection();
            AudioService.playSoundEffect('ui_click');
        }
    }

    handleKeyDown(e) {
        if (!this.isVisible) return;
        e.preventDefault();
        e.stopPropagation();

        if (e.key === 'Escape') {
            this.hide();
            return;
        }

        if (!this.isGamepadActive) this.isGamepadActive = true;

        const currentSelection = this.selectableElements[this.selectedControlIndex];
        let selectionChanged = false;

        switch (e.key) {
            case 'ArrowUp':
                this.selectedControlIndex--;
                selectionChanged = true;
                break;
            case 'ArrowDown':
                this.selectedControlIndex++;
                selectionChanged = true;
                break;
            case 'ArrowLeft':
                if (currentSelection?.type === 'range') {
                    currentSelection.stepDown();
                    currentSelection.dispatchEvent(new Event('input'));
                }
                break;
            case 'ArrowRight':
                if (currentSelection?.type === 'range') {
                    currentSelection.stepUp();
                    currentSelection.dispatchEvent(new Event('input'));
                }
                break;
            case 'Enter':
                currentSelection?.click();
                break;
        }

        if (selectionChanged) {
            this.updateSelection();
            AudioService.playSoundEffect('ui_click');
        }
    }

    show() {
        if (this.isVisible) return;
        this.isVisible = true;
        this.selectedControlIndex = 0;
        this.isGamepadActive = Object.keys(GamepadService.gamepads).length > 0;
        this.render();
        window.addEventListener('keydown', this.handleKeyDown, true);
        GamepadService.addEventListener('gamepad:any', this.handleAnyGamepadInput);
        GamepadService.addEventListener('gamepad:button', this.handleGamepadInput);
    }

    hide() {
        if (!this.isVisible) return;
        this.isVisible = false;
        const overlay = this.container.querySelector('.settings-modal-overlay');
        if (overlay) {
            overlay.classList.remove('active');
        }
        window.removeEventListener('keydown', this.handleKeyDown, true);
        GamepadService.removeEventListener('gamepad:any', this.handleAnyGamepadInput);
        GamepadService.removeEventListener('gamepad:button', this.handleGamepadInput);
        AudioService.playSoundEffect('ui_click');
    }
    
    toggle() {
        if(this.isVisible) {
            this.hide();
        } else {
            this.show();
        }
    }
}

export default SettingsModal;