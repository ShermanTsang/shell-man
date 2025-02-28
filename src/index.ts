import * as os from 'os';
import * as path from 'path';

export interface EnvironmentInfo {
  osType: string;
  osVersion: string;
  architecture: string;
  shellPath: string;
  shellName: string;
}

interface ShellInfo {
  path: string;
  name: string;
}

function getShellInfo(): ShellInfo {
  if (process.platform === 'win32') {
    // Windows shell detection
    if (process.env.ComSpec) {
      const shellPath = process.env.ComSpec;
      const shellName = path.basename(shellPath).replace('.exe', '');
      return { path: shellPath, name: shellName };
    }
    
    if (process.env.PSModulePath) {
      return { path: 'powershell.exe', name: 'powershell' };
    }
    
    return { path: 'cmd.exe', name: 'cmd' };
  } else {
    // Unix-like shell detection
    const defaultShell = { path: '/bin/sh', name: 'sh' };
    
    if (!process.env.SHELL) {
      return defaultShell;
    }

    const shellPath = process.env.SHELL;
    const shellName = path.basename(shellPath);
    
    return { path: shellPath, name: shellName };
  }
}

export function getEnvironmentInfo(): EnvironmentInfo {
  const shellInfo = getShellInfo();
  
  return {
    osType: os.type(),
    osVersion: os.release(),
    architecture: os.arch(),
    shellPath: shellInfo.path,
    shellName: shellInfo.name
  };
}

const environmentInfo = getEnvironmentInfo();
console.log('Environment Information:');
console.log('=======================');
console.log(`OS Type: ${environmentInfo.osType}`);
console.log(`OS Version: ${environmentInfo.osVersion}`);
console.log(`Architecture: ${environmentInfo.architecture}`);
console.log(`Shell Path: ${environmentInfo.shellPath}`);
console.log(`Shell Name: ${environmentInfo.shellName}`);