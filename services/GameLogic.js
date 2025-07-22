import GameData from '../data/GameData.js';

export function getInteractionsForTile(tileId, r, c, grid) {
    const interactions = [];
    const tile = GameData.tiles[tileId];
    if (!tile) return interactions;

    switch(tileId) {
        case 'blue':
            for (let i = r - 1; i >= 0; i--) {
                if (grid[i][c]) interactions.push({r: i, c});
            }
            break;
        case 'red':
            for (let i = r + 1; i < 5; i++) {
                if (grid[i][c]) interactions.push({r: i, c});
            }
            break;
        case 'green':
             for (let i = c - 1; i >= 0; i--) {
                if (grid[r][i]) interactions.push({r, c: i});
            }
            break;
        case 'yellow':
            for (let i = c + 1; i < 5; i++) {
                if (grid[r][i]) interactions.push({r, c: i});
            }
            break;
        case 'rubiks': // Shares interaction logic with colorful
        case 'colorful':
            for (let dr = -1; dr <= 1; dr++) {
                for (let dc = -1; dc <= 1; dc++) {
                    if (dr === 0 && dc === 0) continue; // Skip self
                    const nr = r + dr;
                    const nc = c + dc;
                    if (nr >= 0 && nr < 5 && nc >= 0 && nc < 5 && grid[nr][nc]) {
                        interactions.push({r: nr, c: nc});
                    }
                }
            }
            break;
        case 'glass':
            // Check all 4 diagonal directions
            // All the way to the edge of the board
            [-1, 1].forEach(dr => {
                [-1, 1].forEach(dc => {
                    let nr = r + dr;
                    let nc = c + dc;
                    while(nr >= 0 && nr < 5 && nc >= 0 && nc < 5) {
                        if (grid[nr][nc]) {
                            interactions.push({r: nr, c: nc});
                        }
                        nr += dr;
                        nc += dc;
                    }
                });
            });
            break;
        case 'black':
             // Up, Down, Left, Right - all the way
            for (let i = r - 1; i >= 0; i--) { if (grid[i][c]) interactions.push({r: i, c}); } // Up
            for (let i = r + 1; i < 5; i++) { if (grid[i][c]) interactions.push({r: i, c}); } // Down
            for (let i = c - 1; i >= 0; i--) { if (grid[r][i]) interactions.push({r, c: i}); } // Left
            for (let i = c + 1; i < 5; i++) { if (grid[r][i]) interactions.push({r, c: i}); } // Right
            break;
        case 'shy':
            // This tile has no interactions, its effect is handled in calculateScoreForGrid.
            break;
        case 'munching':
            // This tile's effect is handled in calculateScoreForGrid, it has no direct interactions.
            break;
        case 'duality':
            // This tile's effect is handled in calculateScoreForGrid, it has no direct interactions.
            break;
        case 'white':
            // This tile has no interactions, its effect is handled in GameScreen.
            break;
        case 'blocking':
            // Scores nothing, effect is in calculateScore.
            break;
    }
    return interactions;
}

export function calculateScoreForGrid(grid, stickers, currentHandNumber) {
    let baseScore = 0;
    let multiplier = 1;
    let effectiveGrid = JSON.parse(JSON.stringify(grid)); // Deep copy for modifications
    const scoredTiles = new Set(); // Keep track of which tiles successfully scored
    const incomingInteractions = Array(5).fill(null).map(() => Array(5).fill(0));
    const effectsToApply = [];
    
    const stickerMrHappy = stickers.find(s => s.id === 'mr_happy');
    const stickerRgb = stickers.find(s => s.id === 'rgb');
    const stickerHourglass = stickers.find(s => s.id === 'hourglass');
    
    if (stickerHourglass) {
        multiplier += 4 * currentHandNumber;
    }

    // --- Pre-computation phase ---
    for (let r = 0; r < 5; r++) {
        for (let c = 0; c < 5; c++) {
            const cell = effectiveGrid[r][c];
            if (!cell) continue;
            
            if (cell.tile.id === 'munching' && c > 0 && effectiveGrid[r][c-1]) {
                multiplier += 6;
                effectiveGrid[r][c-1] = null; 
            }

            if (cell.tile.id === 'duality' && c > 0 && c < 4) {
                const rightTile = effectiveGrid[r][c+1];
                if (rightTile) { // Duality's effect only depends on the right tile existing
                    // The tile to the left will be replaced by a copy of the right tile for scoring.
                    // The original tile to the left is simply overwritten in this effectiveGrid.
                    effectiveGrid[r][c-1] = JSON.parse(JSON.stringify(rightTile));
                }
            }
        }
    }
    
    // --- Interaction calculation phase ---
    for (let r = 0; r < 5; r++) {
        for (let c = 0; c < 5; c++) {
            const cell = effectiveGrid[r][c];
            if (!cell) continue;

            const interactions = getInteractionsForTile(cell.tile.id, r, c, effectiveGrid);
            
            if (interactions.length > 0) {
                scoredTiles.add(`${r}-${c}`);
                if (cell.tile.id === 'glass') {
                    baseScore += 100;
                }
            }

            interactions.forEach(targetPos => {
                const targetCell = effectiveGrid[targetPos.r][targetPos.c];
                if (!targetCell) return;
                
                incomingInteractions[targetPos.r][targetPos.c]++;
                
                let interactionScore = 10;
                
                if (stickerMrHappy) interactionScore += 15;
                if (stickerRgb && ['red', 'green', 'blue'].includes(cell.tile.id)) {
                    interactionScore += 7;
                }

                baseScore += interactionScore;

                if (targetCell.tile.id === 'purple') {
                    multiplier += 1;
                }

                if (targetCell.tile.id === 'orange') {
                    effectsToApply.push({ type: 'gain_money', amount: 5 });
                    effectsToApply.push({ type: 'remove_tile', tileId: cell.tile.id, enchantment: cell.tile.enchantment });
                }
            });
        }
    }

    // --- Post-computation phase ---
    for (let r = 0; r < 5; r++) {
        for (let c = 0; c < 5; c++) {
             const cell = effectiveGrid[r][c];
             if (!cell) continue;

             if (cell.tile.id === 'black') {
                if (incomingInteractions[r][c] === 0) {
                    multiplier *= 3;
                } else {
                    multiplier += 10;
                }
             }

             if (cell.tile.id === 'shy') {
                if (incomingInteractions[r][c] === 0) {
                    multiplier *= 2;
                }
             }
 
             if (cell.tile.id === 'blocking') {
                multiplier += 15;
             }
             
             if (cell.tile.enchantment) {
                 if (cell.tile.enchantment === 'creative' && scoredTiles.size > 0) {
                     baseScore += 100;
                 }
                 if (cell.tile.enchantment === 'productive' && scoredTiles.size > 0) {
                     multiplier += 15;
                 }
             }
        }
    }
    
    return { score: baseScore, multiplier, scoredTiles, grid: effectiveGrid, effectsToApply };
}