import { DependencyList, useEffect, useRef } from 'react';

type UseOutsideClickProps = {
	callback: () => void;
	useEventCapture?: boolean;
	eventTriggerDelayMilliseconds?: number;
};

export const useOutsideClick = <T extends HTMLElement | null>(
	props: UseOutsideClickProps,
	deps?: DependencyList
) => {
	const ref = useRef<T | null>(null);
	const timeoutId = useRef<number | undefined>(undefined);

	useEffect(() => {
		/**
		 * @see https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener#usecapture
		 */
		const useEventCapture = props.useEventCapture === undefined ? true : props.useEventCapture;

		const handleClickOutside = (event: MouseEvent) => {
			const target = event.target as Node;

			if (
				// if the reference element (the element we observe if the user
				// clicked outside of it) exist
				ref.current &&
				// if the target element (the element we currently clicked on)
				// exist (can be temporarily removed, e.g. we are switching from
				// one component to another)
				document.body.contains(target) &&
				// check if the reference element contains the target element
				!ref.current.contains(target)
			) {
				props.callback();
			}
		};

		// ideally, we will never need to delay event trigger, but some edge-cases
		// will require this approach
		if (props.eventTriggerDelayMilliseconds !== undefined) {
			timeoutId.current = window.setTimeout(() => {
				document.addEventListener('click', handleClickOutside, useEventCapture);
			}, props.eventTriggerDelayMilliseconds);
		} else {
			document.addEventListener('click', handleClickOutside, useEventCapture);
		}

		return () => {
			window.clearTimeout(timeoutId.current);
			document.removeEventListener('click', handleClickOutside, useEventCapture);
		};
	}, deps);

	return ref;
};
