type PressedKey = 'Control' | 'Alt' | 'Shift' | string;

// only these modifier keys are tracked; everything else is ignored
const MODIFIER_KEYS: Array<PressedKey> = ['Control', 'Shift', 'Alt'];

// for key values: https://developer.mozilla.org/en-US/docs/Web/API/UI_Events/Keyboard_event_key_values
// only currently held modifier keys are present (removed on release)
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
	if (MODIFIER_KEYS.includes(event.key)) {
		pressedKeys[event.key] = true;
	}
};

const onKeyUp = (event: KeyboardEvent) => {
	// remove the key so pressedKeys only ever holds currently pressed modifiers
	delete pressedKeys[event.key];

	// prevent browser menu focus on Alt blur (the application looses focus)
	if (event.key === 'Alt') {
		event.preventDefault();
	}
};

export const isControlKeyPressed = () => {
	return Boolean(pressedKeys['Control']);
};

export const isShiftKeyPressed = () => {
	return Boolean(pressedKeys['Shift']);
};

export const isAlternateKeyPressed = () => {
	return Boolean(pressedKeys['Alt']);
};

/**
 * Return true only when none of the modifier keys (Control, Shift, Alt) are
 * currently pressed. Useful to guard "plain" interactions that must not overlap
 * with any modifier-based gesture.
 */
export const areNoModifiersPressed = () => {
	return Object.keys(pressedKeys).length === 0;
};

/**
 * Return true only when EXACTLY the given modifier keys are pressed and no other
 * modifier is. For example, areExactModifiersPressed('Control', 'Shift') is true
 * when Control and Shift are held, but false when only Control is held or when
 * Control + Shift + Alt are held. This makes key combinations unambiguous.
 */
export const areExactModifiersPressed = (...keys: Array<PressedKey>) => {
	return Object.keys(pressedKeys).length === keys.length && keys.every((key) => pressedKeys[key]);
};
