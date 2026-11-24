import { fileURLToPath } from 'node:url';
import { createPrototypeServer } from './server.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const port = Number(process.env.PORT || 5173);
createPrototypeServer({ root }).listen(port, '127.0.0.1', () => console.log(`Legionnaires: http://127.0.0.1:${port}`));
