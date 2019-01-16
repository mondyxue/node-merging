import cmd from 'commander'

cmd
  .version(require('../package.json').version, '-v, --version')
  .usage('<command> [options]')

cmd
  .command('build')
  .description('merging')
  .action(require('./merging-build'))
  .option('-s, --src <src>', 'merging sources')
  .option('-t, --target <target>', 'merging target')
  .option('-w, --watch', 'watching files')

cmd
  .command('clean')
  .description('clean merging target')
  .action(require('./merging-clean'))
  .option('-t, --target <target>', 'target to be clean')

cmd.parse(process.argv)
