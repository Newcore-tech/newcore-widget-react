import { WebEventData } from "./types";

export class WebEventBus {
  private listeners: Record<string, (ev: MessageEvent) => void> = {};
  private iframeListeners: Record<string, Record<string, (ev: MessageEvent) => void>> = {};
  private allowedOrigins: Set<string> = new Set();
  private iframeTargets: Map<string, Window> = new Map();

  /**
   * 添加允许的源
   * @param origin 允许的源地址
   */
  addAllowedOrigin(origin: string) {
    this.allowedOrigins.add(origin);
  }

  /**
   * 移除允许的源
   * @param origin 要移除的源地址
   */
  removeAllowedOrigin(origin: string) {
    this.allowedOrigins.delete(origin);
  }

  /**
   * 添加 iframe 目标
   * @param targetName 目标名称
   * @param targetWindow iframe 的 contentWindow
   */
  addIframeWindow(targetName: string, targetWindow: Window) {
    this.iframeTargets.set(targetName, targetWindow);
  }

  /**
   * 移除 iframe 目标
   * @param targetName 目标名称
   */
  removeIframeWindow(targetName: string) {
    this.iframeTargets.delete(targetName);
  }

  /**
   * 订阅指定事件
   * @param eventName 事件名称
   * @param callback 事件触发时的回调函数，接收事件传递的数据
   */
  subscribe(eventName: string, callback: (data: Record<string, unknown>) => void) {
    const listener = (event: MessageEvent) => {
      if (
        (event.origin === window.location.origin ||
          this.allowedOrigins.has(event.origin) ||
          this.allowedOrigins.size === 0) &&
        typeof event.data === "object" &&
        event.data !== null
      ) {
        try {
          const eventData: WebEventData = event.data as WebEventData;
          if (eventData.key === "web-event-bus" && eventData.eventName === eventName) {
            callback(eventData.data);
          }
        } catch (e) {
          console.error("Parse event data error", e);
        }
      } else {
        // 只有在源不被允许时才输出错误信息
        if (
          event.origin &&
          this.allowedOrigins.size > 0 &&
          !this.allowedOrigins.has(event.origin)
        ) {
          console.error("Invalid Event Origin: ", event.origin);
        }
      }
    };
    this.listeners[eventName] = listener;
    window.addEventListener("message", listener);
  }

  /**
   * 发布指定事件到所有监听者（包括同源和允许的源）
   * @param eventName 事件名称
   * @param data 事件数据
   */
  publish(eventName: string, data: Record<string, unknown>) {
    window.postMessage({ eventName, data, key: "web-event-bus" }, "*");
  }

  publishParent(eventName: string, data: Record<string, unknown>) {
    window.parent?.postMessage({ eventName, data, key: "web-event-bus" }, "*");
  }

  unsubscribe(eventName: string) {
    window.removeEventListener("message", this.listeners[eventName]);
  }

  subscribeOfIframe(
    targetName: string,
    eventName: string,
    callback: (data: Record<string, unknown>) => void,
  ) {
    const target = this.iframeTargets.get(targetName);
    if (target) {
      const listener = (event: MessageEvent) => {
        if (
          (event.origin === window.location.origin ||
            this.allowedOrigins.has(event.origin) ||
            this.allowedOrigins.size === 0) &&
          typeof event.data === "object" &&
          event.data !== null
        ) {
          try {
            const eventData: WebEventData = event.data as WebEventData;
            if (eventData.key === "web-event-bus" && eventData.eventName === eventName) {
              callback(eventData.data);
            }
          } catch (e) {
            console.error("Parse event data error", e);
          }
        } else {
          // 只有在源不被允许时才输出错误信息
          if (
            event.origin &&
            this.allowedOrigins.size > 0 &&
            !this.allowedOrigins.has(event.origin)
          ) {
            console.error("Invalid Event Origin: ", event.origin);
          }
        }
      };
      let listeners = this.iframeListeners[targetName];
      if (!listeners) {
        listeners = {};
      }
      listeners[eventName] = listener;
      this.iframeListeners[targetName] = listeners;
      target.addEventListener("message", listener);
    } else {
      console.error(`Iframe target '${targetName}' not found`);
    }
  }
  /**
   * 发布指定事件到特定的 iframe
   * @param targetName iframe 目标名称
   * @param eventName 事件名称
   * @param data 事件数据
   * @param targetOrigin 目标源，默认为当前窗口源
   */
  publishToIframe({
    targetName,
    eventName,
    data,
    targetOrigin,
  }: {
    targetName: string;
    eventName: string;
    data: Record<string, unknown>;
    targetOrigin: string;
  }) {
    const target = this.iframeTargets.get(targetName);
    if (target) {
      target.postMessage({ eventName, data, key: "web-event-bus" }, targetOrigin);
    } else {
      console.error(`Iframe target '${targetName}' not found`);
    }
  }

  unsubscribeOfIframe(targetName: string, eventName: string) {
    const listeners = this.iframeListeners[targetName];
    if (listeners) {
      if (listeners[eventName]) {
        window.removeEventListener("message", listeners[eventName]);
        delete listeners[eventName];
      }
    }
  }
}

export const eventBus = new WebEventBus();
