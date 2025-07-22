import GameData from '../data/GameData.js';

const MAX_DECK_SIZE = 40;
const MAX_STICKERS = 5;
const STICKER_INITIAL_DURATION = 3;

function getRandomItem(type, rarity) {
    const items = Object.values(GameData[type]).filter(item => item.rarity === rarity);
    if (items.length === 0) return null;
    const item = items[Math.floor(Math.random() * items.length)];
    // Ensure the item and its ID exist to prevent downstream errors
    return item && item.id ? item : null;
}

class GameState {
    constructor() {
        this.discovered = {
            tiles: new Set(['blue', 'red', 'green', 'yellow']),
            enchantments: new Set(),
            stickers: new Set()
        };
        this.discoveryCounts = {
            tiles: {},
            enchantments: {},
            stickers: {}
        };
        this.reset();
    }

    unlockAll() {
        console.log("Secret unlock: Unlocking all items for discovery.");
        Object.keys(GameData.tiles).forEach(id => this.discovered.tiles.add(id));
        Object.keys(GameData.enchantments).forEach(id => this.discovered.enchantments.add(id));
        Object.keys(GameData.stickers).forEach(id => this.discovered.stickers.add(id));
    }

    unlockAllShopItems() {
        console.log("Secret unlock: Adding all items to shop inventory for this visit.");

        const allTiles = Object.values(GameData.tiles);
        const allStickers = Object.values(GameData.stickers);
        const allEnchantments = Object.values(GameData.enchantments).map(enchant => {
             const price = enchant.baseFee + Math.floor(Math.random() * (this.ante * 3));
             return {...enchant, price};
        });

        this.shopInventory = {
            tiles: allTiles,
            stickers: allStickers,
            enchantments: allEnchantments
        };

        // Also discover all these items
        allTiles.forEach(item => this.discoverItem('tiles', item.id));
        allStickers.forEach(item => this.discoverItem('stickers', item.id));
        allEnchantments.forEach(item => this.discoverItem('enchantments', item.id));
    }

    reset() {
        this.ante = 1;
        this.money = 10; // Start with some money
        this.deck = this.createInitialDeck();
        this.stickers = []; // Will be an array of {id, duration}
        this.runInProgress = false;
        this.levels = [];
        this.currentLevelIndex = 0;
        this.runFailed = false;
        this.finalScore = 0; // for game over screen
        this.rerollCost = 3;
        
        // Shop state
        this.shopInventory = { tiles: [], stickers: [], enchantments: [] };
        this.shopStock = this.generateShopStock();

        // Reset discovery counts for a new run's tracking, but keep discovered sets
        this.discoveryCounts = {
            tiles: {},
            enchantments: {},
            stickers: {}
        };
    }
    
    startNewRun() {
        this.reset();
        this.runInProgress = true;
        this.generateLevelsForAnte();
        this.runFailed = false;
    }

    generateLevelsForAnte() {
        this.levels = [];
        // Upped the scaling significantly as requested
        const baseScore = Math.floor(150 * (2 ** (this.ante - 1)));
        const baseReward = 4 + this.ante;

        // Level 1
        this.levels.push(this.createLevel(baseScore, baseReward, false));
        // Level 2
        this.levels.push(this.createLevel(Math.floor(baseScore * 1.3), baseReward + 1, false));
        // Boss Level
        this.levels.push(this.createLevel(Math.floor(baseScore * 1.8), baseReward + 3, true));

        this.levels[0].status = 'available';
        this.currentLevelIndex = 0;
    }

    createLevel(goal, reward, isBoss) {
        return {
            goal,
            reward,
            isBoss,
            status: 'locked', // available, beaten
            skipReward: this.generateSkipReward()
        };
    }

    generateSkipReward() {
        // Based on readme, skip rewards can be a tile, enchantment, or sticker.
        const rewardTypeRoll = Math.random();
        let reward = null;
        let attempts = 0;
        
        while(!reward && attempts < 10) {
            attempts++;
            if (rewardTypeRoll < 0.6) { // 60% chance for a tile
                const rarityRoll = Math.random();
                const rarity = rarityRoll < 0.7 ? 'Common' : (rarityRoll < 0.95 ? 'Uncommon' : 'Rare');
                reward = { type: 'tile', item: getRandomItem('tiles', rarity) };
            } else if (rewardTypeRoll < 0.85) { // 25% chance for a sticker
                const rarityRoll = Math.random();
                const rarity = rarityRoll < 0.8 ? 'Common' : 'Uncommon';
                const potentialStickers = Object.values(GameData.stickers).filter(s => s.rarity === rarity && !this.stickers.find(owned => owned.id === s.id));
                if (potentialStickers.length > 0) {
                    const sticker = potentialStickers[Math.floor(Math.random() * potentialStickers.length)];
                    reward = { type: 'sticker', item: sticker };
                } else {
                    // Fallback to tile if no valid sticker can be offered
                    const rarityRoll = Math.random();
                    const rarity = rarityRoll < 0.7 ? 'Common' : (rarityRoll < 0.95 ? 'Uncommon' : 'Rare');
                    reward = { type: 'tile', item: getRandomItem('tiles', rarity) };
                }
            } else { // 15% chance for an enchantment
                const rarityRoll = Math.random();
                const rarity = rarityRoll < 0.6 ? 'Common' : (rarityRoll < 0.9 ? 'Uncommon' : 'Rare');
                reward = { type: 'enchantment', item: getRandomItem('enchantments', rarity) };
            }
        }
        
        if (!reward || !reward.item) return this.generateSkipReward(); // Reroll if no item found
        return reward;
    }

