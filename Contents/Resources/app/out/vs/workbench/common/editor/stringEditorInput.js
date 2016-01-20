/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
'use strict';
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
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
define(["require", "exports", 'vs/base/common/winjs.base', 'vs/base/common/mime', 'vs/workbench/common/editor', 'vs/workbench/common/editor/stringEditorModel', 'vs/platform/instantiation/common/instantiation'], function (require, exports, winjs_base_1, mime_1, editor_1, stringEditorModel_1, instantiation_1) {
    /**
     * A read-only text editor input whos contents are made of the provided value and mime type.
     */
    var StringEditorInput = (function (_super) {
        __extends(StringEditorInput, _super);
        function StringEditorInput(name, description, value, mime, singleton, instantiationService) {
            _super.call(this);
            this.instantiationService = instantiationService;
            this.name = name;
            this.description = description;
            this.value = value;
            this.mime = mime || mime_1.MIME_TEXT;
            this.singleton = singleton;
        }
        StringEditorInput.prototype.getResource = function () {
            // Subclasses can implement to associate a resource with the input
            return null;
        };
        StringEditorInput.prototype.getId = function () {
            return StringEditorInput.ID;
        };
        StringEditorInput.prototype.getName = function () {
            return this.name;
        };
        StringEditorInput.prototype.getDescription = function () {
            return this.description;
        };
        StringEditorInput.prototype.getValue = function () {
            return this.value;
        };
        StringEditorInput.prototype.getMime = function () {
            return this.mime;
        };
        /**
         * Sets the textual value of this input and will also update the underlying model if this input is resolved.
         */
        StringEditorInput.prototype.setValue = function (value) {
            this.value = value;
            if (this.cachedModel) {
                this.cachedModel.setValue(value);
            }
        };
        /**
         * Clears the textual value of this input and will also update the underlying model if this input is resolved.
         */
        StringEditorInput.prototype.clearValue = function () {
            this.value = '';
            if (this.cachedModel) {
                this.cachedModel.clearValue();
            }
        };
        /**
         * Appends to the textual value of this input and will also update the underlying model if this input is resolved.
         */
        StringEditorInput.prototype.append = function (value) {
            this.value += value;
            if (this.cachedModel) {
                this.cachedModel.append(value);
            }
        };
        /**
         * Removes all lines from the top if the line number exceeds the given line count. Returns the new value if lines got trimmed.
         *
         * Note: This method is a no-op if the input has not yet been resolved.
         */
        StringEditorInput.prototype.trim = function (linecount) {
            if (this.cachedModel) {
                var newValue = this.cachedModel.trim(linecount);
                if (newValue !== null) {
                    this.value = newValue;
                    return this.value;
                }
            }
            return null;
        };
        StringEditorInput.prototype.resolve = function (refresh) {
            var _this = this;
            // Use Cached Model
            if (this.cachedModel) {
                return winjs_base_1.TPromise.as(this.cachedModel);
            }
            //Otherwise Create Model and Load
            var model = this.instantiationService.createInstance(stringEditorModel_1.StringEditorModel, this.value, this.mime, this.getResource());
            return model.load().then(function (resolvedModel) {
                _this.cachedModel = resolvedModel;
                return _this.cachedModel;
            });
        };
        StringEditorInput.prototype.matches = function (otherInput) {
            if (_super.prototype.matches.call(this, otherInput) === true) {
                return true;
            }
            if (otherInput instanceof StringEditorInput) {
                var otherStringEditorInput = otherInput;
                // If both inputs are singletons, check on the mime for equalness
                if (otherStringEditorInput.singleton && this.singleton && otherStringEditorInput.mime === this.mime) {
                    return true;
                }
                // Otherwise compare by properties
                return otherStringEditorInput.value === this.value &&
                    otherStringEditorInput.mime === this.mime &&
                    otherStringEditorInput.description === this.description &&
                    otherStringEditorInput.name === this.name;
            }
            return false;
        };
        StringEditorInput.prototype.dispose = function () {
            if (this.cachedModel) {
                this.cachedModel.dispose();
                this.cachedModel = null;
            }
            _super.prototype.dispose.call(this);
        };
        StringEditorInput.ID = 'workbench.editors.stringEditorInput';
        StringEditorInput = __decorate([
            __param(5, instantiation_1.IInstantiationService)
        ], StringEditorInput);
        return StringEditorInput;
    })(editor_1.EditorInput);
    exports.StringEditorInput = StringEditorInput;
});
//# sourceMappingURL=stringEditorInput.js.map