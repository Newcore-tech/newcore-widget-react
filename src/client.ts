import { Context } from "./type";
import { WebEventBus } from "@coreui/web-event-bus";


function toEventName(name: string) {
    return `web-event-bus:${name}`;
}
class Client {
    private eventBus: WebEventBus = new WebEventBus();
    private listeners: { [key: string]: ((event?: any) => void)[] } = {};

    /** 更新 */
    update(payload: Partial<Client>) {
        Object.assign(this, payload);
    }

    /** 事件监听 */
    listen(func: (event?: any) => void) {
        console.log('--->window.addEventListener')
        console.log(window.addEventListener)
        window.addEventListener('message', (event) => {
            // if (event?.origin !== 'https://c2.xinheyun.com') {
            //     return;
            // }
            func(event);
        })
    }

    /** 事件触发 */
    trigger(eventName: string, data = {}) {
        console.log('eventName')
        console.log(eventName);
        const message = {
            eventName,
            __xhyEvent: true,
            timestamp: Date.now(),
            ...data,
        }
        window.postMessage(message, '*');
    }

    /** 生命周期 - 挂载 */
    onMounted(context?: Context) {

    }

    /** 生命周期 - 卸载 */
    onUnmounted() {

    }

    /**
     * 事件绑定
     * @param eventName 事件名称
     * @param func 事件回调
     */
    on(eventName: string, func: (event?: any) => void) {
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
    off(eventName: string, func?: (event?: any) => void) {
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
    has(eventName: string, func?: (event?: any) => void): boolean {
        if (func) {
            const listener = this.listeners[eventName];
            if (listener) {
                const index = listener.indexOf(func);
                if (index !== -1) {
                    return true;
                }
            }
        }
        return false;
    }

    /**
     * 获取字段数据
     * @param path 字段路径
     * @returns 
     */
    async get(path: string): Promise<any> {

    }

    /**
     * 设置字段数据
     * @param path 字段路径
     * @param value 字段值
     */
    async set(path: string, value: any) {
        this.eventBus.publish(toEventName("set"), { path, value });
    }

    /**
     * 调用方法
     * @param path 方法路径
     * @param args 方法参数
     * @returns 
     */
    async invoke(path: string, ...args: any[]): Promise<any> {

    }

    /**
     * 获取当前语言
     * @returns 
     */
    async currentLanguage(): Promise<string> {
        return 'zh-CN';
    }
    /**
     * 发送请求，支持跨域请求
     * @param url 请求地址
     * @param options 请求配置
     * @returns 
     */
    async request(url: string, options?: RequestInit): Promise<Response> {
        const uri = new URL(url);
        if (uri.origin !== window.location.origin) {
            //Proxy
        }
        return fetch(url, options);
    }

}

export default Client;