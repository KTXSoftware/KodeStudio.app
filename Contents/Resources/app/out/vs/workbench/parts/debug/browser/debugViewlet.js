/*!--------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/
(function() {
var __m = ["vs/css!vs/workbench/parts/debug/browser/media/debugViewlet","vs/nls!vs/workbench/parts/debug/browser/debugActionItems","vs/nls!vs/workbench/parts/debug/browser/debugViewlet","vs/workbench/parts/debug/browser/debugActionItems","require","exports","vs/workbench/parts/debug/common/debug","vs/nls","vs/base/common/errors","vs/base/browser/ui/actionbar/actionbar","vs/platform/storage/common/storage","vs/platform/configuration/common/configuration","vs/workbench/parts/debug/browser/debugViewlet","vs/css!vs/workbench/parts/debug/browser/debugViewlet","vs/base/common/winjs.base","vs/base/common/lifecycle","vs/base/browser/ui/splitview/splitview","vs/workbench/common/memento","vs/workbench/browser/viewlet","vs/workbench/parts/debug/browser/debugViewRegistry","vs/workbench/parts/debug/browser/debugActions","vs/platform/instantiation/common/instantiation","vs/platform/progress/common/progress","vs/platform/workspace/common/workspace","vs/platform/telemetry/common/telemetry","vs/base/browser/builder"];
var __M = function(deps) {
  var result = [];
  for (var i = 0, len = deps.length; i < len; i++) {
    result[i] = __m[deps[i]];
  }
  return result;
};
define(__m[0], __M([13]), {});
define(__m[1], __M([7,2]), function(nls, data) { return nls.create("vs/workbench/parts/debug/browser/debugActionItems", data); });

/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
define(__m[3], __M([4,5,1,8,9,6,11]), function (require, exports, nls, errors, actionbar_1, debug_1, configuration_1) {
    "use strict";
    var DebugSelectActionItem = (function (_super) {
        __extends(DebugSelectActionItem, _super);
        function DebugSelectActionItem(action, debugService, configurationService) {
            _super.call(this, null, action, [], -1);
            this.debugService = debugService;
            this.registerConfigurationListeners(configurationService);
        }
        DebugSelectActionItem.prototype.registerConfigurationListeners = function (configurationService) {
            var _this = this;
            this.toDispose.push(configurationService.onDidUpdateConfiguration(function (e) {
                _this.updateOptions(true).done(null, errors.onUnexpectedError);
            }));
            this.toDispose.push(this.debugService.getConfigurationManager().onDidConfigurationChange(function (name) {
                _this.updateOptions(false).done(null, errors.onUnexpectedError);
            }));
        };
        DebugSelectActionItem.prototype.render = function (container) {
            _super.prototype.render.call(this, container);
            this.updateOptions(true).done(null, errors.onUnexpectedError);
        };
        DebugSelectActionItem.prototype.updateOptions = function (changeDebugConfiguration) {
            var _this = this;
            return this.debugService.getConfigurationManager().loadLaunchConfig().then(function (config) {
                if (!config || !config.configurations || config.configurations.length === 0) {
                    _this.setOptions([nls.localize(0, null)], 0);
                    return changeDebugConfiguration ? _this.actionRunner.run(_this._action, null) : null;
                }
                var configurationNames = config.configurations.map(function (cfg) { return cfg.name; });
                var configurationName = _this.debugService.getConfigurationManager().configurationName;
                var selected = configurationNames.indexOf(configurationName);
                _this.setOptions(configurationNames, selected);
                if (changeDebugConfiguration) {
                    return _this.actionRunner.run(_this._action, _this.getSelected());
                }
            });
        };
        DebugSelectActionItem = __decorate([
            __param(1, debug_1.IDebugService),
            __param(2, configuration_1.IConfigurationService)
        ], DebugSelectActionItem);
        return DebugSelectActionItem;
    }(actionbar_1.SelectActionItem));
    exports.DebugSelectActionItem = DebugSelectActionItem;
});

/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/














define(__m[12], __M([4,5,2,25,14,15,16,17,18,6,19,20,3,21,22,23,24,10,0]), function (require, exports, nls, builder, winjs_base_1, lifecycle, splitview_1, memento, viewlet_1, debug, debugViewRegistry_1, debugactions, dbgactionitems, instantiation_1, progress_1, workspace_1, telemetry_1, storage_1) {
    "use strict";
    var IDebugService = debug.IDebugService;
    var $ = builder.$;
    var DebugViewlet = (function (_super) {
        __extends(DebugViewlet, _super);
        function DebugViewlet(telemetryService, progressService, debugService, instantiationService, contextService, storageService) {
            var _this = this;
            _super.call(this, debug.VIEWLET_ID, telemetryService);
            this.progressService = progressService;
            this.debugService = debugService;
            this.instantiationService = instantiationService;
            this.contextService = contextService;
            this.progressRunner = null;
            this.viewletSettings = this.getMemento(storageService, memento.Scope.WORKSPACE);
            this.toDispose = [];
            this.views = [];
            this.toDispose.push(this.debugService.onDidChangeState(function (state) {
                _this.onDebugServiceStateChange(state);
            }));
        }
        // viewlet
        DebugViewlet.prototype.create = function (parent) {
            var _this = this;
            _super.prototype.create.call(this, parent);
            this.$el = parent.div().addClass('debug-viewlet');
            if (this.contextService.getWorkspace()) {
                var actionRunner_1 = this.getActionRunner();
                this.views = debugViewRegistry_1.DebugViewRegistry.getDebugViews().map(function (viewConstructor) { return _this.instantiationService.createInstance(viewConstructor, actionRunner_1, _this.viewletSettings); });
                this.splitView = new splitview_1.SplitView(this.$el.getHTMLElement());
                this.toDispose.push(this.splitView);
                this.views.forEach(function (v) { return _this.splitView.addView(v); });
                // Track focus
                this.toDispose.push(this.splitView.onFocus(function (view) {
                    _this.lastFocusedView = view;
                }));
            }
            else {
                this.$el.append($([
                    '<div class="noworkspace-view">',
                    '<p>', nls.localize(0, null), '</p>',
                    '<p>', nls.localize(1, null), '</p>',
                    '</div>'
                ].join('')));
            }
            return winjs_base_1.TPromise.as(null);
        };
        DebugViewlet.prototype.setVisible = function (visible) {
            var _this = this;
            return _super.prototype.setVisible.call(this, visible).then(function () {
                return winjs_base_1.TPromise.join(_this.views.map(function (view) { return view.setVisible(visible); }));
            });
        };
        DebugViewlet.prototype.layout = function (dimension) {
            if (this.splitView) {
                this.splitView.layout(dimension.height);
            }
        };
        DebugViewlet.prototype.focus = function () {
            _super.prototype.focus.call(this);
            if (this.lastFocusedView && this.lastFocusedView.isExpanded()) {
                this.lastFocusedView.focusBody();
                return;
            }
            if (this.views.length > 0) {
                this.views[0].focusBody();
            }
        };
        DebugViewlet.prototype.getActions = function () {
            var _this = this;
            if (this.debugService.state === debug.State.Disabled) {
                return [];
            }
            if (!this.actions) {
                this.actions = [
                    this.instantiationService.createInstance(debugactions.StartDebugAction, debugactions.StartDebugAction.ID, debugactions.StartDebugAction.LABEL),
                    this.instantiationService.createInstance(debugactions.SelectConfigAction, debugactions.SelectConfigAction.ID, debugactions.SelectConfigAction.LABEL),
                    this.instantiationService.createInstance(debugactions.ConfigureAction, debugactions.ConfigureAction.ID, debugactions.ConfigureAction.LABEL),
                    this.instantiationService.createInstance(debugactions.ToggleReplAction, debugactions.ToggleReplAction.ID, debugactions.ToggleReplAction.LABEL)
                ];
                this.actions.forEach(function (a) {
                    _this.toDispose.push(a);
                });
            }
            return this.actions;
        };
        DebugViewlet.prototype.getActionItem = function (action) {
            if (action.id === debugactions.SelectConfigAction.ID) {
                return this.instantiationService.createInstance(dbgactionitems.DebugSelectActionItem, action);
            }
            return null;
        };
        DebugViewlet.prototype.onDebugServiceStateChange = function (newState) {
            if (this.progressRunner) {
                this.progressRunner.done();
            }
            if (newState === debug.State.Initializing) {
                this.progressRunner = this.progressService.show(true);
            }
            else {
                this.progressRunner = null;
            }
        };
        DebugViewlet.prototype.dispose = function () {
            this.toDispose = lifecycle.dispose(this.toDispose);
            _super.prototype.dispose.call(this);
        };
        DebugViewlet.prototype.shutdown = function () {
            this.views.forEach(function (v) { return v.shutdown(); });
            _super.prototype.shutdown.call(this);
        };
        DebugViewlet = __decorate([
            __param(0, telemetry_1.ITelemetryService),
            __param(1, progress_1.IProgressService),
            __param(2, IDebugService),
            __param(3, instantiation_1.IInstantiationService),
            __param(4, workspace_1.IWorkspaceContextService),
            __param(5, storage_1.IStorageService)
        ], DebugViewlet);
        return DebugViewlet;
    }(viewlet_1.Viewlet));
    exports.DebugViewlet = DebugViewlet;
});

}).call(this);
//# sourceMappingURL=debugViewlet.js.map
