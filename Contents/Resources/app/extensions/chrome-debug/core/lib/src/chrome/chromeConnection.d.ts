import * as Chrome from './chromeDebugProtocol';
export declare type ITargetFilter = (target: Chrome.ITarget) => boolean;
/**
 * Connects to a target supporting the Chrome Debug Protocol and sends and receives messages
 */
export declare class ChromeConnection {
    private _nextId;
    private _socket;
    private _targetFilter;
    constructor(targetFilter?: ITargetFilter);
    isAttached: boolean;
    on(eventName: string, handler: (msg: any) => void): void;
    /**
     * Attach the websocket to the first available tab in the chrome instance with the given remote debugging port number.
     */
    attach(port: number, url?: string, address?: string): Promise<void>;
    _attach(port: number, targetUrl?: string, address?: string): Promise<void>;
    close(): void;
    private reset();
    debugger_setBreakpoint(location: Chrome.Debugger.Location, condition?: string): Promise<Chrome.Debugger.SetBreakpointResponse>;
    debugger_setBreakpointByUrl(url: string, lineNumber: number, columnNumber: number): Promise<Chrome.Debugger.SetBreakpointByUrlResponse>;
    debugger_removeBreakpoint(breakpointId: string): Promise<Chrome.Response>;
    debugger_stepOver(): Promise<Chrome.Response>;
    debugger_stepIn(): Promise<Chrome.Response>;
    debugger_stepOut(): Promise<Chrome.Response>;
    debugger_resume(): Promise<Chrome.Response>;
    debugger_pause(): Promise<Chrome.Response>;
    debugger_evaluateOnCallFrame(callFrameId: string, expression: string, objectGroup?: string, returnByValue?: boolean): Promise<Chrome.Debugger.EvaluateOnCallFrameResponse>;
    debugger_setPauseOnExceptions(state: string): Promise<Chrome.Response>;
    debugger_getScriptSource(scriptId: Chrome.Debugger.ScriptId): Promise<Chrome.Debugger.GetScriptSourceResponse>;
    runtime_getProperties(objectId: string, ownProperties: boolean, accessorPropertiesOnly: boolean): Promise<Chrome.Runtime.GetPropertiesResponse>;
    runtime_evaluate(expression: string, objectGroup?: string, contextId?: number, returnByValue?: boolean): Promise<Chrome.Runtime.EvaluateResponse>;
    page_setOverlayMessage(message: string): Promise<Chrome.Response>;
    page_clearOverlayMessage(): Promise<Chrome.Response>;
    private sendMessage(method, params?);
}
