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
define(["require", "exports", 'vs/base/common/keyCodes', 'vs/base/browser/ui/widget', 'vs/css!./checkbox'], function (require, exports, keyCodes_1, widget_1) {
    var Checkbox = (function (_super) {
        __extends(Checkbox, _super);
        function Checkbox(opts) {
            var _this = this;
            _super.call(this);
            this._opts = opts;
            this._checked = this._opts.isChecked;
            this.domNode = document.createElement('div');
            this.domNode.title = this._opts.title;
            this.domNode.className = this._className();
            this.domNode.tabIndex = 0;
            this.domNode.setAttribute('role', 'checkbox');
            this.domNode.setAttribute('aria-checked', String(this._checked));
            this.domNode.setAttribute('aria-label', this._opts.title);
            this.onclick(this.domNode, function (ev) {
                _this._checked = !_this._checked;
                _this.domNode.className = _this._className();
                _this._opts.onChange();
                ev.preventDefault();
            });
            this.onkeydown(this.domNode, function (keyboardEvent) {
                if (keyboardEvent.keyCode === keyCodes_1.KeyCode.Space || keyboardEvent.keyCode === keyCodes_1.KeyCode.Enter) {
                    _this._checked = !_this._checked;
                    _this.domNode.className = _this._className();
                    _this._opts.onChange();
                    keyboardEvent.preventDefault();
                    return;
                }
                if (_this._opts.onKeyDown) {
                    _this._opts.onKeyDown(keyboardEvent);
                }
            });
        }
        Checkbox.prototype.focus = function () {
            this.domNode.focus();
        };
        Object.defineProperty(Checkbox.prototype, "checked", {
            get: function () {
                return this._checked;
            },
            set: function (newIsChecked) {
                this._checked = newIsChecked;
                this.domNode.setAttribute('aria-checked', String(this._checked));
                this.domNode.className = this._className();
            },
            enumerable: true,
            configurable: true
        });
        Checkbox.prototype._className = function () {
            return 'custom-checkbox ' + this._opts.actionClassName + ' ' + (this._checked ? 'checked' : 'unchecked');
        };
        Checkbox.prototype.width = function () {
            return 2 /*marginleft*/ + 2 /*border*/ + 2 /*padding*/ + 16 /* icon width */;
        };
        Checkbox.prototype.enable = function () {
            this.domNode.tabIndex = 0;
            this.domNode.setAttribute('aria-disabled', String(false));
        };
        Checkbox.prototype.disable = function () {
            this.domNode.tabIndex = -1;
            this.domNode.setAttribute('aria-disabled', String(true));
        };
        return Checkbox;
    })(widget_1.Widget);
    exports.Checkbox = Checkbox;
});
//# sourceMappingURL=checkbox.js.map