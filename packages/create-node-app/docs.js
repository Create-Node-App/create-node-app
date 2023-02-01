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
 * @property {({ addon: string, ignorePackage?: boolean }[]|undefined)} addons - Official extensions to apply
 */
