/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
'use strict';
define(["require", "exports", 'vs/platform/platform', 'vs/nls', 'vs/platform/actions/common/actions', 'vs/platform/configuration/common/configurationRegistry', 'vs/workbench/common/actionRegistry', 'vs/base/common/keyCodes', 'vs/base/common/platform', 'vs/platform/keybinding/common/keybindingService', 'vs/workbench/services/message/browser/messageService', 'vs/workbench/electron-browser/actions'], function (require, exports, platform_1, nls, actions_1, configurationRegistry_1, actionRegistry_1, keyCodes_1, platform, keybindingService_1, messageService_1, actions_2) {
    // Contribute Global Actions
    var viewCategory = nls.localize('view', "View");
    var developerCategory = nls.localize('developer', "Developer");
    var fileCategory = nls.localize('file', "File");
    var workbenchActionsRegistry = platform_1.Registry.as(actionRegistry_1.Extensions.WorkbenchActions);
    workbenchActionsRegistry.registerWorkbenchAction(new actions_1.SyncActionDescriptor(actions_2.NewWindowAction, actions_2.NewWindowAction.ID, actions_2.NewWindowAction.LABEL, { primary: keyCodes_1.KeyMod.CtrlCmd | keyCodes_1.KeyMod.Shift | keyCodes_1.KeyCode.KEY_N }));
    workbenchActionsRegistry.registerWorkbenchAction(new actions_1.SyncActionDescriptor(actions_2.CloseWindowAction, actions_2.CloseWindowAction.ID, actions_2.CloseWindowAction.LABEL, { primary: keyCodes_1.KeyMod.CtrlCmd | keyCodes_1.KeyMod.Shift | keyCodes_1.KeyCode.KEY_W }));
    workbenchActionsRegistry.registerWorkbenchAction(new actions_1.SyncActionDescriptor(actions_2.CloseFolderAction, actions_2.CloseFolderAction.ID, actions_2.CloseFolderAction.LABEL, { primary: keyCodes_1.KeyMod.chord(keyCodes_1.KeyMod.CtrlCmd | keyCodes_1.KeyCode.KEY_K, keyCodes_1.KeyCode.KEY_F) }), fileCategory);
    workbenchActionsRegistry.registerWorkbenchAction(new actions_1.SyncActionDescriptor(actions_2.OpenRecentAction, actions_2.OpenRecentAction.ID, actions_2.OpenRecentAction.LABEL), fileCategory);
    workbenchActionsRegistry.registerWorkbenchAction(new actions_1.SyncActionDescriptor(actions_2.ToggleDevToolsAction, actions_2.ToggleDevToolsAction.ID, actions_2.ToggleDevToolsAction.LABEL), developerCategory);
    workbenchActionsRegistry.registerWorkbenchAction(new actions_1.SyncActionDescriptor(actions_2.ZoomInAction, actions_2.ZoomInAction.ID, actions_2.ZoomInAction.LABEL, { primary: keyCodes_1.KeyMod.CtrlCmd | keyCodes_1.KeyCode.US_EQUAL }), viewCategory);
    workbenchActionsRegistry.registerWorkbenchAction(new actions_1.SyncActionDescriptor(actions_2.ZoomOutAction, actions_2.ZoomOutAction.ID, actions_2.ZoomOutAction.LABEL, { primary: keyCodes_1.KeyMod.CtrlCmd | keyCodes_1.KeyCode.US_MINUS }), viewCategory);
    workbenchActionsRegistry.registerWorkbenchAction(new actions_1.SyncActionDescriptor(actions_2.ZoomResetAction, actions_2.ZoomResetAction.ID, actions_2.ZoomResetAction.LABEL), viewCategory);
    workbenchActionsRegistry.registerWorkbenchAction(new actions_1.SyncActionDescriptor(actions_2.ShowStartupPerformance, actions_2.ShowStartupPerformance.ID, actions_2.ShowStartupPerformance.LABEL), developerCategory);
    workbenchActionsRegistry.registerWorkbenchAction(new actions_1.SyncActionDescriptor(actions_2.ReloadWindowAction, actions_2.ReloadWindowAction.ID, actions_2.ReloadWindowAction.LABEL));
    workbenchActionsRegistry.registerWorkbenchAction(new actions_1.SyncActionDescriptor(actions_2.CloseMessagesAction, actions_2.CloseMessagesAction.ID, actions_2.CloseMessagesAction.LABEL, { primary: keyCodes_1.KeyCode.Escape }, keybindingService_1.KbExpr.has(messageService_1.WorkbenchMessageService.GLOBAL_MESSAGES_SHOWING_CONTEXT)));
    workbenchActionsRegistry.registerWorkbenchAction(new actions_1.SyncActionDescriptor(actions_2.CloseEditorAction, actions_2.CloseEditorAction.ID, actions_2.CloseEditorAction.LABEL, { primary: keyCodes_1.KeyMod.CtrlCmd | keyCodes_1.KeyCode.KEY_W, win: { primary: keyCodes_1.KeyMod.CtrlCmd | keyCodes_1.KeyCode.F4, secondary: [keyCodes_1.KeyMod.CtrlCmd | keyCodes_1.KeyCode.KEY_W] } }), viewCategory);
    workbenchActionsRegistry.registerWorkbenchAction(new actions_1.SyncActionDescriptor(actions_2.ToggleFullScreenAction, actions_2.ToggleFullScreenAction.ID, actions_2.ToggleFullScreenAction.LABEL, { primary: keyCodes_1.KeyCode.F11, mac: { primary: keyCodes_1.KeyMod.CtrlCmd | keyCodes_1.KeyMod.WinCtrl | keyCodes_1.KeyCode.KEY_F } }), viewCategory);
    if (platform.isWindows || platform.isLinux) {
        workbenchActionsRegistry.registerWorkbenchAction(new actions_1.SyncActionDescriptor(actions_2.ToggleMenuBarAction, actions_2.ToggleMenuBarAction.ID, actions_2.ToggleMenuBarAction.LABEL), viewCategory);
    }
    // Configuration: Window
    var configurationRegistry = platform_1.Registry.as(configurationRegistry_1.Extensions.Configuration);
    configurationRegistry.registerConfiguration({
        'id': 'window',
        'order': 6,
        'title': nls.localize('windowConfigurationTitle', "Window configuration"),
        'type': 'object',
        'properties': {
            'window.openFilesInNewWindow': {
                'type': 'boolean',
                'default': true,
                'description': nls.localize('openFilesInNewWindow', "When enabled, will open files in a new window instead of reusing an existing instance.")
            },
            'window.reopenFolders': {
                'type': 'string',
                'enum': ['none', 'one', 'all'],
                'default': 'one',
                'description': nls.localize('reopenFolders', "Controls how folders are being reopened after a restart. Select 'none' to never reopen a folder, 'one' to reopen the last folder you worked on or 'all' to reopen all folders of your last session.")
            },
            'window.zoomLevel': {
                'type': 'number',
                'default': 0,
                'description': nls.localize('zoomLevel', "Adjust the zoom level of the window. The original size is 0 and each increment above or below represents zooming 20% larger or smaller.")
            }
        }
    });
    // Configuration: Update
    configurationRegistry.registerConfiguration({
        'id': 'update',
        'order': 10,
        'title': nls.localize('updateConfigurationTitle', "Update configuration"),
        'type': 'object',
        'properties': {
            'update.channel': {
                'type': 'string',
                'default': 'stable',
                'description': nls.localize('updateChannel', "Configure the update channel to receive updates from. Requires a restart after change.")
            }
        }
    });
});
//# sourceMappingURL=main.contribution.js.map