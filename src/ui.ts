import prompts from 'prompts'

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
  console.log('Usage: shellman [options] [text]')
  console.log('')
  console.log('Options:')
  console.log('  -v, --version     Display the version of shellman')
  console.log('  -h, --help        Display this help message')
  console.log('  -d, --debug       Display debug information')
  console.log('  -t, --text <text> Text to display with environment info')
  console.log('')
  console.log('Examples:')
  console.log(
    '  shellman                     Interactive mode, prompts for text input',
  )
  console.log(
    '  shellman -t "Hello World"    Displays environment info with \'Hello World\' as input',
  )
  console.log('  shellman -v                  Displays the program version')
  console.log(
    '  shellman -d                  Displays environment and debug info',
  )
}

// Display the version number
export function displayVersion(version: string) {
  console.log(`shellman v${version}`)
}
