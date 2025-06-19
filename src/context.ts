class Context {
    /** 位置 */
    location?: 'NavBar' | 'TopBar' | 'SideBar' | '' = '';

    language?: 'zh-CN' | 'en-US' | 'vi-VN' | 'ja-JP' | '' = '';

    private static instance: Context;

    /** 单例访问方法 */
    public static getInstance(): Context {
        if (!Context.instance) {
            console.log('Context创建实例了几次')
            Context.instance = new Context();
        }
        return Context.instance;
    }
    
    private update (payload: Partial<Context>) {
        Object.assign(this, payload);
    }
}

export default Context;