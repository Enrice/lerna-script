const {iter, fs, loadPackages} = require('lerna-script'),
  _ = require('lodash'),
  deepKeys = require('deep-keys');

function syncDependenciesTask() {
  return log => {
    const lernaPackages = loadPackages();
    const template = asDependencies(require(process.cwd() + '/package.json'));

    return iter.parallel(lernaPackages, {log})((lernaPackage, log) => {
      const logMerged = input => log.info(`${lernaPackage.name}: ${input.key} (${input.currentValue} -> ${input.newValue})`);

      return fs.readFile(lernaPackage)('package.json', JSON.parse).then(packageJson => {
        const synced = merge(packageJson, template, logMerged);
        return fs.writeFile(lernaPackage)('package.json', synced, s => JSON.stringify(s, null, 2));
      });
    });
  };
}

function asDependencies({managedDependencies, managedPeerDependencies}) {
  return {
    dependencies: managedDependencies,
    devDependencies: managedDependencies,
    peerDependencies: managedPeerDependencies
  };
}

function merge(dest, source, onMerged = _.noop) {
  const destKeys = deepKeys(dest);
  const sourceKeys = deepKeys(source);
  const sharedKeys = _.intersection(destKeys, sourceKeys);

  sharedKeys.forEach(key => {
    const currentValue = _.get(dest, key);
    const newValue = _.get(source, key);
    if (currentValue !== newValue) {
      _.set(dest, key, newValue);
      onMerged({key, currentValue, newValue});
    }
  });

  return dest;
}


module.exports.task = syncDependenciesTask;