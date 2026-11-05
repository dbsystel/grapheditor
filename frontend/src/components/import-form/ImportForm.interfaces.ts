import { ImportStrategy } from 'src/models/import-export';
import { GlobalComponentProps } from 'src/types/components';

export type ImportFormProps = GlobalComponentProps & {
	onSuccess?: () => void;
};

export type ImportFormFormData = {
	file: File | null;
	strategy: ImportStrategy;
};
