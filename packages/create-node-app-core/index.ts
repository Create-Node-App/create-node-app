import chalk from "chalk";
import envinfo from "envinfo";
import { execSync } from "child_process";
import { TemplateOrExtension } from "./loaders";
import { createApp } from "./installer";

export const checkForLatestVersion = async (packageName: string) => {
  // We first check the registry directly via the API, and if that fails, we try
  // the slower `npm view [package] version` command.
  //
  // This is important for users in environments where direct access to npm is
  // blocked by a firewall, and packages are provided exclusively via a private
  // registry.
  try {
    const response = await fetch(
      `https://registry.npmjs.org/-/package/${packageName}/dist-tags`
    );

    if (!response.ok) {
      throw new Error("Registry request failed");
    }

    const { latest } = await response.json();
    return latest as string;
  } catch (error) {
    try {
      return execSync(`npm view ${packageName} version`).toString().trim();
    } catch (error) {
      // ignore
    }
    // ignore
  }
  return null;
};

export const printEnvInfo = async () => {
  console.log(chalk.bold("\nEnvironment Info:"));
  const info = await envinfo.run(
    {
      System: ["OS", "CPU"],
      Binaries: ["Node", "npm", "Yarn"],
      Browsers: ["Chrome", "Edge", "Internet Explorer", "Firefox", "Safari"],
    },
    {
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
  templatesorextensions?: TemplateOrExtension[];
};

export type CnaOptionsTransform = (options: CnaOptions) => Promise<CnaOptions>;

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
 * @param options.templatesorextensions - Official extensions to apply
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
