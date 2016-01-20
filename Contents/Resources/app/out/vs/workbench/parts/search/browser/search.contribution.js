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
define(["require", "exports", 'vs/platform/platform', 'vs/workbench/browser/viewlet', 'vs/platform/configuration/common/configurationRegistry', 'vs/nls', 'vs/workbench/parts/files/common/files', 'vs/platform/actions/common/actions', 'vs/base/browser/ui/actionbar/actionbar', 'vs/workbench/browser/actionBarRegistry', 'vs/workbench/common/actionRegistry', 'vs/workbench/browser/quickopen', 'vs/workbench/browser/actions/quickOpenAction', 'vs/platform/keybinding/common/keybindingsRegistry', 'vs/platform/instantiation/common/instantiation', 'vs/platform/instantiation/common/descriptors', 'vs/platform/workspace/common/workspace', 'vs/platform/keybinding/common/keybindingService', 'vs/workbench/services/quickopen/common/quickOpenService', 'vs/workbench/services/viewlet/common/viewletService', 'vs/workbench/services/editor/common/editorService', 'vs/base/common/keyCodes', 'vs/css!./media/search.contribution'], function (require, exports, platform_1, viewlet_1, configurationRegistry_1, nls, files_1, actions_1, actionbar_1, actionBarRegistry_1, actionRegistry_1, quickopen_1, quickOpenAction_1, keybindingsRegistry_1, instantiation_1, descriptors_1, workspace_1, keybindingService_1, quickOpenService_1, viewletService_1, editorService_1, keyCodes_1) {
    exports.VIEWLET_ID = 'workbench.view.search';
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandDesc({
        id: 'workbench.action.search.toggleQueryDetails',
        weight: keybindingsRegistry_1.KeybindingsRegistry.WEIGHT.workbenchContrib(),
        context: keybindingService_1.KbExpr.has('searchViewletVisible'),
        primary: keyCodes_1.KeyMod.CtrlCmd | keyCodes_1.KeyMod.Shift | keyCodes_1.KeyCode.KEY_J,
        handler: function (accessor) {
            var viewletService = accessor.get(viewletService_1.IViewletService);
            viewletService.openViewlet(exports.VIEWLET_ID, true)
                .then(function (viewlet) { return viewlet.toggleFileTypes(); });
        }
    });
    var OpenSearchViewletAction = (function (_super) {
        __extends(OpenSearchViewletAction, _super);
        function OpenSearchViewletAction(id, label, viewletService, editorService) {
            _super.call(this, id, label, exports.VIEWLET_ID, viewletService, editorService);
        }
        OpenSearchViewletAction.ID = exports.VIEWLET_ID;
        OpenSearchViewletAction.LABEL = nls.localize('showSearchViewlet', "Show Search");
        OpenSearchViewletAction = __decorate([
            __param(2, viewletService_1.IViewletService),
            __param(3, editorService_1.IWorkbenchEditorService)
        ], OpenSearchViewletAction);
        return OpenSearchViewletAction;
    })(viewlet_1.ToggleViewletAction);
    var ExplorerViewerActionContributor = (function (_super) {
        __extends(ExplorerViewerActionContributor, _super);
        function ExplorerViewerActionContributor(instantiationService, contextService) {
            _super.call(this);
            this._instantiationService = instantiationService;
            this._contextService = contextService;
        }
        ExplorerViewerActionContributor.prototype.hasSecondaryActions = function (context) {
            var element = context.element;
            // Contribute only on file resources
            var fileResource = files_1.asFileResource(element);
            if (!fileResource) {
                return false;
            }
            return fileResource.isDirectory;
        };
        ExplorerViewerActionContributor.prototype.getSecondaryActions = function (context) {
            var actions = [];
            if (this.hasSecondaryActions(context)) {
                var fileResource = files_1.asFileResource(context.element);
                var action = new actions_1.DeferredAction(this._instantiationService, new descriptors_1.AsyncDescriptor('vs/workbench/parts/search/browser/searchViewlet', 'FindInFolderAction', fileResource.resource), 'workbench.search.action.findInFolder', nls.localize('findInFolder', "Find in Folder"));
                action.order = 55;
                actions.push(action);
                actions.push(new actionbar_1.Separator('', 56));
            }
            return actions;
        };
        ExplorerViewerActionContributor = __decorate([
            __param(0, instantiation_1.IInstantiationService),
            __param(1, workspace_1.IWorkspaceContextService)
        ], ExplorerViewerActionContributor);
        return ExplorerViewerActionContributor;
    })(actionBarRegistry_1.ActionBarContributor);
    var ACTION_ID = 'workbench.action.showAllSymbols';
    var ACTION_LABEL = nls.localize('showTriggerActions', "Show All Symbols");
    var ALL_SYMBOLS_PREFIX = '#';
    var ShowAllSymbolsAction = (function (_super) {
        __extends(ShowAllSymbolsAction, _super);
        function ShowAllSymbolsAction(actionId, actionLabel, quickOpenService) {
            _super.call(this, actionId, actionLabel, ALL_SYMBOLS_PREFIX, quickOpenService);
        }
        ShowAllSymbolsAction = __decorate([
            __param(2, quickOpenService_1.IQuickOpenService)
        ], ShowAllSymbolsAction);
        return ShowAllSymbolsAction;
    })(quickOpenAction_1.QuickOpenAction);
    // Register Viewlet
    platform_1.Registry.as(viewlet_1.Extensions.Viewlets).registerViewlet(new viewlet_1.ViewletDescriptor('vs/workbench/parts/search/browser/searchViewlet', 'SearchViewlet', exports.VIEWLET_ID, nls.localize('name', "Search"), 'search', 10));
    // Register Action to Open Viewlet
    var openSearchViewletKb = {
        primary: keyCodes_1.KeyMod.CtrlCmd | keyCodes_1.KeyMod.Shift | keyCodes_1.KeyCode.KEY_F
    };
    platform_1.Registry.as(actionRegistry_1.Extensions.WorkbenchActions).registerWorkbenchAction(new actions_1.SyncActionDescriptor(OpenSearchViewletAction, OpenSearchViewletAction.ID, OpenSearchViewletAction.LABEL, openSearchViewletKb), nls.localize('view', "View"));
    // Contribute to Explorer Viewer
    var actionBarRegistry = platform_1.Registry.as(actionBarRegistry_1.Extensions.Actionbar);
    actionBarRegistry.registerActionBarContributor(actionBarRegistry_1.Scope.VIEWER, ExplorerViewerActionContributor);
    // Register Quick Open Handler
    platform_1.Registry.as(quickopen_1.Extensions.Quickopen).registerDefaultQuickOpenHandler(new quickopen_1.QuickOpenHandlerDescriptor('vs/workbench/parts/search/browser/openAnythingHandler', 'OpenAnythingHandler', '', nls.localize('openAnythingHandlerDescription', "Open Files and Symbols by Name")));
    platform_1.Registry.as(quickopen_1.Extensions.Quickopen).registerQuickOpenHandler(new quickopen_1.QuickOpenHandlerDescriptor('vs/workbench/parts/search/browser/openAnythingHandler', 'OpenSymbolHandler', ALL_SYMBOLS_PREFIX, [
        {
            prefix: ALL_SYMBOLS_PREFIX,
            needsEditor: false,
            description: nls.localize('openSymbolDescriptionNormal', "Open Symbol By Name")
        }
    ]));
    // Actions
    var registry = platform_1.Registry.as(actionRegistry_1.Extensions.WorkbenchActions);
    registry.registerWorkbenchAction(new actions_1.SyncActionDescriptor(ShowAllSymbolsAction, ACTION_ID, ACTION_LABEL, {
        primary: keyCodes_1.KeyMod.CtrlCmd | keyCodes_1.KeyCode.KEY_T
    }));
    // Configuration
    var configurationRegistry = platform_1.Registry.as(configurationRegistry_1.Extensions.Configuration);
    configurationRegistry.registerConfiguration({
        'id': 'search',
        'order': 10,
        'title': nls.localize('searchConfigurationTitle', "Search configuration"),
        'type': 'object',
        'properties': {
            'search.exclude': {
                'id': 'glob-pattern',
                'type': 'object',
                'description': nls.localize('exclude', "Configure glob patterns for excluding files and folders in searches. Inherits all glob patterns from the file.exclude setting."),
                'default': { '**/node_modules': true, '**/bower_components': true },
                'additionalProperties': {
                    'anyOf': [
                        {
                            'type': 'boolean',
                            'description': nls.localize('exclude.boolean', "The glob pattern to match file paths against. Set to true or false to enable or disable the pattern."),
                        },
                        {
                            'type': 'object',
                            'properties': {
                                'when': {
                                    'type': 'string',
                                    'pattern': '\\w*\\$\\(basename\\)\\w*',
                                    'default': '$(basename).ext',
                                    'description': nls.localize('exclude.when', 'Additional check on the siblings of a matching file. Use $(basename) as variable for the matching file name.')
                                }
                            }
                        }
                    ]
                }
            }
        }
    });
});
//# sourceMappingURL=search.contribution.js.map