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
define(["require", "exports", 'vs/base/common/winjs.base', 'vs/base/browser/builder', 'vs/base/common/errors', 'vs/base/common/events', 'vs/base/browser/ui/actionbar/actionbar', 'vs/workbench/browser/actionBarRegistry', 'vs/base/browser/ui/toolbar/toolbar', 'vs/platform/platform', 'vs/workbench/common/events', 'vs/workbench/browser/viewlet', 'vs/workbench/browser/part', 'vs/workbench/browser/parts/activitybar/activityAction', 'vs/workbench/services/viewlet/common/viewletService', 'vs/workbench/services/activity/common/activityService', 'vs/workbench/services/part/common/partService', 'vs/platform/message/common/message', 'vs/css!./media/activityBarPart'], function (require, exports, winjs_base_1, builder_1, errors, events, actionbar_1, actionBarRegistry_1, toolbar_1, platform_1, events_1, viewlet_1, part_1, activityAction_1, viewletService_1, activityService_1, partService_1, message_1) {
    var ActivitybarPart = (function (_super) {
        __extends(ActivitybarPart, _super);
        function ActivitybarPart(viewletService, messageService, telemetryService, eventService, contextMenuService, keybindingService, id) {
            _super.call(this, id);
            this.viewletService = viewletService;
            this.messageService = messageService;
            this.telemetryService = telemetryService;
            this.eventService = eventService;
            this.contextMenuService = contextMenuService;
            this.keybindingService = keybindingService;
            this.serviceId = activityService_1.IActivityService;
            this.activityActionItems = {};
            this.viewletIdToActions = {};
            this.registerListeners();
        }
        ActivitybarPart.prototype.setInstantiationService = function (service) {
            this.instantiationService = service;
        };
        ActivitybarPart.prototype.registerListeners = function () {
            var _this = this;
            // Activate viewlet action on opening of a viewlet
            this.toUnbind.push(this.eventService.addListener(events_1.EventType.VIEWLET_OPENING, function (e) { return _this.onViewletOpening(e); }));
            // Deactivate viewlet action on close
            this.toUnbind.push(this.eventService.addListener(events_1.EventType.VIEWLET_CLOSED, function (e) { return _this.onViewletClosed(e); }));
        };
        ActivitybarPart.prototype.onViewletOpening = function (e) {
            if (this.viewletIdToActions[e.viewletId]) {
                this.viewletIdToActions[e.viewletId].activate();
                // There can only be one active viewlet action
                for (var key in this.viewletIdToActions) {
                    if (this.viewletIdToActions.hasOwnProperty(key) && key !== e.viewletId) {
                        this.viewletIdToActions[key].deactivate();
                    }
                }
            }
        };
        ActivitybarPart.prototype.onViewletClosed = function (e) {
            if (this.viewletIdToActions[e.viewletId]) {
                this.viewletIdToActions[e.viewletId].deactivate();
            }
        };
        ActivitybarPart.prototype.showActivity = function (viewletId, badge, clazz) {
            var action = this.viewletIdToActions[viewletId];
            if (action) {
                action.setBadge(badge);
                if (clazz) {
                    action.class = clazz;
                }
            }
        };
        ActivitybarPart.prototype.clearActivity = function (viewletId) {
            this.showActivity(viewletId, null);
        };
        ActivitybarPart.prototype.createContentArea = function (parent) {
            var $el = builder_1.$(parent);
            var $result = builder_1.$('.content').appendTo($el);
            // Top Actionbar with action items for each viewlet action
            this.createViewletSwitcher($result.clone());
            // Bottom Toolbar with action items for global actions
            // this.createGlobalToolBarArea($result.clone()); // not used currently
            return $result;
        };
        ActivitybarPart.prototype.createViewletSwitcher = function (div) {
            var _this = this;
            // Viewlet switcher is on top
            this.viewletSwitcherBar = new actionbar_1.ActionBar(div, {
                actionItemProvider: function (action) { return _this.activityActionItems[action.id]; },
                disableTabIndex: true // we handle this
            });
            this.viewletSwitcherBar.getContainer().addClass('position-top');
            // Build Viewlet Actions in correct order
            var activeViewlet = this.viewletService.getActiveViewlet();
            var registry = platform_1.Registry.as(viewlet_1.Extensions.Viewlets);
            var viewletActions = registry.getViewlets()
                .sort(function (v1, v2) { return v1.order - v2.order; })
                .map(function (viewlet) {
                var action = _this.instantiationService.createInstance(ViewletActivityAction, viewlet.id + '.activity-bar-action', viewlet);
                var keybinding = null;
                var keys = _this.keybindingService.lookupKeybindings(viewlet.id).map(function (k) { return _this.keybindingService.getLabelFor(k); });
                if (keys && keys.length) {
                    keybinding = keys[0];
                }
                _this.activityActionItems[action.id] = new activityAction_1.ActivityActionItem(action, viewlet.name, keybinding);
                _this.viewletIdToActions[viewlet.id] = action;
                // Mark active viewlet action as active
                if (activeViewlet && activeViewlet.getId() === viewlet.id) {
                    action.activate();
                }
                return action;
            });
            // Add to viewlet switcher
            this.viewletSwitcherBar.push(viewletActions, { label: true, icon: true });
        };
        ActivitybarPart.prototype.createGlobalToolBarArea = function (div) {
            var _this = this;
            // Global action bar is on the bottom
            this.globalToolBar = new toolbar_1.ToolBar(div.getHTMLElement(), this.contextMenuService, {
                actionItemProvider: function (action) { return _this.activityActionItems[action.id]; },
                orientation: actionbar_1.ActionsOrientation.VERTICAL
            });
            this.globalToolBar.getContainer().removeAttribute('tabindex');
            this.globalToolBar.getContainer().addClass('global');
            this.globalToolBar.actionRunner.addListener(events.EventType.RUN, function (e) {
                // Check for Error
                if (e.error && !errors.isPromiseCanceledError(e.error)) {
                    _this.messageService.show(message_1.Severity.Error, e.error);
                }
                // Log in telemetry
                if (_this.telemetryService) {
                    _this.telemetryService.publicLog('workbenchActionExecuted', { id: e.action.id, from: 'activityBar' });
                }
            });
            // Build Global Actions in correct order
            var primaryActions = this.getGlobalActions(true);
            var secondaryActions = this.getGlobalActions(false);
            if (primaryActions.length + secondaryActions.length > 0) {
                this.globalToolBar.getContainer().addClass('position-bottom');
            }
            // Add to global action bar
            this.globalToolBar.setActions(actionBarRegistry_1.prepareActions(primaryActions), actionBarRegistry_1.prepareActions(secondaryActions))();
        };
        ActivitybarPart.prototype.getGlobalActions = function (primary) {
            var _this = this;
            var actionBarRegistry = platform_1.Registry.as(actionBarRegistry_1.Extensions.Actionbar);
            // Collect actions from actionbar contributor
            var actions;
            if (primary) {
                actions = actionBarRegistry.getActionBarActionsForContext(actionBarRegistry_1.Scope.GLOBAL, toolbar_1.CONTEXT);
            }
            else {
                actions = actionBarRegistry.getSecondaryActionBarActionsForContext(actionBarRegistry_1.Scope.GLOBAL, toolbar_1.CONTEXT);
            }
            return actions.map(function (action) {
                if (primary) {
                    var keybinding = null;
                    var keys = _this.keybindingService.lookupKeybindings(action.id).map(function (k) { return _this.keybindingService.getLabelFor(k); });
                    if (keys && keys.length) {
                        keybinding = keys[0];
                    }
                    var actionItem = actionBarRegistry.getActionItemForContext(actionBarRegistry_1.Scope.GLOBAL, toolbar_1.CONTEXT, action);
                    if (!actionItem) {
                        actionItem = new activityAction_1.ActivityActionItem(action, action.label, keybinding);
                    }
                    if (actionItem instanceof activityAction_1.ActivityActionItem) {
                        actionItem.keybinding = keybinding;
                    }
                    _this.activityActionItems[action.id] = actionItem;
                }
                return action;
            });
        };
        ActivitybarPart.prototype.dispose = function () {
            if (this.viewletSwitcherBar) {
                this.viewletSwitcherBar.dispose();
                this.viewletSwitcherBar = null;
            }
            if (this.globalToolBar) {
                this.globalToolBar.dispose();
                this.globalToolBar = null;
            }
            _super.prototype.dispose.call(this);
        };
        return ActivitybarPart;
    })(part_1.Part);
    exports.ActivitybarPart = ActivitybarPart;
    var ViewletActivityAction = (function (_super) {
        __extends(ViewletActivityAction, _super);
        function ViewletActivityAction(id, viewlet, viewletService, partService) {
            _super.call(this, id, viewlet.name, viewlet.cssClass);
            this.viewletService = viewletService;
            this.partService = partService;
            this.viewlet = viewlet;
        }
        ViewletActivityAction.prototype.run = function () {
            // cheap trick to prevent accident trigger on a doubleclick (to help nervous people)
            var now = new Date().getTime();
            if (now - ViewletActivityAction.lastRun < ViewletActivityAction.preventDoubleClickDelay) {
                return winjs_base_1.Promise.as(true);
            }
            ViewletActivityAction.lastRun = now;
            var sideBarHidden = this.partService.isSideBarHidden();
            var activeViewlet = this.viewletService.getActiveViewlet();
            // Hide sidebar if selected viewlet already visible
            if (!sideBarHidden && activeViewlet && activeViewlet.getId() === this.viewlet.id) {
                this.partService.setSideBarHidden(true);
            }
            else {
                this.viewletService.openViewlet(this.viewlet.id, true).done(null, errors.onUnexpectedError);
                this.activate();
            }
            return winjs_base_1.Promise.as(true);
        };
        ViewletActivityAction.preventDoubleClickDelay = 300;
        ViewletActivityAction.lastRun = 0;
        ViewletActivityAction = __decorate([
            __param(2, viewletService_1.IViewletService),
            __param(3, partService_1.IPartService)
        ], ViewletActivityAction);
        return ViewletActivityAction;
    })(activityAction_1.ActivityAction);
});
//# sourceMappingURL=activitybarPart.js.map