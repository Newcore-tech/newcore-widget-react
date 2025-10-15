import Client from "./client";

class BackgroundClient extends Client {
  // 创建WebEventBus实例
  private onInterceptCallbacks: Record<
    string,
    (data: unknown) => Promise<{ success: boolean; message?: string }>
  > = {};

  constructor() {
    super();
  }

  override getEventName(name: string): string {
    return `background-event:${name}`;
  }

  //初始化方法
  //@override
  override init() {
    super.init();

    /**
     * #onIntercept
     * event: {
     *   eventName: string;
     *   data: unknown;
     *   key: string;
     * }
     */
    this.eventBus.subscribe(this.getEventName("#onIntercept"), (event) => {
      console.log("Client #onIntercept event: ", event);
      const name = event.name as string;
      const data = event.data;
      const interceptor = this.onInterceptCallbacks[name];
      if (interceptor) {
        interceptor(data)
          .then((r) => {
            this.eventBus.publishParent(this.getEventName("#intercept-result"), {
              success: r.success,
              message: r.message,
              name,
            });
          })
          .catch((e) => {
            console.error(`Error in onIntercept callback for event ${name}: ${e}`);
            this.eventBus.publishParent(this.getEventName("#intercept-result"), {
              success: false,
              message: `Error in onIntercept callback for event ${name}: ${String(e)}`,
            });
          });
      }
    });
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
}

export default BackgroundClient;
