import { Placement } from '@floating-ui/react';
import { Item } from 'src/models/item';
import {
	ITEM_OVERVIEW_MOUSE_ENTER_TIMEOUT_MILLISECONDS,
	ITEM_OVERVIEW_MOUSE_LEAVE_TIMEOUT_MILLISECONDS,
	ITEM_OVERVIEW_OFFSET
} from 'src/utils/constants';
import { getDeepestHoveredElement } from 'src/utils/helpers/general';
import { create } from 'zustand';

type Overview = {
	triggerElement: HTMLElement;
	popoverElement?: HTMLElement;
	popoverOffset: number;
	popoverPlacement?: Placement;
	isMouseInsidePopover?: boolean;
	item: Item;
};

type OverviewTimeout = {
	id: number;
};

type ElementListeners = {
	// optional since event listeners won't be added at the same time at the same place
	mouseenter?: (event: MouseEvent) => void;
	mouseleave?: (event: MouseEvent) => void;
};

type ItemOverviewPopoverStore = {
	reset: () => void;
	registerOverview: (options: {
		triggerElement: HTMLElement;
		item: Item;
		popoverOffset?: number;
		popoverPlacement?: Placement;
	}) => void;
	registerTriggerElement: (options: {
		triggerElement: HTMLElement;
		item: Item;
		popoverOffset?: number;
		popoverPlacement?: Placement;
		ignoreOverviewRegistration?: boolean;
	}) => void;
	unregisterTriggerElement: (triggerElement: HTMLElement) => void;
	registerTriggerElementMouseEnterEvent: (options: {
		triggerElement: HTMLElement;
		timeout: OverviewTimeout;
		item: Item;
		popoverOffset?: number;
		popoverPlacement?: Placement;
		ignoreOverviewRegistration?: boolean;
	}) => void;
	registerTriggerElementMouseLeaveEvent: (
		triggerElement: HTMLElement,
		timeout: OverviewTimeout
	) => void;
	registerPopoverElement: (popoverElement: HTMLElement) => void;
	unregisterPopoverElement: (popoverElement: HTMLElement) => void;
	getOverviewIndexByElement: (elementType: 'trigger' | 'popover', element: HTMLElement) => number;
	isElementTriggerElement: (element: HTMLElement) => boolean;
	getContainingPopoverElement: (element: HTMLElement) => HTMLElement | null;
	getCurrentlyHoveredOverview: () => Overview | undefined;
	overviews: Array<Overview>;
	initializeMouseEnterTimeout: (callback: () => void) => number;
	initializeMouseLeaveTimeout: (callback: () => void) => number;
	elementListeners: WeakMap<HTMLElement, ElementListeners>;
};

type InitialState = Omit<
	ItemOverviewPopoverStore,
	| 'registerOverview'
	| 'registerTriggerElement'
	| 'unregisterTriggerElement'
	| 'registerTriggerElementMouseEnterEvent'
	| 'registerTriggerElementMouseLeaveEvent'
	| 'registerPopoverElement'
	| 'unregisterPopoverElement'
	| 'getOverviewIndexByElement'
	| 'isElementTriggerElement'
	| 'getCurrentlyHoveredOverview'
	| 'getContainingPopoverElement'
	| 'initializeMouseEnterTimeout'
	| 'initializeMouseLeaveTimeout'
	| 'reset'
>;

const getInitialState: () => InitialState = () => {
	return {
		overviews: [],
		elementListeners: new WeakMap()
	};
};

// camelCase dataset keys must match the data attribute in the DOM elements, but with kebab-case, so data-item-overview-trigger
// in the DOM corresponds to itemOverviewTrigger in the dataset
const triggerElementDatasetId = 'itemOverviewTrigger';
const popoverElementDatasetId = 'itemOverviewPopover';
const popoverElementDatasetSelector = '[data-item-overview-popover]';

/**
 * ItemOverviewPopover store.
 */
