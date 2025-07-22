const GameData = {
    tiles: {
        blue: { id: 'blue', name: 'Blue Tile', asset: 'blue tile', rarity: 'Common', price: 2, tooltip: 'Interacts with all tiles above it.' },
        red: { id: 'red', name: 'Red Tile', asset: 'red tile', rarity: 'Common', price: 2, tooltip: 'Interacts with all tiles below it.' },
        green: { id: 'green', name: 'Green Tile', asset: 'green tile', rarity: 'Common', price: 2, tooltip: 'Interacts with all tiles to its left.' },
        yellow: { id: 'yellow', name: 'Yellow Tile', asset: 'yellow tile', rarity: 'Common', price: 2, tooltip: 'Interacts with all tiles to its right.' },
        shy: { id: 'shy', name: 'Shy Tile', asset: 'shy tile', rarity: 'Uncommon', price: 5, tooltip: 'Scores nothing. If not interacted with, gives a x2 Multiplier and $5.' },
        purple: { id: 'purple', name: 'Purple Tile', asset: 'purple tile', rarity: 'Uncommon', price: 6, tooltip: 'Adds +1 to Multiplier when interacted with.' },
        orange: { id: 'orange', name: 'Orange Tile', asset: 'orange tile', rarity: 'Legendary', price: 10, tooltip: 'Does not score. For each tile that interacts with it, gain $5 but the interacting tile is permanently removed from your deck.' },
        colorful: { id: 'colorful', name: 'Colorful Tile', asset: 'colorful_tile', rarity: 'Uncommon', price: 5, tooltip: 'Interacts with all 8 tiles immediately surrounding it.' },
        white: { id: 'white', name: 'White Tile', asset: 'white_tile', rarity: 'Rare', price: 6, tooltip: 'Scores nothing. If placed with no adjacent tiles, adds 2 Black Tiles or 2 Duality Tiles to your deck.' },
        munching: { id: 'munching', name: 'Munching Tile', asset: 'munching tile', rarity: 'Uncommon', price: 4, tooltip: 'Eats tile to its left for +6 Multiplier.' },
        glass: { id: 'glass', name: 'Glass Tile', asset: 'glass tile', rarity: 'Uncommon', price: 4, tooltip: 'Interacts diagonally. Gives +100 score if it interacts.' },
        black: { id: 'black', name: 'Black Tile', asset: 'black tile', rarity: 'Rare', price: 6, tooltip: 'Interacts in all 4 cardinal directions. If not interacted with: x3 Multiplier. Otherwise: +10 Multiplier.' },
        duality: { id: 'duality', name: 'Duality Tile', asset: 'duality tile', rarity: 'Rare', price: 6, tooltip: 'Transforms the tile on its left into a copy of the tile on its right.' },
        rubiks: { id: 'rubiks', name: "Rubik's Tile", asset: 'rubiks_tile', rarity: 'Legendary', price: 10, tooltip: "Interacts with all 8 tiles immediately surrounding it. Adds one 'Colorful Tile' to your deck for each tile it interacted with." },
        blocking: { id: 'blocking', name: 'Blocking Tile', asset: 'blocking_tile', rarity: 'Legendary', price: 10, tooltip: 'Scores nothing. When placed, it locks itself and a random tile in your hand for this hand, but adds +15 to the multiplier.' },
    },
    enchantments: {
        creative: { id: 'creative', name: 'Creative', asset: 'creative enchant', rarity: 'Uncommon', baseFee: 8, tooltip: '+100 score if on board.' },
        productive: { id: 'productive', name: 'Productive', asset: 'productive enchant', rarity: 'Uncommon', baseFee: 8, tooltip: '+15 multiplier if on board.' },
        explosive: { id: 'explosive', name: 'Explosive', asset: 'explosive enchant', rarity: 'Rare', baseFee: 12, tooltip: '15% chance to be destroyed for +200 score.' },
        shiny: { id: 'shiny', name: 'Shiny', asset: 'shiny enchant', rarity: 'Common', baseFee: 3, tooltip: '+$2 when scored.' },
    },
    stickers: {
        mr_happy: { id: 'mr_happy', name: 'Mr. Happy', asset: 'mr happy sticker', rarity: 'Common', price: 5, tooltip: '+15 score for every interaction.' },
        rgb: { id: 'rgb', name: 'RGB', asset: 'rgb sticker', rarity: 'Common', price: 5, tooltip: 'Red, Green, Blue tiles grant +7 score per interaction.' },
        hourglass: { id: 'hourglass', name: 'Hourglass', asset: 'hourglass sticker', rarity: 'Uncommon', price: 8, tooltip: '+4 multiplier per hand number.' },
        need_a_hand: { id: 'need_a_hand', name: 'Need a Hand?', asset: 'need a hand sticker', rarity: 'Uncommon', price: 8, tooltip: '+1 maximum hands per level.' },
    }
};

export default GameData;