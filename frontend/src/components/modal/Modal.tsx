import './Modal.scss';
import clsx from 'clsx';
import { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { ModalProps } from './Modal.interfaces';

export const Modal = ({ children, isOpen, id, className, testId }: ModalProps) => {
	const [dialogRef, setDialogRef] = useState<HTMLDialogElement | null>(null);
	const rootElementClassName = clsx('modal', className);
	/**
	 * 	useCallback to prevent double calling of ref callback with null and the element
	 * 	@see https://legacy.reactjs.org/docs/refs-and-the-dom.html#caveats-with-callback-refs
	 */
	const onRefChange = useCallback((element: HTMLDialogElement | null) => {
		setDialogRef(element);
	}, []);

	/**
	 * We need the "dialogRef" to be an element reference in order to show/hide it.
	 */
	useEffect(() => {
		if (isOpen && dialogRef) {
			dialogRef.showModal();
		}
	}, [isOpen, dialogRef]);

	return createPortal(
		<dialog
			role="dialog"
			id={id}
			className={rootElementClassName}
			data-testid={testId}
			ref={onRefChange}
		>
			<div className="modal__content db-bg-color-basic-level-1">
				<div className="modal__inner-content">{children}</div>
			</div>
		</dialog>,
		document.body
	);
};
