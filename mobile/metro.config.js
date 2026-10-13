const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const root = path.resolve(__dirname, '..');
const config = getDefaultConfig(__dirname);

// Share the framework-free logic in ../src (data, store, Dit Score, dit engine) with the web prototype.
config.watchFolders = [path.join(root, 'src')];
config.resolver.extraNodeModules = { ditcore: path.join(root, 'src') };
// Everything, including the shared files, must resolve react / react-native from /mobile (one copy of React).
config.resolver.nodeModulesPaths = [path.join(__dirname, 'node_modules')];
config.resolver.disableHierarchicalLookup = true;

module.exports = config;
