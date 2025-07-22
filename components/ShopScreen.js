import AssetManager     from '../data/AssetManager.js';
import GameData         from '../data/GameData.js';
import AudioService     from '../services/AudioService.js';
import GamepadService   from '../services/GamepadService.js';

const MAX_DECK_SIZE = 40;
const STICKER_INITIAL_DURATION = 3;
const GAME_MUSIC_PLAYLIST = ['/samba race.mp3', '/rotation.mp3', '/Baskick.mp3', '/Aldebaran.mp3', '/Scoreboard.mp3', '/Onefin Square.mp3'];

class ShopScreen {
    constructor(gameState, navigateTo, tooltip) {
        this.gameState = gameState;
        this.navigateTo = navigateTo;
        this.element = this.createEmptyScreen();
        this.tooltip = tooltip;
        this.selectionTooltipElement = document.getElementById('selection-tooltip');

        // Modal state
        this.activeModal = null; // 'enchant', 'sell', 'sell-detail'
        this.enchantmentToApply = null;
        this.sellTileType = null;
        this.isFreeEnchant = false;

        // Gamepad state
        this.isGamepadActive = false;
        this.gamepadFocus = 'grid'; // 'grid', 'sidebar'
        this.selectedGridIndex = 0;
        this.selectedSidebarIndex = 0;
        this.modalGamepadFocus = 'grid'; // 'grid', 'footer'
        this.selectedModalGridIndex = 0;
        this.selectedModalFooterIndex = 0;
        this.selectableElements = {};
        this.heldItemForTooltip = null;

        this.handleGamepadInput = this.handleGamepadInput.bind(this);
        this.handleAnyGamepadInput = this.handleAnyGamepadInput.bind(this);
    }

    createEmptyScreen() {
        const screen = document.createElement('div');
        screen.className = 'screen shop-screen';
        screen.id = 'shop-screen';
        return screen;
    }

    render() {
        if (this.activeModal) {
            this.tooltip.hide();
            this.hideSelectionTooltip();
        }
        this.element.innerHTML = `
            <div class="shop-header">
                <button id="secret-unlock-shop-btn"></button>
                <span>Shop</span>
                <span style="color: var(--color-gold);">$${this.gameState.money}</span>
            </div>
            <div class="shop-main">
                <div class="shop-items-container">
                    <h2>Items for Sale</h2>
                    <div class="shop-items-grid">
                        ${this.renderShopItems()}
                    </div>
                </div>
                <div class="shop-sidebar">
                    <button class="menu-button" id="reroll-btn" ${this.isFreeEnchant ? 'disabled' : ''}>Reroll ($${this.gameState.rerollCost})</button>
                    <button class="menu-button" id="sell-btn" ${this.isFreeEnchant ? 'disabled' : ''}>Sell Tiles</button>
                    <button class="menu-button" id="continue-btn">Continue</button>
                </div>
            </div>
             ${this.renderStickerDisplay()}
             ${this.activeModal ? this.renderModal() : ''}
        `;
        this.addEventListeners();
        this.updateSelectableElements();
    }

