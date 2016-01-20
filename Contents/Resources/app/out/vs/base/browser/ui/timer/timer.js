/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
'use strict';
define(["require", "exports", 'vs/base/common/timer', 'vs/base/browser/dom', 'vs/css!./timer'], function (require, exports, Timer, DomUtils) {
    var TimeKeeperRenderer = (function () {
        function TimeKeeperRenderer(onHide) {
            var _this = this;
            this.timeKeeper = Timer.getTimeKeeper();
            this.onHide = onHide;
            this.lastEventIndex = 0;
            this.renderedEvents = {};
            this.renderCnt = 0;
            this.listenersToRemove = [];
            this.domNode = this._createDomNode();
            this.intervalTokenId = window.setInterval(function () { return _this._render(); }, 500);
        }
        TimeKeeperRenderer.prototype.destroy = function () {
            document.body.removeChild(this.outerDomNode);
            window.clearInterval(this.intervalTokenId);
            this.listenersToRemove.forEach(function (element) {
                element();
            });
            this.listenersToRemove = [];
        };
        TimeKeeperRenderer.prototype._createDomNode = function () {
            var _this = this;
            this.outerDomNode = document.createElement('div');
            this.outerDomNode.className = 'benchmarktimerbox';
            // Clear
            var cancel = document.createElement('input');
            cancel.type = 'button';
            cancel.value = 'Clear';
            this.listenersToRemove.push(DomUtils.addListener(cancel, 'click', function () { return _this._onClear(); }));
            this.outerDomNode.appendChild(cancel);
            // Text filter
            this.textFilterDomNode = document.createElement('input');
            this.textFilterDomNode.type = 'text';
            this.textFilterDomNode.className = 'textFilter';
            this.listenersToRemove.push(DomUtils.addListener(this.textFilterDomNode, 'keydown', function () { return _this.onTextFilterChange(); }));
            this.textFilter = '';
            this.outerDomNode.appendChild(document.createTextNode('Filter'));
            this.outerDomNode.appendChild(this.textFilterDomNode);
            // Time filter
            this.timeFilterDomNode = document.createElement('input');
            this.timeFilterDomNode.type = 'text';
            this.timeFilterDomNode.value = '0';
            this.timeFilterDomNode.className = 'timeFilter';
            this.listenersToRemove.push(DomUtils.addListener(this.timeFilterDomNode, 'keydown', function () { return _this.onTimeFilterChange(); }));
            this.timeFilter = 0;
            this.outerDomNode.appendChild(document.createTextNode('Hide time under'));
            this.outerDomNode.appendChild(this.timeFilterDomNode);
            var hide = document.createElement('input');
            hide.type = 'button';
            hide.value = 'Close';
            this.listenersToRemove.push(DomUtils.addListener(hide, 'click', function () {
                _this.onHide();
            }));
            this.outerDomNode.appendChild(hide);
            var heading = document.createElement('pre');
            heading.appendChild(document.createTextNode(this.renderRow('TOPIC', 'NAME', 'TOOK', 'START', 'END')));
            this.outerDomNode.appendChild(heading);
            this.outerDomNode.appendChild(document.createElement('hr'));
            var domNode = document.createElement('div');
            domNode.className = 'inner';
            this.outerDomNode.appendChild(domNode);
            document.body.appendChild(this.outerDomNode);
            return domNode;
        };
        TimeKeeperRenderer.prototype.onTextFilterChange = function () {
            var _this = this;
            setTimeout(function () {
                _this.refilter();
            });
        };
        TimeKeeperRenderer.prototype.onTimeFilterChange = function () {
            var _this = this;
            setTimeout(function () {
                _this.refilter();
            });
        };
        TimeKeeperRenderer.prototype.matchesTextFilter = function (event) {
            if (!this.textFilter) {
                return true;
            }
            if (event.topic.toLowerCase().indexOf(this.textFilter.toLowerCase()) >= 0) {
                return true;
            }
            if (event.name.toLowerCase().indexOf(this.textFilter.toLowerCase()) >= 0) {
                return true;
            }
            return false;
        };
        TimeKeeperRenderer.prototype.matchesTimeFilter = function (event) {
            if (!this.timeFilter) {
                return true;
            }
            if (event.timeTaken() >= this.timeFilter) {
                return true;
            }
            return false;
        };
        TimeKeeperRenderer.prototype.shouldShow = function (event) {
            return this.matchesTextFilter(event) && this.matchesTimeFilter(event);
        };
        TimeKeeperRenderer.prototype.refilter = function () {
            this.textFilter = this.textFilterDomNode.value;
            this.timeFilter = parseInt(this.timeFilterDomNode.value, 10);
            var domNodes = Array.prototype.slice.call(this.domNode.children, 0);
            for (var i = 0; i < domNodes.length; i++) {
                var eventId = domNodes[i].getAttribute('data-event-id');
                var event = this.renderedEvents[eventId];
                if (this.shouldShow(event)) {
                    domNodes[i].style.display = 'inherit';
                }
                else {
                    domNodes[i].style.display = 'none';
                }
            }
        };
        TimeKeeperRenderer.prototype._onClear = function () {
            this.lastEventIndex = this.timeKeeper.getCollectedEvents().length;
            this.renderedEvents = {};
            this.renderCnt = 0;
            DomUtils.clearNode(this.domNode);
        };
        TimeKeeperRenderer.prototype.leftPaddedString = function (size, padChar, str) {
            var spaces = this._repeatStr(padChar, Math.max(0, size - str.length));
            return spaces + str;
        };
        TimeKeeperRenderer.prototype.rightPaddedString = function (size, padChar, str) {
            var spaces = this._repeatStr(padChar, Math.max(0, size - str.length));
            return str + spaces;
        };
        TimeKeeperRenderer.prototype.renderRow = function (topic, name, timeTook, timeStart, timerEnd) {
            var result = ' ';
            result += this.rightPaddedString(10, ' ', topic);
            result += this.rightPaddedString(30, ' ', name);
            result += ' ' + this.leftPaddedString(15, ' ', timeTook);
            result += ' ' + this.leftPaddedString(13, ' ', timeStart);
            return result;
        };
        TimeKeeperRenderer.prototype._suffix0 = function (s) {
            if (s.charAt(s.length - 3) === '.') {
                return s;
            }
            if (s.charAt(s.length - 2) === '.') {
                return s + '0';
            }
            return s + '.00';
        };
        TimeKeeperRenderer.prototype._twoPrecision = function (a) {
            return this._suffix0(Math.round(a * 100) / 100 + '');
        };
        TimeKeeperRenderer.prototype._absoluteTime = function (t) {
            if (t < 1000) {
                return this._twoPrecision(t) + ' ms';
            }
            t /= 1000;
            if (t < 60) {
                return this._twoPrecision(t) + ' s';
            }
            t /= 60;
            if (t < 60) {
                return this._twoPrecision(t) + ' m';
            }
            t /= 60;
            return this._twoPrecision(t) + ' h';
        };
        TimeKeeperRenderer.prototype._renderEvent = function (domNode, event) {
            var start = event.startTime.getTime() - Timer.TimeKeeper.PARSE_TIME.getTime();
            var result = this.renderRow(event.topic, event.name, this._twoPrecision(event.timeTaken()), this._absoluteTime(start) + '', this._absoluteTime(start + event.timeTaken()));
            domNode.textContent = '';
            domNode.appendChild(document.createTextNode(result));
        };
        TimeKeeperRenderer.prototype._renderStartTimerEvent = function (event) {
            var domNode = document.createElement('pre');
            this._renderEvent(domNode, event);
            this.domNode.appendChild(domNode);
            var idString = event.id.toString();
            domNode.setAttribute('data-event-id', idString);
            domNode.className = 'timer-event-' + (event.id % 2);
            this.renderedEvents[idString] = event;
            if (this.shouldShow(this.renderedEvents[idString])) {
                domNode.style.display = 'inherit';
            }
            else {
                domNode.style.display = 'none';
            }
            this.renderCnt++;
        };
        TimeKeeperRenderer.prototype._render = function () {
            var allEvents = this.timeKeeper.getCollectedEvents(), didSomething = false;
            ;
            for (var i = this.lastEventIndex; i < allEvents.length; i++) {
                var ev = allEvents[i];
                if (!ev.stopTime) {
                    // This event is not yet finished => block
                    this.lastEventIndex = i;
                    if (didSomething) {
                        this.domNode.scrollTop = 100000;
                    }
                    return;
                }
                this._renderStartTimerEvent(ev);
                didSomething = true;
            }
            if (didSomething) {
                this.domNode.scrollTop = 100000;
            }
            this.lastEventIndex = allEvents.length;
        };
        TimeKeeperRenderer.prototype._repeatStr = function (str, cnt) {
            var r = '';
            for (var i = 0; i < cnt; i++) {
                r += str;
            }
            return r;
        };
        return TimeKeeperRenderer;
    })();
    exports.TimeKeeperRenderer = TimeKeeperRenderer;
});
//# sourceMappingURL=timer.js.map