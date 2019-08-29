const runNpmScript = require('./lerna-forked-child-process-runscript'),
  {exec, spawnStreaming} = require('./lerna-forked-child-process'),
  npmlog = require('npmlog')

function runCommand(lernaPackage, {silent = true, log = npmlog} = {silent: true, log: npmlog}) {
  return command => {
    log.silly('runCommand', command, {cwd: lernaPackage.location, silent})
    const commandAndArgs = command.split(' ')
    const actualCommand = commandAndArgs.shift()
    const actualCommandArgs = commandAndArgs
    // return new Promise((resolve, reject) => {
    //   const callback = (err, stdout) => (err ? reject(err) : resolve(stdout))
    if (silent) {
      return Promise.resolve()
        .then(() => exec(actualCommand, [...actualCommandArgs], {cwd: lernaPackage.location}))
        .then(res => res.stdout)
    } else {
      return spawnStreaming(
        actualCommand,
        [...actualCommandArgs],
        {cwd: lernaPackage.location},
        lernaPackage.name
      ).then(res => res.stdout)
    }
  }
}

function runScript(lernaPackage, {silent = true, log = npmlog} = {silent: true, log: npmlog}) {
  return script => {
    if (lernaPackage.scripts && lernaPackage.scripts[script]) {
      if (silent) {
        return runNpmScript(script, {args: [], pkg: lernaPackage, npmClient: 'npm'}).then(
          res => res.stdout
        )
      } else {
        return runNpmScript
          .stream(script, {args: [], pkg: lernaPackage, npmClient: 'npm'})
          .then(res => res.stdout)
      }
    } else {
      log.warn('runNpmScript', 'script not found', {script, cwd: lernaPackage.location})
      return Promise.resolve('')
    }
  }
}

module.exports = {
  runCommand,
  runScript
}
