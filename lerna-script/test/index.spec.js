const {expect} = require('chai').use(require('sinon-chai')),
  sinon = require('sinon'),
  {empty} = require('octopus-test-utils'),
  index = require('..');

describe('index', () => {

  describe('packages', () => {

    it('should return a list of packages', () => {
      return aLernaProject().within(() => {
        const packages = index.packages();

        expect(packages.length).to.equal(2);
      });
    });
  });

  describe('iter.forEach', () => {

    it('should iterate through available packages', () => {
      const task = sinon.spy();

      return aLernaProject().within(() => {
        const packages = index.packages();

        return index.iter.forEach(packages, pkg => task(pkg.name)).then(() => {
          expect(task.getCall(0).args[0]).to.equal('a');
          expect(task.getCall(1).args[0]).to.equal('b');
        });
      });
    });
  });

  describe('iter.parallel', () => {

    //TODO: verify async nature?
    it('should iterate through available packages', () => {
      const task = sinon.spy();

      return aLernaProject().within(() => {
        const packages = index.packages();

        return index.iter.parallel(packages, pkg => task(pkg.name)).then(() => {
          expect(task).to.have.been.calledWith('a');
          expect(task).to.have.been.calledWith('b');
        });
      });
    });
  });

  describe('iter.batched', () => {

    //TODO: verify batched nature
    it('should iterate through available packages', () => {
      const task = sinon.spy();

      return aLernaProject().within(() => {
        const packages = index.packages();

        return index.iter.batched(packages, pkg => task(pkg.name)).then(() => {
          expect(task).to.have.been.calledWith('a');
          expect(task).to.have.been.calledWith('b');
        });
      });
    });
  });

  function aLernaProject() {
    return empty()
      .addFile('lerna.json', {"lerna": "2.0.0", "packages": ["**"], "version": "0.0.0"})
      .module('a', module => module.packageJson({version: '1.0.0'}))
      .module('nested/b', module => module.packageJson({name: 'b', version: '1.0.1', dependencies: {'a': '~1.0.0'}}));
  }
});