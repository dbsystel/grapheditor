import './Queries.scss';
import { DBButton, DBCard } from '@db-ux/react-core-components';
import clsx from 'clsx';
import { useTranslation } from 'react-i18next';
import { QueriesProp } from 'src/components/queries/Queries.interfaces';

export const Queries = ({ queries, onPlayClick, id, className, testId }: QueriesProp) => {
	const { t } = useTranslation();
	const rootElementClassName = clsx('queries', className);

	return (
		<div id={id} className={rootElementClassName} data-testid={testId}>
			{queries.map((query, index) => {
				return (
					<DBCard className="queries__card" spacing="large" key={index}>
						<h6>{t(query.title)}</h6>
						<div className="queries__card-content">
							<p>{t(query.description)}</p>
							<DBButton
								icon="play"
								variant="brand"
								noText={true}
								onClick={() => onPlayClick(query)}
							/>
						</div>
					</DBCard>
				);
			})}
		</div>
	);
};
