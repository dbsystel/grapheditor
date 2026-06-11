import { AxiosError } from 'axios';
import {
	dateRegex,
	html5DateRegex,
	html5DatetimeRegex,
	html5DurationRegex,
	html5TimeRegex
} from 'src/utils/helpers/regex';

export const adjustElementHeight = (element: HTMLElement) => {
	element.style.height = 'auto';
	element.style.height = `${element.scrollHeight}px`;
};

export const isString = (data: unknown): data is string => {
	return typeof data === 'string';
};

export const isBoolean = (data: unknown): data is boolean => {
	return typeof data === 'boolean';
};

export const isNumber = (data: unknown): data is number => {
	return typeof data === 'number' && !isNaN(data);
};

export const isInteger = (data: unknown): data is number => {
	return Number.isInteger(data);
};

export const isFloat = (data: unknown): data is number => {
	if (!isNumber(data)) {
		return false;
	}

	return data % 1 !== 0;
};

export const isTime = (input: unknown) => {
	return isString(input) && html5TimeRegex.test(input);
};

export const isDate = (input: unknown) => {
	if (!(isString(input) || isNumber(input))) {
		return false;
	}

	try {
		new Date(input).toISOString();
		return true;
	} catch {
		return false;
	}
};

export const isDatetime = (input: unknown) => {
	if (!isString(input) && !isNumber(input)) {
		return false;
	}

	try {
		new Date(input).toISOString();
		return true;
	} catch {
		return false;
	}
};

export const isDuration = (input: unknown) => {
	return isString(input) && html5DurationRegex.test(input);
};

export const isObject = (value: unknown): value is Record<'string', unknown> => {
	if (typeof value === 'object' && !Array.isArray(value) && value !== null) {
		return true;
	} else {
		return false;
	}
};

