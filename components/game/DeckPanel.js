import GameData     from '../../data/GameData.js';
import AssetManager from '../../data/AssetManager.js';

class DeckPanel {
    render(props) {
        const { gameState, levelDeck, maxDeckSize } = props;
        const deckCounts = {};
        gameState.deck.forEach(tile => {
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
                <h3>Deck (${gameState.deck.length} / ${maxDeckSize})</h3>
                <h4>Remaining this Level: ${levelDeck.length}</h4>
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
}

export default DeckPanel;