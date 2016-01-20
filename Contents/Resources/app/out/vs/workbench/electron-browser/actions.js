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
define(["require", "exports", 'vs/base/common/winjs.base', 'vs/base/common/timer', 'vs/base/common/paths', 'vs/base/common/actions', 'vs/workbench/services/window/electron-browser/windowService', 'vs/workbench/services/editor/common/editorService', 'vs/nls', 'vs/platform/message/common/message', 'vs/platform/workspace/common/workspace', 'vs/workbench/services/quickopen/common/quickOpenService', 'vs/platform/instantiation/common/instantiation', 'vs/platform/configuration/common/configuration', 'electron'], function (require, exports, winjs_base_1, timer, paths, actions_1, windowService_1, editorService_1, nls, message_1, workspace_1, quickOpenService_1, instantiation_1, configuration_1, electron_1) {
    var CloseEditorAction = (function (_super) {
        __extends(CloseEditorAction, _super);
        function CloseEditorAction(id, label, editorService, windowService) {
            _super.call(this, id, label);
            this.editorService = editorService;
            this.windowService = windowService;
        }
        CloseEditorAction.prototype.run = function () {
            var activeEditor = this.editorService.getActiveEditor();
            if (activeEditor) {
                return this.editorService.closeEditor(activeEditor);
            }
            this.windowService.getWindow().close();
            return winjs_base_1.Promise.as(false);
        };
        CloseEditorAction.ID = 'workbench.action.closeActiveEditor';
        CloseEditorAction.LABEL = nls.localize('closeActiveEditor', "Close Editor");
        CloseEditorAction = __decorate([
            __param(2, editorService_1.IWorkbenchEditorService),
            __param(3, windowService_1.IWindowService)
        ], CloseEditorAction);
        return CloseEditorAction;
    })(actions_1.Action);
    exports.CloseEditorAction = CloseEditorAction;
    var CloseWindowAction = (function (_super) {
        __extends(CloseWindowAction, _super);
        function CloseWindowAction(id, label, windowService) {
            _super.call(this, id, label);
            this.windowService = windowService;
        }
        CloseWindowAction.prototype.run = function () {
            this.windowService.getWindow().close();
            return winjs_base_1.Promise.as(true);
        };
        CloseWindowAction.ID = 'workbench.action.closeWindow';
        CloseWindowAction.LABEL = nls.localize('closeWindow', "Close Window");
        CloseWindowAction = __decorate([
            __param(2, windowService_1.IWindowService)
        ], CloseWindowAction);
        return CloseWindowAction;
    })(actions_1.Action);
    exports.CloseWindowAction = CloseWindowAction;
    var CloseFolderAction = (function (_super) {
        __extends(CloseFolderAction, _super);
        function CloseFolderAction(id, label, contextService, messageService, windowService) {
            _super.call(this, id, label);
            this.contextService = contextService;
            this.messageService = messageService;
            this.windowService = windowService;
        }
        CloseFolderAction.prototype.run = function () {
            if (this.contextService.getWorkspace()) {
                electron_1.ipcRenderer.send('vscode:closeFolder', this.windowService.getWindowId()); // handled from browser process
            }
            else {
                this.messageService.show(message_1.Severity.Info, nls.localize('noFolderOpened', "There is currently no folder opened in this instance to close."));
            }
            return winjs_base_1.Promise.as(true);
        };
        CloseFolderAction.ID = 'workbench.action.closeFolder';
        CloseFolderAction.LABEL = nls.localize('closeFolder', "Close Folder");
        CloseFolderAction = __decorate([
            __param(2, workspace_1.IWorkspaceContextService),
            __param(3, message_1.IMessageService),
            __param(4, windowService_1.IWindowService)
        ], CloseFolderAction);
        return CloseFolderAction;
    })(actions_1.Action);
    exports.CloseFolderAction = CloseFolderAction;
    var NewWindowAction = (function (_super) {
        __extends(NewWindowAction, _super);
        function NewWindowAction(id, label, windowService) {
            _super.call(this, id, label);
            this.windowService = windowService;
        }
        NewWindowAction.prototype.run = function () {
            this.windowService.getWindow().openNew();
            return winjs_base_1.Promise.as(true);
        };
        NewWindowAction.ID = 'workbench.action.newWindow';
        NewWindowAction.LABEL = nls.localize('newWindow', "New Window");
        NewWindowAction = __decorate([
            __param(2, windowService_1.IWindowService)
        ], NewWindowAction);
        return NewWindowAction;
    })(actions_1.Action);
    exports.NewWindowAction = NewWindowAction;
    var ToggleFullScreenAction = (function (_super) {
        __extends(ToggleFullScreenAction, _super);
        function ToggleFullScreenAction(id, label, windowService) {
            _super.call(this, id, label);
            this.windowService = windowService;
        }
        ToggleFullScreenAction.prototype.run = function () {
            electron_1.ipcRenderer.send('vscode:toggleFullScreen', this.windowService.getWindowId());
            return winjs_base_1.Promise.as(true);
        };
        ToggleFullScreenAction.ID = 'workbench.action.toggleFullScreen';
        ToggleFullScreenAction.LABEL = nls.localize('toggleFullScreen', "Toggle Full Screen");
        ToggleFullScreenAction = __decorate([
            __param(2, windowService_1.IWindowService)
        ], ToggleFullScreenAction);
        return ToggleFullScreenAction;
    })(actions_1.Action);
    exports.ToggleFullScreenAction = ToggleFullScreenAction;
    var ToggleMenuBarAction = (function (_super) {
        __extends(ToggleMenuBarAction, _super);
        function ToggleMenuBarAction(id, label, windowService) {
            _super.call(this, id, label);
            this.windowService = windowService;
        }
        ToggleMenuBarAction.prototype.run = function () {
            electron_1.ipcRenderer.send('vscode:toggleMenuBar', this.windowService.getWindowId());
            return winjs_base_1.Promise.as(true);
        };
        ToggleMenuBarAction.ID = 'workbench.action.toggleMenuBar';
        ToggleMenuBarAction.LABEL = nls.localize('toggleMenuBar', "Toggle Menu Bar");
        ToggleMenuBarAction = __decorate([
            __param(2, windowService_1.IWindowService)
        ], ToggleMenuBarAction);
        return ToggleMenuBarAction;
    })(actions_1.Action);
    exports.ToggleMenuBarAction = ToggleMenuBarAction;
    var ToggleDevToolsAction = (function (_super) {
        __extends(ToggleDevToolsAction, _super);
        function ToggleDevToolsAction(id, label, ns) {
            _super.call(this, id, label);
        }
        ToggleDevToolsAction.prototype.run = function () {
            electron_1.remote.getCurrentWindow().webContents.toggleDevTools();
            return winjs_base_1.Promise.as(true);
        };
        ToggleDevToolsAction.ID = 'workbench.action.toggleDevTools';
        ToggleDevToolsAction.LABEL = nls.localize('toggleDevTools', "Toggle Developer Tools");
        ToggleDevToolsAction = __decorate([
            __param(2, instantiation_1.INullService)
        ], ToggleDevToolsAction);
        return ToggleDevToolsAction;
    })(actions_1.Action);
    exports.ToggleDevToolsAction = ToggleDevToolsAction;
    var ZoomInAction = (function (_super) {
        __extends(ZoomInAction, _super);
        function ZoomInAction(id, label, ns) {
            _super.call(this, id, label);
        }
        ZoomInAction.prototype.run = function () {
            electron_1.webFrame.setZoomLevel(electron_1.webFrame.getZoomLevel() + 1);
            return winjs_base_1.Promise.as(true);
        };
        ZoomInAction.ID = 'workbench.action.zoomIn';
        ZoomInAction.LABEL = nls.localize('zoomIn', "Zoom in");
        ZoomInAction = __decorate([
            __param(2, instantiation_1.INullService)
        ], ZoomInAction);
        return ZoomInAction;
    })(actions_1.Action);
    exports.ZoomInAction = ZoomInAction;
    var BaseZoomAction = (function (_super) {
        __extends(BaseZoomAction, _super);
        function BaseZoomAction(id, label, configurationService) {
            _super.call(this, id, label);
            this.configurationService = configurationService;
        }
        BaseZoomAction.prototype.run = function () {
            return winjs_base_1.Promise.as(false); // Subclass to implement
        };
        BaseZoomAction.prototype.loadConfiguredZoomLevel = function () {
            return this.configurationService.loadConfiguration().then(function (windowConfig) {
                if (windowConfig.window && typeof windowConfig.window.zoomLevel === 'number') {
                    return windowConfig.window.zoomLevel;
                }
                return 0; // default
            });
        };
        BaseZoomAction = __decorate([
            __param(2, configuration_1.IConfigurationService)
        ], BaseZoomAction);
        return BaseZoomAction;
    })(actions_1.Action);
    exports.BaseZoomAction = BaseZoomAction;
    var ZoomOutAction = (function (_super) {
        __extends(ZoomOutAction, _super);
        function ZoomOutAction(id, label, configurationService) {
            _super.call(this, id, label, configurationService);
        }
        ZoomOutAction.prototype.run = function () {
            return this.loadConfiguredZoomLevel().then(function (level) {
                var newZoomLevelCandiate = electron_1.webFrame.getZoomLevel() - 1;
                if (newZoomLevelCandiate < 0 && newZoomLevelCandiate < level) {
                    newZoomLevelCandiate = Math.min(level, 0); // do not zoom below configured level or below 0
                }
                electron_1.webFrame.setZoomLevel(newZoomLevelCandiate);
            });
        };
        ZoomOutAction.ID = 'workbench.action.zoomOut';
        ZoomOutAction.LABEL = nls.localize('zoomOut', "Zoom out");
        ZoomOutAction = __decorate([
            __param(2, configuration_1.IConfigurationService)
        ], ZoomOutAction);
        return ZoomOutAction;
    })(BaseZoomAction);
    exports.ZoomOutAction = ZoomOutAction;
    var ZoomResetAction = (function (_super) {
        __extends(ZoomResetAction, _super);
        function ZoomResetAction(id, label, configurationService) {
            _super.call(this, id, label, configurationService);
        }
        ZoomResetAction.prototype.run = function () {
            return this.loadConfiguredZoomLevel().then(function (level) {
                electron_1.webFrame.setZoomLevel(level);
            });
        };
        ZoomResetAction.ID = 'workbench.action.zoomReset';
        ZoomResetAction.LABEL = nls.localize('zoomReset', "Reset Zoom");
        ZoomResetAction = __decorate([
            __param(2, configuration_1.IConfigurationService)
        ], ZoomResetAction);
        return ZoomResetAction;
    })(BaseZoomAction);
    exports.ZoomResetAction = ZoomResetAction;
    /* Copied from loader.ts */
    var LoaderEventType;
    (function (LoaderEventType) {
        LoaderEventType[LoaderEventType["LoaderAvailable"] = 1] = "LoaderAvailable";
        LoaderEventType[LoaderEventType["BeginLoadingScript"] = 10] = "BeginLoadingScript";
        LoaderEventType[LoaderEventType["EndLoadingScriptOK"] = 11] = "EndLoadingScriptOK";
        LoaderEventType[LoaderEventType["EndLoadingScriptError"] = 12] = "EndLoadingScriptError";
        LoaderEventType[LoaderEventType["BeginInvokeFactory"] = 21] = "BeginInvokeFactory";
        LoaderEventType[LoaderEventType["EndInvokeFactory"] = 22] = "EndInvokeFactory";
        LoaderEventType[LoaderEventType["NodeBeginEvaluatingScript"] = 31] = "NodeBeginEvaluatingScript";
        LoaderEventType[LoaderEventType["NodeEndEvaluatingScript"] = 32] = "NodeEndEvaluatingScript";
        LoaderEventType[LoaderEventType["NodeBeginNativeRequire"] = 33] = "NodeBeginNativeRequire";
        LoaderEventType[LoaderEventType["NodeEndNativeRequire"] = 34] = "NodeEndNativeRequire";
    })(LoaderEventType || (LoaderEventType = {}));
    var ShowStartupPerformance = (function (_super) {
        __extends(ShowStartupPerformance, _super);
        function ShowStartupPerformance(id, label, windowService, contextService) {
            _super.call(this, id, label);
            this.windowService = windowService;
            this.contextService = contextService;
            this.enabled = contextService.getConfiguration().env.enablePerformance;
        }
        ShowStartupPerformance.prototype._analyzeLoaderTimes = function () {
            var stats = require.getStats();
            var result = [];
            var total = 0;
            for (var i = 0, len = stats.length; i < len; i++) {
                if (stats[i].type === LoaderEventType.NodeEndNativeRequire) {
                    if (stats[i - 1].type === LoaderEventType.NodeBeginNativeRequire && stats[i - 1].detail === stats[i].detail) {
                        var entry = {};
                        entry['Event'] = 'nodeRequire ' + stats[i].detail;
                        entry['Took (ms)'] = (stats[i].timestamp - stats[i - 1].timestamp);
                        total += (stats[i].timestamp - stats[i - 1].timestamp);
                        entry['Start (ms)'] = '**' + stats[i - 1].timestamp;
                        entry['End (ms)'] = '**' + stats[i - 1].timestamp;
                        result.push(entry);
                    }
                }
            }
            if (total > 0) {
                var entry = {};
                entry['Event'] = '===nodeRequire TOTAL';
                entry['Took (ms)'] = total;
                entry['Start (ms)'] = '**';
                entry['End (ms)'] = '**';
                result.push(entry);
            }
            return result;
        };
        ShowStartupPerformance.prototype.run = function () {
            var table = [];
            table.push.apply(table, this._analyzeLoaderTimes());
            var start = Math.round(electron_1.remote.getGlobal('programStart') || electron_1.remote.getGlobal('vscodeStart'));
            var windowShowTime = Math.round(electron_1.remote.getGlobal('windowShow'));
            var lastEvent;
            var events = timer.getTimeKeeper().getCollectedEvents();
            events.forEach(function (e) {
                if (e.topic === 'Startup') {
                    lastEvent = e;
                    var entry = {};
                    entry['Event'] = e.name;
                    entry['Took (ms)'] = e.stopTime.getTime() - e.startTime.getTime();
                    entry['Start (ms)'] = Math.max(e.startTime.getTime() - start, 0);
                    entry['End (ms)'] = e.stopTime.getTime() - start;
                    table.push(entry);
                }
            });
            table.push({ Event: '---------------------------' });
            var windowShowEvent = {};
            windowShowEvent['Event'] = 'Show Window at';
            windowShowEvent['Start (ms)'] = windowShowTime - start;
            table.push(windowShowEvent);
            var sum = {};
            sum['Event'] = 'Total';
            sum['Took (ms)'] = lastEvent.stopTime.getTime() - start;
            table.push(sum);
            // Show dev tools
            this.windowService.getWindow().openDevTools();
            // Print to console
            setTimeout(function () {
                console.warn('Run the action again if you do not see the numbers!');
                console.table(table);
            }, 1000);
            return winjs_base_1.Promise.as(true);
        };
        ShowStartupPerformance.ID = 'workbench.action.appPerf';
        ShowStartupPerformance.LABEL = nls.localize('appPerf', "Startup Performance");
        ShowStartupPerformance = __decorate([
            __param(2, windowService_1.IWindowService),
            __param(3, workspace_1.IWorkspaceContextService)
        ], ShowStartupPerformance);
        return ShowStartupPerformance;
    })(actions_1.Action);
    exports.ShowStartupPerformance = ShowStartupPerformance;
    var ReloadWindowAction = (function (_super) {
        __extends(ReloadWindowAction, _super);
        function ReloadWindowAction(id, label, windowService) {
            _super.call(this, id, label);
            this.windowService = windowService;
        }
        ReloadWindowAction.prototype.run = function () {
            electron_1.ipcRenderer.send('vscode:reloadWindow', this.windowService.getWindowId());
            return winjs_base_1.Promise.as(null);
        };
        ReloadWindowAction.ID = 'workbench.action.reloadWindow';
        ReloadWindowAction.LABEL = nls.localize('reloadWindow', "Reload Window");
        ReloadWindowAction = __decorate([
            __param(2, windowService_1.IWindowService)
        ], ReloadWindowAction);
        return ReloadWindowAction;
    })(actions_1.Action);
    exports.ReloadWindowAction = ReloadWindowAction;
    var OpenRecentAction = (function (_super) {
        __extends(OpenRecentAction, _super);
        function OpenRecentAction(id, label, contextService, quickOpenService) {
            _super.call(this, id, label);
            this.contextService = contextService;
            this.quickOpenService = quickOpenService;
        }
        OpenRecentAction.prototype.run = function () {
            var picks = this.contextService.getConfiguration().env.recentPaths.map(function (p) {
                return {
                    label: paths.basename(p),
                    description: paths.dirname(p),
                    path: p
                };
            });
            var hasWorkspace = !!this.contextService.getWorkspace();
            return this.quickOpenService.pick(picks, {
                autoFocus: { autoFocusFirstEntry: !hasWorkspace, autoFocusSecondEntry: hasWorkspace },
                placeHolder: nls.localize('openRecentPlaceHolder', "Select a path to open"),
                matchOnDescription: true
            }).then(function (p) {
                if (p) {
                    electron_1.ipcRenderer.send('vscode:windowOpen', [p.path]);
                }
            });
        };
        OpenRecentAction.ID = 'workbench.action.openRecent';
        OpenRecentAction.LABEL = nls.localize('openRecent', "Open Recent");
        OpenRecentAction = __decorate([
            __param(2, workspace_1.IWorkspaceContextService),
            __param(3, quickOpenService_1.IQuickOpenService)
        ], OpenRecentAction);
        return OpenRecentAction;
    })(actions_1.Action);
    exports.OpenRecentAction = OpenRecentAction;
    var CloseMessagesAction = (function (_super) {
        __extends(CloseMessagesAction, _super);
        function CloseMessagesAction(id, label, messageService, editorService) {
            _super.call(this, id, label);
            this.messageService = messageService;
            this.editorService = editorService;
        }
        CloseMessagesAction.prototype.run = function () {
            // Close any Message if visible
            this.messageService.hideAll();
            // Restore focus if we got an editor
            var editor = this.editorService.getActiveEditor();
            if (editor) {
                editor.focus();
            }
            return winjs_base_1.Promise.as(null);
        };
        CloseMessagesAction.ID = 'workbench.action.closeMessages';
        CloseMessagesAction.LABEL = nls.localize('closeMessages', "Close Notification Messages");
        CloseMessagesAction = __decorate([
            __param(2, message_1.IMessageService),
            __param(3, editorService_1.IWorkbenchEditorService)
        ], CloseMessagesAction);
        return CloseMessagesAction;
    })(actions_1.Action);
    exports.CloseMessagesAction = CloseMessagesAction;
});
//# sourceMappingURL=actions.js.map