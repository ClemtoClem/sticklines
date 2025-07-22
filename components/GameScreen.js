import AssetManager     from '../data/AssetManager.js';
import GameData         from '../data/GameData.js';
import AudioService     from '../services/AudioService.js';
import GamepadService   from '../services/GamepadService.js';
import { getInteractionsForTile, calculateScoreForGrid } from '../services/GameLogic.js';
import GameHeader       from './game/GameHeader.js';
import ScorePreview     from './game/ScorePreview.js';
import GameGrid         from './game/GameGrid.js';
import DeckPanel        from './game/DeckPanel.js';
import HandDisplay      from './game/HandDisplay.js';
import StickerDisplay   from './game/StickerDisplay.js';
import ControlsPanel    from './game/ControlsPanel.js';

const MAX_DECK_SIZE = 40;
const HAND_SIZE = 7;

class GameScreen {
    constructor(gameState, navigateTo) {
        this.gameState = gameState;
        this.navigateTo = navigateTo;
        this.element = this.createEmptyScreen();

        // Instantiate child components
        this.header = new GameHeader();
        this.scorePreview = new ScorePreview();
        this.gameGrid = new GameGrid();
        this.deckPanel = new DeckPanel();
        this.handDisplay = new HandDisplay(this.gameState.tooltip);
        this.stickerDisplay = new StickerDisplay(this.gameState.tooltip);
        this.controlsPanel = new ControlsPanel();

        // Bind gamepad handlers
        this.handleAnyGamepadInput = this.handleAnyGamepadInput.bind(this);
        this.handleGamepadInput = this.handleGamepadInput.bind(this);
        this.handleKeyboardInput = this.handleKeyboardInput.bind(this);

        // Level State
        this.resetLevelState();
    }
    
    createEmptyScreen() {
        const screen = document.createElement('div');
        screen.className = 'screen game-screen';
        screen.id = 'game-screen';
        return screen;
    }

    resetLevelState() {
        this.levelData = null;
        this.grid = Array(5).fill(null).map(() => Array(5).fill(null));
        this.hand = Array(HAND_SIZE).fill(null);
        this.levelDeck = [];
        this.currentScore = 0;
        this.handsRemaining = 0;
        this.currentHandNumber = 0; // For hourglass sticker
        this.heldTile = null; // { tile: {id, ...}, handIndex: number }
        this.isRoundInProgress = false;
        this.isRunFailed = false;
        this.interactionLines = []; // To draw lines between interacting tiles
        this.specialPreviews = {}; // For munching, duality etc.
        this.showDeckPanel = false;
        this.showControlsPanel = false;
        this.blockedInHand = new Set(); // For blocking tile

        // Gamepad state
        this.gamepadActive = false;
        this.gamepadFocus = 'grid'; // 'grid' or 'hand'
        this.selectedHandIndex = -1; // -1 means nothing selected by gamepad
        this.gridCursor = { r: 2, c: 2 }; // Start cursor in the middle of the grid
    }

    initializeLevel(levelIndex) {
        this.resetLevelState(); // Ensure a clean state
        this.levelData = this.gameState.levels[levelIndex];
        this.handsRemaining = 3 + (this.gameState.stickers.find(s => s.id === 'need_a_hand') ? 1 : 0);
        this.levelDeck = this.createLevelDeck();

        this.drawHand();
        this.updateAllPreviews(); // Initial calculation for any pre-existing conditions (though grid is empty)
    }

    createLevelDeck() {
        const deck = [];
        // The deck is now an array of objects {id, enchantment}
        this.gameState.deck.forEach(tileInstance => {
            deck.push({ 
                ...GameData.tiles[tileInstance.id],
                enchantment: tileInstance.enchantment,
            });
        });

        // Shuffle deck
        for (let i = deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [deck[i], deck[j]] = [deck[j], deck[i]];
        }
        return deck;
    }

    drawHand() {
        this.currentHandNumber++;
        for (let i = 0; i < HAND_SIZE; i++) {
            if (this.hand[i] === null && this.levelDeck.length > 0) {
                this.hand[i] = this.levelDeck.pop();
            }
        }
    }

    endHand() {
        if (this.handsRemaining > 0) {
            this.handsRemaining--;
        }
    }

