import AssetManager     from '../data/AssetManager.js';
import GameData         from '../data/GameData.js';
import AudioService     from '../services/AudioService.js';
import GamepadService   from '../services/GamepadService.js';

class CollectionScreen {
    constructor(gameState, navigateTo) {
        this.gameState = gameState;
        this.navigateTo = navigateTo;
        this.element = this.createEmptyScreen();

        this.activeTab = 'tiles'; // 'tiles', 'enchantments', 'stickers'
        this.selectedItem = null;

        // Gamepad state
        this.isGamepadActive = false;
        this.gamepadFocus = 'tabs'; // 'tabs', 'grid', 'sidebar'
        this.selectedTabIndex = 0;
        this.selectedGridIndex = 0;
        this.selectableElements = {};

        this.handleGamepadInput = this.handleGamepadInput.bind(this);
        this.handleAnyGamepadInput = this.handleAnyGamepadInput.bind(this);
    }

    createEmptyScreen() {
        const screen = document.createElement('div');
        screen.className = 'screen collection-screen';
        screen.id = 'collection-screen';
        return screen;
    }

    render() {
        this.element.innerHTML = `
            <div class="collection-header">
                <button id="secret-unlock-btn"></button>
                <span>Collection</span>
                <button class="menu-button small-button" id="collection-back-btn">Back</button>
            </div>
            <div class="collection-main">
                <div class="collection-grid-container">
                    <div class="collection-tabs">
                        <div class="collection-tab ${this.activeTab === 'tiles' ? 'active' : ''}" data-tab="tiles">Tiles</div>
                        <div class="collection-tab ${this.activeTab === 'enchantments' ? 'active' : ''}" data-tab="enchantments">Enchantments</div>
                        <div class="collection-tab ${this.activeTab === 'stickers' ? 'active' : ''}" data-tab="stickers">Stickers</div>
                    </div>
                    <div class="collection-items-grid">
                        ${this.renderGridItems()}
                    </div>
                </div>
                <div class="collection-info-panel">
                    ${this.renderInfoPanel()}
                </div>
            </div>
        `;
        this.addEventListeners();
        this.updateSelectableElements();
    }

    renderGridItems() {
        const items = Object.values(GameData[this.activeTab]);
        const discovered = this.gameState.discovered[this.activeTab];

        return items.map(item => {
            const isDiscovered = discovered.has(item.id);
            return `
                <div class="collection-item ${!isDiscovered ? 'undiscovered' : ''}" data-item-id="${item.id}">
                    <div class="collection-item-icon" style="background-image: url(${AssetManager.getImage(item.asset).src});"></div>
                    <span class="collection-item-name">${isDiscovered ? item.name : '???'}</span>
                </div>
            `;
        }).join('');
    }

    renderInfoPanel() {
        if (!this.selectedItem) {
            return `<div class="collection-info-placeholder">Select an item to view details.</div>`;
        }

        const discovered = this.gameState.discovered[this.activeTab];
        if (!discovered.has(this.selectedItem.id)) {
             return `<div class="collection-info-placeholder">???</div>`;
        }
        
        const foundCount = this.gameState.discoveryCounts[this.activeTab]?.[this.selectedItem.id] || 0;

        return `
            <div class="collection-info-icon" style="background-image: url(${AssetManager.getImage(this.selectedItem.asset).src}); border-color: var(--color-rarity-${this.selectedItem.rarity.toLowerCase()})"></div>
            <h2 class="collection-info-name">${this.selectedItem.name}</h2>
            <div class="collection-info-rarity" style="color: var(--color-rarity-${this.selectedItem.rarity.toLowerCase()})">${this.selectedItem.rarity}</div>
            <div class="collection-info-description">${this.selectedItem.tooltip}</div>
            <div class="collection-info-count">Found this run: ${foundCount}</div>
        `;
    }

    addEventListeners() {
        this.element.querySelector('#collection-back-btn').onclick = () => {
            AudioService.playSoundEffect('ui_click');
            this.navigateTo('menu');
        };

        this.element.querySelector('#secret-unlock-btn').onclick = () => {
            if (confirm('Unlock all items for discovery? (Session only)')) {
                this.gameState.unlockAll();
                this.render(); // Re-render to show unlocked items
            }
        };

        this.element.querySelectorAll('.collection-tab').forEach(tab => {
            tab.onclick = (e) => {
                AudioService.playSoundEffect('ui_click');
                this.activeTab = e.currentTarget.dataset.tab;
                this.selectedItem = null;
                this.render();
            };
        });

        this.element.querySelectorAll('.collection-item').forEach(item => {
            item.onclick = (e) => {
                const itemId = e.currentTarget.dataset.itemId;
                const itemData = GameData[this.activeTab][itemId];
                if (itemData && this.gameState.discovered[this.activeTab].has(itemId)) {
                    AudioService.playSoundEffect('ui_click');
                    this.selectedItem = itemData;
                    this.render();
                }
            };
        });
    }

