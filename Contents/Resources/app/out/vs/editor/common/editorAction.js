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
define(["require", "exports", 'vs/base/common/actions', 'vs/base/common/winjs.base', 'vs/base/common/strings', 'vs/editor/common/editorActionEnablement', 'vs/platform/instantiation/common/instantiation'], function (require, exports, actions_1, winjs_base_1, Strings, editorActionEnablement, instantiation_1) {
    exports.Behaviour = editorActionEnablement.Behaviour;
    var defaultBehaviour = exports.Behaviour.TextFocus | exports.Behaviour.Writeable | exports.Behaviour.UpdateOnModelChange;
    var EditorAction = (function (_super) {
        __extends(EditorAction, _super);
        function EditorAction(descriptor, editor, condition) {
            if (condition === void 0) { condition = defaultBehaviour; }
            _super.call(this, descriptor.id);
            this.editor = editor;
            this._descriptor = descriptor;
            this.label = descriptor.label || '';
            this._enablementState = editorActionEnablement.createActionEnablement(editor, condition, this);
            this._shouldShowInContextMenu = !!(condition & exports.Behaviour.ShowInContextMenu);
            this._supportsReadonly = !(condition & exports.Behaviour.Writeable);
        }
        EditorAction.prototype.getId = function () {
            return this.id;
        };
        EditorAction.prototype.dispose = function () {
            this._enablementState.dispose();
            _super.prototype.dispose.call(this);
        };
        /**
         * A helper to be able to group and sort actions when they are presented visually.
         */
        EditorAction.prototype.getGroupId = function () {
            return this.id;
        };
        EditorAction.prototype.shouldShowInContextMenu = function () {
            return this._shouldShowInContextMenu;
        };
        EditorAction.prototype.getDescriptor = function () {
            return this._descriptor;
        };
        Object.defineProperty(EditorAction.prototype, "enabled", {
            // ---- enablement state mangament --------------------------------------------------------
            get: function () {
                return this._enablementState.value();
            },
            set: function (value) {
                // call reset?
                var e = new Error();
                console.log('setting EditorAction.enabled is UNCOOL. Use resetEnablementState and getEnablementState');
                console.log(e.stack);
            },
            enumerable: true,
            configurable: true
        });
        EditorAction.prototype.resetEnablementState = function () {
            this._enablementState.reset();
        };
        /**
         * Returns {{true}} in case this action works
         * with the current mode. To be overwritten
         * in subclasses.
         */
        EditorAction.prototype.isSupported = function () {
            if (!this._supportsReadonly) {
                if (this.editor.getConfiguration().readOnly) {
                    return false; // action requires a writeable model
                }
                var model = this.editor.getModel();
                if (model && model.hasEditableRange()) {
                    return false; // editable ranges are an indicator for mostly readonly models
                }
            }
            return true;
        };
        /**
         * Returns the enablement state of this action. This
         * method is being called in the process of {{updateEnablementState}}
         * and overwriters should call super (this method).
         */
        EditorAction.prototype.getEnablementState = function () {
            return true;
        };
        return EditorAction;
    })(actions_1.Action);
    exports.EditorAction = EditorAction;
    var HandlerEditorAction = (function (_super) {
        __extends(HandlerEditorAction, _super);
        function HandlerEditorAction(descriptor, editor, handlerId) {
            _super.call(this, descriptor, editor);
            this._handlerId = handlerId;
        }
        HandlerEditorAction.prototype.run = function () {
            this.editor.trigger(this.getId(), this._handlerId, null);
            return winjs_base_1.TPromise.as(true);
        };
        return HandlerEditorAction;
    })(EditorAction);
    exports.HandlerEditorAction = HandlerEditorAction;
    var DynamicEditorAction = (function (_super) {
        __extends(DynamicEditorAction, _super);
        function DynamicEditorAction(descriptor, editor, ns) {
            var enablement = descriptor.enablement || {};
            _super.call(this, {
                id: descriptor.id,
                label: descriptor.label
            }, editor, DynamicEditorAction._transformBehaviour(enablement, descriptor.contextMenuGroupId));
            this._contextMenuGroupId = descriptor.contextMenuGroupId;
            this._run = descriptor.run;
            this._tokensAtPosition = enablement.tokensAtPosition;
            this._wordAtPosition = enablement.wordAtPosition;
        }
        DynamicEditorAction._transformBehaviour = function (behaviour, contextMenuGroupId) {
            var r = 0;
            if (contextMenuGroupId) {
                r |= exports.Behaviour.ShowInContextMenu;
            }
            else if (behaviour.textFocus) {
                // Allowed to set text focus only if not appearing in the context menu
                r |= exports.Behaviour.TextFocus;
            }
            if (behaviour.widgetFocus) {
                r |= exports.Behaviour.WidgetFocus;
            }
            if (behaviour.writeableEditor) {
                r |= exports.Behaviour.Writeable;
            }
            if (typeof behaviour.tokensAtPosition !== 'undefined') {
                r |= exports.Behaviour.UpdateOnCursorPositionChange;
            }
            if (typeof behaviour.wordAtPosition !== 'undefined') {
                r |= exports.Behaviour.UpdateOnCursorPositionChange;
            }
            return r;
        };
        DynamicEditorAction.prototype.getGroupId = function () {
            return this._contextMenuGroupId;
        };
        DynamicEditorAction.prototype.run = function () {
            return winjs_base_1.TPromise.as(this._run(this.editor));
        };
        DynamicEditorAction.prototype.getEnablementState = function () {
            return this._getEnablementOnTokens() && this._getEnablementOnWord();
        };
        DynamicEditorAction.prototype._getEnablementOnTokens = function () {
            if (!this._tokensAtPosition) {
                return true;
            }
            var model = this.editor.getModel(), position = this.editor.getSelection().getStartPosition(), lineContext = model.getLineContext(position.lineNumber), offset = position.column - 1;
            return isToken(lineContext, offset, this._tokensAtPosition);
        };
        DynamicEditorAction.prototype._getEnablementOnWord = function () {
            if (!this._wordAtPosition) {
                return true;
            }
            var model = this.editor.getModel(), position = this.editor.getSelection().getStartPosition(), wordAtPosition = model.getWordAtPosition(position);
            return (!!wordAtPosition);
        };
        DynamicEditorAction = __decorate([
            __param(2, instantiation_1.INullService)
        ], DynamicEditorAction);
        return DynamicEditorAction;
    })(EditorAction);
    exports.DynamicEditorAction = DynamicEditorAction;
    function isToken(context, offset, types) {
        if (context.getLineContent().length <= offset) {
            return false;
        }
        var tokenIdx = context.findIndexOfOffset(offset);
        var type = context.getTokenType(tokenIdx);
        for (var i = 0, len = types.length; i < len; i++) {
            if (types[i] === '') {
                if (type === '') {
                    return true;
                }
            }
            else {
                if (Strings.startsWith(type, types[i])) {
                    return true;
                }
            }
        }
        return false;
    }
});
//# sourceMappingURL=editorAction.js.map