import GameData from '../data/GameData.js';

export const ROTATION_MAP = {
    // [dr, dc]
    UP: [-1, 0],
    RIGHT: [0, 1],
    DOWN: [1, 0],
    LEFT: [0, -1],
};

const ROTATION_SEQUENCE = [ROTATION_MAP.UP, ROTATION_MAP.RIGHT, ROTATION_MAP.DOWN, ROTATION_MAP.LEFT];

export function getRotatedDirection(baseDirection, rotation) {
    if (!rotation) return baseDirection;
    const baseIndex = ROTATION_SEQUENCE.indexOf(baseDirection);
    const rotations = rotation / 90;
    const newIndex = (baseIndex + rotations) % 4;
    return ROTATION_SEQUENCE[newIndex];
}

export function getInteractionsForTile(tileId, r, c, grid) {
    const interactions = [];
    const cell = grid[r][c];
    if (!cell) return interactions;
    const rotation = cell.tile.rotation || 0;

    switch(tileId) {
        case 'blue': { // UP
            const [dr, dc] = getRotatedDirection(ROTATION_MAP.UP, rotation);
            if (dr !== 0) { // Vertical
                for (let i = r + dr; i >= 0 && i < 5; i += dr) { if (grid[i][c]) interactions.push({r: i, c}); }
            } else { // Horizontal
                for (let i = c + dc; i >= 0 && i < 5; i += dc) { if (grid[r][i]) interactions.push({r, c: i}); }
            }
            break;
        }
        case 'red': { // DOWN
            const [dr, dc] = getRotatedDirection(ROTATION_MAP.DOWN, rotation);
            if (dr !== 0) { // Vertical
                for (let i = r + dr; i >= 0 && i < 5; i += dr) { if (grid[i][c]) interactions.push({r: i, c}); }
            } else { // Horizontal
                for (let i = c + dc; i >= 0 && i < 5; i += dc) { if (grid[r][i]) interactions.push({r, c: i}); }
            }
            break;
        }
        case 'green': { // LEFT
            const [dr, dc] = getRotatedDirection(ROTATION_MAP.LEFT, rotation);
            if (dr !== 0) { // Vertical
                for (let i = r + dr; i >= 0 && i < 5; i += dr) { if (grid[i][c]) interactions.push({r: i, c}); }
            } else { // Horizontal
                for (let i = c + dc; i >= 0 && i < 5; i += dc) { if (grid[r][i]) interactions.push({r, c: i}); }
            }
            break;
        }
        case 'yellow': { // RIGHT
            const [dr, dc] = getRotatedDirection(ROTATION_MAP.RIGHT, rotation);
            if (dr !== 0) { // Vertical
                for (let i = r + dr; i >= 0 && i < 5; i += dr) { if (grid[i][c]) interactions.push({r: i, c}); }
            } else { // Horizontal
                for (let i = c + dc; i >= 0 && i < 5; i += dc) { if (grid[r][i]) interactions.push({r, c: i}); }
            }
            break;
        }
        case 'rubiks':
            // Rubiks tile doesn't score directly, but its preview should highlight targets
            for (let [dr, dc] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
                const nr = r + dr;
                const nc = c + dc;
                if (nr >= 0 && nr < 5 && nc >= 0 && nc < 5 && grid[nr][nc]) {
                    interactions.push({r: nr, c: nc});
                }
            }
            break;
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
        case 'white': {
            const rotation = cell.tile.rotation || 0;
            const [leftDir, rightDir] = [getRotatedDirection(ROTATION_MAP.LEFT, rotation), getRotatedDirection(ROTATION_MAP.RIGHT, rotation)];

            let leftNeighborPos = null;
            let currentR = r; let currentC = c;
            while(true) {
                currentR += leftDir[0]; currentC += leftDir[1];
                if (currentR < 0 || currentR >= 5 || currentC < 0 || currentC >= 5) break;
                if (grid[currentR][currentC]) {
                    leftNeighborPos = { r: currentR, c: currentC };
                    break;
                }
            }

            let rightNeighborPos = null;
            currentR = r; currentC = c;
            while(true) {
                currentR += rightDir[0]; currentC += rightDir[1];
                if (currentR < 0 || currentR >= 5 || currentC < 0 || currentC >= 5) break;
                if (grid[currentR][currentC]) {
                    rightNeighborPos = { r: currentR, c: currentC };
                    break;
                }
            }

            const [upDir, ] = [getRotatedDirection(ROTATION_MAP.UP, rotation)];
            
            if (leftNeighborPos) {
                let checkR = leftNeighborPos.r + upDir[0];
                let checkC = leftNeighborPos.c + upDir[1];
                 while(checkR >= 0 && checkR < 5 && checkC >= 0 && checkC < 5) {
                    if (grid[checkR][checkC]) {
                        interactions.push({ r: checkR, c: checkC });
                    }
                    checkR += upDir[0]; checkC += upDir[1];
                }
            }
            if (rightNeighborPos) {
                 let checkR = rightNeighborPos.r + upDir[0];
                 let checkC = rightNeighborPos.c + upDir[1];
                 while(checkR >= 0 && checkR < 5 && checkC >= 0 && checkC < 5) {
                    if (grid[checkR][checkC]) {
                        interactions.push({ r: checkR, c: checkC });
                    }
                    checkR += upDir[0]; checkC += upDir[1];
                }
            }
            break;
        }
        case 'orange':
            // Highlights all tiles in its row and column for preview, but doesn't "interact" for score here.
            for (let i = 0; i < 5; i++) {
                if (i !== c && grid[r][i]) interactions.push({r, c: i});
                if (i !== r && grid[i][c]) interactions.push({r: i, c});
            }
            break;
        case 'shy':
        case 'munching':
        case 'duality':
        case 'blocking':
            // These tiles have no direct interactions or are handled in calculateScoreForGrid.
            break;
    }
    return interactions;
}

