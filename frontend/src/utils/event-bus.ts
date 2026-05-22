import { Node } from 'src/models/node';
import { Relation } from 'src/models/relation';

export class EventBusClass<TEvents> {
	listeners: ListenerMap<TEvents>;

	constructor() {
		this.listeners = {} as ListenerMap<TEvents>;
	}

	public subscribe<EventName extends keyof TEvents>(
		eventName: EventName,
		callback: (data: TEvents[EventName]) => void
	): () => void {
		if (!this.listeners[eventName]) {
			this.listeners[eventName] = { listeners: [] };
		}

		this.listeners[eventName].listeners.push(callback);

		return () => {
			this.unsubscribe(eventName, callback);
		};
	}

	public unsubscribe<EventName extends keyof TEvents>(
		eventName: EventName,
		callback: (data: TEvents[EventName]) => void
	) {
		const eventListeners = this.listeners[eventName];

		if (eventListeners) {
			eventListeners.listeners = eventListeners.listeners.filter(
				(listener) => listener !== callback
			);
		}
	}

	public subscribeOnce<EventName extends keyof TEvents>(
		eventName: EventName,
		callback: (data: TEvents[EventName]) => void
	) {
		const wrapper = (data: TEvents[EventName]) => {
			callback(data);
			this.unsubscribe(eventName, wrapper);
		};

		this.subscribe(eventName, wrapper);
	}

	public publish<EventName extends keyof TEvents>(
		eventName: EventName,
		data: TEvents[EventName]
	) {
		const eventListeners = this.listeners[eventName];

		if (eventListeners) {
			eventListeners.listeners.forEach((listener) => listener(data));
		}
	}

	public reset() {
		this.listeners = {} as ListenerMap<TEvents>;
	}
}

export const eventBus = new EventBusClass<EventBusEvents>();

type ListenerMap<TEvents> = {
	[K in keyof TEvents]?: {
		listeners: Array<(data: TEvents[K]) => void>;
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
