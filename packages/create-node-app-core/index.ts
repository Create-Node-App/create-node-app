import chalk from "chalk";
import envinfo from "envinfo";
import { Addon } from "./loaders";
import { createApp } from "./installer";

export const printEnvInfo = async () => {
  console.log(chalk.bold("\nEnvironment Info:"));
  const info = await envinfo.run(
    {
      System: ["OS", "CPU"],
      Binaries: ["Node", "npm", "Yarn"],
      Browsers: ["Chrome", "Edge", "Internet Explorer", "Firefox", "Safari"],
    },
    {
      clipboard: false,
      duplicates: true,
      showNotFound: true,
    }
  );
  console.log(info);
  process.exit(0);
};

export type CnaOptions = {
  projectName: string;
  info?: boolean;
  alias?: string;
  srcDir?: string;
  interactive?: boolean;
  verbose?: boolean;
  useNpm?: boolean;
  nodeps?: boolean;
  template?: string;
  addons?: Addon[];
};

export type CnaOptionsTransform = (options: CnaOptions) => CnaOptions;

/**
 * Main procress to bootstrap the Node app using user options
 * @param programName - Name of the program to bootstrap the Node application
 * @param options - CnaOptions to bootstrap the Node application
 * @param options.info - Print environment debug info
 * @param options.alias - Metadata to specify alias, usefull for backends using webpack
 * @param options.srcDir - Metadata to specify where to put the source code
 * @param options.interactive - Specify if it is needed to use interactive mode or not
 * @param options.verbose - Specify if it is needed to use verbose mode or not
 * @param options.projectName - Project's name
 * @param options.useNpm - Use npm mandatorily
 * @param options.nodeps - Generate package.json file without installing dependencies
 * @param options.template - Template to bootstrap the aplication
 * @param options.extend - Extensions to apply for the boilerplate generation
 * @param options.addons - Official extensions to apply
 * @param transformOptions - Function to transform the options
 */
export const createNodeApp = async (
  programName: string,
  options: CnaOptions,
  transformOptions: CnaOptionsTransform
) => {
  if (options.info) {
    await printEnvInfo();
  }

  if (typeof options.projectName === "undefined") {
    console.error("Please specify the project directory:");
    console.log(
      `  ${chalk.cyan(programName)} ${chalk.green("[project-directory]")}`
    );
    console.log();
    console.log("For example:");
    console.log(`  ${chalk.cyan(programName)} ${chalk.green("my-app")}`);
    console.log();
    console.log(
      `Run ${chalk.cyan(`${programName} --help`)} to see all options.`
    );
    process.exit(1);
  }

  const appOptions = await transformOptions(options);

  await createApp({
    ...appOptions,
    name: appOptions.projectName,
    installDependencies: !options.nodeps,
  });
};
