'use strict';

const path = require('path');
const SlsHelper = require('./lib/slsHelper.js');

class StencilPlugin {
  constructor(serverless, cliOptions, logUtils) {
    const stcModules = require('find-plugins')({
      scanAllDirs: true,
      dir: path.join(process.cwd(), 'node_modules'),
      includeDev: true,
      filter: dep => dep.pkg['@walery/serverless-plugin-stencil']?.alias  // TODO replace by current package name
    });
    const stcModulePaths = stcModules.reduce((acc, currValue) => {
      // TODO check if alias is already in use
      acc[currValue.pkg['@walery/serverless-plugin-stencil'].alias] = currValue.dir;
      return acc;
    }, []);
    const slsHelper = new SlsHelper(serverless);

    this.configurationVariablesSources = {
      stencil: {
        async resolve(variableUtils) {
          const {params, serviceDir, address} = variableUtils;
          if (params.length != 1) {
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
          const stencilPath = path.relative(path.join(serviceDir, 'node_modules'), absoluteModulePath);

          const blockResolver = require(path.join('.', stencilPath, 'blocks', `${blockName}.js`));
          const resolvedBlock = await blockResolver.resolve({serverless, variableUtils, slsHelper, cliOptions, logUtils});

          return {
            value: resolvedBlock,
          };
        },
      },
    };
  }
}

module.exports = StencilPlugin;
