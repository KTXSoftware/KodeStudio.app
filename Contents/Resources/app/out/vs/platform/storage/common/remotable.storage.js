/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
'use strict';
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") return Reflect.decorate(decorators, target, key, desc);
    switch (arguments.length) {
        case 2: return decorators.reduceRight(function(o, d) { return (d && d(o)) || o; }, target);
        case 3: return decorators.reduceRight(function(o, d) { return (d && d(target, key)), void 0; }, void 0);
        case 4: return decorators.reduceRight(function(o, d) { return (d && d(target, key, o)) || o; }, desc);
    }
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
define(["require", "exports", 'vs/base/common/winjs.base', 'vs/platform/thread/common/thread', 'vs/platform/storage/common/storage'], function (require, exports, winjs_base_1, thread_1, storage_1) {
    var MainThreadStorage = (function () {
        function MainThreadStorage(storageService) {
            this._storageService = storageService;
        }
        MainThreadStorage.prototype.getValue = function (shared, key) {
            var jsonValue = this._storageService.get(key, shared ? storage_1.StorageScope.GLOBAL : storage_1.StorageScope.WORKSPACE);
            if (!jsonValue) {
                return winjs_base_1.TPromise.as(undefined);
            }
            var value;
            try {
                value = JSON.parse(jsonValue);
                return winjs_base_1.TPromise.as(value);
            }
            catch (err) {
                return winjs_base_1.TPromise.wrapError(err);
            }
        };
        MainThreadStorage.prototype.setValue = function (shared, key, value) {
            var jsonValue;
            try {
                jsonValue = JSON.stringify(value);
                this._storageService.store(key, jsonValue, shared ? storage_1.StorageScope.GLOBAL : storage_1.StorageScope.WORKSPACE);
            }
            catch (err) {
                return winjs_base_1.TPromise.wrapError(err);
            }
        };
        MainThreadStorage = __decorate([
            thread_1.Remotable.MainContext('MainThreadStorage'),
            __param(0, storage_1.IStorageService)
        ], MainThreadStorage);
        return MainThreadStorage;
    })();
    exports.MainThreadStorage = MainThreadStorage;
    var PluginHostStorage = (function () {
        function PluginHostStorage(threadService) {
            this._proxy = threadService.getRemotable(MainThreadStorage);
        }
        PluginHostStorage.prototype.getValue = function (shared, key, defaultValue) {
            return this._proxy.getValue(shared, key).then(function (value) { return value || defaultValue; });
        };
        PluginHostStorage.prototype.setValue = function (shared, key, value) {
            return this._proxy.setValue(shared, key, value);
        };
        return PluginHostStorage;
    })();
    exports.PluginHostStorage = PluginHostStorage;
});
//# sourceMappingURL=remotable.storage.js.map