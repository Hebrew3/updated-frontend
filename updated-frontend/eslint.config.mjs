import globals from "globals";
import pluginJs from "@eslint/js";


export default [
  {files: ["**/*.js"], languageOptions: {sourceType: "module"}},
  {languageOptions: { globals: { ...globals.browser, process: "readonly", "Buffer": "readonly"} }},
  pluginJs.configs.recommended,
  {
    ignores: [
      'node_modules/',
      'client/',
    ]
  }
];