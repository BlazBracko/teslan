import * as migration_20261109_175717_zacetna from './20261109_175717_zacetna';

export const migrations = [
  {
    up: migration_20261109_175717_zacetna.up,
    down: migration_20261109_175717_zacetna.down,
    name: '20261109_175717_zacetna'
  },
];
