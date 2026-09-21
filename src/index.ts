import { main } from './cli/main.js';
import { createIo } from './run/io.js';

process.exitCode = await main(process.argv.slice(2), process.env, createIo());
