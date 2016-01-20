/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
'use strict';
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
define(["require", "exports", 'vs/base/common/winjs.base', 'vs/base/common/strings', 'vs/base/common/lifecycle', 'vs/base/common/async', 'vs/base/common/severity', 'vs/base/browser/dom', 'vs/base/common/errors', 'vs/editor/browser/editorBrowser', 'vs/editor/common/editorCommon', 'vs/editor/browser/editorBrowserExtensions', 'vs/editor/common/services/modelService', 'vs/platform/configuration/common/configuration', 'vs/platform/keybinding/common/keybindingService', 'vs/platform/message/common/message', 'vs/editor/common/core/range', '../common/codelens', 'vs/css!./codelens'], function (require, exports, winjs_base_1, strings_1, lifecycle, schedulers, severity_1, dom, errors, EditorBrowser, EditorCommon, editorBrowserExtensions_1, modelService_1, configuration_1, keybindingService_1, message_1, range_1, codelens_1) {
    var CodeLensViewZone = (function () {
        function CodeLensViewZone(afterLineNumber) {
            this.afterLineNumber = afterLineNumber;
            this.heightInLines = 1;
            this.suppressMouseDown = true;
            this.domNode = document.createElement('div');
        }
        CodeLensViewZone.prototype.setAfterLineNumber = function (afterLineNumber) {
            this.afterLineNumber = afterLineNumber;
        };
        return CodeLensViewZone;
    })();
    var CodeLensContentWidget = (function () {
        function CodeLensContentWidget(editor, symbolRange, keybindingService, messageService) {
            var _this = this;
            this._commands = Object.create(null);
            this._id = 'codeLensWidget' + (++CodeLensContentWidget.ID);
            this._editor = editor;
            this.setSymbolRange(symbolRange);
            this._domNode = document.createElement('span');
            this._domNode.style.height = editor.getConfiguration().lineHeight + "px";
            this._domNode.innerHTML = '&nbsp;';
            dom.addClass(this._domNode, 'codelens-decoration');
            dom.addClass(this._domNode, 'invisible-cl');
            this._subscription = dom.addListener(this._domNode, 'click', function (e) {
                var element = e.target;
                if (element.tagName === 'A' && element.id) {
                    var command = _this._commands[element.id];
                    if (command) {
                        editor.focus();
                        keybindingService.executeCommand(command.id, command.arguments).done(undefined, function (err) {
                            messageService.show(severity_1.default.Error, err);
                        });
                    }
                }
            });
            this.updateVisibility();
        }
        CodeLensContentWidget.prototype.dispose = function () {
            this._subscription();
            this._symbolRange = null;
        };
        CodeLensContentWidget.prototype.updateVisibility = function () {
            if (this.isVisible()) {
                dom.removeClass(this._domNode, 'invisible-cl');
                dom.addClass(this._domNode, 'fadein');
            }
        };
        CodeLensContentWidget.prototype.withCommands = function (symbols) {
            this._commands = Object.create(null);
            if (!symbols || !symbols.length) {
                this._domNode.innerHTML = 'no commands';
                return;
            }
            var html = [];
            for (var i = 0; i < symbols.length; i++) {
                var command = symbols[i].command;
                var part = void 0;
                if (command.id) {
                    part = strings_1.format('<a id={0}>{1}</a>', i, command.title);
                    this._commands[i] = command;
                }
                else {
                    part = strings_1.format('<span>{0}</span>', command.title);
                }
                html.push(part);
            }
            this._domNode.innerHTML = html.join('<span>&nbsp;|&nbsp;</span>');
            this._editor.layoutContentWidget(this);
        };
        CodeLensContentWidget.prototype.getId = function () {
            return this._id;
        };
        CodeLensContentWidget.prototype.getDomNode = function () {
            return this._domNode;
        };
        CodeLensContentWidget.prototype.setSymbolRange = function (range) {
            this._symbolRange = range;
            var lineNumber = range.startLineNumber;
            var column = this._editor.getModel().getLineFirstNonWhitespaceColumn(lineNumber);
            this._widgetPosition = {
                position: { lineNumber: lineNumber, column: column },
                preference: [EditorBrowser.ContentWidgetPositionPreference.ABOVE]
            };
        };
        CodeLensContentWidget.prototype.getPosition = function () {
            return this._widgetPosition;
        };
        CodeLensContentWidget.prototype.isVisible = function () {
            return this._domNode.hasAttribute('monaco-visible-content-widget');
        };
        CodeLensContentWidget.ID = 0;
        return CodeLensContentWidget;
    })();
    function modelsVersionId(modelService, modeId) {
        var result = 1;
        var models = modelService.getModels()
            .filter(function (model) { return model.getMode().getId() === modeId; })
            .map(function (model) {
            return {
                url: model.getAssociatedResource().toString(),
                versionId: model.getVersionId()
            };
        })
            .sort(function (a, b) {
            if (a.url < b.url) {
                return -1;
            }
            if (a.url > b.url) {
                return 1;
            }
            return 0;
        });
        for (var i = 0; i < models.length; i++) {
            result = (((31 * result) | 0) + models[i].versionId) | 0;
        }
        return result;
    }
    var CodeLensHelper = (function () {
        function CodeLensHelper() {
            this._removeDecorations = [];
            this._addDecorations = [];
            this._addDecorationsCallbacks = [];
        }
        CodeLensHelper.prototype.addDecoration = function (decoration, callback) {
            this._addDecorations.push(decoration);
            this._addDecorationsCallbacks.push(callback);
        };
        CodeLensHelper.prototype.removeDecoration = function (decorationId) {
            this._removeDecorations.push(decorationId);
        };
        CodeLensHelper.prototype.commit = function (changeAccessor) {
            var resultingDecorations = changeAccessor.deltaDecorations(this._removeDecorations, this._addDecorations);
            for (var i = 0, len = resultingDecorations.length; i < len; i++) {
                this._addDecorationsCallbacks[i](resultingDecorations[i]);
            }
        };
        return CodeLensHelper;
    })();
    var CodeLens = (function () {
        function CodeLens(data, editor, helper, viewZoneChangeAccessor, keybindingService, messageService) {
            var _this = this;
            this._editor = editor;
            this._data = data;
            this._decorationIds = new Array(this._data.length);
            var range;
            this._data.forEach(function (data, i) {
                helper.addDecoration({
                    range: data.symbol.range,
                    options: {}
                }, function (id) { return _this._decorationIds[i] = id; });
                // the range contain all lenses on this line
                for (var _i = 0, _a = _this._data; _i < _a.length; _i++) {
                    var lensData = _a[_i];
                    if (!range) {
                        range = lensData.symbol.range;
                    }
                    else {
                        range = range_1.Range.plusRange(range, lensData.symbol.range);
                    }
                }
            });
            this._viewZone = new CodeLensViewZone(range.startLineNumber - 1);
            this._contentWidget = new CodeLensContentWidget(editor, range_1.Range.lift(range), keybindingService, messageService);
            this._viewZoneId = viewZoneChangeAccessor.addZone(this._viewZone);
            this._editor.addContentWidget(this._contentWidget);
            this._lastUpdateModelsVersionId = -1;
        }
        CodeLens.prototype.dispose = function (helper, viewZoneChangeAccessor) {
            while (this._decorationIds.length) {
                helper.removeDecoration(this._decorationIds.pop());
            }
            if (viewZoneChangeAccessor) {
                viewZoneChangeAccessor.removeZone(this._viewZoneId);
            }
            this._editor.removeContentWidget(this._contentWidget);
            this._contentWidget.dispose();
        };
        CodeLens.prototype.isValid = function () {
            var _this = this;
            return this._decorationIds.some(function (id) {
                var range = _this._editor.getModel().getDecorationRange(id);
                return range && !range.isEmpty();
            });
        };
        CodeLens.prototype.updateCodeLensSymbols = function (data) {
            this._data = data;
        };
        CodeLens.prototype.computeIfNecessary = function (currentModelsVersionId, model) {
            this._contentWidget.updateVisibility(); // trigger the fade in
            if (!this._contentWidget.isVisible()) {
                return null;
            }
            if (this._lastUpdateModelsVersionId === currentModelsVersionId) {
                return null;
            }
            // Read editor current state
            for (var i = 0; i < this._decorationIds.length; i++) {
                this._data[i].symbol.range = model.getDecorationRange(this._decorationIds[i]);
            }
            return this._data;
        };
        CodeLens.prototype.updateCommands = function (symbols, currentModelsVersionId) {
            this._contentWidget.withCommands(symbols);
            this._lastUpdateModelsVersionId = currentModelsVersionId;
        };
        CodeLens.prototype.getLineNumber = function () {
            var range = this._editor.getModel().getDecorationRange(this._decorationIds[0]);
            if (range) {
                return range.startLineNumber;
            }
            return -1;
        };
        CodeLens.prototype.update = function (viewZoneChangeAccessor) {
            if (this.isValid()) {
                var range = this._editor.getModel().getDecorationRange(this._decorationIds[0]);
                this._viewZone.setAfterLineNumber(range.startLineNumber - 1);
                viewZoneChangeAccessor.layoutZone(this._viewZoneId);
                this._contentWidget.setSymbolRange(range);
                this._editor.layoutContentWidget(this._contentWidget);
            }
        };
        return CodeLens;
    })();
    var CodeLensContribution = (function () {
        function CodeLensContribution(editor, modelService, configurationService, keybindingService, messageService) {
            var _this = this;
            this._instanceCount = (++CodeLensContribution.INSTANCE_COUNT);
            this._editor = editor;
            this._modelService = modelService;
            this._configurationService = configurationService;
            this._keybindingService = keybindingService;
            this._messageService = messageService;
            this._globalToDispose = [];
            this._localToDispose = [];
            this._lenses = [];
            this._currentFindCodeLensSymbolsPromise = null;
            this._modelChangeCounter = 0;
            this._codeLenseDisabledByMode = true;
            this._globalToDispose.push(this._editor.addListener2(EditorCommon.EventType.ModelChanged, function () { return _this.onModelChange(); }));
            this._globalToDispose.push(this._editor.addListener2(EditorCommon.EventType.ModelModeChanged, function () { return _this.onModelChange(); }));
            this._globalToDispose.push(this._editor.addListener2(EditorCommon.EventType.ModelModeSupportChanged, function (e) {
                if (e.codeLensSupport) {
                    _this.onModelChange();
                }
            }));
            this._globalToDispose.push(this._editor.addListener2(EditorCommon.EventType.ConfigurationChanged, function (e) {
                if (e.referenceInfos) {
                    _this.onModelChange();
                }
            }));
            this._globalToDispose.push(codelens_1.CodeLensRegistry.onDidChange(this.onModelChange, this));
            this.onModelChange();
        }
        CodeLensContribution.prototype.dispose = function () {
            this.localDispose();
            this._globalToDispose = lifecycle.disposeAll(this._globalToDispose);
        };
        CodeLensContribution.prototype.localDispose = function () {
            if (this._currentFindCodeLensSymbolsPromise) {
                this._currentFindCodeLensSymbolsPromise.cancel();
                this._currentFindCodeLensSymbolsPromise = null;
                this._modelChangeCounter++;
            }
            if (this._currentFindOccPromise) {
                this._currentFindOccPromise.cancel();
                this._currentFindOccPromise = null;
            }
            this._localToDispose = lifecycle.disposeAll(this._localToDispose);
        };
        CodeLensContribution.prototype.getId = function () {
            return CodeLensContribution.ID;
        };
        CodeLensContribution.prototype.onModelChange = function () {
            var _this = this;
            this.localDispose();
            var model = this._editor.getModel();
            if (!model) {
                return;
            }
            if (!this._editor.getConfiguration().referenceInfos) {
                return;
            }
            if (!codelens_1.CodeLensRegistry.has(model)) {
                return;
            }
            var scheduler = new schedulers.RunOnceScheduler(function () {
                if (_this._currentFindCodeLensSymbolsPromise) {
                    _this._currentFindCodeLensSymbolsPromise.cancel();
                }
                _this._currentFindCodeLensSymbolsPromise = codelens_1.getCodeLensData(model);
                var counterValue = ++_this._modelChangeCounter;
                _this._currentFindCodeLensSymbolsPromise.then(function (result) {
                    if (counterValue === _this._modelChangeCounter) {
                        _this.renderCodeLensSymbols(result);
                        detectVisible.schedule();
                    }
                }, function (error) {
                    errors.onUnexpectedError(error);
                });
            }, 250);
            var detectVisible = new schedulers.RunOnceScheduler(function () {
                _this._onViewportChanged(model.getMode().getId());
            }, 500);
            this._localToDispose.push(scheduler);
            this._localToDispose.push(detectVisible);
            this._localToDispose.push(model.addBulkListener2(function (events) {
                var hadChange = false;
                for (var i = 0; i < events.length; i++) {
                    var eventType = events[i].getType();
                    if (eventType === EditorCommon.EventType.ModelContentChanged) {
                        hadChange = true;
                        break;
                    }
                }
                if (hadChange) {
                    _this._editor.changeDecorations(function (changeAccessor) {
                        _this._editor.changeViewZones(function (viewAccessor) {
                            var toDispose = [];
                            _this._lenses.forEach(function (lens) {
                                if (lens.isValid()) {
                                    lens.update(viewAccessor);
                                }
                                else {
                                    toDispose.push(lens);
                                }
                            });
                            var helper = new CodeLensHelper();
                            toDispose.forEach(function (l) {
                                l.dispose(helper, viewAccessor);
                                _this._lenses.splice(_this._lenses.indexOf(l), 1);
                            });
                            helper.commit(changeAccessor);
                        });
                    });
                    // Compute new `visible` code lenses
                    detectVisible.schedule();
                    // Ask for all references again
                    scheduler.schedule();
                }
            }));
            this._localToDispose.push(this._editor.addListener2('scroll', function (e) {
                detectVisible.schedule();
            }));
            this._localToDispose.push({
                dispose: function () {
                    if (_this._editor.getModel()) {
                        _this._editor.changeDecorations(function (changeAccessor) {
                            _this._editor.changeViewZones(function (accessor) {
                                _this._disposeAllLenses(changeAccessor, accessor);
                            });
                        });
                    }
                    else {
                        // No accessors available
                        _this._disposeAllLenses(null, null);
                    }
                }
            });
            scheduler.schedule();
        };
        CodeLensContribution.prototype._disposeAllLenses = function (decChangeAccessor, viewZoneChangeAccessor) {
            var helper = new CodeLensHelper();
            this._lenses.forEach(function (lens) { return lens.dispose(helper, viewZoneChangeAccessor); });
            if (decChangeAccessor) {
                helper.commit(decChangeAccessor);
            }
            this._lenses = [];
        };
        CodeLensContribution.prototype.renderCodeLensSymbols = function (symbols) {
            var _this = this;
            if (!symbols) {
                symbols = [];
            }
            else {
                symbols = symbols.sort(function (a, b) { return range_1.Range.compareRangesUsingStarts(a.symbol.range, b.symbol.range); });
            }
            var maxLineNumber = this._editor.getModel().getLineCount();
            var groups = [];
            var lastGroup;
            for (var _i = 0; _i < symbols.length; _i++) {
                var symbol = symbols[_i];
                var line = symbol.symbol.range.startLineNumber;
                if (line < 1 || line >= maxLineNumber) {
                    // invalid code lens
                    continue;
                }
                else if (lastGroup && lastGroup[lastGroup.length - 1].symbol.range.startLineNumber === line) {
                    // on same line as previous
                    lastGroup.push(symbol);
                }
                else {
                    // on later line as previous
                    lastGroup = [symbol];
                    groups.push(lastGroup);
                }
            }
            var centeredRange = this._editor.getCenteredRangeInViewport();
            var shouldRestoreCenteredRange = (groups.length !== this._lenses.length);
            this._editor.changeDecorations(function (changeAccessor) {
                _this._editor.changeViewZones(function (accessor) {
                    var codeLensIndex = 0, groupsIndex = 0, helper = new CodeLensHelper();
                    while (groupsIndex < groups.length && codeLensIndex < _this._lenses.length) {
                        var symbolsLineNumber = groups[groupsIndex][0].symbol.range.startLineNumber;
                        var codeLensLineNumber = _this._lenses[codeLensIndex].getLineNumber();
                        if (codeLensLineNumber < symbolsLineNumber) {
                            _this._lenses[codeLensIndex].dispose(helper, accessor);
                            _this._lenses.splice(codeLensIndex, 1);
                        }
                        else if (codeLensLineNumber === symbolsLineNumber) {
                            _this._lenses[codeLensIndex].updateCodeLensSymbols(groups[groupsIndex]);
                            groupsIndex++;
                            codeLensIndex++;
                        }
                        else {
                            _this._lenses.splice(codeLensIndex, 0, new CodeLens(groups[groupsIndex], _this._editor, helper, accessor, _this._keybindingService, _this._messageService));
                            codeLensIndex++;
                            groupsIndex++;
                        }
                    }
                    // Delete extra code lenses
                    while (codeLensIndex < _this._lenses.length) {
                        _this._lenses[codeLensIndex].dispose(helper, accessor);
                        _this._lenses.splice(codeLensIndex, 1);
                    }
                    // Create extra symbols
                    while (groupsIndex < groups.length) {
                        _this._lenses.push(new CodeLens(groups[groupsIndex], _this._editor, helper, accessor, _this._keybindingService, _this._messageService));
                        groupsIndex++;
                    }
                    helper.commit(changeAccessor);
                });
            });
            if (shouldRestoreCenteredRange) {
                this._editor.revealRangeInCenter(centeredRange);
            }
        };
        CodeLensContribution.prototype._onViewportChanged = function (modeId) {
            var _this = this;
            if (this._currentFindOccPromise) {
                this._currentFindOccPromise.cancel();
                this._currentFindOccPromise = null;
            }
            var model = this._editor.getModel();
            if (!model) {
                return;
            }
            var currentModelsVersionId = modelsVersionId(this._modelService, modeId);
            var toResolve = [];
            var lenses = [];
            this._lenses.forEach(function (lens) {
                var request = lens.computeIfNecessary(currentModelsVersionId, model);
                if (request) {
                    toResolve.push(request);
                    lenses.push(lens);
                }
            });
            if (toResolve.length === 0) {
                return;
            }
            var resource = model.getAssociatedResource();
            var promises = toResolve.map(function (request, i) {
                var resolvedSymbols = new Array(request.length);
                var promises = request.map(function (request, i) {
                    return request.support.resolveCodeLensSymbol(resource, request.symbol).then(function (symbol) {
                        resolvedSymbols[i] = symbol;
                    });
                });
                return winjs_base_1.TPromise.join(promises).then(function () {
                    lenses[i].updateCommands(resolvedSymbols, currentModelsVersionId);
                });
            });
            this._currentFindOccPromise = winjs_base_1.TPromise.join(promises).then(function () {
                _this._currentFindOccPromise = null;
            });
        };
        CodeLensContribution.ID = 'css.editor.codeLens';
        CodeLensContribution.INSTANCE_COUNT = 0;
        CodeLensContribution = __decorate([
            __param(1, modelService_1.IModelService),
            __param(2, configuration_1.IConfigurationService),
            __param(3, keybindingService_1.IKeybindingService),
            __param(4, message_1.IMessageService)
        ], CodeLensContribution);
        return CodeLensContribution;
    })();
    exports.CodeLensContribution = CodeLensContribution;
    editorBrowserExtensions_1.EditorBrowserRegistry.registerEditorContribution(CodeLensContribution);
});
//# sourceMappingURL=codelens.js.map