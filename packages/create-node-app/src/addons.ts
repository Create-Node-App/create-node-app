import { CnaOptions } from "@create-node-app/core";
import { Addon } from "@create-node-app/core/loaders";

/**
 * get addons from user options
 */
export const getCnaAddons = (options: CnaOptions): Addon[] => {
  // initialized with base template
  let addons: Addon[] = [];

  if (options.template) {
    addons = [{ addon: options.template }];
  }

  return addons;
};
