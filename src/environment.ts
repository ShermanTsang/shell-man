import * as os from 'node:os'
import * as path from 'node:path'
import * as process from 'node:process'
import { logger } from '@shermant/logger'
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
    logger.info.tag('\nEnvironment Information').data({
      'OS Type': info.osType,
      'OS Version': info.osVersion,
      'Architecture': info.architecture,
      'Shell Path': info.shellPath,
      'Shell Name': info.shellName,
    }).appendDivider().print()

    // Process information
    logger.info.tag('\nProcess Information').data({
      'Node Version': process.version,
      'Current Directory': process.cwd(),
      'Process ID': process.pid,
    }).appendDivider().print()

    // System information
    logger.info.tag('\nSystem Information').data({
      'Platform': process.platform,
      'CPU Cores': os.cpus().length,
      'Total Memory': `${Math.round(os.totalmem() / (1024 * 1024))} MB`,
      'Free Memory': `${Math.round(os.freemem() / (1024 * 1024))} MB`,
      'Uptime': `${Math.round(os.uptime() / 60)} minutes`,
      'Hostname': os.hostname(),
    }).appendDivider().print()

    // Selected environment variables
    logger.info.tag('\nSelected Environment Variables').data({
      PATH: process.env.PATH?.substring(0, 50) + (process.env.PATH && process.env.PATH.length > 50 ? '...' : ''),
      NODE_ENV: process.env.NODE_ENV,
      HOME: process.env.HOME || process.env.USERPROFILE,
      SHELL: process.env.SHELL,
      LANG: process.env.LANG,
      TERM: process.env.TERM,
      USER: process.env.USER || process.env.USERNAME,
    }).print()
  }

  if (text) {
    logger.info.tag('running mode').data(text).print()
  }
}
