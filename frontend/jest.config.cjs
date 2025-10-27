module.exports = {
  testEnvironment: 'jsdom',
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
  },
  clearMocks: true,

  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
};


