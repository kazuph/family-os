import base from './vitest.config';

export default {
  ...base,
  test: { ...base.test, include: ['__live__/*.test.ts'], testTimeout: 180_000 },
};
