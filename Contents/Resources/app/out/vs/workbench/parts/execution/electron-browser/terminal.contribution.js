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
define(["require", "exports", 'vs/nls', 'vs/base/common/winjs.base', 'vs/platform/platform', 'vs/base/common/platform', 'vs/base/common/actions', 'vs/workbench/common/actionRegistry', 'vs/base/common/paths', 'vs/workbench/browser/actionBarRegistry', 'vs/base/common/uri', 'vs/workbench/parts/files/common/files', 'vs/workbench/services/workspace/common/contextService', 'vs/workbench/parts/execution/common/execution', 'vs/platform/actions/common/actions', 'vs/platform/instantiation/common/instantiation', 'vs/base/common/keyCodes'], function (require, exports, nls, winjs_base_1, platform_1, baseplatform, actions_1, actionRegistry_1, paths, actionBarRegistry_1, uri_1, files_1, contextService_1, execution_1, actions_2, instantiation_1, keyCodes_1) {
    var OpenConsoleAction = (function (_super) {
        __extends(OpenConsoleAction, _super);
        function OpenConsoleAction(id, label, terminalService, contextService) {
            _super.call(this, id, label);
            this.terminalService = terminalService;
            this.contextService = contextService;
            this.order = 49; // Allow other actions to position before or after
        }
        OpenConsoleAction.prototype.setResource = function (resource) {
            this.resource = resource;
            this.enabled = !paths.isUNC(this.resource.fsPath);
        };
        OpenConsoleAction.prototype.run = function (event) {
            var workspace = this.contextService.getWorkspace();
            var path = this.resource ? this.resource.fsPath : (workspace && workspace.resource.fsPath);
            if (!path) {
                return winjs_base_1.Promise.as(null);
            }
            this.terminalService.openTerminal(path);
            return winjs_base_1.Promise.as(null);
        };
        OpenConsoleAction.ID = 'workbench.action.terminal.openNativeConsole';
        OpenConsoleAction.Label = baseplatform.isWindows ? nls.localize('globalConsoleActionWin', "Open New Command Prompt") :
            nls.localize('globalConsoleActionMacLinux', "Open New Terminal");
        OpenConsoleAction.ScopedLabel = baseplatform.isWindows ? nls.localize('scopedConsoleActionWin', "Open in Command Prompt") :
            nls.localize('scopedConsoleActionMacLinux', "Open in Terminal");
        OpenConsoleAction = __decorate([
            __param(2, execution_1.ITerminalService),
            __param(3, contextService_1.IWorkspaceContextService)
        ], OpenConsoleAction);
        return OpenConsoleAction;
    })(actions_1.Action);
    exports.OpenConsoleAction = OpenConsoleAction;
    var FileViewerActionContributor = (function (_super) {
        __extends(FileViewerActionContributor, _super);
        function FileViewerActionContributor(instantiationService) {
            _super.call(this);
            this.instantiationService = instantiationService;
        }
        FileViewerActionContributor.prototype.hasSecondaryActions = function (context) {
            return !!files_1.asFileResource(context.element);
        };
        FileViewerActionContributor.prototype.getSecondaryActions = function (context) {
            var fileResource = files_1.asFileResource(context.element);
            var resource = fileResource.resource;
            if (!fileResource.isDirectory) {
                resource = uri_1.default.file(paths.dirname(resource.fsPath));
            }
            var action = this.instantiationService.createInstance(OpenConsoleAction, OpenConsoleAction.ID, OpenConsoleAction.ScopedLabel);
            action.setResource(resource);
            return [action];
        };
        FileViewerActionContributor = __decorate([
            __param(0, instantiation_1.IInstantiationService)
        ], FileViewerActionContributor);
        return FileViewerActionContributor;
    })(actionBarRegistry_1.ActionBarContributor);
    var actionBarRegistry = platform_1.Registry.as(actionBarRegistry_1.Extensions.Actionbar);
    actionBarRegistry.registerActionBarContributor(actionBarRegistry_1.Scope.VIEWER, FileViewerActionContributor);
    // Register Global Action to Open Console
    platform_1.Registry.as(actionRegistry_1.Extensions.WorkbenchActions).registerWorkbenchAction(new actions_2.SyncActionDescriptor(OpenConsoleAction, OpenConsoleAction.ID, OpenConsoleAction.Label, { primary: keyCodes_1.KeyMod.CtrlCmd | keyCodes_1.KeyMod.Shift | keyCodes_1.KeyCode.KEY_C }));
});
//# sourceMappingURL=terminal.contribution.js.map