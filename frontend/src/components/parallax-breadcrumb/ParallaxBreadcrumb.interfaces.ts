import { ParallaxHistory } from 'src/stores/parallax';
import { GlobalComponentProps } from 'src/types/components';

export type ParallaxBreadcrumbProps = GlobalComponentProps & {
	index: number;
	historyEntry?: ParallaxHistory;
};
