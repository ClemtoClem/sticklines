import GameData from './GameData.js';

const PREFIX_IMAGES_PATH = "./assets/images/";

class AssetManager {
    constructor() {
        this.images = {};
        this.sounds = {};
    }

    async loadImage(key, src) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            const fullPath = PREFIX_IMAGES_PATH + src;
            img.src = fullPath;
            img.onload = () => {
                this.images[key] = img;
                resolve(img);
            };
            img.onerror = (err) => {
                console.error(`Failed to load image: ${fullPath}`);
                reject(err);
            };
        });
    }

    getImage(key) {
        return this.images[key];
    }
    
    async loadAssets() {
        const promises = [];
        const uniqueAssets = new Set();

        // Collect all unique image assets from game data
        Object.values(GameData.tiles).forEach(t => uniqueAssets.add(t.asset));
        Object.values(GameData.enchantments).forEach(e => uniqueAssets.add(e.asset));
        Object.values(GameData.stickers).forEach(s => uniqueAssets.add(s.asset));

        // Add controls panel assets
        // These are now inlined SVGs in ControlsPanel.js, no need to load them as assets.

        uniqueAssets.forEach(asset => {
            if (!asset.endsWith('.png')) {
                promises.push(this.loadImage(asset, `${asset}.png`));
            } else {
                promises.push(this.loadImage(asset.replace('.png', ''), `${asset}`));
            }
        });
        
        await Promise.all(promises);
    }
}

export default new AssetManager();