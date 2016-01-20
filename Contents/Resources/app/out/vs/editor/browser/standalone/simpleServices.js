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
define(["require", "exports", 'vs/base/common/winjs.base', 'vs/base/common/errors', 'vs/base/common/network', 'vs/base/common/eventEmitter', 'vs/editor/common/editorCommon', 'vs/base/common/severity', 'vs/platform/keybinding/browser/keybindingServiceImpl', 'vs/platform/request/common/baseRequestService', 'vs/platform/editor/common/editor', 'vs/platform/message/common/message', 'vs/platform/plugins/common/abstractPluginService', 'vs/platform/keybinding/common/keybindingResolver', 'vs/platform/plugins/common/pluginsRegistry'], function (require, exports, winjs_base_1, Errors, Network, EventEmitter, EditorCommon, severity_1, KeybindingService, baseRequestService_1, editor_1, message_1, abstractPluginService_1, keybindingResolver_1, pluginsRegistry_1) {
    var SimpleEditor = (function () {
        function SimpleEditor(editor) {
            this._widget = editor;
        }
        SimpleEditor.prototype.getId = function () { return 'editor'; };
        SimpleEditor.prototype.getControl = function () { return this._widget; };
        SimpleEditor.prototype.getSelection = function () { return this._widget.getSelection(); };
        SimpleEditor.prototype.focus = function () { this._widget.focus(); };
        SimpleEditor.prototype.withTypedEditor = function (codeEditorCallback, diffEditorCallback) {
            if (this._widget.getEditorType() === EditorCommon.EditorType.ICodeEditor) {
                // Single Editor
                return codeEditorCallback(this._widget);
            }
            else {
                // Diff Editor
                return diffEditorCallback(this._widget);
            }
        };
        return SimpleEditor;
    })();
    exports.SimpleEditor = SimpleEditor;
    var SimpleModel = (function (_super) {
        __extends(SimpleModel, _super);
        function SimpleModel(model) {
            _super.call(this);
            this.model = model;
        }
        Object.defineProperty(SimpleModel.prototype, "textEditorModel", {
            get: function () {
                return this.model;
            },
            enumerable: true,
            configurable: true
        });
        return SimpleModel;
    })(EventEmitter.EventEmitter);
    exports.SimpleModel = SimpleModel;
    var SimpleEditorService = (function () {
        function SimpleEditorService() {
            this.serviceId = editor_1.IEditorService;
            this.openEditorDelegate = null;
        }
        SimpleEditorService.prototype.setEditor = function (editor) {
            this.editor = new SimpleEditor(editor);
        };
        SimpleEditorService.prototype.setOpenEditorDelegate = function (openEditorDelegate) {
            this.openEditorDelegate = openEditorDelegate;
        };
        SimpleEditorService.prototype.openEditor = function (typedData, sideBySide) {
            var _this = this;
            return winjs_base_1.TPromise.as(this.editor.withTypedEditor(function (editor) { return _this.doOpenEditor(editor, typedData); }, function (diffEditor) { return (_this.doOpenEditor(diffEditor.getOriginalEditor(), typedData) ||
                _this.doOpenEditor(diffEditor.getModifiedEditor(), typedData)); }));
        };
        SimpleEditorService.prototype.doOpenEditor = function (editor, data) {
            var model = this.findModel(editor, data);
            if (!model) {
                if (data.resource) {
                    if (this.openEditorDelegate) {
                        this.openEditorDelegate(data.resource.toString());
                        return null;
                    }
                    else {
                        var schema = data.resource.scheme;
                        if (schema === Network.schemas.http || schema === Network.schemas.https) {
                            // This is a fully qualified http or https URL
                            window.open(data.resource.toString());
                            return this.editor;
                        }
                    }
                }
                return null;
            }
            var selection = data.options.selection;
            if (selection) {
                if (typeof selection.endLineNumber === 'number' && typeof selection.endColumn === 'number') {
                    editor.setSelection(selection);
                    editor.revealRangeInCenter(selection);
                }
                else {
                    var pos = {
                        lineNumber: selection.startLineNumber,
                        column: selection.startColumn
                    };
                    editor.setPosition(pos);
                    editor.revealPositionInCenter(pos);
                }
            }
            return this.editor;
        };
        SimpleEditorService.prototype.findModel = function (editor, data) {
            var model = editor.getModel();
            if (model.getAssociatedResource().toString() !== data.resource.toString()) {
                return null;
            }
            return model;
        };
        SimpleEditorService.prototype.resolveEditorModel = function (typedData, refresh) {
            var _this = this;
            var model;
            model = this.editor.withTypedEditor(function (editor) { return _this.findModel(editor, typedData); }, function (diffEditor) { return _this.findModel(diffEditor.getOriginalEditor(), typedData) || _this.findModel(diffEditor.getModifiedEditor(), typedData); });
            if (!model) {
                return winjs_base_1.TPromise.as(null);
            }
            return winjs_base_1.TPromise.as(new SimpleModel(model));
        };
        return SimpleEditorService;
    })();
    exports.SimpleEditorService = SimpleEditorService;
    var SimpleMessageService = (function () {
        function SimpleMessageService() {
            this.serviceId = message_1.IMessageService;
        }
        SimpleMessageService.prototype.show = function (sev, message) {
            switch (sev) {
                case severity_1.default.Error:
                    console.error(Errors.toErrorMessage(message, true));
                    break;
                case severity_1.default.Warning:
                    console.warn(message);
                    break;
                default:
                    console.log(message);
                    break;
            }
            return SimpleMessageService.Empty;
        };
        SimpleMessageService.prototype.hideAll = function () {
            // No-op
        };
        SimpleMessageService.prototype.confirm = function (confirmation) {
            var messageText = confirmation.message;
            if (confirmation.detail) {
                messageText = messageText + '\n\n' + confirmation.detail;
            }
            return window.confirm(messageText);
        };
        SimpleMessageService.prototype.setStatusMessage = function (message, autoDisposeAfter) {
            if (autoDisposeAfter === void 0) { autoDisposeAfter = -1; }
            return {
                dispose: function () { }
            };
        };
        SimpleMessageService.Empty = function () { };
        return SimpleMessageService;
    })();
    exports.SimpleMessageService = SimpleMessageService;
    var SimpleEditorRequestService = (function (_super) {
        __extends(SimpleEditorRequestService, _super);
        function SimpleEditorRequestService(contextService, telemetryService) {
            _super.call(this, contextService, telemetryService);
        }
        return SimpleEditorRequestService;
    })(baseRequestService_1.BaseRequestService);
    exports.SimpleEditorRequestService = SimpleEditorRequestService;
    var StandaloneKeybindingService = (function (_super) {
        __extends(StandaloneKeybindingService, _super);
        function StandaloneKeybindingService(domNode) {
            this._dynamicKeybindings = [];
            this._dynamicCommands = Object.create(null);
            _super.call(this, domNode);
        }
        StandaloneKeybindingService.prototype.addDynamicKeybinding = function (keybinding, handler, context, commandId) {
            if (commandId === void 0) { commandId = null; }
            if (commandId === null) {
                commandId = 'DYNAMIC_' + (++StandaloneKeybindingService.LAST_GENERATED_ID);
            }
            var parsedContext = keybindingResolver_1.IOSupport.readKeybindingContexts(context);
            this._dynamicKeybindings.push({
                keybinding: keybinding,
                command: commandId,
                context: parsedContext,
                weight1: 1000,
                weight2: 0
            });
            this._dynamicCommands[commandId] = handler;
            this.updateResolver();
            return commandId;
        };
        StandaloneKeybindingService.prototype._getExtraKeybindings = function (isFirstTime) {
            return this._dynamicKeybindings;
        };
        StandaloneKeybindingService.prototype._getCommandHandler = function (commandId) {
            return _super.prototype._getCommandHandler.call(this, commandId) || this._dynamicCommands[commandId];
        };
        StandaloneKeybindingService.LAST_GENERATED_ID = 0;
        return StandaloneKeybindingService;
    })(KeybindingService.KeybindingService);
    exports.StandaloneKeybindingService = StandaloneKeybindingService;
    var SimplePluginService = (function (_super) {
        __extends(SimplePluginService, _super);
        function SimplePluginService() {
            var _this = this;
            _super.call(this, true);
            pluginsRegistry_1.PluginsRegistry.handleExtensionPoints(function (severity, source, message) {
                _this.showMessage(severity, source, message);
            });
        }
        SimplePluginService.prototype._showMessage = function (severity, msg) {
            switch (severity) {
                case severity_1.default.Error:
                    console.error(msg);
                    break;
                case severity_1.default.Warning:
                    console.warn(msg);
                    break;
                case severity_1.default.Info:
                    console.info(msg);
                    break;
                default:
                    console.log(msg);
            }
        };
        SimplePluginService.prototype.deactivate = function (pluginId) {
            // nothing to do
        };
        return SimplePluginService;
    })(abstractPluginService_1.AbstractPluginService);
    exports.SimplePluginService = SimplePluginService;
});
//# sourceMappingURL=simpleServices.js.map