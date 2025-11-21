import { FlatCompat } from '@eslint/eslintrc';
import js from '@eslint/js';
import typescriptEslint from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import { defineConfig } from 'eslint/config';
import prettier from 'eslint-plugin-prettier';
import react from 'eslint-plugin-react';
import simpleImportSort from 'eslint-plugin-simple-import-sort';
import globals from 'globals';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
	baseDirectory: __dirname,
	recommendedConfig: js.configs.recommended,
	allConfig: js.configs.all
});

export default defineConfig([
	{
		extends: compat.extends(
			'prettier',
			'plugin:react/recommended',
			'eslint:recommended',
			'plugin:@typescript-eslint/recommended'
		),

		plugins: {
			prettier,
			react,
			'@typescript-eslint': typescriptEslint,
			'simple-import-sort': simpleImportSort
		},

		languageOptions: {
			globals: {
				...globals.browser
			},

			parser: tsParser,
			ecmaVersion: 'latest',
			sourceType: 'module',

			parserOptions: {
				ecmaFeatures: {
					jsx: true
				}
			}
		},

		settings: {
			react: {
				version: 'detect'
			}
		},

		rules: {
			'simple-import-sort/imports': [
				'error',
				{
					groups: [['^\\u0000', '^@?\\w', '^[^.]', '^\\.']]
				}
			],

			'simple-import-sort/exports': 'error',
			'max-params': ['warn', 6],
			'prettier/prettier': ['error'],
			'linebreak-style': ['error', 'unix'],
			quotes: ['error', 'single'],
			semi: ['error', 'always'],

			'no-multiple-empty-lines': [
				'error',
				{
					max: 3,
					maxBOF: 1,
					maxEOF: 0
				}
			],

			'comma-dangle': ['error', 'never'],
			'jsx-quotes': ['error', 'prefer-double'],

			'react/function-component-definition': [
				'error',
				{
					namedComponents: 'arrow-function'
				}
			],

			'react/react-in-jsx-scope': 'off',
			'no-undef': 'off',
			'no-unused-vars': 'off',
			'prefer-destructuring': 'off',
			'object-curly-spacing': 'off',
			'arrow-parens': 'off',
			'capitalized-comments': 'off',
			'no-negated-condition': 'off',
			'no-mixed-spaces-and-tabs': 'off'
		}
	},
	{
		files: ['**/.eslintrc.{js,cjs}'],

		languageOptions: {
			globals: {
				...globals.node
			},

			ecmaVersion: 5,
			sourceType: 'commonjs'
		}
	}
]);
