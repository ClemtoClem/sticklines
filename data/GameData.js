const GameData = {
    tiles: {
        blue: { id: 'blue', name: 'Blue Tile', asset: 'blue_tile', rarity: 'Common', price: 2, tooltip: 'Interacts with all tiles above it.' },
        red: { id: 'red', name: 'Red Tile', asset: 'red_tile', rarity: 'Common', price: 2, tooltip: 'Interacts with all tiles below it.' },
        green: { id: 'green', name: 'Green Tile', asset: 'green_tile', rarity: 'Common', price: 2, tooltip: 'Interacts with all tiles to its left.' },
        yellow: { id: 'yellow', name: 'Yellow Tile', asset: 'yellow_tile', rarity: 'Common', price: 2, tooltip: 'Interacts with all tiles to its right.' },
        shy: { id: 'shy', name: 'Shy Tile', asset: 'shy_tile', rarity: 'Uncommon', price: 5, tooltip: 'Scores no points. If *exactly one* tile interacts with it, multiplies the current multiplier by 2.' },
        purple: { id: 'purple', name: 'Purple Tile', asset: 'purple_tile', rarity: 'Uncommon', price: 6, tooltip: 'Adds +1 to Multiplier when interacted with.' },
        orange: { id: 'orange', name: 'Orange Tile', asset: 'orange_tile', rarity: 'Rare', price: 7, tooltip: 'Scores +20 for each unique tile color in its row and column (not including itself).' },
        colorful: { id: 'colorful', name: 'Colorful Tile', asset: 'colorful_tile', rarity: 'Uncommon', price: 5, tooltip: 'Interacts with all 8 tiles immediately surrounding it.' },
        white: { id: 'white', name: 'White Tile', asset: 'white_tile', rarity: 'Rare', price: 6, tooltip: 'Finds the closest tile to its left and right, then interacts with all tiles in the columns ABOVE those tiles.' },
        munching: { id: 'munching', name: 'Munching Tile', asset: 'munching_tile', rarity: 'Uncommon', price: 4, tooltip: 'Eats tile to its left for +6 Multiplier.' },
        glass: { id: 'glass', name: 'Glass Tile', asset: 'glass_tile', rarity: 'Uncommon', price: 4, tooltip: 'Interacts diagonally in all four directions.' },
        black: { id: 'black', name: 'Black Tile', asset: 'black_tile', rarity: 'Rare', price: 6, tooltip: 'Interacts in all 4 cardinal directions. If not interacted with: x3 Multiplier. Otherwise: +10 Multiplier.' },
        duality: { id: 'duality', name: 'Duality Tile', asset: 'duality_tile', rarity: 'Rare', price: 6, tooltip: 'Transforms the tile on its left into a copy of the tile on its right.' },
        rubiks: { id: 'rubiks', name: "Rubik's Tile", asset: 'rubiks_tile', rarity: 'Rare', price: 10, tooltip: 'Rotates the four adjacent tiles (up, down, left, right) 90 degrees clockwise, altering their interaction direction.' },
        blocking: { id: 'blocking', name: 'Blocking Tile', asset: 'blocking_tile', rarity: 'Legendary', price: 10, tooltip: 'Scores nothing. When placed, it locks itself and a random tile in your hand for this hand, but adds +15 to the multiplier.' },
    },
    enchantments: {
        creative: { id: 'creative', name: 'Creative', asset: 'creative_enchant', rarity: 'Uncommon', baseFee: 8, tooltip: '+100 score if on board and interactions occur.' },
        productive: { id: 'productive', name: 'Productive', asset: 'productive_enchant', rarity: 'Uncommon', baseFee: 8, tooltip: '+15 multiplier if on board and interactions occur.' },
        explosive: { id: 'explosive', name: 'Explosive', asset: 'explosive_enchant', rarity: 'Rare', baseFee: 12, tooltip: '15% chance to be destroyed for +200 score.' },
        shiny: { id: 'shiny', name: 'Shiny', asset: 'shiny_enchant', rarity: 'Common', baseFee: 3, tooltip: '+$2 when scored.' },
    },
    stickers: {
        mr_happy: { id: 'mr_happy', name: 'Mr. Happy', asset: 'mr_happy_sticker', rarity: 'Common', price: 5, tooltip: '+15 score for every interaction.' },
        rgb: { id: 'rgb', name: 'RGB', asset: 'rgb_sticker', rarity: 'Common', price: 5, tooltip: 'Red, Green, Blue tiles grant +5 score per interaction.' },
        hourglass: { id: 'hourglass', name: 'Hourglass', asset: 'hourglass_sticker', rarity: 'Uncommon', price: 8, tooltip: '+4 multiplier per hand number.' },
        need_a_hand: { id: 'need_a_hand', name: 'Need a Hand?', asset: 'need_a_hand_sticker', rarity: 'Uncommon', price: 8, tooltip: '+1 maximum hands per level.' },
    }
};

export default GameData;