    render() {
        if (!this.levelData) return; // Don't render if not initialized

        const scoreReached = this.currentScore >= this.levelData.goal;
        const hasPlayableTiles = this.hand.some(t => t !== null);
        // Fail if out of hands and no more tiles can be played
        const outOfResources = this.handsRemaining <= 0 && !hasPlayableTiles;
        
        if (outOfResources && !scoreReached && !this.isRunFailed) {
            this.isRunFailed = true;
            this.gameState.failRun(this.currentScore);
        }

        const preview = this.calculateScorePreview();

        this.element.innerHTML = `
            ${this.header.render({
                ante: this.gameState.ante,
                money: this.gameState.money,
                deckSize: this.gameState.deck.length,
                maxDeckSize: MAX_DECK_SIZE,
                score: this.currentScore,
                goal: this.levelData.goal,
                scoreReached,
                handsRemaining: this.handsRemaining,
            })}

            <div class="game-main">
                <div class="score-preview">
                     ${this.scorePreview.render({ preview })}
                </div>
                <div id="game-grid-container" class="game-grid-container">
                    ${this.gameGrid.render({ 
                        grid: this.grid, 
                        interactionLines: this.interactionLines, 
                        specialPreviews: this.specialPreviews,
                        gamepadActive: this.gamepadActive,
                        gridCursor: this.gridCursor,
                        gamepadFocus: this.gamepadFocus
                    })}
                    ${this.showDeckPanel ? this.deckPanel.render({ 
                        gameState: this.gameState, 
                        levelDeck: this.levelDeck, 
                        maxDeckSize: MAX_DECK_SIZE 
                    }) : ''}
                     ${this.showControlsPanel ? this.controlsPanel.render({ gamepadActive: this.gamepadActive }) : ''}
                </div>
                 <div class="deck-area">
                      ${this.stickerDisplay.render({ stickers: this.gameState.stickers })}
                 </div>
            </div>

            <div class="game-footer">
                ${this.handDisplay.render({ hand: this.hand, heldTile: this.heldTile, blockedInHand: this.blockedInHand })}
                <button class="menu-button small-button end-hand-btn" ${this.isRoundInProgress || this.isRunFailed || scoreReached || !this.grid.flat().some(c => c) ? 'disabled' : ''}>End Hand</button>
            </div>
            
            ${this.isRunFailed ? this.renderRunFailed() : ''}
        `;
        this.addEventListeners();
        // Manually update overlays after render to ensure elements exist
        this.gameGrid.updateInteractionOverlay(this.element.querySelector('#game-grid'), this.interactionLines);
        this.gameGrid.updateSpecialPreviews(this.element.querySelector('#game-grid-container'), this.specialPreviews);
    }
    
    renderRunFailed() {
        // This is now handled by main.js globally
        return '';
    }

    renderDeckPanel() {
        const deckCounts = {};
        this.gameState.deck.forEach(tile => {
            if (!deckCounts[tile.id]) {
                deckCounts[tile.id] = { count: 0, enchanted: 0 };
            }
            deckCounts[tile.id].count++;
            if (tile.enchantment) {
                deckCounts[tile.id].enchanted++;
            }
        });

        return `
            <div class="deck-panel">
                <h3>Deck (${this.gameState.deck.length} / ${MAX_DECK_SIZE})</h3>
                <h4>Remaining this Level: ${this.levelDeck.length}</h4>
                <div class="deck-list">
                    ${Object.entries(deckCounts).sort(([,a],[,b]) => b.count - a.count).map(([tileId, data]) => {
                        if (data.count === 0) return '';
                        const tileData = GameData.tiles[tileId];
                        const tileAsset = AssetManager.getImage(tileData.asset);
                        return `
                            <div class="deck-list-item">
                                <img src="${tileAsset.src}" class="deck-list-icon" />
                                <span>${tileData.name}</span>
                                ${data.enchanted > 0 ? `<span class="deck-list-enchanted" title="${data.enchanted} enchanted">â˜…${data.enchanted}</span>` : ''}
                                <span class="deck-list-count">x${data.count}</span>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;
    }

    renderTile(cell) {
        const tile = cell.tile;
        const isNew = cell.isNew;
        // Clean up the flag so it doesn't animate on next re-render
        if (isNew) {
            delete cell.isNew;
        }

        const tileAsset = AssetManager.getImage(tile.asset);
        return `<div class="tile placed-tile ${isNew ? 'pop-in' : ''}" style="background-image: url(${tileAsset.src});">
            ${tile.enchantment ? '<div class="enchantment-star"></div>' : ''}
        </div>`;
    }

