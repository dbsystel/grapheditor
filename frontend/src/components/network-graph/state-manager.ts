import {
	CameraState,
	MouseCoords,
	SigmaEdgeEventPayload,
	SigmaNodeEventPayload,
	SigmaStageEventPayload,
	WheelCoords
} from 'sigma/types';
import { NodeId } from 'src/models/node';
import { ITEM_OVERVIEW_MOUSE_ENTER_TIMEOUT_MILLISECONDS } from 'src/utils/constants';
import { isFunction, isFunctionWithoutParameters, isObject } from 'src/utils/helpers/general';
import {
	isAltKeyPressed,
	isControlKeyPressed,
	isShiftKeyPressed
} from 'src/utils/keyboard-observer';
import { GraphEditorSigma } from './NetworkGraph.interfaces';

type StateManagerStateKeys = keyof typeof StateManagerStates;
type StateManagerStateValues = (typeof StateManagerStates)[StateManagerStateKeys];

type PayloadType<T extends StateManagerStateValues> = T extends
	| 'nodeDown'
	| 'nodeEnter'
	| 'nodeLeave'
	| 'nodeClick'
	| 'nodeTooltip'
	| 'nodeContextMenu'
	? SigmaNodeEventPayload
	: T extends
				| 'relationEnter'
				| 'relationLeave'
				| 'relationClick'
				| 'relationTooltip'
				| 'relationContextMenu'
		? SigmaEdgeEventPayload
		: T extends 'nodeSelection' | 'nodeAutoConnect' | 'mouseUp'
			? MouseCoords
			: T extends 'nodeDrag'
				? MouseCoords & { nodeId: NodeId }
				: T extends 'nodeQuick' | 'stageContextMenu'
					? SigmaStageEventPayload
					: T extends 'cameraUpdate'
						? CameraState
						: T extends 'scaleLabels' | 'scaleNodes' | 'zoomFactor'
							? WheelCoords
							: void;

const StateManagerStates = Object.freeze({
	// initial/starting state
	IDLE: 'idle',
	// stage state
	STAGE_DOWN: 'stageDown',
	// node state
	NODE_DOWN: 'nodeDown',
	NODE_TOOLTIP: 'nodeTooltip',
	NODE_ENTER: 'nodeEnter',
	NODE_LEAVE: 'nodeLeave',
	NODE_DRAG: 'nodeDrag',
	NODE_SELECTION: 'nodeSelection',
	NODE_CLICK: 'nodeClick',
	NODE_QUICK: 'nodeQuick',
	NODE_AUTO_CONNECT: 'nodeAutoConnect',
	NODE_CONTEXT_MENU: 'nodeContextMenu',
	// relation state
	RELATION_ENTER: 'relationEnter',
	RELATION_LEAVE: 'relationLeave',
	RELATION_CLICK: 'relationClick',
	RELATION_TOOLTIP: 'relationTooltip',
	RELATION_CONTEXT_MENU: 'relationContextMenu',
	// misc state
	MOUSE_UP: 'mouseUp',
	RESIZE: 'resize',
	CAMERA_UPDATE: 'cameraUpdate',
	// canvas (stage) state
	STAGE_CONTEXT_MENU: 'stageContextMenu',
	SCALE_LABELS: 'scaleLabels',
	SCALE_NODES: 'scaleNodes',
	ZOOM_FACTOR: 'zoomFactor'
});

type StateManagerState<StateKey extends StateManagerStateValues> = {
	transitionTo: Array<StateManagerStateValues>;
	callbacks: Array<StateManagerInternalCallback<StateKey>>;
	// allow direct state callbacks execution without any (state) checks
	isDirectCallbackExecutionAllowed?: boolean;
};

type StateManagerCallback<StateKey extends StateManagerStateValues> = {
	// executed only once, right before the callback
	beforeCallback?: PayloadType<StateKey> extends void
		? () => void
		: (event: PayloadType<StateKey>) => void;
	// the callback itself
	callback: PayloadType<StateKey> extends void
		? () => void
		: (event: PayloadType<StateKey>) => void;
	// executed only once, right before switching to a new state
	afterCallback?: () => void;
};

type StateManagerInternalCallback<StateKey extends StateManagerStateValues> =
	StateManagerCallback<StateKey> & {
		beforeCallbackExecuted: boolean;
		afterCallbackExecuted: boolean;
	};

