import { isAxiosError } from 'axios';
import { Component } from 'react';
import { ErrorInfo } from 'react-dom/client';
import {
	processAxiosErrorResponse,
	processErrorBeforeLogAndDisplay,
	processReactError
} from 'src/utils/errors/helpers';
import { parseError } from 'src/utils/helpers/general';

export const onCaughtError = async (
	error: unknown,
	errorInfo: {
		componentStack?: string | undefined;
		errorBoundary?: Component<unknown> | undefined;
	}
) => {
	processReactError(`Caught Error: ${parseError(error)}`, error, errorInfo);
};

export const onUncaughtError = async (error: unknown, errorInfo: ErrorInfo) => {
	processReactError(`Uncaught Error: ${parseError(error)}`, error, errorInfo);
};

export const onRecoverableError = async (error: unknown, errorInfo: ErrorInfo) => {
	processReactError(`Recoverable Error: ${parseError(error)}`, error, errorInfo);
};

export const onWindowError = async (event: ErrorEvent) => {
	const { message, error } = event;

	processErrorBeforeLogAndDisplay({
		title: `Window ${message}`,
		stack: error?.stack,
		shouldLogError: false
	});
};

export function onWindowUnhandledRejection(event: PromiseRejectionEvent) {
	const reason = event.reason;
	const isReasonAxiosError = isAxiosError(reason);
	const stack = reason.stack;
	let description = reason.message;

	if (isReasonAxiosError) {
		description = processAxiosErrorResponse(reason);
	}

	if (reason instanceof Error) {
		processErrorBeforeLogAndDisplay({
			title: `Window Unhandled ${reason.name}`,
			description: description,
			stack: stack,
			shouldLogError: false
		});
	} else {
		processErrorBeforeLogAndDisplay({
			title: 'Window Unhandled Promise Rejection',
			description: `Reason: ${reason}
    at: stack not available, please check the console`,
			shouldLogError: false
		});
	}
}
