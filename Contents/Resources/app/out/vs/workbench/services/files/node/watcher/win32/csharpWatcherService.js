/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
'use strict';
define(["require", "exports", 'child_process', 'vs/platform/files/common/files', 'vs/base/node/decoder', 'vs/base/common/glob', 'vs/base/common/uri'], function (require, exports, cp, files_1, decoder, glob, uri_1) {
    var OutOfProcessWin32FolderWatcher = (function () {
        function OutOfProcessWin32FolderWatcher(watchedFolder, ignored, errorLogger, eventCallback, verboseLogging) {
            this.watchedFolder = watchedFolder;
            this.ignored = ignored;
            this.eventCallback = eventCallback;
            this.errorLogger = errorLogger;
            this.verboseLogging = verboseLogging;
            this.startWatcher();
        }
        OutOfProcessWin32FolderWatcher.prototype.startWatcher = function () {
            var _this = this;
            var args = [this.watchedFolder];
            if (this.verboseLogging) {
                args.push('-verbose');
            }
            this.handle = cp.spawn(uri_1.default.parse(require.toUrl('vs/workbench/services/files/node/watcher/win32/CodeHelper.exe')).fsPath, args);
            var stdoutLineDecoder = new decoder.LineDecoder();
            // Events over stdout
            this.handle.stdout.on('data', function (data) {
                // Collect raw events from output
                var rawEvents = [];
                stdoutLineDecoder.write(data).forEach(function (line) {
                    var eventParts = line.split('|');
                    if (eventParts.length === 2) {
                        var changeType = Number(eventParts[0]);
                        var absolutePath = eventParts[1];
                        // File Change Event (0 Changed, 1 Created, 2 Deleted)
                        if (changeType >= 0 && changeType < 3) {
                            // Support ignores
                            if (_this.ignored && _this.ignored.some(function (ignore) { return glob.match(ignore, absolutePath); })) {
                                return;
                            }
                            // Otherwise record as event
                            rawEvents.push({
                                type: OutOfProcessWin32FolderWatcher.changeTypeMap[changeType],
                                path: absolutePath
                            });
                        }
                        else {
                            console.log('%c[File Watcher]', 'color: darkgreen', eventParts[1]);
                        }
                    }
                });
                // Trigger processing of events through the delayer to batch them up properly
                if (rawEvents.length > 0) {
                    _this.eventCallback(rawEvents);
                }
            });
            // Errors
            this.handle.on('error', function (error) { return _this.onError(error); });
            this.handle.stderr.on('data', function (data) { return _this.onError(data); });
            // Exit
            this.handle.on('exit', function (code, signal) { return _this.onExit(code, signal); });
        };
        OutOfProcessWin32FolderWatcher.prototype.onError = function (error) {
            this.errorLogger('[FileWatcher] process error: ' + error.toString());
        };
        OutOfProcessWin32FolderWatcher.prototype.onExit = function (code, signal) {
            if (this.handle) {
                this.errorLogger('[FileWatcher] terminated unexpectedly (code: ' + code + ', signal: ' + signal + ')');
                this.startWatcher(); // restart
            }
        };
        OutOfProcessWin32FolderWatcher.prototype.dispose = function () {
            if (this.handle) {
                this.handle.kill();
                this.handle = null;
            }
        };
        OutOfProcessWin32FolderWatcher.changeTypeMap = [files_1.FileChangeType.UPDATED, files_1.FileChangeType.ADDED, files_1.FileChangeType.DELETED];
        return OutOfProcessWin32FolderWatcher;
    })();
    exports.OutOfProcessWin32FolderWatcher = OutOfProcessWin32FolderWatcher;
});
//# sourceMappingURL=csharpWatcherService.js.map