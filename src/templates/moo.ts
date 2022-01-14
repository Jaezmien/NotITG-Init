import fs from 'fs'
import gitly from 'gitly'
import { green, yellow } from 'kolorist'
import path from 'path/posix'
import prompts from 'prompts'
import { ISetting } from '../globals'
import { BGAnimation } from '../libs/Simfile'

const Name = 'Moo'

async function Load(settings: ISetting) {
	const { target: targetDirectory, song, songFile } = settings
	if (!song) throw Error('Song not found')

	console.log('🔃 Downloading and extracting base template...')
	await gitly('https://github.com/Jaezmien/NotITG-Moo', targetDirectory, {
		extract: {
			filter(path) {
				return !['.md', '.txt'].some((ext) => path.endsWith(ext))
			},
		},
	})

	console.log('🔃 Downloading and loading addons...')
	await gitly('https://github.com/Jaezmien/NotITG-Moo-Addons#main', path.join(targetDirectory, '.temp'), {})

	let modTemplate = false
	const response = await prompts(
		{
			type: 'select',
			name: 'type',
			message: 'Select template type',
			choices: [
				{ title: 'Modfile', description: 'Create a base modfile template', value: 'modfile' },
				{ title: 'Game', description: 'Create a base game template', value: 'game' },
			],
		},
		{
			onCancel: () => {
				throw new Error('💥 Operation cancelled')
			},
		}
	)
	modTemplate = response.type === 'modfile'

	let compatibility: string[] = []
	if (modTemplate) {
		console.log('🔃 Downloading and extracting mod template...')
		await gitly('https://github.com/Jaezmien/NotITG-Moo-Mods#main', targetDirectory, {
			extract: {
				filter(path) {
					return !['.ogg', '.sm'].some((ext) => path.endsWith(ext))
				},
			},
		})

		compatibility = (
			await prompts(
				{
					type: 'multiselect',
					name: 'compat',
					message: 'Select compatibility',
					hint: '- Space to select. Return to submit',
					instructions: false,
					choices: [
						{ title: 'NotITG', value: 'notitg', selected: true },
						{ title: 'OpenITG', value: 'openitg' },
						{ title: 'OutFox', value: 'outfox' },
					],
				},
				{
					onCancel: () => {
						throw new Error('💥 Operation cancelled')
					},
				}
			)
		).compat

		const response = await prompts(
			{
				type: 'select',
				name: 'reader',
				message: 'Select your mod reader',
				instructions: false,
				choices: fs
					.readdirSync(path.join(targetDirectory, '.temp/Mod Readers'))
					.filter((x) => x !== '_Template')
					.map((template) => {
						return {
							title: template,
							value: template,
						}
					}),
			},
			{
				onCancel: () => {
					throw new Error('💥 Operation cancelled')
				},
			}
		)

		console.log('🔃 Loading mod reader...')
		fs.mkdirSync(path.join(targetDirectory, 'template/addons/modreaders'))
		const READER = response.reader
		const READER_DIR = path.join(targetDirectory, '.temp/Mod Readers', READER)

		fs.renameSync(
			path.join(READER_DIR, READER.toLowerCase() + '.lua'),
			path.join(targetDirectory, 'template/addons/modreaders', READER.toLowerCase() + '.lua')
		)

		if (fs.existsSync(path.join(READER_DIR, '_modhelper ' + READER.toLowerCase() + '.lua'))) {
			fs.renameSync(
				path.join(READER_DIR, '_modhelper ' + READER.toLowerCase() + '.lua'),
				path.join(targetDirectory, 'template/addons/modreaders', '_modhelper ' + READER.toLowerCase() + '.lua')
			)
		}

		fs.readdirSync(path.join(targetDirectory, 'fg')).forEach((x) => {
			let content = fs.readFileSync(path.join(targetDirectory, 'fg', x), 'utf-8')
			content = content.replace(
				"-- lua{'fg/mods', env=modreader.jaezmien}",
				`lua{'fg/mods', env=modreader.${READER.toLowerCase()}}`
			)
			fs.writeFileSync(path.join(targetDirectory, 'fg', x), content)
		})

		fs.renameSync(
			path.join(READER_DIR, fs.readdirSync(READER_DIR).find((x) => x.endsWith('mods.lua'))!),
			path.join(targetDirectory, 'fg/mods.lua')
		)

		fs.renameSync(
			path.join(targetDirectory, '.temp/1 - modreader.lua'),
			path.join(targetDirectory, 'template/addons/1 - modreader.lua')
		)

		if (compatibility.includes('openitg')) {
			console.log('🔃 Setting up settings.lua')
			let content = fs.readFileSync(path.join(targetDirectory, 'settings.lua'), 'utf-8')
			content = content.replace("-- config.minimum_build = 'OpenITG'", "config.minimum_build = 'OpenITG'")
			content = content.replace(
				"-- config.modreader._default = { 'exschwasion' }",
				`config.modreader._default = { '${READER.toLowerCase()}' }`
			)
			fs.writeFileSync(path.join(targetDirectory, 'settings.lua'), content)
		}
	} else {
		console.log('🔃 Downloading and extracting engine template...')
		await gitly('https://github.com/Jaezmien/NotITG-Moo-Engine#main', targetDirectory, {
			extract: {
				filter(path) {
					return !['.ogg', '.sm'].some((ext) => path.endsWith(ext))
				},
			},
		})
	}

	// Addons
	const installAddons = await prompts({
		type: 'toggle',
		name: 'addons',
		message: 'Do you also want to install additional addons?',
		initial: false,
		active: 'y',
		inactive: 'n',
	})
	if (installAddons.addons) {
		const response = await prompts({
			type: 'multiselect',
			name: 'addons',
			message: 'Please select the addons you want to use',
			hint: '- Space to select. Return to submit',
			instructions: false,
			choices: fs
				.readdirSync(path.join(targetDirectory, '.temp'))
				.filter((x) => {
					let extension = path.extname(x)
					let name = path.basename(x, extension)
					if (name === '1 - modreader') return false
					if (name.endsWith('.outfox') && compatibility.includes('notitg')) return false
					if (name.endsWith('.notitg') && compatibility.includes('outfox')) return false
					return extension.trim() && name !== '_template'
				})
				.map((x) => {
					return {
						title: path.basename(x, path.extname(x)),
						value: x,
						selected: fs.existsSync(path.join(targetDirectory, 'template/addons/', x)),
					}
				}),
		})

		if (response.addons) {
			response.addons.forEach((addon: string) => {
				fs.renameSync(
					path.join(targetDirectory, '.temp', addon),
					path.join(targetDirectory, 'template/addons', addon)
				)
			})

			console.log('✅ Addons loaded!')
		}
	}

	if (compatibility.includes('openitg')) {
		let content = fs.readFileSync(path.join(targetDirectory, 'settings.lua'), 'utf-8')
		content = content.replace(
			'-- config.addons_files = {}',
			`config.addons_files = {${fs
				.readdirSync(path.join(targetDirectory, 'template/addons'))
				.filter((x) => path.extname(x))
				.map((x) => "'" + x.replace('.xml', '').replace('.lua', '') + "'")
				.join(', ')}}`
		)
		fs.writeFileSync(path.join(targetDirectory, 'settings.lua'), content)
	}

	console.log('🔃 Modifying .sm file...')
	if (modTemplate) {
		song[compatibility.length > 0 ? 'BGChanges' : 'BetterBGChanges'] = [
			new BGAnimation('0.000=template/bg=1.000=0=0=1====='),
		]
		song.FGChanges = [new BGAnimation('0.000=template/fg=1.000=0=0=1=====')]
		fs.writeFileSync(songFile, song.toString())
	} else {
		song.FGChanges = [new BGAnimation('0.000=template/fg=1.000=0=0=1=====')]
		fs.writeFileSync(songFile, song.toString())
	}

	console.log(green('🚮 Cleaning up...'))
	fs.rmSync(path.join(targetDirectory, '.temp'), { recursive: true })

	console.log()
	console.log(green('✅ Template Initialized!'))

	if (modTemplate) {
		console.log('To set-up your mods, please see: ' + green('fg/mods.lua'))
		console.log('To set-up your actors, please see: ' + yellow('fg/fg.xml'))
	}
}

module.exports = { Name, Load }
