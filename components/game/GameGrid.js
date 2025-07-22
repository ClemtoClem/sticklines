import AssetManager from '../../data/AssetManager.js';

class GameGrid {
    renderTile(cell, specialPreview) {
        const tile = cell.tile;
        const isNew = cell.isNew;
        const isLeaving = cell.isLeaving;
        
        if (isNew) delete cell.isNew;
        if (isLeaving) delete cell.isLeaving;

        const tileAsset = AssetManager.getImage(tile.asset);
        
        let rotationClass = '';
        if (specialPreview?.type === 'rotated' || specialPreview?.type === 'rubiks') {
            rotationClass = 'rotated-by-rubiks-preview';
        }
        
        let animationClass = '';
        if (isNew) animationClass = 'pop-in';
        if (isLeaving) animationClass = 'pop-out';

        return `<div class="tile placed-tile ${animationClass} ${rotationClass}" style="background-image: url(${tileAsset.src});">
            ${tile.enchantment ? '<div class="enchantment-star"></div>' : ''}
        </div>`;
    }
    
    renderSpecialPreview(preview) {
        const ghostIcon = preview.copyAsset ? `<div class="grid-preview-ghost-icon" style="background-image: url(${AssetManager.getImage(preview.copyAsset).src});"></div>` : '';
        
        let previewClass = '';
        switch(preview.type) {
            case 'munch':
                previewClass = 'grid-preview-munch';
                break;
            case 'duplicated':
                previewClass = 'grid-preview-duality';
                break;
            case 'shy':
                previewClass = 'grid-preview-shy-active';
                break;
            case 'rotated':
            case 'rubiks':
                previewClass = 'grid-preview-rubiks-target';
                break;
        }

        return `<div class="grid-special-preview ${previewClass}">${ghostIcon}</div>`;
    }

    renderGhostTile(ghost) {
        // Render ghost tile only if it's being rotated by a rubik's preview.
        if (ghost && ghost.isRotated) {
            const tileAsset = AssetManager.getImage(ghost.tile.asset);
            const enchantmentHtml = ghost.tile.enchantment ? `<div class="enchantment-star" data-enchantment="${ghost.tile.enchantment}"></div>` : '';
            return `<div class="tile ghost-tile rotated-by-rubiks-preview" style="background-image: url(${tileAsset.src});">${enchantmentHtml}</div>`;
        }
        return '';
    }

    renderIngridTooltip(info, tile) {
        const multText = info.multiplier.join(' ');
        let statusText = '';
        if (info.specialStatus) {
            statusText = `<div class="special-status">${info.specialStatus}</div>`;
        }

        let shyText = '';
        if (tile.id === 'shy') {
            shyText = `<div>WATCHED BY: ${info.incomingCount}</div>`;
        }

        if (info.interactions === 0 && !multText && !statusText && !shyText) return ''; // Don't render empty tooltip
    
        return `
            <div class="ingrid-tooltip">
                ${statusText}
                ${shyText}
                ${info.interactions > 0 ? `<div>INT: ${info.interactions}</div>` : ''}
                ${multText ? `<div>MULT: ${multText}</div>` : ''}
            </div>
        `;
    }

    render(props) {
        const { grid, interactionLines, specialPreviews, hoveredGhost, gamepadActive, gridCursor, gamepadFocus, hoveredPlacedTile } = props;
        return `
            <div id="game-grid" class="game-grid">
                ${grid.map((row, r) =>
                    row.map((cell, c) => {
                        const isCursorOnCell = gamepadActive && gamepadFocus === 'grid' && gridCursor && gridCursor.r === r && gridCursor.c === c;
                        const ghost = hoveredGhost && hoveredGhost.r === r && hoveredGhost.c === c ? hoveredGhost : null;
                        const specialPreview = specialPreviews[`${r}-${c}`];
                        const isHoveredPlaced = hoveredPlacedTile && hoveredPlacedTile.r === r && hoveredPlacedTile.c === c;
                        const tileInfo = isHoveredPlaced ? hoveredPlacedTile.info : null;
                        const isInteractionTarget = hoveredPlacedTile && hoveredPlacedTile.info.interactionTargets.some(target => target.r === r && target.c === c);
                        const cellEnchantment = grid[r][c]?.tile.enchantment;
                        const showEnchantBorder = isHoveredPlaced && cellEnchantment;
                        const enchantmentClass = showEnchantBorder ? cellEnchantment : '';
                        const cellClass = isCursorOnCell && !showEnchantBorder ? 'gamepad-selected' : '';
                        const isTransformed = specialPreview && specialPreview.isTransformed;

                        // Tooltip should be shown for hovered tile or transformed tile under cursor
                        const showTooltip = isHoveredPlaced || (isCursorOnCell && isTransformed);

                        return `
                            <div class="grid-cell ${cellClass} ${isInteractionTarget ? 'highlight-target' : ''} ${isTransformed ? 'transformed-cell' : ''}" data-r="${r}" data-c="${c}">
                                <div class="special-preview-container">
                                    ${specialPreview ? this.renderSpecialPreview(specialPreview) : ''}
                                </div>
                                <div class="tile-container ${showEnchantBorder ? 'enchanted-hover' : ''}">
                                    ${cell ? this.renderTile(cell, specialPreview) : ''}
                                    ${ghost && !cell ? this.renderGhostTile(ghost) : ''}
                                    ${showEnchantBorder ? `<div class="enchanted-border ${enchantmentClass}"></div>` : ''}
                                </div>
                                ${showTooltip && tileInfo ? this.renderIngridTooltip(tileInfo, cell.tile) : ''}
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
                return `<line x1="${line.x1}" y1="${line.y1}" x2="${line.x2}" y2="${line.y2}" stroke="${line.color || 'white'}" stroke-width="2" stroke-dasharray="4" stroke-opacity="0.8" />`;
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