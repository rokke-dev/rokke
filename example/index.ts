import { Application } from '@rokke/core';
import { LoggerProvider } from '@rokke/logger';
import { ConfigProvider } from '@rokke/config';
import { DatabaseProvider } from '@rokke/orm';
import { ExampleDatabaseProvider, ExampleHttpProvider } from './src/database.provider';

const app = await Application.boot(import.meta.dir)
  .withProviders(
    ConfigProvider,
    DatabaseProvider,
    ExampleDatabaseProvider,
    LoggerProvider,
    ExampleHttpProvider
  )
  .create();

await app.start();
console.log('Rokke CRUD example is running on http://127.0.0.1:3001');
