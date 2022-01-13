const fs = require('fs')
const path = require('path/posix')

exports.ROOT_DIRECTORY = __dirname.replace(/\\/g, '/').split('/').slice(0, -1).join('/')
exports.ASSETS_DIRECTORY = path.join(exports.ROOT_DIRECTORY, 'assets')

exports.recursive_copy = async (oldDir, newDir) => {
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
