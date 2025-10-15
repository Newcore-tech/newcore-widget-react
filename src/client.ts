import { WebEventBus } from "@coreui/web-event-bus";

class Client {
  // 创建WebEventBus实例
  protected eventBus: WebEventBus = new WebEventBus();
  protected listeners: Record<string, ((event?: unknown) => void)[]> = {};

  // 修改构造函数
  constructor() {
    this.init();
  }

  getEventName(name: string): string {
    return `widget-event:${name}`;
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
    this.eventBus.subscribe(this.getEventName("#onChange"), (event) => {
      console.log("Client #onChange event: ", event);
      const eventName = event.eventName as string;
      const data = event.data;
      const listenerList = this.listeners[eventName];
      listenerList?.forEach((listener) => listener(data));
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
    this.eventBus.subscribe(this.getEventName(`#get-response:${path}`), (event) => {
      console.log("#get response: ", event);
      pResolve?.(event);
      this.eventBus.unsubscribe(this.getEventName(`#get-response:${path}`));
    });
    this.eventBus.publishParent(this.getEventName("#get"), { path });
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
    this.eventBus.subscribe(this.getEventName(`#set-result:${path}`), (event) => {
      console.log("#set ack: ", event);
      pResolve({ success: event.success, message: event.message });
      this.eventBus.unsubscribe(this.getEventName(`#set-result:${path}`));
    });
    // 发布set事件
    this.eventBus.publishParent(this.getEventName("#set"), { path, value });

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
    this.eventBus.subscribe(this.getEventName(`#invoke-result:${path}`), (event) => {
      pResolve({ success: event.success, message: event.message, data: event.data });
      this.eventBus.unsubscribe(this.getEventName(`#invoke-result:${path}`));
    });
    // 发布invoke事件
    this.eventBus.publishParent(this.getEventName("#invoke"), { path, args });

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
    this.eventBus.publishParent(this.getEventName("#trigger"), { eventName, data });
  }

  /**
   * 发送请求，支持跨域请求
   * @param url 请求地址
   * @param options 请求配置
   * @returns
   */
  async requestProxy(
    url: string,
    {
      method,
      headers,
      body,
    }: {
      method: "GET" | "POST" | "PUT" | "DELETE" | "HEAD" | "OPTIONS" | "TRACE";
      headers?: Record<string, string>;
      body?: string | Record<string, unknown>;
    },
  ): Promise<Response> {
    const uri = new URL(url);

    //Proxy
    let paramHeaders: Record<string, string[]> | undefined = undefined;
    if (headers) {
      Object.entries(headers).forEach(([key, value]) => {
        if (paramHeaders) {
          paramHeaders[key] = Array.isArray(value) ? value : [String(value)];
        } else {
          paramHeaders = { [key]: Array.isArray(value) ? value : [String(value)] };
        }
      });
    }
    let queryParams: Record<string, string[]> | undefined = undefined;
    if (uri.searchParams) {
      uri.searchParams.forEach((value, key) => {
        if (queryParams) {
          queryParams[key] = [value];
        } else {
          queryParams = { [key]: [value] };
        }
      });
    }
    let paramBody: string | undefined = undefined;
    if (body && typeof body === "object") {
      paramBody = JSON.stringify(body);
    } else if (body) {
      paramBody = body;
    }
    return fetch("/api/orch/openapiv2/webWidget/forward", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url,
        method,
        headers: paramHeaders,
        body: paramBody,
        queryParams,
      }),
    });
  }
}

export default Client;
