import AssetManager from '../../data/AssetManager.js';
import GameData     from '../../data/GameData.js';

class StickerDisplay {
    constructor(tooltip) {
        this.tooltip = tooltip;
    }

    render(props) {
        const { stickers } = props;
        if (!stickers || stickers.length === 0) return '';
        return `
            <div class="sticker-display">
                ${stickers.map(stickerState => {
                    const stickerInfo = GameData.stickers[stickerState.id];
                    return `
                     <div class="sticker-item" 
                         data-tooltip-type="stickers" 
                         data-tooltip-id="${stickerInfo.id}"
                         data-tooltip-duration="${stickerState.duration}">
                        <img src="${AssetManager.getImage(stickerInfo.asset).src}" class="sticker-icon">
                        <div class="sticker-duration ${stickerState.duration === 1 ? 'warning' : ''}">${stickerState.duration}</div>
                    </div>
                `}).join('')}
            </div>
        `;
    }

    addEventListeners(container) {
        if (!container) return;
        container.querySelectorAll('.sticker-item').forEach(el => {
            el.onmouseenter = (e) => this.tooltip.show(e.currentTarget);
            el.onmouseleave = () => this.tooltip.hide();
            el.onmousemove = (e) => this.tooltip.move(e);
        });
    }
}

export default StickerDisplay;