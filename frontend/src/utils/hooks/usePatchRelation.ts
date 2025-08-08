import { AxiosError, AxiosResponse } from 'axios';
import {
	patchRelation,
	PatchRelationParameters,
	PathRelationResponse
} from 'src/utils/fetch/patchRelation';
import { useApiHook } from 'src/utils/hooks/useApiHook';

type UsePatchRelationParameters = {
	onSuccess: (data: AxiosResponse<PathRelationResponse>) => void;
	onError?: (error: AxiosError) => void;
	onFinally?: () => void;
	executeImmediately?: boolean;
} & PatchRelationParameters;

/**
 * Simple custom hook to patch a specific Relation.
 */
export const usePatchRelation = (
	{
		relationId,
		type,
		properties,
		onSuccess,
		onError,
		onFinally,
		executeImmediately
	}: UsePatchRelationParameters,
	dependencies?: Array<unknown>
) => {
	return useApiHook<AxiosResponse<PathRelationResponse>, PatchRelationParameters>({
		executeImmediately: executeImmediately,
		onSuccess: onSuccess,
		onError: onError,
		onFinally: onFinally,
		dependencies: dependencies,
		fetchFunction: (parameters?: PatchRelationParameters) => {
			const params =
				typeof parameters === 'undefined'
					? { relationId: relationId, type: type, properties: properties }
					: {
							relationId: parameters.relationId,
							type: parameters.type,
							properties: parameters.properties
						};

			return patchRelation(params);
		}
	});
};
