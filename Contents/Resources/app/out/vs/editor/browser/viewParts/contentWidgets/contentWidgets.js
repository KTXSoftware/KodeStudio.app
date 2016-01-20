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
define(["require", "exports", 'vs/base/browser/dom', 'vs/editor/browser/view/viewPart', 'vs/editor/browser/editorBrowser', 'vs/css!./contentWidgets'], function (require, exports, DomUtils, viewPart_1, EditorBrowser) {
    var ViewContentWidgets = (function (_super) {
        __extends(ViewContentWidgets, _super);
        function ViewContentWidgets(context, viewDomNode) {
            _super.call(this, context);
            this._viewDomNode = viewDomNode;
            this._widgets = {};
            this._contentWidth = 0;
            this._contentLeft = 0;
            this.domNode = document.createElement('div');
            this.domNode.className = EditorBrowser.ClassNames.CONTENT_WIDGETS;
            this.overflowingContentWidgetsDomNode = document.createElement('div');
            this.overflowingContentWidgetsDomNode.className = EditorBrowser.ClassNames.OVERFLOWING_CONTENT_WIDGETS;
        }
        ViewContentWidgets.prototype.dispose = function () {
            _super.prototype.dispose.call(this);
            this._widgets = null;
            this.domNode = null;
        };
        // --- begin event handlers
        ViewContentWidgets.prototype.onModelFlushed = function () {
            return true;
        };
        ViewContentWidgets.prototype.onModelDecorationsChanged = function (e) {
            // true for inline decorations that can end up relayouting text
            return e.inlineDecorationsChanged;
        };
        ViewContentWidgets.prototype.onModelLinesDeleted = function (e) {
            return true;
        };
        ViewContentWidgets.prototype.onModelLineChanged = function (e) {
            return true;
        };
        ViewContentWidgets.prototype.onModelLinesInserted = function (e) {
            return true;
        };
        ViewContentWidgets.prototype.onCursorPositionChanged = function (e) {
            return false;
        };
        ViewContentWidgets.prototype.onCursorSelectionChanged = function (e) {
            return false;
        };
        ViewContentWidgets.prototype.onCursorRevealRange = function (e) {
            return false;
        };
        ViewContentWidgets.prototype.onConfigurationChanged = function (e) {
            return true;
        };
        ViewContentWidgets.prototype.onLayoutChanged = function (layoutInfo) {
            var _this = this;
            this._contentWidth = layoutInfo.contentWidth;
            this._contentLeft = layoutInfo.contentLeft;
            this._requestModificationFrameBeforeRendering(function () {
                // update the maxWidth on widgets nodes, such that `onReadAfterForcedLayout`
                // below can read out the adjusted width/height of widgets
                var widgetId;
                for (widgetId in _this._widgets) {
                    if (_this._widgets.hasOwnProperty(widgetId)) {
                        DomUtils.StyleMutator.setMaxWidth(_this._widgets[widgetId].widget.getDomNode(), _this._contentWidth);
                    }
                }
            });
            return true;
        };
        ViewContentWidgets.prototype.onScrollChanged = function (e) {
            return true;
        };
        ViewContentWidgets.prototype.onZonesChanged = function () {
            return true;
        };
        ViewContentWidgets.prototype.onScrollWidthChanged = function (scrollWidth) {
            return false;
        };
        ViewContentWidgets.prototype.onScrollHeightChanged = function (scrollHeight) {
            return false;
        };
        // ---- end view event handlers
        ViewContentWidgets.prototype.addWidget = function (widget) {
            var widgetData = {
                allowEditorOverflow: widget.allowEditorOverflow || false,
                widget: widget,
                position: null,
                preference: null,
                isVisible: false
            };
            this._widgets[widget.getId()] = widgetData;
            var domNode = widget.getDomNode();
            domNode.style.position = 'absolute';
            DomUtils.StyleMutator.setMaxWidth(domNode, this._contentWidth);
            DomUtils.StyleMutator.setVisibility(domNode, 'hidden');
            domNode.setAttribute('widgetId', widget.getId());
            if (widgetData.allowEditorOverflow) {
                this.overflowingContentWidgetsDomNode.appendChild(domNode);
            }
            else {
                this.domNode.appendChild(domNode);
            }
            this.shouldRender = true;
        };
        ViewContentWidgets.prototype.setWidgetPosition = function (widget, position, preference) {
            var widgetData = this._widgets[widget.getId()];
            widgetData.position = position;
            widgetData.preference = preference;
            this.shouldRender = true;
        };
        ViewContentWidgets.prototype.removeWidget = function (widget) {
            var widgetId = widget.getId();
            if (this._widgets.hasOwnProperty(widgetId)) {
                var widgetData = this._widgets[widgetId];
                delete this._widgets[widgetId];
                var domNode = widgetData.widget.getDomNode();
                domNode.parentNode.removeChild(domNode);
                domNode.removeAttribute('monaco-visible-content-widget');
                this.shouldRender = true;
            }
        };
        ViewContentWidgets.prototype._layoutBoxInViewport = function (position, domNode, ctx) {
            var visibleRange = ctx.visibleRangeForPosition(position);
            if (!visibleRange) {
                return null;
            }
            var width = domNode.clientWidth;
            var height = domNode.clientHeight;
            // Our visible box is split horizontally by the current line => 2 boxes
            // a) the box above the line
            var aboveLineTop = visibleRange.top;
            var heightAboveLine = aboveLineTop;
            // b) the box under the line
            var underLineTop = visibleRange.top + this._context.configuration.editor.lineHeight;
            var heightUnderLine = ctx.viewportHeight - underLineTop;
            var aboveTop = aboveLineTop - height;
            var fitsAbove = (heightAboveLine >= height);
            var belowTop = underLineTop;
            var fitsBelow = (heightUnderLine >= height);
            // And its left
            var actualLeft = visibleRange.left;
            if (actualLeft + width > ctx.viewportLeft + ctx.viewportWidth) {
                actualLeft = ctx.viewportLeft + ctx.viewportWidth - width;
            }
            if (actualLeft < ctx.viewportLeft) {
                actualLeft = ctx.viewportLeft;
            }
            return {
                aboveTop: aboveTop,
                fitsAbove: fitsAbove,
                belowTop: belowTop,
                fitsBelow: fitsBelow,
                left: actualLeft
            };
        };
        ViewContentWidgets.prototype._layoutBoxInPage = function (position, domNode, ctx) {
            var visibleRange = ctx.visibleRangeForPosition(position);
            if (!visibleRange) {
                return null;
            }
            var left0 = visibleRange.left - ctx.viewportLeft;
            var width = domNode.clientWidth, height = domNode.clientHeight;
            if (left0 + width < 0 || left0 > this._contentWidth) {
                return null;
            }
            var aboveTop = visibleRange.top - height, belowTop = visibleRange.top + this._context.configuration.editor.lineHeight, left = left0 + this._contentLeft;
            var domNodePosition = DomUtils.getDomNodePosition(this._viewDomNode);
            var absoluteAboveTop = domNodePosition.top + aboveTop - document.body.scrollTop - document.documentElement.scrollTop, absoluteBelowTop = domNodePosition.top + belowTop - document.body.scrollTop - document.documentElement.scrollTop, absoluteLeft = domNodePosition.left + left - document.body.scrollLeft - document.documentElement.scrollLeft;
            var INNER_WIDTH = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth, INNER_HEIGHT = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight;
            // Leave some clearance to the bottom
            var BOTTOM_PADDING = 22;
            var fitsAbove = (absoluteAboveTop >= 0), fitsBelow = (absoluteBelowTop + height <= INNER_HEIGHT - BOTTOM_PADDING);
            if (absoluteLeft + width + 20 > INNER_WIDTH) {
                var delta = absoluteLeft - (INNER_WIDTH - width - 20);
                absoluteLeft -= delta;
                left -= delta;
            }
            if (absoluteLeft < 0) {
                var delta = absoluteLeft;
                absoluteLeft -= delta;
                left -= delta;
            }
            return {
                aboveTop: aboveTop,
                fitsAbove: fitsAbove,
                belowTop: belowTop,
                fitsBelow: fitsBelow,
                left: left
            };
        };
        ViewContentWidgets.prototype._prepareRenderWidgetAtExactPosition = function (position, ctx) {
            var visibleRange = ctx.visibleRangeForPosition(position);
            if (!visibleRange) {
                return null;
            }
            return {
                top: visibleRange.top,
                left: visibleRange.left
            };
        };
        ViewContentWidgets.prototype._prepareRenderWidget = function (widgetData, ctx) {
            var _this = this;
            if (!widgetData.position || !widgetData.preference) {
                return null;
            }
            // Do not trust that widgets have a valid position
            var validModelPosition = this._context.model.validateModelPosition(widgetData.position), position = this._context.model.convertModelPositionToViewPosition(validModelPosition.lineNumber, validModelPosition.column), pref, pass, i;
            var placement = null;
            var fetchPlacement = function () {
                if (placement) {
                    return;
                }
                var domNode = widgetData.widget.getDomNode();
                if (widgetData.allowEditorOverflow) {
                    placement = _this._layoutBoxInPage(position, domNode, ctx);
                }
                else {
                    placement = _this._layoutBoxInViewport(position, domNode, ctx);
                }
            };
            // Do two passes, first for perfect fit, second picks first option
            for (pass = 1; pass <= 2; pass++) {
                for (i = 0; i < widgetData.preference.length; i++) {
                    pref = widgetData.preference[i];
                    if (pref === EditorBrowser.ContentWidgetPositionPreference.ABOVE) {
                        fetchPlacement();
                        if (!placement) {
                            // Widget outside of viewport
                            return null;
                        }
                        if (pass === 2 || placement.fitsAbove) {
                            return {
                                top: placement.aboveTop,
                                left: placement.left
                            };
                        }
                    }
                    else if (pref === EditorBrowser.ContentWidgetPositionPreference.BELOW) {
                        fetchPlacement();
                        if (!placement) {
                            // Widget outside of viewport
                            return null;
                        }
                        if (pass === 2 || placement.fitsBelow) {
                            return {
                                top: placement.belowTop,
                                left: placement.left
                            };
                        }
                    }
                    else {
                        return this._prepareRenderWidgetAtExactPosition(position, ctx);
                    }
                }
            }
        };
        ViewContentWidgets.prototype._render = function (ctx) {
            var _this = this;
            var data = {}, renderData, widgetId;
            for (widgetId in this._widgets) {
                if (this._widgets.hasOwnProperty(widgetId)) {
                    renderData = this._prepareRenderWidget(this._widgets[widgetId], ctx);
                    if (renderData) {
                        data[widgetId] = renderData;
                    }
                }
            }
            this._requestModificationFrame(function () {
                var widgetId, widget, domNode;
                for (widgetId in _this._widgets) {
                    if (_this._widgets.hasOwnProperty(widgetId)) {
                        widget = _this._widgets[widgetId];
                        domNode = _this._widgets[widgetId].widget.getDomNode();
                        if (data.hasOwnProperty(widgetId)) {
                            if (widget.allowEditorOverflow) {
                                DomUtils.StyleMutator.setTop(domNode, data[widgetId].top);
                                DomUtils.StyleMutator.setLeft(domNode, data[widgetId].left);
                            }
                            else {
                                DomUtils.StyleMutator.setTop(domNode, data[widgetId].top + ctx.viewportTop - ctx.bigNumbersDelta);
                                DomUtils.StyleMutator.setLeft(domNode, data[widgetId].left);
                            }
                            if (!widget.isVisible) {
                                DomUtils.StyleMutator.setVisibility(domNode, 'inherit');
                                domNode.setAttribute('monaco-visible-content-widget', 'true');
                                widget.isVisible = true;
                            }
                        }
                        else {
                            if (widget.isVisible) {
                                domNode.removeAttribute('monaco-visible-content-widget');
                                widget.isVisible = false;
                                DomUtils.StyleMutator.setVisibility(domNode, 'hidden');
                            }
                        }
                    }
                }
            });
        };
        return ViewContentWidgets;
    })(viewPart_1.ViewPart);
    exports.ViewContentWidgets = ViewContentWidgets;
});
//# sourceMappingURL=contentWidgets.js.map