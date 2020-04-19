import Configuration from './Configuration';
import SynchronizeParams from './SyncParams';

/**
 * Synchronize context parameters for the current database connection.
 */
interface SyncContext {
  config: Configuration;
  connectionId: string;
  params: SynchronizeParams;
}

export default SyncContext;
