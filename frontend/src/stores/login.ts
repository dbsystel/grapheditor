import { create } from 'zustand';

type LoginStore = {
	isConnected: boolean;
	isConnecting: boolean;
	setIsConnecting: (isConnecting: boolean) => void;
	checkIfLoggedInDone: boolean;
	setCheckIfLoggedInDone: (done: boolean) => void;
	username: string;
	host: string;
	connect: (host: string, username: string) => void;
	disconnect: () => void;
};

/**
 * Store for keeping track which login data is currently used.
 */
export const useLoginStore = create<LoginStore>((set) => ({
	isConnected: false,
	isConnecting: false,
	username: '',
	host: '',
	checkIfLoggedInDone: false,
	setCheckIfLoggedInDone: (done) => {
		set({ checkIfLoggedInDone: done });
	},
	disconnect: () => {
		set({ isConnected: false, isConnecting: false, host: '', username: '' });
	},
	connect: (host, username) => {
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
