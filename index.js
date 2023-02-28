'use strict';

const {access} = require('node:fs/promises');
const {constants} = require('node:fs');
const path = require('node:path');
const SlsHelper = require('./lib/slsHelper.js');

class StencilPlugin {
  constructor(serverless, cliOptions, logUtils) {
    const stcModules = require('find-plugins')({
      scanAllDirs: true,
      dir: path.join(require('node:process').cwd(), 'node_modules'),
      includeDev: true,
      filter: dep => dep.pkg['@walery/serverless-plugin-stencil']?.alias,  // TODO replace by current package name
    });
    const stcModulePaths = stcModules.reduce((acc, currValue) => {
      // TODO check if alias is already in use
      acc[currValue.pkg['@walery/serverless-plugin-stencil'].alias] = currValue.dir;
      return acc;
    }, []);
    const slsHelper = new SlsHelper(serverless);

    const isFileAccessible = async filename => {
      try {
        await access(filename, constants.R_OK);
        return true;
      } catch {
        return false;
      }
    };

    this.configurationVariablesSources = {
      stencil: {
        async resolve(variableUtils) {
          const {params, serviceDir, address, resolveVariable} = variableUtils;
          if (params.length !== 1) {
            throw new serverless.classes.Error(`Please pass exactly one parameter to stencil call. Found ${params.length}: '${params}'.`);
          }
          const stencilAlias = params[0];
          const blockName = address;

          if (blockName === null) {
            throw new serverless.classes.Error('You must provide block name for stencil alias.');
          }

          const absoluteModulePath = stcModulePaths[stencilAlias];
          if (absoluteModulePath === undefined) {
            throw new serverless.classes.Error(`Stencil alias with name '${stencilAlias}' not found.`);
          }
          const stencilPath = path.relative(serviceDir, absoluteModulePath);
          const commonBlockFile = path.join('.', stencilPath, 'blocks', `${blockName}`);

          const isYmlBlock = await isFileAccessible(`${commonBlockFile}.yml`);
          const isYamlBlock = await isFileAccessible(`${commonBlockFile}.yaml`);
          const isJsBlock = await isFileAccessible(`${commonBlockFile}.js`);

          // TODO handle case that more than one block is true

          let resolvedBlock = null;
          if (isYmlBlock) {
            resolvedBlock = await resolveVariable(`file(${commonBlockFile}.yml)`);
          }
          if (isYamlBlock) {
            resolvedBlock = await resolveVariable(`file(${commonBlockFile}.yaml)`);
          }
          if (isJsBlock) {
            const requirePath = path.relative(path.join(serviceDir, 'node_modules'), absoluteModulePath);
            const jsBlockResolver = require(path.join('.', requirePath, 'blocks', `${blockName}.js`));
            resolvedBlock = await jsBlockResolver.resolve({serverless, variableUtils, slsHelper, cliOptions, logUtils});
          }

          if (resolvedBlock === null) {
            throw new serverless.class.Error(`Block with name '${blockName}' not found for '${stencilAlias}' stencil alias.`);
          }

          return {
            value: resolvedBlock,
          };
        },
      },
    };
  }
}

module.exports = StencilPlugin;
