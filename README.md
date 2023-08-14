# require-object-type-annotations

## Installation

```sh
npm install --save-dev eslint-plugin-require-object-type-annotations
```

## Usage

```json
{
  "plugins": ["require-object-type-annotations"],
  "rules": {
    "require-object-type-annotations/require-object-type-annotations": "error"
  }
}
```

## Options

`ignoreInsideFunctionCalls`: a string containing a regular expression of function calls to ignore. This is useful if you want to allow anonymous object types when they are passed as arguments to specific functions.

Examples of **correct** code with `{ ignoreInsideFunctionCalls: '^(foo|bar)$' }`:

```ts
foo({ prop: 1 });
bar({ prop: 1 });
```
