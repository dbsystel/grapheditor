import { Node } from 'src/models/node';
import { Relation } from 'src/models/relation';

class EventBusClass {
	listeners: ListenerMap;

	constructor() {
		this.listeners = {};
	}

	public subscribe<EventName extends keyof EventBusEvents>(
		eventName: EventName,
		callback: (data: EventBusEvents[EventName]) => void
	): () => void {
		if (!this.listeners[eventName]) {
			this.listeners[eventName] = { listeners: [] };
		}

		this.listeners[eventName].listeners.push(callback);

		return () => {
			this.unsubscribe(eventName, callback);
		};
	}

	public unsubscribe<EventName extends keyof EventBusEvents>(
		eventName: EventName,
		callback: (data: EventBusEvents[EventName]) => void
	) {
		const eventListeners = this.listeners[eventName];

		if (eventListeners) {
			eventListeners.listeners = eventListeners.listeners.filter(
				(listener) => listener !== callback
			);
		}
	}

	public subscribeOnce<EventName extends keyof EventBusEvents>(
		eventName: EventName,
		callback: (data: EventBusEvents[EventName]) => void
	) {
		const wrapper = (data: EventBusEvents[EventName]) => {
			callback(data);
			this.unsubscribe(eventName, wrapper);
		};

		this.subscribe(eventName, wrapper);
	}

	public publish<EventName extends keyof EventBusEvents>(
		eventName: EventName,
		data: EventBusEvents[EventName]
	) {
		const eventListeners = this.listeners[eventName];

		if (eventListeners) {
			eventListeners.listeners.forEach((listener) => listener(data));
		}
	}

	public reset() {
		this.listeners = {};
	}
}

export const eventBus = new EventBusClass();

type ListenerMap = {
	[K in keyof EventBusEvents]?: {
		listeners: Array<(data: EventBusEvents[K]) => void>;
	};
};

export type EventBusEvents = {
	// application layer events
	nodesAdd: { nodes: Array<Node> };
	nodesRemove: { nodes: Array<Node> };
	nodesUpdate: { nodes: Array<Node> };
	relationsAdd: { relations: Array<Relation> };
	relationsRemove: { relations: Array<Relation> };
	relationsUpdate: { relations: Array<Relation> };
};
