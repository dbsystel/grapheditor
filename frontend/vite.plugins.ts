import babel from '@babel/core';
import parser from '@babel/parser';
import { constants } from 'buffer';
import { execFileSync, execSync } from 'child_process';
import type { Plugin } from 'vite';

// match .tsx files only inside out project's "src" directory
const fileRegex = /frontend\/src\/.+.tsx$/;

/**
 * Custom Vite plugin to remove "data-testid" attribute in production.
 * Inspired by https://github.com/l-mbert/vite-plugin-react-remove-attributes/tree/main (didn't
 * work with our current Vite setup) and https://stackoverflow.com/questions/78787002/how-does-ast-traversal-with-babel-affect-source-maps-even-when-no-changes-are-ma.
 *
 * I'm not 100% sure how this is working, please don't ask me any questions.
 */
export function removeDataTestIdAttribute(): Plugin {
	return {
		name: 'vite-plugin-remove-data-testid-attribute',
		apply: 'build',
		transform(codeAsString, filePath) {
			if (process.env.NODE_ENV === 'production') {
				if (fileRegex.test(filePath)) {
					const ast = parser.parse(codeAsString, { sourceType: 'module' });

					babel.traverse(ast, {
						ObjectExpression(path) {
							if (path.type === 'ObjectExpression') {
								path.node.properties = path.node.properties.filter((property) => {
									// apparently, this is the correct way to remove attributes (the property.type
									// can be any of dozens of options, this one seems to be working fine ¯\(°_o)/¯)
									if (
										property.type === 'ObjectProperty' &&
										'key' in property &&
										'value' in property.key &&
										property.key.value === 'data-testid'
									) {
										return false;
									}

									return true;
								});
							}
						}
					});

					const babelFileResult = babel.transformFromAstSync(ast, codeAsString, {
						sourceMaps: true
					});

					if (babelFileResult && babelFileResult.code !== null) {
						return {
							code: babelFileResult.code,
							map: babelFileResult.map
						};
					}
				}
			}

			return {
				code: codeAsString,
				map: null
			};
		}
	};
}

/**
 * Custom Vite plugin to process dependency licenses. If the "--allow" argument is defined, the generated file will contain
 * packages not matching allowed licenses, otherwise the plugin will print dependency licenses used by the application.
 * For more info please visit https://github.com/tmorell/license-compliance
 *
 * An alternative would be to use "rollup-plugin-license" package. Since some packages weren't listed as dependency
 * (maybe due to custom license?), we will stick to the current solution.
 */
export function processLicenses(): Plugin {
	return {
		name: 'vite-plugin-custom-process-licenses',
		apply: 'build',
		writeBundle() {
			try {
				execSync(
					'license-compliance --report=detailed --format=json --direct --allow="MIT;Apache-2.0;BSD-3-Clause;ISC" > dist/license-conflicts.json',
					{
						encoding: 'utf-8'
					}
				);
			} catch (error: unknown) {
				console.warn(parseNodeJsError(error));
			}
		}
	};
}

export function generateSbom(): Plugin {
	return {
		name: 'vite-plugin-generate-bom',
		apply: 'build',
		writeBundle() {
			try {
				execFileSync(
					process.execPath,
					[
						'./node_modules/@cyclonedx/cyclonedx-npm/bin/cyclonedx-npm-cli.js',
						'--output-format',
						'JSON',
						'--output-file',
						'sbom.json'
					],
					{ stdio: ['ignore', 'pipe', 'ignore'], encoding: 'utf8', maxBuffer: constants.MAX_LENGTH }
				);
			} catch (error: unknown) {
				console.warn(parseNodeJsError(error));
			}
		}
	};
}

const parseNodeJsError = (error: unknown) => {
	if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string') {
		return error.message;
	} else {
		return JSON.stringify(error);
	}
};
