import './NetworkGraphSearch.scss';
import { DBInput } from '@db-ux/react-core-components';
import { Attributes } from 'graphology-types';
import { ChangeEvent, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useGraphStore } from 'src/stores/graph';
import { useOutsideClick } from 'src/utils/hooks/useOutsideClick';

/**
 * Inspired by react-sigma SearchControl component.
 * @link https://github.com/sim51/react-sigma/blob/main/packages/core/src/components/controls/SearchControl.tsx
 */
export const NetworkGraphSearch = () => {
	const { t } = useTranslation();
	const [inputValue, setInputValue] = useState('');
	const [options, setOptions] = useState<Array<{ id: string; label: string }>>([]);
	const [isOptionsListVisible, setIsOptionsListVisible] = useState(false);
	const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
	const sigma = useGraphStore((store) => store.sigma);
	const rootElementRef = useOutsideClick<HTMLDivElement>({
		callback: () => {
			setIsOptionsListVisible(false);
		}
	});

	useEffect(() => {
		if (!selectedOptionId) {
			return;
		}

		sigma.getGraph().setNodeAttribute(selectedOptionId, 'highlighted', true);

		const nodeDisplayData = sigma.getNodeDisplayData(selectedOptionId);
		if (nodeDisplayData) {
			sigma.getCamera().animate(nodeDisplayData);
		} else console.warn(`Node ${selectedOptionId} not found`);

		return () => {
			sigma.getGraph().setNodeAttribute(selectedOptionId, 'highlighted', false);
		};
	}, [selectedOptionId]);

	const onInputChange = (event: ChangeEvent<HTMLInputElement>) => {
		const search = event.target.value.toLowerCase();
		const newOptions: Array<{ id: string; label: string }> = [];

		sigma.getGraph().forEachNode((nodeId: string, attributes: Attributes): void => {
			if (attributes.label && attributes.label.toLowerCase().includes(search)) {
				newOptions.push({ id: nodeId, label: attributes.label });
			}
		});

		setOptions(newOptions);
		setInputValue(event.target.value);
	};

	const onInputFocus = () => {
		setIsOptionsListVisible(true);
	};

	const onOptionClick = (nodeId: string) => {
		const matchingOption = options.find((option) => option.id === nodeId);

		if (matchingOption) {
			setSelectedOptionId(matchingOption.id);
			setInputValue(matchingOption.label);
			setIsOptionsListVisible(false);
			setOptions([]);
		} else {
			setSelectedOptionId(null);
		}
	};

	return (
		<div ref={rootElementRef} className="network-graph__search">
			<DBInput
				value={inputValue}
				type="text"
				placeholder={t('network_graph_search_placeholder')}
				onChange={onInputChange}
				onFocus={onInputFocus}
				validMessage=""
				invalidMessage=""
				label=""
			/>
			{options.length > 0 && isOptionsListVisible && (
				<ul className="network-graph__search-list">
					{options.map((option) => {
						return (
							<li
								className="network-graph__search-list-option"
								key={option.id}
								onClick={() => onOptionClick(option.id)}
							>
								{option.label}
							</li>
						);
					})}
				</ul>
			)}
		</div>
	);
};
