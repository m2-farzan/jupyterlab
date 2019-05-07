/*-----------------------------------------------------------------------------
| Copyright (c) Jupyter Development Team.
| Distributed under the terms of the Modified BSD License.
|----------------------------------------------------------------------------*/

import commander from 'commander';
import * as path from 'path';
import * as utils from './utils';

// Specify the program signature.
commander
  .option('--dry-run', 'Dry run')
  .arguments('<version>')
  .action((v: any, opts: any) => {
    // Make sure we have a valid version spec.
    const options = ['major', 'minor', 'patch', 'release', 'build'];
    if (options.indexOf(v) === -1) {
      console.error('Version type must be one of:', options);
      process.exit(1);
    }

    // Make sure we start in a clean git state.
    const val = utils.run('git diff', { stdio: 'pipe' });
    if (val) {
      throw new Error('Must be in a clean git state');
    }

    // Ensure bump2version is installed (active fork of bumpversion).
    utils.run('python -m pip install bump2version');

    // Handle dry runs.
    if (opts.dryRun) {
      utils.run(`bumpversion --dry-run --verbose ${v}`);
      return;
    }

    // For major or minor bumps, bump all of the JS packages as well to alpha
    if (v === 'major' || v === 'minor') {
      let cmd = `lerna version preminor --yes --no-git-tag-version --force-publish=* -m \"Prerelease version\" --no-push`;
      utils.run(cmd);
      utils.run('git commit -a -m "bump packages to preminor"');
    }

    // Bump the version.
    utils.run(`bumpversion ${v}`);

    // For patch releases, skip alpha and rc
    if (v === 'patch') {
      utils.run('bumpversion release');
      utils.run('bumpversion release');
    }
  });

commander.parse(process.argv);
