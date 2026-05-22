import { EventBusClass } from 'src/utils/event-bus';

type ExtendedLog<LogType> = {
	id: string;
	timestamp: string;
	log: LogType;
};

type EventBusEvents<Log> = {
	addLog: { extendedLog: ExtendedLog<Log> };
};

export class Logger<Log> {
	logs: Array<ExtendedLog<Log>>;
	eventBus: EventBusClass<{
		addLog: { extendedLog: ExtendedLog<Log> };
	}>;

	constructor() {
		this.logs = [];
		this.eventBus = new EventBusClass<EventBusEvents<Log>>();
	}

	addLog(log: Log) {
		const extendedLog = {
			id: this.generateId(),
			timestamp: this.getCurrentUTCTimestamp(),
			log: log
		};

		this.logs.push(extendedLog);

		this.eventBus.publish('addLog', { extendedLog: extendedLog });
	}

	export() {
		return JSON.stringify(JSON.parse(JSON.stringify(this.logs)), null, 2);
	}

	reset() {
		this.logs = [];
	}

	generateId() {
		return window.crypto.randomUUID();
	}

	// ISO 8601 (UTC)
	// example: 2026-04-17T14:05:23.456Z
	getCurrentUTCTimestamp() {
		return new Date().toISOString();
	}

	getCalculatedLogsSizeInBytes() {
		let bytes = 0;

		for (const entry of this.logs) {
			// object overhead
			bytes += 64;
			// id (UUID string): 36 chars × 2 bytes + ~48 string overhead
			bytes += entry.id.length * 2 + 48;
			// timestamp (ISO string): 24 chars × 2 bytes + ~48 string overhead
			bytes += entry.timestamp.length * 2 + 48;
			// log value
			bytes += this.estimateValueSize(entry.log);
			// array slot pointer
			bytes += 8;
		}

		return bytes;
	}

	private estimateValueSize(value: unknown) {
		if (value === null || value === undefined) return 0;

		switch (typeof value) {
			case 'string':
				return value.length * 2 + 48;
			case 'number':
				return 8;
			case 'boolean':
				return 4;
			case 'object': {
				let bytes = 64; // object/array overhead
				if (Array.isArray(value)) {
					for (const item of value) {
						bytes += this.estimateValueSize(item) + 8;
					}
				} else {
					for (const key of Object.keys(value as Record<string, unknown>)) {
						bytes += key.length * 2 + 48; // key
						bytes += this.estimateValueSize((value as Record<string, unknown>)[key]);
					}
				}
				return bytes;
			}
			default:
				return 0;
		}
	}

	getFormattedLogsSize(): string {
		const bytes = this.getCalculatedLogsSizeInBytes();
		const units = ['B', 'KB', 'MB', 'GB'];
		let unitIndex = 0;
		let size = bytes;

		while (size >= 1024 && unitIndex < units.length - 1) {
			size /= 1024;
			unitIndex++;
		}

		return `${unitIndex === 0 ? size : size.toFixed(2)} ${units[unitIndex]}`;
	}
}
