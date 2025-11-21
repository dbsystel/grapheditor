import {
	destroyKeyboardObserver,
	initializeKeyboardObserver,
	isAltKeyPressed,
	isControlKeyPressed,
	isShiftKeyPressed,
	pressedKeys
} from 'src/utils/keyboard-observer';
import { userEvent } from 'vitest/browser';

describe('Utils - Keyboard observer', () => {
	test('Control key', async () => {
		initializeKeyboardObserver();

		await userEvent.keyboard('{Control>}');

		expect(pressedKeys.Control).toBe(true);
		expect(isControlKeyPressed()).toBe(true);

		await userEvent.keyboard('{/Control}');

		expect(pressedKeys.Control).toBe(false);
		expect(isControlKeyPressed()).toBe(false);

		destroyKeyboardObserver();
	});

	test('Alt key', async () => {
		initializeKeyboardObserver();

		await userEvent.keyboard('{Alt>}');

		expect(pressedKeys.Alt).toBe(true);
		expect(isAltKeyPressed()).toBe(true);

		await userEvent.keyboard('{/Alt}');

		expect(pressedKeys.Alt).toBe(false);
		expect(isAltKeyPressed()).toBe(false);

		destroyKeyboardObserver();
	});

	test('Shift key', async () => {
		initializeKeyboardObserver();

		await userEvent.keyboard('{Shift>}');

		expect(pressedKeys.Shift).toBe(true);
		expect(isShiftKeyPressed()).toBe(true);

		await userEvent.keyboard('{/Shift}');

		expect(pressedKeys.Shift).toBe(false);
		expect(isShiftKeyPressed()).toBe(false);

		destroyKeyboardObserver();
	});
});
