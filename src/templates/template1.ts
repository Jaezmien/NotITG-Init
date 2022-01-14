import fs from 'fs'
import { green } from 'kolorist'
import path from 'path/posix'
import prompts from 'prompts'
import { ASSETS_DIRECTORY, ISetting, recursive_copy } from '../globals'
import { BGAnimation } from '../libs/Simfile'

async function Load(settings: ISetting) {
	const { target: targetDirectory, song, songFile } = settings
	if (!song) throw Error('Song not found')

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

const Name = 'Template 1'
module.exports = { Name, Load }
