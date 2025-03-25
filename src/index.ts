// Re-export types and functions from modular files
import { fileURLToPath } from 'node:url'
import * as process from 'node:process'
import { logger } from '@shermant/logger'
import { cli } from './cli'

// Public API exports
export type { EnvironmentInfo } from './types'
export { getEnvironmentInfo } from './environment'
export { cli } from './cli'

// Run the program if this file is executed directly
if (
  import.meta.url === `file://${process.argv[1]}`
    || process.argv[1] === fileURLToPath(import.meta.url)
) {
  const isDebug
    = process.argv.includes('--debug') || process.argv.includes('-d')
  if (isDebug)
    logger.info.tag('Running CLI from direct execution').data('').print()
  cli().catch((err) => {
    logger.error.tag('Unhandled error').data(err).print()
    process.exit(1)
  })
}
