/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/
"use strict";
var path = require('path');
var sourceMaps_1 = require('../sourceMaps/sourceMaps');
var utils = require('../utils');
var logger = require('../logger');
/**
 * If sourcemaps are enabled, converts from source files on the client side to runtime files on the target side
 */
var SourceMapTransformer = (function () {
    function SourceMapTransformer() {
        this._pendingBreakpointsByPath = new Map();
    }
    SourceMapTransformer.prototype.launch = function (args) {
        this.init(args);
    };
    SourceMapTransformer.prototype.attach = function (args) {
        this.init(args);
    };
    SourceMapTransformer.prototype.init = function (args) {
        if (args.sourceMaps) {
            this._webRoot = args.webRoot;
            this._sourceMaps = new sourceMaps_1.SourceMaps(this._webRoot);
            this._requestSeqToSetBreakpointsArgs = new Map();
            this._allRuntimeScriptPaths = new Set();
            this._authoredPathsToMappedBPLines = new Map();
            this._authoredPathsToMappedBPCols = new Map();
        }
    };
    SourceMapTransformer.prototype.clearTargetContext = function () {
        this._allRuntimeScriptPaths = new Set();
    };
    /**
     * Apply sourcemapping to the setBreakpoints request path/lines
     */
    SourceMapTransformer.prototype.setBreakpoints = function (args, requestSeq) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            if (_this._sourceMaps && args.source.path) {
                var argsPath_1 = args.source.path;
                var mappedPath_1 = _this._sourceMaps.getGeneratedPathFromAuthoredPath(argsPath_1);
                if (mappedPath_1) {
                    logger.log("SourceMaps.setBP: Mapped " + argsPath_1 + " to " + mappedPath_1);
                    args.authoredPath = argsPath_1;
                    args.source.path = mappedPath_1;
                    // DebugProtocol doesn't send cols, but they need to be added from sourcemaps
                    var mappedCols_1 = [];
                    var mappedLines = args.lines.map(function (line, i) {
                        var mapped = _this._sourceMaps.mapToGenerated(argsPath_1, line, /*column=*/ 0);
                        if (mapped) {
                            logger.log("SourceMaps.setBP: Mapped " + argsPath_1 + ":" + line + ":0 to " + mappedPath_1 + ":" + mapped.line + ":" + mapped.column);
                            mappedCols_1[i] = mapped.column;
                            return mapped.line;
                        }
                        else {
                            logger.log("SourceMaps.setBP: Mapped " + argsPath_1 + " but not line " + line + ", column 0");
                            mappedCols_1[i] = 0;
                            return line;
                        }
                    });
                    _this._authoredPathsToMappedBPLines.set(argsPath_1, mappedLines);
                    _this._authoredPathsToMappedBPCols.set(argsPath_1, mappedCols_1);
                    // Include BPs from other files that map to the same file. Ensure the current file's breakpoints go first
                    args.lines = mappedLines;
                    args.cols = mappedCols_1;
                    _this._sourceMaps.allMappedSources(mappedPath_1).forEach(function (sourcePath) {
                        if (sourcePath === argsPath_1) {
                            return;
                        }
                        var sourceBPLines = _this._authoredPathsToMappedBPLines.get(sourcePath);
                        var sourceBPCols = _this._authoredPathsToMappedBPCols.get(sourcePath);
                        if (sourceBPLines && sourceBPCols) {
                            // Don't modify the cached array
                            args.lines = args.lines.concat(sourceBPLines);
                            args.cols = args.cols.concat(sourceBPCols);
                        }
                    });
                }
                else if (_this._allRuntimeScriptPaths.has(argsPath_1)) {
                    // It's a generated file which is loaded
                    logger.log("SourceMaps.setBP: SourceMaps are enabled but " + argsPath_1 + " is a runtime script");
                }
                else {
                    // Source (or generated) file which is not loaded, need to wait
                    logger.log("SourceMaps.setBP: " + argsPath_1 + " can't be resolved to a loaded script. It may just not be loaded yet.");
                    _this._pendingBreakpointsByPath.set(argsPath_1, { resolve: resolve, reject: reject, args: args, requestSeq: requestSeq });
                    return;
                }
                _this._requestSeqToSetBreakpointsArgs.set(requestSeq, JSON.parse(JSON.stringify(args)));
                resolve();
            }
            else {
                resolve();
            }
        });
    };
    /**
     * Apply sourcemapping back to authored files from the response
     */
    SourceMapTransformer.prototype.setBreakpointsResponse = function (response, requestSeq) {
        var _this = this;
        if (this._sourceMaps && this._requestSeqToSetBreakpointsArgs.has(requestSeq)) {
            var args_1 = this._requestSeqToSetBreakpointsArgs.get(requestSeq);
            if (args_1.authoredPath) {
                var sourceBPLines_1 = this._authoredPathsToMappedBPLines.get(args_1.authoredPath);
                if (sourceBPLines_1) {
                    // authoredPath is set, so the file was mapped to source.
                    // Remove breakpoints from files that map to the same file, and map back to source.
                    response.breakpoints = response.breakpoints.filter(function (_, i) { return i < sourceBPLines_1.length; });
                    response.breakpoints.forEach(function (bp) {
                        var mapped = _this._sourceMaps.mapToAuthored(args_1.source.path, bp.line, bp.column);
                        if (mapped) {
                            logger.log("SourceMaps.setBP: Mapped " + args_1.source.path + ":" + bp.line + ":" + bp.column + " to " + mapped.source + ":" + mapped.line);
                            bp.line = mapped.line;
                        }
                        else {
                            logger.log("SourceMaps.setBP: Can't map " + args_1.source.path + ":" + bp.line + ":" + bp.column + ", keeping the line number as-is.");
                        }
                        _this._requestSeqToSetBreakpointsArgs.delete(requestSeq);
                    });
                }
            }
        }
        // Cleanup column, which is passed in here in case it's needed for sourcemaps, but isn't actually
        // part of the DebugProtocol
        response.breakpoints.forEach(function (bp) {
            delete bp.column;
        });
    };
    /**
     * Apply sourcemapping to the stacktrace response
     */
    SourceMapTransformer.prototype.stackTraceResponse = function (response) {
        var _this = this;
        if (this._sourceMaps) {
            response.stackFrames.forEach(function (stackFrame) {
                var mapped = _this._sourceMaps.mapToAuthored(stackFrame.source.path, stackFrame.line, stackFrame.column);
                if (mapped && utils.existsSync(mapped.source)) {
                    // Script was mapped to a valid path
                    stackFrame.source.path = mapped.source;
                    stackFrame.source.sourceReference = 0;
                    stackFrame.source.name = path.basename(mapped.source);
                    stackFrame.line = mapped.line;
                    stackFrame.column = mapped.column;
                }
                else if (utils.existsSync(stackFrame.source.path)) {
                    // Script could not be mapped, but does exist on disk. Keep it and clear the sourceReference.
                    stackFrame.source.sourceReference = 0;
                }
                else {
                    // Script could not be mapped and doesn't exist on disk. Clear the path, use sourceReference.
                    stackFrame.source.name = 'eval: ' + stackFrame.source.sourceReference;
                    stackFrame.source.path = undefined;
                }
            });
        }
        else {
            response.stackFrames.forEach(function (stackFrame) {
                // PathTransformer needs to leave the frame in an unfinished state because it doesn't know whether sourcemaps are enabled
                if (stackFrame.source.path && stackFrame.source.sourceReference) {
                    stackFrame.source.path = undefined;
                }
            });
        }
    };
    SourceMapTransformer.prototype.scriptParsed = function (event) {
        var _this = this;
        if (this._sourceMaps) {
            this._allRuntimeScriptPaths.add(event.body.scriptUrl);
            if (!event.body.sourceMapURL) {
                // If a file does not have a source map, check if we've seen any breakpoints
                // for it anyway and make sure to enable them
                this.resolvePendingBreakpointsForScript(event.body.scriptUrl);
                return;
            }
            this._sourceMaps.processNewSourceMap(event.body.scriptUrl, event.body.sourceMapURL).then(function () {
                var sources = _this._sourceMaps.allMappedSources(event.body.scriptUrl);
                if (sources) {
                    logger.log("SourceMaps.scriptParsed: " + event.body.scriptUrl + " was just loaded and has mapped sources: " + JSON.stringify(sources));
                    sources.forEach(function (sourcePath) {
                        _this.resolvePendingBreakpointsForScript(sourcePath);
                    });
                }
            });
        }
    };
    /**
     * Resolve any pending breakpoints for this script
     */
    SourceMapTransformer.prototype.resolvePendingBreakpointsForScript = function (scriptUrl) {
        if (this._pendingBreakpointsByPath.has(scriptUrl)) {
            logger.log("SourceMaps.scriptParsed: Resolving pending breakpoints for " + scriptUrl);
            var pendingBreakpoints = this._pendingBreakpointsByPath.get(scriptUrl);
            this._pendingBreakpointsByPath.delete(scriptUrl);
            // If there's a setBreakpoints request waiting on this script, go through setBreakpoints again
            this.setBreakpoints(pendingBreakpoints.args, pendingBreakpoints.requestSeq)
                .then(pendingBreakpoints.resolve, pendingBreakpoints.reject);
        }
    };
    return SourceMapTransformer;
}());
exports.SourceMapTransformer = SourceMapTransformer;
//# sourceMappingURL=sourceMapTransformer.js.map