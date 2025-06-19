import Context from "./context";

class Client {
    /** 平台上下文 */
    context: any = {};

    private static instance: Client;

    /** 单例访问方法 */
    public static getInstance(): Client {
        if (!Client.instance) {
            console.log('单例创建模式')
            Client.instance = new Client();
        }
        return Client.instance;
    }

    constructor() {
        this.context = Context.getInstance();
    }

    /** 更新 */
    update (payload: Partial<Client>) {
        Object.assign(this, payload);
    }

    /** 事件监听 */
    on (func: (event?: any) => void) {
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
    trigger (eventName: string, data = {}) {
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

    /** 获取当前位置 */
    // getLocation () {
    //     this.on((event?: any) => {
    //         if (event?.data?.eventName === 'get_location') {
    //             this.update({
    //                 context: {
    //                     ...this.context || {},
    //                     location: event?.data?.location,
    //                 }
    //             })
    //         }
    //     });
    // }
}

export default Client;