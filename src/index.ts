import * as os from "os";
import * as path from "path";
import * as readline from "readline";
import * as fs from "fs";

export interface EnvironmentInfo {
  osType: string;
  osVersion: string;
  architecture: string;
  shellPath: string;
  shellName: string;
  debug?: boolean;
}

interface ShellInfo {
  path: string;
  name: string;
}

// Get package version from package.json
function getPackageVersion(): string {
  try {
    const packageJsonPath = path.resolve(path.dirname(path.dirname(new URL(import.meta.url).pathname)), 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    return packageJson.version || '1.0.0';
  } catch (error) {
    return '1.0.0'; // Default version if package.json cannot be read
  }
}

function getShellInfo(): ShellInfo {
  if (process.platform === "win32") {
    // Windows shell detection
    if (process.env.ComSpec) {
      const shellPath = process.env.ComSpec;
      const shellName = path.basename(shellPath).replace(".exe", "");
      return { path: shellPath, name: shellName };
    }

    if (process.env.PSModulePath) {
      return { path: "powershell.exe", name: "powershell" };
    }

    return { path: "cmd.exe", name: "cmd" };
  } else {
    // Unix-like shell detection
    const defaultShell = { path: "/bin/sh", name: "sh" };

    if (!process.env.SHELL) {
      return defaultShell;
    }

    const shellPath = process.env.SHELL;
    const shellName = path.basename(shellPath);

    return { path: shellPath, name: shellName };
  }
}

export function getEnvironmentInfo(debug = false): EnvironmentInfo {
  const shellInfo = getShellInfo();

  return {
    osType: os.type(),
    osVersion: os.release(),
    architecture: os.arch(),
    shellPath: shellInfo.path,
    shellName: shellInfo.name,
    debug,
  };
}

function displayEnvironmentInfo(text?: string, debug = false) {
  const environmentInfo = getEnvironmentInfo(debug);
  
  console.log("Environment Information:");
  console.log("=======================");
  console.log(`OS Type: ${environmentInfo.osType}`);
  console.log(`OS Version: ${environmentInfo.osVersion}`);
  console.log(`Architecture: ${environmentInfo.architecture}`);
  console.log(`Shell Path: ${environmentInfo.shellPath}`);
  console.log(`Shell Name: ${environmentInfo.shellName}`);
  
  if (debug) {
    console.log("\nDebug Information:");
    console.log("=======================");
    
    // Process information
    console.log("\nProcess Information:");
    console.log(`  Node Version: ${process.version}`);
    console.log(`  Current Directory: ${process.cwd()}`);
    console.log(`  Process ID: ${process.pid}`);
    
    console.log("\n  Process Arguments:");
    process.argv.forEach((arg, index) => {
      console.log(`    ${index}: ${arg}`);
    });
    
    // System information
    console.log("\nSystem Information:");
    console.log(`  Platform: ${process.platform}`);
    console.log(`  CPU Cores: ${os.cpus().length}`);
    console.log(`  Total Memory: ${Math.round(os.totalmem() / (1024 * 1024))} MB`);
    console.log(`  Free Memory: ${Math.round(os.freemem() / (1024 * 1024))} MB`);
    console.log(`  Uptime: ${Math.round(os.uptime() / 60)} minutes`);
    console.log(`  Hostname: ${os.hostname()}`);
    
    // Selected environment variables
    console.log("\nSelected Environment Variables:");
    const relevantEnvVars = [
      { key: "PATH", value: process.env.PATH?.substring(0, 50) + (process.env.PATH && process.env.PATH.length > 50 ? "..." : "") },
      { key: "NODE_ENV", value: process.env.NODE_ENV },
      { key: "HOME", value: process.env.HOME || process.env.USERPROFILE },
      { key: "SHELL", value: process.env.SHELL },
      { key: "LANG", value: process.env.LANG },
      { key: "TERM", value: process.env.TERM },
      { key: "USER", value: process.env.USER || process.env.USERNAME },
    ];
    
    for (const {key, value} of relevantEnvVars) {
      if (value) {
        console.log(`  ${key}: ${value}`);
      }
    }
  }
  
  if (text) {
    console.log("\nUser Input:");
    console.log("=======================");
    console.log(text);
  }
}

function displayVersion() {
  const version = getPackageVersion();
  console.log(`shellman v${version}`);
}

function displayHelp() {
  console.log("Usage: shellman [options] [text]");
  console.log("");
  console.log("Options:");
  console.log("  --version, -v     Display the version of the program");
  console.log("  --help, -h        Display this help message");
  console.log("  --debug, -d       Display debug information");
  console.log("");
  console.log("Examples:");
  console.log("  shellman                     Interactive mode, prompts for text input");
  console.log("  shellman Hello World         Displays environment info with 'Hello World' as input");
  console.log("  shellman -v                  Displays the program version");
  console.log("  shellman -d Hello World      Displays environment and debug info with 'Hello World' as input");
}

// Parse command line arguments
function parseArgs(args: string[]): { 
  showVersion: boolean; 
  showHelp: boolean; 
  debug: boolean;
  text: string | null; 
} {
  const result = {
    showVersion: false,
    showHelp: false,
    debug: false,
    text: null as string | null
  };
  
  const textParts: string[] = [];
  
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    if (arg === '--version' || arg === '-v') {
      result.showVersion = true;
    } else if (arg === '--help' || arg === '-h') {
      result.showHelp = true;
    } else if (arg === '--debug' || arg === '-d') {
      result.debug = true;
    } else {
      // Not a flag, treat as text input
      textParts.push(arg);
    }
  }
  
  if (textParts.length > 0) {
    result.text = textParts.join(' ');
  }
  
  return result;
}

// Main CLI function
export async function main() {
  // Parse command line arguments
  const args = parseArgs(process.argv.slice(2));
  
  // Handle flags with priority: help -> version -> normal operation
  if (args.showHelp) {
    displayHelp();
    return;
  }
  
  if (args.showVersion) {
    displayVersion();
    return;
  }
  
  if (args.text) {
    // Usage 1: shellman [text] (with optional flags)
    displayEnvironmentInfo(args.text, args.debug);
  } else {
    // Usage 2: shellman (without text parameter)
    if (args.debug) {
      // If debug flag is present but no text, still show debug info
      displayEnvironmentInfo(undefined, true);
      return;
    }
    
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    rl.question('Please enter text: ', (answer) => {
      displayEnvironmentInfo(answer, args.debug);
      rl.close();
    });
  }
}

// Always run main when this module is loaded
main();
