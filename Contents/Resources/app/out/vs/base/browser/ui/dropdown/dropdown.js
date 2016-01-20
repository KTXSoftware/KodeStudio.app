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
define(["require", "exports", 'vs/base/browser/builder', 'vs/base/common/winjs.base', 'vs/base/browser/touch', 'vs/base/common/actions', 'vs/base/browser/ui/actionbar/actionbar', 'vs/base/common/eventEmitter', 'vs/base/common/lifecycle', 'vs/css!./dropdown'], function (require, exports, Builder, WinJS, Touch, Actions, ActionBar, EventEmitter, Lifecycle) {
    var $ = Builder.$;
    var BaseDropdown = (function (_super) {
        __extends(BaseDropdown, _super);
        function BaseDropdown(container, options) {
            var _this = this;
            _super.call(this);
            this.toDispose = [];
            this.$el = $('.dropdown').appendTo(container);
            this.$label = $('.dropdown-label');
            if (options.tick || options.action) {
                this.$label.addClass('tick');
            }
            var labelRenderer = options.labelRenderer;
            if (!labelRenderer && options.action) {
                this.$action = $('.dropdown-action').appendTo(this.$el);
                var item = new ActionBar.ActionItem(null, options.action, {
                    icon: true,
                    label: true
                });
                item.actionRunner = this;
                item.render(this.$action.getHTMLElement());
                labelRenderer = function (container) {
                    container.innerText = '';
                    return item;
                };
            }
            if (!labelRenderer) {
                labelRenderer = function (container) {
                    $(container).text(options.label || '');
                    return null;
                };
            }
            this.$label.on(['click', Touch.EventType.Tap], function (e) {
                e.preventDefault();
                e.stopPropagation();
                _this.toggleDropdown();
            }).appendTo(this.$el);
            var cleanupFn = labelRenderer(this.$label.getHTMLElement());
            if (cleanupFn) {
                this.toDispose.push(cleanupFn);
            }
            this.toDispose.push(new Touch.Gesture(this.$label.getHTMLElement()));
        }
        Object.defineProperty(BaseDropdown.prototype, "tooltip", {
            set: function (tooltip) {
                this.$label.title(tooltip);
            },
            enumerable: true,
            configurable: true
        });
        /*protected*/ BaseDropdown.prototype.toggleDropdown = function () {
            if (this.$el.hasClass('active')) {
                this.hide();
            }
            else {
                this.show();
            }
        };
        /*protected*/ BaseDropdown.prototype.show = function () {
            // noop
        };
        /*protected*/ BaseDropdown.prototype.hide = function () {
            // noop
        };
        /*protected*/ BaseDropdown.prototype.onEvent = function (e, activeElement) {
            this.hide();
        };
        BaseDropdown.prototype.dispose = function () {
            _super.prototype.dispose.call(this);
            this.hide();
            this.toDispose = Lifecycle.disposeAll(this.toDispose);
            if (this.$boxContainer) {
                this.$boxContainer.destroy();
                this.$boxContainer = null;
            }
            if (this.$contents) {
                this.$contents.destroy();
                this.$contents = null;
            }
            if (this.$label) {
                this.$label.destroy();
                this.$label = null;
            }
        };
        return BaseDropdown;
    })(Actions.ActionRunner);
    exports.BaseDropdown = BaseDropdown;
    var Dropdown = (function (_super) {
        __extends(Dropdown, _super);
        function Dropdown(container, options) {
            _super.call(this, container, options);
            this.contextViewProvider = options.contextViewProvider;
        }
        Object.defineProperty(Dropdown.prototype, "contextViewProvider", {
            /*protected*/ get: function () {
                return this._contextViewProvider;
            },
            /*protected*/ set: function (contextViewProvider) {
                this._contextViewProvider = contextViewProvider;
            },
            enumerable: true,
            configurable: true
        });
        /*protected*/ Dropdown.prototype.show = function () {
            var _this = this;
            this.$el.addClass('active');
            this._contextViewProvider.showContextView({
                getAnchor: function () { return _this.$el.getHTMLElement(); },
                render: function (container) {
                    return _this.renderContents(container);
                },
                onDOMEvent: function (e, activeElement) {
                    _this.onEvent(e, activeElement);
                },
                onHide: function () {
                    _this.$el.removeClass('active');
                }
            });
        };
        /*protected*/ Dropdown.prototype.hide = function () {
            if (this._contextViewProvider) {
                this._contextViewProvider.hideContextView();
            }
        };
        /*protected*/ Dropdown.prototype.renderContents = function (container) {
            return null;
        };
        return Dropdown;
    })(BaseDropdown);
    exports.Dropdown = Dropdown;
    var DropdownMenu = (function (_super) {
        __extends(DropdownMenu, _super);
        function DropdownMenu(container, options) {
            _super.call(this, container, options);
            this._contextMenuProvider = options.contextMenuProvider;
            this.currentContainer = null;
            this.actions = options.actions || [];
            this.actionProvider = options.actionProvider;
            this.menuClassName = options.menuClassName || '';
        }
        Object.defineProperty(DropdownMenu.prototype, "contextMenuProvider", {
            /*protected*/ get: function () {
                return this._contextMenuProvider;
            },
            /*protected*/ set: function (contextMenuProvider) {
                this._contextMenuProvider = contextMenuProvider;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(DropdownMenu.prototype, "menuOptions", {
            get: function () {
                return this._menuOptions;
            },
            set: function (options) {
                this._menuOptions = options;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(DropdownMenu.prototype, "actions", {
            /*protected*/ get: function () {
                if (this.actionProvider) {
                    return this.actionProvider.getActions();
                }
                return this._actions;
            },
            /*protected*/ set: function (actions) {
                this._actions = actions;
            },
            enumerable: true,
            configurable: true
        });
        /*protected*/ DropdownMenu.prototype.show = function () {
            var _this = this;
            this.$el.addClass('active');
            this._contextMenuProvider.showContextMenu({
                getAnchor: function () { return _this.$el.getHTMLElement(); },
                getActions: function () { return WinJS.Promise.as(_this.actions); },
                getActionsContext: function () { return _this.menuOptions ? _this.menuOptions.context : null; },
                getActionItem: function (action) { return _this.menuOptions && _this.menuOptions.actionItemProvider ? _this.menuOptions.actionItemProvider(action) : null; },
                getMenuClassName: function () { return _this.menuClassName; },
                onHide: function () {
                    _this.$el.removeClass('active');
                    _this.currentContainer = null;
                }
            });
        };
        /*protected*/ DropdownMenu.prototype.hide = function () {
            // noop
        };
        return DropdownMenu;
    })(BaseDropdown);
    exports.DropdownMenu = DropdownMenu;
    var DropdownGroup = (function (_super) {
        __extends(DropdownGroup, _super);
        function DropdownGroup(container) {
            _super.call(this);
            this.el = document.createElement('div');
            this.el.className = 'dropdown-group';
            container.appendChild(this.el);
        }
        Object.defineProperty(DropdownGroup.prototype, "element", {
            get: function () {
                return this.el;
            },
            enumerable: true,
            configurable: true
        });
        return DropdownGroup;
    })(EventEmitter.EventEmitter);
    exports.DropdownGroup = DropdownGroup;
});
//# sourceMappingURL=dropdown.js.map