export const useItemOverviewPopoverStore = create<ItemOverviewPopoverStore>((set, get) => ({
	...getInitialState(),
	initializeMouseEnterTimeout: (callback) => {
		return window.setTimeout(callback, ITEM_OVERVIEW_MOUSE_ENTER_TIMEOUT_MILLISECONDS);
	},
	initializeMouseLeaveTimeout: (callback) => {
		return window.setTimeout(callback, ITEM_OVERVIEW_MOUSE_LEAVE_TIMEOUT_MILLISECONDS);
	},
	registerTriggerElement: ({
		triggerElement,
		item,
		popoverOffset,
		popoverPlacement,
		ignoreOverviewRegistration
	}) => {
		get().unregisterTriggerElement(triggerElement);

		const timeout = { id: -1 };

		triggerElement.dataset[triggerElementDatasetId] = '';

		get().registerTriggerElementMouseEnterEvent({
			triggerElement: triggerElement,
			timeout: timeout,
			item: item,
			popoverOffset: popoverOffset,
			popoverPlacement: popoverPlacement,
			ignoreOverviewRegistration: ignoreOverviewRegistration
		});
		get().registerTriggerElementMouseLeaveEvent(triggerElement, timeout);
	},
	unregisterTriggerElement: (triggerElement) => {
		const listeners = get().elementListeners.get(triggerElement);

		if (listeners?.mouseenter) {
			triggerElement.removeEventListener('mouseenter', listeners.mouseenter);
		}
		if (listeners?.mouseleave) {
			triggerElement.removeEventListener('mouseleave', listeners.mouseleave);
		}

		get().elementListeners.delete(triggerElement);
		delete triggerElement.dataset[triggerElementDatasetId];
	},
	registerTriggerElementMouseEnterEvent: ({
		triggerElement,
		timeout,
		item,
		popoverOffset,
		popoverPlacement,
		ignoreOverviewRegistration
	}) => {
		const handleMouseEnter = () => {
			const triggerElementIndex = get().getOverviewIndexByElement('trigger', triggerElement);

			// trigger element already registered, removing all overviews after the trigger element index
			if (triggerElementIndex > -1) {
				set({
					overviews: get().overviews.slice(0, triggerElementIndex + 1)
				});
				return;
			}

			// trigger element inside of a popover, removing all overviews after the popover index
			const triggerElementPopover = get().getContainingPopoverElement(triggerElement);
			if (triggerElementPopover && triggerElementPopover instanceof HTMLElement) {
				const popoverIndex = get().getOverviewIndexByElement(
					'popover',
					triggerElementPopover
				);

				if (popoverIndex > -1) {
					set({
						overviews: get().overviews.slice(0, popoverIndex + 1)
					});
				}
			}

			if (!ignoreOverviewRegistration) {
				timeout.id = get().initializeMouseEnterTimeout(() => {
					// if trigger element is not in the dom anymore, do not register overview (the mouseleave event will not
					// be triggered and the timeout will not be cleared, so we need to check if the element is still in the
					// dom before registering the overview)
					if (triggerElement.isConnected) {
						get().registerOverview({
							triggerElement: triggerElement,
							item: item,
							popoverOffset: popoverOffset,
							popoverPlacement: popoverPlacement
						});
					}
				});
			}
		};

		triggerElement.addEventListener('mouseenter', handleMouseEnter);

		get().elementListeners.set(triggerElement, {
			...get().elementListeners.get(triggerElement),
			mouseenter: handleMouseEnter
		});
	},
	registerTriggerElementMouseLeaveEvent: (triggerElement, timeout) => {
		const handleMouseLeave = () => {
			window.clearTimeout(timeout.id);

			get().initializeMouseLeaveTimeout(() => {
				const hoveredElement = getDeepestHoveredElement();

				if (hoveredElement instanceof HTMLElement) {
					const relatedTargetAsPopover =
						get().getContainingPopoverElement(hoveredElement);

					// hovered element outside of popovers, resetting store
					if (!relatedTargetAsPopover) {
						get().reset();
						return;
					}

					// if hovering another trigger element, do nothing
					if (get().isElementTriggerElement(hoveredElement)) {
						return;
					}

					const triggerElementIndex = get().getOverviewIndexByElement(
						'trigger',
						triggerElement
					);
					const popoverIndex = get().getOverviewIndexByElement(
						'popover',
						relatedTargetAsPopover
					);

					if (triggerElementIndex - 1 === popoverIndex) {
						// hover element inside of a popover, removing all overviews after the popover index
						set({
							overviews: get().overviews.slice(0, popoverIndex + 1)
						});
						return;
					}
				}
			});
		};

		triggerElement.addEventListener('mouseleave', handleMouseLeave);

		get().elementListeners.set(triggerElement, {
			...get().elementListeners.get(triggerElement),
			mouseleave: handleMouseLeave
		});
	},
	registerOverview: ({ triggerElement, item, popoverOffset, popoverPlacement }) => {
		const newOverviewOffset =
			popoverOffset === undefined ? ITEM_OVERVIEW_OFFSET : popoverOffset;

		const newOverview: Overview = {
			triggerElement: triggerElement,
			item: item,
			popoverOffset: newOverviewOffset,
			popoverPlacement: popoverPlacement
		};

		// if not inside of popover
		if (!get().getContainingPopoverElement(triggerElement)) {
			set({
				overviews: [newOverview]
			});
		} else {
			set({
				overviews: [...get().overviews, newOverview]
			});
		}
	},
	registerPopoverElement: (popoverElement) => {
		const lastOverview = get().overviews.at(get().overviews.length - 1);

		if (lastOverview && !lastOverview.popoverElement) {
			get().unregisterPopoverElement(popoverElement);

			popoverElement.dataset[popoverElementDatasetId] = '';
			lastOverview.popoverElement = popoverElement;

			const handleMouseEnter = () => {
				const overviewIndex = get().getOverviewIndexByElement('popover', popoverElement);

				if (overviewIndex > -1) {
					// mouseenter popover, setting isMouseInsidePopover to true for overview index
					get().overviews[overviewIndex].isMouseInsidePopover = true;
				}
			};

			const handleMouseLeave = (event: MouseEvent) => {
				const overviewIndex = get().getOverviewIndexByElement('popover', popoverElement);

				if (overviewIndex > -1) {
					// mouseenter popover, setting isMouseInsidePopover to false for overview index
					get().overviews[overviewIndex].isMouseInsidePopover = false;
				}

				window.setTimeout(() => {
					if (event.relatedTarget instanceof HTMLElement) {
						// if hovering another trigger element, do nothing
						if (get().isElementTriggerElement(event.relatedTarget)) {
							return;
						}

						const relatedTargetAsPopover = get().getContainingPopoverElement(
							event.relatedTarget
						);

						if (!relatedTargetAsPopover) {
							// onmouseleave popover outside of popover, resetting store
							get().reset();
							return;
						}

						// if hovering inside popover, do nothing
						if (relatedTargetAsPopover) {
							const leftPopoverIndex = get().getOverviewIndexByElement(
								'popover',
								popoverElement
							);
							const enteredPopoverIndex = get().getOverviewIndexByElement(
								'popover',
								relatedTargetAsPopover
							);
							if (leftPopoverIndex > enteredPopoverIndex) {
								// onmouseleave popover hovering inside popover, removing all overviews after the popover index
								set({
									overviews: get().overviews.slice(0, enteredPopoverIndex + 1)
								});
							}
						}
					}
				}, 100);
			};

			popoverElement.addEventListener('mouseenter', handleMouseEnter);
			popoverElement.addEventListener('mouseleave', handleMouseLeave);

			get().elementListeners.set(popoverElement, {
				mouseenter: handleMouseEnter,
				mouseleave: handleMouseLeave
			});
		}
	},
	unregisterPopoverElement: (popoverElement) => {
		const listeners = get().elementListeners.get(popoverElement);

		if (listeners?.mouseenter) {
			popoverElement.removeEventListener('mouseenter', listeners.mouseenter);
		}
		if (listeners?.mouseleave) {
			popoverElement.removeEventListener('mouseleave', listeners.mouseleave);
		}

		get().elementListeners.delete(popoverElement);
		delete popoverElement.dataset[popoverElementDatasetId];
	},
	getOverviewIndexByElement: (elementType, element) => {
		if (elementType === 'trigger') {
			return get().overviews.findIndex((overview) => overview.triggerElement === element);
		} else if (elementType === 'popover') {
			return get().overviews.findIndex((overview) => overview.popoverElement === element);
		} else {
			return -1;
		}
	},
	isElementTriggerElement: (element) => {
		return element.dataset[triggerElementDatasetId] !== undefined;
	},
	getContainingPopoverElement: (element) => {
		return element.closest(popoverElementDatasetSelector);
	},
	getCurrentlyHoveredOverview: () => {
		return get().overviews.find((overview) => overview.isMouseInsidePopover === true);
	},
	reset: () => {
		set(getInitialState());
	}
}));

(window as any).useItemOverviewPopoverStore = useItemOverviewPopoverStore;
