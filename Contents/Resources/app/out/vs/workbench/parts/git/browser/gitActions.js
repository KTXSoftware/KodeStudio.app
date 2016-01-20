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
define(["require", "exports", 'vs/base/common/winjs.base', 'vs/nls', 'vs/base/common/lifecycle', 'vs/base/common/strings', 'vs/base/common/types', 'vs/base/common/actions', 'vs/workbench/parts/git/common/gitModel', 'vs/workbench/parts/git/browser/gitEditorInputs', 'vs/workbench/common/editor', 'vs/base/common/errors', 'vs/base/common/platform', 'vs/workbench/services/editor/common/editorService', 'vs/workbench/services/workspace/common/contextService', 'vs/platform/event/common/event', 'vs/platform/files/common/files', 'vs/platform/message/common/message', 'vs/base/common/severity', 'vs/workbench/parts/git/common/git', 'vs/workbench/services/quickopen/common/quickOpenService'], function (require, exports, winjs_base_1, nls, lifecycle_1, strings, types_1, actions_1, model, inputs, editor_1, errors, platform, editorService_1, contextService_1, event_1, files_1, message_1, severity_1, git_1, quickOpenService_1) {
    function flatten(context, preferFocus) {
        if (preferFocus === void 0) { preferFocus = false; }
        if (!context) {
            return context;
        }
        else if (Array.isArray(context)) {
            if (context.some(function (c) { return !(c instanceof model.FileStatus); })) {
                throw new Error('Invalid context.');
            }
            return context;
        }
        else if (context instanceof model.FileStatus) {
            return [context];
        }
        else if (context instanceof model.StatusGroup) {
            return context.all();
        }
        else if (context.tree) {
            var elements = context.tree.getSelection();
            return elements.indexOf(context.fileStatus) > -1 ? elements : [context.fileStatus];
        }
        else if (context.selection) {
            return !preferFocus && context.selection.indexOf(context.focus) > -1 ? context.selection : [context.focus];
        }
        else {
            throw new Error('Invalid context.');
        }
    }
    var GitAction = (function (_super) {
        __extends(GitAction, _super);
        function GitAction(id, label, cssClass, gitService) {
            var _this = this;
            this.gitService = gitService;
            _super.call(this, id, label, cssClass, false);
            this.toDispose = [this.gitService.addBulkListener2(function () { return _this.onGitServiceChange(); })];
            this.onGitServiceChange();
        }
        GitAction.prototype.onGitServiceChange = function () {
            this.updateEnablement();
        };
        GitAction.prototype.updateEnablement = function () {
            this.enabled = this.isEnabled();
        };
        GitAction.prototype.isEnabled = function () {
            return !!this.gitService;
        };
        GitAction.prototype.dispose = function () {
            this.gitService = null;
            this.toDispose = lifecycle_1.disposeAll(this.toDispose);
            _super.prototype.dispose.call(this);
        };
        return GitAction;
    })(actions_1.Action);
    exports.GitAction = GitAction;
    var OpenChangeAction = (function (_super) {
        __extends(OpenChangeAction, _super);
        function OpenChangeAction(editorService, gitService) {
            this.editorService = editorService;
            _super.call(this, OpenChangeAction.ID, nls.localize('openChange', "Open Change"), 'git-action open-change', gitService);
        }
        OpenChangeAction.prototype.isEnabled = function () {
            return _super.prototype.isEnabled.call(this) && !!this.editorService;
        };
        OpenChangeAction.prototype.run = function (context) {
            var _this = this;
            var statuses = flatten(context, true);
            return this.gitService.getInput(statuses[0]).then(function (input) {
                var options = new editor_1.TextDiffEditorOptions();
                options.forceOpen = true;
                return _this.editorService.openEditor(input, options);
            });
        };
        OpenChangeAction.ID = 'workbench.action.openChange';
        OpenChangeAction = __decorate([
            __param(0, editorService_1.IWorkbenchEditorService),
            __param(1, git_1.IGitService)
        ], OpenChangeAction);
        return OpenChangeAction;
    })(GitAction);
    exports.OpenChangeAction = OpenChangeAction;
    var OpenFileAction = (function (_super) {
        __extends(OpenFileAction, _super);
        function OpenFileAction(editorService, fileService, gitService, contextService) {
            this.fileService = fileService;
            this.editorService = editorService;
            this.contextService = contextService;
            _super.call(this, OpenFileAction.ID, nls.localize('openFile', "Open File"), 'git-action open-file', gitService);
        }
        OpenFileAction.prototype.isEnabled = function () {
            return _super.prototype.isEnabled.call(this) && !!this.editorService || !!this.fileService;
        };
        OpenFileAction.prototype.getPath = function (status) {
            if (status.getStatus() === git_1.Status.INDEX_RENAMED) {
                return status.getRename();
            }
            else {
                var indexStatus = this.gitService.getModel().getStatus().find(status.getPath(), git_1.StatusType.INDEX);
                if (indexStatus && indexStatus.getStatus() === git_1.Status.INDEX_RENAMED) {
                    return status.getRename();
                }
                else {
                    return status.getPath();
                }
            }
        };
        OpenFileAction.prototype.run = function (context) {
            var _this = this;
            var statuses = flatten(context, true);
            var status = statuses[0];
            if (!(status instanceof model.FileStatus)) {
                return winjs_base_1.Promise.wrapError(new Error('Can\'t open file.'));
            }
            if (OpenFileAction.DELETED_STATES.indexOf(status.getStatus()) > -1) {
                return winjs_base_1.Promise.wrapError(new Error('Can\'t open file which is has been deleted.'));
            }
            var path = this.getPath(status);
            return this.fileService.resolveFile(this.contextService.toResource(path)).then(function (stat) {
                return _this.editorService.openEditor({
                    resource: stat.resource,
                    mime: stat.mime,
                    options: {
                        forceOpen: true
                    }
                });
            });
        };
        OpenFileAction.DELETED_STATES = [git_1.Status.BOTH_DELETED, git_1.Status.DELETED, git_1.Status.DELETED_BY_US, git_1.Status.INDEX_DELETED];
        OpenFileAction.ID = 'workbench.action.openFile';
        OpenFileAction = __decorate([
            __param(0, editorService_1.IWorkbenchEditorService),
            __param(1, files_1.IFileService),
            __param(2, git_1.IGitService),
            __param(3, contextService_1.IWorkspaceContextService)
        ], OpenFileAction);
        return OpenFileAction;
    })(GitAction);
    exports.OpenFileAction = OpenFileAction;
    var InitAction = (function (_super) {
        __extends(InitAction, _super);
        function InitAction(gitService) {
            _super.call(this, InitAction.ID, nls.localize('init', "Init"), 'git-action init', gitService);
        }
        InitAction.prototype.isEnabled = function () {
            return _super.prototype.isEnabled.call(this) && this.gitService.getState() === git_1.ServiceState.NotARepo;
        };
        InitAction.prototype.run = function () {
            return this.gitService.init();
        };
        InitAction.ID = 'workbench.action.init';
        InitAction = __decorate([
            __param(0, git_1.IGitService)
        ], InitAction);
        return InitAction;
    })(GitAction);
    exports.InitAction = InitAction;
    var RefreshAction = (function (_super) {
        __extends(RefreshAction, _super);
        function RefreshAction(gitService) {
            _super.call(this, RefreshAction.ID, nls.localize('refresh', "Refresh"), 'git-action refresh', gitService);
        }
        RefreshAction.prototype.run = function () {
            return this.gitService.status();
        };
        RefreshAction.ID = 'workbench.action.refresh';
        RefreshAction = __decorate([
            __param(0, git_1.IGitService)
        ], RefreshAction);
        return RefreshAction;
    })(GitAction);
    exports.RefreshAction = RefreshAction;
    var BaseStageAction = (function (_super) {
        __extends(BaseStageAction, _super);
        function BaseStageAction(id, label, className, gitService, editorService) {
            _super.call(this, id, label, className, gitService);
            this.editorService = editorService;
        }
        BaseStageAction.prototype.run = function (context) {
            var _this = this;
            var flatContext = flatten(context);
            return this.gitService.add(flatten(context)).then(function (status) {
                var targetEditor = _this.findGitWorkingTreeEditor();
                if (!targetEditor) {
                    return winjs_base_1.Promise.as(status);
                }
                var currentGitEditorInput = targetEditor.input;
                var currentFileStatus = currentGitEditorInput.getFileStatus();
                if (flatContext && flatContext.every(function (f) { return f !== currentFileStatus; })) {
                    return winjs_base_1.Promise.as(status);
                }
                var path = currentGitEditorInput.getFileStatus().getPath();
                var fileStatus = status.getStatus().find(path, git_1.StatusType.INDEX);
                if (!fileStatus) {
                    return winjs_base_1.Promise.as(status);
                }
                var editorControl = targetEditor.getControl();
                var viewState = editorControl ? editorControl.saveViewState() : null;
                return _this.gitService.getInput(fileStatus).then(function (input) {
                    var options = new editor_1.TextDiffEditorOptions();
                    options.forceOpen = true;
                    return _this.editorService.openEditor(input, options, targetEditor.position).then(function (editor) {
                        if (viewState) {
                            editorControl.restoreViewState(viewState);
                        }
                        return status;
                    });
                });
            });
        };
        BaseStageAction.prototype.findGitWorkingTreeEditor = function () {
            var editors = this.editorService.getVisibleEditors();
            for (var i = 0; i < editors.length; i++) {
                var editor = editors[i];
                if (inputs.isGitEditorInput(editor.input)) {
                    return editor;
                }
            }
            return null;
        };
        BaseStageAction.prototype.dispose = function () {
            this.editorService = null;
            _super.prototype.dispose.call(this);
        };
        return BaseStageAction;
    })(GitAction);
    exports.BaseStageAction = BaseStageAction;
    var StageAction = (function (_super) {
        __extends(StageAction, _super);
        function StageAction(gitService, editorService) {
            _super.call(this, StageAction.ID, StageAction.LABEL, 'git-action stage', gitService, editorService);
        }
        StageAction.ID = 'workbench.action.stage';
        StageAction.LABEL = nls.localize('stageChanges', "Stage");
        StageAction = __decorate([
            __param(0, git_1.IGitService),
            __param(1, editorService_1.IWorkbenchEditorService)
        ], StageAction);
        return StageAction;
    })(BaseStageAction);
    exports.StageAction = StageAction;
    var GlobalStageAction = (function (_super) {
        __extends(GlobalStageAction, _super);
        function GlobalStageAction(gitService, editorService) {
            _super.call(this, GlobalStageAction.ID, nls.localize('stageAllChanges', "Stage All"), 'git-action stage', gitService, editorService);
        }
        GlobalStageAction.prototype.isEnabled = function () {
            return _super.prototype.isEnabled.call(this) && this.gitService.getModel().getStatus().getWorkingTreeStatus().all().length > 0;
        };
        GlobalStageAction.prototype.run = function (context) {
            return _super.prototype.run.call(this);
        };
        GlobalStageAction.ID = 'workbench.action.stageAll';
        GlobalStageAction = __decorate([
            __param(0, git_1.IGitService),
            __param(1, editorService_1.IWorkbenchEditorService)
        ], GlobalStageAction);
        return GlobalStageAction;
    })(BaseStageAction);
    exports.GlobalStageAction = GlobalStageAction;
    var BaseUndoAction = (function (_super) {
        __extends(BaseUndoAction, _super);
        function BaseUndoAction(id, label, className, gitService, eventService, messageService, fileService, editorService, contextService) {
            this.eventService = eventService;
            this.editorService = editorService;
            this.messageService = messageService;
            this.fileService = fileService;
            this.contextService = contextService;
            _super.call(this, id, label, className, gitService);
        }
        BaseUndoAction.prototype.isEnabled = function () {
            return _super.prototype.isEnabled.call(this) && !!this.eventService && !!this.editorService && !!this.fileService;
        };
        BaseUndoAction.prototype.run = function (context) {
            var _this = this;
            if (!this.messageService.confirm(this.getConfirm(context))) {
                return winjs_base_1.Promise.as(null);
            }
            var promises = [];
            if (context instanceof model.StatusGroup) {
                promises = [this.gitService.undo()];
            }
            else {
                var all = flatten(context);
                var toClean = [];
                var toCheckout = [];
                for (var i = 0; i < all.length; i++) {
                    var status = all[i].clone();
                    switch (status.getStatus()) {
                        case git_1.Status.UNTRACKED:
                        case git_1.Status.IGNORED:
                            toClean.push(status);
                            break;
                        default:
                            toCheckout.push(status);
                            break;
                    }
                }
                if (toClean.length > 0) {
                    promises.push(this.gitService.clean(toClean));
                }
                if (toCheckout.length > 0) {
                    promises.push(this.gitService.checkout('', toCheckout));
                }
            }
            return winjs_base_1.Promise.join(promises).then(function (statuses) {
                if (statuses.length === 0) {
                    return winjs_base_1.Promise.as(null);
                }
                var status = statuses[statuses.length - 1];
                var targetEditor = _this.findWorkingTreeDiffEditor();
                if (!targetEditor) {
                    return winjs_base_1.Promise.as(status);
                }
                var currentGitEditorInput = targetEditor.input;
                var currentFileStatus = currentGitEditorInput.getFileStatus();
                if (all && all.every(function (f) { return f !== currentFileStatus; })) {
                    return winjs_base_1.Promise.as(status);
                }
                var path = currentGitEditorInput.getFileStatus().getPath();
                var editor = targetEditor.getControl();
                var modifiedEditorControl = editor ? editor.getModifiedEditor() : null;
                var modifiedViewState = modifiedEditorControl ? modifiedEditorControl.saveViewState() : null;
                return _this.fileService.resolveFile(_this.contextService.toResource(path)).then(function (stat) {
                    return _this.editorService.openEditor({
                        resource: stat.resource,
                        mime: stat.mime,
                        options: {
                            forceOpen: true
                        }
                    }, targetEditor.position).then(function (editor) {
                        if (modifiedViewState) {
                            var codeEditor = targetEditor.getControl();
                            if (codeEditor) {
                                codeEditor.restoreViewState(modifiedViewState);
                            }
                        }
                    });
                });
            }).then(null, function (errors) {
                console.error('One or more errors occurred', errors);
                return winjs_base_1.Promise.wrapError(errors[0]);
            });
        };
        BaseUndoAction.prototype.findWorkingTreeDiffEditor = function () {
            var editors = this.editorService.getVisibleEditors();
            for (var i = 0; i < editors.length; i++) {
                var editor = editors[i];
                if (editor.input instanceof inputs.GitWorkingTreeDiffEditorInput) {
                    return editor;
                }
            }
            return null;
        };
        BaseUndoAction.prototype.getConfirm = function (context) {
            var all = flatten(context);
            if (all.length > 1) {
                var count = all.length;
                return {
                    message: nls.localize('confirmUndoMessage', "Are you sure you want to clean all changes?"),
                    detail: count === 1
                        ? nls.localize('confirmUndoAllOne', "There are unstaged changes in {0} file.\n\nThis action is irreversible!", count)
                        : nls.localize('confirmUndoAllMultiple', "There are unstaged changes in {0} files.\n\nThis action is irreversible!", count),
                    primaryButton: nls.localize('cleanChangesLabel', "&&Clean Changes")
                };
            }
            var label = all[0].getPathComponents().reverse()[0];
            return {
                message: nls.localize('confirmUndo', "Are you sure you want to clean changes in '{0}'?", label),
                detail: nls.localize('irreversible', "This action is irreversible!"),
                primaryButton: nls.localize('cleanChangesLabel', "&&Clean Changes")
            };
        };
        BaseUndoAction.prototype.dispose = function () {
            this.eventService = null;
            this.editorService = null;
            this.fileService = null;
            _super.prototype.dispose.call(this);
        };
        return BaseUndoAction;
    })(GitAction);
    exports.BaseUndoAction = BaseUndoAction;
    var UndoAction = (function (_super) {
        __extends(UndoAction, _super);
        function UndoAction(gitService, eventService, messageService, fileService, editorService, contextService) {
            _super.call(this, UndoAction.ID, nls.localize('undoChanges', "Clean"), 'git-action undo', gitService, eventService, messageService, fileService, editorService, contextService);
        }
        UndoAction.ID = 'workbench.action.undo';
        UndoAction = __decorate([
            __param(0, git_1.IGitService),
            __param(1, event_1.IEventService),
            __param(2, message_1.IMessageService),
            __param(3, files_1.IFileService),
            __param(4, editorService_1.IWorkbenchEditorService),
            __param(5, contextService_1.IWorkspaceContextService)
        ], UndoAction);
        return UndoAction;
    })(BaseUndoAction);
    exports.UndoAction = UndoAction;
    var GlobalUndoAction = (function (_super) {
        __extends(GlobalUndoAction, _super);
        function GlobalUndoAction(gitService, eventService, messageService, fileService, editorService, contextService) {
            _super.call(this, GlobalUndoAction.ID, nls.localize('undoAllChanges', "Clean All"), 'git-action undo', gitService, eventService, messageService, fileService, editorService, contextService);
        }
        GlobalUndoAction.prototype.isEnabled = function () {
            return _super.prototype.isEnabled.call(this) && this.gitService.getModel().getStatus().getWorkingTreeStatus().all().length > 0;
        };
        GlobalUndoAction.prototype.run = function (context) {
            return _super.prototype.run.call(this, this.gitService.getModel().getStatus().getWorkingTreeStatus());
        };
        GlobalUndoAction.ID = 'workbench.action.undoAll';
        GlobalUndoAction = __decorate([
            __param(0, git_1.IGitService),
            __param(1, event_1.IEventService),
            __param(2, message_1.IMessageService),
            __param(3, files_1.IFileService),
            __param(4, editorService_1.IWorkbenchEditorService),
            __param(5, contextService_1.IWorkspaceContextService)
        ], GlobalUndoAction);
        return GlobalUndoAction;
    })(BaseUndoAction);
    exports.GlobalUndoAction = GlobalUndoAction;
    var BaseUnstageAction = (function (_super) {
        __extends(BaseUnstageAction, _super);
        function BaseUnstageAction(id, label, className, gitService, editorService) {
            _super.call(this, id, label, className, gitService);
            this.editorService = editorService;
        }
        BaseUnstageAction.prototype.isEnabled = function () {
            return _super.prototype.isEnabled.call(this) && !!this.editorService;
        };
        BaseUnstageAction.prototype.run = function (context) {
            var _this = this;
            var flatContext = flatten(context);
            return this.gitService.revertFiles('HEAD', flatContext).then(function (status) {
                var targetEditor = _this.findGitIndexEditor();
                if (!targetEditor) {
                    return winjs_base_1.Promise.as(status);
                }
                var currentGitEditorInput = targetEditor.input;
                var currentFileStatus = currentGitEditorInput.getFileStatus();
                if (flatContext && flatContext.every(function (f) { return f !== currentFileStatus; })) {
                    return winjs_base_1.Promise.as(status);
                }
                var path = currentGitEditorInput.getFileStatus().getPath();
                var fileStatus = status.getStatus().find(path, git_1.StatusType.WORKING_TREE);
                if (!fileStatus) {
                    return winjs_base_1.Promise.as(status);
                }
                var editorControl = targetEditor.getControl();
                var viewState = editorControl ? editorControl.saveViewState() : null;
                return _this.gitService.getInput(fileStatus).then(function (input) {
                    var options = new editor_1.TextDiffEditorOptions();
                    options.forceOpen = true;
                    return _this.editorService.openEditor(input, options, targetEditor.position).then(function (editor) {
                        if (viewState) {
                            editorControl.restoreViewState(viewState);
                        }
                        return status;
                    });
                });
            });
        };
        BaseUnstageAction.prototype.findGitIndexEditor = function () {
            var editors = this.editorService.getVisibleEditors();
            for (var i = 0; i < editors.length; i++) {
                var editor = editors[i];
                if (inputs.isGitEditorInput(editor.input)) {
                    return editor;
                }
            }
            return null;
        };
        BaseUnstageAction.prototype.dispose = function () {
            this.editorService = null;
            _super.prototype.dispose.call(this);
        };
        return BaseUnstageAction;
    })(GitAction);
    exports.BaseUnstageAction = BaseUnstageAction;
    var UnstageAction = (function (_super) {
        __extends(UnstageAction, _super);
        function UnstageAction(gitService, editorService) {
            _super.call(this, UnstageAction.ID, nls.localize('unstage', "Unstage"), 'git-action unstage', gitService, editorService);
        }
        UnstageAction.ID = 'workbench.action.unstage';
        UnstageAction = __decorate([
            __param(0, git_1.IGitService),
            __param(1, editorService_1.IWorkbenchEditorService)
        ], UnstageAction);
        return UnstageAction;
    })(BaseUnstageAction);
    exports.UnstageAction = UnstageAction;
    var GlobalUnstageAction = (function (_super) {
        __extends(GlobalUnstageAction, _super);
        function GlobalUnstageAction(gitService, editorService) {
            _super.call(this, GlobalUnstageAction.ID, nls.localize('unstageAllChanges', "Unstage All"), 'git-action unstage', gitService, editorService);
        }
        GlobalUnstageAction.prototype.isEnabled = function () {
            return _super.prototype.isEnabled.call(this) && this.gitService.getModel().getStatus().getIndexStatus().all().length > 0;
        };
        GlobalUnstageAction.prototype.run = function (context) {
            return _super.prototype.run.call(this);
        };
        GlobalUnstageAction.ID = 'workbench.action.unstageAll';
        GlobalUnstageAction = __decorate([
            __param(0, git_1.IGitService),
            __param(1, editorService_1.IWorkbenchEditorService)
        ], GlobalUnstageAction);
        return GlobalUnstageAction;
    })(BaseUnstageAction);
    exports.GlobalUnstageAction = GlobalUnstageAction;
    var LifecycleState;
    (function (LifecycleState) {
        LifecycleState[LifecycleState["Alive"] = 0] = "Alive";
        LifecycleState[LifecycleState["Disposing"] = 1] = "Disposing";
        LifecycleState[LifecycleState["Disposed"] = 2] = "Disposed";
    })(LifecycleState || (LifecycleState = {}));
    var CheckoutAction = (function (_super) {
        __extends(CheckoutAction, _super);
        function CheckoutAction(branch, gitService, editorService) {
            this.editorService = editorService;
            this.branch = branch;
            this.HEAD = null;
            this.state = LifecycleState.Alive;
            this.runPromises = [];
            _super.call(this, CheckoutAction.ID, branch.name, 'git-action checkout', gitService);
        }
        CheckoutAction.prototype.onGitServiceChange = function () {
            if (this.gitService.getState() === git_1.ServiceState.OK) {
                this.HEAD = this.gitService.getModel().getHEAD();
                if (this.HEAD && this.HEAD.name === this.branch.name) {
                    this.class = 'git-action checkout HEAD';
                }
                else {
                    this.class = 'git-action checkout';
                }
            }
            _super.prototype.onGitServiceChange.call(this);
        };
        CheckoutAction.prototype.isEnabled = function () {
            return _super.prototype.isEnabled.call(this) && !!this.HEAD;
        };
        CheckoutAction.prototype.run = function (context) {
            var _this = this;
            if (this.state !== LifecycleState.Alive) {
                return winjs_base_1.Promise.wrapError('action disposed');
            }
            else if (this.HEAD && this.HEAD.name === this.branch.name) {
                return winjs_base_1.Promise.as(null);
            }
            var result = this.gitService.checkout(this.branch.name).then(null, function (err) {
                if (err.gitErrorCode === git_1.GitErrorCodes.DirtyWorkTree) {
                    return winjs_base_1.Promise.wrapError(new Error(nls.localize('dirtyTreeCheckout', "Can't checkout. Please commit or stage your work first.")));
                }
                return winjs_base_1.Promise.wrapError(err);
            });
            this.runPromises.push(result);
            result.done(function () { return _this.runPromises.splice(_this.runPromises.indexOf(result), 1); });
            return result;
        };
        CheckoutAction.prototype.dispose = function () {
            var _this = this;
            if (this.state !== LifecycleState.Alive) {
                return;
            }
            this.state = LifecycleState.Disposing;
            winjs_base_1.Promise.join(this.runPromises).done(function () { return _this.actuallyDispose(); });
        };
        CheckoutAction.prototype.actuallyDispose = function () {
            this.editorService = null;
            this.branch = null;
            this.HEAD = null;
            _super.prototype.dispose.call(this);
            this.state = LifecycleState.Disposed;
        };
        CheckoutAction.ID = 'workbench.action.checkout';
        CheckoutAction = __decorate([
            __param(1, git_1.IGitService),
            __param(2, editorService_1.IWorkbenchEditorService)
        ], CheckoutAction);
        return CheckoutAction;
    })(GitAction);
    exports.CheckoutAction = CheckoutAction;
    var BranchAction = (function (_super) {
        __extends(BranchAction, _super);
        function BranchAction(checkout, gitService) {
            _super.call(this, BranchAction.ID, nls.localize('branch', "Branch"), 'git-action checkout', gitService);
            this.checkout = checkout;
        }
        BranchAction.prototype.run = function (context) {
            if (!types_1.isString(context)) {
                return winjs_base_1.Promise.as(false);
            }
            return this.gitService.branch(context, this.checkout);
        };
        BranchAction.ID = 'workbench.action.branch';
        BranchAction = __decorate([
            __param(1, git_1.IGitService)
        ], BranchAction);
        return BranchAction;
    })(GitAction);
    exports.BranchAction = BranchAction;
    var BaseCommitAction = (function (_super) {
        __extends(BaseCommitAction, _super);
        function BaseCommitAction(commitState, id, label, cssClass, gitService) {
            var _this = this;
            _super.call(this, id, label, cssClass, gitService);
            this.commitState = commitState;
            this.toDispose.push(commitState.addListener2('change/commitInputBox', function () {
                _this.updateEnablement();
            }));
        }
        BaseCommitAction.prototype.isEnabled = function () {
            return _super.prototype.isEnabled.call(this) && this.gitService.getModel().getStatus().getIndexStatus().all().length > 0;
        };
        BaseCommitAction.prototype.run = function (context) {
            if (!this.commitState.getCommitMessage()) {
                this.commitState.onEmptyCommitMessage();
                return winjs_base_1.Promise.as(null);
            }
            return this.gitService.commit(this.commitState.getCommitMessage());
        };
        return BaseCommitAction;
    })(GitAction);
    exports.BaseCommitAction = BaseCommitAction;
    var CommitAction = (function (_super) {
        __extends(CommitAction, _super);
        function CommitAction(commitState, gitService) {
            _super.call(this, commitState, CommitAction.ID, nls.localize('commitStaged', "Commit Staged"), 'git-action commit', gitService);
        }
        CommitAction.ID = 'workbench.action.commit';
        CommitAction = __decorate([
            __param(1, git_1.IGitService)
        ], CommitAction);
        return CommitAction;
    })(BaseCommitAction);
    exports.CommitAction = CommitAction;
    var StageAndCommitAction = (function (_super) {
        __extends(StageAndCommitAction, _super);
        function StageAndCommitAction(commitState, gitService) {
            _super.call(this, commitState, StageAndCommitAction.ID, nls.localize('commitAll', "Commit All"), 'git-action stage-and-commit', gitService);
        }
        StageAndCommitAction.prototype.isEnabled = function () {
            if (!this.gitService) {
                return false;
            }
            if (!this.gitService.isIdle()) {
                return false;
            }
            var status = this.gitService.getModel().getStatus();
            return status.getIndexStatus().all().length > 0
                || status.getWorkingTreeStatus().all().length > 0;
        };
        StageAndCommitAction.prototype.run = function (context) {
            if (!this.commitState.getCommitMessage()) {
                this.commitState.onEmptyCommitMessage();
                return winjs_base_1.Promise.as(null);
            }
            return this.gitService.commit(this.commitState.getCommitMessage(), false, true);
        };
        StageAndCommitAction.ID = 'workbench.action.stageAndCommit';
        StageAndCommitAction = __decorate([
            __param(1, git_1.IGitService)
        ], StageAndCommitAction);
        return StageAndCommitAction;
    })(BaseCommitAction);
    exports.StageAndCommitAction = StageAndCommitAction;
    var SmartCommitAction = (function (_super) {
        __extends(SmartCommitAction, _super);
        function SmartCommitAction(commitState, gitService, messageService) {
            this.messageService = messageService;
            _super.call(this, commitState, SmartCommitAction.ID, SmartCommitAction.ALL, 'git-action smart-commit', gitService);
        }
        SmartCommitAction.prototype.onGitServiceChange = function () {
            _super.prototype.onGitServiceChange.call(this);
            if (!this.enabled) {
                this.label = SmartCommitAction.ALL;
                return;
            }
            var status = this.gitService.getModel().getStatus();
            if (status.getIndexStatus().all().length > 0) {
                this.label = SmartCommitAction.STAGED;
            }
            else {
                this.label = SmartCommitAction.ALL;
            }
            this.label += ' (' + (platform.isMacintosh ? 'Cmd+Enter' : 'Ctrl+Enter') + ')';
        };
        SmartCommitAction.prototype.isEnabled = function () {
            if (!this.gitService) {
                return false;
            }
            if (!this.gitService.isIdle()) {
                return false;
            }
            var status = this.gitService.getModel().getStatus();
            return status.getIndexStatus().all().length > 0
                || status.getWorkingTreeStatus().all().length > 0;
        };
        SmartCommitAction.prototype.run = function (context) {
            if (!this.commitState.getCommitMessage()) {
                this.commitState.onEmptyCommitMessage();
                return winjs_base_1.Promise.as(null);
            }
            var status = this.gitService.getModel().getStatus();
            return this.gitService.commit(this.commitState.getCommitMessage(), false, status.getIndexStatus().all().length === 0);
        };
        SmartCommitAction.ID = 'workbench.action.commitAll';
        SmartCommitAction.ALL = nls.localize('commitAll2', "Commit All");
        SmartCommitAction.STAGED = nls.localize('commitStaged2', "Commit Staged");
        SmartCommitAction = __decorate([
            __param(1, git_1.IGitService),
            __param(2, message_1.IMessageService)
        ], SmartCommitAction);
        return SmartCommitAction;
    })(BaseCommitAction);
    exports.SmartCommitAction = SmartCommitAction;
    var PullAction = (function (_super) {
        __extends(PullAction, _super);
        function PullAction(id, label, gitService) {
            if (id === void 0) { id = PullAction.ID; }
            if (label === void 0) { label = PullAction.LABEL; }
            _super.call(this, id, label, 'git-action pull', gitService);
        }
        PullAction.prototype.isEnabled = function () {
            if (!_super.prototype.isEnabled.call(this)) {
                return false;
            }
            if (!this.gitService.isIdle()) {
                return false;
            }
            var model = this.gitService.getModel();
            var HEAD = model.getHEAD();
            if (!HEAD || !HEAD.name || !HEAD.upstream) {
                return false;
            }
            return true;
        };
        PullAction.prototype.run = function (context) {
            return this.pull();
        };
        PullAction.prototype.pull = function (rebase) {
            if (rebase === void 0) { rebase = false; }
            return this.gitService.pull(rebase).then(null, function (err) {
                if (err.gitErrorCode === git_1.GitErrorCodes.DirtyWorkTree) {
                    return winjs_base_1.Promise.wrapError(errors.create(nls.localize('dirtyTreePull', "Can't pull. Please commit or stage your work first."), { severity: severity_1.default.Warning }));
                }
                else if (err.gitErrorCode === git_1.GitErrorCodes.AuthenticationFailed) {
                    return winjs_base_1.Promise.wrapError(errors.create(nls.localize('authFailed', "Authentication failed on the git remote.")));
                }
                return winjs_base_1.Promise.wrapError(err);
            });
        };
        PullAction.ID = 'workbench.action.pull';
        PullAction.LABEL = nls.localize('pull', "Pull");
        PullAction = __decorate([
            __param(2, git_1.IGitService)
        ], PullAction);
        return PullAction;
    })(GitAction);
    exports.PullAction = PullAction;
    var PullWithRebaseAction = (function (_super) {
        __extends(PullWithRebaseAction, _super);
        function PullWithRebaseAction(gitService) {
            _super.call(this, PullWithRebaseAction.ID, PullWithRebaseAction.LABEL, gitService);
        }
        PullWithRebaseAction.prototype.run = function (context) {
            return this.pull(true);
        };
        PullWithRebaseAction.ID = 'workbench.action.pull.rebase';
        PullWithRebaseAction.LABEL = nls.localize('pullWithRebase', "Pull (Rebase)");
        PullWithRebaseAction = __decorate([
            __param(0, git_1.IGitService)
        ], PullWithRebaseAction);
        return PullWithRebaseAction;
    })(PullAction);
    exports.PullWithRebaseAction = PullWithRebaseAction;
    var PushAction = (function (_super) {
        __extends(PushAction, _super);
        function PushAction(id, label, gitService) {
            if (id === void 0) { id = PushAction.ID; }
            if (label === void 0) { label = PushAction.LABEL; }
            _super.call(this, id, label, 'git-action push', gitService);
        }
        PushAction.prototype.isEnabled = function () {
            if (!_super.prototype.isEnabled.call(this)) {
                return false;
            }
            if (!this.gitService.isIdle()) {
                return false;
            }
            var model = this.gitService.getModel();
            var HEAD = model.getHEAD();
            if (!HEAD || !HEAD.name || !HEAD.upstream) {
                return false;
            }
            if (!HEAD.ahead) {
                return false;
            }
            return true;
        };
        PushAction.prototype.run = function (context) {
            return this.gitService.push().then(null, function (err) {
                if (err.gitErrorCode === git_1.GitErrorCodes.AuthenticationFailed) {
                    return winjs_base_1.Promise.wrapError(errors.create(nls.localize('authFailed', "Authentication failed on the git remote.")));
                }
                return winjs_base_1.Promise.wrapError(err);
            });
        };
        PushAction.ID = 'workbench.action.push';
        PushAction.LABEL = nls.localize('push', "Push");
        PushAction = __decorate([
            __param(2, git_1.IGitService)
        ], PushAction);
        return PushAction;
    })(GitAction);
    exports.PushAction = PushAction;
    var PublishAction = (function (_super) {
        __extends(PublishAction, _super);
        function PublishAction(id, label, gitService, quickOpenService, messageService) {
            if (id === void 0) { id = PublishAction.ID; }
            if (label === void 0) { label = PublishAction.LABEL; }
            _super.call(this, id, label, 'git-action publish', gitService);
            this.quickOpenService = quickOpenService;
            this.messageService = messageService;
        }
        PublishAction.prototype.isEnabled = function () {
            if (!_super.prototype.isEnabled.call(this)) {
                return false;
            }
            if (!this.gitService.isIdle()) {
                return false;
            }
            var model = this.gitService.getModel();
            if (model.getRemotes().length === 0) {
                return false;
            }
            var HEAD = model.getHEAD();
            if (!HEAD || !HEAD.name || HEAD.upstream) {
                return false;
            }
            return true;
        };
        PublishAction.prototype.run = function (context) {
            var _this = this;
            var model = this.gitService.getModel();
            var remotes = model.getRemotes();
            var branchName = model.getHEAD().name;
            var promise;
            if (remotes.length === 1) {
                var remoteName = remotes[0].name;
                var result = this.messageService.confirm({
                    message: nls.localize('confirmPublishMessage', "Are you sure you want to publish '{0}' to '{1}'?", branchName, remoteName),
                    primaryButton: nls.localize('confirmPublishMessageButton', "&&Publish")
                });
                promise = winjs_base_1.TPromise.as(result ? remoteName : null);
            }
            else {
                promise = this.quickOpenService.pick(remotes.map(function (r) { return r.name; }), {
                    placeHolder: nls.localize('publishPickMessage', "Pick a remote to publish the branch '{0}' to:", branchName)
                });
            }
            return promise
                .then(function (remote) { return remote && _this.gitService.push(remote, branchName, { setUpstream: true }); })
                .then(null, function (err) {
                if (err.gitErrorCode === git_1.GitErrorCodes.AuthenticationFailed) {
                    return winjs_base_1.Promise.wrapError(errors.create(nls.localize('authFailed', "Authentication failed on the git remote.")));
                }
                return winjs_base_1.Promise.wrapError(err);
            });
        };
        PublishAction.ID = 'workbench.action.publish';
        PublishAction.LABEL = nls.localize('publish', "Publish");
        PublishAction = __decorate([
            __param(2, git_1.IGitService),
            __param(3, quickOpenService_1.IQuickOpenService),
            __param(4, message_1.IMessageService)
        ], PublishAction);
        return PublishAction;
    })(GitAction);
    exports.PublishAction = PublishAction;
    var BaseSyncAction = (function (_super) {
        __extends(BaseSyncAction, _super);
        function BaseSyncAction(id, label, className, gitService) {
            _super.call(this, id, label, className, gitService);
        }
        BaseSyncAction.prototype.isEnabled = function () {
            if (!_super.prototype.isEnabled.call(this)) {
                return false;
            }
            if (!this.gitService.isIdle()) {
                return false;
            }
            var model = this.gitService.getModel();
            var HEAD = model.getHEAD();
            if (!HEAD || !HEAD.name || !HEAD.upstream) {
                return false;
            }
            return true;
        };
        BaseSyncAction.prototype.run = function (context) {
            if (!this.enabled) {
                return winjs_base_1.Promise.as(null);
            }
            return this.gitService.sync().then(null, function (err) {
                if (err.gitErrorCode === git_1.GitErrorCodes.AuthenticationFailed) {
                    return winjs_base_1.Promise.wrapError(errors.create(nls.localize('authFailed', "Authentication failed on the git remote.")));
                }
                return winjs_base_1.Promise.wrapError(err);
            });
        };
        return BaseSyncAction;
    })(GitAction);
    exports.BaseSyncAction = BaseSyncAction;
    var SyncAction = (function (_super) {
        __extends(SyncAction, _super);
        function SyncAction(id, label, gitService) {
            _super.call(this, id, label, 'git-action sync', gitService);
        }
        SyncAction.ID = 'workbench.action.sync';
        SyncAction.LABEL = nls.localize('sync', "Sync");
        SyncAction = __decorate([
            __param(2, git_1.IGitService)
        ], SyncAction);
        return SyncAction;
    })(BaseSyncAction);
    exports.SyncAction = SyncAction;
    var LiveSyncAction = (function (_super) {
        __extends(LiveSyncAction, _super);
        function LiveSyncAction(gitService) {
            _super.call(this, LiveSyncAction.ID, nls.localize('sync', "Sync"), LiveSyncAction.CLASS_NAME, gitService);
        }
        LiveSyncAction.prototype.onGitServiceChange = function () {
            _super.prototype.onGitServiceChange.call(this);
            if (this.gitService.getRunningOperations().some(function (op) {
                return op.id === git_1.ServiceOperations.SYNC ||
                    op.id === git_1.ServiceOperations.PULL ||
                    op.id === git_1.ServiceOperations.PUSH;
            })) {
                this.label = '';
                this.class = LiveSyncAction.CLASS_NAME_LOADING;
                this.tooltip = nls.localize('synchronizing', "Synchronizing...");
            }
            else {
                this.class = LiveSyncAction.CLASS_NAME;
                var model = this.gitService.getModel();
                var HEAD = model.getHEAD();
                if (!HEAD) {
                    this.label = '';
                    this.tooltip = '';
                }
                else if (!HEAD.name) {
                    this.label = '';
                    this.tooltip = nls.localize('currentlyDetached', "Can't sync in detached mode.");
                }
                else if (!HEAD.upstream) {
                    this.label = '';
                    this.tooltip = nls.localize('noUpstream', "Current branch '{0} doesn't have an upstream branch configured.", HEAD.name);
                }
                else if (!HEAD.ahead && !HEAD.behind) {
                    this.label = '';
                    this.tooltip = nls.localize('currentBranch', "Current branch '{0}' is up to date.", HEAD.name);
                }
                else {
                    this.label = strings.format('{0}↓ {1}↑', HEAD.behind, HEAD.ahead);
                    if (model.getStatus().getGroups().some(function (g) { return g.all().length > 0; })) {
                        this.tooltip = nls.localize('dirtyChanges', "Please commit, undo or stash your changes before synchronizing.");
                    }
                    else if (HEAD.behind === 1 && HEAD.ahead === 1) {
                        this.tooltip = nls.localize('currentBranchSingle', "Current branch '{0}' is {1} commit behind and {2} commit ahead of '{3}'.", HEAD.name, HEAD.behind, HEAD.ahead, HEAD.upstream);
                    }
                    else if (HEAD.behind === 1) {
                        this.tooltip = nls.localize('currentBranchSinglePlural', "Current branch '{0}' is {1} commit behind and {2} commits ahead of '{3}'.", HEAD.name, HEAD.behind, HEAD.ahead, HEAD.upstream);
                    }
                    else if (HEAD.ahead === 1) {
                        this.tooltip = nls.localize('currentBranchPluralSingle', "Current branch '{0}' is {1} commits behind and {2} commit ahead of '{3}'.", HEAD.name, HEAD.behind, HEAD.ahead, HEAD.upstream);
                    }
                    else {
                        this.tooltip = nls.localize('currentBranchPlural', "Current branch '{0}' is {1} commits behind and {2} commits ahead of '{3}'.", HEAD.name, HEAD.behind, HEAD.ahead, HEAD.upstream);
                    }
                }
            }
        };
        LiveSyncAction.ID = 'workbench.action.liveSync';
        LiveSyncAction.CLASS_NAME = 'git-action live-sync';
        LiveSyncAction.CLASS_NAME_LOADING = 'git-action live-sync loading';
        LiveSyncAction = __decorate([
            __param(0, git_1.IGitService)
        ], LiveSyncAction);
        return LiveSyncAction;
    })(BaseSyncAction);
    exports.LiveSyncAction = LiveSyncAction;
    var UndoLastCommitAction = (function (_super) {
        __extends(UndoLastCommitAction, _super);
        function UndoLastCommitAction(gitService) {
            _super.call(this, UndoLastCommitAction.ID, nls.localize('undoLastCommit', "Undo Last Commit"), 'git-action undo-last-commit', gitService);
        }
        UndoLastCommitAction.prototype.run = function () {
            return this.gitService.reset('HEAD~');
        };
        UndoLastCommitAction.ID = 'workbench.action.undoLastCommit';
        UndoLastCommitAction = __decorate([
            __param(0, git_1.IGitService)
        ], UndoLastCommitAction);
        return UndoLastCommitAction;
    })(GitAction);
    exports.UndoLastCommitAction = UndoLastCommitAction;
    var StartGitCheckoutAction = (function (_super) {
        __extends(StartGitCheckoutAction, _super);
        function StartGitCheckoutAction(id, label, quickOpenService) {
            _super.call(this, id, label);
            this.quickOpenService = quickOpenService;
        }
        StartGitCheckoutAction.prototype.run = function (event) {
            this.quickOpenService.show('git checkout ');
            return winjs_base_1.Promise.as(null);
        };
        StartGitCheckoutAction.ID = 'workbench.action.git.startGitCheckout';
        StartGitCheckoutAction.LABEL = nls.localize('checkout', "Checkout");
        StartGitCheckoutAction = __decorate([
            __param(2, quickOpenService_1.IQuickOpenService)
        ], StartGitCheckoutAction);
        return StartGitCheckoutAction;
    })(actions_1.Action);
    exports.StartGitCheckoutAction = StartGitCheckoutAction;
    var StartGitBranchAction = (function (_super) {
        __extends(StartGitBranchAction, _super);
        function StartGitBranchAction(id, label, quickOpenService) {
            _super.call(this, id, label);
            this.quickOpenService = quickOpenService;
        }
        StartGitBranchAction.prototype.run = function (event) {
            this.quickOpenService.show('git branch ');
            return winjs_base_1.Promise.as(null);
        };
        StartGitBranchAction.ID = 'workbench.action.git.startGitBranch';
        StartGitBranchAction.LABEL = nls.localize('branch2', "Branch");
        StartGitBranchAction = __decorate([
            __param(2, quickOpenService_1.IQuickOpenService)
        ], StartGitBranchAction);
        return StartGitBranchAction;
    })(actions_1.Action);
    exports.StartGitBranchAction = StartGitBranchAction;
});
//# sourceMappingURL=gitActions.js.map