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
