/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
'use strict';
define(["require", "exports", 'vs/nls', 'vs/base/common/winjs.base', 'vs/base/browser/builder', 'vs/base/browser/dom', 'vs/base/common/errors', 'vs/base/common/types', 'vs/base/common/event', 'vs/base/common/actions', 'vs/base/browser/htmlContentRenderer', 'vs/css!./messageList'], function (require, exports, nls, winjs_base_1, builder_1, DOM, errors, types, event_1, actions_1, htmlRenderer) {
    (function (Severity) {
        Severity[Severity["Info"] = 0] = "Info";
        Severity[Severity["Warning"] = 1] = "Warning";
        Severity[Severity["Error"] = 2] = "Error";
    })(exports.Severity || (exports.Severity = {}));
    var Severity = exports.Severity;
    var IMessageListOptions = (function () {
        function IMessageListOptions() {
        }
        return IMessageListOptions;
    })();
    exports.IMessageListOptions = IMessageListOptions;
    var MessageList = (function () {
        function MessageList(containerElementId, usageLogger, options) {
            if (options === void 0) { options = { purgeInterval: MessageList.DEFAULT_MESSAGE_PURGER_INTERVAL, maxMessages: MessageList.DEFAULT_MAX_MESSAGES, maxMessageLength: MessageList.DEFAULT_MAX_MESSAGE_LENGTH }; }
            this.messages = [];
            this.messageListPurger = null;
            this.containerElementId = containerElementId;
            this.usageLogger = usageLogger;
            this.options = options;
            this._onMessagesShowing = new event_1.Emitter();
            this._onMessagesCleared = new event_1.Emitter();
        }
        Object.defineProperty(MessageList.prototype, "onMessagesShowing", {
            get: function () {
                return this._onMessagesShowing.event;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(MessageList.prototype, "onMessagesCleared", {
            get: function () {
                return this._onMessagesCleared.event;
            },
            enumerable: true,
            configurable: true
        });
        MessageList.prototype.showMessage = function (severity, message) {
            var _this = this;
            if (Array.isArray(message)) {
                var closeFns = [];
                message.forEach(function (msg) { return closeFns.push(_this.showMessage(severity, msg)); });
                return function () { return closeFns.forEach(function (fn) { return fn(); }); };
            }
            // Return only if we are unable to extract a message text
            var messageText = this.getMessageText(message);
            if (!messageText) {
                return function () { };
            }
            // Show message
            return this.doShowMessage(message, messageText, severity);
        };
        MessageList.prototype.getMessageText = function (message) {
            if (types.isString(message)) {
                return message;
            }
            if (message instanceof Error) {
                return errors.toErrorMessage(message, false);
            }
            if (message.message) {
                return message.message;
            }
            return null;
        };
        MessageList.prototype.doShowMessage = function (id, message, severity) {
            var _this = this;
            // Trigger Auto-Purge of messages to keep list small
            this.purgeMessages();
            // Store in Memory (new messages come first so that they show up on top)
            this.messages.unshift({
                id: id,
                text: message,
                severity: severity,
                time: new Date().getTime(),
                actions: id.actions
            });
            // Render
            this.renderMessages(true, 1);
            return function () {
                _this.hideMessage(id);
            };
        };
        MessageList.prototype.renderMessages = function (animate, delta) {
            var _this = this;
            // Lazily create, otherwise clear old
            if (!this.messageListContainer) {
                var container = builder_1.withElementById(this.containerElementId);
                if (container) {
                    this.messageListContainer = builder_1.$('.global-message-list').appendTo(container);
                }
                else {
                    return; // Cannot build container for messages yet, return
                }
            }
            else {
                builder_1.$(this.messageListContainer).empty();
                builder_1.$(this.messageListContainer).removeClass('transition');
            }
            // Support animation for messages by moving the container out of view and then in
            if (animate) {
                builder_1.$(this.messageListContainer).style('top', '-35px');
            }
            // Render Messages as List Items
            builder_1.$(this.messageListContainer).ul({ 'class': 'message-list' }, function (ul) {
                var messages = _this.prepareMessages();
                if (messages.length > 0) {
                    _this._onMessagesShowing.fire();
                }
                else {
                    _this._onMessagesCleared.fire();
                }
                messages.forEach(function (message, index) {
                    _this.renderMessage(message, builder_1.$(ul), messages.length, delta);
                });
                // Support animation for messages by moving the container out of view and then in
                if (animate) {
                    setTimeout(function () {
                        builder_1.$(_this.messageListContainer).addClass('transition');
                        builder_1.$(_this.messageListContainer).style('top', '0');
                    }, 50 /* Need this delay to reliably get the animation on some browsers */);
                }
            });
        };
        MessageList.prototype.renderMessage = function (message, container, total, delta) {
            var _this = this;
            // Actions (if none provided, add one default action to hide message)
            var messageActions = this.getMessageActions(message);
            container.li({ class: 'message-list-entry message-list-entry-with-action' }, function (li) {
                messageActions.forEach(function (action) {
                    var clazz = (total > 1 || delta < 0) ? 'message-right-side multiple' : 'message-right-side';
                    li.div({ class: clazz }, function (div) {
                        div.a({ class: 'action-button' }).text(action.label).on('click', function (e) {
                            DOM.EventHelper.stop(e, true);
                            if (_this.usageLogger) {
                                _this.usageLogger.publicLog('workbenchActionExecuted', { id: action.id, from: 'message' });
                            }
                            (action.run() || winjs_base_1.Promise.as(null))
                                .then(null, function (error) { return _this.showMessage(Severity.Error, error); })
                                .done(function (r) {
                                if (r === false) {
                                    return;
                                }
                                _this.hideMessage(message.text); // hide all matching the text since there may be duplicates
                            });
                        });
                    });
                });
                // Text
                var text = message.text.substr(0, _this.options.maxMessageLength);
                li.div({ class: 'message-left-side' }, function (div) {
                    div.addClass('message-overflow-ellipsis');
                    // Severity indicator
                    var sev = message.severity;
                    var label = (sev === Severity.Error) ? nls.localize('error', "Error") : (sev === Severity.Warning) ? nls.localize('warning', "Warn") : nls.localize('info', "Info");
                    builder_1.$().span({ class: 'message-left-side severity ' + ((sev === Severity.Error) ? 'app-error' : (sev === Severity.Warning) ? 'app-warning' : 'app-info'), text: label }).appendTo(div);
                    // Error message
                    var messageContentElement = htmlRenderer.renderHtml({
                        tagName: 'span',
                        className: 'message-left-side',
                        role: 'alert',
                        formattedText: text
                    });
                    builder_1.$(messageContentElement).attr({ role: 'alert' }).title(messageContentElement.textContent).appendTo(div);
                });
            });
        };
        MessageList.prototype.getMessageActions = function (message) {
            var _this = this;
            var messageActions;
            if (message.actions && message.actions.length > 0) {
                messageActions = message.actions;
            }
            else {
                messageActions = [
                    new actions_1.Action('close.message.action', nls.localize('close', "Close"), null, true, function () {
                        _this.hideMessage(message.text); // hide all matching the text since there may be duplicates
                        return winjs_base_1.Promise.as(true);
                    })
                ];
            }
            return messageActions;
        };
        MessageList.prototype.prepareMessages = function () {
            // Aggregate Messages by text to reduce their count
            var messages = [];
            var handledMessages = {};
            var offset = 0;
            for (var i = 0; i < this.messages.length; i++) {
                var message = this.messages[i];
                if (types.isUndefinedOrNull(handledMessages[message.text])) {
                    message.count = 1;
                    messages.push(message);
                    handledMessages[message.text] = offset++;
                }
                else {
                    messages[handledMessages[message.text]].count++;
                }
            }
            if (messages.length > this.options.maxMessages) {
                return messages.splice(messages.length - this.options.maxMessages, messages.length);
            }
            return messages;
        };
        MessageList.prototype.disposeMessages = function (messages) {
            messages.forEach(function (message) {
                if (message.actions) {
                    message.actions.forEach(function (action) {
                        action.dispose();
                    });
                }
            });
        };
        MessageList.prototype.hideMessages = function () {
            this.hideMessage();
        };
        MessageList.prototype.show = function () {
            if (this.messageListContainer && this.messageListContainer.isHidden()) {
                this.messageListContainer.show();
            }
        };
        MessageList.prototype.hide = function () {
            if (this.messageListContainer && !this.messageListContainer.isHidden()) {
                this.messageListContainer.hide();
            }
        };
        MessageList.prototype.hideMessage = function (messageObj) {
            var messageFound = false;
            for (var i = 0; i < this.messages.length; i++) {
                var message = this.messages[i];
                var hide = false;
                // Hide specific message
                if (messageObj) {
                    hide = ((types.isString(messageObj) && message.text === messageObj) || message.id === messageObj);
                }
                else {
                    hide = true;
                }
                if (hide) {
                    this.disposeMessages(this.messages.splice(i, 1));
                    i--;
                    messageFound = true;
                }
            }
            if (messageFound) {
                this.renderMessages(false, -1);
            }
        };
        MessageList.prototype.purgeMessages = function () {
            var _this = this;
            // Cancel previous
            if (this.messageListPurger) {
                this.messageListPurger.cancel();
            }
            // Configure
            this.messageListPurger = winjs_base_1.Promise.timeout(this.options.purgeInterval).then(function () {
                var needsUpdate = false;
                var counter = 0;
                for (var i = 0; i < _this.messages.length; i++) {
                    var message = _this.messages[i];
                    // Only purge infos and warnings and only if they are not providing actions
                    if (message.severity !== Severity.Error && !message.actions) {
                        _this.disposeMessages(_this.messages.splice(i, 1));
                        counter--;
                        i--;
                        needsUpdate = true;
                    }
                }
                if (needsUpdate) {
                    _this.renderMessages(false, counter);
                }
            });
        };
        MessageList.DEFAULT_MESSAGE_PURGER_INTERVAL = 10000;
        MessageList.DEFAULT_MAX_MESSAGES = 5;
        MessageList.DEFAULT_MAX_MESSAGE_LENGTH = 500;
        return MessageList;
    })();
    exports.MessageList = MessageList;
});
//# sourceMappingURL=messageList.js.map