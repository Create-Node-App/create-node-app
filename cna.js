const prompts = require('prompts');
prompts.override(require('yargs').argv);

const getAddons = require('./addons');
const { Options } = require('./docs');

/**
 * Addons options to bootstrap the Node app
 */
const addonsOptions = [];

/**
 * preprocess user options after bootstrapping the app
 * @param {Options} options - Options to bootstrap application
 * @returns {Options}
 */
const getCnaOptions = async (options) => {
  let appOptions = options;

  if (appOptions.interactive) {
    const baseInput = await prompts([
      {
        type: 'text',
        name: 'projectName',
        message: `What's your project name?`,
        initial: appOptions.projectName,
      },
      {
        type: 'toggle',
        name: 'useNpm',
        message: 'Use `npm` mandatorily?',
        initial: appOptions.useNpm,
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

    const defaultSrcDir = baseInput.cra === true ? 'src' : appOptions.srcDir;

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
        initial: appOptions.alias,
      },
      {
        type: 'list',
        name: 'extend',
        message: 'Enter extensions',
        initial: '',
        separator: ',',
      },
    ]);

    let { ...nextAppOptions } = {
      ...options,
      ...baseInput,
      ...backendConfig,
    };

    appOptions = nextAppOptions;
  }

  const addons = getAddons(appOptions);

  if (appOptions.verbose) {
    console.log({ ...appOptions, addons });
  }

  return { ...appOptions, addons };
};

module.exports = {
  getCnaOptions,
  addonsOptions,
};
