const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add support for shared folder
config.watchFolders = [__dirname, __dirname + '/../shared'];

// Add additional file extensions
config.resolver.sourceExts.push('cjs');

module.exports = config;
