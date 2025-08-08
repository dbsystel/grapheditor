import { DBTabPanelProps } from '@db-ux/react-core-components/dist/components/tab-panel/model';
import { GlobalComponentProps } from 'src/types/components';

export type TabPanelProps = DBTabPanelProps &
	GlobalComponentProps & {
		onTabClose?: () => void;
	};
