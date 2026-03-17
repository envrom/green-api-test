import * as dotenv from 'dotenv';
import * as path from 'path';

// Load .env before any module that reads process.env is imported
dotenv.config({ path: path.resolve(__dirname, '.env') });

// Global throttle: GREEN-API enforces rate limits.
// A small pause between every test prevents 429 errors across the suite.
afterEach(async () => {
  await new Promise<void>(resolve => setTimeout(resolve, 600));
});
