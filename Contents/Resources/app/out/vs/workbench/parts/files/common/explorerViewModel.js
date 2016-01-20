/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
define(["require", "exports", 'vs/base/common/assert', 'vs/base/common/types', 'vs/base/common/uri', 'vs/base/common/platform', 'vs/base/common/paths', 'vs/base/common/mime'], function (require, exports, assert, types, uri_1, platform_1, paths, mime_1) {
    'use strict';
    (function (StatType) {
        StatType[StatType["FILE"] = 0] = "FILE";
        StatType[StatType["FOLDER"] = 1] = "FOLDER";
        StatType[StatType["ANY"] = 2] = "ANY";
    })(exports.StatType || (exports.StatType = {}));
    var StatType = exports.StatType;
    var FileStat = (function () {
        function FileStat(resource, isDirectory, hasChildren, name, mtime, etag) {
            if (name === void 0) { name = paths.basename(resource.fsPath); }
            this.resource = resource;
            this.name = name;
            this.isDirectory = !!isDirectory;
            this.hasChildren = isDirectory && hasChildren;
            this.mime = !isDirectory ? mime_1.guessMimeTypes(this.resource.fsPath).join(', ') : void (0);
            this.etag = etag;
            this.mtime = mtime;
            // Prepare child stat array
            if (this.isDirectory) {
                this.children = [];
            }
            this.isDirectoryResolved = false;
        }
        FileStat.prototype.getId = function () {
            return this.resource.toString();
        };
        FileStat.create = function (raw, resolveTo) {
            var stat = new FileStat(raw.resource, raw.isDirectory, raw.hasChildren, raw.name, raw.mtime, raw.etag);
            // Recursively add children if present
            if (stat.isDirectory) {
                // isDirectoryResolved is a very important indicator in the stat model that tells if the folder was fully resolved
                // the folder is fully resolved if either it has a list of children or the client requested this by using the resolveTo
                // array of resource path to resolve.
                stat.isDirectoryResolved = !!raw.children || (!!resolveTo && resolveTo.some(function (r) {
                    return paths.isEqualOrParent(r.fsPath, stat.resource.fsPath);
                }));
                // Recurse into children
                if (raw.children) {
                    for (var i = 0, len = raw.children.length; i < len; i++) {
                        var child = FileStat.create(raw.children[i], resolveTo);
                        child.parent = stat;
                        stat.children.push(child);
                        stat.hasChildren = stat.children.length > 0;
                    }
                }
            }
            return stat;
        };
        /**
         * Merges the stat which was resolved from the disk with the local stat by copying over properties
         * and children. The merge will only consider resolved stat elements to avoid overwriting data which
         * exists locally.
         */
        FileStat.mergeLocalWithDisk = function (disk, local) {
            assert.ok(disk.resource.toString() === local.resource.toString(), 'Merging only supported for stats with the same resource');
            // Stop merging when a folder is not resolved to avoid loosing local data
            var mergingDirectories = disk.isDirectory || local.isDirectory;
            if (mergingDirectories && local.isDirectoryResolved && !disk.isDirectoryResolved) {
                return;
            }
            // Properties
            local.resource = disk.resource;
            local.name = disk.name;
            local.isDirectory = disk.isDirectory;
            local.hasChildren = disk.isDirectory && disk.hasChildren;
            local.mtime = disk.mtime;
            local.mime = disk.mime;
            local.isDirectoryResolved = disk.isDirectoryResolved;
            // Merge Children if resolved
            if (mergingDirectories && disk.isDirectoryResolved) {
                // Map resource => stat
                var oldLocalChildren = Object.create(null);
                local.children.forEach(function (localChild) {
                    oldLocalChildren[localChild.resource.toString()] = localChild;
                });
                // Clear current children
                local.children = [];
                // Merge received children
                disk.children.forEach(function (diskChild) {
                    var formerLocalChild = oldLocalChildren[diskChild.resource.toString()];
                    // Existing child: merge
                    if (formerLocalChild) {
                        FileStat.mergeLocalWithDisk(diskChild, formerLocalChild);
                        formerLocalChild.parent = local;
                        local.children.push(formerLocalChild);
                    }
                    else {
                        diskChild.parent = local;
                        local.children.push(diskChild);
                    }
                });
            }
        };
        /**
         * Returns a deep copy of this model object.
         */
        FileStat.prototype.clone = function () {
            var stat = new FileStat(uri_1.default.parse(this.resource.toString()), this.isDirectory, this.hasChildren, this.name, this.mtime, this.etag);
            stat.isDirectoryResolved = this.isDirectoryResolved;
            if (this.parent) {
                stat.parent = this.parent;
            }
            if (this.isDirectory) {
                this.children.forEach(function (child) {
                    stat.addChild(child.clone());
                });
            }
            return stat;
        };
        /**
         * Adds a child element to this folder.
         */
        FileStat.prototype.addChild = function (child) {
            assert.ok(this.isDirectory, 'Can only add a child to a folder');
            // Overwrite a previous child with the same name
            this.removeChild(child);
            // Inherit some parent properties to child
            child.parent = this;
            child.updateResource(false);
            this.children.push(child);
            this.hasChildren = this.children.length > 0;
        };
        /**
         * Returns true if this stat is a directory that contains a child with the given name.
         *
         * @param ignoreCase if true, will check for the name ignoring case.
         * @param type the type of stat to check for.
         */
        FileStat.prototype.hasChild = function (name, ignoreCase, type) {
            if (type === void 0) { type = StatType.ANY; }
            assert.ok(this.isDirectory, 'Can only call hasChild on a directory');
            assert.ok(types.isString(name), 'Expected parameter of type String');
            for (var i = 0; i < this.children.length; i++) {
                var child = this.children[i];
                if ((type === StatType.FILE && child.isDirectory) || (type === StatType.FOLDER && !child.isDirectory)) {
                    continue;
                }
                // Check for Identity
                if (child.name === name) {
                    return true;
                }
                // Also consider comparing without case
                if (ignoreCase && child.name.toLowerCase() === name.toLowerCase()) {
                    return true;
                }
            }
            return false;
        };
        /**
         * Removes a child element from this folder.
         */
        FileStat.prototype.removeChild = function (child) {
            assert.ok(this.isDirectory, 'Can only remove a child from a directory');
            assert.ok(!!this.children, 'Expected children for directory but found none: ' + this.resource.fsPath);
            for (var i = 0; i < this.children.length; i++) {
                if (this.children[i].resource.toString() === child.resource.toString()) {
                    this.children.splice(i, 1);
                    break;
                }
            }
            this.hasChildren = this.children.length > 0;
        };
        /**
         * Moves this element under a new parent element.
         */
        FileStat.prototype.move = function (newParent, fnBetweenStates, fnDone) {
            var _this = this;
            assert.ok(newParent.isDirectory, 'Can only move an element into a directory');
            if (!fnBetweenStates) {
                fnBetweenStates = function (cb) { cb(); };
            }
            this.parent.removeChild(this);
            fnBetweenStates(function () {
                newParent.addChild(_this);
                _this.updateResource(true);
                if (fnDone) {
                    fnDone();
                }
            });
        };
        FileStat.prototype.updateResource = function (recursive) {
            this.resource = uri_1.default.file(paths.join(this.parent.resource.fsPath, this.name));
            if (recursive) {
                if (this.isDirectory && this.hasChildren && this.children) {
                    this.children.forEach(function (child) {
                        child.updateResource(true);
                    });
                }
            }
        };
        /**
         * Tells this stat that it was renamed. This requires changes to all children of this stat (if any)
         * so that the path property can be updated properly.
         */
        FileStat.prototype.rename = function (renamedStat) {
            // Merge a subset of Properties that can change on rename
            this.name = renamedStat.name;
            this.mime = renamedStat.mime;
            this.mtime = renamedStat.mtime;
            // Update Paths including children
            this.updateResource(true);
        };
        /**
         * Returns a child stat from this stat that matches with the provided path.
         * Will return "null" in case the child does not exist.
         */
        FileStat.prototype.find = function (resource) {
            // Return if path found
            if (this.fileResourceEquals(resource, this.resource)) {
                return this;
            }
            // Return if not having any children
            if (!this.hasChildren) {
                return null;
            }
            for (var i = 0; i < this.children.length; i++) {
                var child = this.children[i];
                if (this.fileResourceEquals(resource, child.resource)) {
                    return child;
                }
                if (child.isDirectory && paths.isEqualOrParent(resource.fsPath, child.resource.fsPath)) {
                    return child.find(resource);
                }
            }
            return null; //Unable to find
        };
        FileStat.prototype.fileResourceEquals = function (r1, r2) {
            var identityEquals = (r1.toString() === r2.toString());
            if (platform_1.isLinux || identityEquals) {
                return identityEquals;
            }
            return r1.toString().toLowerCase() === r2.toString().toLowerCase();
        };
        return FileStat;
    })();
    exports.FileStat = FileStat;
    /* A helper that can be used to show a placeholder when creating a new stat */
    var NewStatPlaceholder = (function (_super) {
        __extends(NewStatPlaceholder, _super);
        function NewStatPlaceholder(isDirectory) {
            _super.call(this, uri_1.default.file(''));
            this.id = NewStatPlaceholder.ID++;
            this.isDirectoryResolved = isDirectory;
        }
        NewStatPlaceholder.prototype.destroy = function () {
            this.parent.removeChild(this);
            delete this.isDirectoryResolved;
            delete this.name;
            delete this.isDirectory;
            delete this.hasChildren;
            delete this.mtime;
            delete this.mime;
        };
        NewStatPlaceholder.prototype.getId = function () {
            return 'new-stat-placeholder:' + this.id + ':' + this.parent.resource.toString();
        };
        /**
         * Returns a deep copy of this model object.
         */
        NewStatPlaceholder.prototype.clone = function () {
            var stat = new NewStatPlaceholder(this.isDirectory);
            stat.parent = this.parent;
            return stat;
        };
        NewStatPlaceholder.prototype.addChild = function (child) {
            throw new Error('Can\'t perform operations in NewStatPlaceholder.');
        };
        NewStatPlaceholder.prototype.hasChild = function (name, ignoreCase) {
            return false;
        };
        NewStatPlaceholder.prototype.removeChild = function (child) {
            throw new Error('Can\'t perform operations in NewStatPlaceholder.');
        };
        NewStatPlaceholder.prototype.move = function (newParent) {
            throw new Error('Can\'t perform operations in NewStatPlaceholder.');
        };
        NewStatPlaceholder.prototype.rename = function (renamedStat) {
            throw new Error('Can\'t perform operations in NewStatPlaceholder.');
        };
        NewStatPlaceholder.prototype.find = function (resource) {
            return null;
        };
        NewStatPlaceholder.addNewStatPlaceholder = function (parent, isDirectory) {
            assert.ok(parent.isDirectory, 'Can only add a child to a folder');
            var child = new NewStatPlaceholder(isDirectory);
            // Inherit some parent properties to child
            child.parent = parent;
            parent.children.push(child);
            parent.hasChildren = parent.children.length > 0;
            return child;
        };
        NewStatPlaceholder.ID = 0;
        return NewStatPlaceholder;
    })(FileStat);
    exports.NewStatPlaceholder = NewStatPlaceholder;
});
//# sourceMappingURL=explorerViewModel.js.map