    renderShopItems() {
        const { money, shopInventory, deck, stickers } = this.gameState;
        let itemsHtml = '';

        shopInventory.tiles.forEach(item => {
            const canAfford = money >= item.price;
            const deckFull = deck.length >= MAX_DECK_SIZE;
            const canBuy = canAfford && !deckFull;
            itemsHtml += `
                <div class="shop-item" data-tooltip-type="tiles" data-tooltip-id="${item.id}" data-item-type="tile" data-item-id="${item.id}">
                    <div class="shop-item-icon" style="background-image: url(${AssetManager.getImage(item.asset).src}); border-color: var(--color-rarity-${item.rarity.toLowerCase()})"></div>
                    <div class="shop-item-name">${item.name}</div>
                    <div class="shop-item-rarity" style="color: var(--color-rarity-${item.rarity.toLowerCase()})">${item.rarity}</div>
                    <button class="menu-button buy-btn" data-type="tile" data-id="${item.id}" ${canBuy ? '' : 'disabled'}>
                        $${item.price} ${deckFull ? '(Deck Full)' : ''}
                    </button>
                </div>
            `;
        });
        
        shopInventory.stickers.forEach(item => {
             const canAfford = money >= item.price;
             const stickersFull = stickers.length >= 5;
             const alreadyOwned = stickers.find(s => s.id === item.id);
             const outOfStock = this.gameState.shopStock.stickers[item.id] <= 0;
             const canBuy = canAfford && !stickersFull && !alreadyOwned && !outOfStock;
             let disabledReason = '';
             if (stickersFull) disabledReason = '(Full)';
             else if (alreadyOwned) disabledReason = '(Owned)';
             else if (outOfStock) disabledReason = '(Out of Stock)';
             else if (!canAfford) disabledReason = ''; // Price shown is enough reason

             itemsHtml += `
                <div class="shop-item" data-tooltip-type="stickers" data-tooltip-id="${item.id}" data-item-type="sticker" data-item-id="${item.id}">
                    <div class="shop-item-icon" style="background-image: url(${AssetManager.getImage(item.asset).src}); border-color: var(--color-rarity-${item.rarity.toLowerCase()})"></div>
                    <div class="shop-item-name">${item.name}</div>
                    <div class="shop-item-rarity" style="color: var(--color-rarity-${item.rarity.toLowerCase()})">${item.rarity}</div>
                    <button class="menu-button buy-btn" data-type="sticker" data-id="${item.id}" ${canBuy ? '' : 'disabled'}>
                       $${item.price} ${disabledReason}
                    </button>
                </div>
            `;
        });
        
        shopInventory.enchantments.forEach(item => {
            const canAfford = money >= item.price;
            itemsHtml += `
                 <div class="shop-item" data-tooltip-type="enchantments" data-tooltip-id="${item.id}" data-item-type="enchantment" data-item-id="${item.id}">
                    <div class="shop-item-icon" style="background-image: url(${AssetManager.getImage(item.asset).src}); border-color: var(--color-rarity-${item.rarity.toLowerCase()})"></div>
                    <div class="shop-item-name">${item.name}</div>
                    <div class="shop-item-rarity" style="color: var(--color-rarity-${item.rarity.toLowerCase()})">Enchantment</div>
                    <button class="menu-button buy-btn" data-type="enchantment" data-id="${item.id}" data-price="${item.price}" ${canAfford ? '' : 'disabled'}>
                        Fee: $${item.price}
                    </button>
                </div>
            `;
        });

        return itemsHtml;
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
                        <div class="sticker-info">
                            <span class="sticker-info-name">${stickerInfo.name}</span>
                            <button class="menu-button sell-sticker-btn" data-id="${stickerInfo.id}">Sell ($${Math.floor(stickerInfo.price / 2)})</button>
                        </div>
                    </div>
                `}).join('')}
            </div>
        `;
    }

    renderModal() {
        switch(this.activeModal) {
            case 'enchant': return this.renderEnchantModal();
            case 'sell': return this.renderSellModal();
            case 'sell-detail': return this.renderSellDetailModal();
            default: return '';
        }
    }
    
    renderEnchantModal() {
        const deckCounts = this.gameState.deck.reduce((acc, tile) => {
            if (!acc[tile.id]) acc[tile.id] = { id: tile.id, count: 0, enchanted: 0 };
            acc[tile.id].count++;
            if (tile.enchantment) acc[tile.id].enchanted++;
            return acc;
        }, {});

        return `
            <div class="modal-overlay">
                <div class="modal-content">
                    <h2>Enchant a Tile</h2>
                    <p>${this.isFreeEnchant ? 'Select a tile type to apply your free' : "Pay the enchanter's fee and apply the"} '${this.enchantmentToApply.name}' enchantment.</p>
                    <div class="modal-grid">
                        ${Object.values(deckCounts).map(tileData => {
                            const allEnchanted = tileData.count === tileData.enchanted;
                            const fullData = GameData.tiles[tileData.id];
                            return `
                            <div class="modal-item ${allEnchanted ? 'disabled' : ''}" data-type="enchant-tile" data-id="${tileData.id}">
                                <div class="modal-item-icon" style="background-image: url(${AssetManager.getImage(fullData.asset).src})"></div>
                                <span class="modal-item-name">${fullData.name}</span>
                                <span class="modal-item-count">${tileData.enchanted}/${tileData.count}</span>
                            </div>
                            `;
                        }).join('')}
                    </div>
                    <div class="modal-footer">
                        <button class="menu-button" id="modal-cancel-btn">Cancel</button>
                    </div>
                </div>
            </div>
        `;
    }
    
