#!/usr/bin/env node

const program = require('commander')
const chalk = require('chalk')
const envinfo = require('envinfo')

const packageJS = require('./package.json')
const {
  createApp
} = require('./src/install-functions')

let projectName
program
  .version(packageJS.version)
  .arguments('<project-directory>')
  .usage(`${chalk.green('<project-directory>')} [options]`)
  .action(name => {
    projectName = name
  })
  .option('--verbose', 'print additional logs')
  .option('--info', 'print environment debug info')
  .option('--use-npm')
  .option('--typescript')
  .option('--docker', 'generate dockerfiles')
  .option('-a, --alias <alias>', 'webpack alias', 'src')
  .option('--no-install-dependencies')
  .allowUnknownOption()
  .on('--help', () => {
    console.log()
    console.log(`    Only ${chalk.green('<project-directory>')} is required.`)
    console.log()
    console.log(
      `    If you have any problems, do not hesitate to file an issue:`
    )
    console.log(
      `      ${chalk.cyan(`${packageJS.bugs.url}/new`)}`
    )
    console.log()
    console.log(
      `    Based on create-react-app`
    )
    console.log(
      `      ${chalk.cyan('https://github.com/facebook/create-react-app')}`
    )
  })
  .parse(process.argv)

if (program.info) {
  console.log(chalk.bold('\nEnvironment Info:'))
  return envinfo
    .run(
      {
        System: ['OS', 'CPU'],
        Binaries: ['Node', 'npm', 'Yarn'],
        Browsers: ['Chrome', 'Edge', 'Internet Explorer', 'Firefox', 'Safari'],
      },
      {
        clipboard: false,
        duplicates: true,
        showNotFound: true,
      }
    )
    .then(console.log)
}

if (typeof projectName === 'undefined') {
  console.error('Please specify the project directory:')
  console.log(
    `  ${chalk.cyan(program.name())} ${chalk.green('<project-directory>')}`
  )
  console.log()
  console.log('For example:')
  console.log(`  ${chalk.cyan(program.name())} ${chalk.green('my-react-app')}`)
  console.log()
  console.log(
    `Run ${chalk.cyan(`${program.name()} --help`)} to see all options.`
  )
  process.exit(1)
}

createApp(
  projectName,
  program.verbose,
  program.useNpm,
  program.typescript,
  program.docker,
  program.alias,
  program.installDependencies,
)

