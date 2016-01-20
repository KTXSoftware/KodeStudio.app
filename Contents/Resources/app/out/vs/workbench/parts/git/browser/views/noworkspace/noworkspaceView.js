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
define(["require", "exports", 'vs/nls', 'vs/base/common/winjs.base', 'vs/base/common/eventEmitter', 'vs/base/browser/builder', 'vs/platform/selection/common/selection', 'vs/css!./noworkspaceView'], function (require, exports, nls, winjs, ee, builder, selection_1) {
    var $ = builder.$;
    var NoWorkspaceView = (function (_super) {
        __extends(NoWorkspaceView, _super);
        function NoWorkspaceView() {
            _super.apply(this, arguments);
            this.ID = 'noworkspace';
        }
        Object.defineProperty(NoWorkspaceView.prototype, "element", {
            get: function () {
                if (!this._element) {
                    this.render();
                }
                return this._element;
            },
            enumerable: true,
            configurable: true
        });
        NoWorkspaceView.prototype.render = function () {
            this._element = $([
                '<div class="noworkspace-view">',
                '<p>', nls.localize('noWorkspace', "There is no currently opened folder."), '</p>',
                '<p>', nls.localize('pleaseRestart', "Open a folder with a Git repository in order to access Git features."), '</p>',
                '</div>'
            ].join('')).getHTMLElement();
        };
        NoWorkspaceView.prototype.focus = function () {
            return;
        };
        NoWorkspaceView.prototype.layout = function (dimension) {
            return;
        };
        NoWorkspaceView.prototype.setVisible = function (visible) {
            return winjs.Promise.as(null);
        };
        NoWorkspaceView.prototype.getSelection = function () {
            return selection_1.Selection.EMPTY;
        };
        NoWorkspaceView.prototype.getControl = function () {
            return null;
        };
        NoWorkspaceView.prototype.getActions = function () {
            return [];
        };
        NoWorkspaceView.prototype.getSecondaryActions = function () {
            return [];
        };
        return NoWorkspaceView;
    })(ee.EventEmitter);
    exports.NoWorkspaceView = NoWorkspaceView;
});
//# sourceMappingURL=noworkspaceView.js.map