    renderSellModal() {
         const deckCounts = this.gameState.deck.reduce((acc, tile) => {
            if (!acc[tile.id]) acc[tile.id] = { id: tile.id, count: 0 };
            acc[tile.id].count++;
            return acc;
        }, {});
        
        return `
             <div class="modal-overlay">
                <div class="modal-content">
                    <h2>Sell Tiles (Deck: ${this.gameState.deck.length}/${MAX_DECK_SIZE})</h2>
                    <div class="modal-grid">
                         ${Object.values(deckCounts).map(tileData => {
                            const fullData = GameData.tiles[tileData.id];
                            return `
                            <div class="modal-item" data-type="sell-select" data-id="${tileData.id}">
                                <div class="modal-item-icon" style="background-image: url(${AssetManager.getImage(fullData.asset).src})"></div>
                                <span class="modal-item-name">${fullData.name}</span>
                                <span class="modal-item-count">x${tileData.count}</span>
                            </div>
                            `;
                        }).join('')}
                    </div>
                    <div class="modal-footer">
                        <button class="menu-button" id="modal-cancel-btn">Close</button>
                    </div>
                </div>
            </div>
        `;
    }

    renderSellDetailModal() {
        const tilesOfType = this.gameState.deck.map((t, i) => ({...t, originalIndex: i})).filter(t => t.id === this.sellTileType);
        const tileInfo = GameData.tiles[this.sellTileType];
        const sellPrice = this.gameState.getSellPrice(tileInfo.id);
        const sellableTilesCount = tilesOfType.filter(t => !t.enchantment).length;

        return `
            <div class="modal-overlay">
                <div class="modal-content">
                    <h2>Selling ${tileInfo.name}s (Sell for $${sellPrice} each)</h2>
                    <p>Click a tile to sell it. An enchanted tile (â˜…) cannot be sold.</p>
                    <div class="modal-tile-display">
                        ${tilesOfType.map(tile => `
                            <div class="tile-in-hand sellable ${tile.enchantment ? 'disabled' : ''}" data-type="sell-one" data-index="${tile.originalIndex}">
                                <div class="tile" style="background-image: url(${AssetManager.getImage(tileInfo.asset).src});">
                                    ${tile.enchantment ? `<div class="enchantment-star" title="Cannot sell enchanted tiles"></div>` : ''}
                                </div>
                            </div>
                        `).join('')}
                    </div>
                    <div class="modal-footer">
                        <button class="menu-button small-button" data-type="back-to-sell-menu">Back</button>
                        <button class="menu-button" data-type="sell-two" ${sellableTilesCount < 2 ? 'disabled' : ''}>Sell 2</button>
                        <button class="menu-button" id="modal-cancel-btn">Exit</button>
                    </div>
                </div>
            </div>
        `;
    }

