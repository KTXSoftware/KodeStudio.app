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
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") return Reflect.decorate(decorators, target, key, desc);
    switch (arguments.length) {
        case 2: return decorators.reduceRight(function(o, d) { return (d && d(o)) || o; }, target);
        case 3: return decorators.reduceRight(function(o, d) { return (d && d(target, key)), void 0; }, void 0);
        case 4: return decorators.reduceRight(function(o, d) { return (d && d(target, key, o)) || o; }, desc);
    }
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
define(["require", "exports", 'vs/nls', 'vs/base/browser/keyboardEvent', 'vs/base/browser/builder', 'vs/base/common/strings', 'vs/base/browser/ui/inputbox/inputBox', 'vs/base/browser/ui/actionbar/actionbar', 'vs/workbench/parts/git/common/git', 'vs/platform/contextview/browser/contextView', 'vs/base/common/keyCodes'], function (require, exports, nls, Keyboard, Builder, Strings, InputBox, ActionBar, git, contextView_1, keyCodes_1) {
    var IGitService = git.IGitService;
    var $ = Builder.$;
    var CreateBranchActionItem = (function (_super) {
        __extends(CreateBranchActionItem, _super);
        function CreateBranchActionItem(action, contextViewService, gitService) {
            _super.call(this, null, action);
            this.contextViewService = contextViewService;
            this.gitService = gitService;
        }
        CreateBranchActionItem.prototype.render = function (container) {
            var _this = this;
            this.inputBox = new InputBox.InputBox(container, this.contextViewService, {
                placeholder: nls.localize('createNewBranch', "Create New Branch"),
                validationOptions: {
                    showMessage: false,
                    validation: function (v) { return _this.validate(v); }
                }
            });
            $(this.inputBox.inputElement).on('keyup', function (e) { return _this.onKeyUp(e); });
            this._updateEnabled();
        };
        CreateBranchActionItem.prototype._updateEnabled = function () {
            if (this._action.enabled) {
                this.inputBox.enable();
            }
            else {
                this.inputBox.disable();
            }
        };
        CreateBranchActionItem.prototype.focus = function () {
            this.inputBox.focus();
        };
        CreateBranchActionItem.prototype.blur = function () {
            // no-op
        };
        CreateBranchActionItem.prototype.validate = function (value) {
            if (/^\.|\/\.|\.\.|~|\^|:|\/$|\.lock$|\.lock\/|\\|\*|^\s*$/.test(value)) {
                return { content: nls.localize('invalidBranchName', "Invalid branch name.") };
            }
            var model = this.gitService.getModel();
            var heads = model.getHeads();
            if (heads.some(function (h) { return h.name === value; })) {
                return { content: nls.localize('dupeBranchName', "Branch name already exists.") };
            }
            return null;
        };
        CreateBranchActionItem.prototype.onKeyUp = function (e) {
            var event = new Keyboard.StandardKeyboardEvent(e);
            if (event.equals(keyCodes_1.CommonKeybindings.ENTER)) {
                event.preventDefault();
                event.stopPropagation();
                if (this.validate(this.inputBox.value)) {
                    return;
                }
                var context = Strings.trim(this.inputBox.value);
                this.actionRunner.run(this._action, context).done();
            }
        };
        CreateBranchActionItem.prototype.dispose = function () {
            this.inputBox.dispose();
            _super.prototype.dispose.call(this);
        };
        CreateBranchActionItem = __decorate([
            __param(1, contextView_1.IContextViewService),
            __param(2, IGitService)
        ], CreateBranchActionItem);
        return CreateBranchActionItem;
    })(ActionBar.BaseActionItem);
    exports.CreateBranchActionItem = CreateBranchActionItem;
});
//# sourceMappingURL=gitActionItems.js.map