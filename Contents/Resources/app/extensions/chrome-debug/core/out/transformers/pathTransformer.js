/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/
"use strict";
var utils = require('../utils');
var logger = require('../logger');
var ChromeUtils = require('../chrome/chromeUtils');
/**
 * Converts a local path from Code to a path on the target.
 */
var PathTransformer = (function () {
    function PathTransformer() {
        this._clientPathToTargetUrl = new Map();
        this._targetUrlToClientPath = new Map();
        this._pendingBreakpointsByPath = new Map();
    }
    PathTransformer.prototype.launch = function (args) {
        this._webRoot = args.webRoot;
    };
    PathTransformer.prototype.attach = function (args) {
        this._webRoot = args.webRoot;
    };
    PathTransformer.prototype.setBreakpoints = function (args) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            if (!args.source.path) {
                resolve();
                return;
            }
            if (utils.isURL(args.source.path)) {
                // already a url, use as-is
                logger.log("Paths.setBP: " + args.source.path + " is already a URL");
                resolve();
                return;
            }
            var path = utils.canonicalizeUrl(args.source.path);
            if (_this._clientPathToTargetUrl.has(path)) {
                args.source.path = _this._clientPathToTargetUrl.get(path);
                logger.log("Paths.setBP: Resolved " + path + " to " + args.source.path);
                resolve();
            }
            else {
                logger.log("Paths.setBP: No target url cached for client path: " + path + ", waiting for target script to be loaded.");
                args.source.path = path;
                _this._pendingBreakpointsByPath.set(args.source.path, { resolve: resolve, reject: reject, args: args });
            }
        });
    };
    PathTransformer.prototype.clearClientContext = function () {
        this._pendingBreakpointsByPath = new Map();
    };
    PathTransformer.prototype.clearTargetContext = function () {
        this._clientPathToTargetUrl = new Map();
        this._targetUrlToClientPath = new Map();
    };
    PathTransformer.prototype.scriptParsed = function (event) {
        var targetUrl = event.body.scriptUrl;
        var clientPath = ChromeUtils.targetUrlToClientPath(this._webRoot, targetUrl);
        if (!clientPath) {
            // It's expected that eval scripts (debugadapter:) won't be resolved
            if (!targetUrl.startsWith('debugadapter://')) {
                logger.log("Paths.scriptParsed: could not resolve " + targetUrl + " to a file under webRoot: " + this._webRoot + ". It may be external or served directly from the server's memory (and that's OK).");
            }
        }
        else {
            logger.log("Paths.scriptParsed: resolved " + targetUrl + " to " + clientPath + ". webRoot: " + this._webRoot);
            this._clientPathToTargetUrl.set(clientPath, targetUrl);
            this._targetUrlToClientPath.set(targetUrl, clientPath);
            event.body.scriptUrl = clientPath;
        }
        if (this._pendingBreakpointsByPath.has(event.body.scriptUrl)) {
            logger.log("Paths.scriptParsed: Resolving pending breakpoints for " + event.body.scriptUrl);
            var pendingBreakpoint = this._pendingBreakpointsByPath.get(event.body.scriptUrl);
            this._pendingBreakpointsByPath.delete(event.body.scriptUrl);
            this.setBreakpoints(pendingBreakpoint.args).then(pendingBreakpoint.resolve, pendingBreakpoint.reject);
        }
    };
    PathTransformer.prototype.stackTraceResponse = function (response) {
        var _this = this;
        response.stackFrames.forEach(function (frame) {
            if (frame.source.path) {
                // Try to resolve the url to a path in the workspace. If it's not in the workspace,
                // just use the script.url as-is. It will be resolved or cleared by the SourceMapTransformer.
                var clientPath = _this._targetUrlToClientPath.has(frame.source.path) ?
                    _this._targetUrlToClientPath.get(frame.source.path) :
                    ChromeUtils.targetUrlToClientPath(_this._webRoot, frame.source.path);
                // Incoming stackFrames have sourceReference and path set. If the path was resolved to a file in the workspace,
                // clear the sourceReference since it's not needed.
                if (clientPath) {
                    frame.source.path = clientPath;
                    frame.source.sourceReference = 0;
                }
            }
        });
    };
    return PathTransformer;
}());
exports.PathTransformer = PathTransformer;
//# sourceMappingURL=pathTransformer.js.map