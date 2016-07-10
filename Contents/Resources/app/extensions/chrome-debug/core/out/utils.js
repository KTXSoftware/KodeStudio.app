/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/
"use strict";
var http = require('http');
var os = require('os');
var fs = require('fs');
var url = require('url');
var path = require('path');
var logger = require('./logger');
var DEFAULT_CHROME_PATH = {
    OSX: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    WIN: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    WINx86: 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    LINUX: '/usr/bin/google-chrome'
};
function getBrowserPath() {
    var platform = getPlatform();
    if (platform === 1 /* OSX */) {
        return existsSync(DEFAULT_CHROME_PATH.OSX) ? DEFAULT_CHROME_PATH.OSX : null;
    }
    else if (platform === 0 /* Windows */) {
        if (existsSync(DEFAULT_CHROME_PATH.WINx86)) {
            return DEFAULT_CHROME_PATH.WINx86;
        }
        else if (existsSync(DEFAULT_CHROME_PATH.WIN)) {
            return DEFAULT_CHROME_PATH.WIN;
        }
        else {
            return null;
        }
    }
    else {
        return existsSync(DEFAULT_CHROME_PATH.LINUX) ? DEFAULT_CHROME_PATH.LINUX : null;
    }
}
exports.getBrowserPath = getBrowserPath;
function getPlatform() {
    var platform = os.platform();
    return platform === 'darwin' ? 1 /* OSX */ :
        platform === 'win32' ? 0 /* Windows */ :
            2 /* Linux */;
}
exports.getPlatform = getPlatform;
/**
 * Node's fs.existsSync is deprecated, implement it in terms of statSync
 */
function existsSync(path) {
    try {
        fs.statSync(path);
        return true;
    }
    catch (e) {
        // doesn't exist
        return false;
    }
}
exports.existsSync = existsSync;
var DebounceHelper = (function () {
    function DebounceHelper(timeoutMs) {
        this.timeoutMs = timeoutMs;
    }
    /**
     * If not waiting already, call fn after the timeout
     */
    DebounceHelper.prototype.wait = function (fn) {
        var _this = this;
        if (!this.waitToken) {
            this.waitToken = setTimeout(function () {
                _this.waitToken = null;
                fn();
            }, this.timeoutMs);
        }
    };
    /**
     * If waiting for something, cancel it and call fn immediately
     */
    DebounceHelper.prototype.doAndCancel = function (fn) {
        if (this.waitToken) {
            clearTimeout(this.waitToken);
            this.waitToken = null;
        }
        fn();
    };
    return DebounceHelper;
}());
exports.DebounceHelper = DebounceHelper;
/**
 * Returns a reversed version of arr. Doesn't modify the input.
 */
function reversedArr(arr) {
    return arr.reduce(function (reversed, x) {
        reversed.unshift(x);
        return reversed;
    }, []);
}
exports.reversedArr = reversedArr;
function promiseTimeout(p, timeoutMs, timeoutMsg) {
    if (timeoutMs === void 0) { timeoutMs = 1000; }
    if (timeoutMsg === undefined) {
        timeoutMsg = "Promise timed out after " + timeoutMs + "ms";
    }
    return new Promise(function (resolve, reject) {
        if (p) {
            p.then(resolve, reject);
        }
        setTimeout(function () {
            if (p) {
                reject(timeoutMsg);
            }
            else {
                resolve();
            }
        }, timeoutMs);
    });
}
exports.promiseTimeout = promiseTimeout;
function retryAsync(fn, timeoutMs) {
    var startTime = Date.now();
    function tryUntilTimeout() {
        return fn().catch(function (e) {
            if (Date.now() - startTime < timeoutMs) {
                return tryUntilTimeout();
            }
            else {
                return errP(e);
            }
        });
    }
    return tryUntilTimeout();
}
exports.retryAsync = retryAsync;
/**
 * Modify a url/path either from the client or the target to a common format for comparing.
 * The client can handle urls in this format too.
 * file:///D:\\scripts\\code.js => d:/scripts/code.js
 * file:///Users/me/project/code.js => /Users/me/project/code.js
 * c:/scripts/code.js => c:\\scripts\\code.js
 * http://site.com/scripts/code.js => (no change)
 * http://site.com/ => http://site.com
 */
