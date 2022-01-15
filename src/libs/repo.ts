// Slightly based on gitly, uses a different method for caching

import axios from 'axios'
import path from 'path/posix'
import fs from 'fs'
import os from 'os'
import crypto from 'crypto'
import * as stream from 'stream'
import { promisify } from 'util'
import tar from 'tar'

const CACHE_INTERVAL = 1000 * 60 * 60 * 24 // 1 day
const CACHE_DIRECTORY = path.join(os.homedir(), '.notitg-init')
const pipeline = promisify(stream.pipeline)

async function download(repository: string) {
	const r = /^(.+)\/(.+)$/g.exec(repository)
	if (!r) throw Error('Invalid repository')

	let [, author, repo] = r
	let branch = 'master'
	if (repo.includes('#')) [repo, branch] = repo.split('#')

	const filename = crypto
		.createHash('md5')
		.update(repository.toLowerCase() + '#' + branch)
		.digest('hex')
	const filePath = path.join(CACHE_DIRECTORY, filename + '.tar.gz')

	if (fs.existsSync(filePath)) {
		const cacheDate = fs.readFileSync(path.join(CACHE_DIRECTORY, filename + '.cache'), 'utf-8').trim()
		if (Math.abs(+cacheDate - Date.now()) <= CACHE_INTERVAL) return filePath
	}

	try {
		const file = await axios.get(`https://api.github.com/repos/${author}/${repo}/tarball/${branch}`, {
			responseType: 'stream',
		})
		if (file.status >= 400) throw Error(`💥 ${file.statusText} (${file.status})`)

		const fileStream = fs.createWriteStream(filePath)
		await pipeline(file.data, fileStream)
		fs.writeFileSync(path.join(CACHE_DIRECTORY, filename + '.cache'), Date.now().toString())
		return filePath
	} catch (e) {
		throw e
	}
}
async function extract(file: string, directory: string, filter?: (path: string, stat: tar.FileStat) => boolean) {
	const extractPath = path.normalize(directory)
	if (!fs.existsSync(extractPath)) fs.mkdirSync(extractPath)
	await tar.extract({
		strip: 1,
		file,
		cwd: extractPath,
		filter,
	})
}

export default async function (
	repository: string,
	directory: string,
	filter?: (path: string, stat: tar.FileStat) => boolean
) {
	if (!fs.existsSync(CACHE_DIRECTORY)) fs.mkdirSync(CACHE_DIRECTORY)

	const filename = await download(repository)
	await extract(filename, directory, filter)
}
