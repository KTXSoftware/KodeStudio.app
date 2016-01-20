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
define(["require", "exports", 'vs/base/common/winjs.base', 'vs/nls', 'vs/base/common/arrays', 'vs/base/common/errors', 'vs/base/common/types', 'vs/base/common/strings', 'vs/base/parts/quickopen/common/quickOpen', 'vs/base/parts/quickopen/browser/quickOpenModel', 'vs/workbench/browser/quickopen', 'vs/workbench/browser/actions/quickOpenAction', 'vs/workbench/browser/parts/editor/textEditor', 'vs/workbench/common/editor', 'vs/base/common/filters', 'vs/editor/common/editorCommon', 'vs/workbench/services/editor/common/editorService', 'vs/workbench/services/quickopen/common/quickOpenService', 'vs/platform/workspace/common/workspace', 'vs/editor/contrib/quickOpen/common/quickOpen', 'vs/css!./media/gotoSymbolHandler'], function (require, exports, winjs_base_1, nls, arrays, errors, types, strings, quickOpen_1, quickOpenModel_1, quickopen_1, quickOpenAction_1, textEditor_1, editor_1, filters, editorCommon_1, editorService_1, quickOpenService_1, workspace_1, quickOpen_2) {
    exports.GOTO_SYMBOL_PREFIX = '@';
    exports.SCOPE_PREFIX = ':';
    var GotoSymbolAction = (function (_super) {
        __extends(GotoSymbolAction, _super);
        function GotoSymbolAction(actionId, actionLabel, quickOpenService) {
            _super.call(this, actionId, actionLabel, exports.GOTO_SYMBOL_PREFIX, quickOpenService);
        }
        GotoSymbolAction.ID = 'workbench.action.gotoSymbol';
        GotoSymbolAction.LABEL = nls.localize('gotoSymbol', "Go to Symbol...");
        GotoSymbolAction = __decorate([
            __param(2, quickOpenService_1.IQuickOpenService)
        ], GotoSymbolAction);
        return GotoSymbolAction;
    })(quickOpenAction_1.QuickOpenAction);
    exports.GotoSymbolAction = GotoSymbolAction;
    var OutlineModel = (function (_super) {
        __extends(OutlineModel, _super);
        function OutlineModel(outline, entries) {
            _super.call(this, entries);
            this.outline = outline;
        }
        OutlineModel.prototype.dofilter = function (searchValue) {
            // Normalize search
            var normalizedSearchValue = searchValue;
            if (searchValue.indexOf(exports.SCOPE_PREFIX) === 0) {
                normalizedSearchValue = normalizedSearchValue.substr(exports.SCOPE_PREFIX.length);
            }
            // Check for match and update visibility and group label
            this.entries.forEach(function (entry) {
                // Clear all state first
                entry.setGroupLabel(null);
                entry.setShowBorder(false);
                entry.setHighlights(null);
                entry.setHidden(false);
                // Filter by search
                if (normalizedSearchValue) {
                    var highlights = filters.matchesFuzzy(normalizedSearchValue, entry.getLabel());
                    if (highlights) {
                        entry.setHighlights(highlights);
                        entry.setHidden(false);
                    }
                    else if (!entry.isHidden()) {
                        entry.setHidden(true);
                    }
                }
            });
            // Sort properly if actually searching
            if (searchValue) {
                if (searchValue.indexOf(exports.SCOPE_PREFIX) === 0) {
                    this.entries.sort(this.sortScoped.bind(this, searchValue.toLowerCase()));
                }
                else {
                    this.entries.sort(this.sortNormal.bind(this, searchValue.toLowerCase()));
                }
            }
            else {
                this.entries.sort(function (a, b) { return a.getIndex() - b.getIndex(); });
            }
            // Mark all type groups
            var visibleResults = this.getEntries(true);
            if (visibleResults.length > 0 && searchValue.indexOf(exports.SCOPE_PREFIX) === 0) {
                var currentType = null;
                var currentResult = null;
                var typeCounter = 0;
                for (var i = 0; i < visibleResults.length; i++) {
                    var result = visibleResults[i];
                    // Found new type
                    if (currentType !== result.getType()) {
                        // Update previous result with count
                        if (currentResult) {
                            currentResult.setGroupLabel(this.renderGroupLabel(currentType, typeCounter, this.outline));
                        }
                        currentType = result.getType();
                        currentResult = result;
                        typeCounter = 1;
                        result.setShowBorder(i > 0);
                    }
                    else {
                        typeCounter++;
                    }
                }
                // Update previous result with count
                if (currentResult) {
                    currentResult.setGroupLabel(this.renderGroupLabel(currentType, typeCounter, this.outline));
                }
            }
            else if (visibleResults.length > 0) {
                visibleResults[0].setGroupLabel(nls.localize('symbols', "symbols ({0})", visibleResults.length));
            }
        };
        OutlineModel.prototype.sortNormal = function (searchValue, elementA, elementB) {
            // Handle hidden elements
            if (elementA.isHidden() && elementB.isHidden()) {
                return 0;
            }
            else if (elementA.isHidden()) {
                return 1;
            }
            else if (elementB.isHidden()) {
                return -1;
            }
            var elementAName = elementA.getLabel().toLowerCase();
            var elementBName = elementB.getLabel().toLowerCase();
            // Compare by name
            var r = strings.localeCompare(elementAName, elementBName);
            if (r !== 0) {
                return r;
            }
            // If name identical sort by range instead
            var elementARange = elementA.getRange();
            var elementBRange = elementB.getRange();
            return elementARange.startLineNumber - elementBRange.startLineNumber;
        };
        OutlineModel.prototype.sortScoped = function (searchValue, elementA, elementB) {
            // Handle hidden elements
            if (elementA.isHidden() && elementB.isHidden()) {
                return 0;
            }
            else if (elementA.isHidden()) {
                return 1;
            }
            else if (elementB.isHidden()) {
                return -1;
            }
            // Remove scope char
            searchValue = searchValue.substr(exports.SCOPE_PREFIX.length);
            // Sort by type first if scoped search
            var elementAType = elementA.getType();
            var elementBType = elementB.getType();
            var r = strings.localeCompare(elementAType, elementBType);
            if (r !== 0) {
                return r;
            }
            // Special sort when searching in scoped mode
            if (searchValue) {
                var elementAName = elementA.getLabel().toLowerCase();
                var elementBName = elementB.getLabel().toLowerCase();
                // Compare by name
                r = strings.localeCompare(elementAName, elementBName);
                if (r !== 0) {
                    return r;
                }
            }
            // Default to sort by range
            var elementARange = elementA.getRange();
            var elementBRange = elementB.getRange();
            return elementARange.startLineNumber - elementBRange.startLineNumber;
        };
        OutlineModel.prototype.renderGroupLabel = function (type, count, outline) {
            if (outline.outlineGroupLabel) {
                var label = outline.outlineGroupLabel[type];
                if (label) {
                    return nls.localize('grouplabel', "{0} ({1})", label, count);
                }
            }
            switch (type) {
                case 'module': return nls.localize('modules', "modules ({0})", count);
                case 'class': return nls.localize('class', "classes ({0})", count);
                case 'interface': return nls.localize('interface', "interfaces ({0})", count);
                case 'method': return nls.localize('method', "methods ({0})", count);
                case 'function': return nls.localize('function', "functions ({0})", count);
                case 'property': return nls.localize('property', "properties ({0})", count);
                case 'variable': return nls.localize('variable', "variables ({0})", count);
                case 'var': return nls.localize('variable2', "variables ({0})", count);
                case 'constructor': return nls.localize('_constructor', "constructors ({0})", count);
                case 'call': return nls.localize('call', "calls ({0})", count);
            }
            return type;
        };
        return OutlineModel;
    })(quickOpenModel_1.QuickOpenModel);
    var SymbolEntry = (function (_super) {
        __extends(SymbolEntry, _super);
        function SymbolEntry(index, name, type, description, icon, range, highlights, editorService, handler) {
            _super.call(this);
            this.index = index;
            this.name = name;
            this.type = type;
            this.icon = icon;
            this.description = description;
            this.range = range;
            this.setHighlights(highlights);
            this.editorService = editorService;
            this.handler = handler;
        }
        SymbolEntry.prototype.getIndex = function () {
            return this.index;
        };
        SymbolEntry.prototype.getLabel = function () {
            return this.name;
        };
        SymbolEntry.prototype.getIcon = function () {
            return this.icon;
        };
        SymbolEntry.prototype.getDescription = function () {
            return this.description;
        };
        SymbolEntry.prototype.getType = function () {
            return this.type;
        };
        SymbolEntry.prototype.getRange = function () {
            return this.range;
        };
        SymbolEntry.prototype.getInput = function () {
            return this.editorService.getActiveEditorInput();
        };
        SymbolEntry.prototype.getOptions = function () {
            var options = new editor_1.TextEditorOptions();
            options.selection(this.range.startLineNumber, this.range.startColumn, this.range.startLineNumber, this.range.startColumn);
            return options;
        };
        SymbolEntry.prototype.run = function (mode, context) {
            if (mode === quickOpen_1.Mode.OPEN) {
                return this.runOpen(context);
            }
            return this.runPreview();
        };
        SymbolEntry.prototype.runOpen = function (context) {
            // Check for sideBySide use
            var event = context.event;
            var sideBySide = (event && (event.ctrlKey || event.metaKey || (event.payload && event.payload.originalEvent && (event.payload.originalEvent.ctrlKey || event.payload.originalEvent.metaKey))));
            if (sideBySide) {
                this.editorService.openEditor(this.getInput(), this.getOptions(), true).done(null, errors.onUnexpectedError);
            }
            else {
                var range = this.toSelection();
                var activeEditor = this.editorService.getActiveEditor();
                if (activeEditor) {
                    var editor = activeEditor.getControl();
                    editor.setSelection(range);
                    editor.revealRangeInCenter(range);
                }
            }
            return true;
        };
        SymbolEntry.prototype.runPreview = function () {
            // Select Outline Position
            var range = this.toSelection();
            var activeEditor = this.editorService.getActiveEditor();
            if (activeEditor) {
                var editorControl = activeEditor.getControl();
                editorControl.revealRangeInCenter(range);
                // Decorate if possible
                if (types.isFunction(editorControl.changeDecorations)) {
                    this.handler.decorateOutline(this.range, range, editorControl, activeEditor.position);
                }
            }
            return false;
        };
        SymbolEntry.prototype.toSelection = function () {
            return {
                startLineNumber: this.range.startLineNumber,
                startColumn: this.range.startColumn || 1,
                endLineNumber: this.range.startLineNumber,
                endColumn: this.range.startColumn || 1
            };
        };
        return SymbolEntry;
    })(quickopen_1.EditorQuickOpenEntryGroup);
    var GotoSymbolHandler = (function (_super) {
        __extends(GotoSymbolHandler, _super);
        function GotoSymbolHandler(editorService, contextService) {
            _super.call(this);
            this.editorService = editorService;
            this.contextService = contextService;
            this.outlineToModelCache = {};
        }
        GotoSymbolHandler.prototype.getResults = function (searchValue) {
            searchValue = searchValue.trim();
            // Remember view state to be able to restore on cancel
            if (!this.lastKnownEditorViewState) {
                var editor = this.editorService.getActiveEditor();
                this.lastKnownEditorViewState = editor.getControl().saveViewState();
            }
            // Resolve Outline Model
            return this.getActiveOutline().then(function (outline) {
                // Filter by search
                outline.dofilter(searchValue);
                return outline;
            });
        };
        GotoSymbolHandler.prototype.getEmptyLabel = function (searchString) {
            if (searchString.length > 0) {
                return nls.localize('noSymbolsMatching', "No symbols matching");
            }
            return nls.localize('noSymbolsFound', "No symbols found");
        };
        GotoSymbolHandler.prototype.canRun = function () {
            var canRun = false;
            var editor = this.editorService.getActiveEditor();
            if (editor instanceof textEditor_1.BaseTextEditor) {
                var editorControl = editor.getControl();
                var model = editorControl.getModel();
                if (model && model.modified && model.original) {
                    model = model.modified; // Support for diff editor models
                }
                if (model && types.isFunction(model.getMode)) {
                    canRun = quickOpen_2.OutlineRegistry.has(model);
                }
            }
            return canRun ? true : editor instanceof textEditor_1.BaseTextEditor ? nls.localize('cannotRunGotoSymbolInFile', "Unfortunately we have no symbol information for the file") : nls.localize('cannotRunGotoSymbol', "Open a text file first to go to a symbol");
        };
        GotoSymbolHandler.prototype.getAutoFocus = function (searchValue) {
            searchValue = searchValue.trim();
            // Remove any type pattern (:) from search value as needed
            if (searchValue.indexOf(exports.SCOPE_PREFIX) === 0) {
                searchValue = searchValue.substr(exports.SCOPE_PREFIX.length);
            }
            return {
                autoFocusPrefixMatch: searchValue,
                autoFocusFirstEntry: !!searchValue
            };
        };
        GotoSymbolHandler.prototype.toQuickOpenEntries = function (outline) {
            var results = [];
            // Flatten
            var flattened = [];
            if (outline) {
                this.flatten(outline.entries, flattened);
            }
            for (var i = 0; i < flattened.length; i++) {
                var element = flattened[i];
                var label = strings.trim(element.label);
                // Show parent scope as description
                var description = element.containerLabel;
                if (element.parentScope) {
                    description = arrays.tail(element.parentScope);
                }
                // Add
                var icon = element.icon || element.type;
                results.push(new SymbolEntry(i, label, element.type, description, icon, element.range, null, this.editorService, this));
            }
            return results;
        };
        GotoSymbolHandler.prototype.flatten = function (outline, flattened, parentScope) {
            for (var i = 0; i < outline.length; i++) {
                var element = outline[i];
                flattened.push(element);
                if (parentScope) {
                    element.parentScope = parentScope;
                }
                if (element.children) {
                    var elementScope = [];
                    if (parentScope) {
                        elementScope = parentScope.slice(0);
                    }
                    elementScope.push(element.label);
                    this.flatten(element.children, flattened, elementScope);
                }
            }
        };
        GotoSymbolHandler.prototype.getActiveOutline = function () {
            if (!this.activeOutlineRequest) {
                this.activeOutlineRequest = this.doGetActiveOutline();
            }
            return this.activeOutlineRequest;
        };
        GotoSymbolHandler.prototype.doGetActiveOutline = function () {
            var _this = this;
            var editor = this.editorService.getActiveEditor();
            if (editor instanceof textEditor_1.BaseTextEditor) {
                var editorControl = editor.getControl();
                var model = editorControl.getModel();
                if (model && model.modified && model.original) {
                    model = model.modified; // Support for diff editor models
                }
                if (model && types.isFunction(model.getMode)) {
                    // Ask cache first
                    var modelId = model.id;
                    if (this.outlineToModelCache[modelId]) {
                        return winjs_base_1.TPromise.as(this.outlineToModelCache[modelId]);
                    }
                    return quickOpen_2.getOutlineEntries(model).then(function (outline) {
                        var model = new OutlineModel(outline, _this.toQuickOpenEntries(outline));
                        _this.outlineToModelCache = {}; // Clear cache, only keep 1 outline
                        _this.outlineToModelCache[modelId] = model;
                        return model;
                    });
                }
            }
            return winjs_base_1.TPromise.as(null);
        };
        GotoSymbolHandler.prototype.decorateOutline = function (fullRange, startRange, editor, position) {
            var _this = this;
            editor.changeDecorations(function (changeAccessor) {
                var deleteDecorations = [];
                if (_this.lineHighlightDecorationId) {
                    deleteDecorations.push(_this.lineHighlightDecorationId.lineDecorationId);
                    deleteDecorations.push(_this.lineHighlightDecorationId.lineHighlightId);
                    _this.lineHighlightDecorationId = null;
                }
                var newDecorations = [
                    // lineHighlight at index 0
                    {
                        range: fullRange,
                        options: {
                            className: 'lineHighlight',
                            isWholeLine: true
                        }
                    },
                    // lineDecoration at index 1
                    {
                        range: startRange,
                        options: {
                            overviewRuler: {
                                color: 'rgba(0, 122, 204, 0.6)',
                                darkColor: 'rgba(0, 122, 204, 0.6)',
                                position: editorCommon_1.OverviewRulerLane.Full
                            }
                        }
                    }
                ];
                var decorations = changeAccessor.deltaDecorations(deleteDecorations, newDecorations);
                var lineHighlightId = decorations[0];
                var lineDecorationId = decorations[1];
                _this.lineHighlightDecorationId = {
                    lineHighlightId: lineHighlightId,
                    lineDecorationId: lineDecorationId,
                    position: position
                };
            });
        };
        GotoSymbolHandler.prototype.clearDecorations = function () {
            var _this = this;
            if (this.lineHighlightDecorationId) {
                this.editorService.getVisibleEditors().forEach(function (editor) {
                    if (editor.position === _this.lineHighlightDecorationId.position) {
                        var editorControl = editor.getControl();
                        editorControl.changeDecorations(function (changeAccessor) {
                            changeAccessor.deltaDecorations([
                                _this.lineHighlightDecorationId.lineDecorationId,
                                _this.lineHighlightDecorationId.lineHighlightId
                            ], []);
                        });
                    }
                });
                this.lineHighlightDecorationId = null;
            }
        };
        GotoSymbolHandler.prototype.onClose = function (canceled) {
            // Clear Cache
            this.outlineToModelCache = {};
            // Clear Highlight Decorations if present
            this.clearDecorations();
            // Restore selection if canceled
            if (canceled && this.lastKnownEditorViewState) {
                var activeEditor = this.editorService.getActiveEditor();
                if (activeEditor) {
                    var editor = activeEditor.getControl();
                    editor.restoreViewState(this.lastKnownEditorViewState);
                }
            }
            this.lastKnownEditorViewState = null;
            this.activeOutlineRequest = null;
        };
        GotoSymbolHandler = __decorate([
            __param(0, editorService_1.IWorkbenchEditorService),
            __param(1, workspace_1.IWorkspaceContextService)
        ], GotoSymbolHandler);
        return GotoSymbolHandler;
    })(quickopen_1.QuickOpenHandler);
    exports.GotoSymbolHandler = GotoSymbolHandler;
});
//# sourceMappingURL=gotoSymbolHandler.js.map