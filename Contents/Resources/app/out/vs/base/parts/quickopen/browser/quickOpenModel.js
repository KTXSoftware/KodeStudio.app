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
define(["require", "exports", 'vs/base/common/winjs.base', 'vs/base/common/types', 'vs/base/common/filters', 'vs/base/common/strings', 'vs/base/common/paths', 'vs/base/common/comparers', 'vs/base/browser/ui/actionbar/actionbar', 'vs/base/parts/tree/browser/treeDefaults', 'vs/base/browser/ui/highlightedlabel/highlightedLabel', 'vs/base/browser/dom', 'vs/base/common/scorer'], function (require, exports, winjs_base_1, types, filters, strings, paths, comparers_1, actionbar_1, treeDefaults_1, highlightedLabel_1, DOM, scorer) {
    var IDS = 0;
    var QuickOpenEntry = (function () {
        function QuickOpenEntry(highlights) {
            if (highlights === void 0) { highlights = []; }
            this.id = (IDS++).toString();
            this.labelHighlights = highlights;
            this.descriptionHighlights = [];
        }
        /**
         * A unique identifier for the entry
         */
        QuickOpenEntry.prototype.getId = function () {
            return this.id;
        };
        /**
         * The prefix to show in front of the label if any
         */
        QuickOpenEntry.prototype.getPrefix = function () {
            return this.labelPrefix;
        };
        /**
         * The label of the entry to identify it from others in the list
         */
        QuickOpenEntry.prototype.getLabel = function () {
            return null;
        };
        /**
         * Detail information about the entry that is optional and can be shown below the label
         */
        QuickOpenEntry.prototype.getDetail = function () {
            return null;
        };
        /**
         * The icon of the entry to identify it from others in the list
         */
        QuickOpenEntry.prototype.getIcon = function () {
            return null;
        };
        /**
         * A secondary description that is optional and can be shown right to the label
         */
        QuickOpenEntry.prototype.getDescription = function () {
            return null;
        };
        /**
         * A resource for this entry. Resource URIs can be used to compare different kinds of entries and group
         * them together.
         */
        QuickOpenEntry.prototype.getResource = function () {
            return null;
        };
        /**
         * Allows to reuse the same model while filtering. Hidden entries will not show up in the viewer.
         */
        QuickOpenEntry.prototype.isHidden = function () {
            return this.hidden;
        };
        /**
         * Allows to reuse the same model while filtering. Hidden entries will not show up in the viewer.
         */
        QuickOpenEntry.prototype.setHidden = function (hidden) {
            this.hidden = hidden;
        };
        /**
         * Sets the prefix to show in front of the label
         */
        QuickOpenEntry.prototype.setPrefix = function (prefix) {
            this.labelPrefix = prefix;
        };
        /**
         * Allows to set highlight ranges that should show up for the entry label and optionally description if set.
         */
        QuickOpenEntry.prototype.setHighlights = function (labelHighlights, descriptionHighlights, detailHighlights) {
            this.labelHighlights = labelHighlights;
            this.descriptionHighlights = descriptionHighlights;
            this.detailHighlights = detailHighlights;
        };
        /**
         * Allows to return highlight ranges that should show up for the entry label and description.
         */
        QuickOpenEntry.prototype.getHighlights = function () {
            return [this.labelHighlights, this.descriptionHighlights, this.detailHighlights];
        };
        /**
         * Called when the entry is selected for opening. Returns a boolean value indicating if an action was performed or not.
         * The mode parameter gives an indication if the element is previewed (using arrow keys) or opened.
         *
         * The context parameter provides additional context information how the run was triggered.
         */
        QuickOpenEntry.prototype.run = function (mode, context) {
            return false;
        };
        /**
         * A good default sort implementation for quick open entries respecting highlight information
         * as well as associated resources.
         */
        QuickOpenEntry.compare = function (elementA, elementB, lookFor) {
            // Normalize
            if (lookFor) {
                lookFor = strings.stripWildcards(lookFor).toLowerCase();
            }
            // Give matches with label highlights higher priority over
            // those with only description highlights
            var labelHighlightsA = elementA.getHighlights()[0] || [];
            var labelHighlightsB = elementB.getHighlights()[0] || [];
            if (labelHighlightsA.length && !labelHighlightsB.length) {
                return -1;
            }
            else if (!labelHighlightsA.length && labelHighlightsB.length) {
                return 1;
            }
            // Fallback to the full path if labels are identical and we have associated resources
            var nameA = elementA.getLabel();
            var nameB = elementB.getLabel();
            if (nameA === nameB) {
                var resourceA = elementA.getResource();
                var resourceB = elementB.getResource();
                if (resourceA && resourceB) {
                    nameA = resourceA.fsPath;
                    nameB = resourceB.fsPath;
                }
            }
            return comparers_1.compareAnything(nameA, nameB, lookFor);
        };
        QuickOpenEntry.compareByScore = function (elementA, elementB, lookFor, scorerCache) {
            var labelA = elementA.getLabel();
            var labelB = elementB.getLabel();
            // treat prefix matches highest in any case
            var prefixCompare = comparers_1.compareByPrefix(labelA, labelB, lookFor);
            if (prefixCompare) {
                return prefixCompare;
            }
            // Give higher importance to label score
            var labelAScore = scorer.score(labelA, lookFor, scorerCache);
            var labelBScore = scorer.score(labelB, lookFor, scorerCache);
            // Useful for understanding the scoring
            // elementA.setPrefix(labelAScore + ' ');
            // elementB.setPrefix(labelBScore + ' ');
            if (labelAScore !== labelBScore) {
                return labelAScore > labelBScore ? -1 : 1;
            }
            // Score on full resource path comes next (if available)
            var resourceA = elementA.getResource();
            var resourceB = elementB.getResource();
            if (resourceA && resourceB) {
                var resourceAScore = scorer.score(resourceA.fsPath, lookFor, scorerCache);
                var resourceBScore = scorer.score(resourceB.fsPath, lookFor, scorerCache);
                // Useful for understanding the scoring
                // elementA.setPrefix(elementA.getPrefix() + ' ' + resourceAScore + ': ');
                // elementB.setPrefix(elementB.getPrefix() + ' ' + resourceBScore + ': ');
                if (resourceAScore !== resourceBScore) {
                    return resourceAScore > resourceBScore ? -1 : 1;
                }
            }
            // At this place, the scores are identical so we check for string lengths and favor shorter ones
            if (labelA.length !== labelB.length) {
                return labelA.length < labelB.length ? -1 : 1;
            }
            if (resourceA && resourceB && resourceA.fsPath.length !== resourceB.fsPath.length) {
                return resourceA.fsPath.length < resourceB.fsPath.length ? -1 : 1;
            }
            return QuickOpenEntry.compare(elementA, elementB, lookFor);
        };
        /**
         * A good default highlight implementation for an entry with label and description.
         */
        QuickOpenEntry.highlight = function (entry, lookFor, fuzzyHighlight) {
            if (fuzzyHighlight === void 0) { fuzzyHighlight = false; }
            var labelHighlights = [];
            var descriptionHighlights = [];
            var label = entry.getLabel();
            var description = entry.getDescription();
            // Highlight file aware
            if (entry.getResource()) {
                // Highlight entire label and description if searching for full absolute path
                if (lookFor.toLowerCase() === entry.getResource().fsPath.toLowerCase()) {
                    labelHighlights.push({ start: 0, end: label.length });
                    descriptionHighlights.push({ start: 0, end: description.length });
                }
                else if (fuzzyHighlight || lookFor.indexOf(paths.nativeSep) >= 0) {
                    var candidateLabelHighlights = filters.matchesFuzzy(lookFor, label, fuzzyHighlight);
                    if (!candidateLabelHighlights) {
                        var pathPrefix = description ? (description + paths.nativeSep) : '';
                        var pathPrefixLength = pathPrefix.length;
                        // If there are no highlights in the label, build a path out of description and highlight and match on both,
                        // then extract the individual label and description highlights back to the original positions
                        var pathHighlights = filters.matchesFuzzy(lookFor, pathPrefix + label, fuzzyHighlight);
                        if (pathHighlights) {
                            pathHighlights.forEach(function (h) {
                                // Match overlaps label and description part, we need to split it up
                                if (h.start < pathPrefixLength && h.end > pathPrefixLength) {
                                    labelHighlights.push({ start: 0, end: h.end - pathPrefixLength });
                                    descriptionHighlights.push({ start: h.start, end: pathPrefixLength });
                                }
                                else if (h.start >= pathPrefixLength) {
                                    labelHighlights.push({ start: h.start - pathPrefixLength, end: h.end - pathPrefixLength });
                                }
                                else {
                                    descriptionHighlights.push(h);
                                }
                            });
                        }
                    }
                    else {
                        labelHighlights = candidateLabelHighlights;
                    }
                }
                else {
                    labelHighlights = filters.matchesFuzzy(lookFor, label);
                }
            }
            else {
                labelHighlights = filters.matchesFuzzy(lookFor, label);
            }
            return { labelHighlights: labelHighlights, descriptionHighlights: descriptionHighlights };
        };
        return QuickOpenEntry;
    })();
    exports.QuickOpenEntry = QuickOpenEntry;
    var QuickOpenEntryItem = (function (_super) {
        __extends(QuickOpenEntryItem, _super);
        function QuickOpenEntryItem() {
            _super.apply(this, arguments);
        }
        /**
         * Must return the height as being used by the render function.
         */
        QuickOpenEntryItem.prototype.getHeight = function () {
            return 0;
        };
        /**
         * Allows to present the quick open entry in a custom way inside the tree.
         */
        QuickOpenEntryItem.prototype.render = function (tree, container, previousCleanupFn) {
            return null;
        };
        return QuickOpenEntryItem;
    })(QuickOpenEntry);
    exports.QuickOpenEntryItem = QuickOpenEntryItem;
    var QuickOpenEntryGroup = (function (_super) {
        __extends(QuickOpenEntryGroup, _super);
        function QuickOpenEntryGroup(entry, groupLabel, withBorder) {
            _super.call(this);
            this.entry = entry;
            this.groupLabel = groupLabel;
            this.withBorder = withBorder;
        }
        /**
         * The label of the group or null if none.
         */
        QuickOpenEntryGroup.prototype.getGroupLabel = function () {
            return this.groupLabel;
        };
        QuickOpenEntryGroup.prototype.setGroupLabel = function (groupLabel) {
            this.groupLabel = groupLabel;
        };
        /**
         * Whether to show a border on top of the group entry or not.
         */
        QuickOpenEntryGroup.prototype.showBorder = function () {
            return this.withBorder;
        };
        QuickOpenEntryGroup.prototype.setShowBorder = function (showBorder) {
            this.withBorder = showBorder;
        };
        QuickOpenEntryGroup.prototype.getPrefix = function () {
            return this.entry ? this.entry.getPrefix() : _super.prototype.getPrefix.call(this);
        };
        QuickOpenEntryGroup.prototype.getLabel = function () {
            return this.entry ? this.entry.getLabel() : _super.prototype.getLabel.call(this);
        };
        QuickOpenEntryGroup.prototype.getDetail = function () {
            return this.entry ? this.entry.getDetail() : _super.prototype.getDetail.call(this);
        };
        QuickOpenEntryGroup.prototype.getResource = function () {
            return this.entry ? this.entry.getResource() : _super.prototype.getResource.call(this);
        };
        QuickOpenEntryGroup.prototype.getIcon = function () {
            return this.entry ? this.entry.getIcon() : _super.prototype.getIcon.call(this);
        };
        QuickOpenEntryGroup.prototype.getDescription = function () {
            return this.entry ? this.entry.getDescription() : _super.prototype.getDescription.call(this);
        };
        QuickOpenEntryGroup.prototype.getEntry = function () {
            return this.entry;
        };
        QuickOpenEntryGroup.prototype.getHighlights = function () {
            return this.entry ? this.entry.getHighlights() : _super.prototype.getHighlights.call(this);
        };
        QuickOpenEntryGroup.prototype.isHidden = function () {
            return this.entry ? this.entry.isHidden() : _super.prototype.isHidden.call(this);
        };
        QuickOpenEntryGroup.prototype.setHighlights = function (labelHighlights, descriptionHighlights) {
            this.entry ? this.entry.setHighlights(labelHighlights, descriptionHighlights) : _super.prototype.setHighlights.call(this, labelHighlights, descriptionHighlights);
        };
        QuickOpenEntryGroup.prototype.setHidden = function (hidden) {
            this.entry ? this.entry.setHidden(hidden) : _super.prototype.setHidden.call(this, hidden);
        };
        QuickOpenEntryGroup.prototype.run = function (mode, context) {
            return this.entry ? this.entry.run(mode, context) : _super.prototype.run.call(this, mode, context);
        };
        return QuickOpenEntryGroup;
    })(QuickOpenEntry);
    exports.QuickOpenEntryGroup = QuickOpenEntryGroup;
    var templateEntry = 'quickOpenEntry';
    var templateEntryGroup = 'quickOpenEntryGroup';
    var templateEntryItem = 'quickOpenEntryItem';
    var EntryItemRenderer = (function (_super) {
        __extends(EntryItemRenderer, _super);
        function EntryItemRenderer() {
            _super.apply(this, arguments);
        }
        EntryItemRenderer.prototype.getTemplateId = function (tree, element) {
            return templateEntryItem;
        };
        EntryItemRenderer.prototype.render = function (tree, element, container, previousCleanupFn) {
            if (element instanceof QuickOpenEntryItem) {
                return element.render(tree, container, previousCleanupFn);
            }
            return _super.prototype.render.call(this, tree, element, container, previousCleanupFn);
        };
        return EntryItemRenderer;
    })(treeDefaults_1.LegacyRenderer);
    var NoActionProvider = (function () {
        function NoActionProvider() {
        }
        NoActionProvider.prototype.hasActions = function (tree, element) {
            return false;
        };
        NoActionProvider.prototype.getActions = function (tree, element) {
            return winjs_base_1.TPromise.as(null);
        };
        NoActionProvider.prototype.hasSecondaryActions = function (tree, element) {
            return false;
        };
        NoActionProvider.prototype.getSecondaryActions = function (tree, element) {
            return winjs_base_1.TPromise.as(null);
        };
        NoActionProvider.prototype.getActionItem = function (tree, element, action) {
            return null;
        };
        return NoActionProvider;
    })();
    var Renderer = (function () {
        function Renderer(actionProvider, actionRunner) {
            if (actionProvider === void 0) { actionProvider = new NoActionProvider(); }
            if (actionRunner === void 0) { actionRunner = null; }
            this.actionProvider = actionProvider;
            this.actionRunner = actionRunner;
            this.entryItemRenderer = new EntryItemRenderer();
        }
        Renderer.prototype.getHeight = function (entry) {
            if (entry instanceof QuickOpenEntryItem) {
                return entry.getHeight();
            }
            if (entry.getDetail()) {
                return 44;
            }
            return 22;
        };
        Renderer.prototype.getTemplateId = function (entry) {
            if (entry instanceof QuickOpenEntryItem) {
                return templateEntryItem;
            }
            if (entry instanceof QuickOpenEntryGroup) {
                return templateEntryGroup;
            }
            return templateEntry;
        };
        Renderer.prototype.renderTemplate = function (templateId, container) {
            // Entry Item
            if (templateId === templateEntryItem) {
                return this.entryItemRenderer.renderTemplate(null, templateId, container);
            }
            // Entry Group
            var group;
            if (templateId === templateEntryGroup) {
                group = document.createElement('div');
                DOM.addClass(group, 'results-group');
                container.appendChild(group);
            }
            // Action Bar
            DOM.addClass(container, 'actions');
            var entryContainer = document.createElement('div');
            DOM.addClass(entryContainer, 'sub-content');
            container.appendChild(entryContainer);
            var actionBarContainer = document.createElement('div');
            DOM.addClass(actionBarContainer, 'primary-action-bar');
            container.appendChild(actionBarContainer);
            var actionBar = new actionbar_1.ActionBar(actionBarContainer, {
                actionRunner: this.actionRunner
            });
            // Entry
            var entry = document.createElement('div');
            DOM.addClass(entry, 'quick-open-entry');
            entryContainer.appendChild(entry);
            // Icon
            var icon = document.createElement('span');
            entry.appendChild(icon);
            // Prefix
            var prefix = document.createElement('span');
            entry.appendChild(prefix);
            // Label
            var label = new highlightedLabel_1.HighlightedLabel(entry);
            // Description
            var descriptionContainer = document.createElement('span');
            entry.appendChild(descriptionContainer);
            DOM.addClass(descriptionContainer, 'quick-open-entry-description');
            var description = new highlightedLabel_1.HighlightedLabel(descriptionContainer);
            // Detail
            var detailContainer = document.createElement('div');
            entry.appendChild(detailContainer);
            DOM.addClass(detailContainer, 'quick-open-entry-meta');
            var detail = new highlightedLabel_1.HighlightedLabel(detailContainer);
            return {
                container: container,
                icon: icon,
                prefix: prefix,
                label: label,
                detail: detail,
                description: description,
                group: group,
                actionBar: actionBar
            };
        };
        Renderer.prototype.renderElement = function (entry, templateId, templateData) {
            // Entry Item
            if (templateId === templateEntryItem) {
                this.entryItemRenderer.renderElement(null, entry, templateId, templateData);
                return;
            }
            var data = templateData;
            // Action Bar
            if (this.actionProvider.hasActions(null, entry)) {
                DOM.addClass(data.container, 'has-actions');
            }
            else {
                DOM.removeClass(data.container, 'has-actions');
            }
            data.actionBar.context = entry; // make sure the context is the current element
            this.actionProvider.getActions(null, entry).then(function (actions) {
                // TODO@Ben this will not work anymore as soon as quick open has more actions
                // but as long as there is only one are ok
                if (data.actionBar.isEmpty() && actions && actions.length > 0) {
                    data.actionBar.push(actions, { icon: true, label: false });
                }
                else if (!data.actionBar.isEmpty() && (!actions || actions.length === 0)) {
                    data.actionBar.clear();
                }
            });
            // Entry group
            if (entry instanceof QuickOpenEntryGroup) {
                var group = entry;
                // Border
                if (group.showBorder()) {
                    DOM.addClass(data.container, 'results-group-separator');
                }
                else {
                    DOM.removeClass(data.container, 'results-group-separator');
                }
                // Group Label
                var groupLabel = group.getGroupLabel() || '';
                templateData.group.textContent = groupLabel;
            }
            // Normal Entry
            if (entry instanceof QuickOpenEntry) {
                var _a = entry.getHighlights(), labelHighlights = _a[0], descriptionHighlights = _a[1], detailHighlights = _a[2];
                // Icon
                var iconClass = entry.getIcon() ? ('quick-open-entry-icon ' + entry.getIcon()) : '';
                data.icon.className = iconClass;
                // Prefix
                var prefix = entry.getPrefix() || '';
                data.prefix.textContent = prefix;
                // Label
                data.label.set(entry.getLabel(), labelHighlights || []);
                // Meta
                data.detail.set(entry.getDetail(), detailHighlights);
                // Description
                data.description.set(entry.getDescription(), descriptionHighlights || []);
            }
        };
        Renderer.prototype.disposeTemplate = function (templateId, templateData) {
            if (templateId === templateEntryItem) {
                this.entryItemRenderer.disposeTemplate(null, templateId, templateData);
            }
        };
        return Renderer;
    })();
    var QuickOpenModel = (function () {
        function QuickOpenModel(entries, actionProvider) {
            if (entries === void 0) { entries = []; }
            if (actionProvider === void 0) { actionProvider = new NoActionProvider(); }
            this._entries = entries;
            this._dataSource = this;
            this._renderer = new Renderer(actionProvider);
            this._filter = this;
            this._runner = this;
        }
        Object.defineProperty(QuickOpenModel.prototype, "entries", {
            get: function () { return this._entries; },
            set: function (entries) {
                this._entries = entries;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(QuickOpenModel.prototype, "dataSource", {
            get: function () { return this._dataSource; },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(QuickOpenModel.prototype, "renderer", {
            get: function () { return this._renderer; },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(QuickOpenModel.prototype, "filter", {
            get: function () { return this._filter; },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(QuickOpenModel.prototype, "runner", {
            get: function () { return this._runner; },
            enumerable: true,
            configurable: true
        });
        /**
         * Adds entries that should show up in the quick open viewer.
         */
        QuickOpenModel.prototype.addEntries = function (entries) {
            if (types.isArray(entries)) {
                this._entries = this._entries.concat(entries);
            }
        };
        /**
         * Set the entries that should show up in the quick open viewer.
         */
        QuickOpenModel.prototype.setEntries = function (entries) {
            if (types.isArray(entries)) {
                this._entries = entries;
            }
        };
        /**
         * Get the entries that should show up in the quick open viewer.
         *
         * @visibleOnly optional parameter to only return visible entries
         */
        QuickOpenModel.prototype.getEntries = function (visibleOnly) {
            if (visibleOnly) {
                return this._entries.filter(function (e) { return !e.isHidden(); });
            }
            return this._entries;
        };
        QuickOpenModel.prototype.getId = function (entry) {
            return entry.getId();
        };
        QuickOpenModel.prototype.getLabel = function (entry) {
            return entry.getLabel();
        };
        QuickOpenModel.prototype.isVisible = function (entry) {
            return !entry.isHidden();
        };
        QuickOpenModel.prototype.run = function (entry, mode, context) {
            return entry.run(mode, context);
        };
        return QuickOpenModel;
    })();
    exports.QuickOpenModel = QuickOpenModel;
});
//# sourceMappingURL=quickOpenModel.js.map