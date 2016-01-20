/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
'use strict';
define(["require", "exports", 'vs/base/common/winjs.base', 'vs/base/node/extfs', 'vs/base/common/paths', 'path', 'vs/base/common/async', 'fs'], function (require, exports, winjs_base_1, extfs, paths, path_1, async_1, fs) {
    function isRoot(path) {
        return path === path_1.dirname(path);
    }
    exports.isRoot = isRoot;
    function readdir(path) {
        return async_1.nfcall(extfs.readdir, path);
    }
    exports.readdir = readdir;
    function exists(path) {
        return new winjs_base_1.Promise(function (c) { return fs.exists(path, c); });
    }
    exports.exists = exists;
    function chmod(path, mode) {
        return async_1.nfcall(fs.chmod, path, mode);
    }
    exports.chmod = chmod;
    function mkdirp(path, mode) {
        var mkdir = function () { return async_1.nfcall(fs.mkdir, path, mode)
            .then(null, function (err) {
            if (err.code === 'EEXIST') {
                return async_1.nfcall(fs.stat, path)
                    .then(function (stat) { return stat.isDirectory
                    ? null
                    : winjs_base_1.Promise.wrapError(new Error("'" + path + "' exists and is not a directory.")); });
            }
            return winjs_base_1.TPromise.wrapError(err);
        }); };
        if (isRoot(path)) {
            return winjs_base_1.TPromise.as(true);
        }
        return mkdir().then(null, function (err) {
            if (err.code === 'ENOENT') {
                return mkdirp(path_1.dirname(path), mode).then(mkdir);
            }
            return winjs_base_1.TPromise.wrapError(err);
        });
    }
    exports.mkdirp = mkdirp;
    function rimraf(path) {
        return stat(path).then(function (stat) {
            if (stat.isDirectory()) {
                return readdir(path)
                    .then(function (children) { return winjs_base_1.TPromise.join(children.map(function (child) { return rimraf(path_1.join(path, child)); })); })
                    .then(function () { return rmdir(path); });
            }
            else {
                return unlink(path);
            }
        }, function (err) {
            if (err.code === 'ENOENT') {
                return;
            }
            return winjs_base_1.TPromise.wrapError(err);
        });
    }
    exports.rimraf = rimraf;
    function realpath(path) {
        return async_1.nfcall(fs.realpath, path, null);
    }
    exports.realpath = realpath;
    function stat(path) {
        return async_1.nfcall(fs.stat, path);
    }
    exports.stat = stat;
    function mstat(paths) {
        return doStatMultiple(paths.slice(0));
    }
    exports.mstat = mstat;
    function rename(oldPath, newPath) {
        return async_1.nfcall(fs.rename, oldPath, newPath);
    }
    exports.rename = rename;
    function rmdir(path) {
        return async_1.nfcall(fs.rmdir, path);
    }
    exports.rmdir = rmdir;
    function unlink(path) {
        return async_1.nfcall(fs.unlink, path);
    }
    exports.unlink = unlink;
    function doStatMultiple(paths) {
        var path = paths.shift();
        return stat(path).then(function (value) {
            return {
                path: path,
                stats: value
            };
        }, function (err) {
            if (paths.length === 0) {
                return err;
            }
            return mstat(paths);
        });
    }
    function readFile(path, encoding) {
        return async_1.nfcall(fs.readFile, path, encoding);
    }
    exports.readFile = readFile;
    function writeFile(path, data, encoding) {
        if (encoding === void 0) { encoding = 'utf8'; }
        return async_1.nfcall(fs.writeFile, path, data, encoding);
    }
    exports.writeFile = writeFile;
    /**
    * Read a dir and return only subfolders
    */
    function readDirsInDir(dirPath) {
        return readdir(dirPath).then(function (children) {
            return winjs_base_1.TPromise.join(children.map(function (child) { return dirExistsWithResult(paths.join(dirPath, child), child); })).then(function (subdirs) {
                return removeNull(subdirs);
            });
        });
    }
    exports.readDirsInDir = readDirsInDir;
    function dirExistsWithResult(path, successResult) {
        return dirExists(path).then(function (exists) {
            return exists ? successResult : null;
        });
    }
    /**
    * `path` exists and is a directory
    */
    function dirExists(path) {
        return stat(path).then(function (stat) { return stat.isDirectory(); }, function () { return false; });
    }
    exports.dirExists = dirExists;
    /**
    * `path` exists and is a file.
    */
    function fileExists(path) {
        return stat(path).then(function (stat) { return stat.isFile(); }, function () { return false; });
    }
    exports.fileExists = fileExists;
    /**
    * Read dir at `path` and return only files matching `pattern`
    */
    function readFiles(path, pattern) {
        return readdir(path).then(function (children) {
            children = children.filter(function (child) {
                return pattern.test(child);
            });
            var fileChildren = children.map(function (child) {
                return fileExistsWithResult(paths.join(path, child), child);
            });
            return winjs_base_1.TPromise.join(fileChildren).then(function (subdirs) {
                return removeNull(subdirs);
            });
        });
    }
    exports.readFiles = readFiles;
    function fileExistsWithResult(path, successResult) {
        return fileExists(path).then(function (exists) {
            return exists ? successResult : null;
        }, function (err) {
            return winjs_base_1.TPromise.wrapError(err);
        });
    }
    exports.fileExistsWithResult = fileExistsWithResult;
    function removeNull(arr) {
        return arr.filter(function (item) { return (item !== null); });
    }
});
//# sourceMappingURL=pfs.js.map