/**
 * Singleton class for managing Sigma events in combination with Finite State
 * Machine pattern.
 * Its main role is to prevent different functionalities (such as drag and selection)
 * from being triggered parallely.
 * This class should be considered a central point when dealing with Sigma events.
 *
 * Resetting the manager to its initial state usually happens on mouseup, but
 * unfortunately there are exceptions where this needs to be done at some other
 * event or even manually done like with NODE_CONTEXT_MENU since we don't know
 * when is the user done with the context menu. We could provide a callback or
 * similar to observe context menu open/close state change, but we don't want to
 * bring in dependencies.
 */
export class StateManager {
	currentState: StateManagerStateValues;
	sigma: GraphEditorSigma | null;
	state: { [StateKey in StateManagerStateValues]: StateManagerState<StateKey> };
	private lastRelationEvent: SigmaEdgeEventPayload | null;
	private enterNodeTimeout: number;
	private enterRelationTimeout: number;
	// allow only one central StateManager instance to prevent issues with multiple event listeners and state desynchronization
	static _instance: StateManager;

	constructor(parameters?: { sigma?: GraphEditorSigma }) {
		this.sigma = parameters?.sigma || null;
		this.currentState = StateManagerStates.IDLE;
		this.lastRelationEvent = null;
		this.enterNodeTimeout = 0;
		this.enterRelationTimeout = 0;
		this.state = {
			// initial/starting state
			idle: {
				callbacks: [],
				transitionTo: [
					StateManagerStates.NODE_ENTER,
					// allow node events after node already entered (e.g. already
					// clicked on node, and you want to click again)
					StateManagerStates.NODE_DOWN,
					StateManagerStates.RELATION_ENTER,
					StateManagerStates.STAGE_DOWN,
					StateManagerStates.SCALE_LABELS,
					StateManagerStates.SCALE_NODES,
					StateManagerStates.ZOOM_FACTOR,
					// allow node context menu after e.g. node drag
					StateManagerStates.NODE_CONTEXT_MENU,
					StateManagerStates.STAGE_CONTEXT_MENU,
					StateManagerStates.RELATION_CONTEXT_MENU
				]
			},
			// stage state
			stageDown: {
				callbacks: [],
				transitionTo: [
					StateManagerStates.NODE_SELECTION,
					StateManagerStates.NODE_QUICK,
					StateManagerStates.IDLE
				]
			},
			stageContextMenu: {
				callbacks: [],
				transitionTo: [StateManagerStates.IDLE]
			},
			// node state
			nodeDown: {
				callbacks: [],
				transitionTo: [
					StateManagerStates.NODE_DRAG,
					StateManagerStates.NODE_AUTO_CONNECT,
					StateManagerStates.NODE_CLICK,
					StateManagerStates.NODE_CONTEXT_MENU
				]
			},
			nodeEnter: {
				callbacks: [],
				transitionTo: [
					StateManagerStates.NODE_DOWN,
					StateManagerStates.NODE_LEAVE,
					StateManagerStates.NODE_TOOLTIP,
					StateManagerStates.NODE_CONTEXT_MENU
				]
			},
			nodeQuick: {
				callbacks: [],
				transitionTo: [StateManagerStates.IDLE]
			},
			nodeAutoConnect: {
				callbacks: [],
				transitionTo: [StateManagerStates.IDLE]
			},
			nodeLeave: {
				callbacks: [],
				transitionTo: [
					StateManagerStates.IDLE,
					StateManagerStates.NODE_ENTER,
					StateManagerStates.RELATION_ENTER
				]
			},
			nodeDrag: {
				callbacks: [],
				transitionTo: [StateManagerStates.IDLE]
			},
			nodeClick: {
				callbacks: [],
				transitionTo: [StateManagerStates.NODE_LEAVE, StateManagerStates.NODE_CONTEXT_MENU]
			},
			nodeSelection: {
				callbacks: [],
				transitionTo: [StateManagerStates.IDLE]
			},
			nodeContextMenu: {
				callbacks: [],
				transitionTo: [StateManagerStates.IDLE]
			},
			nodeTooltip: {
				callbacks: [],
				transitionTo: [
					StateManagerStates.NODE_DOWN,
					StateManagerStates.NODE_LEAVE,
					StateManagerStates.NODE_CONTEXT_MENU
				]
			},
			// relation state
			relationEnter: {
				callbacks: [],
				transitionTo: [
					StateManagerStates.RELATION_LEAVE,
					StateManagerStates.RELATION_CLICK,
					StateManagerStates.RELATION_TOOLTIP,
					StateManagerStates.RELATION_CONTEXT_MENU
				]
			},
			relationLeave: {
				callbacks: [],
				transitionTo: [
					StateManagerStates.IDLE,
					StateManagerStates.NODE_ENTER,
					// ideally, we wouldn't need "NODE_DOWN" here, but sigma sometimes
					// doesn't register its "enterNode" event when leaving an edge
					// at close position to node and everything happens fast
					StateManagerStates.NODE_DOWN,
					StateManagerStates.RELATION_ENTER
				]
			},
			relationClick: {
				callbacks: [],
				transitionTo: [
					StateManagerStates.RELATION_LEAVE,
					StateManagerStates.RELATION_CONTEXT_MENU
				]
			},
			relationContextMenu: {
				callbacks: [],
				transitionTo: [StateManagerStates.IDLE]
			},
			relationTooltip: {
				callbacks: [],
				transitionTo: [StateManagerStates.RELATION_CLICK, StateManagerStates.RELATION_LEAVE]
			},
			// misc state
			mouseUp: {
				transitionTo: [],
				isDirectCallbackExecutionAllowed: true,
				callbacks: []
			},
			resize: {
				transitionTo: [],
				isDirectCallbackExecutionAllowed: true,
				callbacks: []
			},
			cameraUpdate: {
				transitionTo: [],
				isDirectCallbackExecutionAllowed: true,
				callbacks: []
			},
			scaleLabels: {
				callbacks: [],
				transitionTo: [StateManagerStates.IDLE]
			},
			scaleNodes: {
				callbacks: [],
				transitionTo: [StateManagerStates.IDLE]
			},
			zoomFactor: {
				callbacks: [],
				transitionTo: [StateManagerStates.IDLE]
			}
		};

		this.initializeEvents();
	}

