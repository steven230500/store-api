import { AppDataSource } from '../datasource';

(async () => {
  try {
    const ds = await AppDataSource.initialize();
    await ds.runMigrations();
    await ds.destroy();
    console.log('[migrations] OK');
  } catch (e) {
    console.error('[migrations] Failed:', e);
    process.exit(1);
  }
})();