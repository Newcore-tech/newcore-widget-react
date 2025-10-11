import Client from "../client";
import { WebEventBus } from "@coreui/web-event-bus";

/**
 * @deprecated Use hooks.ts
 */
export const XHYClient = {
  _initialized: false,
  _locationReady: false,
  _resolveQueue: [] as Array<(client: Client) => void>,
  _rejectQueue: [] as Array<(error: Error) => void>,
  _initTimeout: 10000, // 默认10秒超时
  _timeoutIds: new Set<number>(), // 存储超时ID用于清理
  _subscriptions: new Set<string>(), // 存储订阅ID用于清理
  _eventBus: new WebEventBus(),
  _messageListener: undefined,

  async init(): Promise<Client> {
    try {
      // 使用Client.getInstance()创建单例实例
      const client = new Client();

      // 确保实例正确创建
      if (!client || typeof client !== "object") {
        throw new Error("Failed to create valid Client instance");
      }

      // // 检查必要方法是否存在
      // if (typeof client.onMounted !== 'function') {
      //   throw new Error('Client instance missing required onMounted method');
      // }

      // 如果已经初始化且location已存在，直接返回
      if (this._initialized) {
        return Promise.resolve(client);
      }

      // 初始化逻辑
      if (!this._initialized) {
        try {
          this._initialized = true;

          // 需要监听的事件类型列表
          const eventTypes = ["get_location_intl", "update_config", "language_change"];

          // 使用for循环订阅所有需要的事件
          for (const eventType of eventTypes) {
            const eventName = `web-event-bus:${eventType}`;
            console.log(`正在订阅事件: ${eventName}`);

            // 使用WebEventBus的subscribe方法订阅事件
            this._eventBus.subscribe(eventName, (eventData: Record<string, unknown>) => {
              try {
                if (eventType === "get_location_intl") {
                  this._locationReady = true;

                  // 通知所有等待的调用
                  this._resolveQueue.forEach((resolve) => resolve(client));
                  this._resolveQueue = [];
                  this._rejectQueue = [];

                  // 清理所有超时
                  this._timeoutIds.forEach((id) => clearTimeout(id));
                  this._timeoutIds.clear();
                } else if (eventType === "update_config") {
                  // 处理配置更新事件
                } else if (eventType === "language_change") {
                  // 处理语言变更事件
                  if (eventData?.language) {
                    // 更新客户端语言设置
                  }
                }
              } catch (error) {
                console.error(`Error processing ${eventType} event:`, error);
                // 通知所有等待的调用发生错误
                this._rejectQueue.forEach((reject) =>
                  reject(
                    error instanceof Error ? error : new Error("Unknown event processing error"),
                  ),
                );
                this._resolveQueue = [];
                this._rejectQueue = [];

                // 清理所有超时
                this._timeoutIds.forEach((id) => clearTimeout(id));
                this._timeoutIds.clear();
              }
            });

            this._subscriptions.add(eventName);
            console.log(`事件订阅成功: ${eventName}`);
          }
        } catch (error) {
          this._initialized = false;
          throw new Error(
            `Failed to initialize XHYClient: ${
              error instanceof Error ? error.message : "Unknown error"
            }`,
          );
        }
      }

      // 直接返回 client，不再等待位置信息即可完成初始化
      return Promise.resolve(client);
    } catch (error) {
      throw new Error(
        `XHYClient init failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  },

  // 重置状态的方法，用于错误恢复
  reset() {
    this._initialized = false;
    this._locationReady = false;

    // 清理所有等待的Promise
    this._rejectQueue.forEach((reject) => reject(new Error("XHYClient reset")));
    this._resolveQueue = [];
    this._rejectQueue = [];

    // 清理所有超时
    this._timeoutIds.forEach((id) => clearTimeout(id));
    this._timeoutIds.clear();

    // 清理所有事件订阅
    this._subscriptions.forEach((subId) => {
      try {
        this._eventBus.unsubscribe(subId);
      } catch (error) {
        console.error(`Failed to unsubscribe: ${error}`);
      }
    });
    this._subscriptions.clear();

    // 移除 window 消息监听
    if (this._messageListener) {
      try {
        window.removeEventListener("message", this._messageListener as EventListener);
      } catch (e) {
        console.error("Failed to remove window message listener:", e);
      }
      this._messageListener = undefined;
    }
  },

  // 检查是否已初始化
  isInitialized(): boolean {
    return this._initialized;
  },

  // 检查位置是否已就绪
  isLocationReady(): boolean {
    return this._locationReady;
  },
};