	static getInstance() {
		if (!StateManager._instance) {
			StateManager._instance = new StateManager();
		}

		return StateManager._instance;
	}

	setSigma(sigma: GraphEditorSigma) {
		if (this.sigma !== sigma) {
			this.sigma = sigma;
			this.initializeEvents();
		}
	}

	disableSigmaContainerContextMenu(event: MouseEvent) {
		event.preventDefault();
	}

	initializeEvents() {
		if (!this.sigma) {
			return;
		}

		let nodeId = '';

		// quick-fix for macOS mapping Ctrl + left-click to be right-click
		this.sigma
			.getContainer()
			.addEventListener('contextmenu', this.disableSigmaContainerContextMenu);

		this.sigma.addListener('downNode', (event) => {
			// possible right mouse button
			if ('buttons' in event.event.original && event.event.original.buttons === 2) {
				return;
			}

			nodeId = event.node;

			this.transitionTo(StateManagerStates.NODE_DOWN);
			this.executeStateCallbacks(StateManagerStates.NODE_DOWN, event);

			if (event.event.original.ctrlKey) {
				this.transitionTo(StateManagerStates.NODE_AUTO_CONNECT);
			}
		});

		this.sigma.addListener('enterNode', (event) => {
			/**
			 * Fix sigma.js first triggering enterNode and then edgeLeave
			 * (instead of the other way around) when leaving a relation. Important
			 * because our state manager flow is unidirectional.
			 * Without this fix we would need to enable next transitions
			 * "node enter -> relation leave -> node enter" when leaving a relation
			 * instead of "relation leave -> node enter".
			 */
			if (this.currentState === StateManagerStates.RELATION_ENTER) {
				if (this.lastRelationEvent) {
					this.transitionTo(StateManagerStates.RELATION_LEAVE);
					this.executeStateCallbacks(
						StateManagerStates.RELATION_LEAVE,
						this.lastRelationEvent
					);
				}
			}

			this.transitionTo(StateManagerStates.NODE_ENTER);
			this.executeStateCallbacks(StateManagerStates.NODE_ENTER, event);

			this.enterNodeTimeout = window.setTimeout(() => {
				this.transitionTo(StateManagerStates.NODE_TOOLTIP);
				this.executeStateCallbacks(StateManagerStates.NODE_TOOLTIP, event);
			}, ITEM_OVERVIEW_MOUSE_ENTER_TIMEOUT_MILLISECONDS);
		});

		this.sigma.addListener('rightClickNode', (event) => {
			this.transitionTo(StateManagerStates.NODE_CONTEXT_MENU);
			this.executeStateCallbacks(StateManagerStates.NODE_CONTEXT_MENU, event);
		});

		this.sigma.addListener('leaveNode', (event) => {
			window.clearTimeout(this.enterNodeTimeout);

			this.transitionTo(StateManagerStates.NODE_LEAVE);
			this.executeStateCallbacks(StateManagerStates.NODE_LEAVE, event);

			// manually reset the state, otherwise the manager will hang in the
			// NODE_LEAVE state
			if (this.currentState === StateManagerStates.NODE_LEAVE) {
				this.resetState();
			}
		});

		this.sigma.addListener('clickNode', (event) => {
			this.transitionTo(StateManagerStates.NODE_CLICK);
			this.executeStateCallbacks(StateManagerStates.NODE_CLICK, event);
		});

		this.sigma.addListener('enterEdge', (event) => {
			this.lastRelationEvent = event;
			this.transitionTo(StateManagerStates.RELATION_ENTER);
			this.executeStateCallbacks(StateManagerStates.RELATION_ENTER, event);

			this.enterRelationTimeout = window.setTimeout(() => {
				this.transitionTo(StateManagerStates.RELATION_TOOLTIP);
				this.executeStateCallbacks(StateManagerStates.RELATION_TOOLTIP, event);
			}, ITEM_OVERVIEW_MOUSE_ENTER_TIMEOUT_MILLISECONDS);
		});

		this.sigma.addListener('leaveEdge', (event) => {
			window.clearTimeout(this.enterRelationTimeout);

			this.transitionTo(StateManagerStates.RELATION_LEAVE);
			this.executeStateCallbacks(StateManagerStates.RELATION_LEAVE, event);

			// manually reset the state, otherwise the manager will hang in the
			// RELATION_LEAVE state
			if (this.currentState === StateManagerStates.RELATION_LEAVE) {
				this.resetState();
			}
		});

		this.sigma.addListener('clickEdge', (event) => {
			this.transitionTo(StateManagerStates.RELATION_CLICK);
			this.executeStateCallbacks(StateManagerStates.RELATION_CLICK, event);
		});

		this.sigma.addListener('rightClickEdge', (event) => {
			this.transitionTo(StateManagerStates.RELATION_CONTEXT_MENU);
			this.executeStateCallbacks(StateManagerStates.RELATION_CONTEXT_MENU, event);
		});

		this.sigma.addListener('downStage', (event) => {
			// possible right mouse button
			if ('buttons' in event.event.original && event.event.original.buttons === 2) {
				return;
			}

			this.transitionTo(StateManagerStates.STAGE_DOWN);

			if (event.event.original.shiftKey) {
				this.transitionTo(StateManagerStates.NODE_SELECTION);
			} else if (event.event.original.ctrlKey) {
				this.transitionTo(StateManagerStates.NODE_QUICK);
			}
		});

		this.sigma.addListener('upStage', (event) => {
			this.executeStateCallbacks(StateManagerStates.NODE_QUICK, event);
		});

		this.sigma.addListener('rightClickStage', (event) => {
			this.transitionTo(StateManagerStates.STAGE_CONTEXT_MENU);
			this.executeStateCallbacks(StateManagerStates.STAGE_CONTEXT_MENU, event);
		});

		// here we should execute the callbacks only, checks should be done in downNode event
		this.sigma.getMouseCaptor().addListener('mousemovebody', (event) => {
			/**
			 * If mouse down on node and mouse moved - switch to node drag
			 * (this can be approved by either splitting functionality into
			 * different modes (edit/move and similar) or assigning node drag
			 * to mouse down + shift key for example).
			 * For now, leaving the drag node key combination as it was to
			 * reduce confusion by users.
			 */
			if (this.currentState === StateManagerStates.NODE_DOWN) {
				this.transitionTo(StateManagerStates.NODE_DRAG);
			}

			if (this.currentState === StateManagerStates.RELATION_ENTER) {
				if (this.lastRelationEvent) {
					this.lastRelationEvent.event = {
						...this.lastRelationEvent.event,
						x: event.x,
						y: event.y
					};
				}
			}

			this.executeStateCallbacks(StateManagerStates.NODE_SELECTION, event);
			this.executeStateCallbacks(StateManagerStates.NODE_AUTO_CONNECT, event);
			this.executeStateCallbacks(StateManagerStates.NODE_DRAG, { ...event, nodeId: nodeId });
		});

		this.sigma.getMouseCaptor().addListener('mouseup', (event) => {
			this.executeStateCallbacks(StateManagerStates.MOUSE_UP, event);

			if (
				this.currentState === StateManagerStates.NODE_DRAG ||
				this.currentState === StateManagerStates.NODE_SELECTION ||
				this.currentState === StateManagerStates.NODE_AUTO_CONNECT ||
				this.currentState === StateManagerStates.STAGE_DOWN ||
				this.currentState === StateManagerStates.NODE_QUICK
			) {
				this.resetState();
			}
		});

		this.sigma.addListener('resize', () => {
			this.executeStateCallbacks(StateManagerStates.RESIZE);
		});

		this.sigma.getCamera().addListener('updated', (state) => {
			this.executeStateCallbacks(StateManagerStates.CAMERA_UPDATE, state);
		});

		this.sigma.getMouseCaptor().addListener('wheel', (event: WheelCoords) => {
			const controlKeyPressed = isControlKeyPressed();
			const shiftKeyPressed = isShiftKeyPressed();
			const altKeyPressed = isAltKeyPressed();

			// return if no state-manager specific state should be triggered
			if (!controlKeyPressed && !shiftKeyPressed && !altKeyPressed) {
				return;
			}

			if (event.delta !== 0) {
				if (controlKeyPressed) {
					this.transitionTo(StateManagerStates.ZOOM_FACTOR);
					this.executeStateCallbacks(StateManagerStates.ZOOM_FACTOR, event);
				} else if (shiftKeyPressed) {
					this.transitionTo(StateManagerStates.SCALE_LABELS);
					this.executeStateCallbacks(StateManagerStates.SCALE_LABELS, event);
				} else if (altKeyPressed) {
					this.transitionTo(StateManagerStates.SCALE_NODES);
					this.executeStateCallbacks(StateManagerStates.SCALE_NODES, event);
				}
			}
		});
	}

