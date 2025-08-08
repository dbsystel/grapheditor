import { AxiosError } from 'axios';
import { Component } from 'react';
import { ErrorInfo } from 'react-dom/client';
import { MappedPosition, RawSourceMap, SourceMapConsumer } from 'source-map-js';
import { useNotificationsStore } from 'src/stores/notifications';
import { isDevelopment, isObject, isString } from 'src/utils/helpers/general';

const addNotification = useNotificationsStore.getState().addNotification;
// cache source maps since we lazy-load some components (those .js files won't be bundled
// with the rest of the app)
const sourceMapsCache: Record<string, RawSourceMap> = {};

type ExtendedMappedPosition = MappedPosition & {
	stack: ExtractedFileUrlData;
};

const mapSourceFile = async (
	source: string
): Promise<Array<ExtendedMappedPosition | string> | null> => {
	const filesUrlData = extractFileUrlData(source);
	const fileSourcesData: Array<ExtendedMappedPosition | string> = [];

	if (!filesUrlData) {
		return null;
	}

	for (let i = 0, l = filesUrlData.length; i < l; i++) {
		const fileUrlData = filesUrlData[i];

		if (!fileUrlData || isString(fileUrlData) || !fileUrlData.cleanUrl) {
			if (isString(fileUrlData)) {
				fileSourcesData.push(fileUrlData);
			}

			continue;
		}

		// TODO fetch sourcemaps in parallel
		const sourceMapFile = await fetchSourceMapFile(fileUrlData.cleanUrl + '.map');
		const mapConsumer = new SourceMapConsumer(sourceMapFile);

		fileSourcesData.push({
			...mapConsumer.originalPositionFor({
				line: fileUrlData.lineNumber,
				column: fileUrlData.columnNumber
			}),
			stack: fileUrlData
		});
	}

	return fileSourcesData;
};

const fetchSourceMapFile = async (sourceMapUrl: string) => {
	// TODO improve caching (not working as intended when fetch is still ongoing because we store
	//  response in cache only after the fetch is done)
	if (sourceMapsCache[sourceMapUrl]) {
		return sourceMapsCache[sourceMapUrl];
	}

	return await fetch(sourceMapUrl, {
		headers: {
			'Content-Type': 'text/javascript'
		}
	}).then(async (response) => {
		sourceMapsCache[sourceMapUrl] = await response.json();

		return sourceMapsCache[sourceMapUrl];
	});
};

type ExtractedFileUrlData = {
	url: string;
	cleanUrl: string;
	line: string;
	lineNumber: number;
	columnNumber: number;
};

const extractFileUrlData = (string: string): Array<ExtractedFileUrlData | string> | null => {
	// match file url's including versioning, line and column numbers (if any)
	const fileUrlMatches = string.match(/http(s)?:.*?(?=(?:\)|$))/gm);
	const lines = string.split('\n');
	const matches: Array<ExtractedFileUrlData | string> = [];

	if (fileUrlMatches) {
		const uniqueFileUrlMatches = [...new Set(fileUrlMatches)];

		lines.forEach((line) => {
			let lineHasMatch = false;

			uniqueFileUrlMatches.forEach((urlMatch) => {
				if (line.includes(urlMatch)) {
					lineHasMatch = true;

					let cleanUrl = '';
					let lineNumber: number = 0;
					let columnNumber: number = 0;
					// match line and column
					const lineAndColumnMatch = urlMatch.match(/(?<=:)(\d+:\d+)/gm);

					if (lineAndColumnMatch) {
						const lineAndColumn = lineAndColumnMatch[0].split(':');

						lineNumber = Number(lineAndColumn[0]);
						columnNumber = Number(lineAndColumn[1]);
					}

					// match js(x)/ts(x) file extension
					const cleanUrlMatch = urlMatch.match(/.*(.jsx|.js|.tsx|.ts)/gm);

					if (cleanUrlMatch) {
						cleanUrl = cleanUrlMatch[0];
					}

					matches.push({
						url: urlMatch,
						cleanUrl: cleanUrl,
						line: line,
						lineNumber: lineNumber,
						columnNumber: columnNumber
					});
				}
			});

			if (!lineHasMatch) {
				matches.push(line);
			}
		});

		return matches;
	}

	return null;
};