    addEventListeners() {
        this.element.querySelector('#secret-unlock-shop-btn').onclick = () => {
            if (confirm('Unlock all items for this shop visit?')) {
                AudioService.playSoundEffect('enchant_apply');
                this.gameState.unlockAllShopItems();
                this.render();
            }
        };

        this.element.querySelector('#continue-btn').onclick = () => {
            AudioService.playSoundEffect('ui_click');
            this.navigateTo('levelSelect');
        };
        this.element.querySelector('#reroll-btn').onclick = () => this.handleReroll();
        this.element.querySelector('#sell-btn').onclick = () => {
            AudioService.playSoundEffect('ui_click');
            this.activeModal = 'sell';
            this.render();
        };

        this.element.querySelectorAll('.buy-btn').forEach(btn => btn.onclick = (e) => this.handleBuy(e));
        this.element.querySelectorAll('.sell-sticker-btn').forEach(btn => btn.onclick = (e) => this.handleSellSticker(e));

        // Tooltips
        this.element.querySelectorAll('[data-tooltip-id]').forEach(el => {
            el.onmouseenter = (e) => this.tooltip.show(e.currentTarget);
            el.onmouseleave = () => {
                this.tooltip.hide();
                if (!this.isGamepadActive) {
                    this.hideSelectionTooltip();
                }
            };
            el.onmousemove = (e) => this.tooltip.move(e);
        });

        // Add touch/click listener for selection tooltips
        this.element.querySelectorAll('.shop-item').forEach(el => {
            el.addEventListener('click', (e) => this.handleItemClick(e));
        });

        // Modal listeners
        if (this.activeModal) {
            this.element.querySelector('#modal-cancel-btn').onclick = () => {
                AudioService.playSoundEffect('ui_click');
                this.activeModal = null;
                this.enchantmentToApply = null;
                this.isFreeEnchant = false; // Reset free enchant flag
                this.hideSelectionTooltip();
                this.render();
            };
            this.element.querySelectorAll('[data-type="enchant-tile"]').forEach(btn => btn.onclick = e => this.handleEnchant(e));
            this.element.querySelectorAll('[data-type="sell-select"]').forEach(btn => btn.onclick = e => {
                AudioService.playSoundEffect('ui_click');
                this.sellTileType = e.currentTarget.dataset.id;
                this.activeModal = 'sell-detail';
                this.render();
            });
            if(this.element.querySelector('[data-type="back-to-sell-menu"]')) {
                this.element.querySelector('[data-type="back-to-sell-menu"]').onclick = () => {
                    AudioService.playSoundEffect('ui_click');
                    this.activeModal = 'sell';
                    this.render();
                };
            }
            this.element.querySelectorAll('[data-type="sell-one"]').forEach(btn => btn.onclick = e => this.handleSellOne(e));
            if(this.element.querySelector('[data-type="sell-two"]')) {
                this.element.querySelector('[data-type="sell-two"]').onclick = () => this.handleSellTwo();
            }
        }
    }

    handleItemClick(e) {
        if (this.isGamepadActive) return; // Prevent mouse clicks from interfering with gamepad
        const itemElement = e.currentTarget;
        const itemId = itemElement.dataset.itemId;
        const itemType = itemElement.dataset.itemType;
        
        const itemData = GameData[`${itemType}s`][itemId];
        if (!itemData) return;

        // Show selection tooltip
        this.showSelectionTooltip(itemData, itemElement);
    }

    handleBuy(e) {
        const { type, id } = e.currentTarget.dataset;
        const price = parseInt(e.currentTarget.dataset.price || GameData[type + 's'][id].price);

        if (this.gameState.money < price) return;

        let success = false;
        if (type === 'tile') {
            if (this.gameState.deck.length < MAX_DECK_SIZE) {
                this.gameState.addTileToDeck(id, 1);
                this.gameState.shopStock.tiles[id]--;
                success = true;
            }
        } else if (type === 'sticker') {
            if (this.gameState.stickers.length < 5 && !this.gameState.stickers.find(s => s.id === id)) {
                this.gameState.stickers.push({ id: id, duration: STICKER_INITIAL_DURATION });
                this.gameState.discoverItem('stickers', id);
                this.gameState.shopStock.stickers[id]--;
                success = true;
            }
        } else if (type === 'enchantment') {
            this.enchantmentToApply = {...GameData.enchantments[id], price };
            this.activeModal = 'enchant';
            this.render();
            return; // Don't deduct money yet
        }
        
        if (success) {
            this.gameState.money -= price;
            AudioService.playSoundEffect('buy_item');
        }
        this.hideSelectionTooltip();
        this.render();
    }
    
