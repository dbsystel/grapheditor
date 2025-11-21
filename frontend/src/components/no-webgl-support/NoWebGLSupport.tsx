export const NoWebGLSupport = () => {
	return (
		<div
			style={{
				display: 'flex',
				justifyContent: 'center',
				alignItems: 'center',
				height: '100dvh'
			}}
		>
			<p style={{ margin: 0, padding: 0 }}>
				This application requires WebGL to run properly. Please enable WebGL in your browser
				settings, or use hardware which supports WebGL.
			</p>
		</div>
	);
};
