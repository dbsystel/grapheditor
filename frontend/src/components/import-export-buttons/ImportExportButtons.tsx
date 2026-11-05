import './ImportExportButtons.scss';
import { DBButton } from '@db-ux/react-core-components';
import clsx from 'clsx';
import { useTranslation } from 'react-i18next';
import { useImportExportStore } from 'src/stores/import-export';
import { ImportExportButtonsProps } from './ImportExportButtons.interfaces';

export const ImportExportButtons = ({ id, className, testId }: ImportExportButtonsProps) => {
	const { t } = useTranslation();
	const openImportModal = useImportExportStore((store) => store.openImportModal);
	const openExportModal = useImportExportStore((store) => store.openExportModal);
	const rootElementClassName = clsx('import-export-buttons', className);

	const internalOpenExportModal = () => {
		openExportModal();
	};

	return (
		<div className={rootElementClassName} id={id} data-testid={testId}>
			<DBButton variant="ghost" onClick={internalOpenExportModal}>
				{t('import_export_buttons_export')}
			</DBButton>
			<DBButton variant="ghost" onClick={openImportModal}>
				{t('import_export_buttons_import')}
			</DBButton>
		</div>
	);
};
