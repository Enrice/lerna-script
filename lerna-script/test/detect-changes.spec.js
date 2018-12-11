const {expect} = require('chai').use(require('sinon-chai')),
  {asBuilt, asGitCommited} = require('./utils'),
  {aLernaProjectWith2Modules, loggerMock} = require('lerna-script-test-utils'),
  index = require('..'),
  {join} = require('path'),
  {writeFileSync} = require('fs'),
  sinon = require('sinon')

describe('detect-changes', () => {
  it('should not detect any changes for already marked modules', () => {
    const project = asBuilt(asGitCommited(aLernaProjectWith2Modules()))

    return project.within(() => {
      const lernaPackages = index.loadPackages()
      lernaPackages.forEach(lernaPackage =>
        expect(index.changes.isBuilt(lernaPackage)()).to.equal(true)
      )
    })
  })

  it('should support scoped module names', () => {
    expect(() => asBuilt(asGitCommited(aLernaProjectWith2Modules('@foo/a')))).to.not.throw()
  })

  it('should detect changes recursively', () => {
    const project = asBuilt(
      asGitCommited(
        aLernaProjectWith2Modules().inDir(ctx => {
          ctx.addFile('packages/a/test/test.js', '')
        })
      )
    )

    return project.within(ctx => {
      ctx.addFile('packages/a/test/test2.js', '')
      const lernaPackage = index.loadPackages().find(p => p.name === 'a')

      expect(index.changes.isBuilt(lernaPackage)()).to.equal(false)
    })
  })

  it('should detect uncommitted modules as changed', () => {
    const project = aLernaProjectWith2Modules()

    return project.within(() => {
      const lernaPackages = index.loadPackages()
      lernaPackages.forEach(lernaPackage =>
        expect(index.changes.isBuilt(lernaPackage)()).to.equal(false)
      )
    })
  })

  it('should detect change in module', () => {
    const project = asBuilt(asGitCommited(aLernaProjectWith2Modules()))

    return project.within(() => {
      const aLernaPackage = index.loadPackages().pop()
      writeFileSync(join(aLernaPackage.location, 'some.txt'), 'qwe')

      expect(index.changes.isBuilt(aLernaPackage)()).to.equal(false)
    })
  })

  it('should respect .gitignore in root', () => {
    const projectWithGitIgnore = aLernaProjectWith2Modules().inDir(ctx => {
      ctx.addFile('.gitignore', 'some.txt\n')
    })

    const project = asBuilt(asGitCommited(projectWithGitIgnore))

    return project.within(() => {
      const aLernaPackage = index.loadPackages().pop()
      writeFileSync(join(aLernaPackage.location, 'some.txt'), 'qwe')

      expect(index.changes.isBuilt(aLernaPackage)()).to.equal(true)
    })
  })

  it('should respect .gitignore in module dir', () => {
    const projectWithGitIgnore = aLernaProjectWith2Modules().inDir(ctx => {
      ctx.addFile('packages/a/.gitignore', 'some.txt\n')
    })

    const project = asBuilt(asGitCommited(projectWithGitIgnore))

    return project.within(() => {
      const aLernaPackage = index.loadPackages().find(lernaPackage => lernaPackage.name === 'a')
      writeFileSync(join(aLernaPackage.location, 'some.txt'), 'qwe')

      expect(index.changes.isBuilt(aLernaPackage)()).to.equal(true)
    })
  })

  it('should unbuild a module', () => {
    const log = loggerMock()
    const project = asBuilt(asGitCommited(aLernaProjectWith2Modules()))

    return project.within(() => {
      const aLernaPackage = index.loadPackages().pop()
      index.changes.unbuild(aLernaPackage, {log})()

      expect(index.changes.isBuilt(aLernaPackage)()).to.equal(false)
      expect(log.verbose).to.have.been.calledWithMatch(
        'makePackageUnbuilt',
        'marking module unbuilt',
        sinon.match.object
      )
    })
  })

  it('should build a module', () => {
    const log = loggerMock()
    const project = asGitCommited(aLernaProjectWith2Modules())

    return project.within(() => {
      const aLernaPackage = index.loadPackages().pop()

      expect(index.changes.isBuilt(aLernaPackage)()).to.equal(false)
      index.changes.build(aLernaPackage, {log})()
      expect(index.changes.isBuilt(aLernaPackage)()).to.equal(true)
      expect(log.verbose).to.have.been.calledWithMatch(
        'makePackageBuilt',
        'marking module built',
        sinon.match.object
      )
    })
  })

  it('should respect label for makePackageBuilt', () => {
    const project = asBuilt(asGitCommited(aLernaProjectWith2Modules()), {label: 'woop'})

    return project.within(() => {
      const lernaPackages = index.loadPackages()
      lernaPackages.forEach(lernaPackage =>
        expect(index.changes.isBuilt(lernaPackage)()).to.equal(false)
      )
      lernaPackages.forEach(lernaPackage =>
        expect(index.changes.isBuilt(lernaPackage)('woop')).to.equal(true)
      )
    })
  })

  it('should respect label for makePackageUnbuilt', () => {
    const project = asBuilt(asGitCommited(aLernaProjectWith2Modules()), {label: 'woop'})

    return project.within(() => {
      const aLernaPackage = index.loadPackages().pop()
      index.changes.unbuild(aLernaPackage)()
      expect(index.changes.isBuilt(aLernaPackage)('woop')).to.equal(true)

      index.changes.unbuild(aLernaPackage)('woop')
      expect(index.changes.isBuilt(aLernaPackage)()).to.equal(false)
    })
  })
})
