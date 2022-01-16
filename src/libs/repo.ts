// Slightly based on gitly, uses a different method for caching

import axios, { AxiosError } from 'axios'
import path from 'path/posix'
import fs from 'fs'
import os from 'os'
import crypto from 'crypto'
import * as stream from 'stream'
import { promisify } from 'util'
import tar from 'tar'
import { red } from 'kolorist'

const CACHE_INTERVAL = 1000 * 60 * 60 * 24 // 1 day
const CACHE_DIRECTORY = path.join(os.homedir(), '.notitg-init')
const pipeline = promisify(stream.pipeline)

interface cacheJSON {
	last_date_accessed: number
	last_seen_sha: string
}

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

	let forceCache = false
	let latestCommit = null
	try {
		latestCommit = await (
			await axios.get(`https://api.github.com/repos/${author}/${repo}/commits?per_page=1`)
		).data[0]
	} catch (e: AxiosError | any) {
		if (axios.isAxiosError(e)) {
			console.log('💀 ' + red('Unable to load latest commit'))
			forceCache = true
		} else {
			throw e
		}
	}

	let cacheData: cacheJSON = {
		last_date_accessed: Date.now(),
		last_seen_sha: latestCommit?.sha ?? '',
	}

	if (fs.existsSync(filePath)) {
		const tempCache = fs.readFileSync(path.join(CACHE_DIRECTORY, filename + '.cache'), 'utf-8').trim()

		let isCacheValid = true
		try {
			JSON.parse(tempCache)
			isCacheValid = typeof JSON.parse(tempCache) === 'object'
		} catch (e) {
			isCacheValid = false
		}

		if (!isCacheValid) {
			console.log('⚠ Old .cache version found, updating...')
			if (latestCommit === null) {
				console.log('⚠ ' + red('Could not update old cache'))
				return filePath
			} else {
				fs.writeFileSync(path.join(CACHE_DIRECTORY, filename + '.cache'), JSON.stringify(cacheData))
			}
		}

		let oldCache: cacheJSON = JSON.parse(tempCache)
		if (Math.abs(oldCache.last_date_accessed - cacheData.last_date_accessed) <= CACHE_INTERVAL) {
			if (cacheData.last_seen_sha === oldCache.last_seen_sha) return filePath
			console.log('🔃 Downloading latest version of repository...')
		}
	}

	if (forceCache) throw Error('💥 Unable to download repository')

	try {
		const file = await axios.get(`https://api.github.com/repos/${author}/${repo}/tarball/${branch}`, {
			responseType: 'stream',
		})
		if (file.status >= 400) throw Error(`💥 ${file.statusText} (${file.status})`)

		const fileStream = fs.createWriteStream(filePath)
		await pipeline(file.data, fileStream)

		fs.writeFileSync(path.join(CACHE_DIRECTORY, filename + '.cache'), JSON.stringify(cacheData))
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
