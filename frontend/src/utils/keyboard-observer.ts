type PressedKey = 'Control' | 'Alt' | 'Shift' | string;

// for key values: https://developer.mozilla.org/en-US/docs/Web/API/UI_Events/Keyboard_event_key_values
export let pressedKeys: Record<PressedKey, boolean> = {};

/**
 * Manually observe pressed keyboard keys.
 * This approach had to be used due to the fact pinch event would flag "ctrlKey" as true, although
 * the control key wasn't pressed. This is a known browser implementation of pinch event.
 * We tried checking "deltaY" property if it is a whole number or a decimal number to try and distinguish
 * between regular mouse wheel and touchpad pinch events (mouse would have whole number, touchpad/
 * trackpad decimal number), but that didn't work as expected.
 */
export const initializeKeyboardObserver = () => {
	window.addEventListener('keydown', onKeyDown);
	window.addEventListener('keyup', onKeyUp);
	window.addEventListener('blur', resetPressedKeysState);
};

export const destroyKeyboardObserver = () => {
	window.removeEventListener('keydown', onKeyDown);
	window.removeEventListener('keyup', onKeyUp);
	window.removeEventListener('blur', resetPressedKeysState);
	resetPressedKeysState();
};

const resetPressedKeysState = () => {
	pressedKeys = {};
};

const onKeyDown = (event: KeyboardEvent) => {
	if (!pressedKeys[event.key]) {
		pressedKeys[event.key] = true;
	}
};

const onKeyUp = (event: KeyboardEvent) => {
	pressedKeys[event.key] = false;

	// prevent browser menu focus on Alt blur (the application looses focus)
	if (event.key === 'Alt') {
		event.preventDefault();
	}
};

export const isControlKeyPressed = () => {
	return pressedKeys['Control'];
};

export const isShiftKeyPressed = () => {
	return pressedKeys['Shift'];
};

export const isAltKeyPressed = () => {
	return pressedKeys['Alt'];
};
