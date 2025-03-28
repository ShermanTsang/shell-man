import * as process from 'node:process'
import { Command } from 'commander'
import ora from 'ora'
import prompts from 'prompts'
import { logger } from '@shermant/logger'
import { displayEnvironmentInfo, gatherEnvironmentInfo } from './environment'
import { getPackageVersion } from './utils'
import { initConfig } from './config'
import type { ShellManConfig } from './types'

// Helper function to prompt the user for text input
async function promptForText(): Promise<string> {
  const response = await prompts({
    type: 'text',
    name: 'input',
    message: 'Please enter your script:',
    validate: value =>
      value.length > 0
        ? true
        : 'Please enter your script use natural human language',
  })

  return response.input
}

// Main function, exported as cli for bin script use
export async function cli() {
  try {
    const args = process.argv.slice(2)
    const isDebug = args.includes('--debug') || args.includes('-d')
    const nonInteractive = isDebug || args.includes('--non-interactive')

    const program = new Command()

    // Setup basic commander with proper descriptions
    program
      .name('shellman')
      .description('A tool to display shell and environment information')
      .version(getPackageVersion(), '-v, --version', 'Display the version of shellman')
      .helpOption('-h, --help', 'Display help information')
      .allowExcessArguments(true) // Allow excess arguments without error

    // Define command line options with detailed descriptions
    program
      .option('-d, --debug', 'Display debug information')
      .option('-t, --text <text>', 'Text to display with environment info')
      .option('--non-interactive', 'Run in non-interactive mode')
      // Add a dummy variadic argument to capture all other arguments
      .argument('[text...]', 'Text to display with environment info')

    // Add examples to help text using the .addHelpText method
    program.addHelpText('after', `
Examples:
  shellman                     Interactive mode, prompts for text input
  shellman -t "Hello World"    Displays environment info with 'Hello World' as input
  shellman -v                  Displays the program version
  shellman -d                  Displays environment and debug info
`)

    // Parse arguments
    program.parse(process.argv)

    // Get options after parsing
    const options = program.opts()
    if (isDebug)
      logger.info.tag('Parsed options').data(options).print()

    // Handle positional arguments
    const positionalArgs = program.args
    if (isDebug)
      logger.info.tag('Positional args').data(positionalArgs).print()

    // Get text from either -t flag or positional args
    let userText: string | undefined = options.text

    // If no text option but we have positional args, use those as text
    if (!userText && positionalArgs.length > 0) {
      userText = positionalArgs.join(' ')
    }

    // Create a spinner
    const spinner = ora('Starting shellman...').start()

    try {
      // Configuration initialization
      if (nonInteractive) {
        spinner.text = 'Loading configuration in non-interactive mode...'
        const config: ShellManConfig = await initConfig(true)
        if (isDebug)
          logger.info.tag('Configuration loaded').data(config).message(`loaded from ${config.source}`).appendDivider().print()
      }
      else {
        // In interactive mode, completely stop the spinner and show a clear message
        spinner.stop()
        // Initialize config in interactive mode
        const config: ShellManConfig = await initConfig(false)
        if (isDebug)
          logger.info.tag('Configuration loaded').data(config).print()

        // Restart spinner after configuration is complete
        spinner.start('Continuing with shellman...')
      }

      // Gather information with spinner
      spinner.text = 'Gathering environment information...'
      const environmentInfo = await gatherEnvironmentInfo(spinner)

      if (userText) {
        // Case: Text provided (either as flag or positional arg)
        spinner.succeed('Environment information gathered')
        displayEnvironmentInfo(environmentInfo, userText, options.debug)
      }
      else if (nonInteractive) {
        // In non-interactive mode without text, just display environment info
        spinner.succeed('Environment information gathered')
        displayEnvironmentInfo(
          environmentInfo,
          'Running in non-interactive mode',
          options.debug,
        )
      }
      else {
        // Case: No text provided, prompt for input
        spinner.succeed('Environment information gathered')

        // Only prompt if we didn't get text from command line
        const userInput = await promptForText()
        displayEnvironmentInfo(environmentInfo, userInput, options.debug)
      }
    }
    catch (error) {
      spinner.fail(
        `Error: ${error instanceof Error ? error.message : String(error)}`,
      )
      process.exit(1)
    }
  }
  catch (error) {
    logger.error.tag('Error in CLI execution').data(error).print()
    process.exit(1)
  }
}
