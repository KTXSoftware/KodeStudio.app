/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
'use strict';
define(["require", "exports", 'vs/editor/common/editorCommon'], function (require, exports, EditorCommon) {
    var FindDecorations = (function () {
        function FindDecorations(editor) {
            this._editor = editor;
            this._decorations = [];
            this._findScopeDecorationId = null;
            this._highlightedDecorationId = null;
            this._startPosition = this._editor.getPosition();
        }
        FindDecorations.prototype.dispose = function () {
            this._editor.deltaDecorations(this._allDecorations(), []);
            this._editor = null;
            this._decorations = [];
            this._findScopeDecorationId = null;
            this._highlightedDecorationId = null;
            this._startPosition = null;
        };
        FindDecorations.prototype.reset = function () {
            this._decorations = [];
            this._findScopeDecorationId = null;
            this._highlightedDecorationId = null;
        };
        FindDecorations.prototype.getFindScope = function () {
            if (this._findScopeDecorationId) {
                return this._editor.getModel().getDecorationRange(this._findScopeDecorationId);
            }
            return null;
        };
        FindDecorations.prototype.getStartPosition = function () {
            return this._startPosition;
        };
        FindDecorations.prototype.setStartPosition = function (newStartPosition) {
            this._startPosition = newStartPosition;
            this.setCurrentFindMatch(null);
        };
        FindDecorations.prototype.setCurrentFindMatch = function (nextMatch) {
            var _this = this;
            var newCurrentDecorationId = null;
            if (nextMatch) {
                for (var i = 0, len = this._decorations.length; i < len; i++) {
                    var range = this._editor.getModel().getDecorationRange(this._decorations[i]);
                    if (nextMatch.equalsRange(range)) {
                        newCurrentDecorationId = this._decorations[i];
                        break;
                    }
                }
            }
            if (this._highlightedDecorationId !== null || newCurrentDecorationId !== null) {
                this._editor.changeDecorations(function (changeAccessor) {
                    if (_this._highlightedDecorationId !== null) {
                        changeAccessor.changeDecorationOptions(_this._highlightedDecorationId, FindDecorations.createFindMatchDecorationOptions(false));
                        _this._highlightedDecorationId = null;
                    }
                    if (newCurrentDecorationId !== null) {
                        _this._highlightedDecorationId = newCurrentDecorationId;
                        changeAccessor.changeDecorationOptions(_this._highlightedDecorationId, FindDecorations.createFindMatchDecorationOptions(true));
                    }
                });
            }
        };
        FindDecorations.prototype.set = function (matches, findScope) {
            var newDecorations = matches.map(function (match) {
                return {
                    range: match,
                    options: FindDecorations.createFindMatchDecorationOptions(false)
                };
            });
            if (findScope) {
                newDecorations.unshift({
                    range: findScope,
                    options: FindDecorations.createFindScopeDecorationOptions()
                });
            }
            var tmpDecorations = this._editor.deltaDecorations(this._allDecorations(), newDecorations);
            if (findScope) {
                this._findScopeDecorationId = tmpDecorations.shift();
            }
            else {
                this._findScopeDecorationId = null;
            }
            this._decorations = tmpDecorations;
            this._highlightedDecorationId = null;
        };
        FindDecorations.prototype._allDecorations = function () {
            var result = [];
            result = result.concat(this._decorations);
            if (this._findScopeDecorationId) {
                result.push(this._findScopeDecorationId);
            }
            return result;
        };
        FindDecorations.createFindMatchDecorationOptions = function (isCurrent) {
            return {
                stickiness: EditorCommon.TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges,
                className: isCurrent ? 'currentFindMatch' : 'findMatch',
                overviewRuler: {
                    color: 'rgba(246, 185, 77, 0.7)',
                    darkColor: 'rgba(246, 185, 77, 0.7)',
                    position: EditorCommon.OverviewRulerLane.Center
                }
            };
        };
        FindDecorations.createFindScopeDecorationOptions = function () {
            return {
                className: 'findScope',
                isWholeLine: true
            };
        };
        return FindDecorations;
    })();
    exports.FindDecorations = FindDecorations;
});
//# sourceMappingURL=findDecorations.js.map