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
define(["require", "exports", 'vs/nls', 'vs/base/common/platform', 'vs/base/browser/dom', 'vs/base/common/winjs.base', 'vs/base/browser/ui/button/button', 'vs/base/browser/builder', 'vs/base/browser/ui/splitview/splitview', 'vs/platform/platform', 'vs/workbench/common/actionRegistry', 'vs/platform/instantiation/common/instantiation', 'vs/platform/selection/common/selection'], function (require, exports, nls, env, DOM, winjs_base_1, button_1, builder_1, splitview_1, platform_1, actionRegistry_1, instantiation_1, selection_1) {
    var EmptyView = (function (_super) {
        __extends(EmptyView, _super);
        function EmptyView(instantiationService) {
            _super.call(this, {
                minimumSize: 2 * 22
            });
            this.instantiationService = instantiationService;
        }
        EmptyView.prototype.renderHeader = function (container) {
            var titleDiv = builder_1.$('div.title').appendTo(container);
            builder_1.$('span').text(nls.localize('noWorkspace', "No Folder Opened")).appendTo(titleDiv);
        };
        EmptyView.prototype.renderBody = function (container) {
            var _this = this;
            DOM.addClass(container, 'explorer-empty-view');
            var titleDiv = builder_1.$('div.section').appendTo(container);
            builder_1.$('p').text(nls.localize('noWorkspaceHelp', "You have not yet opened a folder.")).appendTo(titleDiv);
            var section = builder_1.$('div.section').appendTo(container);
            var button = new button_1.Button(section);
            button.label = nls.localize('openFolder', "Open Folder");
            button.on('click', function () {
                _this.runWorkbenchAction(env.isMacintosh ? 'workbench.action.files.openFileFolder' : 'workbench.action.files.openFolder');
            });
        };
        EmptyView.prototype.runWorkbenchAction = function (actionId) {
            var actionRegistry = platform_1.Registry.as(actionRegistry_1.Extensions.WorkbenchActions);
            var actionDescriptor = actionRegistry.getWorkbenchAction(actionId);
            var action = this.instantiationService.createInstance(actionDescriptor.syncDescriptor);
            return action.run().done(function () { return action.dispose(); });
        };
        EmptyView.prototype.create = function () {
            return winjs_base_1.Promise.as(null);
        };
        EmptyView.prototype.refresh = function (focus, reveal, instantProgress) {
            return winjs_base_1.Promise.as(null);
        };
        EmptyView.prototype.setVisible = function (visible) {
            return winjs_base_1.Promise.as(null);
        };
        EmptyView.prototype.focus = function () {
            // Ignore
        };
        EmptyView.prototype.getSelection = function () {
            return new selection_1.StructuredSelection([]);
        };
        EmptyView.prototype.reveal = function (element, relativeTop) {
            return winjs_base_1.Promise.as(null);
        };
        EmptyView.prototype.getActions = function () {
            return [];
        };
        EmptyView.prototype.getSecondaryActions = function () {
            return [];
        };
        EmptyView.prototype.getActionItem = function (action) {
            return null;
        };
        EmptyView.prototype.shutdown = function () {
            // Subclass to implement
        };
        EmptyView = __decorate([
            __param(0, instantiation_1.IInstantiationService)
        ], EmptyView);
        return EmptyView;
    })(splitview_1.CollapsibleView);
    exports.EmptyView = EmptyView;
});
//# sourceMappingURL=emptyView.js.map