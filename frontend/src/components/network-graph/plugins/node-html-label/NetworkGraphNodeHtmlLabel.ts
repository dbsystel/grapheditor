import './NetworkGraphNodeHtmlLabel.scss';
import { getNodesInViewport } from '@sigma/utils';
import { useEffect, useRef } from 'react';
import Sigma from 'sigma';
import { SigmaNodeEventPayload, WheelCoords } from 'sigma/types';
import { StateManager } from 'src/components/network-graph/state-manager';
import { NodeId } from 'src/models/node';
import { useGraphStore } from 'src/stores/graph';
import {
	GRAPH_DEFAULT_NODE_LABEL_FONT,
	GRAPH_DEFAULT_NODE_LABEL_SIZE,
	GRAPH_DEFAULT_NODE_LABEL_WEIGHT,
	GRAPH_HIDE_LABEL_BOX_SPACING,
	GRAPH_RENDER_HTML_LABELS_THRESHOLD
} from 'src/utils/constants';
import { isNumber, isString } from 'src/utils/helpers/general';

const HTMLLabelContainerClassName = 'network-graph__node-label-container';
const HTMLLabelContainerHighlightedClassName = HTMLLabelContainerClassName + '--highlighted';
const HTMLLabelContainerHoverClassName = HTMLLabelContainerClassName + '--hover';

