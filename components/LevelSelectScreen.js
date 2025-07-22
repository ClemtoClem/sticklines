import AssetManager     from '../data/AssetManager.js';
import AudioService     from '../services/AudioService.js';
import GameData         from '../data/GameData.js';
import GamepadService   from '../services/GamepadService.js';

const GAME_MUSIC_PLAYLIST = ['/samba race.mp3', '/rotation.mp3', '/Baskick.mp3', '/Aldebaran.mp3', '/Scoreboard.mp3', '/Onefin Square.mp3'];

class LevelSelectScreen {
    constructor(gameState, navigateTo, tooltip) {
        this.gameState = gameState;
        this.navigateTo = navigateTo;
        this.tooltip = tooltip;
        this.element = this.createEmptyScreen();

        this.selectableElements = [];
        this.selectedElementIndex = 0;
        this.isGamepadActive = false;
        this.handleGamepadInput = this.handleGamepadInput.bind(this);
        this.handleAnyGamepadInput = this.handleAnyGamepadInput.bind(this);
    }

    createEmptyScreen() {
        const screen = document.createElement('div');
        screen.className = 'screen level-select-screen';
        screen.id = 'level-select-screen';
        return screen;
    }

    render() {
        const { ante, money, levels, currentLevelIndex } = this.gameState;
        const allLevelsBeaten = currentLevelIndex === -1;

        this.element.innerHTML = `
            <div class="level-select-header">
                <button class="menu-button small-button" id="level-select-back-btn">Main Menu</button>
                <span>Ante ${ante}</span>
                <span style="color: var(--color-gold);">$${money}</span>
            </div>
            <div class="level-select-content">
                <div class="level-container">
                    ${levels.map((level, index) => this.renderLevelButton(level, index)).join('')}
                </div>
            </div>
            ${this.renderStickerDisplay()}
            ${allLevelsBeaten ? this.renderAnteComplete() : ''}
        `;
        this.addEventListeners();
        this.updateSelectableElements();
    }

    updateSelectableElements() {
        const anteUpBtn = this.element.querySelector('.ante-up-btn');
        const backBtn = this.element.querySelector('#level-select-back-btn');
        if (anteUpBtn) {
            this.selectableElements = [anteUpBtn];
        } else {
            this.selectableElements = [ backBtn, ...Array.from(this.element.querySelectorAll('.level-button.available .menu-button')) ];
        }
        
        if (this.isGamepadActive) this.updateSelection();
    }

    renderLevelButton(level, index) {
        const isAvailable = level.status === 'available';
        const isBeaten = level.status === 'beaten';
        const isBoss = level.isBoss;
        
        let classList = 'level-button';
        if (isAvailable) classList += ' available';
        if (isBeaten) classList += ' beaten';
        if (isBoss) classList += ' boss';

        return `
            <div class="${classList}" data-level-index="${index}">
                <div class="level-info">
                    <div>${isBoss ? 'BOSS' : 'Level ' + (index + 1)}</div>
                    <div>Goal: ${level.goal}</div>
                    <div>Reward: $${level.reward}</div>
                </div>
                <div class="level-actions">
                    ${isAvailable ? '<button class="menu-button start-level-btn">Start</button>' : ''}
                    ${isAvailable && !isBoss ? this.renderSkipButton(level) : ''}
                    ${isBeaten ? '<span>âœ“ COMPLETE</span>' : ''}
                </div>
            </div>
        `;
    }
    
    renderSkipButton(level) {
        const {type, item} = level.skipReward;
        const rarityColor = `var(--color-rarity-${item.rarity.toLowerCase()})`;
        
        return `
            <button class="menu-button skip-level-btn">Skip</button>
            <div class="level-skip-reward" 
                 data-tooltip-type="${type}s" 
                 data-tooltip-id="${item.id}">
                <div class="skip-reward-icon" style="background-image: url(${AssetManager.getImage(item.asset).src}); border: 2px solid ${rarityColor};"></div>
                <span class="skip-reward-text">Free: ${item.name}</span>
            </div>
        `;
    }

    renderAnteComplete() {
        return `
            <div class="ante-complete-overlay">
                <div class="ante-complete-text">ANTE COMPLETE!</div>
                <button class="menu-button ante-up-btn">Ante Up!</button>
            </div>
        `;
    }

    renderStickerDisplay() {
        if (this.gameState.stickers.length === 0) return '';
        return `
            <div class="sticker-display">
                ${this.gameState.stickers.map(stickerState => {
                    const stickerData = this.gameState.stickers.find(s => s.id === stickerState.id);
                    const stickerInfo = GameData.stickers[stickerState.id];
                    return `
                    <div class="sticker-item" 
                         data-tooltip-type="stickers" 
                         data-tooltip-id="${stickerInfo.id}" 
                         data-sticker-id="${stickerInfo.id}"
                         data-tooltip-duration="${stickerData.duration}">
                        <img src="${AssetManager.getImage(stickerInfo.asset).src}" class="sticker-icon">
                        <div class="sticker-duration ${stickerData.duration === 1 ? 'warning' : ''}">${stickerData.duration}</div>
                    </div>
                `}).join('')}
            </div>
        `;
    }

