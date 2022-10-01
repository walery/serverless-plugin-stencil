# serverless-plugin-stencil

Serverless plugin for templating content in serverless.yml files.

## Usage

serverless-plugin-stencil is a serverless plugin that can load templates into a serverless.yml file.
To make it possible you need to create a npm module that is marked as stencil module.
This can be done by adding _@walery/serverless-plugin-stencil_ property to the package.json file:

```js
{
  // ...

  "@walery/serverless-plugin-stencil": {
    "alias": "account"
  }
}
```

The _alias_ property is the only one you can add.
This property is mandatory and can't be omit.
The _alias_ property contains value of _stencilAlias_ that must be unique.

Once this module is created and added as dependency, the _serverless-plugin-stencil_ will be able to find it.

To use it in your serverless.yml file you need to do it in that way:

```yml
foo: ${stencil(<stencilAlias>):<blockName>}
```

The _blockName_ is the second part that is also mandatory.

In the stencil module you need to add _blocks_ directory on the root.
In this directory you can add yaml, yml, or js files.
The filename is interpreted as a _blockName_.

If the file is yaml or yml file then the content will be just added.
If the file is a js file then the _resolve_ function will be called.
The return value will be added to the serverless.yml file.
