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
define(["require", "exports", 'vs/base/browser/mouseEvent', 'vs/base/browser/dom', 'vs/base/browser/touch', 'vs/editor/browser/controller/mouseHandler'], function (require, exports, Mouse, DomUtils, Touch, MouseHandler) {
    var gestureChangeEventMerger = function (lastEvent, currentEvent) {
        var r = {
            translationY: currentEvent.translationY,
            translationX: currentEvent.translationX
        };
        if (lastEvent) {
            r.translationY += lastEvent.translationY;
            r.translationX += lastEvent.translationX;
        }
        return r;
    };
    /**
     * Basically IE10 and IE11
     */
    var MsPointerHandler = (function (_super) {
        __extends(MsPointerHandler, _super);
        function MsPointerHandler(context, viewController, viewHelper) {
            var _this = this;
            _super.call(this, context, viewController, viewHelper);
            this.viewHelper.linesContentDomNode.style.msTouchAction = 'none';
            this.viewHelper.linesContentDomNode.style.msContentZooming = 'none';
            // TODO@Alex -> this expects that the view is added in 100 ms, might not be the case
            // This handler should be added when the dom node is in the dom tree
            this._installGestureHandlerTimeout = window.setTimeout(function () {
                _this._installGestureHandlerTimeout = -1;
                if (window.MSGesture) {
                    var touchGesture = new MSGesture();
                    var penGesture = new MSGesture();
                    touchGesture.target = _this.viewHelper.linesContentDomNode;
                    penGesture.target = _this.viewHelper.linesContentDomNode;
                    _this.viewHelper.linesContentDomNode.addEventListener('MSPointerDown', function (e) {
                        // Circumvent IE11 breaking change in e.pointerType & TypeScript's stale definitions
                        var pointerType = e.pointerType;
                        if (pointerType === (e.MSPOINTER_TYPE_MOUSE || 'mouse')) {
                            _this._lastPointerType = 'mouse';
                            return;
                        }
                        else if (pointerType === (e.MSPOINTER_TYPE_TOUCH || 'touch')) {
                            _this._lastPointerType = 'touch';
                            touchGesture.addPointer(e.pointerId);
                        }
                        else {
                            _this._lastPointerType = 'pen';
                            penGesture.addPointer(e.pointerId);
                        }
                    });
                    _this.listenersToRemove.push(DomUtils.addThrottledListener(_this.viewHelper.linesContentDomNode, 'MSGestureChange', function (e) { return _this._onGestureChange(e); }, gestureChangeEventMerger));
                    _this.listenersToRemove.push(DomUtils.addListener(_this.viewHelper.linesContentDomNode, 'MSGestureTap', function (e) { return _this._onCaptureGestureTap(e); }, true));
                }
            }, 100);
            this._lastPointerType = 'mouse';
        }
        MsPointerHandler.prototype._onMouseDown = function (e) {
            if (this._lastPointerType === 'mouse') {
                _super.prototype._onMouseDown.call(this, e);
            }
        };
        MsPointerHandler.prototype._onCaptureGestureTap = function (rawEvent) {
            var _this = this;
            var e = new Mouse.StandardMouseEvent(rawEvent);
            var t = this._createMouseTarget(e, false);
            if (t.position) {
                this.viewController.moveTo('mouse', t.position.lineNumber, t.position.column);
            }
            // IE does not want to focus when coming in from the browser's address bar
            if (e.browserEvent.fromElement) {
                e.preventDefault();
                this.viewHelper.focusTextArea();
            }
            else {
                // TODO@Alex -> cancel this is focus is lost
                setTimeout(function () {
                    _this.viewHelper.focusTextArea();
                });
            }
        };
        MsPointerHandler.prototype._onGestureChange = function (e) {
            this.viewHelper.setScrollTop(this.viewHelper.getScrollTop() - e.translationY);
            this.viewHelper.setScrollLeft(this.viewHelper.getScrollLeft() - e.translationX);
        };
        MsPointerHandler.prototype.dispose = function () {
            window.clearTimeout(this._installGestureHandlerTimeout);
            _super.prototype.dispose.call(this);
        };
        return MsPointerHandler;
    })(MouseHandler.MouseHandler);
    /**
     * Basically Edge but should be modified to handle any pointerEnabled, even without support of MSGesture
     */
    var StandardPointerHandler = (function (_super) {
        __extends(StandardPointerHandler, _super);
        function StandardPointerHandler(context, viewController, viewHelper) {
            var _this = this;
            _super.call(this, context, viewController, viewHelper);
            this.viewHelper.linesContentDomNode.style.touchAction = 'none';
            // TODO@Alex -> this expects that the view is added in 100 ms, might not be the case
            // This handler should be added when the dom node is in the dom tree
            this._installGestureHandlerTimeout = window.setTimeout(function () {
                _this._installGestureHandlerTimeout = -1;
                // TODO@Alex: replace the usage of MSGesture here with something that works across all browsers
                if (window.MSGesture) {
                    var touchGesture = new MSGesture();
                    var penGesture = new MSGesture();
                    touchGesture.target = _this.viewHelper.linesContentDomNode;
                    penGesture.target = _this.viewHelper.linesContentDomNode;
                    _this.viewHelper.linesContentDomNode.addEventListener('pointerdown', function (e) {
                        var pointerType = e.pointerType;
                        if (pointerType === 'mouse') {
                            _this._lastPointerType = 'mouse';
                            return;
                        }
                        else if (pointerType === 'touch') {
                            _this._lastPointerType = 'touch';
                            touchGesture.addPointer(e.pointerId);
                        }
                        else {
                            _this._lastPointerType = 'pen';
                            penGesture.addPointer(e.pointerId);
                        }
                    });
                    _this.listenersToRemove.push(DomUtils.addThrottledListener(_this.viewHelper.linesContentDomNode, 'MSGestureChange', function (e) { return _this._onGestureChange(e); }, gestureChangeEventMerger));
                    _this.listenersToRemove.push(DomUtils.addListener(_this.viewHelper.linesContentDomNode, 'MSGestureTap', function (e) { return _this._onCaptureGestureTap(e); }, true));
                }
            }, 100);
            this._lastPointerType = 'mouse';
        }
        StandardPointerHandler.prototype._onMouseDown = function (e) {
            if (this._lastPointerType === 'mouse') {
                _super.prototype._onMouseDown.call(this, e);
            }
        };
        StandardPointerHandler.prototype._onCaptureGestureTap = function (rawEvent) {
            var _this = this;
            var e = new Mouse.StandardMouseEvent(rawEvent);
            var t = this._createMouseTarget(e, false);
            if (t.position) {
                this.viewController.moveTo('mouse', t.position.lineNumber, t.position.column);
            }
            // IE does not want to focus when coming in from the browser's address bar
            if (e.browserEvent.fromElement) {
                e.preventDefault();
                this.viewHelper.focusTextArea();
            }
            else {
                // TODO@Alex -> cancel this is focus is lost
                setTimeout(function () {
                    _this.viewHelper.focusTextArea();
                });
            }
        };
        StandardPointerHandler.prototype._onGestureChange = function (e) {
            this.viewHelper.setScrollTop(this.viewHelper.getScrollTop() - e.translationY);
            this.viewHelper.setScrollLeft(this.viewHelper.getScrollLeft() - e.translationX);
        };
        StandardPointerHandler.prototype.dispose = function () {
            window.clearTimeout(this._installGestureHandlerTimeout);
            _super.prototype.dispose.call(this);
        };
        return StandardPointerHandler;
    })(MouseHandler.MouseHandler);
    var TouchHandler = (function (_super) {
        __extends(TouchHandler, _super);
        function TouchHandler(context, viewController, viewHelper) {
            var _this = this;
            _super.call(this, context, viewController, viewHelper);
            this.gesture = new Touch.Gesture(this.viewHelper.linesContentDomNode);
            this.listenersToRemove.push(DomUtils.addListener(this.viewHelper.linesContentDomNode, Touch.EventType.Tap, function (e) { return _this.onTap(e); }));
            this.listenersToRemove.push(DomUtils.addListener(this.viewHelper.linesContentDomNode, Touch.EventType.Change, function (e) { return _this.onChange(e); }));
        }
        TouchHandler.prototype.dispose = function () {
            this.gesture.dispose();
            _super.prototype.dispose.call(this);
        };
        TouchHandler.prototype.onTap = function (event) {
            event.preventDefault();
            this.viewHelper.focusTextArea();
            var mouseEvent = new Mouse.StandardMouseEvent(event);
            var target = this._createMouseTarget(mouseEvent, false);
            if (target.position) {
                this.viewController.moveTo('mouse', target.position.lineNumber, target.position.column);
            }
        };
        TouchHandler.prototype.onChange = function (event) {
            this.viewHelper.setScrollTop(this.viewHelper.getScrollTop() - event.translationY);
            this.viewHelper.setScrollLeft(this.viewHelper.getScrollLeft() - event.translationX);
        };
        return TouchHandler;
    })(MouseHandler.MouseHandler);
    var PointerHandler = (function () {
        function PointerHandler(context, viewController, viewHelper) {
            if (window.navigator.msPointerEnabled) {
                this.handler = new MsPointerHandler(context, viewController, viewHelper);
            }
            else if (window.TouchEvent) {
                this.handler = new TouchHandler(context, viewController, viewHelper);
            }
            else if (window.navigator.pointerEnabled) {
                this.handler = new StandardPointerHandler(context, viewController, viewHelper);
            }
            else {
                this.handler = new MouseHandler.MouseHandler(context, viewController, viewHelper);
            }
        }
        PointerHandler.prototype.onScrollChanged = function (e) {
            this.handler.onScrollChanged(e);
        };
        PointerHandler.prototype.dispose = function () {
            this.handler.dispose();
        };
        return PointerHandler;
    })();
    exports.PointerHandler = PointerHandler;
});
//# sourceMappingURL=pointerHandler.js.map