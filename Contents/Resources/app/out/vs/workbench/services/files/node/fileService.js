/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
'use strict';
define(["require", "exports", 'path', 'fs', 'os', 'crypto', 'assert', 'iconv-lite', 'vs/platform/files/common/files', 'vs/base/common/strings', 'vs/base/common/arrays', 'vs/base/common/mime', 'vs/base/common/paths', 'vs/base/common/winjs.base', 'vs/base/common/types', 'vs/base/common/objects', 'vs/base/node/extfs', 'vs/base/common/async', 'vs/base/common/uri', 'vs/nls', 'vs/base/node/pfs', 'vs/base/node/encoding', 'vs/base/node/mime', 'vs/base/node/flow', 'vs/workbench/services/files/node/watcher/unix/watcherService', 'vs/workbench/services/files/node/watcher/win32/watcherService', 'vs/workbench/services/files/node/watcher/common'], function (require, exports, paths, fs, os, crypto, assert, iconv, files, strings, arrays, baseMime, basePaths, winjs_base_1, types, objects, extfs, async_1, uri_1, nls, pfs, encoding, mime, flow, watcherService_1, watcherService_2, common_1) {
    function etag(arg1, arg2) {
        var size;
        var mtime;
        if (typeof arg2 === 'number') {
            size = arg1;
            mtime = arg2;
        }
        else {
            size = arg1.size;
            mtime = arg1.mtime.getTime();
        }
        return '"' + crypto.createHash('sha1').update(String(size) + String(mtime)).digest('hex') + '"';
    }
    var FileService = (function () {
        function FileService(basePath, eventEmitter, options) {
            this.serviceId = files.IFileService;
            this.basePath = basePath ? paths.normalize(basePath) : void 0;
            if (this.basePath && this.basePath.indexOf('\\\\') === 0 && strings.endsWith(this.basePath, paths.sep)) {
                // for some weird reason, node adds a trailing slash to UNC paths
                // we never ever want trailing slashes as our base path unless
                // someone opens root ("/").
                // See also https://github.com/nodejs/io.js/issues/1765
                this.basePath = strings.rtrim(this.basePath, paths.sep);
            }
            if (this.basePath && !paths.isAbsolute(basePath)) {
                throw new Error('basePath has to be an absolute path');
            }
            this.options = options || Object.create(null);
            this.eventEmitter = eventEmitter;
            this.tmpPath = this.options.tmpDir || os.tmpdir();
            if (this.options && !this.options.errorLogger) {
                this.options.errorLogger = console.error;
            }
            if (this.basePath && !this.options.disableWatcher) {
                if (process.platform === 'win32') {
                    this.setupWin32WorkspaceWatching();
                }
                else {
                    this.setupUnixWorkspaceWatching();
                }
            }
            this.activeFileChangesWatchers = Object.create(null);
            this.fileChangesWatchDelayer = new async_1.ThrottledDelayer(FileService.FS_EVENT_DELAY);
            this.undeliveredRawFileChangesEvents = [];
        }
        FileService.prototype.updateOptions = function (options) {
            if (options) {
                objects.mixin(this.options, options); // overwrite current options
            }
        };
        FileService.prototype.setupWin32WorkspaceWatching = function () {
            this.workspaceWatcherToDispose = new watcherService_2.FileWatcher(this.basePath, this.options.watcherIgnoredPatterns, this.eventEmitter, this.options.errorLogger, this.options.verboseLogging).startWatching();
        };
        FileService.prototype.setupUnixWorkspaceWatching = function () {
            this.workspaceWatcherToDispose = new watcherService_1.FileWatcher(this.basePath, this.options.watcherIgnoredPatterns, this.eventEmitter, this.options.errorLogger, this.options.verboseLogging).startWatching();
        };
        FileService.prototype.resolveFile = function (resource, options) {
            return this.resolve(resource, options);
        };
        FileService.prototype.resolveContent = function (resource, options) {
            var _this = this;
            var absolutePath = this.toAbsolutePath(resource);
            // 1.) detect mimes
            return async_1.nfcall(mime.detectMimesFromFile, absolutePath).then(function (detected) {
                var isText = detected.mimes.indexOf(baseMime.MIME_BINARY) === -1;
                // Return error early if client only accepts text and this is not text
                if (options && options.acceptTextOnly && !isText) {
                    return winjs_base_1.Promise.wrapError({
                        message: nls.localize('fileBinaryError', "File seems to be binary and cannot be opened as text"),
                        fileOperationResult: files.FileOperationResult.FILE_IS_BINARY
                    });
                }
                var etag = options && options.etag;
                var enc = options && options.encoding;
                // 2.) get content
                return _this.resolveFileContent(resource, etag, enc /* give user choice precedence */ || detected.encoding).then(function (content) {
                    // set our knowledge about the mime on the content obj
                    content.mime = detected.mimes.join(', ');
                    return content;
                });
            }, function (error) {
                // bubble up existing file operation results
                if (!types.isUndefinedOrNull(error.fileOperationResult)) {
                    return winjs_base_1.Promise.wrapError(error);
                }
                // on error check if the file does not exist or is a folder and return with proper error result
                return pfs.exists(absolutePath).then(function (exists) {
                    // Return if file not found
                    if (!exists) {
                        return winjs_base_1.Promise.wrapError({
                            message: nls.localize('fileNotFoundError', "File not found ({0})", absolutePath),
                            fileOperationResult: files.FileOperationResult.FILE_NOT_FOUND
                        });
                    }
                    // Otherwise check for file being a folder?
                    return pfs.stat(absolutePath).then(function (stat) {
                        if (stat.isDirectory()) {
                            return winjs_base_1.Promise.wrapError({
                                message: nls.localize('fileIsDirectoryError', "File is directory ({0})", absolutePath),
                                fileOperationResult: files.FileOperationResult.FILE_IS_DIRECTORY
                            });
                        }
                        // otherwise just give up
                        return winjs_base_1.Promise.wrapError(error);
                    });
                });
            });
        };
        FileService.prototype.resolveContents = function (resources) {
            var _this = this;
            var limiter = new async_1.Limiter(FileService.MAX_DEGREE_OF_PARALLEL_FS_OPS);
            var contentPromises = [];
            resources.forEach(function (resource) {
                contentPromises.push(limiter.queue(function () { return _this.resolveFileContent(resource).then(function (content) { return content; }, function (error) { return winjs_base_1.Promise.as(null /* ignore errors gracefully */); }); }));
            });
            return winjs_base_1.TPromise.join(contentPromises).then(function (contents) {
                return arrays.coalesce(contents);
            });
        };
        FileService.prototype.updateContent = function (resource, value, options) {
            var _this = this;
            if (options === void 0) { options = Object.create(null); }
            var absolutePath = this.toAbsolutePath(resource);
            // 1.) check file
            return this.checkFile(absolutePath, options).then(function (exists) {
                var createParentsPromise;
                if (exists) {
                    createParentsPromise = winjs_base_1.Promise.as(null);
                }
                else {
                    createParentsPromise = pfs.mkdirp(paths.dirname(absolutePath));
                }
                // 2.) create parents as needed
                return createParentsPromise.then(function () {
                    var encodingToWrite = _this.getEncoding(resource, options.charset);
                    // UTF16 without BOM makes no sense so always add it
                    var addBomPromise = winjs_base_1.TPromise.as(false);
                    if (encodingToWrite === encoding.UTF16be || encodingToWrite === encoding.UTF16le) {
                        addBomPromise = winjs_base_1.TPromise.as(true);
                    }
                    else if (exists && encodingToWrite === encoding.UTF8) {
                        addBomPromise = async_1.nfcall(encoding.detectEncodingByBOM, absolutePath).then(function (enc) { return enc === encoding.UTF8; }); // only for UTF8 we need to check if we have to preserve a BOM
                    }
                    // 3.) check to add UTF BOM
                    return addBomPromise.then(function (addBom) {
                        var writeFilePromise;
                        // Write fast if we do UTF 8 without BOM
                        if (!addBom && encodingToWrite === encoding.UTF8) {
                            writeFilePromise = pfs.writeFile(absolutePath, value, encoding.UTF8);
                        }
                        else {
                            var encoded = iconv.encode(value, encodingToWrite, { addBOM: addBom });
                            writeFilePromise = pfs.writeFile(absolutePath, encoded);
                        }
                        // 4.) set contents
                        return writeFilePromise.then(function () {
                            // 5.) resolve
                            return _this.resolve(resource);
                        });
                    });
                });
            });
        };
        FileService.prototype.createFile = function (resource, content) {
            if (content === void 0) { content = ''; }
            return this.updateContent(resource, content);
        };
        FileService.prototype.createFolder = function (resource) {
            var _this = this;
            // 1.) create folder
            var absolutePath = this.toAbsolutePath(resource);
            return pfs.mkdirp(absolutePath).then(function () {
                // 2.) resolve
                return _this.resolve(resource);
            });
        };
        FileService.prototype.rename = function (resource, newName) {
            var newPath = paths.join(paths.dirname(resource.fsPath), newName);
            return this.moveFile(resource, uri_1.default.file(newPath));
        };
        FileService.prototype.moveFile = function (source, target, overwrite) {
            return this.moveOrCopyFile(source, target, false, overwrite);
        };
        FileService.prototype.copyFile = function (source, target, overwrite) {
            return this.moveOrCopyFile(source, target, true, overwrite);
        };
        FileService.prototype.moveOrCopyFile = function (source, target, keepCopy, overwrite) {
            var _this = this;
            var sourcePath = this.toAbsolutePath(source);
            var targetPath = this.toAbsolutePath(target);
            // 1.) move / copy
            return this.doMoveOrCopyFile(sourcePath, targetPath, keepCopy, overwrite).then(function () {
                // 2.) resolve
                return _this.resolve(target);
            });
        };
        FileService.prototype.doMoveOrCopyFile = function (sourcePath, targetPath, keepCopy, overwrite) {
            var _this = this;
            // 1.) check if target exists
            return pfs.exists(targetPath).then(function (exists) {
                var isCaseRename = sourcePath.toLowerCase() === targetPath.toLowerCase();
                // Return early with conflict if target exists and we are not told to overwrite
                if (exists && !isCaseRename && !overwrite) {
                    return winjs_base_1.Promise.wrapError({
                        fileOperationResult: files.FileOperationResult.FILE_MOVE_CONFLICT
                    });
                }
                // 2.) make sure target is deleted before we move/copy unless this is a case rename of the same file
                var deleteTargetPromise = winjs_base_1.Promise.as(null);
                if (exists && !isCaseRename) {
                    if (basePaths.isEqualOrParent(sourcePath, targetPath)) {
                        return winjs_base_1.Promise.wrapError(nls.localize('unableToMoveCopyError', "Unable to move/copy. File would replace folder it is contained in.")); // catch this corner case!
                    }
                    deleteTargetPromise = _this.del(uri_1.default.file(targetPath));
                }
                return deleteTargetPromise.then(function () {
                    // 3.) make sure parents exists
                    return pfs.mkdirp(paths.dirname(targetPath)).then(function () {
                        // 4.) copy/move
                        if (keepCopy) {
                            return async_1.nfcall(extfs.copy, sourcePath, targetPath);
                        }
                        else {
                            return async_1.nfcall(extfs.mv, sourcePath, targetPath);
                        }
                    }).then(function () { return exists; });
                });
            });
        };
        FileService.prototype.importFile = function (source, targetFolder) {
            var _this = this;
            var sourcePath = this.toAbsolutePath(source);
            var targetResource = uri_1.default.file(paths.join(targetFolder.fsPath, paths.basename(source.fsPath)));
            var targetPath = this.toAbsolutePath(targetResource);
            // 1.) resolve
            return pfs.stat(sourcePath).then(function (stat) {
                if (stat.isDirectory()) {
                    return winjs_base_1.Promise.wrapError(nls.localize('foldersCopyError', "Folders cannot be copied into the workspace. Please select individual files to copy them.")); // for now we do not allow to import a folder into a workspace
                }
                // 2.) copy
                return _this.doMoveOrCopyFile(sourcePath, targetPath, true, true).then(function (exists) {
                    // 3.) resolve
                    return _this.resolve(targetResource).then(function (stat) { return { isNew: !exists, stat: stat }; });
                });
            });
        };
        FileService.prototype.del = function (resource) {
            var absolutePath = this.toAbsolutePath(resource);
            return async_1.nfcall(extfs.del, absolutePath, this.tmpPath);
        };
        // Helpers
        FileService.prototype.toAbsolutePath = function (arg1) {
            var resource;
            if (uri_1.default.isURI(arg1)) {
                resource = arg1;
            }
            else {
                resource = arg1.resource;
            }
            assert.ok(resource && resource.scheme === 'file', 'Invalid resource: ' + resource);
            return paths.normalize(resource.fsPath);
        };
        FileService.prototype.resolve = function (resource, options) {
            if (options === void 0) { options = Object.create(null); }
            return this.toStatResolver(resource)
                .then(function (model) { return model.resolve(options); });
        };
        FileService.prototype.toStatResolver = function (resource) {
            var absolutePath = this.toAbsolutePath(resource);
            return pfs.stat(absolutePath).then(function (stat) {
                return new StatResolver(resource, stat.isDirectory(), stat.mtime.getTime(), stat.size);
            });
        };
        FileService.prototype.resolveFileContent = function (resource, etag, enc) {
            var _this = this;
            var absolutePath = this.toAbsolutePath(resource);
            // 1.) stat
            return this.resolve(resource).then(function (model) {
                // Return early if file not modified since
                if (etag && etag === model.etag) {
                    return winjs_base_1.Promise.wrapError({
                        fileOperationResult: files.FileOperationResult.FILE_NOT_MODIFIED_SINCE
                    });
                }
                // Return early if file is too large to load
                if (types.isNumber(model.size) && model.size > FileService.MAX_FILE_SIZE) {
                    return winjs_base_1.Promise.wrapError({
                        fileOperationResult: files.FileOperationResult.FILE_TOO_LARGE
                    });
                }
                // 2.) read contents
                return new winjs_base_1.Promise(function (c, e) {
                    var done = false;
                    var chunks = [];
                    var fileEncoding = _this.getEncoding(model.resource, enc);
                    var reader = fs.createReadStream(absolutePath).pipe(iconv.decodeStream(fileEncoding)); // decode takes care of stripping any BOMs from the file content
                    reader.on('data', function (buf) {
                        chunks.push(buf);
                    });
                    reader.on('error', function (error) {
                        if (!done) {
                            done = true;
                            e(error);
                        }
                    });
                    reader.on('end', function () {
                        var content = model;
                        content.value = chunks.join('');
                        content.charset = fileEncoding; // make sure to store the charset in the model to restore it later when writing
                        if (!done) {
                            done = true;
                            c(content);
                        }
                    });
                });
            });
        };
        FileService.prototype.getEncoding = function (resource, candidate) {
            var fileEncoding;
            var override = this.getEncodingOverride(resource);
            if (override) {
                fileEncoding = override;
            }
            else if (candidate) {
                fileEncoding = candidate;
            }
            else if (this.options) {
                fileEncoding = this.options.encoding;
            }
            if (!fileEncoding || !iconv.encodingExists(fileEncoding)) {
                fileEncoding = encoding.UTF8; // the default is UTF 8
            }
            return fileEncoding;
        };
        FileService.prototype.getEncodingOverride = function (resource) {
            if (resource && this.options.encodingOverride && this.options.encodingOverride.length) {
                for (var i = 0; i < this.options.encodingOverride.length; i++) {
                    var override = this.options.encodingOverride[i];
                    // check if the resource is a child of the resource with override and use
                    // the provided encoding in that case
                    if (resource.toString().indexOf(override.resource.toString() + '/') === 0) {
                        return override.encoding;
                    }
                }
            }
            return null;
        };
        FileService.prototype.checkFile = function (absolutePath, options) {
            return pfs.exists(absolutePath).then(function (exists) {
                if (exists) {
                    return pfs.stat(absolutePath).then(function (stat) {
                        if (stat.isDirectory()) {
                            return winjs_base_1.Promise.wrapError(new Error('Expected file is actually a directory'));
                        }
                        // Dirty write prevention
                        if (typeof options.mtime === 'number' && typeof options.etag === 'string' && options.mtime < stat.mtime.getTime()) {
                            // Find out if content length has changed
                            if (options.etag !== etag(stat.size, options.mtime)) {
                                return winjs_base_1.Promise.wrapError({
                                    message: 'File Modified Since',
                                    fileOperationResult: files.FileOperationResult.FILE_MODIFIED_SINCE
                                });
                            }
                        }
                        var mode = stat.mode;
                        var readonly = !(mode & 128);
                        // Throw if file is readonly and we are not instructed to overwrite
                        if (readonly && !options.overwriteReadonly) {
                            return winjs_base_1.Promise.wrapError({
                                message: nls.localize('fileReadOnlyError', "File is Read Only"),
                                fileOperationResult: files.FileOperationResult.FILE_READ_ONLY
                            });
                        }
                        if (readonly) {
                            mode = mode | 128;
                            return pfs.chmod(absolutePath, mode).then(function () { return exists; });
                        }
                        return winjs_base_1.TPromise.as(exists);
                    });
                }
                return winjs_base_1.TPromise.as(exists);
            });
        };
        FileService.prototype.watchFileChanges = function (resource) {
            var _this = this;
            assert.ok(resource && resource.scheme === 'file', 'Invalid resource for watching: ' + resource);
            var fsPath = resource.fsPath;
            // Create or get watcher for provided path
            var watcher = this.activeFileChangesWatchers[resource.toString()];
            if (!watcher) {
                try {
                    watcher = fs.watch(fsPath); // will be persistent but not recursive
                }
                catch (error) {
                    // the path might not exist anymore, ignore this error and return
                    return;
                }
                this.activeFileChangesWatchers[resource.toString()] = watcher;
                // eventType is either 'rename' or 'change'
                watcher.on('change', function (eventType) {
                    if (eventType !== 'change') {
                        return; // only care about changes for now ('rename' is not reliable and can be send even if the file is still there with some tools)
                    }
                    // add to bucket of undelivered events
                    _this.undeliveredRawFileChangesEvents.push({
                        type: files.FileChangeType.UPDATED,
                        path: fsPath
                    });
                    // handle emit through delayer to accommodate for bulk changes
                    _this.fileChangesWatchDelayer.trigger(function () {
                        var buffer = _this.undeliveredRawFileChangesEvents;
                        _this.undeliveredRawFileChangesEvents = [];
                        // Normalize
                        var normalizedEvents = common_1.normalize(buffer);
                        // Emit
                        _this.eventEmitter.emit(files.EventType.FILE_CHANGES, common_1.toFileChangesEvent(normalizedEvents));
                        return winjs_base_1.Promise.as(null);
                    });
                });
            }
        };
        FileService.prototype.unwatchFileChanges = function (arg1) {
            var resource = (typeof arg1 === 'string') ? uri_1.default.parse(arg1) : arg1;
            var watcher = this.activeFileChangesWatchers[resource.toString()];
            if (watcher) {
                watcher.close();
                delete this.activeFileChangesWatchers[resource.toString()];
            }
        };
        FileService.prototype.dispose = function () {
            if (this.workspaceWatcherToDispose) {
                this.workspaceWatcherToDispose();
                this.workspaceWatcherToDispose = null;
            }
            for (var key in this.activeFileChangesWatchers) {
                var watcher = this.activeFileChangesWatchers[key];
                watcher.close();
            }
            this.activeFileChangesWatchers = Object.create(null);
        };
        FileService.FS_EVENT_DELAY = 50; // aggregate and only emit events when changes have stopped for this duration (in ms)
        FileService.MAX_FILE_SIZE = 50 * 1024 * 1024; // do not try to load larger files than that
        FileService.MAX_DEGREE_OF_PARALLEL_FS_OPS = 10; // degree of parallel fs calls that we accept at the same time
        return FileService;
    })();
    exports.FileService = FileService;
    var StatResolver = (function () {
        function StatResolver(resource, isDirectory, mtime, size) {
            assert.ok(resource && resource.scheme === 'file', 'Invalid resource: ' + resource);
            this.resource = resource;
            this.isDirectory = isDirectory;
            this.mtime = mtime;
            this.name = paths.basename(resource.fsPath);
            this.mime = !this.isDirectory ? baseMime.guessMimeTypes(resource.fsPath).join(', ') : null;
            this.etag = etag(size, mtime);
            this.size = size;
        }
        StatResolver.prototype.resolve = function (options) {
            var _this = this;
            // General Data
            var fileStat = {
                resource: this.resource,
                isDirectory: this.isDirectory,
                hasChildren: undefined,
                name: this.name,
                etag: this.etag,
                size: this.size,
                mtime: this.mtime,
                mime: this.mime
            };
            // File Specific Data
            if (!this.isDirectory) {
                return winjs_base_1.TPromise.as(fileStat);
            }
            else {
                // Convert the paths from options.resolveTo to absolute paths
                var absoluteTargetPaths = null;
                if (options && options.resolveTo) {
                    absoluteTargetPaths = [];
                    options.resolveTo.forEach(function (resource) {
                        absoluteTargetPaths.push(resource.fsPath);
                    });
                }
                return new winjs_base_1.TPromise(function (c, e) {
                    // Load children
                    _this.resolveChildren(_this.resource.fsPath, absoluteTargetPaths, options && options.resolveSingleChildDescendants, function (children) {
                        children = arrays.coalesce(children); // we don't want those null children (could be permission denied when reading a child)
                        fileStat.hasChildren = children && children.length > 0;
                        fileStat.children = children || [];
                        c(fileStat);
                    });
                });
            }
        };
        StatResolver.prototype.resolveChildren = function (absolutePath, absoluteTargetPaths, resolveSingleChildDescendants, callback) {
            var _this = this;
            extfs.readdir(absolutePath, function (error, files) {
                if (error) {
                    console.error(error);
                    return callback(null); // return - we might not have permissions to read the folder
                }
                // for each file in the folder
                flow.parallel(files, function (file, clb) {
                    var fileResource = uri_1.default.file(paths.resolve(absolutePath, file));
                    var fileStat;
                    var $this = _this;
                    flow.sequence(function onError(error) {
                        console.error(error);
                        clb(null, null); // return - we might not have permissions to read the folder or stat the file
                    }, function stat() {
                        fs.stat(fileResource.fsPath, this);
                    }, function countChildren(fsstat) {
                        var _this = this;
                        fileStat = fsstat;
                        if (fileStat.isDirectory()) {
                            extfs.readdir(fileResource.fsPath, function (error, result) {
                                _this(null, result ? result.length : 0);
                            });
                        }
                        else {
                            this(null, 0);
                        }
                    }, function resolve(childCount) {
                        var childStat = {
                            resource: fileResource,
                            isDirectory: fileStat.isDirectory(),
                            hasChildren: childCount > 0,
                            name: file,
                            mtime: fileStat.mtime.getTime(),
                            etag: etag(fileStat),
                            size: fileStat.size,
                            mime: !fileStat.isDirectory() ? baseMime.guessMimeTypes(fileResource.fsPath).join(', ') : undefined
                        };
                        // Return early for files
                        if (!fileStat.isDirectory()) {
                            return clb(null, childStat);
                        }
                        // Handle Folder
                        var resolveFolderChildren = false;
                        if (files.length === 1 && resolveSingleChildDescendants) {
                            resolveFolderChildren = true;
                        }
                        else if (childCount > 0 && absoluteTargetPaths && absoluteTargetPaths.some(function (targetPath) { return basePaths.isEqualOrParent(targetPath, fileResource.fsPath); })) {
                            resolveFolderChildren = true;
                        }
                        // Continue resolving children based on condition
                        if (resolveFolderChildren) {
                            $this.resolveChildren(fileResource.fsPath, absoluteTargetPaths, resolveSingleChildDescendants, function (children) {
                                children = arrays.coalesce(children); // we don't want those null children
                                childStat.hasChildren = children && children.length > 0;
                                childStat.children = children || [];
                                clb(null, childStat);
                            });
                        }
                        else {
                            clb(null, childStat);
                        }
                    });
                }, function (errors, result) {
                    callback(result);
                });
            });
        };
        return StatResolver;
    })();
    exports.StatResolver = StatResolver;
});
//# sourceMappingURL=fileService.js.map