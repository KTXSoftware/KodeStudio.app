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
define(["require", "exports", 'vs/nls', 'vs/base/browser/dom', 'vs/base/browser/ui/inputbox/inputBox', 'vs/base/browser/ui/checkbox/checkbox', 'vs/base/browser/ui/widget', 'vs/base/common/event', 'vs/css!./findInput'], function (require, exports, nls, dom, inputBox_1, checkbox_1, widget_1, event_1) {
    var NLS_REGEX_CHECKBOX_LABEL = nls.localize('regexDescription', "Use Regular Expression");
    var NLS_WHOLE_WORD_CHECKBOX_LABEL = nls.localize('wordsDescription', "Match Whole Word");
    var NLS_CASE_SENSITIVE_CHECKBOX_LABEL = nls.localize('caseDescription', "Match Case");
    var NLS_DEFAULT_LABEL = nls.localize('defaultLabel', "input");
    var FindInput = (function (_super) {
        __extends(FindInput, _super);
        function FindInput(parent, contextViewProvider, options) {
            var _this = this;
            _super.call(this);
            this._onDidOptionChange = this._register(new event_1.Emitter());
            this.onDidOptionChange = this._onDidOptionChange.event;
            this._onKeyDown = this._register(new event_1.Emitter());
            this.onKeyDown = this._onKeyDown.event;
            this._onKeyUp = this._register(new event_1.Emitter());
            this.onKeyUp = this._onKeyUp.event;
            this._onCaseSensitiveKeyDown = this._register(new event_1.Emitter());
            this.onCaseSensitiveKeyDown = this._onCaseSensitiveKeyDown.event;
            this.contextViewProvider = contextViewProvider;
            this.width = options.width || 100;
            this.placeholder = options.placeholder || '';
            this.validation = options.validation;
            this.label = options.label || NLS_DEFAULT_LABEL;
            this.regex = null;
            this.wholeWords = null;
            this.caseSensitive = null;
            this.domNode = null;
            this.inputBox = null;
            this.buildDomNode(options.appendCaseSensitiveLabel || '', options.appendWholeWordsLabel || '', options.appendRegexLabel || '');
            if (Boolean(parent)) {
                parent.appendChild(this.domNode);
            }
            this.onkeydown(this.inputBox.inputElement, function (e) { return _this._onKeyDown.fire(e); });
            this.onkeyup(this.inputBox.inputElement, function (e) { return _this._onKeyUp.fire(e); });
        }
        FindInput.prototype.enable = function () {
            dom.removeClass(this.domNode, 'disabled');
            this.inputBox.enable();
            this.regex.enable();
            this.wholeWords.enable();
            this.caseSensitive.enable();
        };
        FindInput.prototype.disable = function () {
            dom.addClass(this.domNode, 'disabled');
            this.inputBox.disable();
            this.regex.disable();
            this.wholeWords.disable();
            this.caseSensitive.disable();
        };
        FindInput.prototype.setEnabled = function (enabled) {
            if (enabled) {
                this.enable();
            }
            else {
                this.disable();
            }
        };
        FindInput.prototype.clear = function () {
            this.clearValidation();
            this.setValue('');
            this.focus();
        };
        FindInput.prototype.setWidth = function (newWidth) {
            this.width = newWidth;
            this.domNode.style.width = this.width + 'px';
            this.contextViewProvider.layout();
            this.setInputWidth();
        };
        FindInput.prototype.getValue = function () {
            return this.inputBox.value;
        };
        FindInput.prototype.setValue = function (value) {
            if (this.inputBox.value !== value) {
                this.inputBox.value = value;
            }
        };
        FindInput.prototype.setMatchCountState = function (state) {
            this.matchCount.setState(state);
            this.setInputWidth();
        };
        FindInput.prototype.select = function () {
            this.inputBox.select();
        };
        FindInput.prototype.focus = function () {
            this.inputBox.focus();
        };
        FindInput.prototype.getCaseSensitive = function () {
            return this.caseSensitive.checked;
        };
        FindInput.prototype.setCaseSensitive = function (value) {
            this.caseSensitive.checked = value;
            this.setInputWidth();
        };
        FindInput.prototype.getWholeWords = function () {
            return this.wholeWords.checked;
        };
        FindInput.prototype.setWholeWords = function (value) {
            this.wholeWords.checked = value;
            this.setInputWidth();
        };
        FindInput.prototype.getRegex = function () {
            return this.regex.checked;
        };
        FindInput.prototype.setRegex = function (value) {
            this.regex.checked = value;
            this.setInputWidth();
        };
        FindInput.prototype.focusOnCaseSensitive = function () {
            this.caseSensitive.focus();
        };
        FindInput.prototype.setInputWidth = function () {
            var w = this.width - this.matchCount.width() - this.caseSensitive.width() - this.wholeWords.width() - this.regex.width();
            this.inputBox.width = w;
        };
        FindInput.prototype.buildDomNode = function (appendCaseSensitiveLabel, appendWholeWordsLabel, appendRegexLabel) {
            var _this = this;
            this.domNode = document.createElement('div');
            this.domNode.style.width = this.width + 'px';
            dom.addClass(this.domNode, 'monaco-findInput');
            this.inputBox = this._register(new inputBox_1.InputBox(this.domNode, this.contextViewProvider, {
                placeholder: this.placeholder || '',
                ariaLabel: this.label || '',
                validationOptions: {
                    validation: this.validation || null,
                    showMessage: true
                }
            }));
            this.regex = this._register(new checkbox_1.Checkbox({
                actionClassName: 'regex',
                title: NLS_REGEX_CHECKBOX_LABEL + appendRegexLabel,
                isChecked: false,
                onChange: function () {
                    _this._onDidOptionChange.fire();
                    _this.inputBox.focus();
                    _this.setInputWidth();
                    _this.validate();
                }
            }));
            this.wholeWords = this._register(new checkbox_1.Checkbox({
                actionClassName: 'whole-word',
                title: NLS_WHOLE_WORD_CHECKBOX_LABEL + appendWholeWordsLabel,
                isChecked: false,
                onChange: function () {
                    _this._onDidOptionChange.fire();
                    _this.inputBox.focus();
                    _this.setInputWidth();
                    _this.validate();
                }
            }));
            this.caseSensitive = this._register(new checkbox_1.Checkbox({
                actionClassName: 'case-sensitive',
                title: NLS_CASE_SENSITIVE_CHECKBOX_LABEL + appendCaseSensitiveLabel,
                isChecked: false,
                onChange: function () {
                    _this._onDidOptionChange.fire();
                    _this.inputBox.focus();
                    _this.setInputWidth();
                    _this.validate();
                },
                onKeyDown: function (e) {
                    _this._onCaseSensitiveKeyDown.fire(e);
                }
            }));
            this.matchCount = this._register(new MatchCount({
                onClick: function (e) {
                    _this.inputBox.focus();
                    e.preventDefault();
                }
            }));
            this.setInputWidth();
            var controls = document.createElement('div');
            controls.className = 'controls';
            controls.appendChild(this.matchCount.domNode);
            controls.appendChild(this.caseSensitive.domNode);
            controls.appendChild(this.wholeWords.domNode);
            controls.appendChild(this.regex.domNode);
            this.domNode.appendChild(controls);
        };
        FindInput.prototype.validate = function () {
            this.inputBox.validate();
        };
        FindInput.prototype.showMessage = function (message) {
            this.inputBox.showMessage(message);
        };
        FindInput.prototype.clearMessage = function () {
            this.inputBox.hideMessage();
        };
        FindInput.prototype.clearValidation = function () {
            this.inputBox.hideMessage();
        };
        FindInput.OPTION_CHANGE = 'optionChange';
        return FindInput;
    })(widget_1.Widget);
    exports.FindInput = FindInput;
    var MatchCount = (function (_super) {
        __extends(MatchCount, _super);
        function MatchCount(opts) {
            _super.call(this);
            this.domNode = document.createElement('div');
            this.domNode.className = 'matchCount';
            this.setState({
                isVisible: false,
                count: '0',
                title: ''
            });
            this.onclick(this.domNode, opts.onClick);
        }
        MatchCount.prototype.width = function () {
            return this.isVisible ? 30 : 0;
        };
        MatchCount.prototype.setState = function (state) {
            dom.clearNode(this.domNode);
            this.domNode.appendChild(document.createTextNode(state.count));
            this.domNode.title = state.title;
            this.isVisible = state.isVisible;
            if (this.isVisible) {
                this.domNode.style.display = 'block';
            }
            else {
                this.domNode.style.display = 'none';
            }
        };
        return MatchCount;
    })(widget_1.Widget);
});
//# sourceMappingURL=findInput.js.map