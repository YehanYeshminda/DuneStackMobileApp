// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');
const eslintPluginPrettierRecommended = require('eslint-plugin-prettier/recommended');
const pluginJest = require('eslint-plugin-jest');

module.exports = defineConfig([
  expoConfig,
  eslintPluginPrettierRecommended,
  {
    files: ['**/*.{test,spec}.{ts,tsx}'],
    plugins: { jest: pluginJest },
    languageOptions: { globals: pluginJest.environments.globals.globals },
  },
  {
    ignores: ['dist/*', 'coverage/*', 'node_modules/*'],
  },
]);
