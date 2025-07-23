import AssetManager         from './data/AssetManager.js';
import GameState            from './services/GameState.js';
import MenuScreen           from './components/MenuScreen.js';
import LevelSelectScreen    from './components/LevelSelectScreen.js';
import GameScreen           from './components/GameScreen.js';
import ShopScreen           from './components/ShopScreen.js';
import CollectionScreen     from './components/CollectionScreen.js';
import SettingsModal        from './components/SettingsModal.js';
import AudioService         from './services/AudioService.js';
import Tooltip              from './components/Tooltip.js';
import GamepadService       from './services/GamepadService.js';

const GAME_MUSIC_PLAYLIST = ['samba_race.mp3', 'rotation.mp3', 'Baskick.mp3', 'Aldebaran.mp3', 'Scoreboard.mp3', 'onefin_square.mp3'];

class App {
    constructor() {
        this.appElement = document.getElementById('app');
        this.loadingScreen = document.getElementById('loading-screen');
        this.gameOverScreen = document.getElementById('game-over-screen');
        this.gameState = new GameState();
        this.tooltip = new Tooltip(document.getElementById('tooltip'));
        this.gameState.tooltip = this.tooltip; // Give GameState access to tooltip
        
        this.settingsModal = new SettingsModal(
            document.getElementById('settings-modal-container'),
            AudioService
        );

        this.screens = {
            menu: new MenuScreen(this.gameState, this.navigateTo.bind(this), this.settingsModal),
            levelSelect: new LevelSelectScreen(this.gameState, this.navigateTo.bind(this), this.tooltip),
            game: new GameScreen(this.gameState, this.navigateTo.bind(this), this.settingsModal),
            shop: new ShopScreen(this.gameState, this.navigateTo.bind(this), this.tooltip),
            collection: new CollectionScreen(this.gameState, this.navigateTo.bind(this)),
        };

        this.init();
    }

    async init() {
        console.log("Initializing Sticklings...");
        AudioService.init(); // Init audio early to capture user interaction
        GamepadService.init();
        await AssetManager.loadAssets();
        console.log("Assets loaded.");
        
        await AudioService.loadSoundEffects({
            'place_tile': 'place_tile.mp3',
            'ui_click': 'ui_click.mp3',
            'buy_item': 'shop_buy.mp3',
            'reroll': 'shop_reroll.mp3',
            'level_win': 'level_win.mp3',
            'enchant_apply': 'enchant_apply.mp3',
            'run_fail': 'run_fail.mp3',
            'ante_up': 'ante_up.mp3'
        });

        Object.values(this.screens).forEach(screen => {
            this.appElement.appendChild(screen.getElement());
        });

        this.loadingScreen.style.opacity = '0';
        setTimeout(() => {
            this.loadingScreen.style.display = 'none';
        }, 500);

        this.navigateTo('menu');
        this.startUpdateLoop();

        GamepadService.addEventListener('gamepad:button', e => {
            if (e.detail.button === 'Start' && e.detail.down) {
                this.settingsModal.toggle();
            }
        });
    }

    startUpdateLoop() {
        requestAnimationFrame(() => this.update());
    }

    update() {
        // Only show game over if a run is in progress and has failed
        if (this.gameState.runInProgress && this.gameState.runFailed && !this.gameOverScreen.classList.contains('active')) {
            this.showGameOver();
        }
        GamepadService.update();
        requestAnimationFrame(() => this.update());
    }
    
    showGameOver() {
        AudioService.playSoundEffect('run_fail');
        this.gameOverScreen.classList.add('active');
        const summaryEl = this.gameOverScreen.querySelector('#run-summary');
        summaryEl.innerHTML = `
            You reached Ante ${this.gameState.ante}.<br>
            Final Score: ${this.gameState.finalScore}
        `;
        
        const backBtn = this.gameOverScreen.querySelector('#game-over-back-btn');
        
        const onAnyInput = () => {
            backBtn.classList.add('gamepad-selected');
        };

        const onConfirm = (e) => {
            if (e.detail.button === 'A' && e.detail.down) {
                backBtn.click();
            }
        };

        backBtn.onclick = () => {
            AudioService.playSoundEffect('ui_click');
            this.gameOverScreen.classList.remove('active');
            backBtn.classList.remove('gamepad-selected');
            GamepadService.removeEventListener('gamepad:any', onAnyInput);
            GamepadService.removeEventListener('gamepad:button', onConfirm);
            this.navigateTo('menu');
        };

        if (Object.keys(GamepadService.gamepads).length > 0) {
            onAnyInput();
        }
        GamepadService.addEventListener('gamepad:any', onAnyInput);
        GamepadService.addEventListener('gamepad:button', onConfirm);
    }

    navigateTo(screenName, options = {}) {
        /*if (screenName === 'menu' && this.gameState.runInProgress) {
            this.gameState.reset();
        }*/

        console.log(`Navigating to ${screenName}`);
        
        Object.values(this.screens).forEach(screen => screen.hide());

        const screen = this.screens[screenName];
        if (screen) {
            screen.show(options);
        } else {
            console.error(`Screen "${screenName}" not found!`);
        }
    }
}

new App();