export const isArray = (value: unknown): value is Array<unknown> => {
	return Array.isArray(value);
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

export const isKeyOfObject = <T>(object: T, key: unknown): key is keyof T => {
	return isObject(object) && typeof key === 'string' && key in object;
};

export function hasKey<O extends object, K extends keyof O>(obj: O, key: K | string): key is K {
	return key in obj;
}

export const objectHasOwnProperty = (object: Record<string, unknown>, key: string) => {
	return Object.prototype.hasOwnProperty.call(object, key);
};

export const isDevelopment = () => {
	return import.meta.env.DEV;
};

export const isProduction = () => {
	return import.meta.env.PROD;
};

export const convertStringToBoolean = (input: string): boolean => {
	const normalizedInput = input.trim().toLowerCase();

	return normalizedInput === 'true';
};

export const convertBooleanToString = (input: boolean): string => {
	return input ? 'true' : 'false';
};

export const getDigitsFromString = (input: string) => {
	const digits = input.replace(/\D/g, '');

	if (digits.length > 0) {
		return digits;
	}

	return undefined;
};

export const getDateFromString = (input: string) => {
	const matches = input.match(dateRegex);
	const groups = matches?.groups;

	if (groups && 'year' in groups && 'month' in groups && 'day' in groups) {
		return groups.year + '-' + groups.month + '-' + groups.day;
	}

	return undefined;
};

export const getTimeFromString = (input: string) => {
	const matches = input.match(html5TimeRegex);

	if (!matches) {
		return undefined;
	}

	const fractionOfSecond = stripTrailingZerosFromString(matches.at(2) || '');

	return {
		time: matches.at(1),
		fractionOfSecond: fractionOfSecond,
		timezoneOffsetSign: matches.at(3),
		timezoneOffset: matches.at(4)
	};
};

export const getDatetimeFromString = (datetimeString: string) => {
	const matches = datetimeString.match(html5DatetimeRegex);

	if (!matches) {
		return undefined;
	}

	const fractionOfSecond = stripTrailingZerosFromString(matches.at(2) || '');

	return {
		datetime: matches.at(1),
		fractionOfSecond: fractionOfSecond,
		timezoneOffsetSign: matches.at(3),
		timezoneOffset: matches.at(4)
	};
};

export const compareTwoStringsForSorting = (string1: string, string2: string) => {
	if (string1 < string2) {
		return -1;
	}

	if (string1 > string2) {
		return 1;
	}

	return 0;
};

export const getAt = <T extends unknown[], I extends keyof T>(array: T, index: I): T[I] => {
	return array[index];
};

export const twoObjectValuesAreEqual = (object1: unknown, object2: unknown) => {
	return JSON.stringify(object1) === JSON.stringify(object2);
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

// return current date and time as the following format: 4-7-2025-17-58-27
export const getFormattedCurrentDatetime = () => {
	const date = new Date();
	const dateTime = date.toLocaleString();
	const formattedDateTime = dateTime
		.replaceAll(' ', '-')
		.replaceAll('.', '-')
		.replaceAll(',', '')
		.replaceAll(':', '-');

	return formattedDateTime;
};

/**
 * Removes trailing zeros from a numeric string.
 * Handles both integer and decimal numbers, including negative values.
 *
 * Examples:
 * - "123.45000" -> "123.45"
 * - "1000.000" -> "1000"
 * - "5000" -> "5"
 * - "-123.4000" -> "-123.4"
 * - "-1000.000" -> "-1000"
 * */
export const stripTrailingZerosFromString = (string: string) => {
	let trimmedString = String(string).trim();
	const sign = trimmedString.startsWith('-') ? '-' : '';

	if (!trimmedString) {
		return string;
	}

	if (sign) {
		trimmedString = trimmedString.slice(1);
	}

	if (trimmedString.includes('.')) {
		// Remove trailing zeros after decimal; remove dangling decimal if needed
		trimmedString = trimmedString
			.replace(/(\.\d*?[1-9])0+$/, '$1')
			.replace(/\.0+$/, '')
			.replace(/\.$/, '');
	} else {
		// Integer case
		trimmedString = trimmedString.replace(/0+$/, '') || '0';
	}

	return sign + trimmedString;
};

export const getFormattedLocaleDatetimeString = (datetime: string) => {
	const datetimeObject = getDatetimeFromString(datetime);
	const date = new Date(datetime);
	let dateToReturn = '';
	let datetimeSuffix = '';

	// if datetime, try and return locale datetime and other information if possible
	if (datetimeObject) {
		dateToReturn = date.toLocaleString();

		if (datetimeObject.fractionOfSecond) {
			datetimeSuffix += `.${datetimeObject.fractionOfSecond}`;
		}

		if (
			datetimeObject.timezoneOffsetSign &&
			datetimeObject.timezoneOffset &&
			// ignore timezone offset if it's 00:00
			parseInt(datetimeObject.timezoneOffset)
		) {
			datetimeSuffix += `${datetimeObject.timezoneOffsetSign}${datetimeObject.timezoneOffset}`;
		}
	}
	// else if only date, return locale date only
	else if (html5DateRegex.test(datetime)) {
		dateToReturn = date.toLocaleDateString();
	}

	return dateToReturn + datetimeSuffix;
};

export const getFormattedFloat = (float: string) => {
	return float.replaceAll(',', '.');
};

export const getFormattedGUIFloat = (float: string) => {
	return float.replaceAll('.', ',');
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

export const isElementBeforeElement = (element1: HTMLElement, element2: HTMLElement) => {
	let cur;
	if (element2.parentNode === element1.parentNode) {
		for (cur = element1.previousSibling; cur; cur = cur.previousSibling) {
			if (cur === element2) return true;
		}
	}
	return false;
};

export const getElementIndex = (element: HTMLElement) => {
	let index = 0;
	let node = element.parentElement?.firstElementChild;
	while (node && node !== element) {
		node = node.nextElementSibling;
		index++;
	}
	return index;
};

export const swapArrayIndexes = (array: Array<unknown>, index1: number, index2: number) => {
	const temp = array[index1];

	array[index1] = array[index2];

	array[index2] = temp;
};

export const getDeepestHoveredElement = () => {
	const hoveredElements = document.querySelectorAll(':hover');

	// use Array.from to convert NodeList to array (it provides better TS support)
	return Array.from(hoveredElements).at(hoveredElements.length - 1);
};

/**
 * Return random number between (and including) 0 and max (not including).
 * @param max
 */
export const getRandomIntiger = (max: number) => {
	return Math.floor(Math.random() * max);
};
