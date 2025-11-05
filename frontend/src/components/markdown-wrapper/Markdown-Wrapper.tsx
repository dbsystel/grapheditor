import './MarkdownWrapper.scss';
import clsx from 'clsx';
import Markdown from 'react-markdown';
import { MarkdownWrapperProps } from './MarkdownWrapper.interfaces';

/**
 * This is a wrapper component of the react-markdown's Markdown component.
 * It enables us to have a better visual (CSS) and structural (HTML) control of the rendered markdown.
 */
export const MarkdownWrapper = ({ id, className, testId, ...rest }: MarkdownWrapperProps) => {
	const rootElementClassName = clsx('markdown-wrapper', className);

	return (
		<div id={id} className={rootElementClassName} data-testid={testId}>
			<Markdown {...rest} />
		</div>
	);
};
