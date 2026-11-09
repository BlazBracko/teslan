import * as migration_20261109_175717_zacetna from './20261109_175717_zacetna';
import * as migration_20261109_182506_katalog from './20261109_182506_katalog';

export const migrations = [
  {
    up: migration_20261109_175717_zacetna.up,
    down: migration_20261109_175717_zacetna.down,
    name: '20261109_175717_zacetna',
  },
  {
    up: migration_20261109_182506_katalog.up,
    down: migration_20261109_182506_katalog.down,
    name: '20261109_182506_katalog'
  },
];
