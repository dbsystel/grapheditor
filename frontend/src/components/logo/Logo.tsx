import './Logo.scss';
import clsx from 'clsx';
import { useTranslation } from 'react-i18next';
import { LogoProps } from './Logo.interfaces';

export const Logo = ({ title, alt, onClick, id, className, testId }: LogoProps) => {
	const { t } = useTranslation();
	const rootElementClassName = clsx('logo', className);

	return (
		<img
			id={id}
			className={rootElementClassName}
			src="api/files/logo.png"
			alt={t(alt || 'customer_logo_alt_text')}
			title={t(title || 'customer_logo_title_text')}
			data-testid={testId}
			onClick={onClick}
		/>
	);
};
