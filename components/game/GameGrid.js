import AssetManager from '../../data/AssetManager.js';

class GameGrid {
    renderTile(cell) {
        const tile = cell.tile;
        const isNew = cell.isNew;
        if (isNew) {
            delete cell.isNew;
        }

        const tileAsset = AssetManager.getImage(tile.asset);
        return `<div class="tile placed-tile ${isNew ? 'pop-in' : ''}" style="background-image: url(${tileAsset.src});">
            ${tile.enchantment ? '<div class="enchantment-star"></div>' : ''}
        </div>`;
    }
    
    renderSpecialPreview(preview) {
        const ghostIcon = preview.copyAsset ? `<div class="grid-preview-ghost-icon" style="background-image: url(${AssetManager.getImage(preview.copyAsset).src});"></div>` : '';
        const previewClass = preview.type === 'munch' ? 'grid-preview-munch' : 'grid-preview-duality';
        return `<div class="grid-special-preview ${previewClass}">${ghostIcon}</div>`;
    }

    render(props) {
        const { grid, interactionLines, specialPreviews, gamepadActive, gridCursor, gamepadFocus } = props;
        return `
            <div id="game-grid" class="game-grid">
                ${grid.map((row, r) =>
                    row.map((cell, c) => {
                        const isCursorOnCell = gamepadActive && gamepadFocus === 'grid' && gridCursor && gridCursor.r === r && gridCursor.c === c;
                        return `
                            <div class="grid-cell ${isCursorOnCell ? 'gamepad-selected' : ''}" data-r="${r}" data-c="${c}">
                                <div class="special-preview-container">
                                    ${specialPreviews && specialPreviews[`${r}-${c}`] ? this.renderSpecialPreview(specialPreviews[`${r}-${c}`]) : ''}
                                </div>
                                <div class="tile-container">
                                    ${cell ? this.renderTile(cell) : ''}
                                </div>
                            </div>
                        `;
                    }).join('')
                ).join('')}
                <svg class="interaction-overlay" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; z-index: 10;"></svg>
            </div>
        `;
    }

    updateInteractionOverlay(gridElement, interactionLines) {
        if (!gridElement) return;
        const svg = gridElement.querySelector('.interaction-overlay');
        if (svg) {
            const linesHtml = interactionLines.map(line => {
                return `<line x1="${line.x1}" y1="${line.y1}" x2="${line.x2}" y2="${line.y2}" stroke="white" stroke-width="2" stroke-dasharray="4" />`;
            }).join('');
            svg.innerHTML = linesHtml;
        }
    }

    updateSpecialPreviews(containerElement, specialPreviews) {
        containerElement.querySelectorAll('.special-preview-container').forEach(el => el.innerHTML = '');
        for (const key in specialPreviews) {
            const [r, c] = key.split('-').map(Number);
            const container = containerElement.querySelector(`.grid-cell[data-r="${r}"][data-c="${c}"] .special-preview-container`);
            if (container) {
                container.innerHTML = this.renderSpecialPreview(specialPreviews[key]);
            }
        }
    }
}

export default GameGrid;