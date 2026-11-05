import { FullConfig } from '@playwright/test';
import { execSync } from 'child_process';
import dotenv from 'dotenv';
import { dirname, resolve } from 'path';
import { endpoints } from 'src/utils/endpoints';
import { fileURLToPath } from 'url';

const isLocalhost = (host: string) => {
	return host.includes('//localhost:');
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const repoRoot = resolve(__dirname, '../../../..');
const env = dotenv.config({ path: resolve(repoRoot, '.env') }).parsed || {};

const neo4jContainer = 'neo4j-enterprise-e2e';
const defaultDatabase = 'neo4j';
const logTailLength = 100;
const additionalDatabase = 'testdatabase'; // "neo4j" database is created by default, leave the database name lowercase and without special characters
// The dotenv library does not resolve variable references like ${...} — it reads them as literal strings. Another solution would be to use dotenv-expand package.
const neo4jBolt = env.E2E_NEO4J_BOLT_LISTEN_ADDRESS;
const host = env.E2E_GUI_NEO4J.replace('${E2E_NEO4J_BOLT_LISTEN_ADDRESS}', neo4jBolt);
const username = env.E2E_GUI_USER;
const password = env.E2E_GUI_PASSWORD;
const apiEndpoint = `http://localhost:${env.E2E_GUI_PORT}/api`;
// https://talyian.github.io/ansicolors/
const logColors = {
	default: '\x1b[0m',
	red: '\x1b[31m',
	green: '\x1b[32m',
	blue: '\x1b[34m',
	cyan: '\x1b[36m'
};
let sessionHeaders = {};
let startTime = 0;

export default async function globalSetup(config: FullConfig) {
	const write = (message: string) => {
		startTime = performance.now();
		process.stdout.write(`${message}...`);
	};

	const writeDone = () => {
		const elapsed = ((performance.now() - startTime) / 1000).toFixed(1);
		process.stdout.write(logColors.green + 'done ');
		process.stdout.write(logColors.blue + `${elapsed}s\n` + logColors.default);
	};

	const startNeo4J = () => {
		// // --wait blocks until healthcheck passes, --force-recreate ensures the container is always freshly created,
		// // even if one already exists (--force-recreate is also needed because of neo4j triggers and/or functions installation)
		// execSync('docker compose -f docker-compose-e2e.yml up -d --wait --force-recreate', {
		// 	stdio: 'inherit',
		// 	cwd: repoRoot
		// });

		// --wait blocks until healthcheck passes
		execSync('docker compose -f docker-compose-e2e.yml up -d --wait', {
			stdio: 'inherit',
			cwd: repoRoot
		});
	};

	const createAdditionalDatabase = () => {
		write(`Create additional database "${additionalDatabase}"`);

		execSync(
			`docker exec ${neo4jContainer} cypher-shell -u ${username} -p ${password} -d system "CREATE DATABASE ${additionalDatabase} IF NOT EXISTS;"`,
			{ stdio: 'inherit' }
		);

		writeDone();
	};

	const waitForDatabasesToBeOnline = () => {
		write('Wait for databases to come online');

		// proposed by AI, doesn't look like a reliable solution to check if databases are online
		execSync('ping -n 5 127.0.0.1 > nul', { stdio: 'pipe' });

		writeDone();
	};

	const seedDatabase = async (database: string) => {
		write(`Seeding database "${database}"`);

		const response = await fetch(
			`${apiEndpoint}/v1/dev/reset?host=${host}&database=${database}`,
			{
				headers: sessionHeaders
			}
		);

		if (!response.ok) {
			throw new Error(`/dev/reset failed: ${response.status} ${await response.text()}`);
		}

		writeDone();
	};

	const switchToDatabase = async (database: string) => {
		write(`Switching to database "${database}"`);

		const switchDb = await fetch(`${apiEndpoint}${endpoints.getDatabasesCurrentPath()}`, {
			method: 'POST',
			headers: sessionHeaders,
			body: JSON.stringify({ name: database })
		});

		if (!switchDb.ok) {
			throw new Error(
				`Switch to ${database} failed: ${switchDb.status} ${await switchDb.text()}`
			);
		}

		writeDone();
	};

	const logIn = async () => {
		write('Log in in to backend');

		// log in to the backend to establish a session
		const loginResponse = await fetch(`${apiEndpoint}${endpoints.getLoginPath()}`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				host: `neo4j://localhost:${neo4jBolt}`,
				username: username,
				password: password
			})
		});

		if (!loginResponse.ok) {
			throw new Error(`Login failed: ${loginResponse.status} ${await loginResponse.text()}`);
		}

		const body = await loginResponse.json();
		const tabId = body.tabId; // server always generates its own tab id

		// getSetCookie() returns each Set-Cookie header individually (Node/undici >= 18.14)
		const setCookies = loginResponse.headers.getSetCookie?.() ?? [];
		const cookiePairs = setCookies.map((cookie) => cookie.split(';')[0]);

		// store the session cookie for subsequent requests
		sessionHeaders = {
			'x-tab-id': tabId,
			'Content-Type': 'application/json',
			...(cookiePairs.length ? { Cookie: cookiePairs.join('; ') } : {})
		};

		writeDone();
	};

	if (isLocalhost(host)) {
		try {
			// 1. Start Neo4j via docker compose
			startNeo4J();
			// 2. Wait for databases to come online
			waitForDatabasesToBeOnline();
			// 3. Log in in to backend
			await logIn();
			// 8. Switch back to the default database
			await switchToDatabase(defaultDatabase);
			// 4. Seed the default database via /dev/reset
			await seedDatabase(defaultDatabase);
			// 5. Create additional database
			createAdditionalDatabase();
			// 6. Switch to the other database
			await switchToDatabase(additionalDatabase);
			// 7. Seed the other database via /dev/reset
			await seedDatabase(additionalDatabase);
			// 8. Switch back to the default database
			await switchToDatabase(defaultDatabase);
		} catch (error) {
			console.error(
				logColors.red +
					'\nE2E setup failed. Dumping container logs and tearing down...' +
					logColors.default
			);

			try {
				// Dump container logs for debugging
				process.stdout.write(
					logColors.cyan +
						`--- Neo4j logs (tail ${logTailLength}) ---` +
						logColors.default
				);
				execSync(`docker logs ${neo4jContainer} --tail ${logTailLength}`, {
					stdio: 'inherit'
				});

				process.stdout.write(
					logColors.cyan +
						`--- Backend logs (tail ${logTailLength}) ---` +
						logColors.default
				);
				execSync(`docker logs grapheditor-backend-e2e --tail ${logTailLength}`, {
					stdio: 'inherit'
				});
			} catch {
				// Logging failed — continue with teardown
			}

			try {
				execSync('docker compose -f docker-compose-e2e.yml down -v', {
					stdio: 'inherit',
					cwd: repoRoot
				});
			} catch {
				// Teardown failed — nothing more we can do
			}

			throw error;
		}
	} else {
		process.stdout.write(
			logColors.green +
				'Remote host detected, skipping local neo4j + backend container setup' +
				logColors.default
		);
	}
}
