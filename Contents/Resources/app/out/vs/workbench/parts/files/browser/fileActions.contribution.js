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
define(["require", "exports", 'vs/nls', 'vs/platform/platform', 'vs/base/browser/ui/actionbar/actionbar', 'vs/workbench/browser/actionBarRegistry', 'vs/workbench/browser/parts/editor/baseEditor', 'vs/workbench/parts/files/browser/fileActions', 'vs/workbench/parts/files/browser/saveErrorHandler', 'vs/platform/actions/common/actions', 'vs/workbench/common/actionRegistry', 'vs/platform/instantiation/common/instantiation', 'vs/platform/workspace/common/workspace', 'vs/platform/keybinding/common/keybindingService', 'vs/workbench/parts/files/common/explorerViewModel', 'vs/base/common/keyCodes'], function (require, exports, nls, platform_1, actionbar_1, actionBarRegistry_1, baseEditor_1, fileActions_1, saveErrorHandler_1, actions_1, actionRegistry_1, instantiation_1, workspace_1, keybindingService_1, explorerViewModel_1, keyCodes_1) {
    var FilesViewerActionContributor = (function (_super) {
        __extends(FilesViewerActionContributor, _super);
        function FilesViewerActionContributor(instantiationService, contextService, keybindingService) {
            _super.call(this);
            this.instantiationService = instantiationService;
            this.contextService = contextService;
            this.keybindingService = keybindingService;
        }
        FilesViewerActionContributor.prototype.hasSecondaryActions = function (context) {
            var element = context.element;
            // Contribute only on Stat Objects (File Explorer)
            return element instanceof explorerViewModel_1.FileStat;
        };
        FilesViewerActionContributor.prototype.getSecondaryActions = function (context) {
            var stat = context.element;
            var tree = context.viewer;
            var actions = [];
            var separateOpen = false;
            // Open side by side
            if (!stat.isDirectory) {
                actions.push(this.instantiationService.createInstance(fileActions_1.OpenToSideAction, tree, stat.resource, false));
                separateOpen = true;
            }
            if (separateOpen) {
                actions.push(new actionbar_1.Separator(null, 50));
            }
            // Directory Actions
            if (stat.isDirectory) {
                // New File
                actions.push(this.instantiationService.createInstance(fileActions_1.NewFileAction, tree, stat));
                // New Folder
                actions.push(this.instantiationService.createInstance(fileActions_1.NewFolderAction, tree, stat));
                actions.push(new actionbar_1.Separator(null, 50));
            }
            else if (!stat.isDirectory) {
                // Run Compare
                var runCompareAction = this.instantiationService.createInstance(fileActions_1.CompareResourcesAction, stat.resource, tree);
                if (runCompareAction._isEnabled()) {
                    actions.push(runCompareAction);
                }
                // Select for Compare
                actions.push(this.instantiationService.createInstance(fileActions_1.SelectResourceForCompareAction, stat.resource, tree));
                actions.push(new actionbar_1.Separator(null, 100));
            }
            var workspace = this.contextService.getWorkspace();
            var isRoot = workspace && stat.resource.toString() === workspace.resource.toString();
            // Copy File/Folder
            if (!isRoot) {
                actions.push(this.instantiationService.createInstance(fileActions_1.CopyFileAction, tree, stat));
            }
            // Paste File/Folder
            if (stat.isDirectory) {
                actions.push(this.instantiationService.createInstance(fileActions_1.PasteFileAction, tree, stat));
            }
            // Rename File/Folder
            if (!isRoot) {
                actions.push(new actionbar_1.Separator(null, 150));
                actions.push(this.instantiationService.createInstance(fileActions_1.TriggerRenameFileAction, tree, stat));
            }
            // Delete File/Folder
            if (!isRoot) {
                actions.push(this.instantiationService.createInstance(fileActions_1.MoveFileToTrashAction, tree, stat));
            }
            // Set Order
            var curOrder = 10;
            for (var i = 0; i < actions.length; i++) {
                var action = actions[i];
                if (!action.order) {
                    curOrder += 10;
                    action.order = curOrder;
                }
                else {
                    curOrder = action.order;
                }
            }
            return actions;
        };
        FilesViewerActionContributor.prototype.getActionItem = function (context, action) {
            if (context && context.element instanceof explorerViewModel_1.FileStat) {
                // Any other item with keybinding
                var keybinding = fileActions_1.keybindingForAction(action.id);
                if (keybinding) {
                    return new actionbar_1.ActionItem(context, action, { label: true, keybinding: this.keybindingService.getLabelFor(keybinding) });
                }
            }
            return null;
        };
        FilesViewerActionContributor = __decorate([
            __param(0, instantiation_1.IInstantiationService),
            __param(1, workspace_1.IWorkspaceContextService),
            __param(2, keybindingService_1.IKeybindingService)
        ], FilesViewerActionContributor);
        return FilesViewerActionContributor;
    })(actionBarRegistry_1.ActionBarContributor);
    var ConflictResolutionActionContributor = (function (_super) {
        __extends(ConflictResolutionActionContributor, _super);
        function ConflictResolutionActionContributor(instantiationService) {
            _super.call(this);
            this.instantiationService = instantiationService;
        }
        ConflictResolutionActionContributor.prototype.hasActionsForEditorInput = function (context) {
            return (context.input instanceof saveErrorHandler_1.ConflictResolutionDiffEditorInput);
        };
        ConflictResolutionActionContributor.prototype.getActionsForEditorInput = function (context) {
            return [
                this.instantiationService.createInstance(saveErrorHandler_1.AcceptLocalChangesAction),
                this.instantiationService.createInstance(saveErrorHandler_1.RevertLocalChangesAction)
            ];
        };
        ConflictResolutionActionContributor = __decorate([
            __param(0, instantiation_1.IInstantiationService)
        ], ConflictResolutionActionContributor);
        return ConflictResolutionActionContributor;
    })(baseEditor_1.EditorInputActionContributor);
    // Contribute to Viewers that show Files
    var actionBarRegistry = platform_1.Registry.as(actionBarRegistry_1.Extensions.Actionbar);
    actionBarRegistry.registerActionBarContributor(actionBarRegistry_1.Scope.VIEWER, FilesViewerActionContributor);
    // Contribute to Conflict Editor Inputs
    actionBarRegistry.registerActionBarContributor(actionBarRegistry_1.Scope.EDITOR, ConflictResolutionActionContributor);
    // Contribute Global Actions
    var category = nls.localize('filesCategory', "Files");
    var registry = platform_1.Registry.as(actionRegistry_1.Extensions.WorkbenchActions);
    registry.registerWorkbenchAction(new actions_1.SyncActionDescriptor(fileActions_1.SaveFileAction, fileActions_1.SaveFileAction.ID, fileActions_1.SaveFileAction.LABEL, { primary: keyCodes_1.KeyMod.CtrlCmd | keyCodes_1.KeyCode.KEY_S }), category);
    registry.registerWorkbenchAction(new actions_1.SyncActionDescriptor(fileActions_1.SaveAllAction, fileActions_1.SaveAllAction.ID, fileActions_1.SaveAllAction.LABEL), category);
    registry.registerWorkbenchAction(new actions_1.SyncActionDescriptor(fileActions_1.SaveFilesAction, fileActions_1.SaveFilesAction.ID, null /* only for programmatic trigger */));
    registry.registerWorkbenchAction(new actions_1.SyncActionDescriptor(fileActions_1.RevertFileAction, fileActions_1.RevertFileAction.ID, fileActions_1.RevertFileAction.LABEL), category);
    registry.registerWorkbenchAction(new actions_1.SyncActionDescriptor(fileActions_1.GlobalNewFolderAction, fileActions_1.GlobalNewFolderAction.ID, fileActions_1.GlobalNewFolderAction.LABEL), category);
    registry.registerWorkbenchAction(new actions_1.SyncActionDescriptor(fileActions_1.GlobalCompareResourcesAction, fileActions_1.GlobalCompareResourcesAction.ID, fileActions_1.GlobalCompareResourcesAction.LABEL), category);
    registry.registerWorkbenchAction(new actions_1.SyncActionDescriptor(fileActions_1.CloseFileAction, fileActions_1.CloseFileAction.ID, fileActions_1.CloseFileAction.LABEL, { primary: keyCodes_1.KeyMod.chord(keyCodes_1.KeyMod.CtrlCmd | keyCodes_1.KeyCode.KEY_K, keyCodes_1.KeyCode.KEY_W) }), category);
    registry.registerWorkbenchAction(new actions_1.SyncActionDescriptor(fileActions_1.CloseAllFilesAction, fileActions_1.CloseAllFilesAction.ID, fileActions_1.CloseAllFilesAction.LABEL, { primary: keyCodes_1.KeyMod.chord(keyCodes_1.KeyMod.CtrlCmd | keyCodes_1.KeyCode.KEY_K, keyCodes_1.KeyMod.CtrlCmd | keyCodes_1.KeyCode.KEY_W) }), category);
    registry.registerWorkbenchAction(new actions_1.SyncActionDescriptor(fileActions_1.OpenNextWorkingFile, fileActions_1.OpenNextWorkingFile.ID, fileActions_1.OpenNextWorkingFile.LABEL, { primary: keyCodes_1.KeyMod.chord(keyCodes_1.KeyMod.CtrlCmd | keyCodes_1.KeyCode.KEY_K, keyCodes_1.KeyCode.DownArrow) }), category);
    registry.registerWorkbenchAction(new actions_1.SyncActionDescriptor(fileActions_1.OpenPreviousWorkingFile, fileActions_1.OpenPreviousWorkingFile.ID, fileActions_1.OpenPreviousWorkingFile.LABEL, { primary: keyCodes_1.KeyMod.chord(keyCodes_1.KeyMod.CtrlCmd | keyCodes_1.KeyCode.KEY_K, keyCodes_1.KeyCode.UpArrow) }), category);
    registry.registerWorkbenchAction(new actions_1.SyncActionDescriptor(fileActions_1.AddToWorkingFiles, fileActions_1.AddToWorkingFiles.ID, fileActions_1.AddToWorkingFiles.LABEL, { primary: keyCodes_1.KeyMod.chord(keyCodes_1.KeyMod.CtrlCmd | keyCodes_1.KeyCode.KEY_K, keyCodes_1.KeyCode.Enter) }), category);
    registry.registerWorkbenchAction(new actions_1.SyncActionDescriptor(fileActions_1.FocusWorkingFiles, fileActions_1.FocusWorkingFiles.ID, fileActions_1.FocusWorkingFiles.LABEL, { primary: keyCodes_1.KeyMod.chord(keyCodes_1.KeyMod.CtrlCmd | keyCodes_1.KeyCode.KEY_K, keyCodes_1.KeyCode.KEY_E) }), category);
});
//# sourceMappingURL=fileActions.contribution.js.map