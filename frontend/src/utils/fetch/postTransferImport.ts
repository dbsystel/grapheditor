import { AxiosResponse } from 'axios';
import { ImportStrategy } from 'src/models/import-export';
import { StoppableRequest } from 'src/models/stoppable-request';
import { backendApi } from 'src/utils/api';
import { endpoints } from 'src/utils/endpoints';

export type PostTransferImportParameters = {
	configuration: {
		file: File;
		strategy: ImportStrategy;
		/**
		 * Number of graph elements (nodes or relations) sent per batch.
		 * Nodes and relations are batched separately. Larger values mean
		 * fewer commits but bigger transactions. Default: 1000.
		 */
		batchSize?: number;
	};
	stoppableRequest?: StoppableRequest;
};

export type PostTransferImportResponse = {
	nodes_imported: number;
	relations_imported: number;
};

export const postTransferImport = (data: PostTransferImportParameters) => {
	const formData = new FormData();
	formData.append('file', data.configuration.file);

	return backendApi.post<
		PostTransferImportResponse,
		AxiosResponse<PostTransferImportResponse>,
		FormData
	>(
		endpoints.getTransferImportPath({
			strategy: data.configuration.strategy,
			batchSize: data.configuration.batchSize || 1000
		}),
		formData,
		{
			applicationStoppableRequest: data.stoppableRequest
		}
	);
};
