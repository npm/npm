import chai from 'chai';
import addToPath from './index';
import getPathVar from './get-path-var';

const expect = chai.expect;
const PATH = getPathVar();
const env = process.env;

chai.use(require('chai-string'));

describe('add-to-path', () => {
  let originalPath;
  const pathToAdd = '/foo/bar/.bin';

  beforeEach(() => {
    originalPath = env[PATH];
  });

  describe('platform independent', () => {
    it('should throw an error when passed a non-string', () => {
      expect(() => {
        addToPath();
      }).to.throw(/must pass a non-empty string/ig);
    });

    it('should throw an error when passed an empty string', () => {
      expect(() => {
        addToPath(2);
      }).to.throw(/must pass a non-empty string/ig);
    });

    it('should return a function to restore the path', () => {
      const restorePath = addToPath(pathToAdd);
      expect(env[PATH]).to.startWith(pathToAdd);
      restorePath();
      expect(env[PATH]).to.not.contain(pathToAdd);
    });

    it('should handle the case where there is no pre-existing path', () => {
      delete env[PATH];
      addToPath(pathToAdd);
      expect(env[PATH]).to.equal(pathToAdd);
    });

    it('should handle an array of strings', () => {
      const platform = 'darwin';
      const separator = ':';
      const paths = [pathToAdd, '/bar/foo/.bin'];
      addToPath(paths, {platform});
      expect(env[PATH]).to.startWith(paths.join(separator));
    });

    it('should allow you to append to the path', () => {
      addToPath(pathToAdd, {append: true});
      expect(env[PATH]).to.endWith(pathToAdd);
    });
  });

  describe('on darwin platform', () => {
    const platform = 'darwin';
    const separator = ':';

    it('should alter the path to add what is provided', () => {
      expect(addToPath(pathToAdd, {platform}));
      expect(env[PATH]).to.startWith(pathToAdd + separator);
    });
  });

  describe('on win32 platform', () => {
    const platform = 'win32';
    const separator = ';';

    it('should alter the path to add what is provided', () => {
      expect(addToPath(pathToAdd, {platform}));
      expect(env[PATH]).to.startWith(pathToAdd + separator);
    });
  });

  afterEach(() => {
    env[PATH] = originalPath;
  });
});

