const ICONS = {
    ps4_cross: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="11" fill="#222" stroke="#444" stroke-width="2"/><path d="M16 8L8 16" stroke="#4D94FF" stroke-width="2.5" stroke-linecap="round"/><path d="M8 8L16 16" stroke="#4D94FF" stroke-width="2.5" stroke-linecap="round"/></svg>`,
    ps4_circle: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="11" fill="#222" stroke="#444" stroke-width="2"/><circle cx="12" cy="12" r="5" stroke="#FF4D4D" stroke-width="2.5"/></svg>`,
    ps4_square: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="11" fill="#222" stroke="#444" stroke-width="2"/><rect x="7.5" y="7.5" width="9" height="9" stroke="#FF69B4" stroke-width="2.5" rx="1"/></svg>`,
    ps4_l1: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="4" y="7" width="16" height="10" rx="2" fill="#555" stroke="#777" stroke-width="1"/><text x="12" y="16" font-family="sans-serif" font-weight="bold" font-size="10" fill="white" text-anchor="middle">L1</text></svg>`,
    ps4_r1: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="4" y="7" width="16" height="10" rx="2" fill="#555" stroke="#777" stroke-width="1"/><text x="12" y="16" font-family="sans-serif" font-weight="bold" font-size="10" fill="white" text-anchor="middle">R1</text></svg>`,
    ps4_l3: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="8" fill="#555" stroke="#777" stroke-width="1"/><text x="12" y="16" font-family="sans-serif" font-weight="bold" font-size="10" fill="white" text-anchor="middle">L3</text></svg>`,
    ps4_r3: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="8" fill="#555" stroke="#777" stroke-width="1"/><text x="12" y="16" font-family="sans-serif" font-weight="bold" font-size="10" fill="white" text-anchor="middle">R3</text></svg>`,
};

class ControlsPanel {
    render(props) {
        const { gamepadActive } = props;

        const keyboardControls = `
            <h3>Keyboard Controls</h3>
            <ul class="controls-list">
                <li><span>Move Cursor</span> <span>Arrow Keys</span></li>
                <li><span>Place/Pickup Tile</span> <span>Spacebar</span></li>
                <li><span>Deselect Tile</span> <span>Shift</span></li>
                <li><span>End Hand</span> <span>Enter</span></li>
                <li><span>Select Hand</span> <span>1-7 Keys</span></li>
                <li><span>Cycle Hand</span> <span>Z / X</span></li>
                <li><span>Toggle Deck</span> <span>C</span></li>
                <li><span>Toggle Controls</span> <span>V</span></li>
                <li><span>Hide Highlights</span> <span>Esc</span></li>
            </ul>
        `;

        const gamepadControls = `
            <h3>Gamepad Controls</h3>
            <ul class="controls-list">
                <li><span>Move Cursor</span> <span>D-Pad / L-Stick</span></li>
                <li><span>Place/Pickup Tile</span> ${ICONS.ps4_cross}</li>
                <li><span>Deselect Tile</span> ${ICONS.ps4_circle}</li>
                <li><span>End Hand</span> ${ICONS.ps4_square}</li>
                <li><span>Cycle Hand</span> <span>${ICONS.ps4_l1} / ${ICONS.ps4_r1}</span></li>
                <li><span>Toggle Deck</span> ${ICONS.ps4_l3}</li>
                <li><span>Toggle Controls</span> ${ICONS.ps4_r3}</li>
                <li><span>Hide Highlights</span> <span>Esc</span></li>
            </ul>
        `;

        return `
            <div class="controls-panel">
                ${gamepadActive ? gamepadControls : keyboardControls}
            </div>
        `;
    }
}

export default ControlsPanel;