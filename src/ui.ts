import prompts from 'prompts'
import { logger } from '@shermant/logger'

// Helper function to prompt the user for text input
export async function promptForText(): Promise<string> {
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

// Define a simple help message directly
export function displayHelp() {
  logger.info.tag('Usage: shellman [options] [text]').data('').print()
  logger.info.tag('').data('').print()
  logger.info.tag('Options:').data('').print()
  logger.info.tag('  -v, --version     Display the version of shellman').data('').print()
  logger.info.tag('  -h, --help        Display this help message').data('').print()
  logger.info.tag('  -d, --debug       Display debug information').data('').print()
  logger.info.tag('  -t, --text <text> Text to display with environment info').data('').print()
  logger.info.tag('').data('').print()
  logger.info.tag('Examples:').data('').print()
  logger.info.tag(
    '  shellman                     Interactive mode, prompts for text input',
  ).data('').print()
  logger.info.tag(
    '  shellman -t "Hello World"    Displays environment info with \'Hello World\' as input',
  ).data('').print()
  logger.info.tag('  shellman -v                  Displays the program version').data('').print()
  logger.info.tag(
    '  shellman -d                  Displays environment and debug info',
  ).data('').print()
}

// Display the version number
export function displayVersion(version: string) {
  logger.info.tag(`shellman v${version}`).data('').print()
}
