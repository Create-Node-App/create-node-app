import { CnaOptions } from "@create-node-app/core";
import { Addon } from "@create-node-app/core/loader";

/**
 * get addons from user options
 */
export const getCnaAddons = (options: CnaOptions): Addon[] => {
  // initialized with base template
  let addons: Addon[] = [];

  if (options.template) {
    addons = [{ addon: options.template }];
  }

  if (options.extend) {
    addons.push(...options.extend.filter(Boolean).map((addon) => ({ addon })));
  }

  return addons;
};
