import { DBSection } from '@db-ux/react-core-components';
import { DatabaseMenuProps } from './DataBaseMenu.interfaces';
import { DatabaseMenuSelector } from './selector/DatabaseMenuSelector';
import clsx from 'clsx';
import { DatabaseMenuLoginInfo } from './login-info/DatabaseMenuLoginInfo';
import { DatabaseMenuHost } from './host/DatabaseMenuHost';
import './DatabaseMenu.scss';
import { ErrorBoundary } from 'src/components/error-boundary/ErrorBoundary';

export const DatabaseMenu = ({ id, className, testId }: DatabaseMenuProps) => {
	const rootElementClassName = clsx('database-menu', className);

	return (
		<DBSection className={rootElementClassName} id={id} data-testid={testId} spacing="none">
			<DatabaseMenuHost />

			<ErrorBoundary>
				<DatabaseMenuSelector />
			</ErrorBoundary>

			<DatabaseMenuLoginInfo />
		</DBSection>
	);
};