    completeLevel(reward) {
        const level = this.levels[this.currentLevelIndex];
        if (!level) return;
        
        this.money += reward;
        level.status = 'beaten';
        
        // Decrement sticker duration and remove expired ones
        this.stickers.forEach(s => s.duration--);
        this.stickers = this.stickers.filter(s => s.duration > 0);
        
        // Discover items from the skip reward of the beaten level
        if (level.skipReward) {
            const { type, item } = level.skipReward;
            const discoverySet = this.discovered[`${type}s`];
            if (item && discoverySet && !discoverySet.has(item.id)) {
                discoverySet.add(item.id);
                console.log(`Discovered new ${type}: ${item.name}`);
            }
        }
        
        this.rerollCost = 3; // Reset reroll cost for the next shop visit.

        const nextLevelIndex = this.currentLevelIndex + 1;
        if (nextLevelIndex < this.levels.length) {
            this.levels[nextLevelIndex].status = 'available';
            this.currentLevelIndex = nextLevelIndex;
        } else {
            // All levels for ante complete
            this.currentLevelIndex = -1; // Indicates ante is done
        }
    }

    skipLevel(grantReward = true) {
        const level = this.levels[this.currentLevelIndex];
        if (!level || level.isBoss) return; // Can't skip boss

        if (grantReward) {
            const {type, item} = level.skipReward;
            if (type === 'tile') {
                if (!this.addTileToDeck(item.id)) {
                     console.log(`Could not add free tile ${item.name}, deck is full.`);
                } else {
                    console.log(`Added free tile: ${item.name}`);
                }
            } else if (type === 'sticker') {
                if (this.stickers.length < MAX_STICKERS && !this.stickers.find(s => s.id === item.id)) {
                    this.stickers.push({ id: item.id, duration: STICKER_INITIAL_DURATION });
                    console.log(`Added free sticker: ${item.name}`);
                    this.discoverItem('stickers', item.id);
                }
            } else if (type === 'enchantment') {
                // This case is handled by navigating to the shop with a free item
                // and should not grant anything directly here.
            }
        }

        // Discover the item from the skip reward regardless of taking it
        // This lets players learn about items they choose to skip
        const {type, item} = level.skipReward;
        if (item && item.id) {
            this.discoverItem(`${type}s`, item.id);
        }
        
        level.status = 'skipped';
        
        const nextLevelIndex = this.currentLevelIndex + 1;
         if (nextLevelIndex < this.levels.length) {
            this.levels[nextLevelIndex].status = 'available';
            this.currentLevelIndex = nextLevelIndex;
        } else {
            this.currentLevelIndex = -1;
        }
    }

    failRun(finalScore) {
        this.runFailed = true;
        this.finalScore = finalScore;
    }

    anteUp() {
        this.ante++;
        this.shopStock = this.generateShopStock(); // Restock shop on ante up
        this.rerollCost = 3;
        this.generateLevelsForAnte();
    }

    createInitialDeck() {
        const initialDeck = [];
        const commonTiles = ['blue', 'red', 'green', 'yellow'];

        commonTiles.forEach(tileId => {
            for (let i = 0; i < 6; i++) {
                initialDeck.push({
                    id: tileId,
                    enchantment: null,
                });
            }
        });
        return initialDeck;
    }
    
    generateShopStock() {
        const stock = { tiles: {}, stickers: {} };
        Object.values(GameData.tiles).forEach(tile => {
            if(tile.rarity === 'Common') stock.tiles[tile.id] = 5;
            else if(tile.rarity === 'Uncommon') stock.tiles[tile.id] = 3;
            else stock.tiles[tile.id] = 2;
        });
        Object.values(GameData.stickers).forEach(sticker => {
            stock.stickers[sticker.id] = 1;
        });
        return stock;
    }
    