    updateSelection() {
        // Clear all existing selections
        this.element.querySelectorAll('.gamepad-selected').forEach(el => el.classList.remove('gamepad-selected'));

        if (this.selectableElements.length > 0) {
            // Clamp index
            if (this.selectedElementIndex < 0) this.selectedElementIndex = this.selectableElements.length - 1;
            if (this.selectedElementIndex >= this.selectableElements.length) this.selectedElementIndex = 0;
            
            const selectedEl = this.selectableElements[this.selectedElementIndex];
            if (selectedEl) {
                selectedEl.classList.add('gamepad-selected');
                selectedEl.focus(); // for accessibility
            }
        }
    }

    handleAnyGamepadInput() {
        if (!this.isGamepadActive) {
            this.isGamepadActive = true;
            this.selectedElementIndex = 0;
            this.updateSelection();
        }
    }

    handleGamepadInput(e) {
        if (!this.isGamepadActive || this.selectableElements.length === 0 || !this.element.classList.contains('active')) return;

        const { detail } = e;
        let selectionChanged = false;

        if (detail.button === 'A' && detail.down) {
            const selectedButton = this.selectableElements[this.selectedElementIndex];
            if (selectedButton) {
                selectedButton.click();
            }
            return;
        } 
        
        if (detail.axis === 'leftY') {
            if (detail.value > 0.5) { // Down
                this.selectedElementIndex++;
                selectionChanged = true;
            } else if (detail.value < -0.5) { // Up
                this.selectedElementIndex--;
                selectionChanged = true;
            }
        } else if (detail.button === 'down' && detail.down) {
            this.selectedElementIndex++;
            selectionChanged = true;
        } else if (detail.button === 'up' && detail.down) {
            this.selectedElementIndex--;
            selectionChanged = true;
        }
        
        if (selectionChanged) {
            this.updateSelection();
        }
    }

    addEventListeners() {
        this.element.querySelector('#level-select-back-btn').onclick = () => {
            AudioService.playSoundEffect('ui_click');
            this.navigateTo('menu');
        };


        this.element.querySelectorAll('.start-level-btn').forEach(btn => {
            btn.onclick = () => {
                AudioService.playSoundEffect('ui_click');
                this.navigateTo('game', { levelIndex: this.gameState.currentLevelIndex });
            };
        });

        this.element.querySelectorAll('.skip-level-btn').forEach(btn => {
            btn.onclick = () => {
                AudioService.playSoundEffect('ui_click');
                const level = this.gameState.levels[this.gameState.currentLevelIndex];
                if (!level) return;
                const { type, item } = level.skipReward;

                if (type === 'enchantment') {
                    // Navigate to shop for free enchantment, but don't grant it yet.
                    this.gameState.skipLevel(false); // Mark level as skipped
                    this.navigateTo('shop', { freeEnchantment: item });
                } else {
                    // Grant tile/sticker directly and re-render.
                    this.gameState.skipLevel(true);
                    this.render();
                }
            };
        });
        
        const anteUpBtn = this.element.querySelector('.ante-up-btn');
        if (anteUpBtn) {
            anteUpBtn.onclick = () => {
                AudioService.playSoundEffect('ante_up');
                this.gameState.anteUp();
                this.render();
            };
        }

        this.element.querySelectorAll('[data-tooltip-id]').forEach(el => {
            el.onmouseenter = (e) => this.tooltip.show(e.currentTarget);
            el.onmouseleave = () => this.tooltip.hide();
            el.onmousemove = (e) => this.tooltip.move(e);
        });

        this.element.querySelectorAll('.sticker-item').forEach(el => {
            el.onclick = (e) => {
                const stickerId = e.currentTarget.dataset.stickerId;
                const stickerData = this.gameState.stickers.find(s => s.id === stickerId);
                if (!stickerData) return;
                
                const stickerInfo = GameData.stickers[stickerId];
                if (!stickerInfo) return;

                const sellPrice = Math.floor(stickerInfo.price / 2);
                if (confirm(`Sell ${stickerInfo.name} for $${sellPrice}? This cannot be undone.`)) {
                    AudioService.playSoundEffect('buy_item');
                    this.gameState.money += sellPrice;
                    this.gameState.stickers = this.gameState.stickers.filter(s => s.id !== stickerId);
                    this.render();
                }
            };
        });
    }

    getElement() {
        return this.element;
    }

    show(options) {
        AudioService.playMusic(GAME_MUSIC_PLAYLIST);
        this.render();
        this.element.classList.add('active');
        GamepadService.addEventListener('gamepad:any', this.handleAnyGamepadInput);
        GamepadService.addEventListener('gamepad:button', this.handleGamepadInput);
        GamepadService.addEventListener('gamepad:axis', this.handleGamepadInput);
    }

    hide() {
        this.element.classList.remove('active');
        this.tooltip.hide();
        this.isGamepadActive = false;
        this.element.querySelectorAll('.gamepad-selected').forEach(el => el.classList.remove('gamepad-selected'));
        GamepadService.removeEventListener('gamepad:any', this.handleAnyGamepadInput);
        GamepadService.removeEventListener('gamepad:button', this.handleGamepadInput);
        GamepadService.removeEventListener('gamepad:axis', this.handleGamepadInput);
    }
}

export default LevelSelectScreen;