import {
	destroyKeyboardObserver,
	initializeKeyboardObserver,
	isAlternateKeyPressed,
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

		expect(pressedKeys.Control).toBeUndefined();
		expect(isControlKeyPressed()).toBe(false);

		destroyKeyboardObserver();
	});

	test('Alt key', async () => {
		initializeKeyboardObserver();

		await userEvent.keyboard('{Alt>}');

		expect(pressedKeys.Alt).toBe(true);
		expect(isAlternateKeyPressed()).toBe(true);

		await userEvent.keyboard('{/Alt}');

		expect(pressedKeys.Alt).toBeUndefined();
		expect(isAlternateKeyPressed()).toBe(false);

		destroyKeyboardObserver();
	});

	test('Shift key', async () => {
		initializeKeyboardObserver();

		await userEvent.keyboard('{Shift>}');

		expect(pressedKeys.Shift).toBe(true);
		expect(isShiftKeyPressed()).toBe(true);

		await userEvent.keyboard('{/Shift}');

		expect(pressedKeys.Shift).toBeUndefined();
		expect(isShiftKeyPressed()).toBe(false);

		destroyKeyboardObserver();
	});
});