    renderTileInHand(tile, index) {
        const tileAsset = AssetManager.getImage(tile.asset);
        const isHeld = this.heldTile && this.heldTile.handIndex === index;
        return `
            <div class="tile-in-hand ${isHeld ? 'held' : ''}" 
                 data-hand-index="${index}" 
                 data-tooltip-type="tiles" 
                 data-tooltip-id="${tile.id}"
                 ${tile.enchantment ? `data-tooltip-enchantment="${tile.enchantment}"` : ''}
                 ${tile.enchantment ? `data-enchantment-type="${tile.enchantment}"` : ''}>
                <div class="tile" style="background-image: url(${tileAsset.src});">
                    ${tile.enchantment ? `<div class="enchantment-star" data-enchantment="${tile.enchantment}"></div>` : ''}
                </div>
            </div>`;
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
                         data-tooltip-duration="${stickerData.duration}">
                        <img src="${AssetManager.getImage(stickerInfo.asset).src}" class="sticker-icon">
                        <div class="sticker-duration ${stickerData.duration === 1 ? 'warning' : ''}">${stickerData.duration}</div>
                    </div>
                `}).join('')}
            </div>
        `;
    }

    addEventListeners() {
        // Deck Button
        this.element.querySelector('#deck-btn')?.addEventListener('click', () => {
            AudioService.playSoundEffect('ui_click');
            this.showDeckPanel = !this.showDeckPanel;
            this.render();
        });

        // Controls Button
        this.element.querySelector('#controls-btn')?.addEventListener('click', () => {
            AudioService.playSoundEffect('ui_click');
            this.showControlsPanel = !this.showControlsPanel;
            this.render();
        });

        // Event delegation for grid interactions
        const gridContainer = this.element.querySelector('#game-grid-container');
        if (gridContainer) {
            gridContainer.addEventListener('click', e => this.handleGridMouseClick(e));
            
            gridContainer.addEventListener('mouseover', (e) => {
                const cell = e.target.closest('.grid-cell');
                if (cell) this.handleGridHover(cell, true);
            });

            gridContainer.addEventListener('mouseout', (e) => {
                const cell = e.target.closest('.grid-cell');
                if (cell) this.handleGridHover(cell, false);
            });
        }

        // Hand interactions
        this.handDisplay.addEventListeners(this.element.querySelector('#hand-container'), card => this.handleHandMouseClick(card));
        
        // Sticker tooltips
        this.stickerDisplay.addEventListeners(this.element.querySelector('.sticker-display'));
        
        // End Hand Button
        this.element.querySelector('.end-hand-btn')?.addEventListener('click', () => {
            AudioService.playSoundEffect('ui_click');
            this.startRound();
        });

        // Add this to all buttons for click feedback
        this.element.querySelectorAll('.menu-button').forEach(btn => {
            btn.addEventListener('mousedown', () => btn.classList.add('clicked'));
            btn.addEventListener('mouseup', () => btn.classList.remove('clicked'));
            btn.addEventListener('mouseleave', () => btn.classList.remove('clicked'));
        });
    }

    placeHeldTile(r, c) {
        if (!this.heldTile || this.isRoundInProgress || this.grid[r][c]) {
            return false;
        }

        const specialPreview = this.specialPreviews[`${r}-${c}`];
        if (specialPreview && specialPreview.type === 'duality') return false;

        AudioService.playSoundEffect('place_tile');
        this.grid[r][c] = { tile: this.heldTile.tile, handIndex: this.heldTile.handIndex, isNew: true };
        
        if (this.heldTile.tile.id === 'blocking') {
            this.grid[r][c].isLocked = true;
            const availableHandIndices = this.hand
                .map((tile, index) => (tile ? index : -1))
                .filter(index => index !== -1);
            
            if (availableHandIndices.length > 0) {
                const randomIndex = availableHandIndices[Math.floor(Math.random() * availableHandIndices.length)];
                this.blockedInHand.add(randomIndex);
            }
        }

        this.hand[this.heldTile.handIndex] = null;
        this.heldTile = null;
        this.selectedHandIndex = -1;
        this.updateAllPreviews();
        this.render();
        return true;
    }
    
