import { AxiosResponse } from 'axios';
import { backendApi } from 'src/utils/api';
import { endpoints } from 'src/utils/endpoints';

export type PostStyleUploadParameters = { file: File };
export type PostStyleUploadResponse = string;

export const postStyleUpload = (data: PostStyleUploadParameters) => {
	const formData = new FormData();
	formData.append('file', data.file);

	return backendApi.post<
		PostStyleUploadResponse,
		AxiosResponse<PostStyleUploadResponse>,
		FormData
	>(endpoints.getStyleUploadPath(), formData);
};
