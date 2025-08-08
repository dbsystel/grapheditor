import { getNodesViewportCoordinates } from 'src/components/network-graph/helpers';
import { Point } from 'src/models/graph';
import { NodeId } from 'src/models/node';
import { useContextMenuStore } from 'src/stores/context-menu';
import { useGraphStore } from 'src/stores/graph';
import { useNotificationsStore } from 'src/stores/notifications';
import { getFormattedCurrentDateTime, parseError } from 'src/utils/helpers/general';

export const exportNodesAndRelationsAsImageAction = async (
	nodeIds: Array<NodeId>,
	mimeType: string
) => {
	const className = 'context-menu-modal--export';
	const screenshotPadding = 10; //px
	const sigma = useGraphStore.getState().sigma;

	try {
		// request screen capture
		const stream = await navigator.mediaDevices.getDisplayMedia({
			video: true,
			// eslint-disable-next-line @typescript-eslint/ban-ts-comment
			// @ts-expect-error
			preferCurrentTab: true
		});

		// close the context menu so it is not visible in the screenshot
		useContextMenuStore.getState().close();
		// apply specific CSS needed for the export
		window.document.body.classList.add(className);

		// create video element to render stream
		const video = document.createElement('video');
		video.srcObject = stream;
		video.play();

		// wait for the video to start playing
		await new Promise<void>((resolve) => {
			video.onplaying = () => resolve();
		});

		/**
		 * "wait" until the browser permission dialog is gone and the browser sharing tab notification
		 * tab is pulled down completely. This is far from a perfect solution, but I couldn't find an
		 * event to which we could subscribe when browser permission dialog and browser notification
		 * tab are done/gone. Another idea was to observe browser resize for such changes, but this
		 * could be conflicted with user resizing the browser, so we will stick to the timeout variant.
		 *
		 * Since we want to do a screenshot, the window has to be still and free from other elements
		 * but our own.
		 */
		setTimeout(() => {
			// get current DPI
			const scale = window.devicePixelRatio;
			// check for sigma container viewport offset
			const sigmaContainerViewportOffset = sigma.getContainer().getBoundingClientRect();
			// get nodes viewport coordinates
			const nodesViewportCoordinates = getNodesViewportCoordinates(nodeIds);
			// variables for the most top-left and bottom-right coordinates
			const topLeft: Point = { x: Infinity, y: Infinity };
			const bottomRight: Point = { x: -Infinity, y: -Infinity };

			Object.values(nodesViewportCoordinates).forEach((value) => {
				if (value.topLeft.x < topLeft.x) {
					topLeft.x = value.topLeft.x;
				}
				if (value.topLeft.y < topLeft.y) {
					topLeft.y = value.topLeft.y;
				}
				if (value.bottomRight.x > bottomRight.x) {
					bottomRight.x = value.bottomRight.x;
				}
				if (value.bottomRight.y > bottomRight.y) {
					bottomRight.y = value.bottomRight.y;
				}
			});

			const topLeftTranslated: Point = {
				x: topLeft.x + sigmaContainerViewportOffset.left,
				y: topLeft.y + sigmaContainerViewportOffset.top
			};
			const bottomRightTranslated: Point = {
				x: bottomRight.x + sigmaContainerViewportOffset.left,
				y: bottomRight.y + sigmaContainerViewportOffset.top
			};

			// create a canvas element to draw the "screenshot" into
			const canvas = document.createElement('canvas');
			const context = canvas.getContext('2d');

			const x = topLeftTranslated.x - screenshotPadding;
			const y = topLeftTranslated.y - screenshotPadding;
			const width = bottomRightTranslated.x - topLeftTranslated.x + screenshotPadding * 2;
			const height = bottomRightTranslated.y - topLeftTranslated.y + screenshotPadding * 2;

			if (context) {
				canvas.style.width = width + 'px';
				canvas.style.height = height + 'px';
				canvas.width = width * scale;
				canvas.height = height * scale;
				context.scale(scale, scale);
				context.drawImage(
					video,
					x * scale,
					y * scale,
					width * scale,
					height * scale,
					0,
					0,
					width,
					height
				);

				const screenshotDataUrl = canvas.toDataURL(mimeType);
				const anchor = document.createElement('a');
				// mime type from data URL image presentation wasn't enough
				const fileExtension = mimeType.split('/')[1];

				anchor.setAttribute('href', screenshotDataUrl);
				anchor.setAttribute(
					'download',
					'export-' + getFormattedCurrentDateTime() + '.' + fileExtension
				);
				anchor.click();
				// remove manually created elements (garbage collector would probably clean this up,
				// but just to be sure)
				anchor.remove();
				canvas.remove();
			} else {
				console.error('Unable to get canvas context');
			}

			// stop all tracks from the stream (this will also remove the browser notification bar)
			stream.getTracks().forEach((track) => {
				track.stop();
			});
			// remove manually created element
			video.remove();

			window.document.body.classList.remove(className);
		}, 1000);
	} catch (error) {
		useContextMenuStore.getState().close();
		window.document.body.classList.remove(className);

		useNotificationsStore.getState().addNotification({
			title: parseError(error),
			type: 'critical'
		});
	}
};
