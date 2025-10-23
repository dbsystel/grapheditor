import { AxiosError } from 'axios';
import { AppLanguage, AppTheme, useSettingsStore } from 'src/stores/settings';
import { APP_LANGUAGES } from 'src/utils/constants';

export const adjustElementHeight = (element: HTMLElement) => {
	element.style.height = 'auto';
	element.style.height = `${element.scrollHeight}px`;
};

export const isString = (data: unknown): data is string => {
	return typeof data === 'string';
};

export const isNumber = (data: unknown): data is number => {
	return typeof data === 'number';
};

export const isInteger = (data: unknown): data is number => {
	if (!isNumber(data)) {
		return false;
	}

	return data % 1 === 0;
};

export const isObject = (
	value: unknown
): value is Record<'string' | 'number' | symbol, unknown> => {
	if (typeof value === 'object' && !Array.isArray(value) && value !== null) {
		return true;
	} else {
		return false;
	}
};

// eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
export const isFunction = (value: unknown): value is Function => {
	return typeof value === 'function';
};

export const isFunctionWithoutParameters = (
	// eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
	functionToTest: Function
): functionToTest is () => void => {
	return functionToTest.length === 0;
};

export const isPrimitive = (
	value: unknown
): value is string | number | null | undefined | boolean => {
	return value !== Object(value);
};

export const isDevelopment = () => {
	return import.meta.env.DEV;
};

export const isProduction = () => {
	return import.meta.env.PROD;
};

export const objectContainsKey = (object: Record<string, unknown>, key: string) => {
	return Object.prototype.hasOwnProperty.call(object, key);
};

export const twoObjectValuesAreEqual = (object1: unknown, object2: unknown) => {
	return JSON.stringify(object1) === JSON.stringify(object2);
};

export const isAppSupportedLanguage = (value: unknown): value is AppLanguage => {
	let languageIsSupported = false;

	APP_LANGUAGES.forEach((language) => {
		if (language === value) {
			languageIsSupported = true;
		}
	});

	return languageIsSupported;
};

/**
 * Helper function which will return a proper error message/object based on
 * error type. Sometimes we don't want to log the whole error object due to
 * security reasons.
 * Useful when dealing with Promise errors.
 */
export const parseError = (error: unknown) => {
	if (error instanceof AxiosError) {
		return error.response?.data.message || error.message;
	} else if (isObject(error) && 'message' in error && typeof error.message === 'string') {
		return error.message;
	} else {
		return JSON.stringify(error);
	}
};

export const copyTextToClipboard = (text: string) => {
	return window.navigator.clipboard.writeText(text);
};

export const clone = <T>(data: T): T => {
	return window.structuredClone(data);
};

/**
 * Helper class mainly made to check if coordinates x and y are inside a rectangle.
 */
export class Rectangle {
	x1: number;
	y1: number;
	x2: number;
	y2: number;

	constructor(x: number, y: number, width: number, height: number) {
		this.x1 = width > 0 ? x : x + width;
		this.y1 = height > 0 ? y : y + height;
		this.x2 = width > 0 ? x + width : x;
		this.y2 = height > 0 ? y + height : y;
	}

	contains(x: number, y: number) {
		return x >= this.x1 && x <= this.x2 && y >= this.y1 && y <= this.y2;
	}
}

export const toggleFullscreen = (setFullscreen: boolean) => {
	if (setFullscreen) {
		return document.documentElement.requestFullscreen({ navigationUI: 'show' });
	} else {
		return document.exitFullscreen();
	}
};

export const setApplicationTheme = (theme: AppTheme) => {
	// assign the color scheme to the body element in order to cover elements injected
	// to the body element via React.portal (or similar).
	document.body.dataset.mode = theme;

	useSettingsStore.getState().setTheme(theme);
};

// return current date and time as the following format: 4-7-2025-17-58-27
export const getFormattedCurrentDateTime = () => {
	const date = new Date();
	const dateTime = date.toLocaleString();
	const formattedDateTime = dateTime
		.replaceAll(' ', '-')
		.replaceAll('.', '-')
		.replaceAll(',', '')
		.replaceAll(':', '-');

	return formattedDateTime;
};

export const checkBrowserRenderingCapabilities = () => {
	// consider https://www.npmjs.com/package/detect-gpu
	const canvas = document.createElement('canvas');
	const result: { webglAvailable: boolean; softwareRendering: null | boolean; renderer: string } =
		{
			webglAvailable: false,
			softwareRendering: null, // null: cannot determine, true/false: detected
			renderer: '' // string with renderer info
		};

	try {
		const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');

		if (gl && gl instanceof WebGLRenderingContext) {
			result.webglAvailable = true;

			const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
			if (debugInfo) {
				const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
				result.renderer = renderer.toString();

				const lowerRenderer = renderer.toLowerCase();

				// angle (google, vulkan 1.3.0 (swiftshader device (subzero) (0x0000c0de)), swiftshader driver)
				// the list is probably not complete, use with caution
				if (
					lowerRenderer.includes('swiftshader') ||
					lowerRenderer.includes('llvmpipe') ||
					lowerRenderer.includes('software') ||
					lowerRenderer.includes('mesa')
				) {
					result.softwareRendering = true;
				} else {
					result.softwareRendering = false;
				}
			}
		}
	} catch {
		/* empty */
	}

	return result;
};

// name: full name, including extension
type DownloadFileOptions =
	| {
			name: string;
			content: Blob;
	  }
	| {
			name: string;
			content: string; // ObjectUrl
			mimeType: string;
	  };

export const downloadFile = (options: DownloadFileOptions) => {
	const anchorElement = document.createElement('a');
	let file;

	if (options.content instanceof Blob) {
		file = options.content;
	} else if ('mimeType' in options) {
		file = new Blob([options.content], { type: options.mimeType });
	}

	if (file) {
		anchorElement.href = URL.createObjectURL(file);
		anchorElement.download = options.name;
		anchorElement.click();
		anchorElement.remove();
	}
};
