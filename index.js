#!/usr/bin/env node

const program = require('commander');
const chalk = require('chalk');
const envinfo = require('envinfo');
const prompts = require('prompts');
prompts.override(require('yargs').argv);

const packageJS = require('./package.json');
const { createApp } = require('./src/install');
const getAddons = require('./src/addons');

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

const options = program.opts();

if (options.info) {
  console.log(chalk.bold('\nEnvironment Info:'));
  envinfo
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
    .then((info) => {
      console.log(info);
      process.exit(0);
    });
}

if (typeof projectName === 'undefined') {
  console.error('Please specify the project directory:');
  console.log(`  ${chalk.cyan(program.name())} ${chalk.green('[project-directory]')}`);
  console.log();
  console.log('For example:');
  console.log(`  ${chalk.cyan(program.name())} ${chalk.green('my-node-app')}`);
  console.log();
  console.log(`Run ${chalk.cyan(`${program.name()} --help`)} to see all options.`);
  process.exit(1);
}

if (options.interactive) {
  (async () => {
    const baseInput = await prompts([
      {
        type: 'text',
        name: 'projectName',
        message: `What's your project name?`,
        initial: projectName,
      },
      {
        type: 'toggle',
        name: 'useNpm',
        message: 'Use `npm` mandatorily?',
        initial: options.useNpm,
        active: 'yes',
        inactive: 'no',
      },
    ]);

    const { template } = await prompts([
      {
        type: 'text',
        name: 'template',
        message: 'Template to use to bootstrap application',
        initial: '',
      },
    ]);

    baseInput.template = template;

    const defaultSrcDir = baseInput.cra === true ? 'src' : options.srcDir;

    const backendConfig = await prompts([
      {
        type: 'text',
        name: 'srcDir',
        message:
          'Sub directory to put all source content (.e.g. `src`, `app`). Will be on root directory by default',
        initial: defaultSrcDir,
      },
      {
        type: 'text',
        name: 'alias',
        message: 'Webpack alias if needed',
        initial: options.alias,
      },
      {
        type: 'list',
        name: 'extend',
        message: 'Enter extensions',
        initial: '',
        separator: ',',
      },
    ]);

    let { ...appOptions } = {
      ...options,
      ...baseInput,
      ...backendConfig,
    };

    const addons = getAddons(appOptions);

    if (appOptions.verbose) {
      console.log({ ...appOptions, addons });
    }

    await createApp(
      appOptions.projectName,
      appOptions.verbose,
      appOptions.useNpm,
      appOptions.inplace,
      addons,
      appOptions.alias,
      !appOptions.nodeps,
      false,
      appOptions.srcDir
    );
  })();
} else {
  const addons = getAddons(options);

  createApp(
    projectName,
    options.verbose,
    options.useNpm,
    options.inplace,
    addons,
    options.alias,
    !options.nodeps,
    false,
    options.srcDir
  );
}
