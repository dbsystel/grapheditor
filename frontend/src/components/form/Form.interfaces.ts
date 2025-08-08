import { FormEventHandler, ReactNode } from 'react';
import { GlobalComponentProps } from 'src/types/components';

export type FormProps = GlobalComponentProps & {
	onSubmit?: FormEventHandler<HTMLFormElement>;
	/**
	 * Prevent submission form submission (e.g. when hitting the "Enter" key).
	 * @see https://www.w3.org/TR/2018/SPSD-html5-20180327/forms.html#implicit-submission
	 * 4.10.22.2 Implicit submission
	 *
	 * TODO check if it work properly on all supported browsers and platforms
	 */
	disableImplicitSubmission?: boolean;
	children?: ReactNode;
};
