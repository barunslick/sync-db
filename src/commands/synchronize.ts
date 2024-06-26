import { Command, flags } from '@oclif/command';
import { bold, cyan, red, green, magenta } from 'chalk';

import { synchronize } from '../api';
import { getElapsedTime } from '../util/ts';
import { log, dbLogger } from '../util/logger';
import { loadConfig, resolveConnections } from '../config';
import { printError, printLine, printInfo } from '../util/io';
import OperationResult from '../domain/operation/OperationResult';

class Synchronize extends Command {
  static description = 'Synchronize all the configured database connections.';

  /**
   * Available CLI flags.
   */
  static flags = {
    force: flags.boolean({ char: 'f', description: 'Force synchronization.' }),
    'dry-run': flags.boolean({ description: 'Dry run synchronization.', default: false }),
    'skip-migration': flags.boolean({ description: 'Skip running migrations.' }),
    only: flags.string({
      helpValue: 'CONNECTION_ID(s)',
      description: 'Filter provided connection(s). Comma separated ids eg: id1,id2'
    }),
    'connection-resolver': flags.string({
      helpValue: 'PATH',
      description: 'Path to the connection resolver.'
    }),
    config: flags.string({
      char: 'c',
      description: 'Custom configuration file.'
    })
  };

  /**
   * Started event handler.
   */
  onStarted = async (result: OperationResult) => {
    await printLine(bold(` ▸ ${result.connectionId}`));
    await printInfo('   [✓] Synchronization - started');
  };

  /**
   * Prune success handler.
   */
  onPruneSuccess = (result: OperationResult) =>
    printLine(green('   [✓] Synchronization - pruned') + ` (${result.timeElapsed}s)`);

  /**
   * Migration success handler.
   */
  onMigrationSuccess = async (result: OperationResult) => {
    const logDb = dbLogger(result.connectionId);
    const [num, list] = result.data;
    const alreadyUpToDate = num && list.length === 0;

    logDb('Up to date: ', alreadyUpToDate);

    if (alreadyUpToDate) {
      await printLine(green('   [✓] Migrations - up to date') + ` (${result.timeElapsed}s)`);

      return;
    }

    await printLine(green(`   [✓] Migrations - ${list.length} run`) + ` (${result.timeElapsed}s)`);

    // Completed migrations.
    for (const item of list) {
      await printLine(cyan(`       - ${item}`));
    }
  };

  /**
   * Migration failure handler.
   */
  onMigrationFailed = async (result: OperationResult) => {
    await printLine(red(`   [✖] Migrations - failed (${result.timeElapsed}s)`));
  };

  /**
   * Success handler for the whole process - after all completed.
   */
  onSuccess = async (result: OperationResult) => {
    await printLine(green('   [✓] Synchronization - completed') + ` (${result.timeElapsed}s)\n`);
  };

  /**
   * Failure handler for the whole process - if the process failed.
   */
  onFailed = async (result: OperationResult) => {
    await printLine(red(`   [✖] Synchronization - failed (${result.timeElapsed}s)\n`));
  };

  /**
   * Check the results for each connection and display them.
   * All the successful / failed attempts are displayed and errors are logged.
   *
   * @param {SyncResult[]} results
   * @returns {Promise<{ totalCount: number, failedCount: number, successfulCount: number }>}
   */
  async processResults(
    results: OperationResult[]
  ): Promise<{ totalCount: number; failedCount: number; successfulCount: number }> {
    const totalCount = results.length;
    const failedAttempts = results.filter(result => !result.success);
    const successfulCount = totalCount - failedAttempts.length;
    const failedCount = totalCount - successfulCount;
    const allComplete = failedCount === 0;

    // If there are errors, display all of them.
    if (!allComplete) {
      await printLine(`Synchronization failed for ${failedCount} connection(s):\n`);

      for (const attempt of failedAttempts) {
        await printLine(bold(` ▸ ${attempt.connectionId}\n`));
        await printError(attempt.error);

        // Send verbose error with stack trace to debug logs.
        log(attempt.error);

        await printLine();
      }
    }

    return { totalCount, failedCount, successfulCount };
  }

  /**
   * CLI command execution handler.
   *
   * @returns {Promise<void>}
   */
  async run(): Promise<void> {
    const { flags: parsedFlags } = this.parse(Synchronize);
    const isDryRun = parsedFlags['dry-run'];

    try {
      const config = await loadConfig(parsedFlags.config);
      const connections = await resolveConnections(config, parsedFlags['connection-resolver']);
      const timeStart = process.hrtime();

      if (isDryRun) await printLine(magenta('\n• DRY RUN STARTED\n'));

      await printLine('Synchronizing...\n');

      const results = await synchronize(config, connections, {
        ...parsedFlags,
        onStarted: this.onStarted,
        onTeardownSuccess: this.onPruneSuccess,
        onSuccess: this.onSuccess,
        onFailed: this.onFailed,
        onMigrationSuccess: this.onMigrationSuccess,
        onMigrationFailed: this.onMigrationFailed
      });

      const { totalCount, failedCount, successfulCount } = await this.processResults(results);

      if (successfulCount > 0) {
        // Display output.
        await printLine(
          `Synchronization complete for ${successfulCount} / ${totalCount} connection(s). ` +
            `(${getElapsedTime(timeStart)}s)\n`
        );
      }

      // If all completed successfully, exit gracefully.
      if (failedCount === 0) {
        if (isDryRun) await printLine(magenta('• DRY RUN ENDED\n'));

        return process.exit(0);
      }

      throw new Error(`Synchronization failed for ${failedCount} / ${totalCount} connections.`);
    } catch (e) {
      // Send verbose error with stack trace to debug logs.
      log(e);

      await printError(e.toString());

      if (isDryRun) await printLine(magenta('\n• DRY RUN ENDED\n'));

      process.exit(-1);
    }
  }
}

export default Synchronize;
