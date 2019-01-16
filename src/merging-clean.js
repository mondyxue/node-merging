import path from 'path'
import rimraf from 'rimraf'

var currentDir = process.cwd()

exports = module.exports = cmd => {
  var config = require(path.join(currentDir, path.sep, 'merging.config.js'))

  rimraf.sync(cmd.target || config.target || 'merging')
}
