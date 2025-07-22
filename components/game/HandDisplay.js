import AssetManager from '../../data/AssetManager.js';

class HandDisplay {
    constructor(tooltip) {
        this.tooltip = tooltip;
    }

    renderTileInHand(tile, index, heldTile, blockedInHand) {
        const tileAsset = AssetManager.getImage(tile.asset);
        const isHeld = heldTile && heldTile.handIndex === index;
        const isBlocked = blockedInHand.has(index);
        return `
            <div class="tile-in-hand ${isHeld ? 'held' : ''} ${isBlocked ? 'blocked' : ''}" 
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

    render(props) {
        const { hand, heldTile, blockedInHand } = props;
        return `
            <div id="hand-container" class="hand-container">
                ${Array.from({ length: 7 }, (_, i) => hand[i] ? this.renderTileInHand(hand[i], i, heldTile, blockedInHand) : '<div class="tile-in-hand empty"></div>').join('')}
            </div>
        `;
    }

    addEventListeners(container, handClickHandler) {
        if (!container) return;
        container.querySelectorAll('.tile-in-hand').forEach(card => {
            if (card.classList.contains('empty')) return;
            card.onclick = () => handClickHandler(card);
            card.onmouseenter = (e) => this.tooltip.show(e.currentTarget);
            card.onmouseleave = () => this.tooltip.hide();
            card.onmousemove = (e) => this.tooltip.move(e);
        });
    }
}

export default HandDisplay;