    updateSelectableElements() {
        this.selectableElements = {
            tabs: Array.from(this.element.querySelectorAll('.collection-tab')),
            grid: Array.from(this.element.querySelectorAll('.collection-item')),
            sidebar: [this.element.querySelector('#collection-back-btn')],
        };
        if (this.isGamepadActive) {
            this.updateSelection();
        }
    }

    updateSelection() {
        this.element.querySelectorAll('.gamepad-selected').forEach(el => el.classList.remove('gamepad-selected'));
        if (!this.isGamepadActive) return;

        let selectedEl;
        if (this.gamepadFocus === 'tabs') {
            selectedEl = this.selectableElements.tabs[this.selectedTabIndex];
        } else if (this.gamepadFocus === 'grid') {
            selectedEl = this.selectableElements.grid[this.selectedGridIndex];
             if (selectedEl) {
                // Auto-select item for info panel on gamepad cursor hover
                const itemId = selectedEl.dataset.itemId;
                this.selectedItem = GameData[this.activeTab][itemId];
                this.element.querySelector('.collection-info-panel').innerHTML = this.renderInfoPanel();
            }
        } else if (this.gamepadFocus === 'sidebar') {
            selectedEl = this.selectableElements.sidebar[0];
        }

        if (selectedEl) {
            selectedEl.classList.add('gamepad-selected');
            selectedEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    }

    handleAnyGamepadInput() {
        if (!this.isGamepadActive && this.element.classList.contains('active')) {
            this.isGamepadActive = true;
            this.gamepadFocus = 'tabs';
            this.updateSelection();
        }
    }

    handleGamepadInput(e) {
        if (!this.isGamepadActive || !this.element.classList.contains('active')) return;
        const { detail } = e;
        let selectionChanged = true;

        if (detail.button === 'A' && detail.down) {
            const focusedEl = this.element.querySelector('.gamepad-selected');
            focusedEl?.click();
            selectionChanged = false; // click handles the re-render
        } else if (this.gamepadFocus === 'tabs') {
            if (detail.button === 'right' && detail.down) this.selectedTabIndex = (this.selectedTabIndex + 1) % 3;
            else if (detail.button === 'left' && detail.down) this.selectedTabIndex = (this.selectedTabIndex + 2) % 3;
            else if (detail.button === 'down' && detail.down) this.gamepadFocus = 'grid';
            else selectionChanged = false;
        } else if (this.gamepadFocus === 'grid') {
            const grid = this.selectableElements.grid;
            const numCols = getComputedStyle(this.element.querySelector('.collection-items-grid')).gridTemplateColumns.split(' ').length;
            if (detail.button === 'up' && detail.down) {
                if (this.selectedGridIndex < numCols) this.gamepadFocus = 'tabs';
                else this.selectedGridIndex -= numCols;
            } else if (detail.button === 'down' && detail.down) this.selectedGridIndex = Math.min(grid.length - 1, this.selectedGridIndex + numCols);
            else if (detail.button === 'left' && detail.down) this.selectedGridIndex = Math.max(0, this.selectedGridIndex - 1);
            else if (detail.button === 'right' && detail.down) this.selectedGridIndex = Math.min(grid.length - 1, this.selectedGridIndex + 1);
            else if (detail.button === 'Y' && detail.down) this.gamepadFocus = 'sidebar';
            else selectionChanged = false;

            this.selectedGridIndex = (this.selectedGridIndex + grid.length) % grid.length;

        } else if (this.gamepadFocus === 'sidebar') {
            if ((detail.button === 'B' || detail.button === 'X') && detail.down) this.gamepadFocus = 'grid';
            else selectionChanged = false;
        }

        if (selectionChanged) {
            AudioService.playSoundEffect('ui_click');
            this.updateSelection();
        }
    }

    show(options) {
        this.isGamepadActive = false;
        this.selectedItem = null;
        this.activeTab = 'tiles';
        this.render();
        this.element.classList.add('active');
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

    getElement() {
        return this.element;
    }
}

export default CollectionScreen;