	resetState() {
		Object.values(this.state).forEach((state) => {
			if ('callbacks' in state) {
				state.callbacks.forEach((internalCallback) => {
					internalCallback.beforeCallbackExecuted = false;
					internalCallback.afterCallbackExecuted = false;
				});
			}
		});

		this.transitionTo(StateManagerStates.IDLE);
	}

	getSelectedState() {
		return this.state[this.currentState];
	}

	transitionTo(newState: StateManagerStateValues) {
		const state = this.getSelectedState();

		if (state.transitionTo.includes(newState)) {
			state.callbacks.forEach((callback) => {
				if (callback.afterCallback && !callback.afterCallbackExecuted) {
					callback.afterCallbackExecuted = true;
					callback.afterCallback();
				}
			});

			this.currentState = newState;
		}
	}

	executeStateCallbacks<T extends StateManagerStateValues>(
		currentState: T,
		event?: PayloadType<T>
	) {
		const newState = this.state[currentState];

		if ('isDirectCallbackExecutionAllowed' in newState) {
			executeCallbacks(newState, event);
		} else if (this.currentState === currentState) {
			const state = this.getSelectedState();

			executeCallbacks<typeof this.currentState>(state, event);
		}

		function executeCallbacks<StateKey extends StateManagerStateValues>(
			state: StateManagerState<StateKey>,
			event?: PayloadType<StateKey>
		) {
			state.callbacks.forEach((internalCallback) => {
				if (!internalCallback.beforeCallbackExecuted && internalCallback.beforeCallback) {
					internalCallback.beforeCallbackExecuted = true;

					const internalBeforeCallback = internalCallback.beforeCallback;

					if (event) {
						internalBeforeCallback(event);
					} else if (isFunctionWithoutParameters(internalCallback.beforeCallback)) {
						internalCallback.beforeCallback();
					}
				}

				if (internalCallback.callback) {
					if (event) {
						internalCallback.callback(event);
					} else if (isFunctionWithoutParameters(internalCallback.callback)) {
						internalCallback.callback();
					}
				}
			});
		}
	}