    handleSellSticker(e) {
        const { id } = e.currentTarget.dataset;
        const stickerIndex = this.gameState.stickers.findIndex(s => s.id === id);
        if (stickerIndex > -1) {
            const sticker = this.gameState.stickers[stickerIndex];
            const sellPrice = Math.floor(sticker.price / 2);
            if (confirm(`Sell ${sticker.name} for $${sellPrice}?`)) {
                this.gameState.money += sellPrice;
                this.gameState.stickers.splice(stickerIndex, 1);
                AudioService.playSoundEffect('buy_item'); // Reuse buy sound for selling
                this.render();
            }
        }
    }

    handleReroll() {
        if (this.gameState.money >= this.gameState.rerollCost) {
            this.gameState.money -= this.gameState.rerollCost;
            this.gameState.generateShopInventory();
            this.gameState.rerollCost++;
            AudioService.playSoundEffect('reroll');
            this.hideSelectionTooltip();
            this.render();
        }
    }
    
    handleEnchant(e) {
        const tileId = e.currentTarget.dataset.id;
        const success = this.gameState.enchantTile(tileId, this.enchantmentToApply.id);
        if (success) {
            if (!this.isFreeEnchant) {
                this.gameState.money -= this.enchantmentToApply.price;
            }
            AudioService.playSoundEffect('enchant_apply');
            
            // If it was a free enchant, go back to level select.
            if (this.isFreeEnchant) {
                this.isFreeEnchant = false;
                this.activeModal = null;
                this.enchantmentToApply = null;
                this.navigateTo('levelSelect');
                return; // Prevent re-render of shop
            } else {
                 // otherwise re-render shop with updated state.
                this.activeModal = null;
                this.enchantmentToApply = null;
                this.gamepadFocus = 'grid'; // Reset focus
                this.render();
            }
        }
    }
    
    handleSellOne(e) {
        const index = parseInt(e.currentTarget.dataset.index);
        const tile = this.gameState.deck[index];
        if (tile && !tile.enchantment) {
            this.gameState.sellTile(index);
            AudioService.playSoundEffect('buy_item'); // Reuse buy sound
            // stay in the sell detail modal and re-render
            this.render();
        }
    }
    
    handleSellTwo() {
        const indicesToSell = this.gameState.deck
            .map((t, i) => ({...t, originalIndex: i}))
            .filter(t => t.id === this.sellTileType && !t.enchantment)
            .slice(-2) // Get the last 2 sellable tiles
            .map(t => t.originalIndex)
            .sort((a,b) => b-a); // sort descending to not mess up indices when splicing
            
        if (indicesToSell.length === 2) {
            indicesToSell.forEach(index => {
                this.gameState.sellTile(index);
            });
            AudioService.playSoundEffect('buy_item');
            this.render();
        }
    }

    updateSelectableElements() {
        this.selectableElements = {
            grid: Array.from(this.element.querySelectorAll('.shop-items-grid .shop-item')),
            sidebar: Array.from(this.element.querySelectorAll('.shop-sidebar .menu-button:not(:disabled)')),
            modalGrid: this.activeModal ? Array.from(this.element.querySelectorAll('.modal-grid .modal-item:not(.disabled)')) : [],
            modalFooter: this.activeModal ? Array.from(this.element.querySelectorAll('.modal-footer .menu-button:not(:disabled)')) : [],
        };
        if (this.isGamepadActive) {
            this.updateSelection();
        }
    }

