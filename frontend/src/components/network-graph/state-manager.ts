import {
	CameraState,
	MouseCoords,
	SigmaEdgeEventPayload,
	SigmaEventPayload,
	SigmaNodeEventPayload,
	SigmaStageEventPayload,
	WheelCoords
} from 'sigma/types';
import { getEdgeLabelAtPoint } from 'src/components/network-graph/helpers';
import { NodeId } from 'src/models/node';
import { ITEM_OVERVIEW_MOUSE_ENTER_TIMEOUT_MILLISECONDS } from 'src/utils/constants';
import { isFunction, isFunctionWithoutParameters, isObject } from 'src/utils/helpers/general';
import { areExactModifiersPressed, areNoModifiersPressed } from 'src/utils/keyboard-observer';
import { Logger } from 'src/utils/logger';
import { GraphEditorSigma } from './NetworkGraph.interfaces';

type StateManagerStateKeys = keyof typeof StateManagerStates;
type StateManagerStateValues = (typeof StateManagerStates)[StateManagerStateKeys];

type PayloadType<T extends StateManagerStateValues> = T extends
	| 'nodeDown'
	| 'nodeEnter'
	| 'nodeLeave'
	| 'nodeClick'
	| 'nodeHighlightToggle'
	| 'nodeTooltip'
	| 'nodeContextMenu'
	? SigmaNodeEventPayload
	: T extends
				| 'relationEnter'
				| 'relationLeave'
				| 'relationClick'
				| 'relationHighlightToggle'
				| 'relationTooltip'
				| 'relationContextMenu'
		? SigmaEdgeEventPayload
		: T extends 'nodeSelection' | 'nodeLassoSelection' | 'nodeAutoConnect' | 'mouseUp'
			? MouseCoords
			: T extends 'nodeDrag'
				? MouseCoords & { nodeId: NodeId }
				: T extends 'nodeQuick' | 'stageContextMenu'
					? SigmaStageEventPayload
					: T extends 'cameraUpdate'
						? CameraState
						: T extends 'scaleLabels' | 'scaleNodes' | 'zoomFactor' | 'autoPanSpeed'
							? WheelCoords
							: T extends 'stageDown'
								? SigmaEventPayload
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
	NODE_LASSO_SELECTION: 'nodeLassoSelection',
	NODE_CLICK: 'nodeClick',
	NODE_HIGHLIGHT_TOGGLE: 'nodeHighlightToggle',
	NODE_QUICK: 'nodeQuick',
	NODE_AUTO_CONNECT: 'nodeAutoConnect',
	NODE_CONTEXT_MENU: 'nodeContextMenu',
	// relation state
	RELATION_ENTER: 'relationEnter',
	RELATION_LEAVE: 'relationLeave',
	RELATION_CLICK: 'relationClick',
	RELATION_HIGHLIGHT_TOGGLE: 'relationHighlightToggle',
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
	ZOOM_FACTOR: 'zoomFactor',
	AUTO_PAN_SPEED: 'autoPanSpeed'
});

