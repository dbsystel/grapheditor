import { Content } from 'src/components/content/Content';
import { ErrorBoundary } from 'src/components/error-boundary/ErrorBoundary';
import { HomepageBody } from 'src/components/homepage-body/HomepageBody';
import { LeftWidget } from 'src/components/left-widget/LeftWidget';
import { RightWidget } from 'src/components/right-widget/RightWidget';
import { useApplicationStore } from 'src/stores/application';

// This component doesn't need global component props since it serves to render
// different layouts based on the view type
export const Body = () => {
	const isHomepageView = useApplicationStore((store) => store.isHomepageView);

	if (isHomepageView) {
		return (
			<>
				<HomepageBody />
				<RightWidget shouldRenderNextSteps={false} />
			</>
		);
	}

	return (
		<>
			<LeftWidget />

			<ErrorBoundary>
				<Content />
			</ErrorBoundary>

			<RightWidget />
		</>
	);
};
