#!/usr/bin/env node
import path from 'path/posix'
import prompts from 'prompts'
import minimist from 'minimist'
import fs from 'fs'
import { green, red, yellow, blue, magenta, bold } from 'kolorist'
import { Song } from './libs/Simfile'
import { ASSETS_DIRECTORY, ISetting } from './globals'

const cwd = process.cwd()
const args = minimist(process.argv.slice(2), { string: ['_'] })

if (args.clean) {
	const os = require('os')
	console.log('🚮 ' + yellow('Cleaning cache...'))
	fs.rmSync(path.join(os.homedir(), '.notitg-init'), { recursive: true })
}

function rainbow(str: string) {
	const guide = [red, yellow, green, blue, magenta]
	return str
		.split('')
		.map((x, _i) => {
			let i = _i % guide.length
			return guide[i](x)
		})
		.join('')
}

console.log(`⬅ ${rainbow('NotITG Template Initializer')} ➡`)

const TEMPLATES: any = {}
fs.readdirSync(path.join(__dirname, 'templates')).forEach((t) => {
	const template = require(path.join(__dirname, 'templates', t))
	TEMPLATES[template.Name] = template
})

async function main() {
	console.log()

	const targetDirectory = path.normalize(args._[0] ?? cwd)

	console.log(bold('Initializing template at ') + targetDirectory)

	if (!fs.existsSync(targetDirectory)) {
		fs.mkdirSync(targetDirectory)
	} else if (fs.statSync(targetDirectory).isDirectory() && fs.readdirSync(targetDirectory).length > 0) {
		try {
			const response = await prompts(
				{
					type: 'select',
					name: 'existing',
					message: 'Directory contains files',
					choices: [
						{ title: 'Continue', description: 'Continue on initializing', value: 'ignore' },
						{ title: 'Clear', description: 'Clear all files first', value: 'clear' },
						{ title: 'Exit', description: 'Exit the script', value: 'exit' },
					],
					initial: 0,
				},
				{
					onCancel() {
						throw new Error('💥 Operation cancelled')
					},
				}
			)

			if (response.existing === 'exit') return
			if (response.existing === 'clear') {
				const response = await prompts(
					{
						type: 'confirm',
						name: 'clear',
						message: 'Are you sure? This action is irreversible!',
						active: 'yes',
						inactive: 'no',
						initial: false,
					},
					{
						onCancel() {
							throw new Error('💥 Operation cancelled')
						},
					}
				)
				if (response.clear) {
					console.log('🚮 Clearing files...')
					fs.rmSync(targetDirectory, { recursive: true, force: true })
					fs.mkdirSync(targetDirectory)
				} else {
					return
				}
			}
		} catch (e) {
			console.error(e)
			return
		}
	}

	let song = null
	let songFile = ''

	if (!fs.readdirSync(targetDirectory).some((x) => x.endsWith('.sm'))) {
		try {
			const response = await prompts({
				type: 'confirm',
				name: 'create',
				message: '.sm file not found, create a blank file?',
				active: 'yes',
				inactive: 'no',
				initial: true,
			})

			if (!response.create) {
				console.log(red('Simfile required to initialize template, exiting...'))
				return
			}

			songFile = targetDirectory + '/song.sm'
			song = new Song(fs.readFileSync(path.join(ASSETS_DIRECTORY, 'song.sm'), 'utf-8').split('\n'))

			if (fs.readdirSync(targetDirectory).some((x) => x.endsWith('.ogg'))) {
				song.MusicFile = fs.readdirSync(targetDirectory).find((x) => x.endsWith('.ogg'))!
				console.log('🔍 Found ogg!')
			} else {
				fs.copyFileSync(path.join(ASSETS_DIRECTORY, 'song.ogg'), path.join(targetDirectory, 'song.ogg'))
				song.MusicFile = 'song.ogg'
			}
			console.log('✅ Created empty simfile!')
		} catch (e) {
			console.error(e)
			return
		}
	} else {
		songFile = path.join(targetDirectory, fs.readdirSync(targetDirectory).find((x) => x.endsWith('.sm'))!)
		song = new Song(fs.readFileSync(songFile, 'utf-8').split('\n'))
		console.log('✅ Got simfile! - ' + song.MainTitle)
	}

	let template = ''
	let settings: ISetting = {
		target: '',
		song: null,
		songFile: '',
	}
	try {
		const response = await prompts(
			{
				type: 'select',
				name: 'template',
				message: 'Select template to use',
				choices: Object.keys(TEMPLATES).map((t) => {
					return {
						title: t,
						value: t,
					}
				}),
			},
			{
				onCancel: () => {
					throw new Error('💥 Operation cancelled')
				},
			}
		)
		template = response.template
	} catch (e) {
		console.error(e)
		return
	}

	settings.target = targetDirectory
	settings.song = song
	settings.songFile = songFile

	try {
		await TEMPLATES[template].Load(settings)
	} catch (e: unknown) {
		if (e instanceof Error) {
			console.log(red('⚠ An error has occured while trying to initialize the template!'))
			console.error(e.message)
		}
	}
}

main().catch(console.error)
