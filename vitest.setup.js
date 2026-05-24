/**
 * Setup global executado antes de cada arquivo de teste.
 */
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test_secret_gamevault';

if (!process.env.VERBOSE) {
  // eslint-disable-next-line no-console
  console.log = () => {};
  // eslint-disable-next-line no-console
  console.warn = () => {};
}
