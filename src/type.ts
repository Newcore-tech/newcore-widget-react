import Client from './client';

export interface Context {
    /** web端组件当前显示位置 */
    location?: 'NavBar' | 'TopBar' | 'SideBar' | '';
    /** 当前语言 */
    // language?: 'zh-CN' | 'en-US' | 'vi-VN' | 'ja-JP' | '';
    /** Sidebar path: RegExp */
    sidebarPath?: string;
    appId: string;
    instanceId: string;
}

export interface IXHYClient {
    _initialized: boolean;
    _locationReady: boolean;
    _resolveQueue: Array<(client: Client) => void>;
    _rejectQueue: Array<(error: Error) => void>;
    _initTimeout: number;
    _timeoutIds: Set<number>;
    init: (timeout?: number) => Promise<Client>;
    reset: () => void;
    isInitialized: () => boolean;
    isLocationReady: () => boolean;
}

export interface MessageEvent {
    eventName: string;
    __xhyEvent: boolean;
    timestamp: number;
    data?: any;
    type?: string;
    location?: Context['location'];
    language?: string;
}

export interface LocationEvent extends MessageEvent {
    type: 'get_location_intl';
    location: Context['location'];
    language: string;
}

export type EventHandler = (event?: {
    data?: MessageEvent;
    origin?: string;
}) => void;

export interface ClientConfig {
    allowedOrigins?: string[];
    enableOriginValidation?: boolean;
}

export type LocationType = 'NavBar' | 'TopBar' | 'SideBar' | '';
export type LanguageType = 'zh-CN' | 'en-US' | 'vi-VN' | 'ja-JP' | '';