export const NetworkGraphNodeHtmlLabel = () => {
	const sigma = useGraphStore((store) => store.sigma);
	const nodeLabelsContainerRef = useRef<HTMLDivElement | null>(null);
	const nodeLabelsCacheRef = useRef<{
		[key: NodeId]: { element: HTMLDivElement | null; processed: boolean; label: string | null };
	}>({});
	const isModeActiveRef = useRef(false);
	const nodeIdToScrollRef = useRef('');
	// browser mouse movement can be faster than sigma.js updates, which leads to
	// sigma.js triggering the "leaveNode" event when browser mouse is outside
	// of the dragged node, and triggering the "enterNode" event when sigma.js
	// node catches up with browser mouse
	const isDraggingMoveActiveRef = useRef(false);

	useEffect(() => {
		createAndAppendHTMLNodeLabelsContainer();
		sigma.on('afterRender', onAfterRender);

		return () => {
			destroyEvents();
			resetNodeLabelsCache();
			removeNodeLabelsContainer();
			sigma.off('afterRender', createAndAppendHTMLNodeLabelsContainer);
			sigma.off('afterRender', onAfterRender);
		};
	}, []);

	const onAfterRender = () => {
		const visibleNodes = getNodesInViewport(useGraphStore.getState().sigma as unknown as Sigma);

		if (visibleNodes.length <= GRAPH_RENDER_HTML_LABELS_THRESHOLD) {
			if (!getIsHTMLLabelsModeActive()) {
				setIsHTMLLabelsModeActive(true);
				initializeEvents();
			}

			const nodeLabelsContainer = getNodeLabelsContainer();

			if (nodeLabelsContainer) {
				deProcessNodeLabelsCache();
				renderHtmlLabels(visibleNodes, nodeLabelsContainer);
				cleanupNotProcessedNodeLabelsCache();
			}
		} else if (getIsHTMLLabelsModeActive()) {
			destroyEvents();
			setIsHTMLLabelsModeActive(false);
			resetNodeLabelsCache();
		}
	};

	const initializeEvents = () => {
		StateManager.getInstance().on('NODE_DRAG', {
			beforeCallback: setDraggingModeActive,
			callback: onNodeDrag,
			afterCallback: setDraggingModeInactive
		});
		sigma.on('enterNode', onNodeEnter);
		sigma.on('leaveNode', onNodeLeave);
		sigma.getMouseCaptor().on('wheel', onScroll);
	};

	const destroyEvents = () => {
		StateManager.getInstance().off('NODE_DRAG', onNodeDrag);
		sigma.off('enterNode', onNodeEnter);
		sigma.off('leaveNode', onNodeLeave);
		sigma.getMouseCaptor().off('wheel', onScroll);
	};

	const getNodeLabelsContainer = () => {
		return nodeLabelsContainerRef.current;
	};

	const setNodeLabelsContainer = (container: HTMLDivElement) => {
		nodeLabelsContainerRef.current = container;
	};

	const removeNodeLabelsContainer = () => {
		nodeLabelsContainerRef.current?.remove();
	};

	const getIsHTMLLabelsModeActive = () => {
		return isModeActiveRef.current;
	};

	const setIsHTMLLabelsModeActive = (isActive: boolean) => {
		isModeActiveRef.current = isActive;
	};

	const getIsDraggingModeActive = () => {
		return isDraggingMoveActiveRef.current;
	};

	const setDraggingModeActive = () => {
		isDraggingMoveActiveRef.current = true;
	};

	const setDraggingModeInactive = () => {
		isDraggingMoveActiveRef.current = false;
	};

	const onNodeDrag = () => {};

	const onNodeEnter = (event: SigmaNodeEventPayload) => {
		if (getIsDraggingModeActive()) {
			return;
		}

		nodeIdToScrollRef.current = event.node;

		const element = getCacheEntryElement(event.node);

		if (element) {
			applyHoverStyle(element);
		}
	};

	const onNodeLeave = () => {
		if (getIsDraggingModeActive()) {
			return;
		}

		const element = getCacheEntryElement(nodeIdToScrollRef.current);

		if (element) {
			removeHoverStyle(element);
		}

		nodeIdToScrollRef.current = '';
	};

	const getCacheEntryElement = (nodeId: NodeId) => {
		const cacheEntry = nodeLabelsCacheRef.current[nodeId];

		if (cacheEntry && cacheEntry.element) {
			return cacheEntry.element;
		}

		return undefined;
	};

	const onScroll = (event: WheelCoords) => {
		const nodeIdToScroll = nodeIdToScrollRef.current;
		const cacheEntryElement = getCacheEntryElement(nodeIdToScroll);

		if (cacheEntryElement && cacheEntryElement.scrollHeight > cacheEntryElement.clientHeight) {
			sigma.getCamera().disable();

			// scroll the element by x pixels
			cacheEntryElement.scrollBy(0, -Math.sign(event.delta) * 20);

			window.setTimeout(() => {
				sigma.getCamera().enable();
			}, 0);
		}
	};

	const resetNodeLabelsCache = () => {
		Object.values(nodeLabelsCacheRef.current).forEach((value) => {
			value.element?.remove();
		});
		nodeLabelsCacheRef.current = {};
	};

	// mark all cache entries as not processed
	const deProcessNodeLabelsCache = () => {
		for (const [, value] of Object.entries(nodeLabelsCacheRef.current)) {
			value.processed = false;
		}
	};

	// remove non-processed cache entries and elements (maybe some element were
	// removed between graph re-renders)
	const cleanupNotProcessedNodeLabelsCache = () => {
		for (const [nodeId, value] of Object.entries(nodeLabelsCacheRef.current)) {
			if (!value.processed && value.element) {
				value.element.remove();
				delete nodeLabelsCacheRef.current[nodeId];
			}
		}
	};

	const createAndAppendHTMLNodeLabelsContainer = () => {
		const div = document.createElement('div');

		div.classList.add('network-graph__node-labels-container');
		// prevent font inherit from parent HTML element
		div.style.fontWeight = GRAPH_DEFAULT_NODE_LABEL_WEIGHT;
		div.style.fontSize = GRAPH_DEFAULT_NODE_LABEL_SIZE + 'px';
		div.style.fontFamily = GRAPH_DEFAULT_NODE_LABEL_FONT;

		setNodeLabelsContainer(div);

		sigma.getContainer().append(div);
	};

	const renderHtmlLabels = (nodeIds: Array<NodeId>, nodeLabelsContainer: HTMLDivElement) => {
		nodeIds.forEach((nodeId) => {
			renderHtmlLabel(nodeId, nodeLabelsContainer);
		});
	};

	const renderHtmlLabel = (nodeId: NodeId, container: HTMLDivElement) => {
		// TODO improve "getNodeDisplayData" TS definition
		// The "getNodeDisplayData" method returns more keys that defined by its
		// TS definition. This will be a bigger refactor because it will affect
		// many places in sigma.js.
		const nodeDisplayData = sigma.getNodeDisplayData(nodeId);

		if (nodeDisplayData && !nodeDisplayData.hidden) {
			let cacheEntry = nodeLabelsCacheRef.current[nodeId];
			// improve performance by applying multiple styles at once, instead of one by one
			const labelContainerStyles: Array<string> = [];

			if (!cacheEntry) {
				nodeLabelsCacheRef.current[nodeId] = {
					element: null,
					processed: false,
					label: ''
				};

				cacheEntry = nodeLabelsCacheRef.current[nodeId];
			}

			const coordinates = sigma.framedGraphToViewport({
				x: nodeDisplayData.x,
				y: nodeDisplayData.y
			});

			let labelContainer: HTMLDivElement | null = null;
			let borderSize = 0;
			const size = nodeDisplayData.size;

			if (cacheEntry.element) {
				labelContainer = cacheEntry.element;
			} else {
				labelContainer = document.createElement('div');
				labelContainer.classList.add(HTMLLabelContainerClassName);

				container.append(labelContainer);

				nodeLabelsCacheRef.current[nodeId].element = labelContainer;
			}

			// check if there was a label content change (e.g. new style)
			if (cacheEntry.label !== nodeDisplayData.label) {
				labelContainer.innerHTML = '';

				if (nodeDisplayData.label) {
					// label text lines
					const labelLines = document.createElement('div');
					labelLines.classList.add('network-graph__node-label');

					const ll = nodeDisplayData.label.split('\n');
					ll.forEach((line: string) => {
						const labelLine = document.createElement('div');
						labelLine.innerHTML = line;

						labelLines.append(labelLine);
					});

					labelContainer.append(labelLines);
				}

				cacheEntry.label = nodeDisplayData.label;
			}

			// properties we need to update on each sigma render (e.g. due to our
			// plugins, or camera movement, or style change, or...)
			labelContainerStyles.push('background-color:' + nodeDisplayData.color);
			labelContainerStyles.push('width:' + size * 2 + 'px');
			labelContainerStyles.push('height:' + size * 2 + 'px');
			labelContainerStyles.push('top:' + (coordinates.y - size) + 'px');
			labelContainerStyles.push('left:' + (coordinates.x - size) + 'px');
			labelContainerStyles.push(
				'font-size:' +
					// reverse labelSize scale on zoom-in/out but apply custom labelSize increase
					// (see the ScalePlugin)
					sigma.getSetting('labelSize') * sigma.getRenderParams().zoomRatio +
					'px'
			);
			labelContainerStyles.push('padding:' + GRAPH_HIDE_LABEL_BOX_SPACING.toString() + 'px');

			// TODO improve sigma.js TS support
			if ('labelColor' in nodeDisplayData && isString(nodeDisplayData.labelColor)) {
				labelContainerStyles.push('color:' + nodeDisplayData.labelColor);
			}
			// TODO improve sigma.js TS support
			if ('borderSize' in nodeDisplayData && isNumber(nodeDisplayData.borderSize)) {
				borderSize = nodeDisplayData.size * nodeDisplayData.borderSize;
			}
			// TODO improve sigma.js TS support
			if ('borderColor' in nodeDisplayData && isString(nodeDisplayData.borderColor)) {
				labelContainerStyles.push(
					'border:' + `${borderSize}px solid ${nodeDisplayData.borderColor}`
				);
			}

			if (useGraphStore.getState().isNodeHighlighted(nodeId)) {
				applyHighlightedStyle(labelContainer);
			} else {
				removeHighlightedStyle(labelContainer);
			}

			labelContainerStyles.push('scale:' + 1 / sigma.getRenderParams().zoomRatio);

			// use "+= ;" to replace existing named properties with any new values,
			// add new ones and leave the rest alone
			// https://stackoverflow.com/questions/3968593/how-can-i-set-multiple-css-styles-in-javascript#comment4245207_3968772
			labelContainer.style.cssText += ';' + labelContainerStyles.join(';');

			nodeLabelsCacheRef.current[nodeId].processed = true;
		}
	};

	const applyHighlightedStyle = (element: HTMLDivElement) => {
		element.classList.add(HTMLLabelContainerHighlightedClassName);
	};

	const removeHighlightedStyle = (element: HTMLDivElement) => {
		element.classList.remove(HTMLLabelContainerHighlightedClassName);
	};

	const applyHoverStyle = (element: HTMLDivElement) => {
		element.classList.add(HTMLLabelContainerHoverClassName);
	};

	const removeHoverStyle = (element: HTMLDivElement) => {
		element.classList.remove(HTMLLabelContainerHoverClassName);
	};

	return null;
};
