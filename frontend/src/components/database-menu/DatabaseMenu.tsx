import './DatabaseMenu.scss';
import { DBSection } from '@db-ux/react-core-components';
import clsx from 'clsx';
import { ApplicationLoadingIndicator } from 'src/components/application-loading-indicator/ApplicationLoadingIndicator';
import { ErrorBoundary } from 'src/components/error-boundary/ErrorBoundary';
import { DatabaseMenuProps } from './DataBaseMenu.interfaces';
import { DatabaseMenuHost } from './host/DatabaseMenuHost';
import { DatabaseMenuLoginInfo } from './login-info/DatabaseMenuLoginInfo';
import { DatabaseMenuSelector } from './selector/DatabaseMenuSelector';

export const DatabaseMenu = ({ id, className, testId }: DatabaseMenuProps) => {
	const rootElementClassName = clsx('database-menu', className);

	return (
		<DBSection className={rootElementClassName} id={id} data-testid={testId} spacing="none">
			<ApplicationLoadingIndicator />

			<DatabaseMenuHost />

			<ErrorBoundary>
				<DatabaseMenuSelector />
			</ErrorBoundary>

			<DatabaseMenuLoginInfo />
		</DBSection>
	);
};
