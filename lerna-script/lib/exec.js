const {script: runNpmScript, stream: runNpmScriptStreaming} = require('@lerna/npm-run-script'),
  {exec, spawnStreaming} = require('@lerna/child-process'),
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
        return exec(
          actualCommand,
          [...actualCommandArgs],
          {cwd: lernaPackage.location}
        )
      } else {
        return spawnStreaming(
          actualCommand,
          [...actualCommandArgs],
          {cwd: lernaPackage.location},
          lernaPackage.name
        )
      }


    // return new Promise((resolve, reject) => {
    //   const callback = (err, stdout) => (err ? reject(err) : resolve(stdout))
    //   if (silent) {
    //     ChildProcessUtilities.exec(
    //       actualCommand,
    //       [...actualCommandArgs],
    //       {cwd: lernaPackage.location},
    //       callback
    //     )
    //   } else {
    //     ChildProcessUtilities.spawnStreaming(
    //       actualCommand,
    //       [...actualCommandArgs],
    //       {cwd: lernaPackage.location},
    //       lernaPackage.name,
    //       callback
    //     )
    //   }
    // })
  }
}

function runScript(lernaPackage, {silent = true, log = npmlog} = {silent: true, log: npmlog}) {
  return script => {
    if (lernaPackage.scripts && lernaPackage.scripts[script]) {
        if (silent) {
          return runNpmScript(
            script,
            {args: [], pkg: lernaPackage, npmClient: 'npm'},
            callback
          )

          // NpmUtilities.runScriptInDir(
          //   script,
          //   {args: [], directory: lernaPackage.location, npmClient: 'npm'},
          //   callback
          // )
        } else {
          return runNpmScriptStreaming(
            script,
            {args: [], pkg: lernaPackage, npmClient: 'npm'}
          )
        }
      // })
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
