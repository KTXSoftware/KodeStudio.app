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
define(["require", "exports", 'vs/base/common/platform', 'vs/base/browser/browser', 'vs/base/browser/iframe'], function (require, exports, Platform, Browser, IframeUtils) {
    var StandardMouseEvent = (function () {
        function StandardMouseEvent(e) {
            var _this = this;
            this.timestamp = Date.now();
            this.browserEvent = e;
            this.leftButton = e.button === 0;
            this.middleButton = e.button === 1;
            this.rightButton = e.button === 2;
            this.target = e.target || e.targetNode || e.srcElement;
            this.detail = e.detail || 1;
            if (e.type === 'dblclick') {
                this.detail = 2;
            }
            this.posx = 0;
            this.posy = 0;
            this.ctrlKey = e.ctrlKey;
            this.shiftKey = e.shiftKey;
            this.altKey = e.altKey;
            this.metaKey = e.metaKey;
            var readClientCoords = function () {
                if (e.clientX || e.clientY) {
                    _this.posx = e.clientX + document.body.scrollLeft + document.documentElement.scrollLeft;
                    _this.posy = e.clientY + document.body.scrollTop + document.documentElement.scrollTop;
                    return true;
                }
                return false;
            };
            var readPageCoords = function () {
                if (e.pageX || e.pageY) {
                    _this.posx = e.pageX;
                    _this.posy = e.pageY;
                    return true;
                }
                return false;
            };
            var test1 = readPageCoords, test2 = readClientCoords;
            if (Browser.isIE10) {
                // The if A elseif B logic here is inversed in IE10 due to an IE10 issue
                test1 = readClientCoords;
                test2 = readPageCoords;
            }
            if (!test1()) {
                test2();
            }
            // Find the position of the iframe this code is executing in relative to the iframe where the event was captured.
            var iframeOffsets = IframeUtils.getPositionOfChildWindowRelativeToAncestorWindow(self, e.view);
            this.posx -= iframeOffsets.left;
            this.posy -= iframeOffsets.top;
        }
        StandardMouseEvent.prototype.preventDefault = function () {
            if (this.browserEvent.preventDefault) {
                this.browserEvent.preventDefault();
            }
        };
        StandardMouseEvent.prototype.stopPropagation = function () {
            if (this.browserEvent.stopPropagation) {
                this.browserEvent.stopPropagation();
            }
        };
        return StandardMouseEvent;
    })();
    exports.StandardMouseEvent = StandardMouseEvent;
    var DragMouseEvent = (function (_super) {
        __extends(DragMouseEvent, _super);
        function DragMouseEvent(e) {
            _super.call(this, e);
            this.dataTransfer = e.dataTransfer;
        }
        return DragMouseEvent;
    })(StandardMouseEvent);
    exports.DragMouseEvent = DragMouseEvent;
    var DropMouseEvent = (function (_super) {
        __extends(DropMouseEvent, _super);
        function DropMouseEvent(e) {
            _super.call(this, e);
        }
        return DropMouseEvent;
    })(DragMouseEvent);
    exports.DropMouseEvent = DropMouseEvent;
    var StandardMouseWheelEvent = (function () {
        function StandardMouseWheelEvent(e, deltaX, deltaY) {
            if (deltaX === void 0) { deltaX = 0; }
            if (deltaY === void 0) { deltaY = 0; }
            this.browserEvent = e || null;
            this.target = e ? (e.target || e.targetNode || e.srcElement) : null;
            this.deltaY = deltaY;
            this.deltaX = deltaX;
            if (e) {
                var e1 = e;
                var e2 = e;
                // vertical delta scroll
                if (typeof e1.wheelDeltaY !== 'undefined') {
                    this.deltaY = e1.wheelDeltaY / 120;
                }
                else if (typeof e2.VERTICAL_AXIS !== 'undefined' && e2.axis === e2.VERTICAL_AXIS) {
                    this.deltaY = -e2.detail / 3;
                }
                // horizontal delta scroll
                if (typeof e1.wheelDeltaX !== 'undefined') {
                    if (Browser.isSafari && Platform.isWindows) {
                        this.deltaX = -(e1.wheelDeltaX / 120);
                    }
                    else {
                        this.deltaX = e1.wheelDeltaX / 120;
                    }
                }
                else if (typeof e2.HORIZONTAL_AXIS !== 'undefined' && e2.axis === e2.HORIZONTAL_AXIS) {
                    this.deltaX = -e.detail / 3;
                }
                // Assume a vertical scroll if nothing else worked
                if (this.deltaY === 0 && this.deltaX === 0 && e.wheelDelta) {
                    this.deltaY = e.wheelDelta / 120;
                }
            }
        }
        StandardMouseWheelEvent.prototype.preventDefault = function () {
            if (this.browserEvent) {
                if (this.browserEvent.preventDefault) {
                    this.browserEvent.preventDefault();
                }
            }
        };
        StandardMouseWheelEvent.prototype.stopPropagation = function () {
            if (this.browserEvent) {
                if (this.browserEvent.stopPropagation) {
                    this.browserEvent.stopPropagation();
                }
            }
        };
        return StandardMouseWheelEvent;
    })();
    exports.StandardMouseWheelEvent = StandardMouseWheelEvent;
});
//# sourceMappingURL=mouseEvent.js.map