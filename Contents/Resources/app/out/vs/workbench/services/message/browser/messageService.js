/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
'use strict';
define(["require", "exports", 'vs/base/common/errors', 'vs/base/common/types', 'vs/base/browser/ui/messagelist/messageList', 'vs/workbench/common/constants', 'vs/workbench/browser/parts/statusbar/statusbar', 'vs/platform/message/common/message'], function (require, exports, errors, types, messageList_1, constants_1, statusbar_1, message_1) {
    var WorkbenchMessageService = (function () {
        function WorkbenchMessageService(telemetryService, keybindingService) {
            this.telemetryService = telemetryService;
            this.serviceId = message_1.IMessageService;
            this.messagesShowingContextKey = keybindingService.createKey(WorkbenchMessageService.GLOBAL_MESSAGES_SHOWING_CONTEXT, false);
            this.handler = new messageList_1.MessageList(constants_1.Identifiers.WORKBENCH_CONTAINER, telemetryService);
            this.messageBuffer = [];
            this.canShowMessages = true;
            this.disposeables = [];
            this.registerListeners();
        }
        WorkbenchMessageService.prototype.setWorkbenchServices = function (quickOpenService, statusbarService) {
            this.statusbarService = statusbarService;
            this.quickOpenService = quickOpenService;
            this.disposeables.push(this.quickOpenService.onShow(this.onQuickOpenShowing, this));
            this.disposeables.push(this.quickOpenService.onHide(this.onQuickOpenHiding, this));
        };
        WorkbenchMessageService.prototype.registerListeners = function () {
            this.disposeables.push(this.handler.onMessagesShowing(this.onMessagesShowing, this));
            this.disposeables.push(this.handler.onMessagesCleared(this.onMessagesCleared, this));
        };
        WorkbenchMessageService.prototype.onMessagesShowing = function () {
            this.messagesShowingContextKey.set(true);
        };
        WorkbenchMessageService.prototype.onMessagesCleared = function () {
            this.messagesShowingContextKey.reset();
        };
        WorkbenchMessageService.prototype.onQuickOpenShowing = function () {
            this.canShowMessages = false; // when quick open is open, don't show messages behind
            this.handler.hide(); // hide messages when quick open is visible
        };
        WorkbenchMessageService.prototype.onQuickOpenHiding = function () {
            this.canShowMessages = true;
            this.handler.show(); // make sure the handler is visible
            // Release messages from buffer
            while (this.messageBuffer.length) {
                var bufferedMessage = this.messageBuffer.pop();
                bufferedMessage.disposeFn = this.show(bufferedMessage.severity, bufferedMessage.message);
            }
        };
        WorkbenchMessageService.prototype.toBaseSeverity = function (severity) {
            switch (severity) {
                case message_1.Severity.Info:
                    return messageList_1.Severity.Info;
                case message_1.Severity.Warning:
                    return messageList_1.Severity.Warning;
            }
            return messageList_1.Severity.Error;
        };
        WorkbenchMessageService.prototype.show = function (sev, message) {
            var _this = this;
            if (!message) {
                return function () { return void 0; }; // guard against undefined messages
            }
            if (Array.isArray(message)) {
                var closeFns = [];
                message.forEach(function (msg) { return closeFns.push(_this.show(sev, msg)); });
                return function () { return closeFns.forEach(function (fn) { return fn(); }); };
            }
            if (errors.isPromiseCanceledError(message)) {
                return function () { return void 0; }; // this kind of error should not be shown
            }
            if (types.isNumber(message.severity)) {
                sev = message.severity;
            }
            return this.doShow(sev, message);
        };
        WorkbenchMessageService.prototype.doShow = function (sev, message) {
            var _this = this;
            // Check flag if we can show a message now
            if (!this.canShowMessages) {
                var messageObj = { severity: sev, message: message, disposeFn: function () { return _this.messageBuffer.splice(_this.messageBuffer.indexOf(messageObj), 1); } };
                this.messageBuffer.push(messageObj);
                // Return function that allows to remove message from buffer
                return function () { return messageObj.disposeFn(); };
            }
            // Show in Console
            if (sev === message_1.Severity.Error) {
                console.error(errors.toErrorMessage(message, true));
            }
            // Show in Global Handler
            return this.handler.showMessage(this.toBaseSeverity(sev), message);
        };
        WorkbenchMessageService.prototype.setStatusMessage = function (message, autoDisposeAfter, delayBy) {
            var _this = this;
            if (autoDisposeAfter === void 0) { autoDisposeAfter = -1; }
            if (delayBy === void 0) { delayBy = 0; }
            if (this.statusbarService) {
                if (this.statusMsgDispose) {
                    this.statusMsgDispose.dispose(); // dismiss any previous
                }
                // Create new
                var statusDispose;
                var showHandle = setTimeout(function () {
                    statusDispose = _this.statusbarService.addEntry({ text: message }, statusbar_1.StatusbarAlignment.LEFT, Number.MIN_VALUE);
                    showHandle = null;
                }, delayBy);
                var hideHandle;
                // Dispose function takes care of timeouts and actual entry
                var dispose = { dispose: function () {
                        if (showHandle) {
                            clearTimeout(showHandle);
                        }
                        if (hideHandle) {
                            clearTimeout(hideHandle);
                        }
                        if (statusDispose) {
                            statusDispose.dispose();
                        }
                    } };
                this.statusMsgDispose = dispose;
                if (typeof autoDisposeAfter === 'number' && autoDisposeAfter > 0) {
                    hideHandle = setTimeout(function () { return dispose.dispose(); }, autoDisposeAfter);
                }
                return dispose;
            }
            return { dispose: function () { } };
        };
        WorkbenchMessageService.prototype.hideAll = function () {
            if (this.handler) {
                this.handler.hideMessages();
            }
        };
        WorkbenchMessageService.prototype.confirm = function (confirmation) {
            var messageText = confirmation.message;
            if (confirmation.detail) {
                messageText = messageText + '\n\n' + confirmation.detail;
            }
            return window.confirm(messageText);
        };
        WorkbenchMessageService.prototype.dispose = function () {
            while (this.disposeables.length) {
                this.disposeables.pop().dispose();
            }
        };
        WorkbenchMessageService.GLOBAL_MESSAGES_SHOWING_CONTEXT = 'globalMessageVisible';
        return WorkbenchMessageService;
    })();
    exports.WorkbenchMessageService = WorkbenchMessageService;
});
//# sourceMappingURL=messageService.js.map