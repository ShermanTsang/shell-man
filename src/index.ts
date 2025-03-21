import * as os from "os";
import * as path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import { Command } from "commander";
import ora from "ora";
import prompts from "prompts";

// Add debug logging
console.log('Shell-man starting...');

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

// Get package version from package.json
function getPackageVersion(): string {
  try {
    // Handle path differently based on CommonJS or ESM
    let packageJsonPath;
    
    if (typeof __dirname !== 'undefined') {
      // CommonJS
      packageJsonPath = path.resolve(__dirname, '..', 'package.json');
    } else {
      // ESM
      const __filename = fileURLToPath(import.meta.url);
      const __dirname = path.dirname(__filename);
      packageJsonPath = path.resolve(__dirname, '..', 'package.json');
    }
    
    console.log('Reading package.json from:', packageJsonPath);
    
    if (fs.existsSync(packageJsonPath)) {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      return packageJson.version || '1.0.0';
    } else {
      console.error('package.json not found at path:', packageJsonPath);
      return '1.0.0';
    }
  } catch (error) {
    console.error('Error reading package.json:', error);
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

export function getEnvironmentInfo(): EnvironmentInfo {
  const shellInfo = getShellInfo();

  return {
    osType: os.type(),
    osVersion: os.release(),
    architecture: os.arch(),
    shellPath: shellInfo.path,
    shellName: shellInfo.name,
  };
}

async function gatherEnvironmentInfo(spinner?: ReturnType<typeof ora>): Promise<EnvironmentInfo> {
  if (spinner) {
    spinner.text = 'Gathering environment information...';
  }
  
  // Simulate a small delay to show the spinner (for better UX)
  await new Promise(resolve => setTimeout(resolve, 800));
  
  return getEnvironmentInfo();
}

function displayEnvironmentInfo(info: EnvironmentInfo, text?: string, debug = false) {
  console.log("\nEnvironment Information:");
  console.log("=======================");
  console.log(`OS Type: ${info.osType}`);
  console.log(`OS Version: ${info.osVersion}`);
  console.log(`Architecture: ${info.architecture}`);
  console.log(`Shell Path: ${info.shellPath}`);
  console.log(`Shell Name: ${info.shellName}`);
  
  if (debug) {
    console.log("\nDebug Information:");
    console.log("=======================");
    
    // Process information
    console.log("\nProcess Information:");
    console.log(`  Node Version: ${process.version}`);
    console.log(`  Current Directory: ${process.cwd()}`);
    console.log(`  Process ID: ${process.pid}`);
    
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

async function promptForText(): Promise<string> {
  const response = await prompts({
    type: 'text',
    name: 'input',
    message: 'Please enter your text:',
    validate: value => value.length > 0 ? true : 'Please enter some text'
  });
  
  return response.input;
}

// Define a simple help message directly
function displayHelp() {
  console.log("Usage: shellman [options] [text]");
  console.log("");
  console.log("Options:");
  console.log("  -v, --version     Display the version of shellman");
  console.log("  -h, --help        Display this help message");
  console.log("  -d, --debug       Display debug information");
  console.log("  -t, --text <text> Text to display with environment info");
  console.log("");
  console.log("Examples:");
  console.log("  shellman                     Interactive mode, prompts for text input");
  console.log("  shellman -t \"Hello World\"    Displays environment info with 'Hello World' as input");
  console.log("  shellman -v                  Displays the program version");
  console.log("  shellman -d                  Displays environment and debug info");
}

// Display the version number
function displayVersion() {
  console.log(`shellman v${getPackageVersion()}`);
}

// Main function, exported as cli for bin script use
export async function cli() {
  console.log('CLI function called');
  console.log('Arguments:', process.argv);
  
  try {
    // Check if help or version flags are provided before Commander initialization
    const args = process.argv.slice(2);
    if (args.includes('--help') || args.includes('-h')) {
      displayHelp();
      return;
    }
    
    if (args.includes('--version') || args.includes('-v')) {
      displayVersion();
      return;
    }
    
    const program = new Command();
    
    // Setup basic commander
    program
      .name('shellman')
      .description('A tool to display shell and environment information');
    
    // Define command line options
    program
      .option('-d, --debug', 'Display debug information')
      .option('-t, --text <text>', 'Text to display with environment info');
    
    // Parse arguments
    program.parse(process.argv);
    
    // Get options after parsing
    const options = program.opts();
    console.log('Parsed options:', options);
    
    // Create a spinner
    const spinner = ora('Starting shellman...').start();
    
    try {
      // Gather information with spinner
      const environmentInfo = await gatherEnvironmentInfo(spinner);
      
      if (options.text) {
        // Case: Text provided as argument
        spinner.succeed('Environment information gathered');
        displayEnvironmentInfo(environmentInfo, options.text, options.debug);
      } else {
        // Case: No text provided, prompt for input
        spinner.succeed('Environment information gathered');
        
        // Only prompt if we didn't get text from command line
        const userInput = await promptForText();
        displayEnvironmentInfo(environmentInfo, userInput, options.debug);
      }
    } catch (error) {
      spinner.fail(`Error: ${error instanceof Error ? error.message : String(error)}`);
      process.exit(1);
    }
  } catch (error) {
    console.error('Error in CLI execution:', error);
    process.exit(1);
  }
}

// Run the program if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}` || process.argv[1] === fileURLToPath(import.meta.url)) {
  console.log('Running CLI from direct execution');
  cli().catch(err => {
    console.error('Unhandled error:', err);
    process.exit(1);
  });
}
