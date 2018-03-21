const {loadPackages, iter, fs} = require('lerna-script'),
  gitRemoteUrl = require('git-remote-url'),
  gitInfo = require('hosted-git-info'),
  {relative} = require('path')

function npmfix({packages} = {}) {
  return log => {
    const lernaPackages = packages || loadPackages()
    log.info('npmfix', `fixing homepage, repo urls for ${lernaPackages.length} packages`)

    return gitRemoteUrl('.', 'origin').then(gitRemoteUrl => {
      const repoUrl = gitInfo.fromUrl(gitRemoteUrl).browse()

      return iter.parallel(lernaPackages, {log})((lernaPackage, log) => {
        const moduleGitUrl =
          repoUrl + '/tree/master/' + relative(process.cwd(), lernaPackage.location)

        return fs
          .readFile(lernaPackage, {log})('package.json', JSON.parse)
          .then(packageJson => {
            const updated = Object.assign({}, packageJson, {
              homepage: moduleGitUrl,
              repository: {
                type: 'git',
                url: moduleGitUrl
              }
            })
            return fs.writeFile(lernaPackage, {log})('package.json', updated)
          })
      })
    })
  }
}

module.exports = npmfix
