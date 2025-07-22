import AssetManager     from '../data/AssetManager.js';
import GameData         from '../data/GameData.js';
import AudioService     from '../services/AudioService.js';
import GamepadService   from '../services/GamepadService.js';

class MenuScreen {
    constructor(gameState, navigateTo) {
        this.gameState = gameState;
        this.navigateTo = navigateTo;
        this.element = this.createMenuElement();
        this.isGamepadActive = false;
        this.selectedButtonIndex = 0;
        this.startFallingTiles();

        this.handleGamepadInput = this.handleGamepadInput.bind(this);
        this.handleAnyGamepadInput = this.handleAnyGamepadInput.bind(this);
    }

    createMenuElement() {
        const screen = document.createElement('div');
        screen.className = 'screen menu-screen';
        screen.id = 'menu-screen';

        const fallingTilesContainer = document.createElement('div');
        fallingTilesContainer.className = 'falling-tiles-container';
        this.fallingTilesContainer = fallingTilesContainer;

        const title = document.createElement('h1');
        title.className = 'menu-title';
        title.textContent = 'Sticklines +';

        const buttonsContainer = document.createElement('div');
        buttonsContainer.className = 'menu-buttons';

        const collectionButton = document.createElement('button');
        collectionButton.className = 'menu-button';
        collectionButton.textContent = 'View Collection';
        collectionButton.onclick = () => {
            AudioService.playSoundEffect('ui_click');
            this.navigateTo('collection');
        };

        const startButton = document.createElement('button');
        startButton.className = 'menu-button';
        startButton.textContent = 'Start New Run';
        startButton.onclick = () => {
            this.startGame();
        };

        buttonsContainer.appendChild(collectionButton);
        buttonsContainer.appendChild(startButton);
        
        screen.appendChild(fallingTilesContainer);
        screen.appendChild(title);
        screen.appendChild(buttonsContainer);

        return screen;
    }

    startGame() {
        // Ensure this can be called by both mouse and gamepad
        AudioService.playSoundEffect('ui_click');
        this.gameState.startNewRun();
        this.navigateTo('levelSelect');
    }

    updateSelection() {
        const buttons = this.element.querySelectorAll('.menu-button');
        if (buttons.length === 0) return;

        document.querySelectorAll('.gamepad-selected').forEach(el => el.classList.remove('gamepad-selected'));
        
        if (this.selectedButtonIndex < 0) this.selectedButtonIndex = buttons.length - 1;
        if (this.selectedButtonIndex >= buttons.length) this.selectedButtonIndex = 0;

        buttons[this.selectedButtonIndex].classList.add('gamepad-selected');
    }

    startFallingTiles() {
        const tileKeys = Object.keys(GameData.tiles);
        setInterval(() => {
            if (!this.element.classList.contains('active')) return;

            const tileKey = tileKeys[Math.floor(Math.random() * tileKeys.length)];
            const tileData = GameData.tiles[tileKey];
            const tileImage = AssetManager.getImage(tileData.asset);
            
            if (!tileImage) return;

            const tileElement = document.createElement('div');
            tileElement.className = 'falling-tile';
            tileElement.style.backgroundImage = `url(${tileImage.src})`;
            tileElement.style.left = `${Math.random() * 100}%`;
            tileElement.style.animationDuration = `${5 + Math.random() * 5}s`;
            tileElement.style.animationDelay = `${Math.random() * 5}s`;
            
            this.fallingTilesContainer.appendChild(tileElement);

            setTimeout(() => {
                tileElement.remove();
            }, 15000); // Increased timeout to 15s to ensure they reach the bottom

        }, 300); // Increased spawn rate slightly
    }

    handleAnyGamepadInput() {
        if (!this.isGamepadActive) {
            this.isGamepadActive = true;
            this.updateSelection();
        }
    }

    handleGamepadInput(e) {
        if (!this.element.classList.contains('active')) return;
        const { detail } = e;
        const buttons = this.element.querySelectorAll('.menu-button');

        if ((detail.button === 'down' || detail.button === 'up') && detail.down) {
            AudioService.playSoundEffect('ui_click');
            if (detail.button === 'down') {
                this.selectedButtonIndex = (this.selectedButtonIndex + 1) % buttons.length;
            } else {
                this.selectedButtonIndex = (this.selectedButtonIndex - 1 + buttons.length) % buttons.length;
            }
            this.updateSelection();
            return;
        }

        if (detail.button === 'A' && detail.down) { // B0 is 'A' on most controllers
            const selectedButton = this.element.querySelector('.gamepad-selected');
            if (selectedButton) {
                selectedButton.click();
            }
        }
    }

    getElement() {
        return this.element;
    }

    show() {
        this.element.classList.add('active');
        this.selectedButtonIndex = 0;
        GamepadService.addEventListener('gamepad:any', this.handleAnyGamepadInput);
        GamepadService.addEventListener('gamepad:button', this.handleGamepadInput);
    }

    hide() {
        this.element.classList.remove('active');
        this.isGamepadActive = false;
        this.element.querySelectorAll('.gamepad-selected').forEach(el => el.classList.remove('gamepad-selected'));
        GamepadService.removeEventListener('gamepad:any', this.handleAnyGamepadInput);
        GamepadService.removeEventListener('gamepad:button', this.handleGamepadInput);
    }
}

export default MenuScreen;