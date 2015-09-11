import {expect} from 'chai';
import getPathVar from './get-path-var';

describe('get-path-var', () => {
  it('should provide me with PATH when the platform is not `win32`', () => {
    expect(getPathVar('darwin')).to.equal('PATH');
  });

  describe('`win32` platform', () => {
    it('should provide me with Path if process.env does not contain PATH', () => {
      const originalPath = process.env.PATH;
      delete process.env.PATH;
      expect(getPathVar('win32')).to.equal('Path');
      process.env.PATH = originalPath;
    });

    it('should provide me with PATH when process.env contains PATH', () => {
      expect(getPathVar('win32')).to.equal('PATH');
    });
  });
});

