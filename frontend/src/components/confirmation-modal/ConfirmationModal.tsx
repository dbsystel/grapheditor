import './ConfirmationModal.scss';
import { DBButton, DBIcon } from '@db-ux/react-core-components';
import clsx from 'clsx';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { Modal } from 'src/components/modal/Modal';
import { useConfirmationModalStore } from 'src/stores/confirmation-modal';
import { ConfirmationModalProps } from './ConfirmationModal.interfaces';

export const ConfirmationModal = ({ id, className, testId }: ConfirmationModalProps) => {
	const { content } = useConfirmationModalStore();
	const rootElementClassName = clsx('confirmation-modal', className);
	const { t } = useTranslation();

	if (!content) {
		return null;
	}

	return createPortal(
		<Modal id={id} className={rootElementClassName} isOpen={true} data-testid={testId}>
			<h3 className="confirmation-modal__title">{content.title}</h3>
			<p className="confirmation-modal__description">
				<DBIcon icon="information_circle" />
				{content.description}
			</p>
			<div className="confirmation-modal__buttons">
				<DBButton icon="cross" variant="ghost" onClick={content.onCancelClick}>
					{content.cancelLabel || t('confirmation_modal_cancel')}
				</DBButton>
				<DBButton icon="check" variant="brand" onClick={content.onConfirmClick}>
					{content.confirmLabel || t('confirmation_modal_confirm')}
				</DBButton>
			</div>
		</Modal>,
		document.body
	);
};
