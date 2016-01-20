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
define(["require", "exports", 'vs/nls', 'vs/base/common/winjs.base', 'vs/base/common/eventEmitter', 'vs/base/browser/builder', 'vs/platform/selection/common/selection', 'vs/css!./notrootView'], function (require, exports, nls, winjs, ee, builder, selection_1) {
    var $ = builder.$;
    var NotRootView = (function (_super) {
        __extends(NotRootView, _super);
        function NotRootView() {
            _super.apply(this, arguments);
            this.ID = 'notroot';
        }
        Object.defineProperty(NotRootView.prototype, "element", {
            get: function () {
                if (!this._element) {
                    this.render();
                }
                return this._element;
            },
            enumerable: true,
            configurable: true
        });
        NotRootView.prototype.render = function () {
            this._element = $([
                '<div class="notroot-view">',
                '<p>', nls.localize('wrongRoot', "This directory seems to be contained in a git repository."), '</p>',
                '<p>', nls.localize('pleaseRestart', "Open the repository's root directory in order to access Git features."), '</p>',
                '</div>'
            ].join('')).getHTMLElement();
        };
        NotRootView.prototype.focus = function () {
            return;
        };
        NotRootView.prototype.layout = function (dimension) {
            return;
        };
        NotRootView.prototype.setVisible = function (visible) {
            return winjs.Promise.as(null);
        };
        NotRootView.prototype.getSelection = function () {
            return selection_1.Selection.EMPTY;
        };
        NotRootView.prototype.getControl = function () {
            return null;
        };
        NotRootView.prototype.getActions = function () {
            return [];
        };
        NotRootView.prototype.getSecondaryActions = function () {
            return [];
        };
        return NotRootView;
    })(ee.EventEmitter);
    exports.NotRootView = NotRootView;
});
//# sourceMappingURL=notrootView.js.map