    pickupTileFromGrid(r, c) {
        if (this.heldTile || this.isRoundInProgress) return false;

        const tileToPickup = this.grid[r][c];
        if (!tileToPickup || tileToPickup.isLocked) return false;

        const specialPreviewLeft = this.specialPreviews[`${r}-${c}`];
        if (specialPreviewLeft && specialPreviewLeft.type === 'duality') return false;
        
        this.grid[r][c] = null;
        
        this.hand[tileToPickup.handIndex] = tileToPickup.tile;
        this.heldTile = { tile: tileToPickup.tile, handIndex: tileToPickup.handIndex };
        this.selectedHandIndex = tileToPickup.handIndex;
        
        this.updateAllPreviews({ r, c, tile: this.heldTile.tile });
        this.render();
        return true;
    }

    handleGridMouseClick(e) {
        if (this.gamepadActive) return;
        const cell = e.target.closest('.grid-cell');
        if (!cell) return;

        const r = parseInt(cell.dataset.r);
        const c = parseInt(cell.dataset.c);

        const placedTile = e.target.closest('.placed-tile');
        if (placedTile) {
            this.pickupTileFromGrid(r, c);
        } else {
            this.placeHeldTile(r, c);
        }
    }
    
    handleGridHover(cell, isEntering) {
        if (this.gamepadActive || !this.heldTile || this.isRoundInProgress) return;
         
        document.querySelectorAll('.grid-cell.hover-valid').forEach(c => c.classList.remove('hover-valid'));
        
        if (isEntering) {
            const r = parseInt(cell.dataset.r);
            const c = parseInt(cell.dataset.c);
            const specialPreview = this.specialPreviews[`${r}-${c}`];
            if (!this.grid[r][c] && !(specialPreview && specialPreview.type === 'duality')) {
                cell.classList.add('hover-valid');
                this.updateAllPreviews({ r, c, tile: this.heldTile.tile });
            }
        } else {
            this.updateAllPreviews();
        }
    }

    handleHandMouseClick(card) {
        if (this.gamepadActive || this.isRoundInProgress) return;
        const handIndex = parseInt(card.dataset.handIndex);
        if (this.blockedInHand.has(handIndex)) return;
        this.selectTileFromHand(handIndex);
    }
    
    selectTileFromHand(handIndex) {
        const tile = this.hand[handIndex];
        if (!tile || this.blockedInHand.has(handIndex)) return;

        if (this.heldTile && this.heldTile.handIndex === handIndex) {
            this.heldTile = null;
            this.selectedHandIndex = -1;
            this.updateAllPreviews();
        } else {
            this.heldTile = { tile, handIndex };
            this.selectedHandIndex = handIndex;
        }
        this.render();
    }

    updateAllPreviews(hoverInfo = null) {
        this.interactionLines = [];
        this.specialPreviews = {};
    
        const previewGrid = JSON.parse(JSON.stringify(this.grid));
        if (hoverInfo && hoverInfo.tile && !previewGrid[hoverInfo.r][hoverInfo.c]) {
            previewGrid[hoverInfo.r][hoverInfo.c] = { tile: hoverInfo.tile };
        }
    
        for (let r = 0; r < 5; r++) {
            for (let c = 0; c < 5; c++) {
                const cell = previewGrid[r][c];
                if (!cell) continue;
    
                const tileId = cell.tile.id;
    
                if (tileId === 'munching' && c > 0 && previewGrid[r][c-1]) {
                    this.specialPreviews[`${r}-${c-1}`] = { type: 'munch' };
                } else if (tileId === 'duality' && c > 0 && c < 4 && previewGrid[r][c+1]) {
                    const rightTile = previewGrid[r][c+1];
                    this.specialPreviews[`${r}-${c-1}`] = { type: 'duality', copyAsset: rightTile.tile.asset };
                }
            }
        }
    
        if (hoverInfo) {
            const potentialInteractions = getInteractionsForTile(hoverInfo.tile.id, hoverInfo.r, hoverInfo.c, this.grid);
            const gridEl = this.element.querySelector('#game-grid');
            if (gridEl) {
                const fromCell = gridEl.querySelector(`.grid-cell[data-r="${hoverInfo.r}"][data-c="${hoverInfo.c}"]`);
                if (fromCell) {
                    potentialInteractions.forEach(target => {
                        const toCell = gridEl.querySelector(`.grid-cell[data-r="${target.r}"][data-c="${target.c}"]`);
                        if (toCell) {
                            const fromX = fromCell.offsetLeft + fromCell.offsetWidth / 2;
                            const fromY = fromCell.offsetTop + fromCell.offsetHeight / 2;
                            const toX = toCell.offsetLeft + toCell.offsetWidth / 2;
                            const toY = toCell.offsetTop + toCell.offsetHeight / 2;
                            this.interactionLines.push({ x1: fromX, y1: fromY, x2: toX, y2: toY });
                        }
                    });
                }
            }
        }
    }

