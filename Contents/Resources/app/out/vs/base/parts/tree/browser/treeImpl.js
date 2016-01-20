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
define(["require", "exports", 'vs/base/parts/tree/browser/treeDefaults', 'vs/base/common/eventEmitter', 'vs/base/parts/tree/browser/treeModel', './treeView', 'vs/base/common/iterator', 'vs/css!./tree'], function (require, exports, TreeDefaults, Events, Model, View, iterator_1) {
    var TreeContext = (function () {
        function TreeContext(tree, configuration, options) {
            if (options === void 0) { options = {}; }
            this.tree = tree;
            this.configuration = configuration;
            this.options = options;
            if (!configuration.dataSource) {
                throw new Error('You must provide a Data Source to the tree.');
            }
            this.dataSource = configuration.dataSource;
            this.renderer = configuration.renderer || new TreeDefaults.LegacyRenderer();
            this.controller = configuration.controller || new TreeDefaults.DefaultController();
            this.dnd = configuration.dnd || new TreeDefaults.DefaultDragAndDrop();
            this.filter = configuration.filter || new TreeDefaults.DefaultFilter();
            this.sorter = configuration.sorter || null;
        }
        return TreeContext;
    })();
    exports.TreeContext = TreeContext;
    var Tree = (function (_super) {
        __extends(Tree, _super);
        function Tree(container, configuration, options) {
            if (options === void 0) { options = {}; }
            _super.call(this);
            this.container = container;
            this.configuration = configuration;
            this.options = options;
            this.options.twistiePixels = typeof this.options.twistiePixels === 'number' ? this.options.twistiePixels : 32;
            this.options.indentPixels = typeof this.options.indentPixels === 'number' ? this.options.indentPixels : 12;
            this.options.alwaysFocused = this.options.alwaysFocused === true ? true : false;
            this.options.bare = this.options.bare === true ? true : false;
            this.options.useShadows = this.options.useShadows === false ? false : true;
            this.options.paddingOnRow = this.options.paddingOnRow === false ? false : true;
            this.context = new TreeContext(this, configuration, options);
            this.model = new Model.TreeModel(this.context);
            this.view = new View.TreeView(this.context, this.container);
            this.view.setModel(this.model);
            this.addEmitter(this.model);
            this.addEmitter(this.view);
        }
        Tree.prototype.getHTMLElement = function () {
            return this.view.getHTMLElement();
        };
        Tree.prototype.layout = function (height) {
            this.view.layout(height);
        };
        Tree.prototype.DOMFocus = function () {
            this.view.focus();
        };
        Tree.prototype.isDOMFocused = function () {
            return this.view.isFocused();
        };
        Tree.prototype.DOMBlur = function () {
            this.view.blur();
        };
        Tree.prototype.onVisible = function () {
            this.view.onVisible();
        };
        Tree.prototype.onHidden = function () {
            this.view.onHidden();
        };
        Tree.prototype.setInput = function (element) {
            return this.model.setInput(element);
        };
        Tree.prototype.getInput = function () {
            return this.model.getInput();
        };
        Tree.prototype.refresh = function (element, recursive) {
            if (element === void 0) { element = null; }
            if (recursive === void 0) { recursive = true; }
            return this.model.refresh(element, recursive);
        };
        Tree.prototype.refreshAll = function (elements, recursive) {
            if (recursive === void 0) { recursive = true; }
            return this.model.refreshAll(elements, recursive);
        };
        Tree.prototype.expand = function (element) {
            return this.model.expand(element);
        };
        Tree.prototype.expandAll = function (elements) {
            return this.model.expandAll(elements);
        };
        Tree.prototype.collapse = function (element, recursive) {
            if (recursive === void 0) { recursive = false; }
            return this.model.collapse(element);
        };
        Tree.prototype.collapseAll = function (elements, recursive) {
            if (elements === void 0) { elements = null; }
            if (recursive === void 0) { recursive = false; }
            return this.model.collapseAll(elements, recursive);
        };
        Tree.prototype.toggleExpansion = function (element) {
            return this.model.toggleExpansion(element);
        };
        Tree.prototype.toggleExpansionAll = function (elements) {
            return this.model.toggleExpansionAll(elements);
        };
        Tree.prototype.isExpanded = function (element) {
            return this.model.isExpanded(element);
        };
        Tree.prototype.getExpandedElements = function () {
            return this.model.getExpandedElements();
        };
        Tree.prototype.reveal = function (element, relativeTop) {
            if (relativeTop === void 0) { relativeTop = null; }
            return this.model.reveal(element, relativeTop);
        };
        Tree.prototype.getScrollPosition = function () {
            return this.view.getScrollPosition();
        };
        Tree.prototype.setScrollPosition = function (pos) {
            this.view.setScrollPosition(pos);
        };
        Tree.prototype.getContentHeight = function () {
            return this.view.getTotalHeight();
        };
        Tree.prototype.setHighlight = function (element, eventPayload) {
            this.model.setHighlight(element, eventPayload);
        };
        Tree.prototype.getHighlight = function () {
            return this.model.getHighlight();
        };
        Tree.prototype.isHighlighted = function (element) {
            return this.model.isFocused(element);
        };
        Tree.prototype.clearHighlight = function (eventPayload) {
            this.model.setHighlight(null, eventPayload);
        };
        Tree.prototype.select = function (element, eventPayload) {
            this.model.select(element, eventPayload);
        };
        Tree.prototype.selectRange = function (fromElement, toElement, eventPayload) {
            this.model.selectRange(fromElement, toElement, eventPayload);
        };
        Tree.prototype.deselectRange = function (fromElement, toElement, eventPayload) {
            this.model.deselectRange(fromElement, toElement, eventPayload);
        };
        Tree.prototype.selectAll = function (elements, eventPayload) {
            this.model.selectAll(elements, eventPayload);
        };
        Tree.prototype.deselect = function (element, eventPayload) {
            this.model.deselect(element, eventPayload);
        };
        Tree.prototype.deselectAll = function (elements, eventPayload) {
            this.model.deselectAll(elements, eventPayload);
        };
        Tree.prototype.setSelection = function (elements, eventPayload) {
            this.model.setSelection(elements, eventPayload);
        };
        Tree.prototype.toggleSelection = function (element, eventPayload) {
            this.model.toggleSelection(element, eventPayload);
        };
        Tree.prototype.isSelected = function (element) {
            return this.model.isSelected(element);
        };
        Tree.prototype.getSelection = function () {
            return this.model.getSelection();
        };
        Tree.prototype.clearSelection = function (eventPayload) {
            this.model.setSelection([], eventPayload);
        };
        Tree.prototype.selectNext = function (count, clearSelection, eventPayload) {
            this.model.selectNext(count, clearSelection, eventPayload);
        };
        Tree.prototype.selectPrevious = function (count, clearSelection, eventPayload) {
            this.model.selectPrevious(count, clearSelection, eventPayload);
        };
        Tree.prototype.selectParent = function (clearSelection, eventPayload) {
            this.model.selectParent(clearSelection, eventPayload);
        };
        Tree.prototype.setFocus = function (element, eventPayload) {
            this.model.setFocus(element, eventPayload);
        };
        Tree.prototype.isFocused = function (element) {
            return this.model.isFocused(element);
        };
        Tree.prototype.getFocus = function () {
            return this.model.getFocus();
        };
        Tree.prototype.focusNext = function (count, eventPayload) {
            this.model.focusNext(count, eventPayload);
        };
        Tree.prototype.focusPrevious = function (count, eventPayload) {
            this.model.focusPrevious(count, eventPayload);
        };
        Tree.prototype.focusParent = function (eventPayload) {
            this.model.focusParent(eventPayload);
        };
        Tree.prototype.focusFirst = function (eventPayload) {
            this.model.focusFirst(eventPayload);
        };
        Tree.prototype.focusNth = function (index, eventPayload) {
            this.model.focusNth(index, eventPayload);
        };
        Tree.prototype.focusLast = function (eventPayload) {
            this.model.focusLast(eventPayload);
        };
        Tree.prototype.focusNextPage = function (eventPayload) {
            this.view.focusNextPage(eventPayload);
        };
        Tree.prototype.focusPreviousPage = function (eventPayload) {
            this.view.focusPreviousPage(eventPayload);
        };
        Tree.prototype.clearFocus = function (eventPayload) {
            this.model.setFocus(null, eventPayload);
        };
        Tree.prototype.addTraits = function (trait, elements) {
            this.model.addTraits(trait, elements);
        };
        Tree.prototype.removeTraits = function (trait, elements) {
            this.model.removeTraits(trait, elements);
        };
        Tree.prototype.toggleTrait = function (trait, element) {
            this.model.hasTrait(trait, element) ? this.model.removeTraits(trait, [element])
                : this.model.addTraits(trait, [element]);
        };
        Tree.prototype.hasTrait = function (trait, element) {
            return this.model.hasTrait(trait, element);
        };
        Tree.prototype.withFakeRow = function (fn) {
            return this.view.withFakeRow(fn);
        };
        Tree.prototype.getNavigator = function () {
            return new iterator_1.MappedNavigator(this.model.getNavigator(), function (i) { return i && i.getElement(); });
        };
        Tree.prototype.dispose = function () {
            if (this.model !== null) {
                this.model.dispose();
                this.model = null;
            }
            if (this.view !== null) {
                this.view.dispose();
                this.view = null;
            }
            _super.prototype.dispose.call(this);
        };
        return Tree;
    })(Events.EventEmitter);
    exports.Tree = Tree;
});
//# sourceMappingURL=treeImpl.js.map