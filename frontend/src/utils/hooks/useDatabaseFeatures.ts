import { useDatabaseStore } from 'src/stores/database';

export const useDatabaseFeatures = () => {
	const currentDatabase = useDatabaseStore((store) => store.currentDatabase);
	const databaseSupportsFunctions = useDatabaseStore((store) => store.databaseSupportsFunctions);
	const databaseSupportsTriggers = useDatabaseStore((store) => store.databaseSupportsTriggers);

	const hasFunctions = currentDatabase !== null && databaseSupportsFunctions(currentDatabase);
	const hasTriggers = currentDatabase !== null && databaseSupportsTriggers(currentDatabase);

	return { hasFunctions, hasTriggers };
};
