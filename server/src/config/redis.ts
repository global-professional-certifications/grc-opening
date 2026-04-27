import IORedis from 'ioredis';

/**
 * Redis connection configuration for BullMQ.
 * 
 * LAZY INITIALIZATION: Connections are NOT created at import time.
 * They are created on-demand when getRedisConnection() is called.
 * This prevents error spam when Redis is not running.
 */

const REDIS_URL = process.env.REDIS_URL || 'redis://127.0.0.1:6379';

let _sharedConnection: IORedis | null = null;
let _connectionFailed = false;
let _lastErrorLog = 0;

/**
 * Get the shared Redis connection (for queue producers).
 * Returns null if Redis is unavailable — callers must handle this.
 */
export function getRedisConnection(): IORedis | null {
  if (_connectionFailed) return null;
  
  if (!_sharedConnection) {
    _sharedConnection = createRedisConnection();
    
    _sharedConnection.on('error', (err) => {
      // Throttle error logging to once every 30 seconds
      const now = Date.now();
      if (now - _lastErrorLog > 30_000) {
        console.warn(`⚠️  Redis unavailable: ${err.message}`);
        console.warn(`   Resume parsing queue is disabled. Install Redis to enable it.`);
        _lastErrorLog = now;
      }
    });

    _sharedConnection.on('connect', () => {
      _connectionFailed = false;
      console.log('📡 Redis connected for BullMQ');
    });
  }
  
  return _sharedConnection;
}

/**
 * Check if Redis is available by attempting a quick ping.
 */
export async function isRedisAvailable(): Promise<boolean> {
  try {
    const conn = getRedisConnection();
    if (!conn) return false;
    await conn.ping();
    return true;
  } catch {
    return false;
  }
}

/**
 * Creates a new Redis connection instance.
 * BullMQ workers need their own connection — do not share with the queue producer.
 */
export function createRedisConnection(): IORedis {
  return new IORedis(REDIS_URL, {
    maxRetriesPerRequest: null, // Required by BullMQ
    enableReadyCheck: false,
    retryStrategy(times) {
      // Stop retrying after 5 attempts — don't spam reconnection attempts
      if (times > 5) {
        _connectionFailed = true;
        return null; // Stop retrying
      }
      return Math.min(times * 1000, 5000); // 1s, 2s, 3s, 4s, 5s
    },
    lazyConnect: true, // Don't connect immediately
  });
}

export { REDIS_URL };
