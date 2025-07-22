class GamepadService {
    constructor() {
        this.gamepads = {};
        this.previousButtonStates = {};
        this.previousAxisStates = {};
        this.axisThreshold = 0.5;
        this.axisDeadZone = 0.2; // To prevent drift
        this.axisRepeatDelay = 200; // ms
        this.axisRepeatTimers = {};
        this.eventTarget = new EventTarget();
    }

    init() {
        window.addEventListener('gamepadconnected', e => this.handleConnect(e));
        window.addEventListener('gamepaddisconnected', e => this.handleDisconnect(e));
    }

    handleConnect(e) {
        console.log(`Gamepad connected at index ${e.gamepad.index}: ${e.gamepad.id}.`);
        this.gamepads[e.gamepad.index] = e.gamepad;
        this.previousButtonStates[e.gamepad.index] = e.gamepad.buttons.map(b => b.pressed);
        this.previousAxisStates[e.gamepad.index] = e.gamepad.axes.map(a => 0); // Start at 0
        this.axisRepeatTimers[e.gamepad.index] = {};
    }

    handleDisconnect(e) {
        console.log(`Gamepad disconnected from index ${e.gamepad.index}: ${e.gamepad.id}.`);
        delete this.gamepads[e.gamepad.index];
        delete this.previousButtonStates[e.gamepad.index];
        delete this.previousAxisStates[e.gamepad.index];
        delete this.axisRepeatTimers[e.gamepad.index];
    }

    update() {
        const allGamepads = navigator.getGamepads();
        for (let i = 0; i < allGamepads.length; i++) {
            if (allGamepads[i]) {
                if (!this.gamepads[i]) {
                    this.handleConnect({ gamepad: allGamepads[i] });
                }
                this.pollGamepad(allGamepads[i]);
            }
        }
    }

    pollGamepad(gamepad) {
        let anyInput = false;

        // Poll buttons
        gamepad.buttons.forEach((button, index) => {
            if (button.pressed !== this.previousButtonStates[gamepad.index][index]) {
                anyInput = true;
                this.dispatchEvent('button', {
                    button: this.getButtonName(index),
                    down: button.pressed,
                    gamepadIndex: gamepad.index,
                });
                this.previousButtonStates[gamepad.index][index] = button.pressed;
            }
        });

        // Poll axes
        gamepad.axes.forEach((axisValue, index) => {
            const prevAxisValue = this.previousAxisStates[gamepad.index][index] || 0;
            const axisName = this.getAxisName(index);

            // Check if axis moved past threshold
            if (Math.abs(axisValue) > this.axisThreshold && Math.abs(prevAxisValue) <= this.axisThreshold) {
                anyInput = true;
                this.dispatchEvent('axis', { axis: axisName, value: axisValue, gamepadIndex: gamepad.index });
                
                // Start repeat timer
                if (!this.axisRepeatTimers[gamepad.index][axisName]) {
                    this.axisRepeatTimers[gamepad.index][axisName] = setTimeout(() => {
                        this.axisRepeatTimers[gamepad.index][axisName] = null; // Clear timer to allow re-trigger
                    }, this.axisRepeatDelay);
                }

            } else if (Math.abs(axisValue) <= this.axisDeadZone && Math.abs(prevAxisValue) > this.axisDeadZone) {
                // Axis returned to deadzone, clear timers
                clearTimeout(this.axisRepeatTimers[gamepad.index][axisName]);
                this.axisRepeatTimers[gamepad.index][axisName] = null;
            }

            this.previousAxisStates[gamepad.index][index] = axisValue;
        });

        if (anyInput) {
            this.dispatchEvent('any', { gamepadIndex: gamepad.index });
        }
    }

    getButtonName(index) {
        // Standard Gamepad Mapping
        const map = {
            0: 'A', // A on Xbox, X on PS
            1: 'B', // B on Xbox, O on PS
            2: 'X', // X on Xbox, Square on PS
            3: 'Y', // Y on Xbox, Triangle on PS
            4: 'L1',
            5: 'R1',
            6: 'L2',
            7: 'R2',
            8: 'Select',
            9: 'Start',
            10: 'L3',
            11: 'R3',
            12: 'up',
            13: 'down',
            14: 'left',
            15: 'right',
        };
        return map[index] || `button_${index}`;
    }

    getAxisName(index) {
        const map = {
            0: 'leftX',
            1: 'leftY',
            2: 'rightX',
            3: 'rightY',
        };
        return map[index] || `axis_${index}`;
    }

    dispatchEvent(type, detail) {
        const event = new CustomEvent(`gamepad:${type}`, { detail });
        this.eventTarget.dispatchEvent(event);
    }

    addEventListener(type, callback) {
        this.eventTarget.addEventListener(type, callback);
    }

    removeEventListener(type, callback) {
        this.eventTarget.removeEventListener(type, callback);
    }
}

// Export a singleton instance
export default new GamepadService();