const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('@react-native/metro-config').MetroConfig}
 */
// METRO_MAX_WORKERS=1 keeps release bundling within RAM on small machines (see scripts/build-release.mjs).
const config = process.env.METRO_MAX_WORKERS ? { maxWorkers: Number(process.env.METRO_MAX_WORKERS) } : {};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
