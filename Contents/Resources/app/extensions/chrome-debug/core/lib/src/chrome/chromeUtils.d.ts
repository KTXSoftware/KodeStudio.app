import * as Chrome from './chromeDebugProtocol';
/**
 * Maps a url from target to an absolute local path.
 * If not given an absolute path (with file: prefix), searches the current working directory for a matching file.
 * http://localhost/scripts/code.js => d:/app/scripts/code.js
 * file:///d:/scripts/code.js => d:/scripts/code.js
 */
export declare function targetUrlToClientPath(webRoot: string, aUrl: string): string;
/**
 * Convert a RemoteObject to a value+variableHandleRef for the client.
 */
export declare function remoteObjectToValue(object: Chrome.Runtime.RemoteObject, stringify?: boolean): {
    value: string;
    variableHandleRef?: string;
};
export declare function getMatchingTargets(targets: Chrome.ITarget[], targetUrl: string): Chrome.ITarget[];
