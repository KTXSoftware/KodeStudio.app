/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
'use strict';
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
define(["require", "exports", 'vs/nls', 'vs/platform/thread/common/thread', 'vs/platform/message/common/message', 'vs/base/common/actions', 'vs/base/common/winjs.base'], function (require, exports, nls, thread_1, message_1, actions_1, winjs_base_1) {
    var ExtHostMessageService = (function () {
        function ExtHostMessageService(threadService, commands) {
            this._proxy = threadService.getRemotable(MainThreadMessageService);
            this._commands = commands;
        }
        ExtHostMessageService.prototype.showMessage = function (severity, message, commands) {
            var items = [];
            for (var handle = 0; handle < commands.length; handle++) {
                var command = commands[handle];
                if (typeof command === 'string') {
                    items.push({ title: command, handle: handle });
                }
                else {
                    items.push({ title: command.title, handle: handle });
                }
            }
            return this._proxy.showMessage(severity, message, items).then(function (handle) {
                if (typeof handle === 'number') {
                    return commands[handle];
                }
            });
        };
        ExtHostMessageService = __decorate([
            __param(0, thread_1.IThreadService)
        ], ExtHostMessageService);
        return ExtHostMessageService;
    })();
    exports.ExtHostMessageService = ExtHostMessageService;
    var MainThreadMessageService = (function () {
        function MainThreadMessageService(messageService) {
            this._messageService = messageService;
        }
        MainThreadMessageService.prototype.showMessage = function (severity, message, commands) {
            var _this = this;
            var hide;
            var actions = [];
            actions.push(new actions_1.Action('__close', nls.localize('close', "Close"), undefined, true, function () {
                hide();
                return winjs_base_1.TPromise.as(undefined);
            }));
            commands.forEach(function (command) {
                actions.push(new actions_1.Action('_extension_message_handle_' + command.handle, command.title, undefined, true, function () {
                    hide(command.handle);
                    return winjs_base_1.TPromise.as(undefined);
                }));
            });
            return new winjs_base_1.TPromise(function (c) {
                var messageHide;
                hide = function (handle) {
                    messageHide();
                    c(handle);
                };
                messageHide = _this._messageService.show(severity, {
                    message: message,
                    actions: actions
                });
            });
        };
        MainThreadMessageService = __decorate([
            thread_1.Remotable.MainContext('MainThreadMessageService'),
            __param(0, message_1.IMessageService)
        ], MainThreadMessageService);
        return MainThreadMessageService;
    })();
    exports.MainThreadMessageService = MainThreadMessageService;
});
//# sourceMappingURL=extHostMessageService.js.map