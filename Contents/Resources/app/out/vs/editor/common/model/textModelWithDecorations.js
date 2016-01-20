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
define(["require", "exports", 'vs/base/common/strings', 'vs/editor/common/model/textModelWithTrackedRanges', 'vs/editor/common/editorCommon', 'vs/base/common/errors', 'vs/editor/common/core/idGenerator', 'vs/editor/common/core/range'], function (require, exports, Strings, textModelWithTrackedRanges_1, EditorCommon, Errors, idGenerator_1, range_1) {
    var DeferredEventsBuilder = (function () {
        function DeferredEventsBuilder() {
            this.changedMarkers = {};
            this.oldDecorationRange = {};
            this.oldDecorationOptions = {};
            this.newOrChangedDecorations = {};
            this.removedDecorations = {};
        }
        // --- Build decoration events
        DeferredEventsBuilder.prototype.addNewDecoration = function (id) {
            this.newOrChangedDecorations[id] = true;
        };
        DeferredEventsBuilder.prototype.addRemovedDecoration = function (id, ownerId, range, options) {
            if (this.newOrChangedDecorations.hasOwnProperty(id)) {
                delete this.newOrChangedDecorations[id];
            }
            if (!this.oldDecorationRange.hasOwnProperty(id)) {
                this.oldDecorationRange[id] = range;
            }
            if (!this.oldDecorationOptions.hasOwnProperty(id)) {
                this.oldDecorationOptions[id] = options;
            }
            this.removedDecorations[id] = true;
        };
        DeferredEventsBuilder.prototype.addMovedDecoration = function (id, oldRange) {
            if (!this.oldDecorationRange.hasOwnProperty(id)) {
                this.oldDecorationRange[id] = oldRange;
            }
            this.newOrChangedDecorations[id] = true;
        };
        DeferredEventsBuilder.prototype.addUpdatedDecoration = function (id, oldOptions) {
            if (!this.oldDecorationOptions.hasOwnProperty(id)) {
                this.oldDecorationOptions[id] = oldOptions;
            }
            this.newOrChangedDecorations[id] = true;
        };
        return DeferredEventsBuilder;
    })();
    exports.DeferredEventsBuilder = DeferredEventsBuilder;
    var _INSTANCE_COUNT = 0;
    var TextModelWithDecorations = (function (_super) {
        __extends(TextModelWithDecorations, _super);
        function TextModelWithDecorations(allowedEventTypes, rawText, modeOrPromise) {
            allowedEventTypes.push(EditorCommon.EventType.ModelDecorationsChanged);
            _super.call(this, allowedEventTypes, rawText, modeOrPromise);
            // Initialize decorations
            this._decorationIdGenerator = new idGenerator_1.IdGenerator((++_INSTANCE_COUNT) + ';');
            this.decorations = {};
            this.rangeIdToDecorationId = {};
            this._currentDeferredEvents = null;
        }
        TextModelWithDecorations.prototype.dispose = function () {
            this.decorations = null;
            this.rangeIdToDecorationId = null;
            _super.prototype.dispose.call(this);
        };
        TextModelWithDecorations.prototype._resetValue = function (e, newValue) {
            _super.prototype._resetValue.call(this, e, newValue);
            // Destroy all my decorations
            this.decorations = {};
            this.rangeIdToDecorationId = {};
        };
        TextModelWithDecorations.prototype.changeDecorations = function (callback, ownerId) {
            var _this = this;
            if (ownerId === void 0) { ownerId = 0; }
            if (this._isDisposed) {
                throw new Error('TextModelWithDecorations.changeDecorations: Model is disposed');
            }
            return this._withDeferredEvents(function (deferredEventsBuilder) {
                var changeAccessor = {
                    addDecoration: function (range, options) {
                        return _this._addDecorationImpl(deferredEventsBuilder, ownerId, _this.validateRange(range), _normalizeOptions(options));
                    },
                    changeDecoration: function (id, newRange) {
                        _this._changeDecorationImpl(deferredEventsBuilder, id, _this.validateRange(newRange));
                    },
                    changeDecorationOptions: function (id, options) {
                        _this._changeDecorationOptionsImpl(deferredEventsBuilder, id, _normalizeOptions(options));
                    },
                    removeDecoration: function (id) {
                        _this._removeDecorationImpl(deferredEventsBuilder, id);
                    },
                    deltaDecorations: function (oldDecorations, newDecorations) {
                        return _this._deltaDecorationsImpl(deferredEventsBuilder, ownerId, oldDecorations, _this._normalizeDeltaDecorations(newDecorations));
                    }
                };
                var result = null;
                try {
                    result = callback(changeAccessor);
                }
                catch (e) {
                    Errors.onUnexpectedError(e);
                }
                // Invalidate change accessor
                changeAccessor.addDecoration = null;
                changeAccessor.changeDecoration = null;
                changeAccessor.removeDecoration = null;
                changeAccessor.deltaDecorations = null;
                return result;
            });
        };
        TextModelWithDecorations.prototype.deltaDecorations = function (oldDecorations, newDecorations, ownerId) {
            if (ownerId === void 0) { ownerId = 0; }
            if (this._isDisposed) {
                throw new Error('TextModelWithDecorations.deltaDecorations: Model is disposed');
            }
            if (!oldDecorations) {
                oldDecorations = [];
            }
            return this.changeDecorations(function (changeAccessor) {
                return changeAccessor.deltaDecorations(oldDecorations, newDecorations);
            }, ownerId);
        };
        TextModelWithDecorations.prototype.removeAllDecorationsWithOwnerId = function (ownerId) {
            if (this._isDisposed) {
                throw new Error('TextModelWithDecorations.removeAllDecorationsWithOwnerId: Model is disposed');
            }
            var decorationId;
            var decoration;
            var toRemove = [];
            for (decorationId in this.decorations) {
                if (this.decorations.hasOwnProperty(decorationId)) {
                    decoration = this.decorations[decorationId];
                    if (decoration.ownerId === ownerId) {
                        toRemove.push(decoration.id);
                    }
                }
            }
            this._removeDecorationsImpl(null, toRemove);
        };
        TextModelWithDecorations.prototype.getDecorationOptions = function (decorationId) {
            if (this._isDisposed) {
                throw new Error('TextModelWithDecorations.getDecorationOptions: Model is disposed');
            }
            if (this.decorations.hasOwnProperty(decorationId)) {
                return this.decorations[decorationId].options;
            }
            return null;
        };
        TextModelWithDecorations.prototype.getDecorationRange = function (decorationId) {
            if (this._isDisposed) {
                throw new Error('TextModelWithDecorations.getDecorationRange: Model is disposed');
            }
            if (this.decorations.hasOwnProperty(decorationId)) {
                var decoration = this.decorations[decorationId];
                return this.getTrackedRange(decoration.rangeId);
            }
            return null;
        };
        TextModelWithDecorations.prototype.getLineDecorations = function (lineNumber, ownerId, filterOutValidation) {
            if (ownerId === void 0) { ownerId = 0; }
            if (filterOutValidation === void 0) { filterOutValidation = false; }
            if (this._isDisposed) {
                throw new Error('TextModelWithDecorations.getLineDecorations: Model is disposed');
            }
            if (lineNumber < 1 || lineNumber > this.getLineCount()) {
                return [];
            }
            return this.getLinesDecorations(lineNumber, lineNumber, ownerId, filterOutValidation);
        };
        TextModelWithDecorations.prototype._getDecorationsInRange = function (startLineNumber, startColumn, endLineNumber, endColumn, ownerId, filterOutValidation) {
            var result = [], decoration, lineRanges = this.getLinesTrackedRanges(startLineNumber, endLineNumber), i, lineRange, len;
            for (i = 0, len = lineRanges.length; i < len; i++) {
                lineRange = lineRanges[i];
                // Look at line range only if there is a corresponding decoration for it
                if (this.rangeIdToDecorationId.hasOwnProperty(lineRange.id)) {
                    decoration = this.decorations[this.rangeIdToDecorationId[lineRange.id]];
                    if (ownerId && decoration.ownerId && decoration.ownerId !== ownerId) {
                        continue;
                    }
                    if (filterOutValidation) {
                        if (decoration.options.className === EditorCommon.ClassName.EditorErrorDecoration || decoration.options.className === EditorCommon.ClassName.EditorWarningDecoration) {
                            continue;
                        }
                    }
                    if (lineRange.range.startLineNumber === startLineNumber && lineRange.range.endColumn < startColumn) {
                        continue;
                    }
                    if (lineRange.range.endLineNumber === endLineNumber && lineRange.range.startColumn > endColumn) {
                        continue;
                    }
                    result.push({
                        id: decoration.id,
                        ownerId: decoration.ownerId,
                        range: lineRange.range,
                        options: decoration.options
                    });
                }
            }
            return result;
        };
        TextModelWithDecorations.prototype.getLinesDecorations = function (startLineNumber, endLineNumber, ownerId, filterOutValidation) {
            if (ownerId === void 0) { ownerId = 0; }
            if (filterOutValidation === void 0) { filterOutValidation = false; }
            if (this._isDisposed) {
                throw new Error('TextModelWithDecorations.getLinesDecorations: Model is disposed');
            }
            var lineCount = this.getLineCount();
            startLineNumber = Math.min(lineCount, Math.max(1, startLineNumber));
            endLineNumber = Math.min(lineCount, Math.max(1, endLineNumber));
            return this._getDecorationsInRange(startLineNumber, 1, endLineNumber, Number.MAX_VALUE, ownerId, filterOutValidation);
        };
        TextModelWithDecorations.prototype.getDecorationsInRange = function (range, ownerId, filterOutValidation) {
            if (this._isDisposed) {
                throw new Error('TextModelWithDecorations.getDecorationsInRange: Model is disposed');
            }
            var validatedRange = this.validateRange(range);
            return this._getDecorationsInRange(validatedRange.startLineNumber, validatedRange.startColumn, validatedRange.endLineNumber, validatedRange.endColumn, ownerId, filterOutValidation);
        };
        TextModelWithDecorations.prototype.getAllDecorations = function (ownerId, filterOutValidation) {
            if (ownerId === void 0) { ownerId = 0; }
            if (filterOutValidation === void 0) { filterOutValidation = false; }
            if (this._isDisposed) {
                throw new Error('TextModelWithDecorations.getAllDecorations: Model is disposed');
            }
            var result = [];
            var decorationId;
            var decoration;
            for (decorationId in this.decorations) {
                if (this.decorations.hasOwnProperty(decorationId)) {
                    decoration = this.decorations[decorationId];
                    if (ownerId && decoration.ownerId && decoration.ownerId !== ownerId) {
                        continue;
                    }
                    if (filterOutValidation) {
                        if (decoration.options.className === EditorCommon.ClassName.EditorErrorDecoration || decoration.options.className === EditorCommon.ClassName.EditorWarningDecoration) {
                            continue;
                        }
                    }
                    result.push({
                        id: decoration.id,
                        ownerId: decoration.ownerId,
                        range: this.getTrackedRange(decoration.rangeId),
                        options: decoration.options
                    });
                }
            }
            return result;
        };
        TextModelWithDecorations.prototype._withDeferredEvents = function (callback) {
            var _this = this;
            return this.deferredEmit(function () {
                var createDeferredEvents = _this._currentDeferredEvents ? false : true;
                if (createDeferredEvents) {
                    _this._currentDeferredEvents = new DeferredEventsBuilder();
                }
                try {
                    var result = callback(_this._currentDeferredEvents);
                    if (createDeferredEvents) {
                        _this._handleCollectedEvents(_this._currentDeferredEvents);
                    }
                }
                finally {
                    if (createDeferredEvents) {
                        _this._currentDeferredEvents = null;
                    }
                }
                return result;
            });
        };
        TextModelWithDecorations.prototype._handleCollectedEvents = function (b) {
            // Normalize changed markers into an array
            var changedMarkers = this._getMarkersInMap(b.changedMarkers);
            // Collect changed tracked ranges
            var changedRanges = this._onChangedMarkers(changedMarkers);
            // Collect decoration change events with the deferred event builder
            this._onChangedRanges(b, changedRanges);
            // Emit a single decorations changed event
            this._handleCollectedDecorationsEvents(b);
            // Reset markers for next round of events
            for (var i = 0, len = changedMarkers.length; i < len; i++) {
                changedMarkers[i].oldLineNumber = 0;
                changedMarkers[i].oldColumn = 0;
            }
        };
        TextModelWithDecorations.prototype._onChangedRanges = function (eventBuilder, changedRanges) {
            var rangeId;
            var decorationId;
            for (rangeId in changedRanges) {
                if (changedRanges.hasOwnProperty(rangeId) && this.rangeIdToDecorationId.hasOwnProperty(rangeId)) {
                    decorationId = this.rangeIdToDecorationId[rangeId];
                    eventBuilder.addMovedDecoration(decorationId, changedRanges[rangeId]);
                }
            }
        };
        TextModelWithDecorations.prototype._handleCollectedDecorationsEvents = function (b) {
            var decorationId, addedOrChangedDecorations = [], removedDecorations = [], decorationIds = [], decorationData, oldRange;
            for (decorationId in b.newOrChangedDecorations) {
                if (b.newOrChangedDecorations.hasOwnProperty(decorationId)) {
                    decorationIds.push(decorationId);
                    decorationData = this._getDecorationData(decorationId);
                    decorationData.isForValidation = (decorationData.options.className === EditorCommon.ClassName.EditorErrorDecoration || decorationData.options.className === EditorCommon.ClassName.EditorWarningDecoration);
                    addedOrChangedDecorations.push(decorationData);
                    if (b.oldDecorationRange.hasOwnProperty(decorationId)) {
                        oldRange = b.oldDecorationRange[decorationId];
                        oldRange.startLineNumber = oldRange.startLineNumber || decorationData.range.startLineNumber;
                        oldRange.startColumn = oldRange.startColumn || decorationData.range.startColumn;
                        oldRange.endLineNumber = oldRange.endLineNumber || decorationData.range.endLineNumber;
                        oldRange.endColumn = oldRange.endColumn || decorationData.range.endColumn;
                    }
                }
            }
            for (decorationId in b.removedDecorations) {
                if (b.removedDecorations.hasOwnProperty(decorationId)) {
                    decorationIds.push(decorationId);
                    removedDecorations.push(decorationId);
                }
            }
            if (decorationIds.length > 0) {
                var e = {
                    ids: decorationIds,
                    addedOrChangedDecorations: addedOrChangedDecorations,
                    removedDecorations: removedDecorations,
                    oldOptions: b.oldDecorationOptions,
                    oldRanges: b.oldDecorationRange
                };
                this.emitModelDecorationsChangedEvent(e);
            }
        };
        TextModelWithDecorations.prototype._getDecorationData = function (decorationId) {
            var decoration = this.decorations[decorationId];
            return {
                id: decoration.id,
                ownerId: decoration.ownerId,
                range: this.getTrackedRange(decoration.rangeId),
                isForValidation: false,
                options: decoration.options
            };
        };
        TextModelWithDecorations.prototype.emitModelDecorationsChangedEvent = function (e) {
            if (!this._isDisposing) {
                this.emit(EditorCommon.EventType.ModelDecorationsChanged, e);
            }
        };
        TextModelWithDecorations.prototype._normalizeDeltaDecorations = function (deltaDecorations) {
            var result = [];
            for (var i = 0, len = deltaDecorations.length; i < len; i++) {
                var deltaDecoration = deltaDecorations[i];
                result.push(new ModelDeltaDecoration(i, this.validateRange(deltaDecoration.range), _normalizeOptions(deltaDecoration.options)));
            }
            return result;
        };
        TextModelWithDecorations.prototype._addDecorationImpl = function (eventBuilder, ownerId, range, options) {
            var rangeId = this.addTrackedRange(range, options.stickiness);
            var decoration = new ModelInternalDecoration(this._decorationIdGenerator.generate(), ownerId, rangeId, options);
            this.decorations[decoration.id] = decoration;
            this.rangeIdToDecorationId[rangeId] = decoration.id;
            eventBuilder.addNewDecoration(decoration.id);
            return decoration.id;
        };
        TextModelWithDecorations.prototype._addDecorationsImpl = function (eventBuilder, ownerId, newDecorations) {
            var rangeIds = this._addTrackedRanges(newDecorations.map(function (d) { return d.range; }), newDecorations.map(function (d) { return d.options.stickiness; }));
            var result = [];
            for (var i = 0, len = newDecorations.length; i < len; i++) {
                var rangeId = rangeIds[i];
                var decoration = new ModelInternalDecoration(this._decorationIdGenerator.generate(), ownerId, rangeId, newDecorations[i].options);
                this.decorations[decoration.id] = decoration;
                this.rangeIdToDecorationId[rangeId] = decoration.id;
                eventBuilder.addNewDecoration(decoration.id);
                result.push(decoration.id);
            }
            return result;
        };
        TextModelWithDecorations.prototype._changeDecorationImpl = function (eventBuilder, id, newRange) {
            if (this.decorations.hasOwnProperty(id)) {
                var decoration = this.decorations[id];
                var oldRange = this.getTrackedRange(decoration.rangeId);
                this.changeTrackedRange(decoration.rangeId, newRange);
                eventBuilder.addMovedDecoration(id, oldRange);
            }
        };
        TextModelWithDecorations.prototype._changeDecorationOptionsImpl = function (eventBuilder, id, options) {
            if (this.decorations.hasOwnProperty(id)) {
                var decoration = this.decorations[id];
                var oldOptions = decoration.options;
                if (oldOptions.stickiness !== options.stickiness) {
                    this.changeTrackedRangeStickiness(decoration.rangeId, options.stickiness);
                }
                decoration.options = options;
                eventBuilder.addUpdatedDecoration(id, oldOptions);
            }
        };
        TextModelWithDecorations.prototype._removeDecorationImpl = function (eventBuilder, id) {
            if (this.decorations.hasOwnProperty(id)) {
                var decoration = this.decorations[id];
                var oldRange = null;
                if (eventBuilder) {
                    oldRange = this.getTrackedRange(decoration.rangeId);
                }
                this.removeTrackedRange(decoration.rangeId);
                delete this.rangeIdToDecorationId[decoration.rangeId];
                delete this.decorations[id];
                if (eventBuilder) {
                    eventBuilder.addRemovedDecoration(id, decoration.ownerId, oldRange, decoration.options);
                }
            }
        };
        TextModelWithDecorations.prototype._removeDecorationsImpl = function (eventBuilder, ids) {
            var removeTrackedRanges = [];
            for (var i = 0, len = ids.length; i < len; i++) {
                var id = ids[i];
                if (!this.decorations.hasOwnProperty(id)) {
                    continue;
                }
                var decoration = this.decorations[id];
                if (eventBuilder) {
                    var oldRange = this.getTrackedRange(decoration.rangeId);
                    eventBuilder.addRemovedDecoration(id, decoration.ownerId, oldRange, decoration.options);
                }
                removeTrackedRanges.push(decoration.rangeId);
                delete this.rangeIdToDecorationId[decoration.rangeId];
                delete this.decorations[id];
            }
            if (removeTrackedRanges.length > 0) {
                this.removeTrackedRanges(removeTrackedRanges);
            }
        };
        TextModelWithDecorations.prototype._resolveOldDecorations = function (oldDecorations) {
            var result = [];
            for (var i = 0, len = oldDecorations.length; i < len; i++) {
                var id = oldDecorations[i];
                if (!this.decorations.hasOwnProperty(id)) {
                    continue;
                }
                var decoration = this.decorations[id];
                result.push({
                    id: id,
                    range: this.getTrackedRange(decoration.rangeId),
                    options: decoration.options
                });
            }
            return result;
        };
        TextModelWithDecorations.prototype._deltaDecorationsImpl = function (eventBuilder, ownerId, oldDecorationsIds, newDecorations) {
            if (oldDecorationsIds.length === 0) {
                // Nothing to remove
                return this._addDecorationsImpl(eventBuilder, ownerId, newDecorations);
            }
            if (newDecorations.length === 0) {
                // Nothing to add
                this._removeDecorationsImpl(eventBuilder, oldDecorationsIds);
                return [];
            }
            var oldDecorations = this._resolveOldDecorations(oldDecorationsIds);
            oldDecorations.sort(function (a, b) { return range_1.Range.compareRangesUsingStarts(a.range, b.range); });
            newDecorations.sort(function (a, b) { return range_1.Range.compareRangesUsingStarts(a.range, b.range); });
            var result = [], oldDecorationsIndex = 0, oldDecorationsLength = oldDecorations.length, newDecorationsIndex = 0, newDecorationsLength = newDecorations.length, decorationsToAdd = [], decorationsToRemove = [];
            while (oldDecorationsIndex < oldDecorationsLength && newDecorationsIndex < newDecorationsLength) {
                var oldDecoration = oldDecorations[oldDecorationsIndex];
                var newDecoration = newDecorations[newDecorationsIndex];
                var comparison = range_1.Range.compareRangesUsingStarts(oldDecoration.range, newDecoration.range);
                if (comparison < 0) {
                    // `oldDecoration` is before `newDecoration` => remove `oldDecoration`
                    decorationsToRemove.push(oldDecoration.id);
                    oldDecorationsIndex++;
                    continue;
                }
                if (comparison > 0) {
                    // `newDecoration` is before `oldDecoration` => add `newDecoration`
                    decorationsToAdd.push(newDecoration);
                    newDecorationsIndex++;
                    continue;
                }
                // The ranges of `oldDecoration` and `newDecoration` are equal
                if (!oldDecoration.options.equals(newDecoration.options)) {
                    // The options do not match => remove `oldDecoration`
                    decorationsToRemove.push(oldDecoration.id);
                    oldDecorationsIndex++;
                    continue;
                }
                // Bingo! We can reuse `oldDecoration` for `newDecoration`
                result[newDecoration.index] = oldDecoration.id;
                oldDecorationsIndex++;
                newDecorationsIndex++;
            }
            while (oldDecorationsIndex < oldDecorationsLength) {
                // No more new decorations => remove decoration at `oldDecorationsIndex`
                decorationsToRemove.push(oldDecorations[oldDecorationsIndex].id);
                oldDecorationsIndex++;
            }
            while (newDecorationsIndex < newDecorationsLength) {
                // No more old decorations => add decoration at `newDecorationsIndex`
                decorationsToAdd.push(newDecorations[newDecorationsIndex]);
                newDecorationsIndex++;
            }
            // Remove `decorationsToRemove`
            if (decorationsToRemove.length > 0) {
                this._removeDecorationsImpl(eventBuilder, decorationsToRemove);
            }
            // Add `decorationsToAdd`
            if (decorationsToAdd.length > 0) {
                var newIds = this._addDecorationsImpl(eventBuilder, ownerId, decorationsToAdd);
                for (var i = 0, len = decorationsToAdd.length; i < len; i++) {
                    result[decorationsToAdd[i].index] = newIds[i];
                }
            }
            return result;
        };
        return TextModelWithDecorations;
    })(textModelWithTrackedRanges_1.TextModelWithTrackedRanges);
    exports.TextModelWithDecorations = TextModelWithDecorations;
    function cleanClassName(className) {
        return className.replace(/[^a-z0-9\-]/gi, ' ');
    }
    var ModelInternalDecoration = (function () {
        function ModelInternalDecoration(id, ownerId, rangeId, options) {
            this.id = id;
            this.ownerId = ownerId;
            this.rangeId = rangeId;
            this.options = options;
        }
        return ModelInternalDecoration;
    })();
    var ModelDecorationOptions = (function () {
        function ModelDecorationOptions(options) {
            this.stickiness = options.stickiness || EditorCommon.TrackedRangeStickiness.AlwaysGrowsWhenTypingAtEdges;
            this.className = cleanClassName(options.className || Strings.empty);
            this.hoverMessage = options.hoverMessage || Strings.empty;
            this.htmlMessage = options.htmlMessage || [];
            this.isWholeLine = options.isWholeLine || false;
            this.overviewRuler = _normalizeOverviewRulerOptions(options.overviewRuler, options.showInOverviewRuler);
            this.glyphMarginClassName = cleanClassName(options.glyphMarginClassName || Strings.empty);
            this.linesDecorationsClassName = cleanClassName(options.linesDecorationsClassName || Strings.empty);
            this.inlineClassName = cleanClassName(options.inlineClassName || Strings.empty);
        }
        ModelDecorationOptions._htmlContentEquals = function (a, b) {
            return (a.formattedText === b.formattedText
                && a.text === b.text
                && a.className === b.className
                && a.style === b.style
                && a.customStyle === b.customStyle
                && a.tagName === b.tagName
                && a.isText === b.isText
                && ModelDecorationOptions._htmlContentArrEquals(a.children, b.children));
        };
        ModelDecorationOptions._htmlContentArrEquals = function (a, b) {
            if (!a) {
                return (!b);
            }
            if (!b) {
                return false;
            }
            var aLen = a.length, bLen = b.length;
            if (aLen !== bLen) {
                return false;
            }
            for (var i = 0; i < aLen; i++) {
                if (!ModelDecorationOptions._htmlContentEquals(a[i], b[i])) {
                    return false;
                }
            }
            return true;
        };
        ModelDecorationOptions._overviewRulerEquals = function (a, b) {
            return (a.color === b.color
                && a.position === b.position
                && a.darkColor === b.darkColor);
        };
        ModelDecorationOptions.prototype.equals = function (other) {
            return (this.stickiness === other.stickiness
                && this.className === other.className
                && this.hoverMessage === other.hoverMessage
                && this.isWholeLine === other.isWholeLine
                && this.showInOverviewRuler === other.showInOverviewRuler
                && this.glyphMarginClassName === other.glyphMarginClassName
                && this.linesDecorationsClassName === other.linesDecorationsClassName
                && this.inlineClassName === other.inlineClassName
                && ModelDecorationOptions._htmlContentArrEquals(this.htmlMessage, other.htmlMessage)
                && ModelDecorationOptions._overviewRulerEquals(this.overviewRuler, other.overviewRuler));
        };
        return ModelDecorationOptions;
    })();
    var ModelDeltaDecoration = (function () {
        function ModelDeltaDecoration(index, range, options) {
            this.index = index;
            this.range = range;
            this.options = options;
        }
        return ModelDeltaDecoration;
    })();
    function _normalizeOptions(options) {
        return new ModelDecorationOptions(options);
    }
    var ModelDecorationOverviewRulerOptions = (function () {
        function ModelDecorationOverviewRulerOptions(options, legacyShowInOverviewRuler) {
            this.color = Strings.empty;
            this.darkColor = Strings.empty;
            this.position = EditorCommon.OverviewRulerLane.Center;
            if (legacyShowInOverviewRuler) {
                this.color = legacyShowInOverviewRuler;
            }
            if (options && options.color) {
                this.color = options.color;
            }
            if (options && options.darkColor) {
                this.darkColor = options.darkColor;
            }
            if (options && options.hasOwnProperty('position')) {
                this.position = options.position;
            }
        }
        return ModelDecorationOverviewRulerOptions;
    })();
    function _normalizeOverviewRulerOptions(options, legacyShowInOverviewRuler) {
        if (legacyShowInOverviewRuler === void 0) { legacyShowInOverviewRuler = null; }
        return new ModelDecorationOverviewRulerOptions(options, legacyShowInOverviewRuler);
    }
});
//# sourceMappingURL=textModelWithDecorations.js.map