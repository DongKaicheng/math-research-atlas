#!/usr/bin/env node
// SQLite's online backup API captures a consistent snapshot, including committed
// WAL data. Copying only the live .sqlite file is not a safe backup procedure.
import {DatabaseSync, backup} from 'node:sqlite';
import {createReadStream} from 'node:fs';
import {chmod, link, mkdir, mkdtemp, realpath, rm, stat} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

export async function createBackup({source, destination}) {
  if (!source || !destination) throw new Error('Source and destination are required.');
  const sourcePath = await realpath(path.resolve(source));
  if (!(await stat(sourcePath)).isFile()) throw new Error('Source must be an existing SQLite file.');
  const destinationPath = path.resolve(destination);
  if (sourcePath === destinationPath) throw new Error('Backup must use a different path.');
  const destinationDirectory = path.dirname(destinationPath);
  await mkdir(destinationDirectory, {recursive: true, mode: 0o700});
  // The temporary directory and final database are private even when the caller
  // has a permissive umask. The destination is never silently overwritten.
  const temporaryDirectory = await mkdtemp(path.join(destinationDirectory, '.openmath-backup-'));
  await chmod(temporaryDirectory, 0o700);
  const temporaryPath = path.join(temporaryDirectory, 'snapshot.sqlite');
  let database;
  try {
    database = new DatabaseSync(sourcePath, {readOnly: true});
    database.exec('PRAGMA busy_timeout = 10000');
    await backup(database, temporaryPath);
    database.close();
    database = undefined;
    await chmod(temporaryPath, 0o600);
    const snapshot = new DatabaseSync(temporaryPath, {readOnly: true});
    try {
      const result = snapshot.prepare('PRAGMA quick_check').all();
      if (result.length !== 1 || Object.values(result[0])[0] !== 'ok') {
        throw new Error('The SQLite backup failed its integrity check.');
      }
    } finally {
      snapshot.close();
    }
    const digest = createHash('sha256');
    for await (const chunk of createReadStream(temporaryPath)) digest.update(chunk);
    const bytes = (await stat(temporaryPath)).size;
    // A hard link on the same filesystem provides atomic no-clobber publication.
    // EEXIST is intentional: select a new filename rather than replacing a backup.
    await link(temporaryPath, destinationPath);
    return {path: destinationPath, bytes, sha256: digest.digest('hex')};
  } finally {
    database?.close();
    await rm(temporaryDirectory, {recursive: true, force: true});
  }
}

async function main() {
  const values = {};
  const arguments_ = process.argv.slice(2);
  if (arguments_.includes('--help')) {
    console.log('Usage: node management/scripts/backup.mjs --destination /private/backups/openmath-YYYY-MM-DD.sqlite [--source /private/data/openmath.sqlite]');
    return;
  }
  for (let index = 0; index < arguments_.length; index += 2) {
    const option = arguments_[index];
    const value = arguments_[index + 1];
    if (!['--source', '--destination'].includes(option) || !value || value.startsWith('--') || values[option]) {
      throw new Error('Use --source and --destination once each with a file path.');
    }
    values[option] = value;
  }
  const result = await createBackup({
    source: values['--source'] || process.env.OPENMATH_DB || './management/data/openmath.sqlite',
    destination: values['--destination'],
  });
  console.log(JSON.stringify(result));
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch(error => {
    console.error(`Backup failed: ${error.code || error.message}`);
    process.exitCode = 1;
  });
}
