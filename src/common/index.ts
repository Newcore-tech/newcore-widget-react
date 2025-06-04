import Client from "../client";

export const XHYClient = {
    init: function () {
        const client = new Client();

        client.trigger('plugin_ready');

        return client;
    }
}