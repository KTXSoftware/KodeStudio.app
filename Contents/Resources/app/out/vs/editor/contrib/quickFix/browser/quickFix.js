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
define(["require", "exports", 'vs/nls', 'vs/base/common/errors', './quickFixSelectionWidget', './quickFixModel', 'vs/base/common/winjs.base', 'vs/editor/browser/editorBrowserExtensions', 'vs/editor/common/editorCommonExtensions', 'vs/editor/common/editorAction', 'vs/base/common/severity', 'vs/platform/keybinding/common/keybindingService', 'vs/platform/markers/common/markers', 'vs/platform/telemetry/common/telemetry', 'vs/platform/instantiation/common/instantiation', 'vs/platform/event/common/event', 'vs/platform/editor/common/editor', 'vs/platform/message/common/message', 'vs/editor/common/services/bulkEdit', '../common/quickFix', 'vs/base/common/keyCodes'], function (require, exports, nls, errors_1, quickFixSelectionWidget, quickFixModel, winjs_base_1, editorBrowserExtensions_1, editorCommonExtensions_1, editorAction_1, severity_1, keybindingService_1, markers_1, telemetry_1, instantiation_1, event_1, editor_1, message_1, bulkEdit_1, quickFix_1, keyCodes_1) {
    var QuickFixController = (function () {
        function QuickFixController(editor, markerService, keybindingService, telemetryService, eventService, editorService, messageService) {
            var _this = this;
            this.editor = editor;
            this.model = new quickFixModel.QuickFixModel(this.editor, markerService, this.onAccept.bind(this));
            this.eventService = eventService;
            this.editorService = editorService;
            this.messageService = messageService;
            this.quickFixWidgetVisible = keybindingService.createKey(CONTEXT_QUICK_FIX_WIDGET_VISIBLE, false);
            this.suggestWidget = new quickFixSelectionWidget.QuickFixSelectionWidget(this.editor, telemetryService, function () {
                _this.quickFixWidgetVisible.set(true);
            }, function () {
                _this.quickFixWidgetVisible.reset();
            });
            this.suggestWidget.setModel(this.model);
        }
        QuickFixController.getQuickFixController = function (editor) {
            return editor.getContribution(QuickFixController.ID);
        };
        QuickFixController.prototype.getId = function () {
            return QuickFixController.ID;
        };
        QuickFixController.prototype.onAccept = function (fix, range) {
            var _this = this;
            var model = this.editor.getModel();
            if (!model) {
                return;
            }
            fix.support.runQuickFixAction(this.editor.getModel().getAssociatedResource(), range, { command: fix.command, score: fix.score }).then(function (result) {
                if (result) {
                    if (result.message) {
                        _this.messageService.show(severity_1.default.Info, result.message);
                    }
                    if (result.edits) {
                        return bulkEdit_1.bulkEdit(_this.eventService, _this.editorService, _this.editor, result.edits);
                    }
                }
                return winjs_base_1.TPromise.as(0);
            }).done(undefined, function (err) {
                errors_1.onUnexpectedError(err);
            });
        };
        QuickFixController.prototype.run = function () {
            this.model.triggerDialog(false, this.editor.getPosition());
            this.editor.focus();
            return winjs_base_1.TPromise.as(false);
        };
        QuickFixController.prototype.dispose = function () {
            if (this.suggestWidget) {
                this.suggestWidget.destroy();
                this.suggestWidget = null;
            }
            if (this.model) {
                this.model.dispose();
                this.model = null;
            }
        };
        QuickFixController.prototype.acceptSelectedSuggestion = function () {
            if (this.suggestWidget) {
                this.suggestWidget.acceptSelectedSuggestion();
            }
        };
        QuickFixController.prototype.closeWidget = function () {
            if (this.model) {
                this.model.cancelDialog();
            }
        };
        QuickFixController.prototype.selectNextSuggestion = function () {
            if (this.suggestWidget) {
                this.suggestWidget.selectNext();
            }
        };
        QuickFixController.prototype.selectNextPageSuggestion = function () {
            if (this.suggestWidget) {
                this.suggestWidget.selectNextPage();
            }
        };
        QuickFixController.prototype.selectPrevSuggestion = function () {
            if (this.suggestWidget) {
                this.suggestWidget.selectPrevious();
            }
        };
        QuickFixController.prototype.selectPrevPageSuggestion = function () {
            if (this.suggestWidget) {
                this.suggestWidget.selectPreviousPage();
            }
        };
        QuickFixController.ID = 'editor.contrib.quickFixController';
        QuickFixController = __decorate([
            __param(1, markers_1.IMarkerService),
            __param(2, keybindingService_1.IKeybindingService),
            __param(3, telemetry_1.ITelemetryService),
            __param(4, event_1.IEventService),
            __param(5, editor_1.IEditorService),
            __param(6, message_1.IMessageService)
        ], QuickFixController);
        return QuickFixController;
    })();
    exports.QuickFixController = QuickFixController;
    var QuickFixAction = (function (_super) {
        __extends(QuickFixAction, _super);
        function QuickFixAction(descriptor, editor, ns) {
            _super.call(this, descriptor, editor);
        }
        QuickFixAction.prototype.isSupported = function () {
            var model = this.editor.getModel();
            return quickFix_1.QuickFixRegistry.has(model) && !this.editor.getConfiguration().readOnly;
        };
        QuickFixAction.prototype.run = function () {
            return QuickFixController.getQuickFixController(this.editor).run();
        };
        QuickFixAction.ID = 'editor.action.quickFix';
        QuickFixAction = __decorate([
            __param(2, instantiation_1.INullService)
        ], QuickFixAction);
        return QuickFixAction;
    })(editorAction_1.EditorAction);
    exports.QuickFixAction = QuickFixAction;
    var CONTEXT_QUICK_FIX_WIDGET_VISIBLE = 'quickFixWidgetVisible';
    var weight = editorCommonExtensions_1.CommonEditorRegistry.commandWeight(80);
    // register action
    editorCommonExtensions_1.CommonEditorRegistry.registerEditorAction(new editorCommonExtensions_1.EditorActionDescriptor(QuickFixAction, QuickFixAction.ID, nls.localize('quickfix.trigger.label', "Quick Fix"), {
        context: editorCommonExtensions_1.ContextKey.EditorTextFocus,
        primary: keyCodes_1.KeyMod.CtrlCmd | keyCodes_1.KeyCode.US_DOT
    }));
    editorCommonExtensions_1.CommonEditorRegistry.registerEditorCommand('acceptQuickFixSuggestion', weight, { primary: keyCodes_1.KeyCode.Enter, secondary: [keyCodes_1.KeyCode.Tab] }, false, CONTEXT_QUICK_FIX_WIDGET_VISIBLE, function (ctx, editor, args) {
        var controller = QuickFixController.getQuickFixController(editor);
        controller.acceptSelectedSuggestion();
    });
    editorCommonExtensions_1.CommonEditorRegistry.registerEditorCommand('closeQuickFixWidget', weight, { primary: keyCodes_1.KeyCode.Escape }, false, CONTEXT_QUICK_FIX_WIDGET_VISIBLE, function (ctx, editor, args) {
        var controller = QuickFixController.getQuickFixController(editor);
        controller.closeWidget();
    });
    editorCommonExtensions_1.CommonEditorRegistry.registerEditorCommand('selectNextQuickFix', weight, { primary: keyCodes_1.KeyCode.DownArrow }, false, CONTEXT_QUICK_FIX_WIDGET_VISIBLE, function (ctx, editor, args) {
        var controller = QuickFixController.getQuickFixController(editor);
        controller.selectNextSuggestion();
    });
    editorCommonExtensions_1.CommonEditorRegistry.registerEditorCommand('selectNextPageQuickFix', weight, { primary: keyCodes_1.KeyCode.PageDown }, false, CONTEXT_QUICK_FIX_WIDGET_VISIBLE, function (ctx, editor, args) {
        var controller = QuickFixController.getQuickFixController(editor);
        controller.selectNextPageSuggestion();
    });
    editorCommonExtensions_1.CommonEditorRegistry.registerEditorCommand('selectPrevQuickFix', weight, { primary: keyCodes_1.KeyCode.UpArrow }, false, CONTEXT_QUICK_FIX_WIDGET_VISIBLE, function (ctx, editor, args) {
        var controller = QuickFixController.getQuickFixController(editor);
        controller.selectPrevSuggestion();
    });
    editorCommonExtensions_1.CommonEditorRegistry.registerEditorCommand('selectPrevPageQuickFix', weight, { primary: keyCodes_1.KeyCode.PageUp }, false, CONTEXT_QUICK_FIX_WIDGET_VISIBLE, function (ctx, editor, args) {
        var controller = QuickFixController.getQuickFixController(editor);
        controller.selectPrevPageSuggestion();
    });
    editorBrowserExtensions_1.EditorBrowserRegistry.registerEditorContribution(QuickFixController);
});
//# sourceMappingURL=quickFix.js.map