    renderInteractionOverlay(gridContainer) {
        const svg = gridContainer.querySelector('.interaction-overlay');
        if (svg) {
            svg.innerHTML = this.interactionLines.map(line => `<line x1="${line.x1}" y1="${line.y1}" x2="${line.x2}" y2="${line.y2}" stroke="white" stroke-width="2" stroke-dasharray="4" />`).join('');
        }
    }

    calculateScorePreview() {
        if (!this.grid.flat().some(c => c)) {
            return { score: 0, multiplier: 1 };
        }
        const { score, multiplier } = calculateScoreForGrid(this.grid, this.gameState.stickers, this.currentHandNumber);
        return { score, multiplier };
    }
    
    startRound() {
        if (this.isRoundInProgress) return;
        this.isRoundInProgress = true;
        this.heldTile = null;
        this.selectedHandIndex = -1;
        
        const result = calculateScoreForGrid(this.grid, this.gameState.stickers, this.currentHandNumber);
        let finalScoreForHand = result.score * result.multiplier;
        const moneyEarnedFromShiny = { value: 0 }; // Using an object to pass by reference

        // --- White Tile Logic ---
        for (let r = 0; r < 5; r++) {
            for (let c = 0; c < 5; c++) {
                const cell = this.grid[r][c];
                if (cell && cell.tile.id === 'white') {
                    let isIsolated = true;
                    for (let dr = -1; dr <= 1; dr++) {
                        for (let dc = -1; dc <= 1; dc++) {
                            if (dr === 0 && dc === 0) continue;
                            const nr = r + dr;
                            const nc = c + dc;
                            if (nr >= 0 && nr < 5 && nc >= 0 && nc < 5 && this.grid[nr][nc]) {
                                isIsolated = false;
                                break;
                            }
                        }
                        if (!isIsolated) break;
                    }

                    if (isIsolated) {
                        if (Math.random() < 0.5) {
                            this.gameState.addTileToDeck('black', 2);
                            console.log("White Tile added 2 Black Tiles to deck.");
                        } else {
                            this.gameState.addTileToDeck('duality', 2);
                            console.log("White Tile added 2 Duality Tiles to deck.");
                        }
                        // TODO: Add visual feedback for this effect.
                    }
                }
            }
        }
        
        // --- Post-Scoring Effects (Shiny, Explosive, Shy Money, etc) ---
        // Apply effects from calculateScoreForGrid (e.g., Orange Tile)
        if (result.effectsToApply) {
            result.effectsToApply.forEach(effect => {
                if (effect.type === 'gain_money') {
                    this.gameState.money += effect.amount;
                } else if (effect.type === 'remove_tile') {
                    this.gameState.removeTileFromDeck(effect.tileId, effect.enchantment);
                }
            });
        }

        // Temporarily re-calculate incoming interactions for shy tile money. A bit inefficient but isolates logic.
        const incomingInteractions = Array(5).fill(null).map(() => Array(5).fill(0));
        for (let r = 0; r < 5; r++) {
            for (let c = 0; c < 5; c++) {
                const cell = result.grid[r][c];
                if (!cell) continue;
                getInteractionsForTile(cell.tile.id, r, c, result.grid).forEach(targetPos => {
                    if (result.grid[targetPos.r][targetPos.c]) {
                         incomingInteractions[targetPos.r][targetPos.c]++;
                    }
                });
            }
        }

        result.scoredTiles.forEach(tileCoord => {
            const [r, c] = tileCoord.split('-').map(Number);
            const originalCell = this.grid[r][c];
            if (!originalCell || !originalCell.tile) return;

            const tileId = originalCell.tile.id;
            const enchantment = originalCell.tile.enchantment;

            // Rubik's tile logic
            if (tileId === 'rubiks') {
                const interactions = getInteractionsForTile(tileId, r, c, this.grid);
                const interactionCount = interactions.length;
                if (interactionCount > 0) {
                    this.gameState.addTileToDeck('colorful', interactionCount);
                    // TODO: Add visual feedback for adding tiles
                    console.log(`Rubik's Tile added ${interactionCount} Colorful Tiles to the deck.`);
                }
            }

            if (tileId === 'glass') {
                this.gameState.removeTileFromDeck('glass');
            }
            
            if (enchantment) {
                if (enchantment === 'shiny') {
                    moneyEarnedFromShiny.value += 2;
                }
                if (enchantment === 'explosive' && Math.random() < 0.15) {
                    finalScoreForHand += 200;
                    // Find the specific tile instance in the deck to remove
                    const tileIndexInDeck = this.gameState.deck.findIndex(t => 
                        t.id === tileId && t.enchantment === 'explosive'
                    );
                    if (tileIndexInDeck !== -1) {
                         this.gameState.deck.splice(tileIndexInDeck, 1);
                    }
                }
            }
        });

        for (let r = 0; r < 5; r++) {
            for (let c = 0; c < 5; c++) {
                const cell = this.grid[r][c];
                if (cell && cell.tile.id === 'shy' && incomingInteractions[r][c] === 0) {
                    this.gameState.money += 5;
                    // TODO: Add visual feedback for money gain
                }
            }
        }

        this.currentScore += finalScoreForHand;
        this.gameState.money += moneyEarnedFromShiny.value;

        this.grid = Array(5).fill(null).map(() => Array(5).fill(null));
        this.handsRemaining--;
        this.isRoundInProgress = false;
        this.blockedInHand.clear();

        if (this.currentScore >= this.levelData.goal) {
            AudioService.playSoundEffect('level_win');
            this.gameState.completeLevel(this.levelData.reward);
            setTimeout(() => this.navigateTo('shop'), 1000);
        } else {
            if (this.handsRemaining > 0 || this.levelDeck.length > 0) {
                this.drawHand();
            }
        }
        
        this.render();
    }

