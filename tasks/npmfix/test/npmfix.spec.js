const {
    aLernaProjectWith2Modules,
    aLernaProject,
    loggerMock,
    fs
  } = require('lerna-script-test-utils'),
  {loadPackages} = require('lerna-script'),
  {expect} = require('chai').use(require('sinon-chai')),
  npmfix = require('..')

describe('npmfix task', () => {
  describe('should update docs, repo url in package.json', async () => {
    const origins = ['https://github.com:git/qwe.git', 'git@github.com:git/qwe.git']
    origins.forEach(origin => {
      it(`for origin ${origin}`, async () => {
        const project = await aLernaProjectWith2Modules()
        const log = loggerMock()

        return project.within(ctx => {
          ctx.exec(`git remote add origin ${origin}`)
          return npmfix()(log).then(() => {
            expect(log.info).to.have.been.calledWith(
              'npmfix',
              'fixing homepage, repo urls for 2 packages'
            )
            expect(fs.readJson('./packages/a/package.json')).to.contain.property(
              'homepage',
              'https://github.com/git/qwe/tree/master/packages/a'
            )
            expect(fs.readJson('./packages/a/package.json')).to.contain.nested.property(
              'repository.type',
              'git'
            )
            expect(fs.readJson('./packages/a/package.json')).to.contain.nested.property(
              'repository.url',
              'git@github.com:git/qwe.git'
            )
            expect(fs.readJson('./packages/a/package.json')).to.contain.nested.property(
              'repository.directory',
              '/packages/a'
            )

            expect(fs.readJson('./packages/b/package.json')).to.contain.property(
              'homepage',
              'https://github.com/git/qwe/tree/master/packages/b'
            )
          })
        })
      })
    })
  })

  it('should update only for provided modules', async () => {
    const project = await aLernaProjectWith2Modules()
    const log = loggerMock()

    return project.within(async ctx => {
      ctx.exec('git remote add origin git@github.com:git/qwe.git')

      const packages = await loadPackages()
      const filteredPackages = packages.filter(p => p.name === 'a')
      return npmfix({packages: filteredPackages})(log).then(() => {
        expect(fs.readJson('./packages/a/package.json')).to.contain.property(
          'homepage',
          'https://github.com/git/qwe/tree/master/packages/a'
        )
        expect(fs.readJson('./packages/b/package.json')).to.not.contain.property('homepage')
      })
    })
  })

  it('should sort dependencies', async () => {
    function makeDependencies(...names) {
      const deps = {}
      names.forEach(key => (deps[key] = '1.0'))
      return deps
    }

    const project = await aLernaProject(
      {a: []},
      {
        dependencies: makeDependencies('z', 'c', 'b'),
        devDependencies: makeDependencies('e', 'd'),
        peerDependencies: makeDependencies('g', 'f')
      }
    )

    const log = loggerMock()
    return project.within(async ctx => {
      ctx.exec('git remote add origin git@github.com:git/qwe.git')

      const packages = await loadPackages()
      const filteredPackages = packages.filter(p => p.name === 'a')
      return npmfix({packages})(log).then(() => {
        const fixedPackage = fs.readJson('./packages/a/package.json')
        expect(Object.keys(fixedPackage.dependencies)).to.deep.equal(['b', 'c', 'z'])
        expect(Object.keys(fixedPackage.devDependencies)).to.deep.equal(['d', 'e'])
        expect(Object.keys(fixedPackage.peerDependencies)).to.deep.equal(['f', 'g'])
      })
    })
  })
})
