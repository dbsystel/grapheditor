import { setApiHeaderTabId } from 'src/utils/api';
import { create } from 'zustand';

type LoginStore = {
	isConnected: boolean;
	isConnecting: boolean;
	setIsConnecting: (isConnecting: boolean) => void;
	// TODO find a way to have unique tab IDs per tab. Previously we would store tab ID in the sessionStorage,
	//  but this caused issues when duplicating tabs (the sessionStorage would also be duplicated).
	tabId: string;
	username: string;
	host: string;
	connect: (host: string, username: string) => void;
	disconnect: () => void;
};

/**
 * Store for keeping track which login data is currently used.
 */
export const useLoginStore = create<LoginStore>((set, get) => ({
	isConnected: false,
	isConnecting: false,
	tabId: window.crypto.randomUUID(),
	username: '',
	host: '',
	disconnect: () => {
		set({ isConnected: false, isConnecting: false, host: '', username: '' });
	},
	connect: (host: string, username: string) => {
		setApiHeaderTabId(get().tabId);

		set({
			isConnected: true,
			isConnecting: false,
			host: host,
			username: username
		});
	},
	setIsConnecting: (isConnecting) => {
		set({
			isConnecting: isConnecting
		});
	}
}));
