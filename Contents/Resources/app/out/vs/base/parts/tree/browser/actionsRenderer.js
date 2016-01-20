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
define(["require", "exports", 'vs/base/browser/builder', 'vs/base/browser/dom', 'vs/base/common/events', 'vs/base/browser/ui/actionbar/actionbar', './treeDefaults', 'vs/css!./actionsRenderer'], function (require, exports, Builder, Dom, Events, ActionBar, TreeDefaults) {
    var $ = Builder.$;
    var ActionsRenderer = (function (_super) {
        __extends(ActionsRenderer, _super);
        function ActionsRenderer(opts) {
            _super.call(this);
            this.actionProvider = opts.actionProvider;
            this.actionRunner = opts.actionRunner;
        }
        ActionsRenderer.prototype.getHeight = function (tree, element) {
            return this.getContentHeight(tree, element);
        };
        ActionsRenderer.prototype.render = function (tree, element, container, previousCleanupFn) {
            var _this = this;
            try {
                Dom.clearNode(container);
            }
            catch (e) {
                if (!/The node to be removed is no longer a child of this node/.test(e.message)) {
                    throw e;
                }
            }
            if (previousCleanupFn) {
                previousCleanupFn(tree, element);
            }
            var $container = $(container).addClass('actions');
            var $subContainer = $('.sub-content').appendTo($container);
            var actionBar;
            var actionBarListener;
            if (this.actionProvider.hasActions(tree, element)) {
                $container.addClass('has-actions');
                actionBar = new ActionBar.ActionBar($('.primary-action-bar').appendTo($container), {
                    context: this.getActionContext(tree, element),
                    actionItemProvider: function (a) { return _this.actionProvider.getActionItem(tree, element, a); },
                    actionRunner: this.actionRunner
                });
                this.actionProvider.getActions(tree, element).then(function (actions) {
                    actionBar.push(actions, { icon: true, label: false });
                });
                actionBarListener = actionBar.addListener2(Events.EventType.RUN, function (event) {
                    if (event.error) {
                        _this.onError(event.error);
                    }
                });
            }
            else {
                $container.removeClass('has-actions');
            }
            var previousContentsCleanupFn = (previousCleanupFn ? previousCleanupFn[ActionsRenderer.CONTENTS_CLEANUP_FN_KEY] : ActionsRenderer.NO_OP) || ActionsRenderer.NO_OP;
            previousContentsCleanupFn(tree, element);
            var contentsCleanupFn = this.renderContents(tree, element, $subContainer.getHTMLElement(), null);
            var cleanupFn = function () {
                if (actionBarListener) {
                    actionBarListener.dispose();
                }
                if (actionBar) {
                    actionBar.dispose();
                }
                if (contentsCleanupFn) {
                    contentsCleanupFn(tree, element);
                }
            };
            cleanupFn[ActionsRenderer.CONTENTS_CLEANUP_FN_KEY] = contentsCleanupFn;
            return cleanupFn;
        };
        /* protected */ ActionsRenderer.prototype.getContentHeight = function (tree, element) {
            return 20;
        };
        /* protected */ ActionsRenderer.prototype.renderContents = function (tree, element, container, previousCleanupFn) {
            return null;
        };
        /* protected */ ActionsRenderer.prototype.getActionContext = function (tree, element) {
            return null;
        };
        /* protected */ ActionsRenderer.prototype.onError = function (error) {
            return;
        };
        ActionsRenderer.prototype.dispose = function () {
            this.actionProvider = null;
        };
        ActionsRenderer.CONTENTS_CLEANUP_FN_KEY = '__$ActionsRenderer.contentCleanupFn';
        ActionsRenderer.NO_OP = function () { };
        return ActionsRenderer;
    })(TreeDefaults.LegacyRenderer);
    exports.ActionsRenderer = ActionsRenderer;
});
//# sourceMappingURL=actionsRenderer.js.map