type StateManagerState<StateKey extends StateManagerStateValues> = {
	transitionTo: Array<StateManagerStateValues>;
	callbacks: Array<StateManagerInternalCallback<StateKey>>;
	// for deferred states: which mouse event commits a marked (pending) transition
	// into this state. 'mouse-move' commits on the first mouse move (continuous
	// states such as drag/selection/auto-connect), 'mouse-up' commits on mouse
	// release (e.g. quick node)
	commitOn?: 'mouse-move' | 'mouse-up';
	// continuous states keep firing their main callback on every mouse move while active
	isContinuous?: boolean;
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
	logger: Logger<StateManagerStateValues>;
	private lastRelationEvent: SigmaEdgeEventPayload | null;
	private enterNodeTimeout: number;
	private enterRelationTimeout: number;
	// a transition that has been marked but not yet committed (see markTransition)
	private pendingState: StateManagerStateValues | null;
	// allow only one central StateManager instance to prevent issues with multiple event listeners and state desynchronization
	static _instance: StateManager;
	// one-shot guard, set on mouseup after a drag/selection/lasso/auto-connect gesture ends, to suppress the native "click"
	// that still follows and could otherwise re-open node/relation details for whatever is at the release position.
	// Consumed by the capture-phase "click" interceptor registered on the Sigma container's parent in "initializeEvents",
	// not checked individually by "clickNode"/"clickEdge"/the label-click listener, since that interceptor runs (and stops propagation)
	// before any of them do
	private suppressNextClick: boolean;

	/**
	 * Create the manager in the "IDLE" state, build the state graph (allowed
	 * transitions plus per-state "commitOn"/"isContinuous" configuration), and wire
	 * Sigma events when a Sigma instance is provided.
	 */
	constructor(parameters?: { sigma?: GraphEditorSigma }) {
		this.sigma = parameters?.sigma || null;
		this.currentState = StateManagerStates.IDLE;
		this.lastRelationEvent = null;
		this.enterNodeTimeout = 0;
		this.enterRelationTimeout = 0;
		this.pendingState = null;
		this.suppressNextClick = false;
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
					// needed for relation label click
					StateManagerStates.RELATION_CLICK,
					StateManagerStates.RELATION_HIGHLIGHT_TOGGLE,
					StateManagerStates.STAGE_DOWN,
					StateManagerStates.SCALE_LABELS,
					StateManagerStates.SCALE_NODES,
					StateManagerStates.ZOOM_FACTOR,
					StateManagerStates.AUTO_PAN_SPEED,
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
					StateManagerStates.NODE_LASSO_SELECTION,
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
					StateManagerStates.NODE_HIGHLIGHT_TOGGLE,
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
				commitOn: 'mouse-up',
				transitionTo: [StateManagerStates.IDLE]
			},
			nodeAutoConnect: {
				callbacks: [],
				commitOn: 'mouse-move',
				isContinuous: true,
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
				commitOn: 'mouse-move',
				isContinuous: true,
				transitionTo: [StateManagerStates.IDLE]
			},
			nodeClick: {
				callbacks: [],
				transitionTo: [StateManagerStates.NODE_LEAVE, StateManagerStates.NODE_CONTEXT_MENU]
			},
			nodeHighlightToggle: {
				callbacks: [],
				transitionTo: [StateManagerStates.NODE_LEAVE, StateManagerStates.NODE_CONTEXT_MENU]
			},
			nodeSelection: {
				callbacks: [],
				commitOn: 'mouse-move',
				isContinuous: true,
				transitionTo: [StateManagerStates.IDLE]
			},
			nodeLassoSelection: {
				callbacks: [],
				commitOn: 'mouse-move',
				isContinuous: true,
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
					StateManagerStates.RELATION_HIGHLIGHT_TOGGLE,
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
					// needed for relation label click
					StateManagerStates.IDLE,
					StateManagerStates.RELATION_LEAVE,
					StateManagerStates.RELATION_CONTEXT_MENU
				]
			},
			relationHighlightToggle: {
				callbacks: [],
				transitionTo: [
					// needed for relation label click
					StateManagerStates.IDLE,
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
				transitionTo: [
					StateManagerStates.RELATION_CLICK,
					StateManagerStates.RELATION_HIGHLIGHT_TOGGLE,
					StateManagerStates.RELATION_LEAVE
				]
			},
			// misc state (broadcast to subscribers regardless of the current state)
			mouseUp: {
				transitionTo: [],
				callbacks: []
			},
			resize: {
				transitionTo: [],
				callbacks: []
			},
			cameraUpdate: {
				transitionTo: [],
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
			},
			autoPanSpeed: {
				callbacks: [],
				transitionTo: [StateManagerStates.IDLE]
			}
		};

		this.logger = new Logger<StateManagerStateValues>();
		this.logger.addLog(this.currentState);

		this.initializeEvents();
	}

	/**
	 * Return the shared singleton instance, creating it on first access. A single
	 * central instance prevents duplicate event listeners and state desynchronization.
	 */
	static getInstance() {
		if (!StateManager._instance) {
			StateManager._instance = new StateManager();
		}

		return StateManager._instance;
	}

	/**
	 * Attach a Sigma instance and (re)wire its event listeners. Does nothing when the
	 * same instance is already set.
	 */
	setSigma(sigma: GraphEditorSigma) {
		if (this.sigma !== sigma) {
			this.sigma = sigma;
			this.initializeEvents();
		}
	}

	/**
	 * Prevent the browser's native context menu on the Sigma container so it does not
	 * interfere with Sigma's right-click events.
	 */
	disableSigmaContainerContextMenu(event: MouseEvent) {
		event.preventDefault();
	}

	/**
	 * Wire all Sigma, mouse-captor, camera, and DOM events to the finite-state
	 * machine. Discrete events switch state immediately via "enterState"; the
	 * drag/selection/quick-node gestures are marked on mouse-down and committed later;
	 * "mouseUp", "resize", and "cameraUpdate" broadcast to their subscribers
	 * regardless of the current state. No-op until a Sigma instance is set.
	 */
	initializeEvents() {
		if (!this.sigma) {
			return;
		}

		let nodeId = '';

		// quick-fix for macOS mapping Ctrl + left-click to be right-click
		this.sigma
			.getContainer()
			.addEventListener('contextmenu', this.disableSigmaContainerContextMenu);

		this.sigma.getContainer().parentElement?.addEventListener(
			'click',
			(event) => {
				if (this.suppressNextClick) {
					this.suppressNextClick = false;
					event.stopImmediatePropagation();
					event.preventDefault();
				}
			},
			{ capture: true }
		);

		this.sigma.addListener('downNode', (event) => {
			// possible right mouse button
			if ('buttons' in event.event.original && event.event.original.buttons === 2) {
				return;
			}

			nodeId = event.node;

			this.enterState(StateManagerStates.NODE_DOWN, event);

			/**
			 * Mark the transition to be committed on the first mouse move. Holding
			 * CTRL + SHIFT engages auto-connect, while no modifier engages a plain
			 * node drag. The manager stays in NODE_DOWN until the user actually
			 * starts moving, so a click without movement never turns into a
			 * drag/auto-connect. CTRL alone intentionally marks nothing here so the
			 * subsequent clickNode can trigger the node highlight toggle.
			 */
			if (areExactModifiersPressed('Control', 'Shift')) {
				this.markTransition(StateManagerStates.NODE_AUTO_CONNECT);
			} else if (areNoModifiersPressed()) {
				this.markTransition(StateManagerStates.NODE_DRAG);
			}
		});

		/**
		 * Handle clicks on relation labels. Sigma.js does not provide click * events for edge labels since they are drawn
		 * on a Canvas2D layer with no built-in hit detection. This listener manually checks if the click falls within a
		 * displayed edge label's bounding box and, if so, triggers a RELATION_CLICK with a synthetic event. A manual resetState()
		 * is required afterwards because no leaveEdge event will follow to transition back to IDLE (unlike regular edge
		 * clicks which are resolved by the user moving the mouse away from the edge).
		 * */
		this.sigma.getContainer().addEventListener('click', (e) => {
			if (this.currentState !== StateManagerStates.IDLE) {
				return;
			}

			const rect = this.sigma!.getContainer().getBoundingClientRect();
			const x = e.clientX - rect.left;
			const y = e.clientY - rect.top;

			// check if relation label clicked
			const edgeKey = getEdgeLabelAtPoint(x, y);
			if (edgeKey) {
				const syntheticEvent: SigmaEdgeEventPayload = {
					event: {
						x,
						y,
						sigmaDefaultPrevented: false,
						preventSigmaDefault() {
							this.sigmaDefaultPrevented = true;
						},
						original: e
					},
					preventSigmaDefault() {
						this.event.preventSigmaDefault();
					},
					edge: edgeKey
				};

				// CTRL + label click toggles relation highlight, a plain label
				// click opens relation details
				if (areExactModifiersPressed('Control')) {
					this.enterState(StateManagerStates.RELATION_HIGHLIGHT_TOGGLE, syntheticEvent);
				} else {
					this.enterState(StateManagerStates.RELATION_CLICK, syntheticEvent);
				}
				// Reset state since there's no leaveEdge event to do it for label-only clicks
				this.resetState();
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
					this.enterState(StateManagerStates.RELATION_LEAVE, this.lastRelationEvent);
				}
			}

			this.enterState(StateManagerStates.NODE_ENTER, event);

			this.enterNodeTimeout = window.setTimeout(() => {
				this.enterState(StateManagerStates.NODE_TOOLTIP, event);
			}, ITEM_OVERVIEW_MOUSE_ENTER_TIMEOUT_MILLISECONDS);
		});

		this.sigma.addListener('rightClickNode', (event) => {
			this.enterState(StateManagerStates.NODE_CONTEXT_MENU, event);
		});

		this.sigma.addListener('leaveNode', (event) => {
			window.clearTimeout(this.enterNodeTimeout);

			this.enterState(StateManagerStates.NODE_LEAVE, event);

			// manually reset the state, otherwise the manager will hang in the
			// NODE_LEAVE state
			if (this.currentState === StateManagerStates.NODE_LEAVE) {
				this.resetState();
			}
		});

		this.sigma.addListener('clickNode', (event) => {
			// CTRL + click toggles node highlight, a plain click opens node details
			if (areExactModifiersPressed('Control')) {
				this.enterState(StateManagerStates.NODE_HIGHLIGHT_TOGGLE, event);
			} else {
				this.enterState(StateManagerStates.NODE_CLICK, event);
			}
		});

		this.sigma.addListener('enterEdge', (event) => {
			this.lastRelationEvent = event;
			this.enterState(StateManagerStates.RELATION_ENTER, event);

			this.enterRelationTimeout = window.setTimeout(() => {
				this.enterState(StateManagerStates.RELATION_TOOLTIP, event);
			}, ITEM_OVERVIEW_MOUSE_ENTER_TIMEOUT_MILLISECONDS);
		});

		this.sigma.addListener('leaveEdge', (event) => {
			window.clearTimeout(this.enterRelationTimeout);

			this.enterState(StateManagerStates.RELATION_LEAVE, event);

			// manually reset the state, otherwise the manager will hang in the
			// RELATION_LEAVE state
			if (this.currentState === StateManagerStates.RELATION_LEAVE) {
				this.resetState();
			}
		});

		this.sigma.addListener('clickEdge', (event) => {
			// CTRL + click toggles relation highlight, a plain click opens relation details
			if (areExactModifiersPressed('Control')) {
				this.enterState(StateManagerStates.RELATION_HIGHLIGHT_TOGGLE, event);
			} else {
				this.enterState(StateManagerStates.RELATION_CLICK, event);
			}
		});

		this.sigma.addListener('rightClickEdge', (event) => {
			this.enterState(StateManagerStates.RELATION_CONTEXT_MENU, event);
		});

		this.sigma.addListener('downStage', (event) => {
			// possible right mouse button
			if ('buttons' in event.event.original && event.event.original.buttons === 2) {
				return;
			}

			/**
			 * Sigma does not hit-test edge labels (they are drawn on a Canvas2D layer without hit detection),
			 * so a mousedown on a label is reported as a stage event. Without this guard, that would also mark a stage
			 * gesture (e.g. NODE_QUICK on Ctrl) which conflicts with the dedicated label click handled separately by
			 * the container "click" listener (see RELATION_CLICK / RELATION_HIGHLIGHT_TOGGLE below). Ignoring the
			 * stage-down here leaves the state in IDLE so only the label click handler reacts.
			 */
			if (getEdgeLabelAtPoint(event.event.x, event.event.y)) {
				return;
			}

			this.enterState(StateManagerStates.STAGE_DOWN, event);

			/**
			 * Mark the transition to be committed later: ALT+SHIFT starts a lasso
			 * selection and SHIFT a rectangle selection (both committed on the first
			 * mouse move), CTRL creates a quick node (committed on mouse release).
			 * Until then the manager stays in STAGE_DOWN so plain stage interactions
			 * (camera pan) are unaffected.
			 */
			if (areExactModifiersPressed('Alt', 'Shift')) {
				this.markTransition(StateManagerStates.NODE_LASSO_SELECTION);
			} else if (areExactModifiersPressed('Shift')) {
				this.markTransition(StateManagerStates.NODE_SELECTION);
			} else if (areExactModifiersPressed('Control')) {
				this.markTransition(StateManagerStates.NODE_QUICK);
			}
		});

		this.sigma.addListener('upStage', (event) => {
			// commit a pending quick-node transition (marked on CTRL + stage down)
			this.commitPendingTransition('mouse-up', event);
		});

		this.sigma.addListener('rightClickStage', (event) => {
			this.enterState(StateManagerStates.STAGE_CONTEXT_MENU, event);
		});

		this.sigma.getMouseCaptor().addListener('mousemovebody', (event) => {
			const dragEvent = { ...event, nodeId: nodeId };

			/**
			 * Commit a pending move-triggered gesture (node drag, rectangle/lasso
			 * selection or auto-connect). This is the point where "mouse down + move"
			 * actually switches into the continuous state and fires its entry
			 * callbacks. The drag payload (with nodeId) is a superset of the plain
			 * MouseCoords the other gestures expect, so it is safe for all of them.
			 */
			const committed = this.commitPendingTransition('mouse-move', dragEvent);

			if (this.currentState === StateManagerStates.RELATION_ENTER) {
				if (this.lastRelationEvent) {
					this.lastRelationEvent.event = {
						...this.lastRelationEvent.event,
						x: event.x,
						y: event.y
					};
				}
			}

			// keep firing the active continuous state's callback on every move
			// (skip the commit move, since entering already fired the callback)
			if (!committed) {
				this.updateState(dragEvent);
			}
		});

		this.sigma.getMouseCaptor().addListener('mouseup', (event) => {
			this.broadcast(StateManagerStates.MOUSE_UP, event);

			if (
				this.currentState === StateManagerStates.NODE_DRAG ||
				this.currentState === StateManagerStates.NODE_SELECTION ||
				this.currentState === StateManagerStates.NODE_LASSO_SELECTION ||
				this.currentState === StateManagerStates.NODE_AUTO_CONNECT ||
				this.currentState === StateManagerStates.STAGE_DOWN ||
				this.currentState === StateManagerStates.NODE_QUICK
			) {
				/**
				 * A drag/selection/lasso/auto-connect gesture just ended. Sigma's native "click" (fired right after this
				 * "mouseup") can still resolve to a node at the release position - regardless of our own state machine -
				 * so suppress the very next "clickNode"/"clickEdge"/label-click once, to avoid the node/relation details
				 * drawer opening as an unintended side-effect of finishing a drag
				 */
				if (
					this.currentState === StateManagerStates.NODE_DRAG ||
					this.currentState === StateManagerStates.NODE_SELECTION ||
					this.currentState === StateManagerStates.NODE_LASSO_SELECTION ||
					this.currentState === StateManagerStates.NODE_AUTO_CONNECT
				) {
					this.suppressNextClick = true;
				}

				this.resetState();
			} else {
				// a marked-but-never-committed transition (e.g. CTRL/SHIFT pressed on
				// a node/stage without an actual drag) must not leak into the next
				// interaction
				this.pendingState = null;
			}
		});

		this.sigma.addListener('resize', () => {
			this.broadcast(StateManagerStates.RESIZE);
		});

		this.sigma.getCamera().addListener('updated', (state) => {
			this.broadcast(StateManagerStates.CAMERA_UPDATE, state);
		});

		this.sigma.getMouseCaptor().addListener('wheel', (event: WheelCoords) => {
			if (event.delta !== 0) {
				if (areExactModifiersPressed('Control', 'Alt')) {
					this.enterState(StateManagerStates.AUTO_PAN_SPEED, event);
				} else if (areExactModifiersPressed('Control')) {
					this.enterState(StateManagerStates.ZOOM_FACTOR, event);
				} else if (areExactModifiersPressed('Shift')) {
					this.enterState(StateManagerStates.SCALE_LABELS, event);
				} else if (areExactModifiersPressed('Alt')) {
					this.enterState(StateManagerStates.SCALE_NODES, event);
				}
			}
		});
	}

	/**
	 * Reset the manager to its initial state: clear every subscription's one-shot
	 * "beforeCallbackExecuted"/"afterCallbackExecuted" flags, drop any pending marked
	 * transition, and transition back to "IDLE" when that transition is allowed.
	 */
	resetState() {
		Object.values(this.state).forEach((state) => {
			if ('callbacks' in state) {
				state.callbacks.forEach((internalCallback) => {
					internalCallback.beforeCallbackExecuted = false;
					internalCallback.afterCallbackExecuted = false;
				});
			}
		});

		this.pendingState = null;
		this.transitionTo(StateManagerStates.IDLE);
	}

	/**
	 * Return the configuration object for the current state.
	 */
	getSelectedState() {
		return this.state[this.currentState];
	}

	/**
	 * Switch into a new state and fire its entry callbacks in one step. Convenience
	 * wrapper over the transition (which runs the previous state's exit callbacks)
	 * followed by the new state's callback execution. Behaviour is identical to
	 * calling "transitionTo" and then "executeStateCallbacks" back-to-back.
	 */
	enterState<T extends StateManagerStateValues>(target: T, event?: PayloadType<T>) {
		this.transitionTo(target);
		this.executeStateCallbacks(target, event);
	}

	/**
	 * Mark a transition to be committed later, without changing the current state.
	 * The manager stays put until the transition is committed on the target state's
	 * configured trigger (see "commitOn"): continuous states (drag/selection/
	 * auto-connect) commit on the first mouse move, deferred discrete states (quick
	 * node) commit on mouse release. This keeps the state machine stable and
	 * guarantees callbacks always fire when the switch actually happens.
	 */
	markTransition(target: StateManagerStateValues) {
		// only mark transitions that are actually reachable from the current state
		if (this.getSelectedState().transitionTo.includes(target)) {
			this.pendingState = target;
		}
	}

	/**
	 * Commit a previously marked (pending) transition if its "commitOn" trigger
	 * matches the given one. Committing performs the actual state switch and fires
	 * the target state's entry callbacks. Returns true if a transition was committed.
	 */
	commitPendingTransition(
		trigger: 'mouse-move' | 'mouse-up',
		event?: PayloadType<StateManagerStateValues>
	) {
		if (!this.pendingState) {
			return false;
		}

		const target = this.pendingState;

		if (this.state[target].commitOn !== trigger) {
			return false;
		}

		// consume the intent regardless of the switch outcome, so a stale pending
		// transition can never leak into a later interaction
		this.pendingState = null;

		this.enterState(target, event);

		/**
		 * Node drag/selection/lasso/auto-connect all call "preventSigmaCameraMovement", which sets "sigmaDefaultPrevented"
		 * and makes Sigma's own MouseCaptor skip its "draggedEvents++" bookkeeping (see handleMove). Left unpatched,
		 * Sigma's native "click" handler (fired right after mouseup) then believes no drag happened and re-hit-tests
		 * "getNodeAtPosition" at the current cursor position, emitting a spurious "clickNode" for whatever node now
		 * renders there - most noticeable after auto-panning shuffled the graph underneath a stationary cursor.
		 * Bumping "draggedEvents" ourselves restores that invariant so Sigma's own "draggedEvents < draggedEventsTolerance"
		 * guard suppresses the click as intended.
		 */
		if (this.getSelectedState().isContinuous && this.sigma) {
			this.sigma.getMouseCaptor().draggedEvents++;
		}

		return true;
	}

	/**
	 * Fire the main callback of the current state on a continuous interaction
	 * (e.g. every mouse move while dragging/selecting). Non-continuous states are
	 * ignored so their callbacks only run once, on entry.
	 */
	updateState(event?: PayloadType<StateManagerStateValues>) {
		if (this.getSelectedState().isContinuous) {
			this.executeStateCallbacks(this.currentState, event);
		}
	}

	/**
	 * Switch "currentState" to "newState" when that transition is allowed from the
	 * current state. Runs the current state's exit ("afterCallback") handlers before
	 * leaving, but does not fire the new state's callbacks - use "enterState" for that.
	 */
	private transitionTo(newState: StateManagerStateValues) {
		const state = this.getSelectedState();

		if (state.transitionTo.includes(newState)) {
			this.logger.addLog(newState);

			this.runExitCallbacks(state);

			this.currentState = newState;
		}
	}

	/**
	 * Run each subscription's one-shot "afterCallback" for the given state (guarded by
	 * "afterCallbackExecuted" so it fires only once), just before leaving that state.
	 */
	private runExitCallbacks<StateKey extends StateManagerStateValues>(
		state: StateManagerState<StateKey>
	) {
		state.callbacks.forEach((internalCallback) => {
			if (internalCallback.afterCallback && !internalCallback.afterCallbackExecuted) {
				internalCallback.afterCallbackExecuted = true;
				internalCallback.afterCallback();
			}
		});
	}

	/**
	 * Fire a state's callbacks independently of the finite-state-machine flow.
	 * Used for the "direct execution" states (mouseUp, resize, cameraUpdate) that
	 * notify their subscribers regardless of the current state.
	 */
	broadcast<T extends StateManagerStateValues>(stateKey: T, event?: PayloadType<T>) {
		this.runStateCallbacks(this.state[stateKey], event);
	}

	/**
	 * Fire a state's entry callbacks ("beforeCallback" once, then the main
	 * "callback"), but only when the requested state is the current one. This is the
	 * finite-state-machine-guarded counterpart to "broadcast": it is used by
	 * "enterState" right after a successful switch and by "updateState" on every move
	 * of a continuous state. State-independent notifications go through "broadcast".
	 */
	private executeStateCallbacks<T extends StateManagerStateValues>(
		currentState: T,
		event?: PayloadType<T>
	) {
		if (this.currentState === currentState) {
			this.runStateCallbacks<typeof this.currentState>(this.getSelectedState(), event);
		}
	}

	/**
	 * Low-level primitive that invokes a state's subscriptions, unconditionally
	 * (no current-state check). For each subscription it runs the one-shot
	 * "beforeCallback" (guarded by "beforeCallbackExecuted" so it fires only once per
	 * state cycle) and then the main "callback". When an "event" is provided it is
	 * passed to the handlers; otherwise parameterless handlers are still invoked.
	 * Shared by "executeStateCallbacks" (current-state) and "broadcast" (any state).
	 */
	private runStateCallbacks<StateKey extends StateManagerStateValues>(
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

	/**
	 * Register a subscriber for a state. Accepts either a bare function (used as the
	 * main "callback") or an object with "beforeCallback"/"callback"/"afterCallback".
	 * Returns an unsubscribe function for convenience.
	 */
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

	/**
	 * Remove a previously registered subscriber from a state by matching its main
	 * "callback" reference.
	 */
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
