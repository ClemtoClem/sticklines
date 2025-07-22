class ScorePreview {
    render(props) {
        const { preview } = props;
        return `
            <div class="preview-bar-container">
               <span>Score</span>
               <div class="preview-bar score-bar">
                   <div class="preview-bar-fill" style="width: ${Math.min(100, (preview.score / 500) * 100)}%;"></div>
                   <span>${preview.score}</span>
               </div>
            </div>
            <div class="preview-bar-container">
               <span>Multiplier</span>
               <div class="preview-bar mult-bar">
                    <div class="preview-bar-fill" style="width: ${Math.min(100, ((preview.multiplier - 1) / 20) * 100)}%;"></div>
                    <span>x${preview.multiplier}</span>
               </div>
            </div>
            <div class="final-score-preview">
               Total: ${preview.score * preview.multiplier}
            </div>
        `;
    }
}

export default ScorePreview;