    getElement() {
        return this.element;
    }

    show(options) {
        this.gamepadActive = false;
        this.initializeLevel(options.levelIndex);
        this.render();
        this.element.classList.add('active');
        GamepadService.addEventListener('gamepad:any', this.handleAnyGamepadInput);
        GamepadService.addEventListener('gamepad:button', this.handleGamepadInput);
        GamepadService.addEventListener('gamepad:axis', this.handleGamepadInput);
        window.addEventListener('keydown', this.handleKeyboardInput);
    }

    hide() {
        this.element.classList.remove('active');
        this.gameState.tooltip.hide();
        GamepadService.removeEventListener('gamepad:any', this.handleAnyGamepadInput);
        GamepadService.removeEventListener('gamepad:button', this.handleGamepadInput);
        GamepadService.removeEventListener('gamepad:axis', this.handleGamepadInput);
        window.removeEventListener('keydown', this.handleKeyboardInput);
    }

    // --- Gamepad Logic ---
    handleAnyGamepadInput() {
        if (!this.gamepadActive) {
            this.gamepadActive = true;
            this.render();
        }
    }

    handleKeyboardInput(e) {
        if (!this.element.classList.contains('active') || this.isRoundInProgress) return;

        // On first relevant keyboard input, activate cursor mode.
        const relevantKeys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' ', 'Enter', 'Shift', 'c', 'C', 'v', 'V', '1', '2', '3', '4', '5', '6', '7', 'z', 'Z', 'x', 'X'];
        if (!this.gamepadActive && relevantKeys.includes(e.key)) {
            this.gamepadActive = true;
        }

        const key = e.key;

