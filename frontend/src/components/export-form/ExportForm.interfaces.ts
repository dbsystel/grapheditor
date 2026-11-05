import { ExportNodeMode, ExportRelationMode } from 'src/models/import-export';
import { GlobalComponentProps } from 'src/types/components';

export type ExportFormProps = GlobalComponentProps & {
	onSuccess?: () => void;
};

export type ExportFormFormData = {
	nodeMode: ExportNodeMode;
	relationMode: ExportRelationMode;
	cypherQuery: string;
	filename: string;
	extension: string;
};
