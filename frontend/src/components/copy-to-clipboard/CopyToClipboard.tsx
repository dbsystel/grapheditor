import './CopyToClipboard.scss';
import { DBButton, DBTooltip } from '@db-ux/react-core-components';
import clsx from 'clsx';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useClipboardStore } from 'src/stores/clipboard';
import { copyTextToClipboard } from 'src/utils/helpers/general';
import { CopyToClipboardProps } from './CopyToClipboard.interfaces';

/**
 * Simple component with integrated "copy to clipboard" functionality.
 * It renders an icon which, when clicked, copies given text to clipboard.
 */
export const CopyToClipboard = ({
	text,
	nodes,
	relations,
	id,
	className,
	testId
}: CopyToClipboardProps) => {
	const { t } = useTranslation();
	const [copyConfirmationText, setCopyConfirmationText] = useState<string>('');
	const { writeToClipboard } = useClipboardStore((store) => store);
	const rootElementClassName = clsx('copy-to-clipboard', className);

	const copyFunction = () => {
		if (text) {
			copyTextToClipboard(text);
		} else if (nodes || relations) {
			writeToClipboard(nodes || [], relations || []);
		}
		setCopyConfirmationText(t('clipboard_items_copied'));
	};

	const deleteLastClickedText = () => {
		setCopyConfirmationText('');
	};

	return (
		<DBButton
			id={id}
			className={rootElementClassName}
			data-testid={testId}
			noText
			icon="copy"
			variant="ghost"
			onClick={copyFunction}
			onMouseLeave={deleteLastClickedText}
			role="button"
			size="small"
		>
			{copyConfirmationText && (
				<DBTooltip showArrow={false} width="fixed">
					{copyConfirmationText}
				</DBTooltip>
			)}
		</DBButton>
	);
};
