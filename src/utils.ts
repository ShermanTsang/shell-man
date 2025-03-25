import * as fs from 'node:fs'
import * as path from 'node:path'
import * as process from 'node:process'
import { fileURLToPath } from 'node:url'

// Get package version from package.json
export function getPackageVersion(): string {
  try {
    // Handle path differently based on CommonJS or ESM
    let packageJsonPath

    if (typeof __dirname !== 'undefined') {
      // CommonJS
      packageJsonPath = path.resolve(__dirname, '..', 'package.json')
    }
    else {
      // ESM
      const __filename = fileURLToPath(import.meta.url)
      const __dirname = path.dirname(__filename)
      packageJsonPath = path.resolve(__dirname, '..', 'package.json')
    }

    if (fs.existsSync(packageJsonPath)) {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'))
      return packageJson.version || '1.0.0'
    }
    else {
      console.error('package.json not found at path:', packageJsonPath)
      return '1.0.0'
    }
  }
  catch (error) {
    console.error('Error reading package.json:', error)
    return '1.0.0' // Default version if package.json cannot be read
  }
}

// Check if the file is being executed directly
export function isDirectExecution(): boolean {
  return (
    import.meta.url === `file://${process.argv[1]}`
      || process.argv[1] === fileURLToPath(import.meta.url)
  )
}
