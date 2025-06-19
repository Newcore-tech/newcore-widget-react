import Client from "../client";

export const XHYClient = {
    _initialized: false,
    _locationReady: false,
    _resolveQueue: [] as Array<(client: Client) => void>,
    init: async function () {
        const client = Client.getInstance();

        // 如果已经初始化且location已存在，直接返回
        if (this._initialized && client?.context?.location) {
            return Promise.resolve(client);
        }

        // 初始化逻辑（仅执行一次）
        if (!this._initialized) {
            client.trigger('plugin_ready');
            this._initialized = true;
            
            // 监听location更新
            client.on(event => {
                console.log('---> event info')
                console.log(event)
                if (event?.data?.type === 'get_location_intl') {
                    this._locationReady = true;

                    client.update({
                        context: { 
                            ...client.context, 
                            // ...event?.data,
                            location: event?.data?.location,
                            language: event?.data?.language,

                        }
                    });
                    // 通知所有等待的调用
                    this._resolveQueue.forEach(resolve => resolve(client));
                    this._resolveQueue = [];
                }
            });
        }

        console.log('--->location info')
        console.log(client?.context?.location)

        // client.trigger('get_location_intl', {location: 'SideBar'});

        // 如果location已经有值
        if (client?.context?.location) {
            return Promise.resolve(client);
        }

        // 返回一个Promise，当location更新后resolve
        return new Promise(resolve => {
            this._resolveQueue.push(resolve);
        });
    }
}