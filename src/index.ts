import * as os from "os";
import * as path from "path";
import * as readline from "readline";

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

function displayEnvironmentInfo(text?: string) {
  const environmentInfo = getEnvironmentInfo();
  
  console.log("Environment Information:");
  console.log("=======================");
  console.log(`OS Type: ${environmentInfo.osType}`);
  console.log(`OS Version: ${environmentInfo.osVersion}`);
  console.log(`Architecture: ${environmentInfo.architecture}`);
  console.log(`Shell Path: ${environmentInfo.shellPath}`);
  console.log(`Shell Name: ${environmentInfo.shellName}`);
  
  if (text) {
    console.log("\nUser Input:");
    console.log("=======================");
    console.log(text);
  }
}

// Main CLI function
export async function main() {
  // Check if there's a command line argument
  const args = process.argv.slice(2);
  
  if (args.length > 0) {
    // Usage 1: shellman [text]
    const inputText = args.join(' ');
    displayEnvironmentInfo(inputText);
  } else {
    // Usage 2: shellman (without params)
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    rl.question('Please enter text: ', (answer) => {
      displayEnvironmentInfo(answer);
      rl.close();
    });
  }
}

// Always run main when this module is loaded
main();
