import { useEffect } from 'react';
import { WheelCoords } from 'sigma/types';
import { StateManager } from 'src/components/network-graph/state-manager';
import { useGraphStore } from 'src/stores/graph';

/**
 * Lets the user adjust "autoPanSpeed" (used by node-drag auto-panning, see "NetworkGraphDragNodes")
 * via Ctrl+Alt + mouse wheel. Mirrors "NetworkGraphZoomFactor"/"NetworkGraphScaleNodes": subscribes
 * to the state-manager's "autoPanSpeed" state and resets the state machine back to IDLE once the
 * adjustment is applied, since the wheel gesture is discrete (not continuous).
 */
export const NetworkGraphAutoPanSpeed = () => {
	useEffect(() => {
		StateManager.getInstance().subscribe('autoPanSpeed', onAutoPanSpeed);

		return () => {
			StateManager.getInstance().unsubscribe('autoPanSpeed', onAutoPanSpeed);
		};
	}, []);

	const onAutoPanSpeed = (event: WheelCoords) => {
		if (event.delta === 0) {
			return;
		}

		const {
			sigma,
			autoPanSpeed,
			setAutoPanSpeed,
			autoPanSpeedStep,
			autoPanSpeedMin,
			autoPanSpeedMax
		} = useGraphStore.getState();

		// stop Sigma's own built-in wheel-zoom (handleWheel has no modifier-key awareness and would
		// otherwise zoom the camera on every wheel event, including this Ctrl+Alt gesture)
		sigma.getCamera().disable();

		let newAutoPanSpeed =
			autoPanSpeed + (event.delta > 0 ? autoPanSpeedStep : -autoPanSpeedStep);
		newAutoPanSpeed = Math.min(Math.max(newAutoPanSpeed, autoPanSpeedMin), autoPanSpeedMax);

		setAutoPanSpeed(newAutoPanSpeed);

		/**
		 * Unlike zoom-factor/scale-nodes, changing "autoPanSpeed" never causes Sigma to re-render,
		 * so "sigma.once('afterRender', ...)" would never fire and its listener would pile up on
		 * every wheel tick (leading to a MaxListenersExceededWarning). A plain macrotask delay is
		 * enough to re-enable the camera right after Sigma's own (now-blocked) wheel-zoom logic has
		 * run for this event.
		 */
		setTimeout(() => {
			sigma.getCamera().enable();
			StateManager.getInstance().resetState();
		});
	};

	return null;
};
