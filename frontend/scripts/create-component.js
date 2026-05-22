import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const componentName = process.argv.slice(2).join(' ');

if (!componentName) {
	console.log('Usage: npm run create-component ComponentName');
	process.exit(1);
}

// Formatting
const pascalName = componentName
	.replace(/([a-z])([A-Z])/g, '$1 $2')
	.split(/[\s-_]+/)
	.filter((word) => word.length > 0)
	.map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
	.join('');

const folderName = pascalName
	.replace(/([A-Z])/g, '-$1')
	.replace(/(\d+)/g, '-$1')
	.toLowerCase()
	.replace(/^-/, '');

// Create folder
const componentDir = path.join(__dirname, '..', 'src', 'components', folderName);
fs.mkdirSync(componentDir, { recursive: true });

// File templates
const tsxContent = `import './${pascalName}.scss';
import clsx from 'clsx';
import { ${pascalName}Props } from './${pascalName}.interfaces';

export const ${pascalName} = ({ id, className, testId }: ${pascalName}Props) => {
	const rootElementClassName = clsx('${folderName}', className);

	return (
		<div className={rootElementClassName} id={id} data-testid={testId}>
			<h2>${pascalName}</h2>
		</div>
	);
};
`;

const scssContent = `.${folderName} {
  // styles for ${pascalName} component
}`;

const interfacesContent = `import { GlobalComponentProps } from 'src/types/components';

export type ${pascalName}Props = GlobalComponentProps & {
	// define props here
};
`;

const testsContent = `import { describe, it } from 'vitest';
import { render } from 'vitest-browser-react';
import { ${pascalName} } from './${pascalName}';

describe('Components ${pascalName}', () => {
	it('renders correctly', async () => {
		const screen = await render(<${pascalName} />);

		const heading = screen.getByText('${pascalName}');
		expect(heading).toBeInTheDocument();
	});
});
`;

// Create Files
fs.writeFileSync(path.join(componentDir, `${pascalName}.tsx`), tsxContent);
fs.writeFileSync(path.join(componentDir, `${pascalName}.scss`), scssContent);
fs.writeFileSync(path.join(componentDir, `${pascalName}.interfaces.ts`), interfacesContent);
fs.writeFileSync(path.join(componentDir, `${pascalName}.test.tsx`), testsContent);
