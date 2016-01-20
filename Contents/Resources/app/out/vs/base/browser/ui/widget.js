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
define(["require", "exports", 'vs/base/common/lifecycle', 'vs/base/browser/mouseEvent', 'vs/base/browser/keyboardEvent', 'vs/base/browser/dom'], function (require, exports, lifecycle_1, mouseEvent_1, keyboardEvent_1, DomUtils) {
    var Widget = (function (_super) {
        __extends(Widget, _super);
        function Widget() {
            _super.apply(this, arguments);
        }
        Widget.prototype.onclick = function (domNode, listener) {
            this._register(DomUtils.addDisposableListener(domNode, DomUtils.EventType.CLICK, function (e) { return listener(new mouseEvent_1.StandardMouseEvent(e)); }));
        };
        Widget.prototype.onkeydown = function (domNode, listener) {
            this._register(DomUtils.addDisposableListener(domNode, DomUtils.EventType.KEY_DOWN, function (e) { return listener(new keyboardEvent_1.StandardKeyboardEvent(e)); }));
        };
        Widget.prototype.onkeyup = function (domNode, listener) {
            this._register(DomUtils.addDisposableListener(domNode, DomUtils.EventType.KEY_UP, function (e) { return listener(new keyboardEvent_1.StandardKeyboardEvent(e)); }));
        };
        Widget.prototype.oninput = function (domNode, listener) {
            this._register(DomUtils.addDisposableListener(domNode, DomUtils.EventType.INPUT, listener));
        };
        Widget.prototype.onblur = function (domNode, listener) {
            this._register(DomUtils.addDisposableListener(domNode, DomUtils.EventType.BLUR, listener));
        };
        Widget.prototype.onfocus = function (domNode, listener) {
            this._register(DomUtils.addDisposableListener(domNode, DomUtils.EventType.FOCUS, listener));
        };
        Widget.prototype.onchange = function (domNode, listener) {
            this._register(DomUtils.addDisposableListener(domNode, DomUtils.EventType.CHANGE, listener));
        };
        return Widget;
    })(lifecycle_1.Disposable);
    exports.Widget = Widget;
});
//# sourceMappingURL=widget.js.map