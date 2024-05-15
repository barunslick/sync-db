import { Command, flags } from '@oclif/command';
// import { bold, grey, red, cyan, yellow } from 'chalk';

import { printLine } from '../util/io';
import { loadConfig, resolveConnections } from '..';

class ConnectionsList extends Command {
  static description = 'List all the connections.';

  static flags = {
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
   * CLI command execution handler.
   *
   * @returns {Promise<void>}
   */
  async run(): Promise<void> {
    const { flags: parsedFlags } = this.parse(ConnectionsList);
    const config = await loadConfig(parsedFlags.config);
    const connections = await resolveConnections(config, parsedFlags['connection-resolver']);

    const available_connections = connections.map(({ id }) => id);

    printLine('List of available connections:')
    for (const connection of available_connections ) {
      await printLine(`connection`);
    }
  }
}

export default ConnectionsList;
