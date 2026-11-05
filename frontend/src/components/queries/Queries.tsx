import './Queries.scss';
import { DBButton, DBCard } from '@db-ux/react-core-components';
import clsx from 'clsx';
import { useTranslation } from 'react-i18next';
import { QueriesProp } from 'src/components/queries/Queries.interfaces';
import { HomepageQueriesList } from 'src/models/homepage';
import { isHomepageQueryGroup } from 'src/utils/helpers/homepage';

export const Queries = ({ queries, onPlayClick, id, className, testId }: QueriesProp) => {
	const { t } = useTranslation();
	const rootElementClassName = clsx('queries', className);

	const loopQueries = (queries: HomepageQueriesList) => {
		return queries.map((query, index) => {
			if (isHomepageQueryGroup(query)) {
				return (
					<div className="queries__group" key={index}>
						<h5 className="queries__group-title">{query.title}</h5>
						<div className="queries__group-content">{loopQueries(query.queries)}</div>
					</div>
				);
			} else {
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
			}
		});
	};

	return (
		<div id={id} className={rootElementClassName} data-testid={testId}>
			{loopQueries(queries)}
		</div>
	);
};