    generateShopInventory() {
        const inventory = {
            tiles: [],
            stickers: [],
            enchantments: []
        };

        // Add 2 tiles
        for (let i = 0; i < 2; i++) {
            const rarityRoll = Math.random();
            const rarity = rarityRoll < 0.65 ? 'Common' : (rarityRoll < 0.9 ? 'Uncommon' : 'Rare');
            const potentialTiles = Object.values(GameData.tiles).filter(t => t.rarity === rarity && this.shopStock.tiles[t.id] > 0);
            if (potentialTiles.length > 0) {
                const tile = potentialTiles[Math.floor(Math.random() * potentialTiles.length)];
                inventory.tiles.push(tile);
            }
        }
        
        // Add 1 sticker
        const stickerRarityRoll = Math.random();
        const stickerRarity = stickerRarityRoll < 0.7 ? 'Common' : 'Uncommon';
        const potentialStickers = Object.values(GameData.stickers).filter(s => s.rarity === stickerRarity);
         if (potentialStickers.length > 0) {
            const sticker = potentialStickers[Math.floor(Math.random() * potentialStickers.length)];
            inventory.stickers.push(sticker);
        } else {
            // Fallback to any common sticker if the rarity fails to produce one
            const fallbackStickers = Object.values(GameData.stickers).filter(s => s.rarity === 'Common');
            if(fallbackStickers.length > 0) {
                 const sticker = fallbackStickers[Math.floor(Math.random() * fallbackStickers.length)];
                 inventory.stickers.push(sticker);
            }
        }

        // Add 1 enchantment
        const enchantRarityRoll = Math.random();
        const enchantRarity = enchantRarityRoll < 0.6 ? 'Common' : (enchantRarityRoll < 0.9 ? 'Uncommon' : 'Rare');
        const potentialEnchants = Object.values(GameData.enchantments).filter(e => e.rarity === enchantRarity);
        if (potentialEnchants.length > 0) {
            const enchant = potentialEnchants[Math.floor(Math.random() * potentialEnchants.length)];
            const price = enchant.baseFee + Math.floor(Math.random() * (this.ante * 3));
            inventory.enchantments.push({...enchant, price});
        }
        
        // Discover items
        Object.values(inventory).flat().forEach(item => {
            if (!item || !item.id) return; // Safety check
            const type = GameData.tiles[item.id] ? 'tiles' : (GameData.stickers[item.id] ? 'stickers' : 'enchantments');
            this.discoverItem(type, item.id);
        });

        this.shopInventory = inventory;
    }
    
    discoverItem(type, id) {
        if (!this.discoveryCounts[type]) this.discoveryCounts[type] = {};
        if (!this.discoveryCounts[type][id]) this.discoveryCounts[type][id] = 0;
        this.discoveryCounts[type][id]++;

        if (this.discovered[type] && !this.discovered[type].has(id)) {
            this.discovered[type].add(id);
            console.log(`Discovered ${type.slice(0, -1)}: ${id}`);
        }
    }
    
    addTileToDeck(tileId, count = 1) {
        if (this.deck.length >= MAX_DECK_SIZE) return false;
        for(let i=0; i<count; i++){
            this.deck.push({ id: tileId, enchantment: null });
        }
        this.discoverItem('tiles', tileId);
        return true;
    }
    
    removeTileFromDeck(tileId, enchantment = null) {
        let indexToRemove = -1;

        if (enchantment) {
            // Find the specific enchanted tile to remove
            indexToRemove = this.deck.findIndex(tile => tile.id === tileId && tile.enchantment === enchantment);
        } else {
            // Prioritize removing non-enchanted tiles if no enchantment is specified
            indexToRemove = this.deck.findIndex(tile => tile.id === tileId && !tile.enchantment);
        }

        // If a specific type (enchanted or not) wasn't found, find any tile of that id as a fallback.
        // This is important for tiles like Glass that don't specify enchantment on removal.
        if (indexToRemove === -1) {
            indexToRemove = this.deck.findIndex(tile => tile.id === tileId);
        }
        
        if (indexToRemove !== -1) {
            this.deck.splice(indexToRemove, 1);
            console.log(`Removed 1 ${tileId} tile (Enchantment: ${enchantment}). Remaining in deck: ${this.deck.length}`);
            return true;
        }

        return false;
    }
    
    sellTile(tileIndex) {
        if(this.deck[tileIndex]) {
            const tile = this.deck[tileIndex];
            const price = this.getSellPrice(tile.id);
            this.money += price;
            this.deck.splice(tileIndex, 1);
            return price;
        }
        return 0;
    }
    
    getSellPrice(tileId) {
         const tileData = GameData.tiles[tileId];
         if (!tileData) return 0;
         return Math.floor(tileData.price / 2);
    }
    
    enchantTile(tileId, enchantmentId) {
        const tileToEnchant = this.deck.find(t => t.id === tileId && t.enchantment === null);
        if (tileToEnchant) {
            tileToEnchant.enchantment = enchantmentId;
            this.discoverItem('enchantments', enchantmentId);
            return true;
        }
        return false;
    }
}

export default GameState;