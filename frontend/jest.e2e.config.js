/** Configuração Jest apenas para testes E2E (Selenium) em tests/e2e/. */
module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    testMatch: ['**/tests/e2e/**/*.test.ts'],
    /** E2E: vários `driver.wait` (60s) + navegação; margem para CI lento. */
    testTimeout: 180000,
    moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1',
    },
};
