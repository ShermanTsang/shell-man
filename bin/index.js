#!/usr/bin/env node

import * as process from 'node:process'
import { cli } from '../.output/dist/index.js'

// Run the CLI
cli().catch((err) => {
  console.error('Error running shellman:', err)
  process.exit(1)
})
