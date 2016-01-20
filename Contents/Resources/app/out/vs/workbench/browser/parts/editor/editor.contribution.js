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
define(["require", "exports", 'vs/platform/platform', 'vs/nls', 'vs/base/common/winjs.base', 'vs/platform/workspace/common/workspace', 'vs/workbench/browser/parts/statusbar/statusbar', 'vs/workbench/browser/parts/editor/baseEditor', 'vs/workbench/common/editor/stringEditorInput', 'vs/workbench/browser/parts/editor/stringEditor', 'vs/workbench/common/editor/diffEditorInput', 'vs/workbench/common/editor/untitledEditorInput', 'vs/workbench/common/editor/resourceEditorInput', 'vs/platform/instantiation/common/instantiation', 'vs/workbench/browser/parts/editor/textDiffEditor', 'vs/workbench/services/editor/common/editorService', 'vs/workbench/browser/parts/editor/binaryDiffEditor', 'vs/workbench/browser/parts/editor/iframeEditor', 'vs/workbench/common/editor/iframeEditorInput', 'vs/workbench/browser/parts/editor/editorStatus', 'vs/workbench/common/actionRegistry', 'vs/workbench/browser/actionBarRegistry', 'vs/platform/actions/common/actions', 'vs/platform/instantiation/common/descriptors', 'vs/base/common/keyCodes'], function (require, exports, platform_1, nls, winjs_base_1, workspace_1, statusbar_1, baseEditor_1, stringEditorInput_1, stringEditor_1, diffEditorInput_1, untitledEditorInput_1, resourceEditorInput_1, instantiation_1, textDiffEditor_1, editorService_1, binaryDiffEditor_1, iframeEditor_1, iframeEditorInput_1, editorStatus_1, actionRegistry_1, actionBarRegistry_1, actions_1, descriptors_1, keyCodes_1) {
    // Register String Editor
    platform_1.Registry.as(baseEditor_1.Extensions.Editors).registerEditor(new baseEditor_1.EditorDescriptor(stringEditor_1.StringEditor.ID, nls.localize('textEditor', "Text Editor"), 'vs/workbench/browser/parts/editor/stringEditor', 'StringEditor'), [
        new descriptors_1.SyncDescriptor(stringEditorInput_1.StringEditorInput),
        new descriptors_1.SyncDescriptor(untitledEditorInput_1.UntitledEditorInput),
        new descriptors_1.SyncDescriptor(resourceEditorInput_1.ResourceEditorInput)
    ]);
    // Register Text Diff Editor
    platform_1.Registry.as(baseEditor_1.Extensions.Editors).registerEditor(new baseEditor_1.EditorDescriptor(textDiffEditor_1.TextDiffEditor.ID, nls.localize('textDiffEditor', "Text Diff Editor"), 'vs/workbench/browser/parts/editor/textDiffEditor', 'TextDiffEditor'), [
        new descriptors_1.SyncDescriptor(diffEditorInput_1.DiffEditorInput)
    ]);
    // Register Binary Resource Diff Editor
    platform_1.Registry.as(baseEditor_1.Extensions.Editors).registerEditor(new baseEditor_1.EditorDescriptor(binaryDiffEditor_1.BinaryResourceDiffEditor.ID, nls.localize('binaryDiffEditor', "Binary Diff Editor"), 'vs/workbench/browser/parts/editor/binaryDiffEditor', 'BinaryResourceDiffEditor'), [
        new descriptors_1.SyncDescriptor(diffEditorInput_1.DiffEditorInput)
    ]);
    // Register IFrame Editor
    platform_1.Registry.as(baseEditor_1.Extensions.Editors).registerEditor(new baseEditor_1.EditorDescriptor(iframeEditor_1.IFrameEditor.ID, nls.localize('iframeEditor', "IFrame Editor"), 'vs/workbench/browser/parts/editor/iframeEditor', 'IFrameEditor'), [
        new descriptors_1.SyncDescriptor(iframeEditorInput_1.IFrameEditorInput)
    ]);
    // Register Editor Status
    var statusBar = platform_1.Registry.as(statusbar_1.Extensions.Statusbar);
    statusBar.registerStatusbarItem(new statusbar_1.StatusbarItemDescriptor(editorStatus_1.EditorStatus, statusbar_1.StatusbarAlignment.RIGHT, 100 /* High Priority */));
    // Register Actions
    var registry = platform_1.Registry.as(actionRegistry_1.Extensions.WorkbenchActions);
    registry.registerWorkbenchAction(new actions_1.SyncActionDescriptor(editorStatus_1.ChangeModeAction, editorStatus_1.ChangeModeAction.ID, editorStatus_1.ChangeModeAction.LABEL, { primary: keyCodes_1.KeyMod.chord(keyCodes_1.KeyMod.CtrlCmd | keyCodes_1.KeyCode.KEY_K, keyCodes_1.KeyCode.KEY_M) }));
    registry.registerWorkbenchAction(new actions_1.SyncActionDescriptor(editorStatus_1.ChangeEOLAction, editorStatus_1.ChangeEOLAction.ID, editorStatus_1.ChangeEOLAction.LABEL));
    registry.registerWorkbenchAction(new actions_1.SyncActionDescriptor(editorStatus_1.ChangeEncodingAction, editorStatus_1.ChangeEncodingAction.ID, editorStatus_1.ChangeEncodingAction.LABEL));
    var ViewSourceEditorInputAction = (function (_super) {
        __extends(ViewSourceEditorInputAction, _super);
        function ViewSourceEditorInputAction(editorService, contextService) {
            _super.call(this, 'workbench.files.action.viewSourceFromEditor', nls.localize('viewSource', "View Source"), 'iframe-editor-action view-source');
            this.editorService = editorService;
            this.contextService = contextService;
        }
        ViewSourceEditorInputAction.prototype.run = function (event) {
            var iFrameEditorInput = this.input;
            var sideBySide = !!(event && (event.ctrlKey || event.metaKey));
            return this.editorService.openEditor({
                resource: iFrameEditorInput.getResource()
            }, sideBySide);
        };
        ViewSourceEditorInputAction = __decorate([
            __param(0, editorService_1.IWorkbenchEditorService),
            __param(1, workspace_1.IWorkspaceContextService)
        ], ViewSourceEditorInputAction);
        return ViewSourceEditorInputAction;
    })(baseEditor_1.EditorInputAction);
    exports.ViewSourceEditorInputAction = ViewSourceEditorInputAction;
    var RefreshIFrameEditorInputAction = (function (_super) {
        __extends(RefreshIFrameEditorInputAction, _super);
        function RefreshIFrameEditorInputAction(editorService) {
            _super.call(this, 'workbench.files.action.refreshIFrameEditor', nls.localize('reload', "Reload"), 'iframe-editor-action refresh');
            this.editorService = editorService;
        }
        RefreshIFrameEditorInputAction.prototype.run = function (event) {
            var editor = this.editorService.getActiveEditor();
            if (editor instanceof iframeEditor_1.IFrameEditor) {
                editor.reload(true);
            }
            return winjs_base_1.Promise.as(null);
        };
        RefreshIFrameEditorInputAction = __decorate([
            __param(0, editorService_1.IWorkbenchEditorService)
        ], RefreshIFrameEditorInputAction);
        return RefreshIFrameEditorInputAction;
    })(baseEditor_1.EditorInputAction);
    exports.RefreshIFrameEditorInputAction = RefreshIFrameEditorInputAction;
    var actionBarRegistry = platform_1.Registry.as(actionBarRegistry_1.Extensions.Actionbar);
    var IFrameEditorActionContributor = (function (_super) {
        __extends(IFrameEditorActionContributor, _super);
        function IFrameEditorActionContributor(instantiationService) {
            _super.call(this);
            this.instantiationService = instantiationService;
        }
        IFrameEditorActionContributor.prototype.hasActionsForEditorInput = function (context) {
            return context.input instanceof iframeEditorInput_1.IFrameEditorInput;
        };
        IFrameEditorActionContributor.prototype.getActionsForEditorInput = function (context) {
            return [
                this.instantiationService.createInstance(RefreshIFrameEditorInputAction),
                this.instantiationService.createInstance(ViewSourceEditorInputAction)
            ];
        };
        IFrameEditorActionContributor = __decorate([
            __param(0, instantiation_1.IInstantiationService)
        ], IFrameEditorActionContributor);
        return IFrameEditorActionContributor;
    })(baseEditor_1.EditorInputActionContributor);
    // Contribute to IFrame Editor Inputs
    actionBarRegistry.registerActionBarContributor(actionBarRegistry_1.Scope.EDITOR, IFrameEditorActionContributor);
});
//# sourceMappingURL=editor.contribution.js.map