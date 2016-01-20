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
define(["require", "exports", 'vs/base/browser/browser', 'vs/base/browser/dom', 'vs/base/browser/browserService', 'vs/base/browser/htmlContentRenderer', 'vs/base/browser/ui/actionbar/actionbar', 'vs/base/browser/ui/contextview/contextview', 'vs/base/common/event', 'vs/base/browser/ui/widget', 'vs/css!./inputBox'], function (require, exports, Bal, dom, browser, htmlContentRenderer_1, actionbar_1, contextview_1, event_1, widget_1) {
    var $ = dom.emmet;
    (function (MessageType) {
        MessageType[MessageType["INFO"] = 1] = "INFO";
        MessageType[MessageType["WARNING"] = 2] = "WARNING";
        MessageType[MessageType["ERROR"] = 3] = "ERROR";
    })(exports.MessageType || (exports.MessageType = {}));
    var MessageType = exports.MessageType;
    var InputBox = (function (_super) {
        __extends(InputBox, _super);
        function InputBox(container, contextViewProvider, options) {
            var _this = this;
            _super.call(this);
            this.state = 'idle';
            this._onDidChange = this._register(new event_1.Emitter());
            this.onDidChange = this._onDidChange.event;
            this._onDidHeightChange = this._register(new event_1.Emitter());
            this.onDidHeightChange = this._onDidHeightChange.event;
            this.contextViewProvider = contextViewProvider;
            this.options = options || Object.create(null);
            // this.toDispose = [];
            this.message = null;
            this.cachedHeight = null;
            this.placeholder = this.options.placeholder || '';
            this.ariaLabel = this.options.ariaLabel || '';
            if (this.options.validationOptions) {
                this.validation = this.options.validationOptions.validation;
                this.showValidationMessage = this.options.validationOptions.showMessage || false;
            }
            this.element = dom.append(container, $('.monaco-inputbox.idle'));
            var tagName = this.options.flexibleHeight ? 'textarea' : 'input';
            var wrapper = dom.append(this.element, $('.wrapper'));
            this.input = dom.append(wrapper, $(tagName + '.input'));
            this.input.setAttribute('autocorrect', 'off');
            this.input.setAttribute('autocapitalize', 'off');
            this.input.setAttribute('spellcheck', 'false');
            if (this.options.flexibleHeight) {
                this.mirror = dom.append(wrapper, $('div.mirror'));
            }
            else {
                this.input.type = this.options.type || 'text';
                this.input.setAttribute('wrap', 'off');
            }
            if (this.ariaLabel) {
                this.input.setAttribute('aria-label', this.ariaLabel);
            }
            if (this.placeholder) {
                this.input.setAttribute('placeholder', this.placeholder);
            }
            this.oninput(this.input, function () { return _this.onValueChange(); });
            this.onblur(this.input, function () { return _this.onBlur(); });
            this.onfocus(this.input, function () { return _this.onFocus(); });
            // Add placeholder shim for IE because IE decides to hide the placeholder on focus (we dont want that!)
            if (this.placeholder && Bal.isIE11orEarlier) {
                this.onclick(this.input, function (e) {
                    dom.EventHelper.stop(e, true);
                    _this.input.focus();
                });
                if (Bal.isIE9) {
                    this.onkeyup(this.input, function () { return _this.onValueChange(); });
                }
            }
            setTimeout(function () { return _this.layout(); }, 0);
            // Support actions
            if (this.options.actions) {
                this.actionbar = this._register(new actionbar_1.ActionBar(this.element));
                this.actionbar.push(this.options.actions, { icon: true, label: false });
            }
        }
        InputBox.prototype.onBlur = function () {
            this._hideMessage();
        };
        InputBox.prototype.onFocus = function () {
            this._showMessage();
        };
        InputBox.prototype.setPlaceHolder = function (placeHolder) {
            if (this.input) {
                this.input.setAttribute('placeholder', placeHolder);
            }
        };
        InputBox.prototype.setContextViewProvider = function (contextViewProvider) {
            this.contextViewProvider = contextViewProvider;
        };
        Object.defineProperty(InputBox.prototype, "inputElement", {
            get: function () {
                return this.input;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(InputBox.prototype, "value", {
            get: function () {
                return this.input.value;
            },
            set: function (newValue) {
                if (this.input.value !== newValue) {
                    this.input.value = newValue;
                    this.onValueChange();
                }
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(InputBox.prototype, "height", {
            get: function () {
                return this.cachedHeight === null ? dom.getTotalHeight(this.element) : this.cachedHeight;
            },
            enumerable: true,
            configurable: true
        });
        InputBox.prototype.focus = function () {
            this.input.focus();
        };
        InputBox.prototype.blur = function () {
            this.input.blur();
        };
        InputBox.prototype.hasFocus = function () {
            return browser.getService().document.activeElement === this.input;
        };
        InputBox.prototype.select = function (range) {
            if (range === void 0) { range = null; }
            this.input.select();
            if (range) {
                this.input.setSelectionRange(range.start, range.end);
            }
        };
        InputBox.prototype.enable = function () {
            this.input.removeAttribute('disabled');
        };
        InputBox.prototype.disable = function () {
            this.input.disabled = true;
            this._hideMessage();
        };
        InputBox.prototype.setEnabled = function (enabled) {
            if (enabled) {
                this.enable();
            }
            else {
                this.disable();
            }
        };
        Object.defineProperty(InputBox.prototype, "width", {
            get: function () {
                return dom.getTotalWidth(this.input);
            },
            set: function (width) {
                this.input.style.width = width + 'px';
            },
            enumerable: true,
            configurable: true
        });
        InputBox.prototype.showMessage = function (message, force) {
            this.message = message;
            dom.removeClass(this.element, 'idle');
            dom.removeClass(this.element, 'info');
            dom.removeClass(this.element, 'warning');
            dom.removeClass(this.element, 'error');
            dom.addClass(this.element, this.classForType(message.type));
            if (this.hasFocus() || force) {
                this._showMessage();
            }
        };
        InputBox.prototype.hideMessage = function () {
            this.message = null;
            dom.removeClass(this.element, 'info');
            dom.removeClass(this.element, 'warning');
            dom.removeClass(this.element, 'error');
            dom.addClass(this.element, 'idle');
            this._hideMessage();
        };
        InputBox.prototype.isInputValid = function () {
            return !!this.validation && !this.validation(this.value);
        };
        InputBox.prototype.validate = function () {
            var result = null;
            if (this.validation) {
                result = this.validation(this.value);
                if (!result) {
                    this.hideMessage();
                }
                else {
                    this.showMessage(result);
                }
            }
            return !result;
        };
        InputBox.prototype.classForType = function (type) {
            switch (type) {
                case MessageType.INFO: return 'info';
                case MessageType.WARNING: return 'warning';
                default: return 'error';
            }
        };
        InputBox.prototype._showMessage = function () {
            var _this = this;
            if (!this.contextViewProvider || !this.message) {
                return;
            }
            var div;
            var layout = function () { return div.style.width = dom.getTotalWidth(_this.element) + 'px'; };
            this.state = 'open';
            this.contextViewProvider.showContextView({
                getAnchor: function () { return _this.element; },
                anchorAlignment: contextview_1.AnchorAlignment.RIGHT,
                render: function (container) {
                    div = dom.append(container, $('.monaco-inputbox-container'));
                    layout();
                    var renderOptions = {
                        tagName: 'span',
                        className: 'monaco-inputbox-message',
                    };
                    if (_this.message.formatContent) {
                        renderOptions.formattedText = _this.message.content;
                    }
                    else {
                        renderOptions.text = _this.message.content;
                    }
                    var spanElement = htmlContentRenderer_1.renderHtml(renderOptions);
                    dom.addClass(spanElement, _this.classForType(_this.message.type));
                    dom.append(div, spanElement);
                    return null;
                },
                layout: layout
            });
        };
        InputBox.prototype._hideMessage = function () {
            if (!this.contextViewProvider || this.state !== 'open') {
                return;
            }
            this.state = 'idle';
            this.contextViewProvider.hideContextView();
        };
        InputBox.prototype.onValueChange = function () {
            this._onDidChange.fire(this.value);
            this.validate();
            if (this.mirror) {
                var lastCharCode = this.value.charCodeAt(this.value.length - 1);
                var suffix = lastCharCode === 10 ? ' ' : '';
                this.mirror.textContent = this.value + suffix;
                this.layout();
            }
        };
        InputBox.prototype.layout = function () {
            if (!this.mirror) {
                return;
            }
            var previousHeight = this.cachedHeight;
            this.cachedHeight = dom.getTotalHeight(this.mirror);
            if (previousHeight !== this.cachedHeight) {
                this.input.style.height = this.cachedHeight + 'px';
                this._onDidHeightChange.fire(this.cachedHeight);
            }
        };
        InputBox.prototype.dispose = function () {
            this._hideMessage();
            this.element = null;
            this.input = null;
            this.contextViewProvider = null;
            this.message = null;
            this.placeholder = null;
            this.ariaLabel = null;
            this.validation = null;
            this.showValidationMessage = null;
            this.state = null;
            this.actionbar = null;
            _super.prototype.dispose.call(this);
        };
        return InputBox;
    })(widget_1.Widget);
    exports.InputBox = InputBox;
});
//# sourceMappingURL=inputBox.js.map