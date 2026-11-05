import { AxiosResponse } from 'axios';
import { ExportConfiguration } from 'src/models/import-export';
import { StoppableRequest } from 'src/models/stoppable-request';
import { backendApi } from 'src/utils/api';
import { endpoints } from 'src/utils/endpoints';

export type PostTransferExportParameters = {
	configuration: ExportConfiguration;
	stoppableRequest?: StoppableRequest;
};

export type PostTransferExportAxiosResponse = AxiosResponse<{
	download_url: string;
}>;

/**
 * Export all nodes and relations as JSONL blob.
 */
export const postTransferExport = (parameters: PostTransferExportParameters) => {
	return backendApi.post<
		Blob,
		PostTransferExportAxiosResponse,
		PostTransferExportParameters['configuration']
	>(endpoints.getTransferExportPath(), parameters.configuration, {
		applicationStoppableRequest: parameters.stoppableRequest
	});
};
