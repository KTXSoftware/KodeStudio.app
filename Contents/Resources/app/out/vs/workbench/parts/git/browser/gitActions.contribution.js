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
define(["require", "exports", 'vs/nls', 'vs/base/common/lifecycle', 'vs/platform/platform', 'vs/workbench/browser/actionBarRegistry', 'vs/base/common/winjs.base', 'vs/editor/common/editorCommon', 'vs/workbench/browser/parts/editor/baseEditor', 'vs/workbench/common/editor', 'vs/workbench/browser/parts/editor/textDiffEditor', 'vs/workbench/browser/parts/editor/textEditor', 'vs/workbench/parts/files/common/files', 'vs/workbench/parts/git/browser/gitWorkbenchContributions', 'vs/workbench/parts/git/common/git', 'vs/workbench/parts/git/browser/gitEditorInputs', 'vs/workbench/parts/git/common/stageRanges', 'vs/workbench/services/editor/common/editorService', 'vs/workbench/services/viewlet/common/viewletService', 'vs/workbench/services/part/common/partService', 'vs/workbench/services/workspace/common/contextService', 'vs/platform/files/common/files', 'vs/platform/instantiation/common/instantiation', 'vs/workbench/common/actionRegistry', 'vs/platform/actions/common/actions', './gitActions', 'vs/base/common/paths', 'vs/base/common/uri'], function (require, exports, nls, lifecycle, platform, abr, winjs_base_1, editorcommon, baseeditor, WorkbenchEditorCommon, tdeditor, teditor, filesCommon, gitcontrib, git_1, gitei, stageranges, editorService_1, viewletService_1, partService_1, contextService_1, files_1, instantiation_1, wbar, actions_1, gitActions_1, paths, uri_1) {
    function getStatus(gitService, contextService, input) {
        var model = gitService.getModel();
        var repositoryRoot = model.getRepositoryRoot();
        var statusModel = model.getStatus();
        var repositoryRelativePath = paths.normalize(paths.relative(repositoryRoot, input.getResource().fsPath));
        return statusModel.getWorkingTreeStatus().find(repositoryRelativePath) ||
            statusModel.getIndexStatus().find(repositoryRelativePath);
    }
    var OpenInDiffAction = (function (_super) {
        __extends(OpenInDiffAction, _super);
        function OpenInDiffAction(editorService, gitService, viewletService, partService, contextService) {
            var _this = this;
            _super.call(this, OpenInDiffAction.ID, OpenInDiffAction.Label);
            this.class = 'git-action open-in-diff';
            this.gitService = gitService;
            this.viewletService = viewletService;
            this.editorService = editorService;
            this.partService = partService;
            this.contextService = contextService;
            this.toDispose = [this.gitService.addBulkListener2(function () { return _this.onGitStateChanged(); })];
            this.enabled = this.isEnabled();
        }
        OpenInDiffAction.prototype.isEnabled = function () {
            if (!_super.prototype.isEnabled.call(this)) {
                return false;
            }
            if (!(typeof this.gitService.getModel().getRepositoryRoot() === 'string')) {
                return false;
            }
            var status = this.getStatus();
            return status && (status.getStatus() === git_1.Status.MODIFIED ||
                status.getStatus() === git_1.Status.INDEX_MODIFIED ||
                status.getStatus() === git_1.Status.INDEX_RENAMED);
        };
        OpenInDiffAction.prototype.onGitStateChanged = function () {
            if (this.gitService.isIdle()) {
                this.enabled = this.isEnabled();
            }
        };
        OpenInDiffAction.prototype.getStatus = function () {
            return getStatus(this.gitService, this.contextService, this.input);
        };
        OpenInDiffAction.prototype.run = function (event) {
            var _this = this;
            var sideBySide = !!(event && (event.ctrlKey || event.metaKey));
            var editor = this.editorService.getActiveEditor().getControl();
            var viewState = editor ? editor.saveViewState() : null;
            return this.gitService.getInput(this.getStatus()).then(function (input) {
                var promise = winjs_base_1.Promise.as(null);
                if (_this.partService.isVisible(partService_1.Parts.SIDEBAR_PART)) {
                    promise = _this.viewletService.openViewlet(gitcontrib.VIEWLET_ID, false);
                }
                return promise.then(function () {
                    var options = new WorkbenchEditorCommon.TextDiffEditorOptions();
                    options.forceOpen = true;
                    options.autoRevealFirstChange = false;
                    return _this.editorService.openEditor(input, options, sideBySide).then(function (editor) {
                        if (viewState) {
                            var codeEditor = _this.editorService.getActiveEditor().getControl();
                            codeEditor.restoreViewState({
                                original: {},
                                modified: viewState
                            });
                        }
                    });
                });
            });
        };
        OpenInDiffAction.prototype.dispose = function () {
            this.toDispose = lifecycle.disposeAll(this.toDispose);
        };
        OpenInDiffAction.ID = 'workbench.git.action.openInDiff';
        OpenInDiffAction.Label = nls.localize('switchToChangesView', "Switch to Changes View");
        OpenInDiffAction = __decorate([
            __param(0, editorService_1.IWorkbenchEditorService),
            __param(1, git_1.IGitService),
            __param(2, viewletService_1.IViewletService),
            __param(3, partService_1.IPartService),
            __param(4, contextService_1.IWorkspaceContextService)
        ], OpenInDiffAction);
        return OpenInDiffAction;
    })(baseeditor.EditorInputAction);
    var OpenInEditorAction = (function (_super) {
        __extends(OpenInEditorAction, _super);
        function OpenInEditorAction(fileService, editorService, gitService, viewletService, partService, contextService) {
            _super.call(this, OpenInEditorAction.ID, OpenInEditorAction.LABEL);
            this.class = 'git-action open-in-editor';
            this.gitService = gitService;
            this.fileService = fileService;
            this.viewletService = viewletService;
            this.editorService = editorService;
            this.partService = partService;
            this.contextService = contextService;
            this.enabled = this.isEnabled();
        }
        OpenInEditorAction.prototype.isEnabled = function () {
            if (!_super.prototype.isEnabled.call(this)) {
                return false;
            }
            if (!(typeof this.gitService.getModel().getRepositoryRoot() === 'string')) {
                return false;
            }
            var status = this.input.getFileStatus();
            if (OpenInEditorAction.DELETED_STATES.indexOf(status.getStatus()) > -1) {
                return false;
            }
            return true;
        };
        OpenInEditorAction.prototype.run = function (event) {
            var _this = this;
            var model = this.gitService.getModel();
            var resource = uri_1.default.file(paths.join(model.getRepositoryRoot(), this.getRepositoryRelativePath()));
            var sideBySide = !!(event && (event.ctrlKey || event.metaKey));
            var modifiedViewState = this.saveTextViewState();
            return this.fileService.resolveFile(resource).then(function (stat) {
                return _this.editorService.openEditor({
                    resource: stat.resource,
                    mime: stat.mime,
                    options: {
                        forceOpen: true
                    }
                }, sideBySide).then(function (editor) {
                    _this.restoreTextViewState(modifiedViewState);
                    if (_this.partService.isVisible(partService_1.Parts.SIDEBAR_PART)) {
                        return _this.viewletService.openViewlet(filesCommon.VIEWLET_ID, false);
                    }
                });
            });
        };
        OpenInEditorAction.prototype.saveTextViewState = function () {
            var textEditor = this.getTextEditor();
            if (textEditor) {
                return textEditor.saveViewState();
            }
            return null;
        };
        OpenInEditorAction.prototype.restoreTextViewState = function (state) {
            var textEditor = this.getTextEditor();
            if (textEditor) {
                return textEditor.restoreViewState(state);
            }
        };
        OpenInEditorAction.prototype.getTextEditor = function () {
            var editor = this.editorService.getActiveEditor();
            if (editor instanceof tdeditor.TextDiffEditor) {
                return editor.getControl().getModifiedEditor();
            }
            else if (editor instanceof teditor.BaseTextEditor) {
                return editor.getControl();
            }
            return null;
        };
        OpenInEditorAction.prototype.getRepositoryRelativePath = function () {
            var status = this.input.getFileStatus();
            if (status.getStatus() === git_1.Status.INDEX_RENAMED) {
                return status.getRename();
            }
            else {
                var indexStatus = this.gitService.getModel().getStatus().find(status.getPath(), git_1.StatusType.INDEX);
                if (indexStatus && indexStatus.getStatus() === git_1.Status.INDEX_RENAMED) {
                    return indexStatus.getRename();
                }
                else {
                    return status.getPath();
                }
            }
        };
        OpenInEditorAction.DELETED_STATES = [git_1.Status.BOTH_DELETED, git_1.Status.DELETED, git_1.Status.DELETED_BY_US, git_1.Status.INDEX_DELETED];
        OpenInEditorAction.ID = 'workbench.git.action.openInEditor';
        OpenInEditorAction.LABEL = nls.localize('openInEditor', "Switch to Editor View");
        OpenInEditorAction = __decorate([
            __param(0, files_1.IFileService),
            __param(1, editorService_1.IWorkbenchEditorService),
            __param(2, git_1.IGitService),
            __param(3, viewletService_1.IViewletService),
            __param(4, partService_1.IPartService),
            __param(5, contextService_1.IWorkspaceContextService)
        ], OpenInEditorAction);
        return OpenInEditorAction;
    })(baseeditor.EditorInputAction);
    var StageRangesAction = (function (_super) {
        __extends(StageRangesAction, _super);
        function StageRangesAction(editor, gitService, editorService) {
            _super.call(this, 'workbench.git.action.stageRanges', nls.localize('stageSelectedLines', "Stage Selected Lines"));
            this.editorService = editorService;
            this.gitService = gitService;
            this.editor = editor.getControl();
            this.editor.addListener(editorcommon.EventType.CursorSelectionChanged, this.updateEnablement.bind(this));
            this.editor.addListener(editorcommon.EventType.DiffUpdated, this.updateEnablement.bind(this));
            this.class = 'git-action stage-ranges';
        }
        StageRangesAction.prototype.isEnabled = function () {
            if (!_super.prototype.isEnabled.call(this)) {
                return false;
            }
            if (!this.gitService || !this.editorService) {
                return false;
            }
            var changes = this.editor.getLineChanges();
            var selections = this.editor.getSelections();
            if (!changes || !selections || selections.length === 0) {
                return false;
            }
            return stageranges.getSelectedChanges(changes, selections).length > 0;
        };
        StageRangesAction.prototype.run = function () {
            var _this = this;
            var result = stageranges.stageRanges(this.editor);
            var status = this.input.getFileStatus();
            var path = status.getPath();
            var viewState = this.editor.saveViewState();
            return this.gitService.stage(status.getPath(), result).then(function () {
                var statusModel = _this.gitService.getModel().getStatus();
                status = statusModel.getWorkingTreeStatus().find(path) || statusModel.getIndexStatus().find(path);
                if (status) {
                    return _this.gitService.getInput(status).then(function (input) {
                        var options = new WorkbenchEditorCommon.TextDiffEditorOptions();
                        options.forceOpen = true;
                        options.autoRevealFirstChange = false;
                        return _this.editorService.openEditor(input, options, _this.position).then(function () {
                            _this.editor.restoreViewState(viewState);
                        });
                    });
                }
            });
        };
        StageRangesAction.prototype.updateEnablement = function () {
            this.enabled = this.isEnabled();
        };
        StageRangesAction = __decorate([
            __param(1, git_1.IGitService),
            __param(2, editorService_1.IWorkbenchEditorService)
        ], StageRangesAction);
        return StageRangesAction;
    })(baseeditor.EditorInputAction);
    exports.StageRangesAction = StageRangesAction;
    var FileEditorActionContributor = (function (_super) {
        __extends(FileEditorActionContributor, _super);
        function FileEditorActionContributor(instantiationService) {
            _super.call(this);
            this.instantiationService = instantiationService;
        }
        FileEditorActionContributor.prototype.hasActionsForEditorInput = function (context) {
            return context.input instanceof filesCommon.FileEditorInput;
        };
        FileEditorActionContributor.prototype.getActionsForEditorInput = function (context) {
            return [this.instantiationService.createInstance(OpenInDiffAction)];
        };
        FileEditorActionContributor = __decorate([
            __param(0, instantiation_1.IInstantiationService)
        ], FileEditorActionContributor);
        return FileEditorActionContributor;
    })(baseeditor.EditorInputActionContributor);
    var GitEditorActionContributor = (function (_super) {
        __extends(GitEditorActionContributor, _super);
        function GitEditorActionContributor(instantiationService) {
            _super.call(this);
            this.instantiationService = instantiationService;
        }
        GitEditorActionContributor.prototype.hasActionsForEditorInput = function (context) {
            return gitei.isGitEditorInput(context.input);
        };
        GitEditorActionContributor.prototype.getActionsForEditorInput = function (context) {
            return [this.instantiationService.createInstance(OpenInEditorAction)];
        };
        GitEditorActionContributor = __decorate([
            __param(0, instantiation_1.IInstantiationService)
        ], GitEditorActionContributor);
        return GitEditorActionContributor;
    })(baseeditor.EditorInputActionContributor);
    var GitWorkingTreeDiffEditorActionContributor = (function (_super) {
        __extends(GitWorkingTreeDiffEditorActionContributor, _super);
        function GitWorkingTreeDiffEditorActionContributor(instantiationService) {
            _super.call(this);
            this.instantiationService = instantiationService;
        }
        GitWorkingTreeDiffEditorActionContributor.prototype.hasSecondaryActionsForEditorInput = function (context) {
            return (context.input instanceof gitei.GitWorkingTreeDiffEditorInput && context.editor instanceof tdeditor.TextDiffEditor);
        };
        GitWorkingTreeDiffEditorActionContributor.prototype.getSecondaryActionsForEditorInput = function (context) {
            return [this.instantiationService.createInstance(StageRangesAction, context.editor)];
        };
        GitWorkingTreeDiffEditorActionContributor = __decorate([
            __param(0, instantiation_1.IInstantiationService)
        ], GitWorkingTreeDiffEditorActionContributor);
        return GitWorkingTreeDiffEditorActionContributor;
    })(baseeditor.EditorInputActionContributor);
    var GlobalOpenChangeAction = (function (_super) {
        __extends(GlobalOpenChangeAction, _super);
        function GlobalOpenChangeAction(id, label, editorService, gitService, contextService, viewletService, partService) {
            _super.call(this, editorService, gitService);
            this.contextService = contextService;
            this.viewletService = viewletService;
            this.partService = partService;
        }
        GlobalOpenChangeAction.prototype.getInput = function () {
            return WorkbenchEditorCommon.asFileEditorInput(this.editorService.getActiveEditorInput());
        };
        GlobalOpenChangeAction.prototype.run = function (context) {
            var _this = this;
            var input = this.getInput();
            if (!input) {
                return winjs_base_1.Promise.as(null);
            }
            var status = getStatus(this.gitService, this.contextService, input);
            if (!status) {
                return winjs_base_1.Promise.as(null);
            }
            var sideBySide = !!(context && (context.ctrlKey || context.metaKey));
            var editor = this.editorService.getActiveEditor().getControl();
            var viewState = editor ? editor.saveViewState() : null;
            return this.gitService.getInput(status).then(function (input) {
                var promise = winjs_base_1.Promise.as(null);
                if (_this.partService.isVisible(partService_1.Parts.SIDEBAR_PART)) {
                    promise = _this.viewletService.openViewlet(gitcontrib.VIEWLET_ID, false);
                }
                return promise.then(function () {
                    var options = new WorkbenchEditorCommon.TextDiffEditorOptions();
                    options.forceOpen = true;
                    options.autoRevealFirstChange = false;
                    return _this.editorService.openEditor(input, options, sideBySide).then(function (editor) {
                        if (viewState) {
                            var codeEditor = _this.editorService.getActiveEditor().getControl();
                            codeEditor.restoreViewState({
                                original: {},
                                modified: viewState
                            });
                        }
                    });
                });
            });
            return winjs_base_1.Promise.as(true);
        };
        GlobalOpenChangeAction.ID = 'workbench.git.action.globalOpenChange';
        GlobalOpenChangeAction.LABEL = nls.localize('openChange', "Open Change");
        GlobalOpenChangeAction = __decorate([
            __param(2, editorService_1.IWorkbenchEditorService),
            __param(3, git_1.IGitService),
            __param(4, contextService_1.IWorkspaceContextService),
            __param(5, viewletService_1.IViewletService),
            __param(6, partService_1.IPartService)
        ], GlobalOpenChangeAction);
        return GlobalOpenChangeAction;
    })(gitActions_1.OpenChangeAction);
    var actionBarRegistry = platform.Registry.as(abr.Extensions.Actionbar);
    actionBarRegistry.registerActionBarContributor(abr.Scope.EDITOR, FileEditorActionContributor);
    actionBarRegistry.registerActionBarContributor(abr.Scope.EDITOR, GitEditorActionContributor);
    actionBarRegistry.registerActionBarContributor(abr.Scope.EDITOR, GitWorkingTreeDiffEditorActionContributor);
    var workbenchActionRegistry = platform.Registry.as(wbar.Extensions.WorkbenchActions);
    // Register Actions
    var category = nls.localize('git', "Git");
    workbenchActionRegistry.registerWorkbenchAction(new actions_1.SyncActionDescriptor(GlobalOpenChangeAction, GlobalOpenChangeAction.ID, GlobalOpenChangeAction.LABEL), category);
    workbenchActionRegistry.registerWorkbenchAction(new actions_1.SyncActionDescriptor(gitActions_1.PullAction, gitActions_1.PullAction.ID, gitActions_1.PullAction.LABEL), category);
    workbenchActionRegistry.registerWorkbenchAction(new actions_1.SyncActionDescriptor(gitActions_1.PushAction, gitActions_1.PushAction.ID, gitActions_1.PushAction.LABEL), category);
    workbenchActionRegistry.registerWorkbenchAction(new actions_1.SyncActionDescriptor(gitActions_1.SyncAction, gitActions_1.SyncAction.ID, gitActions_1.SyncAction.LABEL), category);
    workbenchActionRegistry.registerWorkbenchAction(new actions_1.SyncActionDescriptor(gitActions_1.PublishAction, gitActions_1.PublishAction.ID, gitActions_1.PublishAction.LABEL), category);
    workbenchActionRegistry.registerWorkbenchAction(new actions_1.SyncActionDescriptor(gitActions_1.StartGitBranchAction, gitActions_1.StartGitBranchAction.ID, gitActions_1.StartGitBranchAction.LABEL), category);
    workbenchActionRegistry.registerWorkbenchAction(new actions_1.SyncActionDescriptor(gitActions_1.StartGitCheckoutAction, gitActions_1.StartGitCheckoutAction.ID, gitActions_1.StartGitCheckoutAction.LABEL), category);
});
//# sourceMappingURL=gitActions.contribution.js.map