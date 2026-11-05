import { generateAbsoluteBackendUrl } from 'src/utils/helpers/browser';

type GenerateDownloadUrlParameters = {
	url: string;
	filename: string;
	extension: string;
};

export const generateExportDownloadUrl = ({
	url,
	filename,
	extension
}: GenerateDownloadUrlParameters) => {
	return generateAbsoluteBackendUrl(
		`${url}?saveAs=${encodeURIComponent(filename)}&extension=${encodeURIComponent(extension)}`
	);
};
