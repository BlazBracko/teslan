import * as migration_20261109_175717_zacetna from './20261109_175717_zacetna';
import * as migration_20261109_182506_katalog from './20261109_182506_katalog';
import * as migration_20261109_194846_narocila from './20261109_194846_narocila';
import * as migration_20261109_214134_darila from './20261109_214134_darila';

export const migrations = [
  {
    up: migration_20261109_175717_zacetna.up,
    down: migration_20261109_175717_zacetna.down,
    name: '20261109_175717_zacetna',
  },
  {
    up: migration_20261109_182506_katalog.up,
    down: migration_20261109_182506_katalog.down,
    name: '20261109_182506_katalog',
  },
  {
    up: migration_20261109_194846_narocila.up,
    down: migration_20261109_194846_narocila.down,
    name: '20261109_194846_narocila',
  },
  {
    up: migration_20261109_214134_darila.up,
    down: migration_20261109_214134_darila.down,
    name: '20261109_214134_darila'
  },
];
