import { execSync } from 'child_process';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const repoRoot = resolve(__dirname, '../../../../..');

export default async function globalTeardown() {
	try {
		execSync('docker compose -f docker-compose.e2e-yml down -v', {
			stdio: 'inherit',
			cwd: repoRoot
		});
	} catch {
		// Container may already be gone
	}
}
