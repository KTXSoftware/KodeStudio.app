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
define(["require", "exports", 'vs/nls', 'vs/base/common/async', 'vs/base/common/errors', 'vs/base/common/paths', 'vs/base/common/lifecycle', 'vs/base/common/winjs.base', 'vs/workbench/common/contributions', 'vs/workbench/parts/git/common/git', 'vs/workbench/common/events', 'vs/editor/common/editorCommon', 'vs/editor/browser/widget/codeEditorWidget', 'vs/workbench/browser/viewlet', 'vs/workbench/browser/parts/statusbar/statusbar', 'vs/platform/platform', 'vs/workbench/parts/git/browser/gitWidgets', 'vs/workbench/common/actionRegistry', 'vs/workbench/parts/git/browser/gitOutput', 'vs/workbench/parts/output/common/output', 'vs/platform/actions/common/actions', 'vs/editor/browser/editorBrowserExtensions', 'vs/platform/configuration/common/configurationRegistry', 'vs/workbench/browser/quickopen', 'vs/workbench/parts/git/browser/gitEditorContributions', 'vs/workbench/services/activity/common/activityService', 'vs/platform/event/common/event', 'vs/platform/instantiation/common/instantiation', 'vs/platform/message/common/message', 'vs/platform/workspace/common/workspace', 'vs/workbench/services/viewlet/common/viewletService', 'vs/workbench/services/editor/common/editorService', 'vs/base/common/keyCodes', 'vs/css!./media/git.contribution'], function (require, exports, nls, async, errors, paths, lifecycle, winjs, ext, git, workbenchEvents, common, widget, viewlet, statusbar, platform, widgets, wbar, gitoutput, output, actions_1, editorBrowserExtensions_1, confregistry, quickopen, editorcontrib, activityService_1, event_1, instantiation_1, message_1, workspace_1, viewletService_1, editorService_1, keyCodes_1) {
    var IGitService = git.IGitService;
    var StatusUpdater = (function () {
        function StatusUpdater(gitService, eventService, activityService, messageService) {
            var _this = this;
            this.gitService = gitService;
            this.eventService = eventService;
            this.activityService = activityService;
            this.messageService = messageService;
            this.progressBadgeDelayer = new async.Delayer(200);
            this.toDispose = [];
            this.toDispose.push(this.gitService.addBulkListener2(function (e) { return _this.onGitServiceChange(); }));
        }
        StatusUpdater.prototype.onGitServiceChange = function () {
            var _this = this;
            if (this.gitService.getState() !== git.ServiceState.OK) {
                this.progressBadgeDelayer.cancel();
                this.activityService.showActivity('workbench.view.git', null, 'git-viewlet-label');
            }
            else if (this.gitService.isIdle()) {
                this.showChangesBadge();
            }
            else {
                this.progressBadgeDelayer.trigger(function () {
                    _this.activityService.showActivity('workbench.view.git', new activityService_1.ProgressBadge(function () { return nls.localize('gitProgressBadge', 'Running git status'); }), 'git-viewlet-label-progress');
                });
            }
        };
        StatusUpdater.prototype.showChangesBadge = function () {
            var count = this.gitService.getModel().getStatus().getGroups().map(function (g1) {
                return g1.all().length;
            }).reduce(function (a, b) { return a + b; }, 0);
            var badge = new activityService_1.NumberBadge(count, function (num) { return nls.localize('gitPendingChangesBadge', '{0} pending changes', num); });
            this.progressBadgeDelayer.cancel();
            this.activityService.showActivity('workbench.view.git', badge, 'git-viewlet-label');
        };
        StatusUpdater.prototype.getId = function () {
            return StatusUpdater.ID;
        };
        StatusUpdater.prototype.dispose = function () {
            this.toDispose = lifecycle.disposeAll(this.toDispose);
        };
        StatusUpdater.ID = 'Monaco.IDE.UI.Viewlets.GitViewlet.Workbench.StatusUpdater';
        StatusUpdater = __decorate([
            __param(0, IGitService),
            __param(1, event_1.IEventService),
            __param(2, activityService_1.IActivityService),
            __param(3, message_1.IMessageService)
        ], StatusUpdater);
        return StatusUpdater;
    })();
    exports.StatusUpdater = StatusUpdater;
    var DirtyDiffModelDecorator = (function () {
        function DirtyDiffModelDecorator(model, path, editorService, contextService, gitService) {
            var _this = this;
            this.editorService = editorService;
            this.contextService = contextService;
            this.gitService = gitService;
            this.model = model;
            this.path = path;
            this.decorations = [];
            this.firstRun = true;
            this.delayer = new async.ThrottledDelayer(500);
            this.diffDelayer = new async.ThrottledDelayer(200);
            this.toDispose = [];
            this.toDispose.push(model.addListener2(common.EventType.ModelContentChanged, function () { return _this.triggerDiff(); }));
            this.toDispose.push(this.gitService.addListener2(git.ServiceEvents.STATE_CHANGED, function () { return _this.onChanges(); }));
            this.toDispose.push(this.gitService.addListener2(git.ServiceEvents.OPERATION_END, function (e) {
                if (e.operation.id !== git.ServiceOperations.BACKGROUND_FETCH) {
                    _this.onChanges();
                }
            }));
            this.onChanges();
        }
        DirtyDiffModelDecorator.prototype.onChanges = function () {
            if (!this.gitService) {
                return;
            }
            if (this.gitService.getState() !== git.ServiceState.OK) {
                return;
            }
            // go through all interesting models
            this.trigger();
        };
        DirtyDiffModelDecorator.prototype.trigger = function () {
            var _this = this;
            this.delayer
                .trigger(function () { return _this.diffOriginalContents(); })
                .done(null, errors.onUnexpectedError);
        };
        DirtyDiffModelDecorator.prototype.diffOriginalContents = function () {
            var _this = this;
            return this.getOriginalContents()
                .then(function (contents) {
                if (!_this.model || _this.model.isDisposed()) {
                    return; // disposed
                }
                // return early if nothing has changed
                if (!_this.firstRun && _this.model.getProperty('original') === contents) {
                    return winjs.Promise.as(null);
                }
                _this.firstRun = false;
                _this.model.setProperty('original', contents);
                // wait a bit, for the 'original' property to propagate
                return winjs.Promise.timeout(500).then(function () { return _this.triggerDiff(); });
            });
        };
        DirtyDiffModelDecorator.prototype.getOriginalContents = function () {
            var gitModel = this.gitService.getModel();
            var treeish = gitModel.getStatus().find(this.path, git.StatusType.INDEX) ? '~' : 'HEAD';
            return this.gitService.buffer(this.path, treeish);
        };
        DirtyDiffModelDecorator.prototype.triggerDiff = function () {
            var _this = this;
            if (!this.diffDelayer) {
                return winjs.Promise.as(null);
            }
            return this.diffDelayer.trigger(function () {
                if (!_this.model || _this.model.isDisposed()) {
                    return winjs.Promise.as([]); // disposed
                }
                var mode = _this.model.getMode(); // might be null
                if (!mode || !mode.dirtyDiffSupport) {
                    return winjs.Promise.as([]);
                }
                return mode.dirtyDiffSupport.computeDirtyDiff(_this.model.getAssociatedResource(), true);
            }).then(function (diff) {
                if (!_this.model || _this.model.isDisposed()) {
                    return; // disposed
                }
                return _this.decorations = _this.model.deltaDecorations(_this.decorations, DirtyDiffModelDecorator.changesToDecorations(diff || []));
            });
        };
        DirtyDiffModelDecorator.changesToDecorations = function (diff) {
            return diff.map(function (change) {
                var startLineNumber = change.modifiedStartLineNumber;
                var endLineNumber = change.modifiedEndLineNumber || startLineNumber;
                // Added
                if (change.originalEndLineNumber === 0) {
                    return {
                        range: {
                            startLineNumber: startLineNumber, startColumn: 1,
                            endLineNumber: endLineNumber, endColumn: 1
                        },
                        options: DirtyDiffModelDecorator.ADDED_DECORATION_OPTIONS
                    };
                }
                // Removed
                if (change.modifiedEndLineNumber === 0) {
                    return {
                        range: {
                            startLineNumber: startLineNumber, startColumn: 1,
                            endLineNumber: startLineNumber, endColumn: 1
                        },
                        options: DirtyDiffModelDecorator.DELETED_DECORATION_OPTIONS
                    };
                }
                // Modified
                return {
                    range: {
                        startLineNumber: startLineNumber, startColumn: 1,
                        endLineNumber: endLineNumber, endColumn: 1
                    },
                    options: DirtyDiffModelDecorator.MODIFIED_DECORATION_OPTIONS
                };
            });
        };
        DirtyDiffModelDecorator.prototype.dispose = function () {
            this.toDispose = lifecycle.disposeAll(this.toDispose);
            if (this.model && !this.model.isDisposed()) {
                this.model.deltaDecorations(this.decorations, []);
            }
            this.model = null;
            this.decorations = null;
            if (this.delayer) {
                this.delayer.cancel();
                this.delayer = null;
            }
            if (this.diffDelayer) {
                this.diffDelayer.cancel();
                this.diffDelayer = null;
            }
        };
        DirtyDiffModelDecorator.ID = 'Monaco.IDE.UI.Viewlets.GitViewlet.Editor.DirtyDiffDecorator';
        DirtyDiffModelDecorator.MODIFIED_DECORATION_OPTIONS = {
            linesDecorationsClassName: 'git-dirty-modified-diff-glyph',
            isWholeLine: true,
            overviewRuler: {
                color: 'rgba(0, 122, 204, 0.6)',
                darkColor: 'rgba(0, 122, 204, 0.6)',
                position: common.OverviewRulerLane.Left
            }
        };
        DirtyDiffModelDecorator.ADDED_DECORATION_OPTIONS = {
            linesDecorationsClassName: 'git-dirty-added-diff-glyph',
            isWholeLine: true,
            overviewRuler: {
                color: 'rgba(0, 122, 204, 0.6)',
                darkColor: 'rgba(0, 122, 204, 0.6)',
                position: common.OverviewRulerLane.Left
            }
        };
        DirtyDiffModelDecorator.DELETED_DECORATION_OPTIONS = {
            linesDecorationsClassName: 'git-dirty-deleted-diff-glyph',
            isWholeLine: true,
            overviewRuler: {
                color: 'rgba(0, 122, 204, 0.6)',
                darkColor: 'rgba(0, 122, 204, 0.6)',
                position: common.OverviewRulerLane.Left
            }
        };
        DirtyDiffModelDecorator = __decorate([
            __param(2, editorService_1.IWorkbenchEditorService),
            __param(3, workspace_1.IWorkspaceContextService),
            __param(4, IGitService)
        ], DirtyDiffModelDecorator);
        return DirtyDiffModelDecorator;
    })();
    var DirtyDiffDecorator = (function () {
        function DirtyDiffDecorator(gitService, messageService, editorService, eventService, contextService, instantiationService) {
            var _this = this;
            this.gitService = gitService;
            this.messageService = messageService;
            this.editorService = editorService;
            this.eventService = eventService;
            this.contextService = contextService;
            this.instantiationService = instantiationService;
            this.models = [];
            this.decorators = Object.create(null);
            this.toDispose = [];
            this.toDispose.push(eventService.addListener2(workbenchEvents.EventType.EDITOR_INPUT_CHANGED, function () { return _this.onEditorInputChange(); }));
            this.toDispose.push(gitService.addListener2(git.ServiceEvents.DISPOSE, function () { return _this.dispose(); }));
        }
        DirtyDiffDecorator.prototype.getId = function () {
            return 'git.DirtyDiffModelDecorator';
        };
        DirtyDiffDecorator.prototype.onEditorInputChange = function () {
            // HACK: This is the best current way of figuring out whether to draw these decorations
            // or not. Needs context from the editor, to know whether it is a diff editor, in place editor
            // etc.
            var _this = this;
            var repositoryRoot = this.gitService.getModel().getRepositoryRoot();
            // If there is no repository root, just wait until that changes
            if (typeof repositoryRoot !== 'string') {
                this.gitService.addOneTimeListener(git.ServiceEvents.STATE_CHANGED, function () { return _this.onEditorInputChange(); });
                this.models.forEach(function (m) { return _this.onModelInvisible(m); });
                this.models = [];
                return;
            }
            var models = this.editorService.getVisibleEditors()
                .map(function (e) { return e.getControl(); })
                .filter(function (c) { return c instanceof widget.CodeEditorWidget; })
                .map(function (e) { return e.getModel(); })
                .filter(function (m, i, a) { return !!m && a.indexOf(m, i + 1) === -1; })
                .map(function (m) { return ({ model: m, resource: m.getAssociatedResource() }); })
                .filter(function (p) { return !!p.resource &&
                // and invalid resources
                (p.resource.scheme === 'file' && paths.isEqualOrParent(p.resource.fsPath, repositoryRoot)); })
                .map(function (p) { return ({ model: p.model, path: paths.normalize(paths.relative(repositoryRoot, p.resource.fsPath)) }); })
                .filter(function (p) { return !!p.path && p.path.indexOf('.git/') === -1; });
            var newModels = models.filter(function (p) { return _this.models.every(function (m) { return p.model !== m; }); });
            var oldModels = this.models.filter(function (m) { return models.every(function (p) { return p.model !== m; }); });
            newModels.forEach(function (p) { return _this.onModelVisible(p.model, p.path); });
            oldModels.forEach(function (m) { return _this.onModelInvisible(m); });
            this.models = models.map(function (p) { return p.model; });
        };
        DirtyDiffDecorator.prototype.onModelVisible = function (model, path) {
            this.decorators[model.id] = this.instantiationService.createInstance(DirtyDiffModelDecorator, model, path);
        };
        DirtyDiffDecorator.prototype.onModelInvisible = function (model) {
            this.decorators[model.id].dispose();
            delete this.decorators[model.id];
        };
        DirtyDiffDecorator.prototype.dispose = function () {
            var _this = this;
            this.toDispose = lifecycle.disposeAll(this.toDispose);
            this.models.forEach(function (m) { return _this.decorators[m.id].dispose(); });
            this.models = null;
            this.decorators = null;
        };
        DirtyDiffDecorator = __decorate([
            __param(0, IGitService),
            __param(1, message_1.IMessageService),
            __param(2, editorService_1.IWorkbenchEditorService),
            __param(3, event_1.IEventService),
            __param(4, workspace_1.IWorkspaceContextService),
            __param(5, instantiation_1.IInstantiationService)
        ], DirtyDiffDecorator);
        return DirtyDiffDecorator;
    })();
    exports.DirtyDiffDecorator = DirtyDiffDecorator;
    exports.VIEWLET_ID = 'workbench.view.git';
    var OpenGitViewletAction = (function (_super) {
        __extends(OpenGitViewletAction, _super);
        function OpenGitViewletAction(id, label, viewletService, editorService) {
            _super.call(this, id, label, exports.VIEWLET_ID, viewletService, editorService);
        }
        OpenGitViewletAction.ID = exports.VIEWLET_ID;
        OpenGitViewletAction.LABEL = nls.localize('toggleGitViewlet', "Show Git");
        OpenGitViewletAction = __decorate([
            __param(2, viewletService_1.IViewletService),
            __param(3, editorService_1.IWorkbenchEditorService)
        ], OpenGitViewletAction);
        return OpenGitViewletAction;
    })(viewlet.ToggleViewletAction);
    function registerContributions() {
        // Register Statusbar item
        platform.Registry.as(statusbar.Extensions.Statusbar).registerStatusbarItem(new statusbar.StatusbarItemDescriptor(widgets.GitStatusbarItem, statusbar.StatusbarAlignment.LEFT, 100 /* High Priority */));
        // Register Output Channel
        var outputChannelRegistry = platform.Registry.as(output.Extensions.OutputChannels);
        outputChannelRegistry.registerChannel('Git');
        // Register Git Output
        platform.Registry.as(ext.Extensions.Workbench).registerWorkbenchContribution(gitoutput.GitOutput);
        // Register Viewlet
        platform.Registry.as(viewlet.Extensions.Viewlets).registerViewlet(new viewlet.ViewletDescriptor('vs/workbench/parts/git/browser/gitViewlet', 'GitViewlet', exports.VIEWLET_ID, nls.localize('git', "Git"), 'git', 35));
        // Register Action to Open Viewlet
        platform.Registry.as(wbar.Extensions.WorkbenchActions).registerWorkbenchAction(new actions_1.SyncActionDescriptor(OpenGitViewletAction, OpenGitViewletAction.ID, OpenGitViewletAction.LABEL, {
            primary: null,
            win: { primary: keyCodes_1.KeyMod.CtrlCmd | keyCodes_1.KeyMod.Shift | keyCodes_1.KeyCode.KEY_G },
            linux: { primary: keyCodes_1.KeyMod.CtrlCmd | keyCodes_1.KeyMod.Shift | keyCodes_1.KeyCode.KEY_G },
            mac: { primary: keyCodes_1.KeyMod.WinCtrl | keyCodes_1.KeyMod.Shift | keyCodes_1.KeyCode.KEY_G }
        }), nls.localize('view', "View"));
        // Register MergeDecorator
        editorBrowserExtensions_1.EditorBrowserRegistry.registerEditorContribution(editorcontrib.MergeDecorator);
        // Register StatusUpdater
        platform.Registry.as(ext.Extensions.Workbench).registerWorkbenchContribution(StatusUpdater);
        // Register DirtyDiffDecorator
        platform.Registry.as(ext.Extensions.Workbench).registerWorkbenchContribution(DirtyDiffDecorator);
        // Register Quick Open for git
        platform.Registry.as(quickopen.Extensions.Quickopen).registerQuickOpenHandler(new quickopen.QuickOpenHandlerDescriptor('vs/workbench/parts/git/browser/gitQuickOpen', 'CommandQuickOpenHandler', 'git ', nls.localize('gitCommands', "Git Commands")));
        // Register configuration
        var configurationRegistry = platform.Registry.as(confregistry.Extensions.Configuration);
        configurationRegistry.registerConfiguration({
            id: 'git',
            order: 10,
            title: nls.localize('gitConfigurationTitle', "Git configuration"),
            type: 'object',
            properties: {
                "git.enabled": {
                    type: 'boolean',
                    description: nls.localize('gitEnabled', "Is git enabled"),
                    default: true
                },
                "git.path": {
                    type: 'string',
                    description: nls.localize('gitPath', "Path to the git executable"),
                    default: null
                },
                "git.autofetch": {
                    type: 'boolean',
                    description: nls.localize('gitAutoFetch', "Whether auto fetching is enabled."),
                    default: true
                }
            }
        });
    }
    exports.registerContributions = registerContributions;
});
//# sourceMappingURL=gitWorkbenchContributions.js.map