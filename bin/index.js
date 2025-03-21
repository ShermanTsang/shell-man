#!/usr/bin/env node

import { cli } from '../.output/dist/index.js';

// Run the CLI
cli().catch(err => {
  console.error('Error running shellman:', err);
  process.exit(1);
});
