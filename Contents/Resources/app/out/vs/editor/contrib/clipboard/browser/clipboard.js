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
define(["require", "exports", 'vs/nls', 'vs/base/common/lifecycle', 'vs/base/common/winjs.base', 'vs/editor/common/editorCommonExtensions', 'vs/editor/common/editorAction', 'vs/base/browser/browser', 'vs/editor/common/editorCommon', 'vs/editor/common/config/config', 'vs/platform/instantiation/common/instantiation', 'vs/base/common/keyCodes', 'vs/css!./clipboard'], function (require, exports, nls, Lifecycle, winjs_base_1, editorCommonExtensions_1, editorAction_1, Browser, EditorCommon, config, instantiation_1, keyCodes_1) {
    var ClipboardWritingAction = (function (_super) {
        __extends(ClipboardWritingAction, _super);
        function ClipboardWritingAction(descriptor, editor, condition, ns) {
            var _this = this;
            _super.call(this, descriptor, editor, condition);
            this.toUnhook = [];
            this.toUnhook.push(this.editor.addListener(EditorCommon.EventType.CursorSelectionChanged, function (e) {
                _this.resetEnablementState();
            }));
        }
        ClipboardWritingAction.prototype.dispose = function () {
            this.toUnhook = Lifecycle.cAll(this.toUnhook);
            _super.prototype.dispose.call(this);
        };
        ClipboardWritingAction.prototype.getEnablementState = function () {
            if (Browser.enableEmptySelectionClipboard) {
                return true;
            }
            else {
                return !this.editor.getSelection().isEmpty();
            }
        };
        ClipboardWritingAction = __decorate([
            __param(3, instantiation_1.INullService)
        ], ClipboardWritingAction);
        return ClipboardWritingAction;
    })(editorAction_1.EditorAction);
    function editorCursorIsInEditableRange(editor) {
        var model = editor.getModel();
        if (!model) {
            return false;
        }
        var hasEditableRange = model.hasEditableRange();
        if (!hasEditableRange) {
            return true;
        }
        var editableRange = model.getEditableRange();
        var editorPosition = editor.getPosition();
        return editableRange.containsPosition(editorPosition);
    }
    var ExecCommandCutAction = (function (_super) {
        __extends(ExecCommandCutAction, _super);
        function ExecCommandCutAction(descriptor, editor, ns) {
            _super.call(this, descriptor, editor, editorAction_1.Behaviour.Writeable | editorAction_1.Behaviour.WidgetFocus | editorAction_1.Behaviour.ShowInContextMenu | editorAction_1.Behaviour.UpdateOnCursorPositionChange, ns);
        }
        ExecCommandCutAction.prototype.getGroupId = function () {
            return '3_edit/2_cut';
        };
        ExecCommandCutAction.prototype.getEnablementState = function () {
            return _super.prototype.getEnablementState.call(this) && editorCursorIsInEditableRange(this.editor);
        };
        ExecCommandCutAction.prototype.run = function () {
            this.editor.focus();
            document.execCommand('cut');
            return winjs_base_1.TPromise.as(true);
        };
        ExecCommandCutAction = __decorate([
            __param(2, instantiation_1.INullService)
        ], ExecCommandCutAction);
        return ExecCommandCutAction;
    })(ClipboardWritingAction);
    var ExecCommandCopyAction = (function (_super) {
        __extends(ExecCommandCopyAction, _super);
        function ExecCommandCopyAction(descriptor, editor, ns) {
            _super.call(this, descriptor, editor, editorAction_1.Behaviour.WidgetFocus | editorAction_1.Behaviour.ShowInContextMenu, ns);
        }
        ExecCommandCopyAction.prototype.getGroupId = function () {
            return '3_edit/1_copy';
        };
        ExecCommandCopyAction.prototype.run = function () {
            this.editor.focus();
            document.execCommand('copy');
            return winjs_base_1.TPromise.as(true);
        };
        ExecCommandCopyAction = __decorate([
            __param(2, instantiation_1.INullService)
        ], ExecCommandCopyAction);
        return ExecCommandCopyAction;
    })(ClipboardWritingAction);
    var ExecCommandPasteAction = (function (_super) {
        __extends(ExecCommandPasteAction, _super);
        function ExecCommandPasteAction(descriptor, editor, ns) {
            _super.call(this, descriptor, editor, editorAction_1.Behaviour.Writeable | editorAction_1.Behaviour.WidgetFocus | editorAction_1.Behaviour.ShowInContextMenu | editorAction_1.Behaviour.UpdateOnCursorPositionChange);
        }
        ExecCommandPasteAction.prototype.getGroupId = function () {
            return '3_edit/3_paste';
        };
        ExecCommandPasteAction.prototype.getEnablementState = function () {
            return editorCursorIsInEditableRange(this.editor);
        };
        ExecCommandPasteAction.prototype.run = function () {
            this.editor.focus();
            document.execCommand('paste');
            return null;
        };
        ExecCommandPasteAction = __decorate([
            __param(2, instantiation_1.INullService)
        ], ExecCommandPasteAction);
        return ExecCommandPasteAction;
    })(editorAction_1.EditorAction);
    function registerClipboardAction(desc) {
        if (!Browser.supportsExecCommand(desc.execCommand)) {
            return;
        }
        editorCommonExtensions_1.CommonEditorRegistry.registerEditorAction(new editorCommonExtensions_1.EditorActionDescriptor(desc.ctor, desc.id, desc.label, {
            handler: execCommandToHandler.bind(null, desc.id, desc.execCommand),
            context: editorCommonExtensions_1.ContextKey.None,
            primary: desc.primary,
            secondary: desc.secondary,
            win: desc.win,
            linux: desc.linux,
            mac: desc.mac
        }));
    }
    registerClipboardAction({
        ctor: ExecCommandCutAction,
        id: 'editor.action.clipboardCutAction',
        label: nls.localize('actions.clipboard.cutLabel', "Cut"),
        execCommand: 'cut',
        primary: keyCodes_1.KeyMod.CtrlCmd | keyCodes_1.KeyCode.KEY_X,
        win: { primary: keyCodes_1.KeyMod.CtrlCmd | keyCodes_1.KeyCode.KEY_X, secondary: [keyCodes_1.KeyMod.Shift | keyCodes_1.KeyCode.Delete] }
    });
    registerClipboardAction({
        ctor: ExecCommandCopyAction,
        id: 'editor.action.clipboardCopyAction',
        label: nls.localize('actions.clipboard.copyLabel', "Copy"),
        execCommand: 'copy',
        primary: keyCodes_1.KeyMod.CtrlCmd | keyCodes_1.KeyCode.KEY_C,
        win: { primary: keyCodes_1.KeyMod.CtrlCmd | keyCodes_1.KeyCode.KEY_C, secondary: [keyCodes_1.KeyMod.CtrlCmd | keyCodes_1.KeyCode.Insert] }
    });
    registerClipboardAction({
        ctor: ExecCommandPasteAction,
        id: 'editor.action.clipboardPasteAction',
        label: nls.localize('actions.clipboard.pasteLabel', "Paste"),
        execCommand: 'paste',
        primary: keyCodes_1.KeyMod.CtrlCmd | keyCodes_1.KeyCode.KEY_V,
        win: { primary: keyCodes_1.KeyMod.CtrlCmd | keyCodes_1.KeyCode.KEY_V, secondary: [keyCodes_1.KeyMod.Shift | keyCodes_1.KeyCode.Insert] }
    });
    function execCommandToHandler(actionId, browserCommand, accessor, args) {
        // If editor text focus
        if (args.context[EditorCommon.KEYBINDING_CONTEXT_EDITOR_TEXT_FOCUS]) {
            var focusedEditor = config.findFocusedEditor(actionId, accessor, args, false);
            if (focusedEditor) {
                focusedEditor.trigger('keyboard', actionId, args);
                return;
            }
        }
        document.execCommand(browserCommand);
    }
});
//# sourceMappingURL=clipboard.js.map