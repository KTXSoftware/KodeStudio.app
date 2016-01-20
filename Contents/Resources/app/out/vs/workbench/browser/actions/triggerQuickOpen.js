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
define(["require", "exports", 'vs/nls', 'vs/workbench/common/actionRegistry', 'vs/platform/platform', 'vs/base/common/actions', 'vs/base/common/winjs.base', 'vs/platform/keybinding/common/keybindingsRegistry', 'vs/workbench/services/quickopen/common/quickOpenService', 'vs/platform/keybinding/common/keybindingService', 'vs/platform/actions/common/actions', 'vs/base/common/keyCodes'], function (require, exports, nls, actionRegistry_1, platform_1, actions_1, winjs_base_1, keybindingsRegistry_1, quickOpenService_1, keybindingService_1, actions_2, keyCodes_1) {
    // Trigger Quick Open
    var GlobalQuickOpenAction = (function (_super) {
        __extends(GlobalQuickOpenAction, _super);
        function GlobalQuickOpenAction(id, label, quickOpenService) {
            _super.call(this, id, label);
            this.quickOpenService = quickOpenService;
            this.order = 100; // Allow other actions to position before or after
            this.class = 'quickopen';
        }
        GlobalQuickOpenAction.prototype.run = function () {
            this.quickOpenService.show(null);
            return winjs_base_1.Promise.as(true);
        };
        GlobalQuickOpenAction.ID = 'workbench.action.quickOpen';
        GlobalQuickOpenAction.LABEL = nls.localize('quickOpen', "Go to File...");
        GlobalQuickOpenAction = __decorate([
            __param(2, quickOpenService_1.IQuickOpenService)
        ], GlobalQuickOpenAction);
        return GlobalQuickOpenAction;
    })(actions_1.Action);
    // Open Previous Editor
    var OpenPreviousEditorAction = (function (_super) {
        __extends(OpenPreviousEditorAction, _super);
        function OpenPreviousEditorAction(id, label, quickOpenService, keybindingService) {
            _super.call(this, id, label);
            this.quickOpenService = quickOpenService;
            this.keybindingService = keybindingService;
        }
        OpenPreviousEditorAction.prototype.run = function () {
            var keys = this.keybindingService.lookupKeybindings(this.id);
            this.quickOpenService.show(null, {
                keybindings: keys
            });
            return winjs_base_1.Promise.as(true);
        };
        OpenPreviousEditorAction.ID = 'workbench.action.openPreviousEditor';
        OpenPreviousEditorAction.LABEL = nls.localize('navigateEditorHistoryByInput', "Navigate History");
        OpenPreviousEditorAction = __decorate([
            __param(2, quickOpenService_1.IQuickOpenService),
            __param(3, keybindingService_1.IKeybindingService)
        ], OpenPreviousEditorAction);
        return OpenPreviousEditorAction;
    })(actions_1.Action);
    var BaseQuickOpenNavigateAction = (function (_super) {
        __extends(BaseQuickOpenNavigateAction, _super);
        function BaseQuickOpenNavigateAction(id, label, navigateNext, quickOpenService, keybindingService) {
            _super.call(this, id, label);
            this.quickOpenService = quickOpenService;
            this.keybindingService = keybindingService;
            this.navigateNext = navigateNext;
        }
        BaseQuickOpenNavigateAction.prototype.run = function (event) {
            var keys = this.keybindingService.lookupKeybindings(this.id);
            this.quickOpenService.quickNavigate({
                keybindings: keys
            }, this.navigateNext);
            return winjs_base_1.Promise.as(true);
        };
        BaseQuickOpenNavigateAction = __decorate([
            __param(3, quickOpenService_1.IQuickOpenService),
            __param(4, keybindingService_1.IKeybindingService)
        ], BaseQuickOpenNavigateAction);
        return BaseQuickOpenNavigateAction;
    })(actions_1.Action);
    var QuickOpenNavigateNextAction = (function (_super) {
        __extends(QuickOpenNavigateNextAction, _super);
        function QuickOpenNavigateNextAction(id, label, quickOpenService, keybindingService) {
            _super.call(this, id, label, true, quickOpenService, keybindingService);
        }
        QuickOpenNavigateNextAction.ID = 'workbench.action.quickOpenNavigateNext';
        QuickOpenNavigateNextAction.LABEL = nls.localize('quickNavigateNext', "Navigate Next in Quick Open");
        QuickOpenNavigateNextAction = __decorate([
            __param(2, quickOpenService_1.IQuickOpenService),
            __param(3, keybindingService_1.IKeybindingService)
        ], QuickOpenNavigateNextAction);
        return QuickOpenNavigateNextAction;
    })(BaseQuickOpenNavigateAction);
    var QuickOpenNavigatePreviousAction = (function (_super) {
        __extends(QuickOpenNavigatePreviousAction, _super);
        function QuickOpenNavigatePreviousAction(id, label, quickOpenService, keybindingService) {
            _super.call(this, id, label, false, quickOpenService, keybindingService);
        }
        QuickOpenNavigatePreviousAction.ID = 'workbench.action.quickOpenNavigatePrevious';
        QuickOpenNavigatePreviousAction.LABEL = nls.localize('quickNavigatePrevious', "Navigate Previous in Quick Open");
        QuickOpenNavigatePreviousAction = __decorate([
            __param(2, quickOpenService_1.IQuickOpenService),
            __param(3, keybindingService_1.IKeybindingService)
        ], QuickOpenNavigatePreviousAction);
        return QuickOpenNavigatePreviousAction;
    })(BaseQuickOpenNavigateAction);
    var quickOpenKb = {
        primary: keyCodes_1.KeyMod.CtrlCmd | keyCodes_1.KeyCode.KEY_P,
        secondary: [keyCodes_1.KeyMod.CtrlCmd | keyCodes_1.KeyCode.KEY_E]
    };
    var QUICK_NAVIGATE_KEY = keyCodes_1.KeyCode.Tab;
    var prevEditorKb = {
        primary: keyCodes_1.KeyMod.CtrlCmd | QUICK_NAVIGATE_KEY,
        secondary: [keyCodes_1.KeyMod.CtrlCmd | keyCodes_1.KeyMod.Shift | QUICK_NAVIGATE_KEY],
        mac: {
            primary: keyCodes_1.KeyMod.WinCtrl | QUICK_NAVIGATE_KEY,
            secondary: [keyCodes_1.KeyMod.WinCtrl | keyCodes_1.KeyMod.Shift | QUICK_NAVIGATE_KEY]
        }
    };
    function navigateKeybinding(shift) {
        if (shift) {
            return {
                primary: keyCodes_1.KeyMod.CtrlCmd | keyCodes_1.KeyMod.Shift | keyCodes_1.KeyCode.KEY_P,
                secondary: [keyCodes_1.KeyMod.CtrlCmd | keyCodes_1.KeyMod.Shift | keyCodes_1.KeyCode.KEY_E, keyCodes_1.KeyMod.CtrlCmd | keyCodes_1.KeyMod.Shift | QUICK_NAVIGATE_KEY],
                mac: {
                    primary: keyCodes_1.KeyMod.CtrlCmd | keyCodes_1.KeyMod.Shift | keyCodes_1.KeyCode.KEY_P,
                    secondary: [keyCodes_1.KeyMod.CtrlCmd | keyCodes_1.KeyMod.Shift | keyCodes_1.KeyCode.KEY_E, keyCodes_1.KeyMod.WinCtrl | keyCodes_1.KeyMod.Shift | QUICK_NAVIGATE_KEY]
                }
            };
        }
        else {
            return {
                primary: keyCodes_1.KeyMod.CtrlCmd | keyCodes_1.KeyCode.KEY_P,
                secondary: [keyCodes_1.KeyMod.CtrlCmd | keyCodes_1.KeyCode.KEY_E, keyCodes_1.KeyMod.CtrlCmd | QUICK_NAVIGATE_KEY],
                mac: {
                    primary: keyCodes_1.KeyMod.CtrlCmd | keyCodes_1.KeyCode.KEY_P,
                    secondary: [keyCodes_1.KeyMod.CtrlCmd | keyCodes_1.KeyCode.KEY_E, keyCodes_1.KeyMod.WinCtrl | QUICK_NAVIGATE_KEY]
                }
            };
        }
    }
    // Contribute Quick Open
    var registry = platform_1.Registry.as(actionRegistry_1.Extensions.WorkbenchActions);
    registry.registerWorkbenchAction(new actions_2.SyncActionDescriptor(GlobalQuickOpenAction, GlobalQuickOpenAction.ID, GlobalQuickOpenAction.LABEL, quickOpenKb));
    // Contribute Quick Navigate
    registry.registerWorkbenchAction(new actions_2.SyncActionDescriptor(OpenPreviousEditorAction, OpenPreviousEditorAction.ID, OpenPreviousEditorAction.LABEL, prevEditorKb));
    // Contribute Quick Navigate in Quick Open
    registry.registerWorkbenchAction(new actions_2.SyncActionDescriptor(QuickOpenNavigateNextAction, QuickOpenNavigateNextAction.ID, QuickOpenNavigateNextAction.LABEL, navigateKeybinding(false), keybindingService_1.KbExpr.has('inQuickOpen')));
    registry.registerWorkbenchAction(new actions_2.SyncActionDescriptor(QuickOpenNavigatePreviousAction, QuickOpenNavigatePreviousAction.ID, QuickOpenNavigatePreviousAction.LABEL, navigateKeybinding(true), keybindingService_1.KbExpr.has('inQuickOpen'), keybindingsRegistry_1.KeybindingsRegistry.WEIGHT.workbenchContrib(50)));
});
//# sourceMappingURL=triggerQuickOpen.js.map