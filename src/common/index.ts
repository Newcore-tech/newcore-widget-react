import Client from "../client";
import { IXHYClient } from "../type";

export const XHYClient: IXHYClient = {
  _initialized: false,
  _locationReady: false,
  _resolveQueue: [] as Array<(client: Client) => void>,
  _rejectQueue: [] as Array<(error: Error) => void>,
  _initTimeout: 10000, // 默认10秒超时
  _timeoutIds: new Set<number>(), // 存储超时ID用于清理

  async init(timeout: number = 10000): Promise<Client> {
    try {
      const client = Client.getInstance();

      // 如果已经初始化且location已存在，直接返回
      if (this._initialized && client?.context?.location) {
        return Promise.resolve(client);
      }

      // 初始化逻辑（仅执行一次）
      if (!this._initialized) {
        try {
          client.trigger('plugin_ready');
          this._initialized = true;

          // 监听location更新
          client.on((event) => {
            try {
              console.log('---> event info')
              console.log(event)
              if (event?.data?.type === 'get_location_intl') {
                this._locationReady = true;

                client.update({
                  context: {
                    ...client.context,
                    location: event?.data?.location,
                    language: event?.data?.language,
                  }
                });

                // 通知所有等待的调用
                this._resolveQueue.forEach(resolve => resolve(client));
                this._resolveQueue = [];
                this._rejectQueue = [];

                // 清理所有超时
                this._timeoutIds.forEach(id => clearTimeout(id));
                this._timeoutIds.clear();
              }
            } catch (error) {
              console.error('Error processing event:', error);
              // 通知所有等待的调用发生错误
              this._rejectQueue.forEach(reject => reject(error instanceof Error ? error : new Error('Unknown event processing error')));
              this._resolveQueue = [];
              this._rejectQueue = [];

              // 清理所有超时
              this._timeoutIds.forEach(id => clearTimeout(id));
              this._timeoutIds.clear();
            }
          });
        } catch (error) {
          this._initialized = false;
          throw new Error(`Failed to initialize XHYClient: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      console.log('--->location info')
      console.log(client?.context?.location)

      // 如果location已经有值
      if (client?.context?.location) {
        return Promise.resolve(client);
      }

      // 返回一个Promise，当location更新后resolve，或超时后reject
      return new Promise((resolve, reject) => {
        this._resolveQueue.push(resolve);
        this._rejectQueue.push(reject);

        // 设置超时
        const timeoutId = setTimeout(() => {
          const index = this._resolveQueue.indexOf(resolve);
          if (index > -1) {
            this._resolveQueue.splice(index, 1);
            this._rejectQueue.splice(index, 1);
            reject(new Error(`XHYClient initialization timeout after ${timeout}ms`));
          }
          this._timeoutIds.delete(timeoutId);
        }, timeout);

        this._timeoutIds.add(timeoutId);
      });
    } catch (error) {
      throw new Error(`XHYClient init failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },

  // 重置状态的方法，用于错误恢复
  reset() {
    this._initialized = false;
    this._locationReady = false;

    // 清理所有等待的Promise
    this._rejectQueue.forEach(reject => reject(new Error('XHYClient reset')));
    this._resolveQueue = [];
    this._rejectQueue = [];

    // 清理所有超时
    this._timeoutIds.forEach(id => clearTimeout(id));
    this._timeoutIds.clear();
  },

  // 检查是否已初始化
  isInitialized(): boolean {
    return this._initialized;
  },

  // 检查位置是否已就绪
  isLocationReady(): boolean {
    return this._locationReady;
  }
}