import './ImportExportModals.scss';
import clsx from 'clsx';
import { useTranslation } from 'react-i18next';
import { ExportForm } from 'src/components/export-form/ExportForm';
import { ImportForm } from 'src/components/import-form/ImportForm';
import { Modal } from 'src/components/modal/Modal';
import { useImportExportStore } from 'src/stores/import-export';
import { ImportExportModalsProps } from './ImportExportModals.interfaces';

export const ImportExportModals = ({ id, className, testId }: ImportExportModalsProps) => {
	const { t } = useTranslation();
	const { active, close, defaultNodeMode } = useImportExportStore();
	const rootElementClassName = clsx('import-export-modals', className);

	if (!active) {
		return null;
	}

	if (active === 'export') {
		return (
			<Modal
				id={id}
				testId={testId}
				isOpen={true}
				className={clsx(rootElementClassName, 'import-export-modals__export-modal', {
					'import-export-modals__cypher-export': defaultNodeMode === 'cypher'
				})}
				headline={t('import_export_export_modal_title')}
				onClose={close}
			>
				<ExportForm onSuccess={close} />
			</Modal>
		);
	}

	return (
		<Modal
			id={id}
			testId={testId}
			isOpen={true}
			className={rootElementClassName}
			headline={t('import_export_import_modal_title')}
			description={t('import_export_import_modal_description')}
			onClose={close}
		>
			<ImportForm onSuccess={close} />
		</Modal>
	);
};