const modifyErrorStack = (mappedSourceFiles: Array<ExtendedMappedPosition | string>) => {
	let stack = '';

	mappedSourceFiles.forEach((mappedSourceFile) => {
		if (isString(mappedSourceFile)) {
			stack += mappedSourceFile;
		} else {
			// check if current stack line is about our code or something from an npm package
			// a.k.a node_modules (note: this check might not be 100% accurate)
			if (
				mappedSourceFile.stack.line.includes('/node_modules/') ||
				mappedSourceFile.source.includes('/node_modules/')
			) {
				// if a node_modules package, leave stack line as it is
				stack += mappedSourceFile.stack.line;
			} else {
				if (isDevelopment()) {
					// append original file line and column to the original stack line (this way we
					// preserve original browser dev console functionality to properly link stack
					// line to a file, plus we show at which original file line and column is the
					// stack line pointing to)
					stack +=
						mappedSourceFile.stack.line +
						` [${mappedSourceFile.line}:${mappedSourceFile.column}]`;
				} else {
					// - show original source file (URL) including its line and column (note: the URL
					//   might be relative)
					// - note: whitespace before "at" is manually added, maybe it would be better to
					//   use a regex (e.g. /^\s*/) to catch it before this line and use it here)
					stack += `    at ${mappedSourceFile.source} [${mappedSourceFile.line}:${mappedSourceFile.column}]`;
				}
			}
		}

		stack += '\n';
	});

	return stack;
};

const logError = (firstLine: string, secondLine: string) => {
	console.error(`${firstLine} \n${secondLine}`);
};

type ProcessErrorBeforeLogAndDisplayParameters = {
	title: string;
	description?: string;
	stack?: string;
	shouldLogError?: boolean;
};

export const processErrorBeforeLogAndDisplay = async (
	parameters: ProcessErrorBeforeLogAndDisplayParameters
) => {
	const { title, stack, shouldLogError = true } = parameters;
	let description = parameters.description ? 'Description: ' + parameters.description : '';

	let mappedStackSourceFiles;

	if (stack) {
		mappedStackSourceFiles = await mapSourceFile(stack);

		if (mappedStackSourceFiles) {
			if (description) {
				description += '\n';
			}

			description += modifyErrorStack(mappedStackSourceFiles);
		}
	}

	if (shouldLogError) {
		logError(title, stack || description || '');
	}

	addNotification({
		type: 'critical',
		title: title,
		description: description,
		isClosable: true,
		autoCloseAfterMilliseconds: 0
	});
};

export const processReactError = (
	title: string,
	error: unknown,
	errorInfo:
		| {
				componentStack?: string | undefined;
				errorBoundary?: Component<unknown> | undefined;
		  }
		| ErrorInfo
) => {
	const description = error instanceof Error ? error.message : '';
	const stack = error instanceof Error ? error.stack : errorInfo.componentStack;

	processErrorBeforeLogAndDisplay({
		title: title,
		stack: stack,
		description: description
	});
};

export const processAxiosErrorResponse = (error: AxiosError) => {
	const data = error.response?.data;
	let description = error.message;

	if (data && isObject(data)) {
		if ('errors' in data && isObject(data.errors) && 'json' in data.errors) {
			if ('status' in data && isString(data.status)) {
				description += `\nReason: ${data.status}`;
			}

			description += `\nError message: ${JSON.stringify(data.errors.json)}`;
		} else if ('message' in data && isString(data.message)) {
			description += `\nError message: ${data.message}`;
		}
	} else {
		description = error.message;
	}

	description += `\nResponse URL: ${window.decodeURIComponent(error.request.responseURL)}`;

	return description;
};
