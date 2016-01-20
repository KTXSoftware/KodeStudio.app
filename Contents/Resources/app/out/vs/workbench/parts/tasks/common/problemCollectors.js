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
define(["require", "exports", 'vs/base/common/eventEmitter', 'vs/platform/markers/common/problemMatcher'], function (require, exports, eventEmitter_1, problemMatcher_1) {
    var ProblemCollectorEvents;
    (function (ProblemCollectorEvents) {
        ProblemCollectorEvents.WatchingBeginDetected = 'watchingBeginDetected';
        ProblemCollectorEvents.WatchingEndDetected = 'watchingEndDetected';
    })(ProblemCollectorEvents = exports.ProblemCollectorEvents || (exports.ProblemCollectorEvents = {}));
    var AbstractProblemCollector = (function (_super) {
        __extends(AbstractProblemCollector, _super);
        function AbstractProblemCollector(problemMatchers, modelService) {
            var _this = this;
            _super.call(this);
            this.modelService = modelService;
            this.matchers = Object.create(null);
            this.bufferLength = 1;
            problemMatchers.map(function (elem) { return problemMatcher_1.createLineMatcher(elem); }).forEach(function (matcher) {
                var length = matcher.matchLength;
                if (length > _this.bufferLength) {
                    _this.bufferLength = length;
                }
                var value = _this.matchers[length];
                if (!value) {
                    value = [];
                    _this.matchers[length] = value;
                }
                value.push(matcher);
            });
            this.buffer = [];
            this.activeMatcher = null;
            this.openModels = Object.create(null);
            this.modelListeners = [];
            this.modelService.onModelAdded(function (model) {
                _this.openModels[model.getAssociatedResource().toString()] = true;
            }, this, this.modelListeners);
            this.modelService.onModelRemoved(function (model) {
                delete _this.openModels[model.getAssociatedResource().toString()];
            }, this, this.modelListeners);
            this.modelService.getModels().forEach(function (model) { return _this.openModels[model.getAssociatedResource().toString()] = true; });
        }
        AbstractProblemCollector.prototype.dispose = function () {
            this.modelListeners.forEach(function (disposable) { return disposable.dispose(); });
        };
        Object.defineProperty(AbstractProblemCollector.prototype, "numberOfMatches", {
            get: function () {
                return this._numberOfMatches;
            },
            enumerable: true,
            configurable: true
        });
        AbstractProblemCollector.prototype.tryFindMarker = function (line) {
            var result = null;
            if (this.activeMatcher) {
                result = this.activeMatcher.next(line);
                if (result) {
                    this._numberOfMatches++;
                    return result;
                }
                this.clearBuffer();
                this.activeMatcher = null;
            }
            if (this.buffer.length < this.bufferLength) {
                this.buffer.push(line);
            }
            else {
                var end = this.buffer.length - 1;
                for (var i = 0; i < end; i++) {
                    this.buffer[i] = this.buffer[i + 1];
                }
                this.buffer[end] = line;
            }
            result = this.tryMatchers();
            if (result) {
                this.clearBuffer();
            }
            return result;
        };
        AbstractProblemCollector.prototype.isOpen = function (resource) {
            return !!this.openModels[resource.toString()];
        };
        AbstractProblemCollector.prototype.shouldApplyMatch = function (result) {
            switch (result.description.applyTo) {
                case problemMatcher_1.ApplyToKind.allDocuments:
                    return true;
                case problemMatcher_1.ApplyToKind.openDocuments:
                    return this.openModels[result.resource.toString()];
                case problemMatcher_1.ApplyToKind.closedDocuments:
                    return !this.openModels[result.resource.toString()];
                default:
                    return true;
            }
        };
        AbstractProblemCollector.prototype.tryMatchers = function () {
            this.activeMatcher = null;
            var length = this.buffer.length;
            for (var startIndex = 0; startIndex < length; startIndex++) {
                var candidates = this.matchers[length - startIndex];
                if (!candidates) {
                    continue;
                }
                for (var i = 0; i < candidates.length; i++) {
                    var matcher = candidates[i];
                    var result = matcher.handle(this.buffer, startIndex);
                    if (result.match) {
                        this._numberOfMatches++;
                        if (result.continue) {
                            this.activeMatcher = matcher;
                        }
                        return result.match;
                    }
                }
            }
            return null;
        };
        AbstractProblemCollector.prototype.clearBuffer = function () {
            if (this.buffer.length > 0) {
                this.buffer = [];
            }
        };
        return AbstractProblemCollector;
    })(eventEmitter_1.EventEmitter);
    exports.AbstractProblemCollector = AbstractProblemCollector;
    (function (ProblemHandlingStrategy) {
        ProblemHandlingStrategy[ProblemHandlingStrategy["Clean"] = 0] = "Clean";
    })(exports.ProblemHandlingStrategy || (exports.ProblemHandlingStrategy = {}));
    var ProblemHandlingStrategy = exports.ProblemHandlingStrategy;
    var StartStopProblemCollector = (function (_super) {
        __extends(StartStopProblemCollector, _super);
        function StartStopProblemCollector(problemMatchers, markerService, modelService, strategy) {
            var _this = this;
            if (strategy === void 0) { strategy = ProblemHandlingStrategy.Clean; }
            _super.call(this, problemMatchers, modelService);
            // Current State
            this.currentResource = null;
            this.currentResourceAsString = null;
            this.markers = Object.create(null);
            var ownerSet = Object.create(null);
            problemMatchers.forEach(function (description) { return ownerSet[description.owner] = true; });
            this.owners = Object.keys(ownerSet);
            this.markerService = markerService;
            this.strategy = strategy;
            this.currentResourcesWithMarkers = Object.create(null);
            this.reportedResourcesWithMarkers = Object.create(null);
            this.owners.forEach(function (owner) {
                _this.currentResourcesWithMarkers[owner] = _this.markerService.read({ owner: owner }).map(function (m) { return m.resource; });
                _this.reportedResourcesWithMarkers[owner] = Object.create(null);
            });
            this.currentResource = null;
            this.currentResourceAsString = null;
            this.markers = Object.create(null);
        }
        StartStopProblemCollector.prototype.processLine = function (line) {
            var _this = this;
            var markerMatch = this.tryFindMarker(line);
            if (!markerMatch) {
                return;
            }
            var owner = markerMatch.description.owner;
            var resource = markerMatch.resource;
            var resourceAsString = resource.toString();
            var shouldApplyMatch = this.shouldApplyMatch(markerMatch);
            if (shouldApplyMatch) {
                if (this.currentResourceAsString !== resourceAsString) {
                    if (this.currentResource) {
                        Object.keys(this.markers).forEach(function (owner) {
                            _this.markerService.changeOne(owner, _this.currentResource, _this.markers[owner]);
                        });
                        this.markers = Object.create(null);
                    }
                    this.reportedResourcesWithMarkers[owner][resourceAsString] = resource;
                    this.currentResource = resource;
                    this.currentResourceAsString = resourceAsString;
                }
                var markerData = this.markers[owner];
                if (!markerData) {
                    markerData = [];
                    this.markers[owner] = markerData;
                }
                markerData.push(markerMatch.marker);
            }
            else {
                this.reportedResourcesWithMarkers[owner][resourceAsString] = resource;
            }
        };
        StartStopProblemCollector.prototype.done = function () {
            var _this = this;
            if (this.currentResource) {
                Object.keys(this.markers).forEach(function (owner) {
                    _this.markerService.changeOne(owner, _this.currentResource, _this.markers[owner]);
                });
            }
            if (this.strategy === ProblemHandlingStrategy.Clean) {
                Object.keys(this.currentResourcesWithMarkers).forEach(function (owner) {
                    var toRemove = [];
                    var withMarkers = _this.reportedResourcesWithMarkers[owner];
                    _this.currentResourcesWithMarkers[owner].forEach(function (resource) {
                        if (!withMarkers[resource.toString()]) {
                            toRemove.push(resource);
                        }
                    });
                    _this.markerService.remove(owner, toRemove);
                });
            }
            this.currentResource = null;
            this.currentResourceAsString = null;
            this.markers = Object.create(null);
        };
        return StartStopProblemCollector;
    })(AbstractProblemCollector);
    exports.StartStopProblemCollector = StartStopProblemCollector;
    var WatchingProblemCollector = (function (_super) {
        __extends(WatchingProblemCollector, _super);
        function WatchingProblemCollector(problemMatchers, markerService, modelService) {
            var _this = this;
            _super.call(this, problemMatchers, modelService);
            this.problemMatchers = problemMatchers;
            this.markerService = markerService;
            this.resetCurrentResource();
            this.resourcesToClean = Object.create(null);
            this.ignoreOpenResourcesByOwner = Object.create(null);
            this.watchingBeginsPatterns = [];
            this.watchingEndsPatterns = [];
            this.problemMatchers.forEach(function (matcher) {
                if (matcher.watching) {
                    _this.watchingBeginsPatterns.push({ problemMatcher: matcher, pattern: matcher.watching.beginsPattern });
                    _this.watchingEndsPatterns.push({ problemMatcher: matcher, pattern: matcher.watching.endsPattern });
                }
            });
        }
        WatchingProblemCollector.prototype.aboutToStart = function () {
            var _this = this;
            this.problemMatchers.forEach(function (matcher) {
                if (matcher.watching && matcher.watching.activeOnStart) {
                    _this.emit(ProblemCollectorEvents.WatchingBeginDetected, {});
                    _this.recordResourcesToClean(matcher.owner);
                }
                var value = _this.ignoreOpenResourcesByOwner[matcher.owner];
                if (!value) {
                    _this.ignoreOpenResourcesByOwner[matcher.owner] = (matcher.applyTo === problemMatcher_1.ApplyToKind.closedDocuments);
                }
                else {
                    var newValue = value && (matcher.applyTo === problemMatcher_1.ApplyToKind.closedDocuments);
                    if (newValue != value) {
                        _this.ignoreOpenResourcesByOwner[matcher.owner] = newValue;
                    }
                }
            });
        };
        WatchingProblemCollector.prototype.processLine = function (line) {
            if (this.tryBegin(line) || this.tryFinish(line)) {
                return;
            }
            var markerMatch = this.tryFindMarker(line);
            if (!markerMatch) {
                return;
            }
            var resource = markerMatch.resource;
            var owner = markerMatch.description.owner;
            var resourceAsString = resource.toString();
            var shouldApplyMatch = this.shouldApplyMatch(markerMatch);
            if (shouldApplyMatch) {
                if (this.currentResourceAsString !== resourceAsString) {
                    this.removeResourceToClean(owner, resourceAsString);
                    if (this.currentResource) {
                        this.deliverMarkersForCurrentResource();
                    }
                    this.currentResource = resource;
                    this.currentResourceAsString = resourceAsString;
                }
                var markerData = this.markers[owner];
                if (!markerData) {
                    markerData = [];
                    this.markers[owner] = markerData;
                }
                markerData.push(markerMatch.marker);
            }
            else {
                this.removeResourceToClean(owner, resourceAsString);
            }
        };
        WatchingProblemCollector.prototype.forceDelivery = function () {
            var _this = this;
            this.deliverMarkersForCurrentResource(false);
            Object.keys(this.resourcesToClean).forEach(function (owner) {
                _this.cleanMarkers(owner, false);
            });
            this.resourcesToClean = Object.create(null);
        };
        WatchingProblemCollector.prototype.tryBegin = function (line) {
            var result = false;
            for (var i = 0; i < this.watchingBeginsPatterns.length; i++) {
                var beginMatcher = this.watchingBeginsPatterns[i];
                var matches = beginMatcher.pattern.regexp.exec(line);
                if (matches) {
                    this.emit(ProblemCollectorEvents.WatchingBeginDetected, {});
                    result = true;
                    var owner = beginMatcher.problemMatcher.owner;
                    if (matches[1]) {
                        var resource = problemMatcher_1.getResource(matches[1], beginMatcher.problemMatcher);
                        if (this.currentResourceAsString && this.currentResourceAsString === resource.toString()) {
                            this.resetCurrentResource();
                        }
                        this.recordResourceToClean(owner, resource);
                    }
                    else {
                        this.recordResourcesToClean(owner);
                        this.resetCurrentResource();
                    }
                }
            }
            return result;
        };
        WatchingProblemCollector.prototype.tryFinish = function (line) {
            var result = false;
            for (var i = 0; i < this.watchingEndsPatterns.length; i++) {
                var endMatcher = this.watchingEndsPatterns[i];
                var matches = endMatcher.pattern.regexp.exec(line);
                if (matches) {
                    this.emit(ProblemCollectorEvents.WatchingEndDetected, {});
                    result = true;
                    var owner = endMatcher.problemMatcher.owner;
                    this.cleanMarkers(owner);
                    this.deliverMarkersForCurrentResource();
                }
            }
            return result;
        };
        WatchingProblemCollector.prototype.recordResourcesToClean = function (owner) {
            var resourceSetToClean = this.getResourceSetToClean(owner);
            this.markerService.read({ owner: owner }).forEach(function (marker) { return resourceSetToClean[marker.resource.toString()] = marker.resource; });
        };
        WatchingProblemCollector.prototype.recordResourceToClean = function (owner, resource) {
            this.getResourceSetToClean(owner)[resource.toString()] = resource;
        };
        WatchingProblemCollector.prototype.removeResourceToClean = function (owner, resource) {
            var resourceSet = this.resourcesToClean[owner];
            if (resourceSet) {
                delete resourceSet[resource];
            }
        };
        WatchingProblemCollector.prototype.cleanMarkers = function (owner, remove) {
            var _this = this;
            if (remove === void 0) { remove = true; }
            var resourceSet = this.resourcesToClean[owner];
            if (resourceSet) {
                var toClean = Object.keys(resourceSet).map(function (key) { return resourceSet[key]; }).filter(function (resource) {
                    // Check whether we need to ignore open documents for this owner.
                    return _this.ignoreOpenResourcesByOwner[owner] ? !_this.isOpen(resource) : true;
                });
                this.markerService.remove(owner, toClean);
                if (remove) {
                    delete this.resourcesToClean[owner];
                }
            }
        };
        WatchingProblemCollector.prototype.deliverMarkersForCurrentResource = function (resetCurrentResource) {
            var _this = this;
            if (resetCurrentResource === void 0) { resetCurrentResource = true; }
            if (this.currentResource) {
                Object.keys(this.markers).forEach(function (owner) {
                    _this.markerService.changeOne(owner, _this.currentResource, _this.markers[owner]);
                });
            }
            if (resetCurrentResource) {
                this.resetCurrentResource();
            }
        };
        WatchingProblemCollector.prototype.getResourceSetToClean = function (owner) {
            var result = this.resourcesToClean[owner];
            if (!result) {
                result = Object.create(null);
                this.resourcesToClean[owner] = result;
            }
            return result;
        };
        WatchingProblemCollector.prototype.resetCurrentResource = function () {
            this.currentResource = null;
            this.currentResourceAsString = null;
            this.markers = Object.create(null);
        };
        return WatchingProblemCollector;
    })(AbstractProblemCollector);
    exports.WatchingProblemCollector = WatchingProblemCollector;
});
//# sourceMappingURL=problemCollectors.js.map