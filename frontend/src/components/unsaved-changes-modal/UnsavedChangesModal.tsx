import './UnsavedChangesModal.scss';
import { DBButton, DBIcon } from '@db-ux/react-core-components';
import clsx from 'clsx';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { Modal } from 'src/components/modal/Modal';
import { UnsavedChangedModalProps } from './UnsavedChangedModal.interfaces';

export const UnsavedChangesModal = ({
	unsavedSectionName,
	onCancelClick,
	onSaveClick,
	id,
	className,
	testId
}: UnsavedChangedModalProps) => {
	const { t } = useTranslation();
	const rootElementClassName = clsx('unsaved-changes-modal', className);

	return createPortal(
		<Modal id={id} className={rootElementClassName} isOpen={true} testId={testId}>
			<h3>{t('unsaved_changes_modal_title')}</h3>
			<p>
				<DBIcon icon="information_circle" />
				{t('unsaved_changes_modal_description', {
					sectionName: unsavedSectionName
				})}
			</p>
			<div className="unsaved-changes-modal__buttons">
				<DBButton icon="cross" variant="ghost" onClick={onCancelClick}>
					{t('unsaved_changes_modal_cancel_button')}
				</DBButton>
				<DBButton icon="check" variant="brand" onClick={onSaveClick}>
					{t('unsaved_changes_modal_save_button')}
				</DBButton>
			</div>
		</Modal>,
		document.body
	);
};
