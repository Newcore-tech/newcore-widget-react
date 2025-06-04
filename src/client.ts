import Context from "./context";

class Client {
    /** 平台上下文 */
    context = {};

    constructor() {
        this.context = new Context();
    }

    /** 更新 */
    private update (payload: Partial<Client>) {
        Object.assign(this, payload);
    }

    /** 事件监听 */
    on (func: (event?: any) => void) {
        window.parent.addEventListener('message', (event) => {
            // if (event?.origin !== 'https://c2.xinheyun.com') {
            //     return;
            // }
            func(event);
        })
    }

    /** 事件触发 */
    trigger (eventName: string, data?: any) {
        window.parent.postMessage({
            data,
            eventName,
        });
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