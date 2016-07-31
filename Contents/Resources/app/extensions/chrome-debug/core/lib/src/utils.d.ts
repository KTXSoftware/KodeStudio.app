export declare function getBrowserPath(): string;
export declare const enum Platform {
    Windows = 0,
    OSX = 1,
    Linux = 2,
}
export declare function getPlatform(): Platform;
/**
 * Node's fs.existsSync is deprecated, implement it in terms of statSync
 */
export declare function existsSync(path: string): boolean;
export declare class DebounceHelper {
    private timeoutMs;
    private waitToken;
    constructor(timeoutMs: number);
    /**
     * If not waiting already, call fn after the timeout
     */
    wait(fn: () => any): void;
    /**
     * If waiting for something, cancel it and call fn immediately
     */
    doAndCancel(fn: () => any): void;
}
/**
 * Returns a reversed version of arr. Doesn't modify the input.
 */
export declare function reversedArr(arr: any[]): any[];
export declare function promiseTimeout(p?: Promise<any>, timeoutMs?: number, timeoutMsg?: string): Promise<any>;
export declare function retryAsync(fn: () => Promise<any>, timeoutMs: number): Promise<any>;
/**
 * Modify a url/path either from the client or the target to a common format for comparing.
 * The client can handle urls in this format too.
 * file:///D:\\scripts\\code.js => d:/scripts/code.js
 * file:///Users/me/project/code.js => /Users/me/project/code.js
 * c:/scripts/code.js => c:\\scripts\\code.js
 * http://site.com/scripts/code.js => (no change)
 * http://site.com/ => http://site.com
 */
export declare function canonicalizeUrl(urlOrPath: string): string;
/**
 * Replace any backslashes with forward slashes
 * blah\something => blah/something
 */
export declare function forceForwardSlashes(aUrl: string): string;
/**
 * Ensure lower case drive letter and \ on Windows
 */
export declare function fixDriveLetterAndSlashes(aPath: string): string;
/**
 * Remove a slash of any flavor from the end of the path
 */
export declare function stripTrailingSlash(aPath: string): string;
/**
 * A helper for returning a rejected promise with an Error object. Avoids double-wrapping an Error, which could happen
 * when passing on a failure from a Promise error handler.
 * @param msg - Should be either a string or an Error
 */
export declare function errP(msg: any): Promise<any>;
/**
 * Helper function to GET the contents of a url
 */
export declare function getURL(aUrl: string): Promise<string>;
/**
 * Returns true if urlOrPath is like "http://localhost" and not like "c:/code/file.js" or "/code/file.js"
 */
export declare function isURL(urlOrPath: string): boolean;
/**
 * Strip a string from the left side of a string
 */
export declare function lstrip(s: string, lStr: string): string;
/**
 * Convert a local path to a file URL, like
 * C:/code/app.js => file:///C:/code/app.js
 * /code/app.js => file:///code/app.js
 */
export declare function pathToFileURL(absPath: string): string;
