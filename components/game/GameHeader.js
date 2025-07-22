class GameHeader {
    render(props) {
        const { ante, money, deckSize, maxDeckSize, score, goal, scoreReached, handsRemaining } = props;
        return `
            <div class="game-header">
                <div class="header-left">
                    <span>Ante ${ante}</span>
                    <span style="color: var(--color-gold); margin-left: 20px;">$${money}</span>
                    <button class="menu-button small-button" id="deck-btn">Deck (${deckSize}/${maxDeckSize})</button>
                    <button class="menu-button small-button" id="controls-btn">Controls</button>
                </div>
                <div class="header-center">
                    Score: <span class="${scoreReached ? 'score-reached' : ''}">${score}</span> / ${goal}
                </div>
                <div class="header-right">
                    Hands: ${handsRemaining}
                </div>
            </div>
        `;
    }
}

export default GameHeader;

