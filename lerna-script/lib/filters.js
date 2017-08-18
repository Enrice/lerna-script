const _ = require('lodash'),
  detectChanges = require('./detect-changes'),
  UpdatedPackagesCollector = require('lerna/lib/UpdatedPackagesCollector'),
  PackageUtilities = require('lerna/lib/PackageUtilities'),
  PackageGraph = require('lerna/lib/PackageGraph').default,
  log = require('npmlog');

function removeByGlob(lernaPackages, glob) {
  return PackageUtilities.filterPackages(lernaPackages, {ignore: glob})
}


//TODO: see how to make it less sucky
function removeGitSince(lernaPackages) {
  return refspec => {
    const collector = new UpdatedPackagesCollector({
      filteredPackages: lernaPackages,
      logger: log,
      repository: {
        packageGraph: new PackageGraph(lernaPackages),
        rootPath: process.cwd()
      },
      options: {since: refspec}
    });

    return collector.getUpdates().map(u => u.package);
  };
}

function removeBuilt(lernaPackages) {
  const changedPackages = lernaPackages.filter(lernaPackage => !detectChanges.isPackageBuilt(lernaPackage));
  return figureOutAllPackagesThatNeedToBeBuilt(lernaPackages, changedPackages);
}

function figureOutAllPackagesThatNeedToBeBuilt(allPackages, changedPackages) {
  const transitiveClosureOfPackagesToBuild = new Set(changedPackages.map(el => el.name));
  let dependencyEdges = createDependencyEdgesFromPackages(allPackages);

  let dependencyEdgesLengthBeforeFiltering = dependencyEdges.length;
  do {
    dependencyEdgesLengthBeforeFiltering = dependencyEdges.length;

    const newDependencyEdges = [];

    for (let edge of dependencyEdges) {
      if (transitiveClosureOfPackagesToBuild.has(edge[1])) {
        transitiveClosureOfPackagesToBuild.add(edge[0]);
      } else {
        newDependencyEdges.push(edge);
      }
    }
    dependencyEdges = newDependencyEdges;

  } while (dependencyEdgesLengthBeforeFiltering !== dependencyEdges.length);

  return allPackages.filter(p => transitiveClosureOfPackagesToBuild.has(p.name));
}

function createDependencyEdgesFromPackages(packages) {
  const setOfAllPackageNames = new Set(packages.map(p => p.name));
  const packagesByNpmName = _.keyBy(packages, 'name');

  const dependencyEdges = [];
  packages.forEach(lernaPackage => {
    Object.keys(lernaPackage.allDependencies).forEach(name => {
      if (setOfAllPackageNames.has(name)) {
        dependencyEdges.push([lernaPackage.name, packagesByNpmName[name].name])
      }
    });
  });

  return dependencyEdges;
}

module.exports = {
  removeBuilt,
  removeGitSince,
  removeByGlob
};