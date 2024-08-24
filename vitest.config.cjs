/** @type {import('vitest').UserConfig} */
module.exports = {
  test: {
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      reportsDirectory: './coverage',
      include: ['src/**/*.ts'],
      exclude: ['node_modules/', 'test/'],
    },
    include: ['test/**/*.test.ts'],
  },
}
