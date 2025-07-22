import GameData from "../data/GameData.js";

class Tooltip {
    constructor(element) {
        this.element = element;
        this.isTouchInteraction = false;

        // Listen for touch events to temporarily disable hover tooltips
        window.addEventListener('touchstart', () => {
            this.isTouchInteraction = true;
            this.hide(); // Hide any visible tooltip on touch
        }, { capture: true, passive: true });

        window.addEventListener('touchend', () => {
            // Reset after a short delay to allow click events to process
            setTimeout(() => {
                this.isTouchInteraction = false;
            }, 300);
        }, { capture: true, passive: true });
    }

    show(targetElement) {
        // Prevent hover tooltips during a touch interaction
        if (this.isTouchInteraction) {
            return;
        }

        const type = targetElement.dataset.tooltipType;
        const id = targetElement.dataset.tooltipId;
        const enchantmentId = targetElement.dataset.tooltipEnchantment;
        const duration = targetElement.dataset.tooltipDuration;

        if (!type || !id || !GameData[type] || !GameData[type][id]) {
            return;
        }

        const item = GameData[type][id];
        let enchantmentHtml = '';
        let durationHtml = '';

        if (duration) {
            durationHtml = `<div class="tooltip-duration">Uses Remaining: ${duration}</div>`;
        }

        if (enchantmentId && GameData.enchantments[enchantmentId]) {
            const enchantment = GameData.enchantments[enchantmentId];
            enchantmentHtml = `
                <div class="tooltip-enchantment">
                    <div class="tooltip-enchantment-title">Enchanted: ${enchantment.name}</div>
                    <div class="tooltip-enchantment-body">${enchantment.tooltip}</div>
                </div>
            `;
        }
        
        this.element.innerHTML = `
            ${enchantmentHtml}
            <div class="tooltip-title">${item.name}</div>
            <div class="tooltip-rarity" style="color: var(--color-rarity-${item.rarity.toLowerCase()})">${item.rarity}</div>
            ${durationHtml}
            <div class="tooltip-body">${item.tooltip}</div>
        `;
        
        this.element.style.opacity = '1';
    }

    hide() {
        this.element.style.opacity = '0';
    }

    move(event) {
        // Position tooltip near the cursor
        const xOffset = 20;
        const yOffset = 10;
        let x = event.clientX + xOffset;
        let y = event.clientY + yOffset;

        // Prevent tooltip from going off-screen
        const tooltipRect = this.element.getBoundingClientRect();
        if (x + tooltipRect.width > window.innerWidth) {
            x = event.clientX - tooltipRect.width - xOffset;
        }
        if (y + tooltipRect.height > window.innerHeight) {
            y = window.innerHeight - tooltipRect.height - yOffset;
        }

        this.element.style.left = `${x}px`;
        this.element.style.top = `${y}px`;
    }
}

export default Tooltip;