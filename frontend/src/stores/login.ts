import { setApiHeaderTabId } from 'src/utils/api';
import { getLogin } from 'src/utils/fetch/getLogin';
import { getTabId, setTabId } from 'src/utils/tabId';
import { create } from 'zustand';

type LoginStore = {
	isConnected: boolean;
	isConnecting: boolean;
	tabId: string;
	username: string;
	host: string;
	init: () => void;
	connect: (host: string, username: string) => void;
	disconnect: () => void;
};

/**
 * Store for keeping track which login data is currently used.
 */
export const useLoginStore = create<LoginStore>((set, get) => ({
	isConnected: false,
	isConnecting: false,
	tabId: getTabId() || window.crypto.randomUUID(),
	username: '',
	host: '',
	init: async () => {
		const tabId = get().tabId;

		setTabId(tabId);
		setApiHeaderTabId(tabId);
		set({ isConnecting: true });

		getLogin()
			.then((data) => {
				get().connect(data.data.host, data.data.username);
			})
			.catch(() => {
				get().disconnect();
			});
	},
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
	}
}));
