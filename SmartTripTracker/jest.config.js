/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.test.ts'],
  moduleNameMapper: {
    '@/(.*)': '<rootDir>/src/$1',
  },
  modulePathIgnorePatterns: ['<rootDir>/node_modules/'],
  setupFiles: ['<rootDir>/src/__tests__/setup.ts'],
  // Transformeer ESM-modules in node_modules
  transformIgnorePatterns: [
    'node_modules/(?!(react-native-tts|react-native-push-notification|react-native-ble-manager|react-native-geolocation-service|react-native-maps|react-native-fs|react-native-html-to-pdf|@react-native|react-native)/)',
  ],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.tsx',
    '!src/**/__tests__/**',
    '!src/navigation/**',
  ],
};