export function getTileInfo(r, c, grid) {
    const info = { interactions: 0, interactionTargets: [], multiplier: [], incomingCount: 0, specialStatus: null };
    const originalCell = grid[r][c];
    if (!originalCell) return info;

    // --- Create effective grid for calculation ---
    let effectiveGrid = JSON.parse(JSON.stringify(grid));
    let effectiveTileId = originalCell.tile.id;
    let effectiveEnchantment = originalCell.tile.enchantment;
    
    // Pre-computation logic (must be identical to calculateScoreForGrid)
    for (let r_eff = 0; r_eff < 5; r_eff++) {
        for (let c_eff = 0; c_eff < 5; c_eff++) {
            const tempCell = effectiveGrid[r_eff][c_eff];
            if (tempCell && tempCell.tile.id === 'rubiks') {
                const neighbors = [[-1, 0], [1, 0], [0, -1], [0, 1]];
                neighbors.forEach(([dr, dc]) => {
                    const nr = r_eff + dr;
                    const nc = c_eff + dc;
                    if (nr >= 0 && nr < 5 && nc >= 0 && nc < 5 && effectiveGrid[nr][nc]) {
                        const neighborTile = effectiveGrid[nr][nc].tile;
                        neighborTile.rotation = (neighborTile.rotation || 0) + 90;
                    }
                });
            }
        }
    }

    for (let r_eff = 0; r_eff < 5; r_eff++) {
        for (let c_eff = 0; c_eff < 5; c_eff++) {
            const tempCell = effectiveGrid[r_eff][c_eff];
            if (!tempCell) continue;
            
            if (tempCell.tile.id === 'munching') {
                const rotation = tempCell.tile.rotation || 0;
                const [dr, dc] = getRotatedDirection(ROTATION_MAP.LEFT, rotation);
                const targetR = r_eff + dr;
                const targetC = c_eff + dc;

                if (targetR >= 0 && targetR < 5 && targetC >= 0 && targetC < 5 && effectiveGrid[targetR][targetC]) {
                    effectiveGrid[targetR][targetC] = null;
                }
            }

            if (tempCell.tile.id === 'duality') {
                const rotation = tempCell.tile.rotation || 0;
                const [leftDr, leftDc] = getRotatedDirection(ROTATION_MAP.LEFT, rotation);
                const [rightDr, rightDc] = getRotatedDirection(ROTATION_MAP.RIGHT, rotation);
                
                const leftR = r_eff + leftDr;
                const leftC = c_eff + leftDc;
                const rightR = r_eff + rightDr;
                const rightC = c_eff + rightDc;
                
                if (leftR >= 0 && leftR < 5 && leftC >= 0 && leftC < 5 &&
                    rightR >= 0 && rightR < 5 && rightC >= 0 && rightC < 5) {
                    const rightTile = effectiveGrid[rightR][rightC];
                    const leftTile = effectiveGrid[leftR][leftC]; // The tile to be transformed
                    if (leftTile && rightTile) {
                         // Transform the tile
                         effectiveGrid[leftR][leftC] = JSON.parse(JSON.stringify(rightTile));
                         // Preserve the original rotation of the space, so it can be affected by Rubik's tiles
                         effectiveGrid[leftR][leftC].tile.rotation = leftTile.tile.rotation;
                         // If we are getting info for the transformed tile, update its effective ID for later
                         if (r === leftR && c === leftC) {
                            effectiveTileId = rightTile.tile.id;
                            effectiveEnchantment = rightTile.tile.enchantment;
                         }
                    }
                }
            }
        }
    }

    // --- Calculate interactions ---
    const interactionTargets = getInteractionsForTile(effectiveTileId, r, c, effectiveGrid);
    info.interactions = interactionTargets.length;
    info.interactionTargets = interactionTargets;

    // --- Calculate multiplier contributions ---
    if (effectiveEnchantment === 'productive' && info.interactions > 0) {
        info.multiplier.push('+15');
    }
    
    if (originalCell.tile.id === 'munching') {
        const rotation = originalCell.tile.rotation || 0;
        const [dr, dc] = getRotatedDirection(ROTATION_MAP.LEFT, rotation);
        const targetR = r + dr; const targetC = c + dc;
        if (targetR >= 0 && targetR < 5 && targetC >= 0 && targetC < 5 && grid[targetR][targetC]) {
            info.multiplier.push('+6');
        }
    }
    
    if (originalCell.tile.id === 'blocking') {
        info.multiplier.push('+15');
    }

    // Logic needing incoming interactions
    const incomingInteractions = Array(5).fill(null).map(() => Array(5).fill(0));
    for (let r_eff = 0; r_eff < 5; r_eff++) {
        for (let c_eff = 0; c_eff < 5; c_eff++) {
            const sourceCell = effectiveGrid[r_eff][c_eff];
            if (!sourceCell) continue;
            getInteractionsForTile(sourceCell.tile.id, r_eff, c_eff, effectiveGrid).forEach(targetPos => {
                if (effectiveGrid[targetPos.r][targetPos.c]) {
                    incomingInteractions[targetPos.r][targetPos.c]++;
                }
            });
        }
    }
    const incomingCount = incomingInteractions[r][c];
    
    if (originalCell.tile.id === 'purple') {
        if (incomingCount > 0) info.multiplier.push(`+${incomingCount}`);
    }
    if (originalCell.tile.id === 'black') {
        info.multiplier.push(incomingCount === 0 ? 'x3' : '+10');
    }
    if (originalCell.tile.id === 'shy') {
        if (incomingCount === 1) info.multiplier.push('x2');
    }

    // --- Check for special statuses from neighboring tiles ---
    // This check is performed on the original grid to see how this tile is affected
    for (const [dr, dc] of [[0, 1], [0, -1], [1, 0], [-1, 0]]) {
        const nr = r + dr;
        const nc = c + dc;
        if (nr < 0 || nr >= 5 || nc < 0 || nc >= 5) continue;
        const neighborCell = grid[nr][nc];
        if (!neighborCell) continue;

        const neighborId = neighborCell.tile.id;
        const neighborRotation = neighborCell.tile.rotation || 0;

        if (neighborId === 'munching') {
            const [eatDr, eatDc] = getRotatedDirection(ROTATION_MAP.LEFT, neighborRotation);
            if (nr + eatDr === r && nc + eatDc === c) {
                info.specialStatus = "EATEN";
                break;
            }
        } else if (neighborId === 'duality') {
            const [leftDr, leftDc] = getRotatedDirection(ROTATION_MAP.LEFT, neighborRotation);
            if (nr + leftDr === r && nc + leftDc === c) {
                info.specialStatus = "DUPLICATED";
                break;
            }
        } else if (neighborId === 'rubiks') {
            info.specialStatus = "ROTATED";
            break;
        }
    }

    info.incomingCount = incomingCount;
    return info;
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
    // Add rotations from Rubik's tiles
    for (let r = 0; r < 5; r++) {
        for (let c = 0; c < 5; c++) {
            const cell = effectiveGrid[r][c];
            if (cell && cell.tile.id === 'rubiks') {
                const neighbors = [[-1, 0], [1, 0], [0, -1], [0, 1]];
                neighbors.forEach(([dr, dc]) => {
                    const nr = r + dr;
                    const nc = c + dc;
                    if (nr >= 0 && nr < 5 && nc >= 0 && nc < 5 && effectiveGrid[nr][nc]) {
                        const neighborTile = effectiveGrid[nr][nc].tile;
                        neighborTile.rotation = (neighborTile.rotation || 0) + 90;
                    }
                });
            }
        }
    }

    for (let r = 0; r < 5; r++) {
        for (let c = 0; c < 5; c++) {
            const cell = effectiveGrid[r][c];
            if (!cell) continue;
            
            if (cell.tile.id === 'munching') {
                const rotation = cell.tile.rotation || 0;
                const [dr, dc] = getRotatedDirection(ROTATION_MAP.LEFT, rotation);
                const targetR = r + dr;
                const targetC = c + dc;

                if (targetR >= 0 && targetR < 5 && targetC >= 0 && targetC < 5 && effectiveGrid[targetR][targetC]) {
                    multiplier += 6;
                    effectiveGrid[targetR][targetC] = null;
                }
            }

            if (cell.tile.id === 'duality') {
                const rotation = cell.tile.rotation || 0;
                const [leftDr, leftDc] = getRotatedDirection(ROTATION_MAP.LEFT, rotation);
                const [rightDr, rightDc] = getRotatedDirection(ROTATION_MAP.RIGHT, rotation);
                
                const leftR = r + leftDr;
                const leftC = c + leftDc;
                const rightR = r + rightDr;
                const rightC = c + rightDc;
                
                if (leftR >= 0 && leftR < 5 && leftC >= 0 && leftC < 5 &&
                    rightR >= 0 && rightR < 5 && rightC >= 0 && rightC < 5) {
                    const rightTile = effectiveGrid[rightR][rightC];
                    const leftTile = effectiveGrid[leftR][leftC]; // The tile to be transformed
                    if (leftTile && rightTile) {
                         // Transform the tile
                         effectiveGrid[leftR][leftC] = JSON.parse(JSON.stringify(rightTile));
                         // Preserve the original rotation of the space, so it can be affected by Rubik's tiles
                         effectiveGrid[leftR][leftC].tile.rotation = leftTile.tile.rotation;
                    }
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
            }

            interactions.forEach(targetPos => {
                const targetCell = effectiveGrid[targetPos.r][targetPos.c];
                if (!targetCell) return;
                
                incomingInteractions[targetPos.r][targetPos.c]++;
                
                let interactionScore = 10;
                
                if (stickerMrHappy) interactionScore += 15;
                if (stickerRgb && ['red', 'green', 'blue'].includes(cell.tile.id)) {
                    interactionScore += 5;
                }

                baseScore += interactionScore;

                if (targetCell.tile.id === 'purple') {
                    multiplier += 1;
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
                if (incomingInteractions[r][c] === 1) {
                    multiplier *= 2;
                }
             }

             if (cell.tile.id === 'orange') {
                const uniqueColors = new Set();
                // Check row
                for (let i = 0; i < 5; i++) {
                    if (i !== c && effectiveGrid[r][i]) {
                        uniqueColors.add(effectiveGrid[r][i].tile.id);
                    }
                }
                // Check column
                for (let i = 0; i < 5; i++) {
                     if (i !== r && effectiveGrid[i][c]) {
                        uniqueColors.add(effectiveGrid[i][c].tile.id);
                    }
                }
                baseScore += uniqueColors.size * 20;
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