import fs from 'fs'
import gitly from 'gitly'
import { green } from 'kolorist'
import path from 'path/posix'
import prompts from 'prompts'
import { ISetting } from '../globals'
import { BGAnimation } from '../libs/Simfile'

const Name = 'Mirin'

async function Load(settings: ISetting) {
	const { target: targetDirectory, song, songFile } = settings
	if (!song) throw Error('Song not found')

	console.log('🔃 Downloading and extracting template...')
	await gitly('https://github.com/XeroOl/notitg-mirin', targetDirectory, {
		extract: {
			filter(path) {
				return !['.sm', '.ogg', '.md'].some((ext) => path.endsWith(ext))
			},
		},
	})

	const installPlugins = await prompts({
		type: 'toggle',
		name: 'plugins',
		message: 'Do you also want to add plugins?',
		initial: false,
		active: 'y',
		inactive: 'n',
	})
	if (installPlugins.plugins) {
		console.log('🔃 Downloading and extracting plugins...')
		await gitly('https://github.com/XeroOl/notitg-mirin-plugins', path.join(targetDirectory, 'plugins'), {})
		const pluginsList = fs.readFileSync(path.join(targetDirectory, 'plugins', 'PLUGINLIST.txt'), 'utf-8')

		const response = await prompts({
			type: 'multiselect',
			name: 'activePlugins',
			message: 'Please select the plugins you want to use',
			hint: '- Space to select. Return to submit',
			instructions: false,
			choices: pluginsList
				.split('\n')
				.filter((x) => x.trim())
				.map((x) => {
					return {
						title: x,
						value: x,
					}
				}),
		})

		if (response.activePlugins) {
			fs.readdirSync(path.join(targetDirectory, 'plugins')).forEach((x) => {
				if (!response.activePlugins.includes(path.basename(x, path.extname(x)))) {
					fs.unlinkSync(path.join(targetDirectory, 'plugins', x))
				}
			})

			console.log('✅ Plugins loaded!')
		}
	}

	console.log('🔃 Modifying .sm file...')
	song.FGChanges = [new BGAnimation('0.000=template/main.xml=1.000=0=0=1=====')]
	fs.writeFileSync(songFile, song.toString())

	console.log()
	console.log(green('✅ Template Initialized!'))

	console.log('To set-up your mods, please see: ' + green('lua/mods.xml'))
}

module.exports = { Name, Load }
