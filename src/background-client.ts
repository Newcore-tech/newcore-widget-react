import { WebEventBus } from "@coreui/web-event-bus";

export function toBackgroundEventName(name: string) {
  return `background-event:${name}`;
}

class BackgroundClient {
  // 创建WebEventBus实例
  private eventBus: WebEventBus = new WebEventBus();
  private listeners: Record<string, ((event?: unknown) => void)[]> = {};
  private onInterceptCallbacks: Record<
    string,
    (data: unknown) => Promise<{ success: boolean; message?: string }>
  > = {};

  // 修改构造函数
  constructor() {
    this.init();
  }

  //初始化方法
  init() {
    /**
     * #onChange
     * event: {
     *   eventName: string;
     *   data: unknown;
     * }
     */
    this.eventBus.subscribe(toBackgroundEventName("#onChange"), (event) => {
      console.log("Client #onChange event: ", event);
      const eventName = event.eventName as string;
      const data = event.data;
      const listenerList = this.listeners[eventName];
      listenerList?.forEach((listener) => listener(data));
    });

    /**
     * #onIntercept
     * event: {
     *   eventName: string;
     *   data: unknown;
     *   key: string;
     * }
     */
    this.eventBus.subscribe(toBackgroundEventName("#onIntercept"), (event) => {
      console.log("Client #onIntercept event: ", event);
      const name = event.name as string;
      const data = event.data;
      const interceptor = this.onInterceptCallbacks[name];
      if (interceptor) {
        interceptor(data)
          .then((r) => {
            this.eventBus.publishParent(toBackgroundEventName("#intercept-result"), {
              success: r.success,
              message: r.message,
              name,
            });
          })
          .catch((e) => {
            console.error(`Error in onIntercept callback for event ${name}: ${e}`);
            this.eventBus.publishParent(toBackgroundEventName("#intercept-result"), {
              success: false,
              message: `Error in onIntercept callback for event ${name}: ${String(e)}`,
            });
          });
      }
    });
  }

  clear() {
    // 清理所有事件监听器
    for (const eventName in this.listeners) {
      delete this.listeners[eventName];
    }

    // 清理eventBus资源
    // this.eventBus.destroy(); // WebEventBus可能没有destroy方法
  }

  /**
   * 可拦截事件绑定
   * @param name
   * @param interceptor
   */
  addInterceptor(
    name: string,
    interceptor: (data: unknown) => Promise<{ success: boolean; message?: string }>,
  ) {
    this.onInterceptCallbacks[name] = interceptor;
  }

  removeInterceptor(name: string) {
    delete this.onInterceptCallbacks[name];
  }

  /**
   * 事件绑定
   * @param eventName 事件名称
   * @param func 事件回调
   */
  on(eventName: string, func: (event?: unknown) => void) {
    const listener = this.listeners[eventName];
    if (listener) {
      listener.push(func);
    } else {
      this.listeners[eventName] = [func];
    }
  }

  /**
   * 事件解绑
   * @param eventName 事件名称
   * @param func 事件回调
   */
  off(eventName: string, func?: (event?: unknown) => void) {
    if (func) {
      const listener = this.listeners[eventName];
      if (listener) {
        const index = listener.indexOf(func);
        if (index !== -1) {
          listener.splice(index, 1);
        }
      }
    } else {
      delete this.listeners[eventName];
    }
  }

  /**
   * 事件是否绑定
   * @param eventName 事件名称
   * @param func 事件回调
   * @returns
   */
  has(eventName: string, func?: (event?: unknown) => void): boolean {
    if (func) {
      const listener = this.listeners[eventName];
      if (listener) {
        const index = listener.indexOf(func);
        if (index !== -1) {
          return true;
        }
      }
    } else {
      // 如果没有传入回调函数，检查是否有该事件的监听器
      return eventName in this.listeners && this.listeners[eventName].length > 0;
    }
    return false;
  }

  /**
   * 获取字段数据
   * @param path 字段路径
   * @returns
   */
  async get(path: string): Promise<{ success: boolean; message?: string; data?: unknown }> {
    let pResolve;

    const p = new Promise<{ success: boolean; message?: string; data?: unknown }>((resolve) => {
      pResolve = resolve;
    });
    this.eventBus.subscribe(toBackgroundEventName(`#get-response:${path}`), (event) => {
      console.log("#get response: ", event);
      pResolve?.(event);
      this.eventBus.unsubscribe(toBackgroundEventName(`#get-response:${path}`));
    });
    this.eventBus.publishParent(toBackgroundEventName("#get"), { path });
    return p;
  }

  /**
   * 设置字段数据
   * @param path 字段路径
   * @param value 字段值
   */

  async set(path: string, value: unknown): Promise<{ success: boolean; message?: string }> {
    let pResolve;

    const p = new Promise<{ success: boolean; message?: string }>((resolve) => {
      pResolve = resolve;
    });
    this.eventBus.subscribe(toBackgroundEventName(`#set-result:${path}`), (event) => {
      console.log("#set ack: ", event);
      pResolve({ success: event.success, message: event.message });
      this.eventBus.unsubscribe(toBackgroundEventName(`#set-result:${path}`));
    });
    // 发布set事件
    this.eventBus.publishParent(toBackgroundEventName("#set"), { path, value });

    return p;
  }

  /**
   * 调用方法
   * @param path 方法路径
   * @param args 方法参数
   * @returns
   */
  async invoke(
    path: string,
    ...args: unknown[]
  ): Promise<{ success: boolean; message?: string; data: unknown }> {
    // 实现方法调用逻辑
    let pResolve;

    const p = new Promise<{ success: boolean; message?: string; data: unknown }>((resolve) => {
      pResolve = resolve;
    });
    this.eventBus.subscribe(toBackgroundEventName(`#invoke-result:${path}`), (event) => {
      pResolve({ success: event.success, message: event.message, data: event.data });
      this.eventBus.unsubscribe(toBackgroundEventName(`#invoke-result:${path}`));
    });
    // 发布invoke事件
    this.eventBus.publishParent(toBackgroundEventName("#invoke"), { path, args });

    return p;
  }

  /**
   * 触发事件
   * @param eventName 事件名称
   * @param data 数据
   * @returns
   */
  trigger(eventName: string, data: unknown) {
    // 发布trigger事件
    this.eventBus.publishParent(toBackgroundEventName("#trigger"), { eventName, data });
  }

  /**
   * 发送请求，支持跨域请求
   * @param url 请求地址
   * @param options 请求配置
   * @returns
   */
  async request(url: string, options?: RequestInit): Promise<Response> {
    const uri = new URL(url);
    if (uri.origin === window.location.origin) {
      return Promise.reject(new Error("Origin is not allowed"));
    }
    //Proxy
    return fetch(url, options);
  }
}

export default BackgroundClient;
