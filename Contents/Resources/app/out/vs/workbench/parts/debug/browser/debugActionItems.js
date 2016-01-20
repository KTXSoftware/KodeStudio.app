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
define(["require", "exports", 'vs/base/common/lifecycle', 'vs/base/common/errors', 'vs/base/browser/dom', 'vs/base/browser/ui/actionbar/actionbar', 'vs/workbench/parts/debug/common/debug', 'vs/platform/configuration/common/configuration'], function (require, exports, lifecycle, errors, dom, actionbar_1, debug_1, configuration_1) {
    var SelectConfigActionItem = (function (_super) {
        __extends(SelectConfigActionItem, _super);
        function SelectConfigActionItem(action, debugService, configurationService) {
            _super.call(this, null, action);
            this.debugService = debugService;
            this.select = document.createElement('select');
            this.select.className = 'debug-select action-bar-select';
            this.toDispose = [];
            this.registerListeners(configurationService);
        }
        SelectConfigActionItem.prototype.registerListeners = function (configurationService) {
            var _this = this;
            this.toDispose.push(dom.addStandardDisposableListener(this.select, 'change', function (e) {
                _this.actionRunner.run(_this._action, e.target.value).done(null, errors.onUnexpectedError);
            }));
            this.toDispose.push(this.debugService.addListener2(debug_1.ServiceEvents.STATE_CHANGED, function () {
                _this.select.disabled = _this.debugService.getState() !== debug_1.State.Inactive;
            }));
            this.toDispose.push(configurationService.addListener2(configuration_1.ConfigurationServiceEventTypes.UPDATED, function (e) {
                _this.setOptions().done(null, errors.onUnexpectedError);
            }));
        };
        SelectConfigActionItem.prototype.render = function (container) {
            dom.addClass(container, 'select-container');
            container.appendChild(this.select);
            this.setOptions().done(null, errors.onUnexpectedError);
        };
        SelectConfigActionItem.prototype.setOptions = function () {
            var _this = this;
            var previousSelectedIndex = this.select.selectedIndex;
            this.select.options.length = 0;
            return this.debugService.loadLaunchConfig().then(function (config) {
                if (!config || !config.configurations) {
                    _this.select.options.add(_this.createOption('<none>'));
                    _this.select.disabled = true;
                    return;
                }
                var configurations = config.configurations;
                _this.select.disabled = configurations.length < 1;
                var found = false;
                var configurationName = _this.debugService.getConfigurationName();
                for (var i = 0; i < configurations.length; i++) {
                    _this.select.options.add(_this.createOption(configurations[i].name));
                    if (configurationName === configurations[i].name) {
                        _this.select.selectedIndex = i;
                        found = true;
                    }
                }
                if (!found && configurations.length > 0) {
                    if (!previousSelectedIndex || previousSelectedIndex < 0 || previousSelectedIndex >= configurations.length) {
                        previousSelectedIndex = 0;
                    }
                    _this.select.selectedIndex = previousSelectedIndex;
                    return _this.actionRunner.run(_this._action, configurations[previousSelectedIndex].name);
                }
            });
        };
        SelectConfigActionItem.prototype.createOption = function (value) {
            var option = document.createElement('option');
            option.value = value;
            option.text = value;
            return option;
        };
        SelectConfigActionItem.prototype.dispose = function () {
            this.debugService = null;
            this.toDispose = lifecycle.disposeAll(this.toDispose);
            _super.prototype.dispose.call(this);
        };
        SelectConfigActionItem = __decorate([
            __param(1, debug_1.IDebugService),
            __param(2, configuration_1.IConfigurationService)
        ], SelectConfigActionItem);
        return SelectConfigActionItem;
    })(actionbar_1.BaseActionItem);
    exports.SelectConfigActionItem = SelectConfigActionItem;
});
//# sourceMappingURL=debugActionItems.js.map