	subscribe<I extends StateManagerStateValues>(
		event: I,
		callback:
			| StateManagerCallback<I>
			| (PayloadType<I> extends void ? () => void : (event: PayloadType<I>) => void)
	) {
		const state = this.state[event];

		const internalCallback: StateManagerInternalCallback<I> = {
			beforeCallbackExecuted: false,
			afterCallbackExecuted: false,
			callback: () => {}
		};

		const callbackFunction = isFunction(callback) ? callback : callback.callback;

		if (isObject(callback) && 'callback' in callback) {
			internalCallback.callback = callbackFunction;
			internalCallback.beforeCallback = callback.beforeCallback;
			internalCallback.afterCallback = callback.afterCallback;
		} else if (isFunction(callback)) {
			internalCallback.callback = callbackFunction;
		}

		state.callbacks.push(internalCallback);

		return () => this.unsubscribe(event, callbackFunction);
	}

	unsubscribe<I>(event: StateManagerStateValues, callback: (event: I) => void) {
		const state = this.state[event];

		const callbackIndex = state.callbacks.findIndex(
			(eventCallback) => eventCallback.callback === callback
		);

		if (callbackIndex > -1) {
			state.callbacks.splice(callbackIndex, 1);
		}
	}
}

export type NodeDragEvent = MouseCoords & { nodeId: NodeId };

(window as any).StateManager = StateManager;
