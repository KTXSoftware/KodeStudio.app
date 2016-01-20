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
define(["require", "exports", 'vs/base/common/platform', 'vs/base/browser/browser', 'vs/base/common/winjs.base', 'vs/base/browser/dom', 'vs/base/common/diff/diff', 'vs/base/browser/touch', 'vs/base/browser/mouseEvent', 'vs/base/browser/keyboardEvent', './treeDnd', 'vs/base/common/iterator', 'vs/base/browser/ui/scrollbar/impl/scrollableElement', 'vs/base/parts/tree/browser/treeViewModel', 'vs/base/parts/tree/browser/tree', 'vs/base/common/keyCodes'], function (require, exports, Platform, Browser, WinJS, DOM, Diff, Touch, Mouse, Keyboard, dnd, iterator_1, ScrollableElementImpl, treeViewModel_1, _, keyCodes_1) {
    function getLastScrollTime(element) {
        var value = element.getAttribute('last-scroll-time');
        return value ? parseInt(value, 10) : 0;
    }
    function removeFromParent(element) {
        try {
            element.parentElement.removeChild(element);
        }
        catch (e) {
        }
    }
    var RowCache = (function () {
        function RowCache(context) {
            this.context = context;
            this._cache = { '': [] };
            this.scrollingRow = null;
        }
        RowCache.prototype.alloc = function (templateId) {
            var result = this.cache(templateId).pop();
            if (!result) {
                var content = document.createElement('div');
                content.className = 'content';
                var row = document.createElement('div');
                row.appendChild(content);
                result = {
                    element: row,
                    templateId: templateId,
                    templateData: this.context.renderer.renderTemplate(this.context.tree, templateId, content)
                };
            }
            return result;
        };
        RowCache.prototype.release = function (templateId, row) {
            var lastScrollTime = getLastScrollTime(row.element);
            if (!lastScrollTime) {
                removeFromParent(row.element);
                this.cache(templateId).push(row);
                return;
            }
            if (this.scrollingRow) {
                var lastKnownScrollTime = getLastScrollTime(this.scrollingRow.element);
                if (lastKnownScrollTime > lastScrollTime) {
                    removeFromParent(row.element);
                    this.cache(templateId).push(row);
                    return;
                }
                if (this.scrollingRow.element.parentElement) {
                    removeFromParent(this.scrollingRow.element);
                    DOM.removeClass(this.scrollingRow.element, 'scrolling');
                    this.cache(this.scrollingRow.templateId).push(this.scrollingRow);
                }
            }
            this.scrollingRow = row;
            DOM.addClass(this.scrollingRow.element, 'scrolling');
        };
        RowCache.prototype.cache = function (templateId) {
            return this._cache[templateId] || (this._cache[templateId] = []);
        };
        RowCache.prototype.garbageCollect = function () {
            var _this = this;
            if (this._cache) {
                Object.keys(this._cache).forEach(function (templateId) {
                    _this._cache[templateId].forEach(function (cachedRow) {
                        _this.context.renderer.disposeTemplate(_this.context.tree, templateId, cachedRow.templateData);
                        cachedRow.element = null;
                        cachedRow.templateData = null;
                    });
                    delete _this._cache[templateId];
                });
            }
            if (this.scrollingRow) {
                this.context.renderer.disposeTemplate(this.context.tree, this.scrollingRow.templateId, this.scrollingRow.templateData);
                this.scrollingRow = null;
            }
        };
        RowCache.prototype.dispose = function () {
            this.garbageCollect();
            this._cache = null;
            this.context = null;
        };
        return RowCache;
    })();
    exports.RowCache = RowCache;
    var ViewItem = (function () {
        function ViewItem(context, model) {
            var _this = this;
            this.context = context;
            this.model = model;
            this.id = this.model.id;
            this.row = null;
            this.top = 0;
            this.height = model.getHeight();
            this._styles = {};
            model.getAllTraits().forEach(function (t) { return _this._styles[t] = true; });
            if (model.isExpanded()) {
                this.addClass('expanded');
            }
        }
        Object.defineProperty(ViewItem.prototype, "expanded", {
            set: function (value) {
                value ? this.addClass('expanded') : this.removeClass('expanded');
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ViewItem.prototype, "loading", {
            set: function (value) {
                value ? this.addClass('loading') : this.removeClass('loading');
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ViewItem.prototype, "draggable", {
            get: function () {
                return this._draggable;
            },
            set: function (value) {
                this._draggable = value;
                this.render(true);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ViewItem.prototype, "dropTarget", {
            set: function (value) {
                value ? this.addClass('drop-target') : this.removeClass('drop-target');
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ViewItem.prototype, "element", {
            get: function () {
                return this.row && this.row.element;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ViewItem.prototype, "templateId", {
            get: function () {
                return this._templateId || (this._templateId = (this.context.renderer.getTemplateId && this.context.renderer.getTemplateId(this.context.tree, this.model.getElement())));
            },
            enumerable: true,
            configurable: true
        });
        ViewItem.prototype.addClass = function (name) {
            this._styles[name] = true;
            this.render(true);
        };
        ViewItem.prototype.removeClass = function (name) {
            delete this._styles[name]; // is this slow?
            this.render(true);
        };
        ViewItem.prototype.render = function (skipUserRender) {
            var _this = this;
            if (skipUserRender === void 0) { skipUserRender = false; }
            if (!this.model || !this.element) {
                return;
            }
            var classes = ['monaco-tree-row'];
            classes.push.apply(classes, Object.keys(this._styles));
            if (this.model.hasChildren()) {
                classes.push('has-children');
            }
            this.element.className = classes.join(' ');
            this.element.draggable = this.draggable;
            this.element.style.height = this.height + 'px';
            if (this.context.options.paddingOnRow) {
                this.element.style.paddingLeft = this.context.options.twistiePixels + ((this.model.getDepth() - 1) * this.context.options.indentPixels) + 'px';
            }
            else {
                this.element.style.paddingLeft = ((this.model.getDepth() - 1) * this.context.options.indentPixels) + 'px';
                this.row.element.firstElementChild.style.paddingLeft = this.context.options.twistiePixels + 'px';
            }
            var uri = this.context.dnd.getDragURI(this.context.tree, this.model.getElement());
            if (uri !== this.uri) {
                if (this.unbindDragStart) {
                    this.unbindDragStart();
                    delete this.unbindDragStart;
                }
                if (uri) {
                    this.uri = uri;
                    this.draggable = true;
                    this.unbindDragStart = DOM.addListener(this.element, 'dragstart', function (e) {
                        _this.onDragStart(e);
                    });
                }
                else {
                    this.uri = null;
                }
            }
            if (!skipUserRender) {
                this.context.renderer.renderElement(this.context.tree, this.model.getElement(), this.templateId, this.row.templateData);
            }
        };
        ViewItem.prototype.insertInDOM = function (container, afterElement) {
            if (!this.row) {
                this.row = this.context.cache.alloc(this.templateId);
                // used in reverse lookup from HTMLElement to Item
                this.element[TreeView.BINDING] = this;
            }
            if (this.element.parentElement) {
                return;
            }
            if (afterElement === null) {
                container.appendChild(this.element);
            }
            else {
                try {
                    container.insertBefore(this.element, afterElement);
                }
                catch (e) {
                    console.warn('Failed to locate previous tree element');
                    container.appendChild(this.element);
                }
            }
            this.render();
        };
        ViewItem.prototype.removeFromDOM = function () {
            if (!this.row) {
                return;
            }
            if (this.unbindDragStart) {
                this.unbindDragStart();
                this.unbindDragStart = null;
            }
            this.uri = null;
            this.element[TreeView.BINDING] = null;
            this.context.cache.release(this.templateId, this.row);
            this.row = null;
        };
        ViewItem.prototype.dispose = function () {
            this.row = null;
            this.model = null;
        };
        return ViewItem;
    })();
    exports.ViewItem = ViewItem;
    var RootViewItem = (function (_super) {
        __extends(RootViewItem, _super);
        function RootViewItem(context, model, wrapper) {
            _super.call(this, context, model);
            this.row = {
                element: wrapper,
                templateData: null,
                templateId: null
            };
        }
        RootViewItem.prototype.render = function () {
            if (!this.model || !this.element) {
                return;
            }
            var classes = ['monaco-tree-wrapper'];
            classes.push.apply(classes, Object.keys(this._styles));
            if (this.model.hasChildren()) {
                classes.push('has-children');
            }
            this.element.className = classes.join(' ');
        };
        RootViewItem.prototype.insertInDOM = function (container, afterElement) {
            // noop
        };
        RootViewItem.prototype.removeFromDOM = function () {
            // noop
        };
        return RootViewItem;
    })(ViewItem);
    function reactionEquals(one, other) {
        if (!one && !other) {
            return true;
        }
        else if (!one || !other) {
            return false;
        }
        else if (one.accept !== other.accept) {
            return false;
        }
        else if (one.bubble !== other.bubble) {
            return false;
        }
        else if (one.effect !== other.effect) {
            return false;
        }
        else {
            return true;
        }
    }
    var TreeView = (function (_super) {
        __extends(TreeView, _super);
        function TreeView(context, container) {
            var _this = this;
            _super.call(this);
            this.lastClickTimeStamp = 0;
            this.isRefreshing = false;
            this.refreshingPreviousChildrenIds = {};
            this.context = {
                dataSource: context.dataSource,
                renderer: context.renderer,
                controller: context.controller,
                dnd: context.dnd,
                filter: context.filter,
                sorter: context.sorter,
                tree: context.tree,
                options: context.options,
                cache: new RowCache(context)
            };
            this.modelListeners = [];
            this.viewListeners = [];
            this.dragAndDropListeners = [];
            this.model = null;
            this.items = {};
            this.domNode = document.createElement('div');
            this.domNode.className = 'monaco-tree';
            this.domNode.tabIndex = 0;
            if (this.context.options.alwaysFocused) {
                DOM.addClass(this.domNode, 'focused');
            }
            if (this.context.options.bare) {
                DOM.addClass(this.domNode, 'bare');
            }
            if (!this.context.options.paddingOnRow) {
                DOM.addClass(this.domNode, 'no-row-padding');
            }
            this.wrapper = document.createElement('div');
            this.wrapper.className = 'monaco-tree-wrapper';
            this.scrollableElement = new ScrollableElementImpl.ScrollableElement(this.wrapper, {
                forbidTranslate3dUse: true,
                scrollable: this,
                horizontal: 'hidden',
                vertical: context.options.verticalScrollMode || 'auto',
                useShadows: context.options.useShadows,
                saveLastScrollTimeOnClassName: 'monaco-tree-row'
            });
            if (Browser.isIE11orEarlier) {
                this.wrapper.style.msTouchAction = 'none';
                this.wrapper.style.msContentZooming = 'none';
            }
            else {
                this.wrapperGesture = new Touch.Gesture(this.wrapper);
            }
            this.rowsContainer = document.createElement('div');
            this.rowsContainer.className = 'monaco-tree-rows';
            this.fakeRow = document.createElement('div');
            this.fakeRow.className = 'monaco-tree-row fake';
            this.fakeContent = document.createElement('div');
            this.fakeContent.className = 'content';
            this.fakeRow.appendChild(this.fakeContent);
            this.rowsContainer.appendChild(this.fakeRow);
            var focusTracker = DOM.trackFocus(this.domNode);
            focusTracker.addFocusListener(function (e) { return _this.onFocus(e); });
            focusTracker.addBlurListener(function (e) { return _this.onBlur(e); });
            this.viewListeners.push(function () { focusTracker.dispose(); });
            this.viewListeners.push(DOM.addListener(this.domNode, 'keydown', function (e) { return _this.onKeyDown(e); }));
            this.viewListeners.push(DOM.addListener(this.domNode, 'keyup', function (e) { return _this.onKeyUp(e); }));
            this.viewListeners.push(DOM.addListener(this.domNode, 'mousedown', function (e) { return _this.onMouseDown(e); }));
            this.viewListeners.push(DOM.addListener(this.domNode, 'mouseup', function (e) { return _this.onMouseUp(e); }));
            this.viewListeners.push(DOM.addListener(this.wrapper, 'click', function (e) { return _this.onClick(e); }));
            this.viewListeners.push(DOM.addListener(this.domNode, 'contextmenu', function (e) { return _this.onContextMenu(e); }));
            this.viewListeners.push(DOM.addListener(this.wrapper, Touch.EventType.Tap, function (e) { return _this.onTap(e); }));
            this.viewListeners.push(DOM.addListener(this.wrapper, Touch.EventType.Change, function (e) { return _this.onTouchChange(e); }));
            if (Browser.isIE11orEarlier) {
                this.viewListeners.push(DOM.addListener(this.wrapper, 'MSPointerDown', function (e) { return _this.onMsPointerDown(e); }));
                this.viewListeners.push(DOM.addListener(this.wrapper, 'MSGestureTap', function (e) { return _this.onMsGestureTap(e); }));
                // these events come too fast, we throttle them
                this.viewListeners.push(DOM.addThrottledListener(this.wrapper, 'MSGestureChange', function (e) { return _this.onThrottledMsGestureChange(e); }, function (lastEvent, event) {
                    event.stopPropagation();
                    event.preventDefault();
                    var result = { translationY: event.translationY, translationX: event.translationX };
                    if (lastEvent) {
                        result.translationY += lastEvent.translationY;
                        result.translationX += lastEvent.translationX;
                    }
                    return result;
                }));
            }
            this.viewListeners.push(DOM.addListener(window, 'dragover', function (e) { return _this.onDragOver(e); }));
            this.viewListeners.push(DOM.addListener(window, 'drop', function (e) { return _this.onDrop(e); }));
            this.viewListeners.push(DOM.addListener(window, 'dragend', function (e) { return _this.onDragEnd(e); }));
            this.viewListeners.push(DOM.addListener(window, 'dragleave', function (e) { return _this.onDragOver(e); }));
            this.wrapper.appendChild(this.rowsContainer);
            this.domNode.appendChild(this.scrollableElement.getDomNode());
            container.appendChild(this.domNode);
            this._scrollTop = 0;
            this._viewHeight = 0;
            this.renderTop = 0;
            this.renderHeight = 0;
            this.didJustPressContextMenuKey = false;
            this.currentDropTarget = null;
            this.currentDropTargets = [];
            this.shouldInvalidateDropReaction = false;
            this.dragAndDropScrollInterval = null;
            this.dragAndDropScrollTimeout = null;
            this.onHiddenScrollTop = null;
            this.onRowsChanged();
            this.layout();
            this.setupMSGesture();
        }
        TreeView.prototype.createViewItem = function (item) {
            return new ViewItem(this.context, item);
        };
        TreeView.prototype.getHTMLElement = function () {
            return this.domNode;
        };
        TreeView.prototype.focus = function () {
            this.domNode.focus();
        };
        TreeView.prototype.isFocused = function () {
            return document.activeElement === this.domNode;
        };
        TreeView.prototype.blur = function () {
            this.domNode.blur();
        };
        TreeView.prototype.onVisible = function () {
            this.scrollTop = this.onHiddenScrollTop;
            this.onHiddenScrollTop = null;
            this.scrollableElement.onElementDimensions();
            this.scrollableElement.onElementInternalDimensions();
            this.setupMSGesture();
        };
        TreeView.prototype.setupMSGesture = function () {
            var _this = this;
            if (window.MSGesture) {
                this.msGesture = new MSGesture();
                setTimeout(function () { return _this.msGesture.target = _this.wrapper; }, 100); // TODO@joh, TODO@IETeam
            }
        };
        TreeView.prototype.onHidden = function () {
            this.onHiddenScrollTop = this.scrollTop;
        };
        TreeView.prototype.isTreeVisible = function () {
            return this.onHiddenScrollTop === null;
        };
        TreeView.prototype.layout = function (height) {
            if (!this.isTreeVisible()) {
                return;
            }
            this.viewHeight = height || DOM.getContentHeight(this.wrapper); // render
            this.scrollTop = this.scrollTop; // render
            this.scrollableElement.onElementDimensions();
            this.scrollableElement.onElementInternalDimensions();
        };
        TreeView.prototype.render = function (scrollTop, viewHeight) {
            var scrollBottom = scrollTop + viewHeight;
            var thisScrollBottom = this.scrollTop + this.viewHeight;
            var i;
            var stop;
            var renderTop = scrollTop;
            renderTop = Math.max(renderTop, 0);
            var renderBottom = scrollBottom;
            var thisRenderBottom = thisScrollBottom === 0 ? 0 : thisScrollBottom;
            // when view scrolls down, start rendering from the renderBottom
            for (i = this.indexAfter(renderBottom) - 1, stop = this.indexAt(Math.max(thisRenderBottom, renderTop)); i >= stop; i--) {
                this.insertItemInDOM(this.itemAtIndex(i));
            }
            // when view scrolls up, start rendering from either this.renderTop or renderBottom
            for (i = Math.min(this.indexAt(this.renderTop), this.indexAfter(renderBottom)) - 1, stop = this.indexAt(renderTop); i >= stop; i--) {
                this.insertItemInDOM(this.itemAtIndex(i));
            }
            // when view scrolls down, start unrendering from renderTop
            for (i = this.indexAt(this.renderTop), stop = Math.min(this.indexAt(renderTop), this.indexAfter(thisRenderBottom)); i < stop; i++) {
                this.removeItemFromDOM(this.itemAtIndex(i));
            }
            // when view scrolls up, start unrendering from either renderBottom this.renderTop
            for (i = Math.max(this.indexAfter(renderBottom), this.indexAt(this.renderTop)), stop = this.indexAfter(thisRenderBottom); i < stop; i++) {
                this.removeItemFromDOM(this.itemAtIndex(i));
            }
            var topItem = this.itemAtIndex(this.indexAt(renderTop));
            if (topItem) {
                this.rowsContainer.style.top = (topItem.top - renderTop) + 'px';
            }
            this.renderTop = renderTop;
            this.renderHeight = renderBottom - renderTop;
        };
        TreeView.prototype.setModel = function (newModel) {
            var _this = this;
            this.releaseModel();
            this.model = newModel;
            this.modelListeners.push(this.model.addBulkListener(function (e) { return _this.onModelEvents(e); }));
        };
        TreeView.prototype.onModelEvents = function (events) {
            var elementsToRefresh = [];
            for (var i = 0, len = events.length; i < len; i++) {
                var event = events[i];
                var data = event.getData();
                switch (event.getType()) {
                    case 'refreshing':
                        this.onRefreshing();
                        break;
                    case 'refreshed':
                        this.onRefreshed();
                        break;
                    case 'clearingInput':
                        this.onClearingInput(data);
                        break;
                    case 'setInput':
                        this.onSetInput(data);
                        break;
                    case 'item:childrenRefreshing':
                        this.onItemChildrenRefreshing(data);
                        break;
                    case 'item:childrenRefreshed':
                        this.onItemChildrenRefreshed(data);
                        break;
                    case 'item:refresh':
                        elementsToRefresh.push(data.item);
                        break;
                    case 'item:expanding':
                        this.onItemExpanding(data);
                        break;
                    case 'item:expanded':
                        this.onItemExpanded(data);
                        break;
                    case 'item:collapsing':
                        this.onItemCollapsing(data);
                        break;
                    case 'item:reveal':
                        this.onItemReveal(data);
                        break;
                    case 'item:addTrait':
                        this.onItemAddTrait(data);
                        break;
                    case 'item:removeTrait':
                        this.onItemRemoveTrait(data);
                        break;
                }
            }
            if (elementsToRefresh.length > 0) {
                this.onItemsRefresh(elementsToRefresh);
            }
        };
        TreeView.prototype.onRefreshing = function () {
            this.isRefreshing = true;
        };
        TreeView.prototype.onRefreshed = function () {
            this.isRefreshing = false;
            this.onRowsChanged();
        };
        TreeView.prototype.onRowsChanged = function (scrollTop) {
            if (scrollTop === void 0) { scrollTop = this.scrollTop; }
            if (this.isRefreshing) {
                return;
            }
            this.scrollTop = scrollTop;
            this.scrollableElement.onElementInternalDimensions();
        };
        TreeView.prototype.withFakeRow = function (fn) {
            return fn(this.fakeContent);
        };
        TreeView.prototype.focusNextPage = function (eventPayload) {
            var _this = this;
            var lastPageIndex = this.indexAt(this.scrollTop + this.viewHeight);
            lastPageIndex = lastPageIndex === 0 ? 0 : lastPageIndex - 1;
            var lastPageElement = this.itemAtIndex(lastPageIndex).model.getElement();
            var currentlyFocusedElement = this.model.getFocus();
            if (currentlyFocusedElement !== lastPageElement) {
                this.model.setFocus(lastPageElement, eventPayload);
            }
            else {
                var previousScrollTop = this.scrollTop;
                this.scrollTop += this.viewHeight;
                if (this.scrollTop !== previousScrollTop) {
                    // Let the scroll event listener run
                    setTimeout(function () {
                        _this.focusNextPage(eventPayload);
                    }, 0);
                }
            }
        };
        TreeView.prototype.focusPreviousPage = function (eventPayload) {
            var _this = this;
            var firstPageIndex;
            if (this.scrollTop === 0) {
                firstPageIndex = this.indexAt(this.scrollTop);
            }
            else {
                firstPageIndex = this.indexAfter(this.scrollTop - 1);
            }
            var firstPageElement = this.itemAtIndex(firstPageIndex).model.getElement();
            var currentlyFocusedElement = this.model.getFocus();
            if (currentlyFocusedElement !== firstPageElement) {
                this.model.setFocus(firstPageElement, eventPayload);
            }
            else {
                var previousScrollTop = this.scrollTop;
                this.scrollTop -= this.viewHeight;
                if (this.scrollTop !== previousScrollTop) {
                    // Let the scroll event listener run
                    setTimeout(function () {
                        _this.focusPreviousPage(eventPayload);
                    }, 0);
                }
            }
        };
        Object.defineProperty(TreeView.prototype, "viewHeight", {
            get: function () {
                return this._viewHeight;
            },
            set: function (viewHeight) {
                this.render(this.scrollTop, viewHeight);
                this._viewHeight = viewHeight;
            },
            enumerable: true,
            configurable: true
        });
        // IScrollable
        TreeView.prototype.getScrollHeight = function () {
            return this.getTotalHeight();
        };
        TreeView.prototype.getScrollWidth = function () {
            return 0;
        };
        TreeView.prototype.getScrollLeft = function () {
            return 0;
        };
        TreeView.prototype.setScrollLeft = function (scrollLeft) {
            // noop
        };
        Object.defineProperty(TreeView.prototype, "scrollTop", {
            get: function () {
                return this._scrollTop;
            },
            set: function (scrollTop) {
                this.setScrollTop(scrollTop);
            },
            enumerable: true,
            configurable: true
        });
        TreeView.prototype.getScrollTop = function () {
            return this._scrollTop;
        };
        TreeView.prototype.setScrollTop = function (scrollTop) {
            scrollTop = Math.min(scrollTop, this.getTotalHeight() - this.viewHeight);
            scrollTop = Math.max(scrollTop, 0);
            this.render(scrollTop, this.viewHeight);
            this._scrollTop = scrollTop;
            this.emit('scroll', { vertical: true, horizontal: false });
        };
        TreeView.prototype.addScrollListener = function (callback) {
            return this.addListener2('scroll', callback);
        };
        TreeView.prototype.getScrollPosition = function () {
            var height = this.getTotalHeight() - this.viewHeight;
            return height <= 0 ? 0 : this.scrollTop / height;
        };
        TreeView.prototype.setScrollPosition = function (pos) {
            var height = this.getTotalHeight() - this.viewHeight;
            this.scrollTop = height * pos;
        };
        // Events
        TreeView.prototype.onClearingInput = function (e) {
            var item = e.item;
            if (item) {
                this.onRemoveItems(new iterator_1.MappedIterator(item.getNavigator(), function (item) { return item && item.id; }));
                this.onRowsChanged();
            }
        };
        TreeView.prototype.onSetInput = function (e) {
            this.context.cache.garbageCollect();
            this.inputItem = new RootViewItem(this.context, e.item, this.wrapper);
            this.emit('viewItem:create', { item: this.inputItem.model });
        };
        TreeView.prototype.onItemChildrenRefreshing = function (e) {
            var item = e.item;
            var viewItem = this.items[item.id];
            if (viewItem) {
                viewItem.loadingPromise = WinJS.Promise.timeout(TreeView.LOADING_DECORATION_DELAY).then(function () {
                    viewItem.loadingPromise = null;
                    viewItem.loading = true;
                });
            }
            if (!e.isNested) {
                var childrenIds = [];
                var navigator = item.getNavigator();
                var childItem;
                while (childItem = navigator.next()) {
                    childrenIds.push(childItem.id);
                }
                this.refreshingPreviousChildrenIds[item.id] = childrenIds;
            }
        };
        TreeView.prototype.onItemChildrenRefreshed = function (e) {
            var _this = this;
            var item = e.item;
            var viewItem = this.items[item.id];
            if (viewItem) {
                if (viewItem.loadingPromise) {
                    viewItem.loadingPromise.cancel();
                    viewItem.loadingPromise = null;
                }
                viewItem.loading = false;
            }
            if (!e.isNested) {
                var previousChildrenIds = this.refreshingPreviousChildrenIds[item.id];
                var afterModelItems = [];
                var navigator = item.getNavigator();
                var childItem;
                while (childItem = navigator.next()) {
                    afterModelItems.push(childItem);
                }
                var lcs = new Diff.LcsDiff({
                    getLength: function () { return previousChildrenIds.length; },
                    getElementHash: function (i) { return previousChildrenIds[i]; }
                }, {
                    getLength: function () { return afterModelItems.length; },
                    getElementHash: function (i) { return afterModelItems[i].id; }
                }, null);
                var diff = lcs.ComputeDiff();
                // this means that the result of the diff algorithm would result
                // in inserting items that were already registered. this can only
                // happen if the data provider returns bad ids OR if the sorting
                // of the elements has changed
                var doToInsertItemsAlreadyExist = diff.some(function (d) {
                    if (d.modifiedLength > 0) {
                        for (var i = d.modifiedStart, len = d.modifiedStart + d.modifiedLength; i < len; i++) {
                            if (_this.items.hasOwnProperty(afterModelItems[i].id)) {
                                return true;
                            }
                        }
                    }
                    return false;
                });
                if (!doToInsertItemsAlreadyExist) {
                    for (var i = 0, len = diff.length; i < len; i++) {
                        var diffChange = diff[i];
                        if (diffChange.originalLength > 0) {
                            this.onRemoveItems(new iterator_1.ArrayIterator(previousChildrenIds, diffChange.originalStart, diffChange.originalStart + diffChange.originalLength));
                        }
                        if (diffChange.modifiedLength > 0) {
                            var beforeItem = afterModelItems[diffChange.modifiedStart - 1] || item;
                            beforeItem = beforeItem.getDepth() > 0 ? beforeItem : null;
                            this.onInsertItems(new iterator_1.ArrayIterator(afterModelItems, diffChange.modifiedStart, diffChange.modifiedStart + diffChange.modifiedLength), beforeItem ? beforeItem.id : null);
                        }
                    }
                }
                else if (diff.length) {
                    this.onRemoveItems(new iterator_1.ArrayIterator(previousChildrenIds));
                    this.onInsertItems(new iterator_1.ArrayIterator(afterModelItems));
                }
                if (diff.length) {
                    this.onRowsChanged();
                }
            }
        };
        TreeView.prototype.onItemsRefresh = function (items) {
            var _this = this;
            this.onRefreshItemSet(items.filter(function (item) { return _this.items.hasOwnProperty(item.id); }));
            this.onRowsChanged();
        };
        TreeView.prototype.onItemExpanding = function (e) {
            var viewItem = this.items[e.item.id];
            if (viewItem) {
                viewItem.expanded = true;
            }
        };
        TreeView.prototype.onItemExpanded = function (e) {
            var item = e.item;
            var viewItem = this.items[item.id];
            if (viewItem) {
                viewItem.expanded = true;
                var height = this.onInsertItems(item.getNavigator(), item.id);
                var scrollTop = this.scrollTop;
                if (viewItem.top + viewItem.height <= this.scrollTop) {
                    scrollTop += height;
                }
                this.onRowsChanged(scrollTop);
            }
        };
        TreeView.prototype.onItemCollapsing = function (e) {
            var item = e.item;
            var viewItem = this.items[item.id];
            if (viewItem) {
                viewItem.expanded = false;
                this.onRemoveItems(new iterator_1.MappedIterator(item.getNavigator(), function (item) { return item && item.id; }));
                this.onRowsChanged();
            }
        };
        TreeView.prototype.onItemReveal = function (e) {
            var item = e.item;
            var relativeTop = e.relativeTop;
            var viewItem = this.items[item.id];
            if (viewItem) {
                if (relativeTop !== null) {
                    relativeTop = relativeTop < 0 ? 0 : relativeTop;
                    relativeTop = relativeTop > 1 ? 1 : relativeTop;
                    // y = mx + b
                    var m = viewItem.height - this.viewHeight;
                    this.scrollTop = m * relativeTop + viewItem.top;
                }
                else {
                    var viewItemBottom = viewItem.top + viewItem.height;
                    var wrapperBottom = this.scrollTop + this.viewHeight;
                    if (viewItem.top < this.scrollTop) {
                        this.scrollTop = viewItem.top;
                    }
                    else if (viewItemBottom >= wrapperBottom) {
                        this.scrollTop = viewItemBottom - this.viewHeight;
                    }
                }
            }
        };
        TreeView.prototype.onItemAddTrait = function (e) {
            var item = e.item;
            var trait = e.trait;
            var viewItem = this.items[item.id];
            if (viewItem) {
                viewItem.addClass(trait);
            }
            if (trait === 'highlighted') {
                DOM.addClass(this.domNode, trait);
                // Ugly Firefox fix: input fields can't be selected if parent nodes are draggable
                if (viewItem) {
                    this.highlightedItemWasDraggable = !!viewItem.draggable;
                    if (viewItem.draggable) {
                        viewItem.draggable = false;
                    }
                }
            }
        };
        TreeView.prototype.onItemRemoveTrait = function (e) {
            var item = e.item;
            var trait = e.trait;
            var viewItem = this.items[item.id];
            if (viewItem) {
                viewItem.removeClass(trait);
            }
            if (trait === 'highlighted') {
                DOM.removeClass(this.domNode, trait);
                // Ugly Firefox fix: input fields can't be selected if parent nodes are draggable
                if (this.highlightedItemWasDraggable) {
                    viewItem.draggable = true;
                }
                delete this.highlightedItemWasDraggable;
            }
        };
        // HeightMap "events"
        TreeView.prototype.onInsertItem = function (item) {
            var _this = this;
            item.onDragStart = function (e) { _this.onDragStart(item, e); };
            item.needsRender = true;
            this.refreshViewItem(item);
            this.items[item.id] = item;
        };
        TreeView.prototype.onRefreshItem = function (item, needsRender) {
            if (needsRender === void 0) { needsRender = false; }
            item.needsRender = item.needsRender || needsRender;
            this.refreshViewItem(item);
        };
        TreeView.prototype.onRemoveItem = function (item) {
            this.removeItemFromDOM(item);
            item.dispose();
            this.emit('viewItem:dispose', { item: this.inputItem.model });
            delete this.items[item.id];
        };
        // ViewItem refresh
        TreeView.prototype.refreshViewItem = function (item) {
            item.render();
            if (this.shouldBeRendered(item)) {
                this.insertItemInDOM(item);
            }
            else {
                this.removeItemFromDOM(item);
            }
        };
        // DOM Events
        TreeView.prototype.onClick = function (e) {
            if (this.lastPointerType && this.lastPointerType !== 'mouse') {
                return;
            }
            var event = new Mouse.StandardMouseEvent(e);
            var item = this.getItemAround(event.target);
            if (!item) {
                return;
            }
            if (Browser.isIE10orLater && Date.now() - this.lastClickTimeStamp < 300) {
                // IE10+ doesn't set the detail property correctly. While IE10 simply
                // counts the number of clicks, IE11 reports always 1. To align with
                // other browser, we set the value to 2 if clicks events come in a 300ms
                // sequence.
                event.detail = 2;
            }
            this.lastClickTimeStamp = Date.now();
            this.context.controller.onClick(this.context.tree, item.model.getElement(), event);
        };
        TreeView.prototype.onMouseDown = function (e) {
            this.didJustPressContextMenuKey = false;
            if (!this.context.controller.onMouseDown) {
                return;
            }
            if (this.lastPointerType && this.lastPointerType !== 'mouse') {
                return;
            }
            var event = new Mouse.StandardMouseEvent(e);
            if (event.ctrlKey && Platform.isNative && Platform.isMacintosh) {
                return;
            }
            var item = this.getItemAround(event.target);
            if (!item) {
                return;
            }
            this.context.controller.onMouseDown(this.context.tree, item.model.getElement(), event);
        };
        TreeView.prototype.onMouseUp = function (e) {
            if (!this.context.controller.onMouseUp) {
                return;
            }
            if (this.lastPointerType && this.lastPointerType !== 'mouse') {
                return;
            }
            var event = new Mouse.StandardMouseEvent(e);
            if (event.ctrlKey && Platform.isNative && Platform.isMacintosh) {
                return;
            }
            var item = this.getItemAround(event.target);
            if (!item) {
                return;
            }
            this.context.controller.onMouseUp(this.context.tree, item.model.getElement(), event);
        };
        TreeView.prototype.onTap = function (e) {
            var item = this.getItemAround(e.initialTarget);
            if (!item) {
                return;
            }
            this.context.controller.onTap(this.context.tree, item.model.getElement(), e);
        };
        TreeView.prototype.onTouchChange = function (event) {
            event.preventDefault();
            event.stopPropagation();
            this.scrollTop -= event.translationY;
        };
        TreeView.prototype.onContextMenu = function (event) {
            var resultEvent;
            var element;
            if (event instanceof KeyboardEvent || this.didJustPressContextMenuKey) {
                this.didJustPressContextMenuKey = false;
                var keyboardEvent = new Keyboard.StandardKeyboardEvent(event);
                element = this.model.getFocus();
                if (!element) {
                    return;
                }
                var id = this.context.dataSource.getId(this.context.tree, element);
                var viewItem = this.items[id];
                var position = DOM.getDomNodePosition(viewItem.element);
                resultEvent = new _.KeyboardContextMenuEvent(position.left + position.width, position.top, keyboardEvent);
            }
            else {
                var mouseEvent = new Mouse.StandardMouseEvent(event);
                var item = this.getItemAround(mouseEvent.target);
                if (!item) {
                    return;
                }
                element = item.model.getElement();
                resultEvent = new _.MouseContextMenuEvent(mouseEvent);
            }
            this.context.controller.onContextMenu(this.context.tree, element, resultEvent);
        };
        TreeView.prototype.onKeyDown = function (e) {
            var event = new Keyboard.StandardKeyboardEvent(e);
            this.didJustPressContextMenuKey = event.keyCode === keyCodes_1.KeyCode.ContextMenu || (event.shiftKey && event.keyCode === keyCodes_1.KeyCode.F10);
            if (this.didJustPressContextMenuKey) {
                event.preventDefault();
                event.stopPropagation();
            }
            if (event.target && event.target.tagName && event.target.tagName.toLowerCase() === 'input') {
                return; // Ignore event if target is a form input field (avoids browser specific issues)
            }
            this.context.controller.onKeyDown(this.context.tree, event);
        };
        TreeView.prototype.onKeyUp = function (e) {
            if (this.didJustPressContextMenuKey) {
                this.onContextMenu(e);
            }
            this.didJustPressContextMenuKey = false;
            this.context.controller.onKeyUp(this.context.tree, new Keyboard.StandardKeyboardEvent(e));
        };
        TreeView.prototype.onDragStart = function (item, e) {
            if (this.model.getHighlight()) {
                return;
            }
            var element = item.model.getElement();
            var selection = this.model.getSelection();
            var elements;
            if (selection.indexOf(element) > -1) {
                elements = selection;
            }
            else {
                elements = [element];
            }
            e.dataTransfer.effectAllowed = 'copyMove';
            e.dataTransfer.setData('URL', item.uri);
            if (e.dataTransfer.setDragImage) {
                if (elements.length === 1 && item.element) {
                    e.dataTransfer.setDragImage(item.element, e.offsetX || 6, e.offsetY || 6);
                }
                else if (elements.length > 1) {
                    var dragImage = document.createElement('div');
                    dragImage.className = 'monaco-tree-drag-image';
                    dragImage.textContent = '' + elements.length;
                    document.body.appendChild(dragImage);
                    e.dataTransfer.setDragImage(dragImage, -10, -10);
                    setTimeout(function () { return document.body.removeChild(dragImage); }, 0);
                }
            }
            this.currentDragAndDropData = new dnd.ElementsDragAndDropData(elements);
            TreeView.currentExternalDragAndDropData = new dnd.ExternalElementsDragAndDropData(elements);
            this.context.dnd.onDragStart(this.context.tree, this.currentDragAndDropData, new Mouse.DragMouseEvent(e));
        };
        TreeView.prototype.setupDragAndDropScrollInterval = function () {
            var _this = this;
            var viewTop = DOM.getTopLeftOffset(this.wrapper).top;
            if (!this.dragAndDropScrollInterval) {
                this.dragAndDropScrollInterval = window.setInterval(function () {
                    if (_this.dragAndDropMouseY === undefined) {
                        return;
                    }
                    var diff = _this.dragAndDropMouseY - viewTop;
                    var scrollDiff = 0;
                    var upperLimit = _this.viewHeight - 35;
                    if (diff < 35) {
                        scrollDiff = Math.max(-14, 0.2 * (diff - 35));
                    }
                    else if (diff > upperLimit) {
                        scrollDiff = Math.min(14, 0.2 * (diff - upperLimit));
                    }
                    _this.scrollTop += scrollDiff;
                }, 10);
                this.cancelDragAndDropScrollTimeout();
                this.dragAndDropScrollTimeout = window.setTimeout(function () {
                    _this.cancelDragAndDropScrollInterval();
                    _this.dragAndDropScrollTimeout = null;
                }, 1000);
            }
        };
        TreeView.prototype.cancelDragAndDropScrollInterval = function () {
            if (this.dragAndDropScrollInterval) {
                window.clearInterval(this.dragAndDropScrollInterval);
                this.dragAndDropScrollInterval = null;
            }
            this.cancelDragAndDropScrollTimeout();
        };
        TreeView.prototype.cancelDragAndDropScrollTimeout = function () {
            if (this.dragAndDropScrollTimeout) {
                window.clearTimeout(this.dragAndDropScrollTimeout);
                this.dragAndDropScrollTimeout = null;
            }
        };
        TreeView.prototype.onDragOver = function (e) {
            var _this = this;
            var event = new Mouse.DragMouseEvent(e);
            var viewItem = this.getItemAround(event.target);
            if (!viewItem) {
                // dragging outside of tree
                if (this.currentDropTarget) {
                    // clear previously hovered element feedback
                    this.currentDropTargets.forEach(function (i) { return i.dropTarget = false; });
                    this.currentDropTargets = [];
                    if (this.currentDropPromise) {
                        this.currentDropPromise.cancel();
                        this.currentDropPromise = null;
                    }
                }
                this.cancelDragAndDropScrollInterval();
                delete this.currentDropTarget;
                delete this.currentDropElement;
                delete this.dragAndDropMouseY;
                return false;
            }
            // dragging inside the tree
            this.setupDragAndDropScrollInterval();
            this.dragAndDropMouseY = event.posy;
            if (!this.currentDragAndDropData) {
                // just started dragging
                if (TreeView.currentExternalDragAndDropData) {
                    this.currentDragAndDropData = TreeView.currentExternalDragAndDropData;
                }
                else {
                    if (!event.dataTransfer.types) {
                        return false;
                    }
                    this.currentDragAndDropData = new dnd.DesktopDragAndDropData();
                }
            }
            this.currentDragAndDropData.update(event);
            var element;
            var item = viewItem.model;
            var reaction;
            // check the bubble up behavior
            do {
                element = item ? item.getElement() : this.model.getInput();
                reaction = this.context.dnd.onDragOver(this.context.tree, this.currentDragAndDropData, element, event);
                if (!reaction || reaction.bubble !== _.DragOverBubble.BUBBLE_UP) {
                    break;
                }
                item = item && item.parent;
            } while (item);
            if (!item) {
                delete this.currentDropElement;
                return false;
            }
            var canDrop = reaction && reaction.accept;
            if (canDrop) {
                this.currentDropElement = item.getElement();
                event.preventDefault();
                event.dataTransfer.dropEffect = reaction.effect === _.DragOverEffect.COPY ? 'copy' : 'move';
            }
            else {
                delete this.currentDropElement;
            }
            // item is the model item where drop() should be called
            // can be null
            var currentDropTarget = item.id === this.inputItem.id ? this.inputItem : this.items[item.id];
            if (this.shouldInvalidateDropReaction || this.currentDropTarget !== currentDropTarget || !reactionEquals(this.currentDropElementReaction, reaction)) {
                this.shouldInvalidateDropReaction = false;
                if (this.currentDropTarget) {
                    this.currentDropTargets.forEach(function (i) { return i.dropTarget = false; });
                    this.currentDropTargets = [];
                    if (this.currentDropPromise) {
                        this.currentDropPromise.cancel();
                        this.currentDropPromise = null;
                    }
                }
                this.currentDropTarget = currentDropTarget;
                this.currentDropElementReaction = reaction;
                if (canDrop) {
                    // setup hover feedback for drop target
                    if (this.currentDropTarget) {
                        this.currentDropTarget.dropTarget = true;
                        this.currentDropTargets.push(this.currentDropTarget);
                    }
                    if (reaction.bubble === _.DragOverBubble.BUBBLE_DOWN) {
                        var nav = item.getNavigator();
                        var child;
                        while (child = nav.next()) {
                            viewItem = this.items[child.id];
                            if (viewItem) {
                                viewItem.dropTarget = true;
                                this.currentDropTargets.push(viewItem);
                            }
                        }
                    }
                    this.currentDropPromise = WinJS.Promise.timeout(500).then(function () {
                        return _this.context.tree.expand(_this.currentDropElement).then(function () {
                            _this.shouldInvalidateDropReaction = true;
                        });
                    });
                }
            }
            return true;
        };
        TreeView.prototype.onDrop = function (e) {
            if (this.currentDropElement) {
                var event = new Mouse.DragMouseEvent(e);
                event.preventDefault();
                this.currentDragAndDropData.update(event);
                this.context.dnd.drop(this.context.tree, this.currentDragAndDropData, this.currentDropElement, event);
                this.onDragEnd(e);
            }
            this.cancelDragAndDropScrollInterval();
        };
        TreeView.prototype.onDragEnd = function (e) {
            if (this.currentDropTarget) {
                this.currentDropTargets.forEach(function (i) { return i.dropTarget = false; });
                this.currentDropTargets = [];
            }
            if (this.currentDropPromise) {
                this.currentDropPromise.cancel();
                this.currentDropPromise = null;
            }
            this.cancelDragAndDropScrollInterval();
            delete this.currentDragAndDropData;
            TreeView.currentExternalDragAndDropData = null;
            delete this.currentDropElement;
            delete this.currentDropTarget;
            delete this.dragAndDropMouseY;
        };
        TreeView.prototype.onFocus = function (e) {
            if (!this.context.options.alwaysFocused) {
                DOM.addClass(this.domNode, 'focused');
            }
        };
        TreeView.prototype.onBlur = function (e) {
            if (!this.context.options.alwaysFocused) {
                DOM.removeClass(this.domNode, 'focused');
            }
        };
        // MS specific DOM Events
        TreeView.prototype.onMsPointerDown = function (event) {
            if (!this.msGesture) {
                return;
            }
            // Circumvent IE11 breaking change in e.pointerType & TypeScript's stale definitions
            var pointerType = event.pointerType;
            if (pointerType === (event.MSPOINTER_TYPE_MOUSE || 'mouse')) {
                this.lastPointerType = 'mouse';
                return;
            }
            else if (pointerType === (event.MSPOINTER_TYPE_TOUCH || 'touch')) {
                this.lastPointerType = 'touch';
            }
            else {
                return;
            }
            event.stopPropagation();
            event.preventDefault();
            this.msGesture.addPointer(event.pointerId);
        };
        TreeView.prototype.onThrottledMsGestureChange = function (event) {
            this.scrollTop -= event.translationY;
        };
        TreeView.prototype.onMsGestureTap = function (event) {
            event.initialTarget = document.elementFromPoint(event.clientX, event.clientY);
            this.onTap(event);
        };
        // DOM changes
        TreeView.prototype.insertItemInDOM = function (item) {
            var elementAfter = null;
            var itemAfter = this.itemAfter(item);
            if (itemAfter && itemAfter.element) {
                elementAfter = itemAfter.element;
            }
            item.insertInDOM(this.rowsContainer, elementAfter);
        };
        TreeView.prototype.removeItemFromDOM = function (item) {
            item.removeFromDOM();
        };
        // Helpers
        TreeView.prototype.shouldBeRendered = function (item) {
            return item.top < this.renderTop + this.renderHeight && item.top + item.height > this.renderTop;
        };
        TreeView.prototype.getItemAround = function (element) {
            var candidate = this.inputItem;
            do {
                if (element[TreeView.BINDING]) {
                    candidate = element[TreeView.BINDING];
                }
                if (element === this.wrapper || element === this.domNode) {
                    return candidate;
                }
                if (element === document.body) {
                    return null;
                }
            } while (element = element.parentElement);
        };
        // Cleanup
        TreeView.prototype.releaseModel = function () {
            if (this.model) {
                while (this.modelListeners.length) {
                    this.modelListeners.pop()();
                }
                this.model = null;
            }
        };
        TreeView.prototype.dispose = function () {
            // TODO@joao: improve
            this.scrollableElement.dispose();
            this.releaseModel();
            this.modelListeners = null;
            while (this.viewListeners.length) {
                this.viewListeners.pop()();
            }
            this.viewListeners = null;
            if (this.domNode.parentNode) {
                this.domNode.parentNode.removeChild(this.domNode);
            }
            this.domNode = null;
            if (this.wrapperGesture) {
                this.wrapperGesture.dispose();
                this.wrapperGesture = null;
            }
            if (this.context.cache) {
                this.context.cache.dispose();
                this.context.cache = null;
            }
            _super.prototype.dispose.call(this);
        };
        TreeView.BINDING = 'monaco-tree-row';
        TreeView.LOADING_DECORATION_DELAY = 800;
        TreeView.currentExternalDragAndDropData = null;
        return TreeView;
    })(treeViewModel_1.HeightMap);
    exports.TreeView = TreeView;
});
//# sourceMappingURL=treeView.js.map