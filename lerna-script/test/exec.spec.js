const {expect} = require('chai').use(require('sinon-chai')),
  {aLernaProject, loggerMock, empty, captureOutput} = require('./utils'),
  index = require('..');

describe('exec', () => {
  const output = captureOutput();

  describe('command', () => {

    it('should execute command in package cwd and print output by default', () => {
      const log = loggerMock();

      return aLernaProject().within(() => {
        const lernaPackage = index.packages().pop();

        return index.exec.command(lernaPackage, {log})('pwd').then(stdout => {
          expect(log.silly).to.have.been.calledWith("runCommand", 'pwd', {cwd: lernaPackage.location, silent: true});
          expect(stdout).to.equal(lernaPackage.location);
          expect(output()).to.not.contain(lernaPackage.location);
        });
      });
    });

    it('should print output if enabled', () => {
      return aLernaProject().within(() => {
        const lernaPackage = index.packages().pop();

        return index.exec.command(lernaPackage, {silent: false})('pwd').then(stdout => {
          expect(stdout).to.equal(lernaPackage.location);
          expect(output()).to.contain(lernaPackage.location);
        });
      });
    });

    it('should reject for a failing command', done => {
      aLernaProject().within(() => {
        const lernaPackage = index.packages().pop();

        index.exec.command(lernaPackage)('asd zzz').catch(e => {
          expect(e.message).to.contain('spawn asd ENOENT');
          done();
        });
      });
    });
  });

  describe('script', () => {

    it('should execute npm script for package and return output', () => {
      const project = empty()
        .addFile('package.json', {"name": "root", version: "1.0.0", scripts: {test: 'echo tested'}});

      return project.within(() => {
        const lernaPackage = index.rootPackage();

        return index.exec.script(lernaPackage)('test').then(stdout => {
          expect(stdout).to.contain('tested');
          expect(output()).to.not.contain('tested');
        });
      });
    });

    it('should stream output to stdour/stderr if silent=false', () => {
      const project = empty()
        .addFile('package.json', {"name": "root", version: "1.0.0", scripts: {test: 'echo tested'}});

      return project.within(() => {
        const lernaPackage = index.rootPackage();

        return index.exec.script(lernaPackage, {silent: false})('test').then(stdout => {
          expect(stdout).to.contain('tested');
          expect(output()).to.contain('tested');
        });
      });
    });

    //TODO: it looks like this one rejects a promise, traced to execa line 210
    it('should reject for a failing script', done => {
      const project = empty()
        .addFile('package.json', {"name": "root", version: "1.0.0", scripts: {test: 'qwe zzz'}});

      project.within(() => {
        const lernaPackage = index.rootPackage();

        index.exec.script(lernaPackage)('test').catch(e => {
          expect(e.message).to.contain('Command failed: npm run test');
          done();
        });
      });
    });

    it('should skip a script and log a warning if its missing', () => {
      const log = loggerMock();
      const project = empty()
        .addFile('package.json', {"name": "root", version: "1.0.0"});

      return project.within(() => {
        const lernaPackage = index.rootPackage();

        return index.exec.script(lernaPackage, {log})('test').then(stdout => {
          expect(stdout).to.equal('');
          expect(log.warn).to.have.been.calledWith('runNpmScript', 'script not found', {
            script: 'test',
            cwd: lernaPackage.location
          });
        });
      });
    });
  });
});