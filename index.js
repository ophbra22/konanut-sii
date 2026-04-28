const { I18nManager } = require('react-native');

I18nManager.allowRTL(true);
I18nManager.forceRTL(true);
I18nManager.swapLeftAndRightInRTL(true);

console.log('BOOT RTL before router:', I18nManager.isRTL);

require('expo-router/entry');
