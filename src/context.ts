class Context {
    location?: 'NavBar' | 'TopBar' | 'SideBar' = 'TopBar';

    constructor () {
        
    }
    
    update (payload: Partial<Context>) {
        Object.assign(this, payload);
    }
}

export default Context;