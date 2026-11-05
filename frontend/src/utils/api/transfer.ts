import { postTransferExport } from 'src/utils/fetch/postTransferExport';
import { postTransferImport } from 'src/utils/fetch/postTransferImport';

export const transferApi = {
	fetch: {
		postTransferExport: postTransferExport,
		postTransferImport: postTransferImport
	}
};
