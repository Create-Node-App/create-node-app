#!/usr/bin/env node

const program = require('commander');
const chalk = require('chalk');
const envinfo = require('envinfo');

const packageJS = require('./package.json');
const { createApp } = require('./src/install');
const getAddons = require('./src/addons');

let projectName;

program
  .version(packageJS.version)
  .arguments('<project-directory>')
  .usage(`${chalk.green('<project-directory>')} [options]`)
  .action((name) => {
    projectName = name;
  })
  .option('--verbose', 'print additional logs')
  .option('--info', 'print environment debug info')
  .option('--use-npm', 'use npm mandatorily')
  .option('--typescript', 'add TypeScript support')
  .option('--redux', 'add redux support and setup using redux thunk middleware by default')
  .option(
    '--saga',
    'add redux support and setup using redux saga middleware. --redux flag is required'
  )
  .option('--recoil', 'add recoil.js support and setup the state management library for React')
  .option('--antd', 'add ant-design setup with ant-design icons package')
  .option('--bootstrap', 'add bootstrap and bootstrap-react setup with theme config')
  .option('--material-ui', 'add material ui setup with SVG icons')
  .option('--semantic-ui', 'add semantic ui and semantic ui react setup with theme config')
  .option('--docker', 'generate dockerfiles')
  .option(
    '--android-tools',
    'generate dockerfiles with android tools to perform android emulation, testing and apk generation.'
  )
  .option('--ionic', 'generates cross-platform setup using ionic react and capacitor')
  .option('--extend <repos>', 'git repositories to extend your boilerplate')
  .option('-a, --alias <alias>', 'webpack alias', 'app')
  .option('--nodeps', 'generate package.json file without installing dependencies')
  .option('--inplace', 'apply setup to an existing project')
  .allowUnknownOption()
  .on('--help', () => {
    console.log();
    console.log(`    Only ${chalk.green('<project-directory>')} is required.`);
    console.log();
    console.log(`    If you have any problems, do not hesitate to file an issue:`);
    console.log(`      ${chalk.cyan(`${packageJS.bugs.url}/new`)}`);
  })
  .parse(process.argv);

if (program.info) {
  console.log(chalk.bold('\nEnvironment Info:'));
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
    .then(console.log);
}

if (typeof projectName === 'undefined') {
  console.error('Please specify the project directory:');
  console.log(`  ${chalk.cyan(program.name())} ${chalk.green('<project-directory>')}`);
  console.log();
  console.log('For example:');
  console.log(`  ${chalk.cyan(program.name())} ${chalk.green('my-react-app')}`);
  console.log();
  console.log(`Run ${chalk.cyan(`${program.name()} --help`)} to see all options.`);
  process.exit(1);
}

const addons = getAddons(program);

createApp(
  projectName,
  program.verbose,
  program.useNpm,
  program.inplace,
  addons,
  program.alias,
  !program.nodeps
);
