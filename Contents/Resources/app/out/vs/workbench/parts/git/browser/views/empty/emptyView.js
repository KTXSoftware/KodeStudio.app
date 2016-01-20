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
define(["require", "exports", 'vs/nls', 'vs/base/common/lifecycle', 'vs/base/common/eventEmitter', 'vs/base/browser/dom', 'vs/base/common/winjs.base', 'vs/base/browser/builder', 'vs/workbench/parts/git/common/git', 'vs/workbench/parts/git/browser/gitActions', 'vs/base/common/severity', 'vs/platform/files/common/files', 'vs/platform/instantiation/common/instantiation', 'vs/platform/message/common/message', 'vs/platform/selection/common/selection', 'vs/css!./emptyView'], function (require, exports, nls, Lifecycle, EventEmitter, DOM, WinJS, Builder, git, GitActions, severity_1, files_1, instantiation_1, message_1, selection_1) {
    var IGitService = git.IGitService;
    var $ = Builder.$;
    var Button = (function (_super) {
        __extends(Button, _super);
        function Button(container) {
            var _this = this;
            _super.call(this);
            this.$el = $('a.button.clone').href('#').appendTo(container);
            this.$el.on('click', function (e) {
                if (!_this.enabled) {
                    DOM.EventHelper.stop(e);
                    return;
                }
                _this.emit('click', e);
            });
        }
        Object.defineProperty(Button.prototype, "label", {
            set: function (value) {
                this.$el.text(value);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Button.prototype, "enabled", {
            get: function () {
                return !this.$el.hasClass('disabled');
            },
            set: function (value) {
                if (value) {
                    this.$el.removeClass('disabled');
                }
                else {
                    this.$el.addClass('disabled');
                }
            },
            enumerable: true,
            configurable: true
        });
        Button.prototype.dispose = function () {
            if (this.$el) {
                this.$el.dispose();
                this.$el = null;
            }
            _super.prototype.dispose.call(this);
        };
        return Button;
    })(EventEmitter.EventEmitter);
    exports.Button = Button;
    var EmptyView = (function (_super) {
        __extends(EmptyView, _super);
        function EmptyView(controller, actionRunner, gitService, instantiationService, messageService, fileService) {
            _super.call(this);
            this.ID = 'empty';
            this.gitService = gitService;
            this.instantiationService = instantiationService;
            this.messageService = messageService;
            this.fileService = fileService;
            this.actionRunner = actionRunner;
            this.isVisible = false;
            this.needsRender = false;
            this.controller = controller;
            this.toDispose = [];
        }
        Object.defineProperty(EmptyView.prototype, "initAction", {
            get: function () {
                if (!this._initAction) {
                    this._initAction = this.instantiationService.createInstance(GitActions.InitAction);
                }
                return this._initAction;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(EmptyView.prototype, "element", {
            // IView
            get: function () {
                this.render();
                return this.$el.getHTMLElement();
            },
            enumerable: true,
            configurable: true
        });
        EmptyView.prototype.render = function () {
            var _this = this;
            if (this.$el) {
                return;
            }
            this.$el = $('.empty-view');
            $('p').appendTo(this.$el).text(EmptyView.EMPTY_MESSAGE);
            var initSection = $('.section').appendTo(this.$el);
            this.initButton = new Button(initSection);
            this.initButton.label = nls.localize('gitinit', 'Initialize git repository');
            this.initButton.on('click', function (e) {
                DOM.EventHelper.stop(e);
                _this.disableUI();
                _this.actionRunner.run(_this.initAction).done(function () {
                    _this.enableUI();
                });
            });
            this.toDispose.push(this.gitService.addListener2(git.ServiceEvents.OPERATION, function () { return _this.onGitOperation(); }));
        };
        EmptyView.prototype.disableUI = function () {
            if (this.urlInputBox) {
                this.urlInputBox.disable();
            }
            if (this.cloneButton) {
                this.cloneButton.enabled = false;
            }
            this.initButton.enabled = false;
        };
        EmptyView.prototype.enableUI = function () {
            if (this.gitService.getRunningOperations().length > 0) {
                return;
            }
            if (this.urlInputBox) {
                this.urlInputBox.enable();
                this.urlInputBox.validate();
            }
            this.initButton.enabled = true;
        };
        EmptyView.prototype.onError = function (e) {
            this.messageService.show(severity_1.default.Error, e);
        };
        EmptyView.prototype.focus = function () {
            // no-op
        };
        EmptyView.prototype.layout = function (dimension) {
            // no-op
        };
        EmptyView.prototype.setVisible = function (visible) {
            this.isVisible = visible;
            return WinJS.Promise.as(null);
        };
        EmptyView.prototype.getSelection = function () {
            return selection_1.Selection.EMPTY;
        };
        EmptyView.prototype.getControl = function () {
            return null;
        };
        EmptyView.prototype.getActions = function () {
            return this.refreshAction ? [this.refreshAction] : [];
        };
        EmptyView.prototype.getSecondaryActions = function () {
            return [];
        };
        // Events
        EmptyView.prototype.onGitOperation = function () {
            if (this.gitService.getRunningOperations().length > 0) {
                this.disableUI();
            }
            else {
                this.enableUI();
            }
        };
        EmptyView.prototype.dispose = function () {
            if (this.$el) {
                this.$el.dispose();
                this.$el = null;
            }
            this.toDispose = Lifecycle.disposeAll(this.toDispose);
            _super.prototype.dispose.call(this);
        };
        EmptyView.EMPTY_MESSAGE = nls.localize('noGit', "This workspace isn't yet under git source control.");
        EmptyView = __decorate([
            __param(2, IGitService),
            __param(3, instantiation_1.IInstantiationService),
            __param(4, message_1.IMessageService),
            __param(5, files_1.IFileService)
        ], EmptyView);
        return EmptyView;
    })(EventEmitter.EventEmitter);
    exports.EmptyView = EmptyView;
});
//# sourceMappingURL=emptyView.js.map