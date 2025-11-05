import './Modal.scss';
import { DBButton, DBCard, DBIcon } from '@db-ux/react-core-components';
import clsx from 'clsx';
import { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { ModalProps } from './Modal.interfaces';

export const Modal = ({
	children,
	isOpen,
	id,
	className,
	testId,
	style,
	headline,
	description,
	onClose,
	shouldUseBackdrop = true,
	shouldDisplayAsModal = true
}: ModalProps) => {
	const [dialogRef, setDialogRef] = useState<HTMLDialogElement | null>(null);
	const rootElementClassName = clsx('modal', className, {
		'modal--no-backdrop': !shouldUseBackdrop
	});
	/**
	 * 	useCallback to prevent double calling of ref callback with null and the element
	 * 	@see https://legacy.reactjs.org/docs/refs-and-the-dom.html#caveats-with-callback-refs
	 */
	const onRefChange = useCallback((element: HTMLDialogElement | null) => {
		setDialogRef(element);
	}, []);

	/**
	 * We need the "dialogRef" to be an element reference in order to show/hide it.
	 *
	 * TODO: Refactor with isOpen true/false, not only true
	 */
	useEffect(() => {
		if (isOpen && dialogRef) {
			if (shouldDisplayAsModal) {
				dialogRef.showModal();
			} else {
				dialogRef.show();
			}
		}
	}, [isOpen, dialogRef]);

	const handleClose = () => {
		if (dialogRef) {
			dialogRef.close();
		}
		if (onClose) {
			onClose();
		}
	};

	return createPortal(
		<dialog
			role="dialog"
			id={id}
			className={rootElementClassName}
			data-testid={testId}
			ref={onRefChange}
			data-backdrop={shouldUseBackdrop ? undefined : 'none'}
		>
			<DBCard className="modal__content" style={style}>
				<div className="modal__header">
					{headline && (
						<div className="modal__header-title">
							<h3>{headline}</h3>
							<DBButton onClick={handleClose} noText variant="ghost" icon="cross" />
						</div>
					)}
					{description && (
						<div className="modal__header-info">
							<DBIcon icon="information_circle" />
							<p>{description}</p>
						</div>
					)}
				</div>

				{children}
			</DBCard>
		</dialog>,
		document.body
	);
};
