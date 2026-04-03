const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');
const { resolve } = require('metro-resolver');

const config = getDefaultConfig(__dirname);

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === '@radix-ui/react-slot') {
    return {
      filePath: path.resolve(__dirname, 'src/shims/radix-react-slot.js'),
      type: 'sourceFile',
    };
  }

  return resolve(context, moduleName, platform);
};

module.exports = config;
