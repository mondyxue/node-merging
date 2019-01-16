import fs from 'fs'
import path from 'path'
import chokidar from 'chokidar'
import ignore from 'ignore'
import mkdirp from 'mkdirp'
import rimraf from 'rimraf'

var currentDir = process.cwd()

var evts = {
  add: true,
  addDir: true,
  change: true,
  unlink: true,
  unlinkDir: true
}

var preventDup = {}
var watchReady = false

function readFile(p) {
  if (fs.existsSync(p)) {
    return fs.readFileSync(p)
  } else {
    return false
  }
}

function writeFile(p, data) {
  p = path.parse(p)
  if (!fs.existsSync(p.dir)) {
    mkdirp.sync(p.dir)
  }
  fs.writeFileSync(path.join(p.dir, p.base), data)
}

var copy = function(src, target) {
  if (!ignores || !ignores(target)) {
    if (fs.statSync(src).isDirectory()) {
      fs.readdirSync(src).forEach(function(file) {
        copy(path.join(src, file), path.join(target, file))
      })
    } else {
      console.log(`merging: copy from \t${src}`)
      console.log(`merging: copy to \t${target}`)
      writeFile(target, readFile(src))
    }
  }else{
    console.log(`merging: copy ignore \t${src}`)
  }
}

var unlink = function(target) {
  if (fs.existsSync(target)) {
    console.log(`merging: unlink \t${target}`)
    if (fs.statSync(src).isDirectory()) {
      rimraf.sync(target)
    } else {
      fs.unlinkSync(target)
    }
  }
}

var ignores

exports = module.exports = cmd => {
  var config = require(path.join(currentDir, path.sep, 'merging.config.js'))

  var src = cmd.src || config.src || []
  var target = cmd.target || config.target || 'merging'

  let ignoreFile = path.join(currentDir, path.sep, '.mergingignore')
  if (fs.existsSync(ignoreFile)) {
    const _ignore = ignore().add(fs.readFileSync(ignoreFile, 'utf-8'))
    ignores = function(p) {
      if (_ignore.ignores(p)) {
        return true
      }
    }
  }

  if (typeof src === 'string') {
    src = src.split(',')
  }
  target = path.relative(currentDir, path.join(currentDir, target))

  var sources = []
  var targets = []
  for (var _src of src) {
    sources.push(path.relative(currentDir, _src.src || _src))
    targets.push(
      path.relative(currentDir, path.join(target, _src.target || ''))
    )
  }

  console.log('merging: start merging')
  console.log(`merging: merging to \t${target}`)
  for (var index in sources) {
    copy(sources[index], targets[index])
  }
  console.log('merging: merging success')

  if (cmd.watch && !watchReady) {
    cmd.watch = false
    chokidar
      .watch(sources)
      .on('all', (evt, file) => {
        if (!evts[evt] || preventDup[file] || !watchReady) {
          return
        }
        preventDup[file] = evt
        for (var index in sources) {
          if (file.indexOf(sources[index]) === 0) {
            const source = path.relative(sources[index], file)
            const target = path.join(targets[index], source)
            console.log(`merging: src ${evt} \t${source}`)
            switch (evt) {
              case 'add':
              case 'addDir':
              case 'change': {
                copy(file, target)
                break
              }
              case 'unlink':
              case 'unlinkDir': {
                unlink(target)
                break
              }
            }
            break
          }
        }
        setTimeout(() => {
          preventDup[file] = false
        }, 500)
      })
      .on('ready', () => {
        watchReady = true
        console.log('merging: start watching')
      })
  }
}
