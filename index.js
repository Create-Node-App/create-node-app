#!/usr/bin/env node

const program = require('commander');
const chalk = require('chalk');
const envinfo = require('envinfo');

const packageJS = require('./package.json');
const { createApp } = require('./lib/install');
const { getCnaOptions } = require('./cna');

/**
 * Options to bootstrap the Node application
 * @typedef {Object} Options
 * @property {boolean} info - Print environment debug info
 * @property {string} alias - Metadata to specify alias, usefull for backends using webpack
 * @property {string} srcDir - Metadata to specify where to put the source code
 * @property {boolean} interactive - Specify if it is needed to use interactive mode or not
 * @property {boolean} verbose - Specify if it is needed to use verbose mode or not
 * @property {string} projectName - Project's name
 * @property {boolean} useNpm - Use npm mandatorily
 * @property {(string | undefined)} template - Template to bootstrap the aplication
 * @property {[]string} extend - Extensions to apply for the boilerplate generation
 * @property {({ addon: string }[]|undefined)} addons - Official extensions to apply
 */

let projectName = 'app';

program
  .version(packageJS.version)
  .arguments('[project-directory]')
  .usage(`${chalk.green('[project-directory]')} [options]`)
  .action((name) => {
    projectName = name || projectName;
  })
  .option('--verbose', 'print additional logs')
  .option('--info', 'print environment debug info')
  .option('--use-npm', 'use npm mandatorily')
  .option('-i, --interactive', 'use interactive mode to bootstrap your app')
  .option('--template <template>', 'especify template to use for initial setup')
  .option('--extend <repos...>', 'git repositories to extend your boilerplate')
  .option('-a, --alias <alias>', 'webpack alias', 'app')
  .option('--src-dir <src-dir>', 'dir name to put content under [src]/', '')
  .option('--nodeps', 'generate package.json file without installing dependencies')
  .option('--inplace', 'apply setup to an existing project');

program
  .allowUnknownOption()
  .on('--help', () => {
    console.log();
    console.log(`    Only ${chalk.green('[project-directory]')} is required.`);
    console.log();
    console.log(`    If you have any problems, do not hesitate to file an issue:`);
    console.log(`      ${chalk.cyan(`${packageJS.bugs.url}/new`)}`);
  })
  .parse(process.argv);

/**
 * Main procress to bootstrap the Node app using user options
 * @param {Options} options - Options to bootstrap application
 */
const main = async (options) => {
  if (options.info) {
    console.log(chalk.bold('\nEnvironment Info:'));
    const info = await envinfo.run(
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
    );
    console.log(info);
    process.exit(0);
  }

  if (typeof options.projectName === 'undefined') {
    console.error('Please specify the project directory:');
    console.log(`  ${chalk.cyan(program.name())} ${chalk.green('[project-directory]')}`);
    console.log();
    console.log('For example:');
    console.log(`  ${chalk.cyan(program.name())} ${chalk.green('my-app')}`);
    console.log();
    console.log(`Run ${chalk.cyan(`${program.name()} --help`)} to see all options.`);
    process.exit(1);
  }

  const appOptions = await getCnaOptions(options);

  await createApp(
    appOptions.projectName,
    appOptions.verbose,
    appOptions.useNpm,
    appOptions.inplace,
    appOptions.addons,
    appOptions.alias,
    !appOptions.nodeps,
    false,
    appOptions.srcDir
  );
};

main({ ...program.opts(), projectName });
