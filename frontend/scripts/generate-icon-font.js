import { cleanIcons, generateIconFonts } from '@db-ux/icon-font-tools';
import fs from 'fs';

// NOTE: relative paths are relative to where the script is called from
(async () => {
	const fontName = 'grapheditor-icon-font';
	const relativeIconsTargetPath = './src/assets/icons';
	const relativeCleanIconsPath = './clean-icons';

	// @see https://github.com/db-ux-design-system/icon-font-tools/blob/main/docs/API.md#clean-icons
	await cleanIcons({
		src: './src/assets/source-icons',
		out: relativeCleanIconsPath
	});

	// @see https://github.com/db-ux-design-system/icon-font-tools/blob/main/docs/API.md#generate-icon-fonts
	await generateIconFonts({
		fontName: fontName,
		src: relativeCleanIconsPath,
		ignore: ['**/node_modules/**'],
		variants: ['default'],
		withSizes: false
	});

	if (!fs.existsSync(relativeIconsTargetPath)) {
		fs.mkdirSync(relativeIconsTargetPath);
	} else {
		await fs
			.readdirSync(relativeIconsTargetPath)
			.forEach((file) => fs.rmSync(`${relativeIconsTargetPath}/${file}`, { recursive: true }));
	}

	fs.copyFileSync(`${relativeCleanIconsPath}/fonts/default/index.css`, `${relativeIconsTargetPath}/index.css`);
	fs.copyFileSync(`${relativeCleanIconsPath}/fonts/default/${fontName}.woff2`, `${relativeIconsTargetPath}/${fontName}.woff2`);
	fs.rmSync(relativeCleanIconsPath, { recursive: true });
})();