    updateSelection() {
        this.element.querySelectorAll('.gamepad-selected').forEach(el => el.classList.remove('gamepad-selected'));
        if (!this.isGamepadActive) return;

        let selectedEl;
        if (this.activeModal) {
            if (this.modalGamepadFocus === 'grid' && this.selectableElements.modalGrid.length > 0) {
                this.selectedModalGridIndex = (this.selectedModalGridIndex + this.selectableElements.modalGrid.length) % this.selectableElements.modalGrid.length;
                selectedEl = this.selectableElements.modalGrid[this.selectedModalGridIndex];
            } else if (this.modalGamepadFocus === 'footer' && this.selectableElements.modalFooter.length > 0) {
                this.selectedModalFooterIndex = (this.selectedModalFooterIndex + this.selectableElements.modalFooter.length) % this.selectableElements.modalFooter.length;
                selectedEl = this.selectableElements.modalFooter[this.selectedModalFooterIndex];
            }
        } else {
            if (this.gamepadFocus === 'grid' && this.selectableElements.grid.length > 0) {
                this.selectedGridIndex = (this.selectedGridIndex + this.selectableElements.grid.length) % this.selectableElements.grid.length;
                selectedEl = this.selectableElements.grid[this.selectedGridIndex];
            } else if (this.gamepadFocus === 'sidebar' && this.selectableElements.sidebar.length > 0) {
                this.selectedSidebarIndex = (this.selectedSidebarIndex + this.selectableElements.sidebar.length) % this.selectableElements.sidebar.length;
                selectedEl = this.selectableElements.sidebar[this.selectedSidebarIndex];
            }
        }

        if (selectedEl) {
            selectedEl.classList.add('gamepad-selected');
            selectedEl.focus();
            
            // Update selection tooltip for gamepad navigation
            if (this.gamepadFocus === 'grid' && !this.activeModal) {
                const itemId = selectedEl.dataset.itemId;
                const itemType = selectedEl.dataset.itemType;
                if (itemId && itemType) {
                    const itemData = GameData[`${itemType}s`][itemId];
                    this.showSelectionTooltip(itemData, selectedEl);
                }
            } else {
                this.hideSelectionTooltip();
            }
        } else {
            this.hideSelectionTooltip();
        }
    }

    handleAnyGamepadInput() {
        if (!this.isGamepadActive && this.element.classList.contains('active')) {
            this.isGamepadActive = true;
            this.gamepadFocus = this.selectableElements.grid.length > 0 ? 'grid' : 'sidebar';
            this.updateSelection();
        }
    }

    handleGamepadInput(e) {
        if (!this.isGamepadActive || !this.element.classList.contains('active')) return;
        const { detail } = e;
        let selectionChanged = false;

        const clickFocused = () => {
            let focusedEl;
            if (this.activeModal) {
                if (this.modalGamepadFocus === 'grid') focusedEl = this.selectableElements.modalGrid[this.selectedModalGridIndex];
                else focusedEl = this.selectableElements.modalFooter[this.selectedModalFooterIndex];
            } else {
                if (this.gamepadFocus === 'grid') {
                    focusedEl = this.selectableElements.grid.length > 0 ? this.selectableElements.grid[this.selectedGridIndex].querySelector('.buy-btn') : null;
                } else {
                    focusedEl = this.selectableElements.sidebar.length > 0 ? this.selectableElements.sidebar[this.selectedSidebarIndex] : null;
                }
            }
            focusedEl?.click();
        };
        
        if (detail.button === 'A' && detail.down) {
            // Clicking via gamepad should not hide the tooltip immediately, the action will.
            clickFocused();
            return;
        }

        if (detail.button === 'B' && detail.down && this.activeModal) {
             this.element.querySelector('#modal-cancel-btn')?.click();
             return;
        }

        if (this.activeModal) {
            const gridItems = this.selectableElements.modalGrid;
            const footerItems = this.selectableElements.modalFooter;
            if (this.modalGamepadFocus === 'grid') {
                if (detail.button === 'right' && detail.down) { this.selectedModalGridIndex++; selectionChanged = true; }
                if (detail.button === 'left' && detail.down) { this.selectedModalGridIndex--; selectionChanged = true; }
                if ((detail.button === 'down' && detail.down) && footerItems.length > 0) {
                    this.modalGamepadFocus = 'footer';
                    selectionChanged = true;
                }
            } else { // footer focus
                if (detail.button === 'right' && detail.down) { this.selectedModalFooterIndex++; selectionChanged = true; }
                if (detail.button === 'left' && detail.down) { this.selectedModalFooterIndex--; selectionChanged = true; }
                if ((detail.button === 'up' && detail.down) && gridItems.length > 0) {
                    this.modalGamepadFocus = 'grid';
                    selectionChanged = true;
                }
            }
        } else { // No modal
            if (this.gamepadFocus === 'grid') {
                if (detail.button === 'R1' && detail.down) { this.selectedGridIndex++; selectionChanged = true; }
                if (detail.button === 'L1' && detail.down) { this.selectedGridIndex--; selectionChanged = true; }
                if ((detail.button === 'right' && detail.down) && this.selectableElements.sidebar.length > 0) {
                    this.gamepadFocus = 'sidebar';
                    selectionChanged = true;
                }
            } else { // sidebar focus
                if (detail.button === 'down' && detail.down) { this.selectedSidebarIndex++; selectionChanged = true; }
                if (detail.button === 'up' && detail.down) { this.selectedSidebarIndex--; selectionChanged = true; }
                if ((detail.button === 'left' && detail.down) && this.selectableElements.grid.length > 0) {
                    this.gamepadFocus = 'grid';
                    selectionChanged = true;
                }
            }
        }

        if (selectionChanged) {
            AudioService.playSoundEffect('ui_click');
            this.updateSelection();
        }
    }