function canonicalizeUrl(urlOrPath) {
    if (urlOrPath.startsWith('file:///')) {
        urlOrPath = urlOrPath.replace('file:///', '');
        urlOrPath = decodeURIComponent(urlOrPath);
        if (urlOrPath[0] !== '/' && urlOrPath.indexOf(':') < 0) {
            // Ensure unix-style path starts with /, it can be removed when file:/// was stripped.
            // Don't add if the url still has a protocol
            urlOrPath = '/' + urlOrPath;
        }
    }
    // Remove query params
    if (urlOrPath.indexOf('?') >= 0) {
        urlOrPath = urlOrPath.split('?')[0];
    }
    urlOrPath = stripTrailingSlash(urlOrPath);
    urlOrPath = fixDriveLetterAndSlashes(urlOrPath);
    return urlOrPath;
}
exports.canonicalizeUrl = canonicalizeUrl;
/**
 * Replace any backslashes with forward slashes
 * blah\something => blah/something
 */
function forceForwardSlashes(aUrl) {
    return aUrl.replace(/\\/g, '/');
}
exports.forceForwardSlashes = forceForwardSlashes;
/**
 * Ensure lower case drive letter and \ on Windows
 */
function fixDriveLetterAndSlashes(aPath) {
    if (getPlatform() === 0 /* Windows */) {
        if (aPath.match(/file:\/\/\/[A-Za-z]:/)) {
            var prefixLen = 'file:///'.length;
            aPath =
                'file:///' +
                    aPath[prefixLen].toLowerCase() +
                    aPath.substr(prefixLen + 1).replace(/\//g, path.sep);
        }
        else if (aPath.match(/^[A-Za-z]:/)) {
            // If this is Windows and the path starts with a drive letter, ensure lowercase. VS Code uses a lowercase drive letter
            aPath = aPath[0].toLowerCase() + aPath.substr(1);
            aPath = aPath.replace(/\//g, path.sep);
        }
    }
    return aPath;
}
exports.fixDriveLetterAndSlashes = fixDriveLetterAndSlashes;
/**
 * Remove a slash of any flavor from the end of the path
 */
function stripTrailingSlash(aPath) {
    return aPath
        .replace(/\/$/, '')
        .replace(/\\$/, '');
}
exports.stripTrailingSlash = stripTrailingSlash;
/**
 * A helper for returning a rejected promise with an Error object. Avoids double-wrapping an Error, which could happen
 * when passing on a failure from a Promise error handler.
 * @param msg - Should be either a string or an Error
 */
function errP(msg) {
    var e;
    if (!msg) {
        e = new Error('Unknown error');
    }
    else if (msg.message) {
        // msg is already an Error object
        e = msg;
    }
    else {
        e = new Error(msg);
    }
    return Promise.reject(e);
}
exports.errP = errP;
/**
 * Helper function to GET the contents of a url
 */
function getURL(aUrl) {
    return new Promise(function (resolve, reject) {
        http.get(aUrl, function (response) {
            var responseData = '';
            response.on('data', function (chunk) { return responseData += chunk; });
            response.on('end', function () {
                // Sometimes the 'error' event is not fired. Double check here.
                if (response.statusCode === 200) {
                    resolve(responseData);
                }
                else {
                    logger.log('Http Get failed with: ' + response.statusCode.toString() + ' ' + response.statusMessage.toString());
                    reject(responseData);
                }
            });
        }).on('error', function (e) {
            reject(e);
        });
    });
}
exports.getURL = getURL;
/**
 * Returns true if urlOrPath is like "http://localhost" and not like "c:/code/file.js" or "/code/file.js"
 */
function isURL(urlOrPath) {
    return urlOrPath && !path.isAbsolute(urlOrPath) && !!url.parse(urlOrPath).protocol;
}
exports.isURL = isURL;
/**
 * Strip a string from the left side of a string
 */
function lstrip(s, lStr) {
    return s.startsWith(lStr) ?
        s.substr(lStr.length) :
        s;
}
exports.lstrip = lstrip;
/**
 * Convert a local path to a file URL, like
 * C:/code/app.js => file:///C:/code/app.js
 * /code/app.js => file:///code/app.js
 */
function pathToFileURL(absPath) {
    absPath = forceForwardSlashes(absPath);
    absPath = (absPath.startsWith('/') ? 'file://' : 'file:///') +
        absPath;
    return encodeURI(absPath);
}
exports.pathToFileURL = pathToFileURL;
//# sourceMappingURL=utils.js.map