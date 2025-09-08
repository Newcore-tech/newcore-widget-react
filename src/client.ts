import { WebEventBus } from "@coreui/web-event-bus";
import Context from "./context";


function toEventName(name: string) {
    return `web-event-bus:${name}`;
}

class Client {
    context: Context | Record<string, unknown> = {};
    // 添加单例实例
    private static instance: Client | null = null;
    // 获取单例实例的静态方法
    public static getInstance(): Client {
        if (!Client.instance) {
            Client.instance = new Client();
            // 在创建实例后配置allowedOrigins
            if (Client.instance.eventBus.allowedOrigins instanceof Set) {
                const allowedOrigins = [
                    window.location.origin,
                    'http://localhost:5174',
                    'http://localhost:5173',
                    'https://c2.xinheyun.com'
                ];
                
                allowedOrigins.forEach(origin => Client.instance!.eventBus.allowedOrigins.add(origin));
            }
        }
        return Client.instance;
    }
    // 创建WebEventBus实例
    private eventBus: WebEventBus = new WebEventBus();
    private listeners: { [key: string]: ((event?: unknown) => void)[] } = {};
    private dataStore: { [key: string]: unknown } = {};

    // 修改构造函数
    constructor(public location?: string) {
        // 不再强制要求location参数
        this.context = Context.getInstance();
    }

    // 静态初始化方法
    static async init(timeout: number = 10000, options?: { location?: string }) {
        return new Promise((resolve, reject) => {
            const timer = setTimeout(() => {
                reject(new Error(`XHYClient initialization timeout after ${timeout}ms`));
            }, timeout);

            try {
                // 使用getInstance获取单例实例
                const client = Client.getInstance();
                
                
                if (options?.location) {
                    client.location = options.location;
                }
                
                clearTimeout(timer);
                resolve(client);
            } catch (error) {
                clearTimeout(timer);
                reject(error);
            }
        });
    }
    
    /** 更新 */
    update(payload: Partial<Client>) {
        Object.assign(this, payload);
    }

    /** 事件监听 */
    listen(func: (event?: MessageEvent) => void) {
        console.log('--->window.addEventListener')
        console.log(window.addEventListener)
         
        window.addEventListener('message', (event) => {
            // if (event?.origin !== 'https://c2.xinheyun.com') {
            //     return;
            // }
            console.log('嵌入页：插件listen收到的完整事件:', JSON.stringify(event, null, 2));
            func(event);
        })
    }

    /** 事件触发 */
    trigger(eventName: string, data = {}) {
        console.log('触发事件:', eventName, data);
        const message = {
            key: 'web-event-bus',  
            eventName: eventName,  
            payload: data,  
            __xhyEvent: true,
            timestamp: Date.now()
        };
        window.parent.postMessage(message, '*');  
        console.log('trigger发送的消息（目标：父窗口）:', message);
    }

    /** 生命周期 - 挂载 */
    onMounted(context?: Context) {
        console.log('组件已挂载', context);
        
        // 保存上下文信息
        if (context) {
            this.location = context.location;
        }
        
        // 初始化事件监听
        // this.eventBus.init(); 
        
        // 触发挂载事件，通知父窗口
        this.trigger('component-mounted', { context });
        
        // 注册全局消息监听
        this.listen((event) => {
            // 处理来自父窗口的消息
            if (event?.data?.__xhyEvent) {
                const { eventName, payload } = event.data;
                // 触发对应的本地事件
                if (this.listeners[eventName]) {
                    this.listeners[eventName].forEach(listener => {
                        try {
                            listener(payload);
                        } catch (error) {
                            console.error(`Error in listener for event ${eventName}:`, error);
                        }
                    });
                }
            }
        });
    }

    /** 生命周期 - 卸载 */
    onUnmounted() {
        console.log('组件已卸载');
        
        // 触发卸载事件，通知父窗口
        this.trigger('component-unmounted');
        
        // 清理所有事件监听器
        for (const eventName in this.listeners) {
            delete this.listeners[eventName];
        }
        
        // 清理数据存储
        this.dataStore = {};
        
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
async get(path: string): Promise<unknown> {
  
  // 向主页面发送请求
  return new Promise((resolve) => {
    const eventId = `get_${Date.now()}`; 
    
    // 监听主页面的响应
    const listener = (event: MessageEvent) => {
      if (event.data?.key === 'web-event-bus' && 
          event.data?.eventName === `get:response:${eventId}`) {
        resolve(event.data.payload);
        window.removeEventListener('message', listener); 
      }
    };
    window.addEventListener('message', listener);
    
   
    const message = {
      key: 'web-event-bus',  
      eventName: `get:${path}`,  
      payload: { eventId },  
      __xhyEvent: true,
      timestamp: Date.now()
    };
    window.parent.postMessage(message, '*');
  });
}
    
    /**
     * 设置字段数据
     * @param path 字段路径
     * @param value 字段值
     */
   
async set(path: string, value: unknown) {
    
    // 原有本地数据存储逻辑保持不变
    if (!path) {
        this.dataStore = value as { [key: string]: unknown };
    } else {
        const keys = path.split('.');
        let target = this.dataStore;
        
        for (let i = 0; i < keys.length - 1; i++) {
            const key = keys[i];
            if (target[key] === undefined || typeof target[key] !== 'object') {
                target[key] = {} as { [key: string]: unknown };
            }
            target = target[key] as { [key: string]: unknown };
        }
        
        const lastKey = keys[keys.length - 1];
        target[lastKey] = value;
    }
    
    
    // 发布本地事件总线事件
    this.eventBus.publish(toEventName("set"), { path, value } as { [key: string]: unknown });
    
    // 触发本地事件监听器
    if (this.listeners[path]) {
        this.listeners[path].forEach(listener => {
            try {
                listener({ path, value });
            } catch (error) {
                console.error(`Error in listener for event ${path}:`, error);
            }
        });
    } else {
        console.log(`[SET] 没有找到路径 ${path} 的本地事件监听器`);
    }


    const message = {
        key: 'web-event-bus',  
        eventName: 'web-event-bus:set',  // 保持与主页面约定的事件名
        payload: { key: path, value: value },  // 主页面期望的格式
        __xhyEvent: true,
        timestamp: Date.now()
    };
    window.parent.postMessage(message, '*'); 
}

    /**
     * 调用方法
     * @param path 方法路径
     * @param args 方法参数
     * @returns 
     */
    async invoke(path: string, ...args: unknown[]): Promise<unknown> {
        // 实现方法调用逻辑
        const methodName = toEventName(`invoke:${path}`);
        return new Promise((resolve, reject) => {
            try {
                // 发布调用事件
                this.eventBus.publish(methodName, { path, args });
                resolve(undefined); // 简单实现，实际应该根据具体需求调整
            } catch (error) {
                reject(error);
            }
        });
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