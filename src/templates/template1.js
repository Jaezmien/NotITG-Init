const path = require('path/posix')
const fs = require('fs')
const prompts = require('prompts')
const { gray, lightGray, green, red, yellow, blue, magenta, bold } = require('kolorist')
const { BGAnimation } = require('../libs/Simfile')
const { ASSETS_DIRECTORY, recursive_copy } = require('../globals')

async function LoadAsync(settings) {
	let targetDirectory = settings.target
	let song = settings.song
	let songFile = settings.songFile

	if (!fs.existsSync(path.join(targetDirectory, 'fg'))) {
		fs.mkdirSync(path.join(targetDirectory, 'fg'))
	}

	const response = await prompts(
		{
			type: 'select',
			name: 'Compatibility',
			message: 'Select compatibility',
			choices: [
				{ title: 'NotITG', value: 'notitg' },
				{ title: 'OpenITG', value: 'openitg' },
			],
			initial: 0,
		},
		{
			onCancel() {
				throw new Error('💥 Operation cancelled')
			},
		}
	)

	console.log('🔃 Copying files...')
	recursive_copy(path.join(ASSETS_DIRECTORY, 'template1', response.Compatibility), path.join(targetDirectory, 'fg'))

	console.log('🔃 Modifying .sm file...')
	song.FGChanges = [new BGAnimation('0.000=fg=1.000=0=0=1=====')]
	fs.writeFileSync(songFile, song.toString())

	console.log()
	console.log(green('✅ Template Initialized!'))

	console.log('To set-up your mods, please see: ' + green('fg/default.xml'))
}
function Load(settings) {
	LoadAsync(settings)
}

const Name = 'Template 1'
module.exports = { Name, Load }
