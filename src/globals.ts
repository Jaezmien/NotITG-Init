import fs from 'fs'
import path from 'path/posix'
import { Song } from './libs/Simfile'

export const ROOT_DIRECTORY = __dirname.replace(/\\/g, '/').split('/').slice(0, -1).join('/')
export const ASSETS_DIRECTORY = path.join(exports.ROOT_DIRECTORY, 'assets')

export const recursive_copy = async (oldDir: string, newDir: string) => {
	fs.readdirSync(oldDir).forEach((file) => {
		let oldFile = path.join(oldDir, file)
		let newFile = path.join(newDir, file)
		if (fs.statSync(oldFile).isDirectory()) {
			if (!fs.existsSync(newFile)) fs.mkdirSync(newFile)
			recursive_copy(oldFile, newFile)
		} else {
			fs.copyFileSync(oldFile, newFile)
		}
	})
}

export interface ISetting {
	target: string
	song: Song | null
	songFile: string
}
