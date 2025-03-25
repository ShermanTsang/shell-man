import * as os from 'node:os'
import * as path from 'node:path'
import * as process from 'node:process'
import type ora from 'ora'
import type { EnvironmentInfo, ShellInfo } from './types'

function getShellInfo(): ShellInfo {
  if (process.platform === 'win32') {
    // Windows shell detection
    if (process.env.ComSpec) {
      const shellPath = process.env.ComSpec
      const shellName = path.basename(shellPath).replace('.exe', '')
      return { path: shellPath, name: shellName }
    }

    if (process.env.PSModulePath) {
      return { path: 'powershell.exe', name: 'powershell' }
    }

    return { path: 'cmd.exe', name: 'cmd' }
  }
  else {
    // Unix-like shell detection
    const defaultShell = { path: '/bin/sh', name: 'sh' }

    if (!process.env.SHELL) {
      return defaultShell
    }

    const shellPath = process.env.SHELL
    const shellName = path.basename(shellPath)

    return { path: shellPath, name: shellName }
  }
}

export function getEnvironmentInfo(): EnvironmentInfo {
  const shellInfo = getShellInfo()

  return {
    osType: os.type(),
    osVersion: os.release(),
    architecture: os.arch(),
    shellPath: shellInfo.path,
    shellName: shellInfo.name,
  }
}

export async function gatherEnvironmentInfo(
  spinner?: ReturnType<typeof ora>,
): Promise<EnvironmentInfo> {
  if (spinner) {
    spinner.text = 'Gathering environment information...'
  }

  // Simulate a small delay to show the spinner (for better UX)
  await new Promise(resolve => setTimeout(resolve, 800))

  return getEnvironmentInfo()
}

export function displayEnvironmentInfo(
  info: EnvironmentInfo,
  text?: string,
  debug = false,
) {
  if (debug) {
    console.log('\nEnvironment Information:')
    console.log('=======================')
    console.log(`OS Type: ${info.osType}`)
    console.log(`OS Version: ${info.osVersion}`)
    console.log(`Architecture: ${info.architecture}`)
    console.log(`Shell Path: ${info.shellPath}`)
    console.log(`Shell Name: ${info.shellName}`)

    console.log('\nDebug Information:')
    console.log('=======================')

    // Process information
    console.log('\nProcess Information:')
    console.log(`  Node Version: ${process.version}`)
    console.log(`  Current Directory: ${process.cwd()}`)
    console.log(`  Process ID: ${process.pid}`)

    // System information
    console.log('\nSystem Information:')
    console.log(`  Platform: ${process.platform}`)
    console.log(`  CPU Cores: ${os.cpus().length}`)
    console.log(
            `  Total Memory: ${Math.round(os.totalmem() / (1024 * 1024))} MB`,
    )
    console.log(
            `  Free Memory: ${Math.round(os.freemem() / (1024 * 1024))} MB`,
    )
    console.log(`  Uptime: ${Math.round(os.uptime() / 60)} minutes`)
    console.log(`  Hostname: ${os.hostname()}`)

    // Selected environment variables
    console.log('\nSelected Environment Variables:')
    const relevantEnvVars = [
      {
        key: 'PATH',
        value:
                    process.env.PATH?.substring(0, 50)
                    + (process.env.PATH && process.env.PATH.length > 50 ? '...' : ''),
      },
      { key: 'NODE_ENV', value: process.env.NODE_ENV },
      { key: 'HOME', value: process.env.HOME || process.env.USERPROFILE },
      { key: 'SHELL', value: process.env.SHELL },
      { key: 'LANG', value: process.env.LANG },
      { key: 'TERM', value: process.env.TERM },
      { key: 'USER', value: process.env.USER || process.env.USERNAME },
    ]

    for (const { key, value } of relevantEnvVars) {
      if (value) {
        console.log(`  ${key}: ${value}`)
      }
    }
  }

  if (text) {
    console.log(text)
  }
}