        // Handle number keys 1-7 for hand selection
        if (key >= '1' && key <= '7') {
            const handIndex = parseInt(key) - 1;
            if (this.hand[handIndex]) {
                this.selectTileFromHand(handIndex);
                this.gamepadFocus = 'hand';
            }
            e.preventDefault();
        } else {
            switch (key) {
                case 'Shift':
                    if (this.heldTile) {
                        this.selectTileFromHand(this.heldTile.handIndex); // This deselects it
                        this.gamepadFocus = 'grid';
                    }
                    e.preventDefault();
                    break;
                case 'ArrowUp':
                    this.moveGridCursor('up');
                    e.preventDefault();
                    break;
                case 'ArrowDown':
                    this.moveGridCursor('down');
                    e.preventDefault();
                    break;
                case 'ArrowLeft':
                    this.moveGridCursor('left');
                    e.preventDefault();
                    break;
                case 'ArrowRight':
                    this.moveGridCursor('right');
                    e.preventDefault();
                    break;
                case ' ': // Spacebar
                    this.handleGamepadConfirm();
                    e.preventDefault();
                    break;
                case 'Enter':
                    this.element.querySelector('.end-hand-btn')?.click();
                    e.preventDefault();
                    break;
                case 'c':
                case 'C':
                    this.element.querySelector('#deck-btn')?.click();
                    e.preventDefault();
                    break;
                case 'v':
                case 'V':
                    this.element.querySelector('#controls-btn')?.click();
                    e.preventDefault();
                    break;
                case 'z':
                case 'Z':
                    this.cycleHandSelection(-1); // Cycle left
                    e.preventDefault();
                    break;
                case 'x':
                case 'X':
                    this.cycleHandSelection(1); // Cycle right
                    e.preventDefault();
                    break;
                case 'Escape':
                    if (this.gamepadActive) {
                        this.gamepadActive = false;
                        this.heldTile = null; // deselect tile
                        this.selectedHandIndex = -1;
                        this.updateAllPreviews();
                        this.render(); // Re-render to hide highlights
                    }
                    e.preventDefault();
                    break;
                default:
                    // Not a key we care about for gameplay
                    return;
            }
        }
        
        // Rerender after any valid keyboard action
        this.updateAllPreviews(this.heldTile ? { r: this.gridCursor.r, c: this.gridCursor.c, tile: this.heldTile.tile } : null);
        this.render();
    }

    handleGamepadInput(e) {
        if (!this.gamepadActive || !this.element.classList.contains('active') || this.isRoundInProgress) return;

        const { detail } = e;

        if (detail.button && detail.down) {
            switch (detail.button) {
                case 'L3':
                    this.element.querySelector('#deck-btn')?.click();
                    break;
                case 'R3':
                    this.element.querySelector('#controls-btn')?.click();
                    break;
                case 'X': // Was Start
                    this.element.querySelector('.end-hand-btn')?.click();
                    break;
                case 'L1': case 'R1':
                    this.cycleHandSelection(detail.button === 'R1' ? 1 : -1);
                    break;
                case 'B':
                    if (this.heldTile) {
                        this.selectTileFromHand(this.heldTile.handIndex); // This deselects it
                        this.gamepadFocus = 'grid';
                    }
                    break;
                case 'A':
                    this.handleGamepadConfirm();
                    break;
                case 'up': case 'down': case 'left': case 'right':
                    this.moveGridCursor(detail.button);
                    break;
            }
        }

        if (detail.axis) {
            switch(detail.axis) {
                case 'leftY':
                    if (detail.value < -0.5) { this.moveGridCursor('up'); }
                    if (detail.value > 0.5) { this.moveGridCursor('down'); }
                    break;
                case 'leftX':
                    if (detail.value < -0.5) { this.moveGridCursor('left'); }
                    if (detail.value > 0.5) { this.moveGridCursor('right'); }
                    break;
            }
        }

        this.updateAllPreviews(this.heldTile ? { r: this.gridCursor.r, c: this.gridCursor.c, tile: this.heldTile.tile } : null);
        this.render();
    }

    cycleHandSelection(direction) {
        this.gamepadFocus = 'hand';
        const startIndex = (this.selectedHandIndex === -1) ? (direction === 1 ? -1 : 0) : this.selectedHandIndex;
        let currentIndex = startIndex;

        for (let i = 0; i < HAND_SIZE; i++) {
            currentIndex = (currentIndex + direction + HAND_SIZE) % HAND_SIZE;
            if (this.hand[currentIndex]) {
                this.selectTileFromHand(currentIndex);
                return;
            }
        }
    }

    moveGridCursor(direction) {
        this.gamepadFocus = 'grid';
        let { r, c } = this.gridCursor;
        if (direction === 'up') r = Math.max(0, r - 1);
        if (direction === 'down') r = Math.min(4, r + 1);
        if (direction === 'left') c = Math.max(0, c - 1);
        if (direction === 'right') c = Math.min(4, c + 1);
        this.gridCursor = { r, c };
    }

    handleGamepadConfirm() {
        const { r, c } = this.gridCursor;
        if (this.heldTile) {
            if (this.placeHeldTile(r, c)) {
                this.gamepadFocus = 'grid';
            }
        } else {
            if (this.pickupTileFromGrid(r, c)) {
                this.gamepadFocus = 'hand';
            }
        }
    }
}

export default GameScreen;