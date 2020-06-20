#!/usr/bin/env node

const program = require('commander')
const chalk = require('chalk')
const envinfo = require('envinfo')

const packageJS = require('./package.json')
const { createApp } = require('./src/install-functions')

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
  .option('--typescript', 'add TypeScript support')
  .option('--redux', 'add redux support and setup ussing redux thunk middleware')
  .option('--recoil', 'add recoil.js support and setup the state management library for React')
  .option('--semantic-ui', 'add semantic ui and semantic ui react setup with theme config')
  .option('--docker', 'generate dockerfiles')
  .option('--android', 'generates android setup using ionic react and capacitor')
  .option('-a, --alias <alias>', 'webpack alias', 'app')
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

let addons = ['common']

if (program.typescript) { addons.push('typescript') }
if (program.redux) { addons.push('redux') }
if (program.recoil) { addons.push('recoil') }
if (program.semanticUi) { addons.push('semantic-ui') }
if (program.android) { addons.push('android') }
if (program.docker) {
  addons.push('docker-web')
  if (program.android) { addons.push('docker-android') }
}

createApp(
  projectName,
  program.verbose,
  program.useNpm,
  addons,
  program.alias,
  program.installDependencies,
)
