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
define(["require", "exports", 'vs/base/common/winjs.base', 'vs/nls', 'vs/base/common/types', 'vs/base/common/actions', 'vs/platform/actions/common/actions', 'vs/workbench/common/actionRegistry', 'vs/platform/platform', 'vs/workbench/common/editor', 'vs/workbench/browser/actionBarRegistry', 'vs/base/parts/quickopen/browser/quickOpenModel', 'vs/workbench/browser/quickopen', 'vs/workbench/services/editor/common/editorService', 'vs/workbench/services/quickopen/common/quickOpenService', 'vs/workbench/services/part/common/partService', 'vs/platform/editor/common/editor', 'vs/platform/instantiation/common/instantiation', 'vs/base/common/keyCodes'], function (require, exports, winjs_base_1, nls, types, actions_1, actions_2, actionRegistry_1, platform_1, editor_1, actionBarRegistry_1, quickOpenModel_1, quickopen_1, editorService_1, quickOpenService_1, partService_1, editor_2, instantiation_1, keyCodes_1) {
    var SPLIT_EDITOR_ACTION_ID = 'workbench.action.splitEditor';
    var SPLIT_EDITOR_ACTION_LABEL = nls.localize('splitEditor', "Split Editor");
    var SplitEditorAction = (function (_super) {
        __extends(SplitEditorAction, _super);
        function SplitEditorAction(id, label, editorService) {
            _super.call(this, id, label);
            this.editorService = editorService;
        }
        SplitEditorAction.prototype.run = function () {
            var _this = this;
            // Can only split with active editor
            var activeEditor = this.editorService.getActiveEditor();
            if (!activeEditor) {
                return winjs_base_1.Promise.as(true);
            }
            // Return if the editor to split does not support split editing
            if (!activeEditor.supportsSplitEditor()) {
                return winjs_base_1.Promise.as(true);
            }
            // Count editors
            var visibleEditors = this.editorService.getVisibleEditors();
            var editorCount = visibleEditors.length;
            var targetPosition;
            switch (editorCount) {
                // Open split editor to the right of left one
                case 1:
                    targetPosition = editor_2.Position.CENTER;
                    break;
                // Special case two editors opened
                case 2:
                    // Continue splitting to the right
                    if (activeEditor.position === editor_2.Position.CENTER) {
                        targetPosition = editor_2.Position.RIGHT;
                    }
                    else if (activeEditor.position === editor_2.Position.LEFT && !!editor_1.getUntitledOrFileResource(activeEditor.input)) {
                        var centerInput = visibleEditors[editor_2.Position.CENTER].input;
                        var options = new editor_1.TextEditorOptions();
                        options.preserveFocus = true;
                        return this.editorService.openEditor(activeEditor.input, options, editor_2.Position.CENTER).then(function () {
                            return _this.editorService.openEditor(centerInput, options, editor_2.Position.RIGHT).then(function () {
                                return _this.editorService.focusEditor(editor_2.Position.CENTER);
                            });
                        });
                    }
            }
            // Only split if the input is resource editor input
            if (!types.isUndefinedOrNull(targetPosition) && !!editor_1.getUntitledOrFileResource(activeEditor.input)) {
                return this.editorService.openEditor(activeEditor.input, null, targetPosition);
            }
            return winjs_base_1.Promise.as(true);
        };
        SplitEditorAction = __decorate([
            __param(2, editorService_1.IWorkbenchEditorService)
        ], SplitEditorAction);
        return SplitEditorAction;
    })(actions_1.Action);
    exports.SplitEditorAction = SplitEditorAction;
    var CYCLE_EDITOR_ACTION_ID = 'workbench.action.cycleEditor';
    var CYCLE_EDITOR_ACTION_LABEL = nls.localize('cycleEditor', "Cycle Between Opened Editors");
    var CycleEditorAction = (function (_super) {
        __extends(CycleEditorAction, _super);
        function CycleEditorAction(id, label, editorService) {
            _super.call(this, id, label);
            this.editorService = editorService;
        }
        CycleEditorAction.prototype.run = function () {
            // Can cycle split with active editor
            var activeEditor = this.editorService.getActiveEditor();
            if (!activeEditor) {
                return winjs_base_1.Promise.as(false);
            }
            // Cycle to the left and use module to start at 0 again
            var visibleEditors = this.editorService.getVisibleEditors();
            var editorCount = visibleEditors.length;
            var newIndex = (activeEditor.position + 1) % editorCount;
            return this.editorService.focusEditor(newIndex);
        };
        CycleEditorAction = __decorate([
            __param(2, editorService_1.IWorkbenchEditorService)
        ], CycleEditorAction);
        return CycleEditorAction;
    })(actions_1.Action);
    exports.CycleEditorAction = CycleEditorAction;
    var FOCUS_FIRST_EDITOR_ACTION_ID = 'workbench.action.focusFirstEditor';
    var FOCUS_FIRST_EDITOR_ACTION_LABEL = nls.localize('focusFirstEditor', "Focus into Left Hand Editor");
    var FocusFirstEditorAction = (function (_super) {
        __extends(FocusFirstEditorAction, _super);
        function FocusFirstEditorAction(id, label, editorService, quickOpenService) {
            _super.call(this, id, label);
            this.editorService = editorService;
            this.quickOpenService = quickOpenService;
        }
        FocusFirstEditorAction.prototype.run = function () {
            var _this = this;
            // Find left editor and focus it
            var editors = this.editorService.getVisibleEditors();
            for (var _i = 0; _i < editors.length; _i++) {
                var editor = editors[_i];
                if (editor.position === editor_2.Position.LEFT) {
                    return this.editorService.focusEditor(editor);
                }
            }
            // Since no editor is currently opened, try to open last history entry to the target side
            var history = this.quickOpenService.getEditorHistory();
            for (var _a = 0; _a < history.length; _a++) {
                var input = history[_a];
                // For now only support to open resources from history to the side
                if (!!editor_1.getUntitledOrFileResource(input)) {
                    return this.editorService.openEditor(input, null, editor_2.Position.LEFT).then(function () {
                        // Automatically clean up stale history entries when the input can not be opened
                        if (!input.matches(_this.editorService.getActiveEditorInput())) {
                            _this.quickOpenService.removeEditorHistoryEntry(input);
                        }
                    });
                }
            }
            return winjs_base_1.Promise.as(true);
        };
        FocusFirstEditorAction = __decorate([
            __param(2, editorService_1.IWorkbenchEditorService),
            __param(3, quickOpenService_1.IQuickOpenService)
        ], FocusFirstEditorAction);
        return FocusFirstEditorAction;
    })(actions_1.Action);
    exports.FocusFirstEditorAction = FocusFirstEditorAction;
    var BaseFocusSideEditorAction = (function (_super) {
        __extends(BaseFocusSideEditorAction, _super);
        function BaseFocusSideEditorAction(id, label, editorService, quickOpenService) {
            _super.call(this, id, label);
            this.editorService = editorService;
            this.quickOpenService = quickOpenService;
        }
        BaseFocusSideEditorAction.prototype.run = function () {
            var _this = this;
            // Require at least the reference editor to be visible
            var editors = this.editorService.getVisibleEditors();
            var referenceEditor;
            for (var i = 0; i < editors.length; i++) {
                var editor = editors[i];
                // Target editor exists so focus it
                if (editor.position === this.getTargetEditorSide()) {
                    return this.editorService.focusEditor(editor);
                }
                // Remember reference editor
                if (editor.position === this.getReferenceEditorSide()) {
                    referenceEditor = editor;
                }
            }
            // Require the reference editor to be visible and supporting split editor
            if (referenceEditor && referenceEditor.supportsSplitEditor()) {
                return this.editorService.openEditor(referenceEditor.input, null, this.getTargetEditorSide());
            }
            else if (referenceEditor) {
                var history_1 = this.quickOpenService.getEditorHistory();
                for (var _i = 0; _i < history_1.length; _i++) {
                    var input = history_1[_i];
                    // For now only support to open files from history to the side
                    if (!!editor_1.getUntitledOrFileResource(input)) {
                        return this.editorService.openEditor(input, null, this.getTargetEditorSide()).then(function () {
                            // Automatically clean up stale history entries when the input can not be opened
                            if (!input.matches(_this.editorService.getActiveEditorInput())) {
                                _this.quickOpenService.removeEditorHistoryEntry(input);
                            }
                        });
                    }
                }
            }
            return winjs_base_1.Promise.as(true);
        };
        BaseFocusSideEditorAction = __decorate([
            __param(2, editorService_1.IWorkbenchEditorService),
            __param(3, quickOpenService_1.IQuickOpenService)
        ], BaseFocusSideEditorAction);
        return BaseFocusSideEditorAction;
    })(actions_1.Action);
    exports.BaseFocusSideEditorAction = BaseFocusSideEditorAction;
    var FOCUS_SECOND_EDITOR_ACTION_ID = 'workbench.action.focusSecondEditor';
    var FOCUS_SECOND_EDITOR_ACTION_LABEL = nls.localize('focusSecondEditor', "Focus into Side Editor");
    var FocusSecondEditorAction = (function (_super) {
        __extends(FocusSecondEditorAction, _super);
        function FocusSecondEditorAction(id, label, editorService, quickOpenService) {
            _super.call(this, id, label, editorService, quickOpenService);
        }
        FocusSecondEditorAction.prototype.getReferenceEditorSide = function () {
            return editor_2.Position.LEFT;
        };
        FocusSecondEditorAction.prototype.getTargetEditorSide = function () {
            return editor_2.Position.CENTER;
        };
        FocusSecondEditorAction = __decorate([
            __param(2, editorService_1.IWorkbenchEditorService),
            __param(3, quickOpenService_1.IQuickOpenService)
        ], FocusSecondEditorAction);
        return FocusSecondEditorAction;
    })(BaseFocusSideEditorAction);
    exports.FocusSecondEditorAction = FocusSecondEditorAction;
    var FOCUS_THIRD_EDITOR_ACTION_ID = 'workbench.action.focusThirdEditor';
    var FOCUS_THIRD_EDITOR_ACTION_LABEL = nls.localize('focusThirdEditor', "Focus into Right Hand Editor");
    var FocusThirdEditorAction = (function (_super) {
        __extends(FocusThirdEditorAction, _super);
        function FocusThirdEditorAction(id, label, editorService, quickOpenService) {
            _super.call(this, id, label, editorService, quickOpenService);
        }
        FocusThirdEditorAction.prototype.getReferenceEditorSide = function () {
            return editor_2.Position.CENTER;
        };
        FocusThirdEditorAction.prototype.getTargetEditorSide = function () {
            return editor_2.Position.RIGHT;
        };
        FocusThirdEditorAction = __decorate([
            __param(2, editorService_1.IWorkbenchEditorService),
            __param(3, quickOpenService_1.IQuickOpenService)
        ], FocusThirdEditorAction);
        return FocusThirdEditorAction;
    })(BaseFocusSideEditorAction);
    exports.FocusThirdEditorAction = FocusThirdEditorAction;
    var NAVIGATE_LEFT_EDITOR_ACTION_ID = 'workbench.action.focusLeftEditor';
    var NAVIGATE_LEFT_EDITOR_ACTION_LABEL = nls.localize('focusLeftEditor', "Focus into Next Editor on the Left");
    var NavigateToLeftEditorAction = (function (_super) {
        __extends(NavigateToLeftEditorAction, _super);
        function NavigateToLeftEditorAction(id, label, editorService) {
            _super.call(this, id, label);
            this.editorService = editorService;
        }
        NavigateToLeftEditorAction.prototype.run = function () {
            // Require an active editor
            var activeEditor = this.editorService.getActiveEditor();
            if (!activeEditor) {
                return winjs_base_1.Promise.as(true);
            }
            // Find the next position to the left
            var nextPosition = editor_2.Position.LEFT;
            if (activeEditor.position === editor_2.Position.RIGHT) {
                nextPosition = editor_2.Position.CENTER;
            }
            // Focus next position if provided
            var visibleEditors = this.editorService.getVisibleEditors();
            return this.editorService.focusEditor(visibleEditors[nextPosition]);
        };
        NavigateToLeftEditorAction = __decorate([
            __param(2, editorService_1.IWorkbenchEditorService)
        ], NavigateToLeftEditorAction);
        return NavigateToLeftEditorAction;
    })(actions_1.Action);
    exports.NavigateToLeftEditorAction = NavigateToLeftEditorAction;
    var NAVIGATE_RIGHT_EDITOR_ACTION_ID = 'workbench.action.focusRightEditor';
    var NAVIGATE_RIGHT_EDITOR_ACTION_LABEL = nls.localize('focusRigthEditor', "Focus into Next Editor on the Right");
    var NavigateToRightEditorAction = (function (_super) {
        __extends(NavigateToRightEditorAction, _super);
        function NavigateToRightEditorAction(id, label, editorService, instantiationService) {
            _super.call(this, id, label);
            this.editorService = editorService;
            this.navigateActions = [];
            this.navigateActions[editor_2.Position.LEFT] = instantiationService.createInstance(FocusFirstEditorAction, FOCUS_FIRST_EDITOR_ACTION_ID, FOCUS_FIRST_EDITOR_ACTION_LABEL);
            this.navigateActions[editor_2.Position.CENTER] = instantiationService.createInstance(FocusSecondEditorAction, FOCUS_SECOND_EDITOR_ACTION_ID, FOCUS_SECOND_EDITOR_ACTION_LABEL);
            this.navigateActions[editor_2.Position.RIGHT] = instantiationService.createInstance(FocusThirdEditorAction, FOCUS_THIRD_EDITOR_ACTION_ID, FOCUS_THIRD_EDITOR_ACTION_LABEL);
        }
        NavigateToRightEditorAction.prototype.run = function (event) {
            // Find the next position to the right to use
            var nextPosition;
            var activeEditor = this.editorService.getActiveEditor();
            if (!activeEditor) {
                nextPosition = editor_2.Position.LEFT;
            }
            else if (activeEditor.position === editor_2.Position.LEFT) {
                nextPosition = editor_2.Position.CENTER;
            }
            else if (activeEditor.position === editor_2.Position.CENTER) {
                nextPosition = editor_2.Position.RIGHT;
            }
            // Run the action for the target next position
            if (!types.isUndefinedOrNull(nextPosition) && this.navigateActions[nextPosition]) {
                return this.navigateActions[nextPosition].run(event);
            }
            return winjs_base_1.Promise.as(true);
        };
        NavigateToRightEditorAction = __decorate([
            __param(2, editorService_1.IWorkbenchEditorService),
            __param(3, instantiation_1.IInstantiationService)
        ], NavigateToRightEditorAction);
        return NavigateToRightEditorAction;
    })(actions_1.Action);
    exports.NavigateToRightEditorAction = NavigateToRightEditorAction;
    var OpenToSideAction = (function (_super) {
        __extends(OpenToSideAction, _super);
        function OpenToSideAction(editorService) {
            _super.call(this, OpenToSideAction.OPEN_TO_SIDE_ID, OpenToSideAction.OPEN_TO_SIDE_LABEL);
            this.editorService = editorService;
            this.class = 'quick-open-sidebyside';
            this.updateEnablement();
        }
        OpenToSideAction.prototype.updateEnablement = function () {
            var activeEditor = this.editorService.getActiveEditor();
            this.enabled = (!activeEditor || activeEditor.position !== editor_2.Position.RIGHT);
        };
        OpenToSideAction.prototype.run = function (context) {
            var entry = toEditorQuickOpenEntry(context);
            if (entry) {
                return this.editorService.openEditor(entry.getInput(), entry.getOptions(), true);
            }
            return winjs_base_1.Promise.as(false);
        };
        OpenToSideAction.OPEN_TO_SIDE_ID = 'workbench.action.openToSide';
        OpenToSideAction.OPEN_TO_SIDE_LABEL = nls.localize('openToSide', "Open to the Side");
        OpenToSideAction = __decorate([
            __param(0, editorService_1.IWorkbenchEditorService)
        ], OpenToSideAction);
        return OpenToSideAction;
    })(actions_1.Action);
    exports.OpenToSideAction = OpenToSideAction;
    var QuickOpenActionContributor = (function (_super) {
        __extends(QuickOpenActionContributor, _super);
        function QuickOpenActionContributor(instantiationService) {
            _super.call(this);
            this.instantiationService = instantiationService;
        }
        QuickOpenActionContributor.prototype.hasActions = function (context) {
            var entry = this.getEntry(context);
            return !!entry;
        };
        QuickOpenActionContributor.prototype.getActions = function (context) {
            var actions = [];
            var entry = this.getEntry(context);
            if (entry) {
                if (!this.openToSideActionInstance) {
                    this.openToSideActionInstance = this.instantiationService.createInstance(OpenToSideAction);
                }
                actions.push(this.openToSideActionInstance);
            }
            return actions;
        };
        QuickOpenActionContributor.prototype.getEntry = function (context) {
            if (!context || !context.element) {
                return null;
            }
            return toEditorQuickOpenEntry(context.element);
        };
        QuickOpenActionContributor = __decorate([
            __param(0, instantiation_1.IInstantiationService)
        ], QuickOpenActionContributor);
        return QuickOpenActionContributor;
    })(actionBarRegistry_1.ActionBarContributor);
    function toEditorQuickOpenEntry(element) {
        // QuickOpenEntryGroup
        if (element instanceof quickOpenModel_1.QuickOpenEntryGroup) {
            var group = element;
            if (group.getEntry()) {
                element = group.getEntry();
            }
        }
        // EditorQuickOpenEntry or EditorQuickOpenEntryGroup both implement IEditorQuickOpenEntry
        if (element instanceof quickopen_1.EditorQuickOpenEntry || element instanceof quickopen_1.EditorQuickOpenEntryGroup) {
            return element;
        }
        return null;
    }
    var CLOSE_EDITOR_ACTION_ID = 'workbench.action.closeActiveEditor';
    var CLOSE_EDITOR_ACTION_LABEL = nls.localize('closeActiveEditor', "Close Editor");
    var CloseEditorAction = (function (_super) {
        __extends(CloseEditorAction, _super);
        function CloseEditorAction(id, label, editorService) {
            _super.call(this, id, label);
            this.editorService = editorService;
        }
        CloseEditorAction.prototype.run = function () {
            var activeEditor = this.editorService.getActiveEditor();
            if (activeEditor) {
                return this.editorService.closeEditor(activeEditor);
            }
            return winjs_base_1.Promise.as(false);
        };
        CloseEditorAction = __decorate([
            __param(2, editorService_1.IWorkbenchEditorService)
        ], CloseEditorAction);
        return CloseEditorAction;
    })(actions_1.Action);
    exports.CloseEditorAction = CloseEditorAction;
    var CLOSE_ALL_EDITORS_ACTION_ID = 'workbench.action.closeAllEditors';
    var CLOSE_ALL_EDITORS_ACTION_LABEL = nls.localize('closeAllEditors', "Close All Editors");
    var CloseAllEditorsAction = (function (_super) {
        __extends(CloseAllEditorsAction, _super);
        function CloseAllEditorsAction(id, label, editorService) {
            _super.call(this, id, label);
            this.editorService = editorService;
        }
        CloseAllEditorsAction.prototype.run = function () {
            return this.editorService.closeEditors();
        };
        CloseAllEditorsAction = __decorate([
            __param(2, editorService_1.IWorkbenchEditorService)
        ], CloseAllEditorsAction);
        return CloseAllEditorsAction;
    })(actions_1.Action);
    exports.CloseAllEditorsAction = CloseAllEditorsAction;
    var CLOSE_OTHER_EDITORS_ACTION_ID = 'workbench.action.closeOtherEditors';
    var CLOSE_OTHER_EDITORS_ACTION_LABEL = nls.localize('closeOtherEditors', "Close Other Editors");
    var CloseOtherEditorsAction = (function (_super) {
        __extends(CloseOtherEditorsAction, _super);
        function CloseOtherEditorsAction(id, label, editorService) {
            _super.call(this, id, label);
            this.editorService = editorService;
        }
        CloseOtherEditorsAction.prototype.run = function () {
            return this.editorService.closeEditors(true);
        };
        CloseOtherEditorsAction = __decorate([
            __param(2, editorService_1.IWorkbenchEditorService)
        ], CloseOtherEditorsAction);
        return CloseOtherEditorsAction;
    })(actions_1.Action);
    exports.CloseOtherEditorsAction = CloseOtherEditorsAction;
    var MOVE_EDITOR_LEFT_ACTION_ID = 'workbench.action.moveActiveEditorLeft';
    var MOVE_EDITOR_LEFT_ACTION_LABEL = nls.localize('moveActiveEditorLeft', "Move Active Editor Left");
    var MoveEditorLeftAction = (function (_super) {
        __extends(MoveEditorLeftAction, _super);
        function MoveEditorLeftAction(id, label, editorService) {
            _super.call(this, id, label);
            this.editorService = editorService;
        }
        MoveEditorLeftAction.prototype.run = function () {
            var activeEditor = this.editorService.getActiveEditor();
            if (activeEditor && (activeEditor.position === editor_2.Position.CENTER || activeEditor.position === editor_2.Position.RIGHT)) {
                var newPosition = (activeEditor.position === editor_2.Position.CENTER) ? editor_2.Position.LEFT : editor_2.Position.CENTER;
                // Move editor
                this.editorService.moveEditor(activeEditor.position, newPosition);
            }
            return winjs_base_1.Promise.as(false);
        };
        MoveEditorLeftAction = __decorate([
            __param(2, editorService_1.IWorkbenchEditorService)
        ], MoveEditorLeftAction);
        return MoveEditorLeftAction;
    })(actions_1.Action);
    exports.MoveEditorLeftAction = MoveEditorLeftAction;
    var MOVE_EDITOR_RIGHT_ACTION_ID = 'workbench.action.moveActiveEditorRight';
    var MOVE_EDITOR_RIGHT_ACTION_LABEL = nls.localize('moveActiveEditorRight', "Move Active Editor Right");
    var MoveEditorRightAction = (function (_super) {
        __extends(MoveEditorRightAction, _super);
        function MoveEditorRightAction(id, label, editorService) {
            _super.call(this, id, label);
            this.editorService = editorService;
        }
        MoveEditorRightAction.prototype.run = function () {
            var editors = this.editorService.getVisibleEditors();
            var activeEditor = this.editorService.getActiveEditor();
            if ((editors.length === 2 && activeEditor.position === editor_2.Position.LEFT) || (editors.length === 3 && activeEditor.position !== editor_2.Position.RIGHT)) {
                var newPosition = (activeEditor.position === editor_2.Position.LEFT) ? editor_2.Position.CENTER : editor_2.Position.RIGHT;
                // Move editor
                this.editorService.moveEditor(activeEditor.position, newPosition);
            }
            return winjs_base_1.Promise.as(false);
        };
        MoveEditorRightAction = __decorate([
            __param(2, editorService_1.IWorkbenchEditorService)
        ], MoveEditorRightAction);
        return MoveEditorRightAction;
    })(actions_1.Action);
    exports.MoveEditorRightAction = MoveEditorRightAction;
    var MINIMIZE_EDITORS_ACTION_ID = 'workbench.action.minimizeOtherEditors';
    var MINIMIZE_EDITORS_ACTION_LABEL = nls.localize('minimizeOtherEditors', "Minimize Other Editors");
    var MinimizeOtherEditorsAction = (function (_super) {
        __extends(MinimizeOtherEditorsAction, _super);
        function MinimizeOtherEditorsAction(id, label, editorService) {
            _super.call(this, id, label);
            this.editorService = editorService;
        }
        MinimizeOtherEditorsAction.prototype.run = function () {
            this.editorService.arrangeEditors(editorService_1.EditorArrangement.MINIMIZE_OTHERS);
            return winjs_base_1.Promise.as(false);
        };
        MinimizeOtherEditorsAction = __decorate([
            __param(2, editorService_1.IWorkbenchEditorService)
        ], MinimizeOtherEditorsAction);
        return MinimizeOtherEditorsAction;
    })(actions_1.Action);
    exports.MinimizeOtherEditorsAction = MinimizeOtherEditorsAction;
    var EVEN_EDITOR_WIDTHS_ACTION_ID = 'workbench.action.evenEditorWidths';
    var EVEN_EDITOR_WIDTHS_ACTION_LABEL = nls.localize('evenEditorWidths', "Even Editor Widths");
    var EvenEditorWidthsAction = (function (_super) {
        __extends(EvenEditorWidthsAction, _super);
        function EvenEditorWidthsAction(id, label, editorService) {
            _super.call(this, id, label);
            this.editorService = editorService;
        }
        EvenEditorWidthsAction.prototype.run = function () {
            this.editorService.arrangeEditors(editorService_1.EditorArrangement.EVEN_WIDTH);
            return winjs_base_1.Promise.as(false);
        };
        EvenEditorWidthsAction = __decorate([
            __param(2, editorService_1.IWorkbenchEditorService)
        ], EvenEditorWidthsAction);
        return EvenEditorWidthsAction;
    })(actions_1.Action);
    exports.EvenEditorWidthsAction = EvenEditorWidthsAction;
    var MAXIMIZE_EDITOR_ACTION_ID = 'workbench.action.maximizeEditor';
    var MAXIMIZE_EDITOR_ACTION_LABEL = nls.localize('maximizeEditor', "Maximize Active Editor and Hide Sidebar");
    var MaximizeEditorAction = (function (_super) {
        __extends(MaximizeEditorAction, _super);
        function MaximizeEditorAction(id, label, editorService, partService) {
            _super.call(this, id, label);
            this.editorService = editorService;
            this.partService = partService;
        }
        MaximizeEditorAction.prototype.run = function () {
            if (this.editorService.getActiveEditor()) {
                this.editorService.arrangeEditors(editorService_1.EditorArrangement.MINIMIZE_OTHERS);
                this.partService.setSideBarHidden(true);
            }
            return winjs_base_1.Promise.as(false);
        };
        MaximizeEditorAction = __decorate([
            __param(2, editorService_1.IWorkbenchEditorService),
            __param(3, partService_1.IPartService)
        ], MaximizeEditorAction);
        return MaximizeEditorAction;
    })(actions_1.Action);
    exports.MaximizeEditorAction = MaximizeEditorAction;
    // Contribute to Quick Open
    var actionBarRegistry = platform_1.Registry.as(actionBarRegistry_1.Extensions.Actionbar);
    actionBarRegistry.registerActionBarContributor(actionBarRegistry_1.Scope.VIEWER, QuickOpenActionContributor);
    // Contribute to Workbench Actions
    var category = nls.localize('view', "View");
    var registry = platform_1.Registry.as(actionRegistry_1.Extensions.WorkbenchActions);
    registry.registerWorkbenchAction(new actions_2.SyncActionDescriptor(CloseAllEditorsAction, CLOSE_ALL_EDITORS_ACTION_ID, CLOSE_ALL_EDITORS_ACTION_LABEL), category);
    registry.registerWorkbenchAction(new actions_2.SyncActionDescriptor(CloseOtherEditorsAction, CLOSE_OTHER_EDITORS_ACTION_ID, CLOSE_OTHER_EDITORS_ACTION_LABEL), category);
    registry.registerWorkbenchAction(new actions_2.SyncActionDescriptor(SplitEditorAction, SPLIT_EDITOR_ACTION_ID, SPLIT_EDITOR_ACTION_LABEL, { primary: keyCodes_1.KeyMod.CtrlCmd | keyCodes_1.KeyCode.US_BACKSLASH }), category);
    registry.registerWorkbenchAction(new actions_2.SyncActionDescriptor(CycleEditorAction, CYCLE_EDITOR_ACTION_ID, CYCLE_EDITOR_ACTION_LABEL, {
        primary: keyCodes_1.KeyMod.CtrlCmd | keyCodes_1.KeyCode.US_BACKTICK,
        // on mac this keybinding is reserved to cycle between windows
        mac: { primary: null }
    }), category);
    registry.registerWorkbenchAction(new actions_2.SyncActionDescriptor(FocusFirstEditorAction, FOCUS_FIRST_EDITOR_ACTION_ID, FOCUS_FIRST_EDITOR_ACTION_LABEL, { primary: keyCodes_1.KeyMod.CtrlCmd | keyCodes_1.KeyCode.KEY_1 }), category);
    registry.registerWorkbenchAction(new actions_2.SyncActionDescriptor(FocusSecondEditorAction, FOCUS_SECOND_EDITOR_ACTION_ID, FOCUS_SECOND_EDITOR_ACTION_LABEL, { primary: keyCodes_1.KeyMod.CtrlCmd | keyCodes_1.KeyCode.KEY_2 }), category);
    registry.registerWorkbenchAction(new actions_2.SyncActionDescriptor(FocusThirdEditorAction, FOCUS_THIRD_EDITOR_ACTION_ID, FOCUS_THIRD_EDITOR_ACTION_LABEL, { primary: keyCodes_1.KeyMod.CtrlCmd | keyCodes_1.KeyCode.KEY_3 }), category);
    registry.registerWorkbenchAction(new actions_2.SyncActionDescriptor(EvenEditorWidthsAction, EVEN_EDITOR_WIDTHS_ACTION_ID, EVEN_EDITOR_WIDTHS_ACTION_LABEL), category);
    registry.registerWorkbenchAction(new actions_2.SyncActionDescriptor(MaximizeEditorAction, MAXIMIZE_EDITOR_ACTION_ID, MAXIMIZE_EDITOR_ACTION_LABEL), category);
    registry.registerWorkbenchAction(new actions_2.SyncActionDescriptor(MinimizeOtherEditorsAction, MINIMIZE_EDITORS_ACTION_ID, MINIMIZE_EDITORS_ACTION_LABEL), category);
    registry.registerWorkbenchAction(new actions_2.SyncActionDescriptor(MoveEditorLeftAction, MOVE_EDITOR_LEFT_ACTION_ID, MOVE_EDITOR_LEFT_ACTION_LABEL, { primary: keyCodes_1.KeyMod.chord(keyCodes_1.KeyMod.CtrlCmd | keyCodes_1.KeyCode.KEY_K, keyCodes_1.KeyCode.LeftArrow) }), category);
    registry.registerWorkbenchAction(new actions_2.SyncActionDescriptor(MoveEditorRightAction, MOVE_EDITOR_RIGHT_ACTION_ID, MOVE_EDITOR_RIGHT_ACTION_LABEL, { primary: keyCodes_1.KeyMod.chord(keyCodes_1.KeyMod.CtrlCmd | keyCodes_1.KeyCode.KEY_K, keyCodes_1.KeyCode.RightArrow) }), category);
    registry.registerWorkbenchAction(new actions_2.SyncActionDescriptor(NavigateToLeftEditorAction, NAVIGATE_LEFT_EDITOR_ACTION_ID, NAVIGATE_LEFT_EDITOR_ACTION_LABEL, {
        primary: keyCodes_1.KeyMod.CtrlCmd | keyCodes_1.KeyMod.Alt | keyCodes_1.KeyCode.LeftArrow,
        linux: { primary: keyCodes_1.KeyMod.CtrlCmd | keyCodes_1.KeyMod.Shift | keyCodes_1.KeyMod.Alt | keyCodes_1.KeyCode.LeftArrow }
    }), category);
    registry.registerWorkbenchAction(new actions_2.SyncActionDescriptor(NavigateToRightEditorAction, NAVIGATE_RIGHT_EDITOR_ACTION_ID, NAVIGATE_RIGHT_EDITOR_ACTION_LABEL, {
        primary: keyCodes_1.KeyMod.CtrlCmd | keyCodes_1.KeyMod.Alt | keyCodes_1.KeyCode.RightArrow,
        linux: { primary: keyCodes_1.KeyMod.CtrlCmd | keyCodes_1.KeyMod.Shift | keyCodes_1.KeyMod.Alt | keyCodes_1.KeyCode.RightArrow },
    }), category);
});
//# sourceMappingURL=triggerEditorActions.js.map