    show(options) {
        AudioService.playMusic(GAME_MUSIC_PLAYLIST);
        this.isGamepadActive = false; // Reset on show
        this.isFreeEnchant = false;
        if (options && options.freeEnchantment) {
            this.isFreeEnchant = true;
            this.enchantmentToApply = { ...options.freeEnchantment, price: 0 };
            this.activeModal = 'enchant';
            // Don't generate new shop inventory for a free enchant, use existing.
        } else {
            this.gameState.generateShopInventory();
        }
        this.render();
        this.element.classList.add('active');
        GamepadService.addEventListener('gamepad:any', this.handleAnyGamepadInput);
        GamepadService.addEventListener('gamepad:button', this.handleGamepadInput);
    }

    hide() {
        this.element.classList.remove('active');
        this.tooltip.hide();
        this.hideSelectionTooltip();
        this.activeModal = null;
        this.isGamepadActive = false;
        this.element.querySelectorAll('.gamepad-selected').forEach(el => el.classList.remove('gamepad-selected'));

        GamepadService.removeEventListener('gamepad:any', this.handleAnyGamepadInput);
        GamepadService.removeEventListener('gamepad:button', this.handleGamepadInput);
    }

    getElement() {
        return this.element;
    }

    showSelectionTooltip(itemData, itemElement) {
        if (!itemData || !itemElement) {
            this.hideSelectionTooltip();
            return;
        }

        this.tooltip.hide(); // Hide hover tooltip

        this.selectionTooltipElement.innerHTML = `
            <div class="selection-tooltip-title">${itemData.name}</div>
            <div class="selection-tooltip-body">${itemData.tooltip}</div>
        `;
        this.selectionTooltipElement.classList.add('active');

        const itemRect = itemElement.getBoundingClientRect();
        const tooltipRect = this.selectionTooltipElement.getBoundingClientRect();
        
        let top = itemRect.bottom + 10; // 10px spacing below the item
        let left = itemRect.left + (itemRect.width / 2) - (tooltipRect.width / 2);

        // Prevent going off-screen
        if (left < 0) left = 5;
        if (left + tooltipRect.width > window.innerWidth) left = window.innerWidth - tooltipRect.width - 5;
        if (top + tooltipRect.height > window.innerHeight) {
            top = itemRect.top - tooltipRect.height - 10; // Position above if no space below
        }

        this.selectionTooltipElement.style.top = `${top}px`;
        this.selectionTooltipElement.style.left = `${left}px`;
    }

    hideSelectionTooltip() {
        if (this.selectionTooltipElement) {
            this.selectionTooltipElement.classList.remove('active');
        }
        this.heldItemForTooltip = null;
    }
}

export default ShopScreen;