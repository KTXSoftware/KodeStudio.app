/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
'use strict';
define(["require", "exports", 'vs/base/common/platform', 'vs/base/common/errors', 'vs/base/common/stopwatch'], function (require, exports, Platform, errors, precision) {
    exports.ENABLE_TIMER = false;
    var msWriteProfilerMark = Platform.globals['msWriteProfilerMark'];
    (function (Topic) {
        Topic[Topic["EDITOR"] = 0] = "EDITOR";
        Topic[Topic["LANGUAGES"] = 1] = "LANGUAGES";
        Topic[Topic["WORKER"] = 2] = "WORKER";
        Topic[Topic["WORKBENCH"] = 3] = "WORKBENCH";
        Topic[Topic["STARTUP"] = 4] = "STARTUP";
    })(exports.Topic || (exports.Topic = {}));
    var Topic = exports.Topic;
    var NullTimerEvent = (function () {
        function NullTimerEvent() {
        }
        NullTimerEvent.prototype.stop = function () {
            return;
        };
        NullTimerEvent.prototype.timeTaken = function () {
            return -1;
        };
        return NullTimerEvent;
    })();
    var TimerEvent = (function () {
        function TimerEvent(timeKeeper, name, topic, startTime, description) {
            this.timeKeeper = timeKeeper;
            this.name = name;
            this.description = description;
            this.topic = topic;
            this.stopTime = null;
            if (startTime) {
                this.startTime = startTime;
                return;
            }
            this.startTime = new Date();
            this.sw = precision.StopWatch.create();
            if (msWriteProfilerMark) {
                var profilerName = ['Monaco', this.topic, this.name, 'start'];
                msWriteProfilerMark(profilerName.join('|'));
            }
        }
        TimerEvent.prototype.stop = function (stopTime) {
            // already stopped
            if (this.stopTime !== null) {
                return;
            }
            if (stopTime) {
                this.stopTime = stopTime;
                this.sw = null;
                this.timeKeeper._onEventStopped(this);
                return;
            }
            this.stopTime = new Date();
            if (this.sw) {
                this.sw.stop();
            }
            this.timeKeeper._onEventStopped(this);
            if (msWriteProfilerMark) {
                var profilerName = ['Monaco', this.topic, this.name, 'stop'];
                msWriteProfilerMark(profilerName.join('|'));
            }
        };
        TimerEvent.prototype.timeTaken = function () {
            if (this.sw) {
                return this.sw.elapsed();
            }
            if (this.stopTime) {
                return this.stopTime.getTime() - this.startTime.getTime();
            }
            return -1;
        };
        return TimerEvent;
    })();
    var TimeKeeper /*extends EventEmitter.EventEmitter*/ = (function () {
        function TimeKeeper /*extends EventEmitter.EventEmitter*/() {
            this.cleaningIntervalId = -1;
            this.collectedEvents = [];
            this.listeners = [];
        }
        TimeKeeper /*extends EventEmitter.EventEmitter*/.prototype.isEnabled = function () {
            return exports.ENABLE_TIMER;
        };
        TimeKeeper /*extends EventEmitter.EventEmitter*/.prototype.start = function (topic, name, start, description) {
            if (!this.isEnabled()) {
                return exports.nullEvent;
            }
            var strTopic;
            if (typeof topic === 'string') {
                strTopic = topic;
            }
            else if (topic === Topic.EDITOR) {
                strTopic = 'Editor';
            }
            else if (topic === Topic.LANGUAGES) {
                strTopic = 'Languages';
            }
            else if (topic === Topic.WORKER) {
                strTopic = 'Worker';
            }
            else if (topic === Topic.WORKBENCH) {
                strTopic = 'Workbench';
            }
            else if (topic === Topic.STARTUP) {
                strTopic = 'Startup';
            }
            this.initAutoCleaning();
            var event = new TimerEvent(this, name, strTopic, start, description);
            this.addEvent(event);
            return event;
        };
        TimeKeeper /*extends EventEmitter.EventEmitter*/.prototype.dispose = function () {
            if (this.cleaningIntervalId !== -1) {
                Platform.clearInterval(this.cleaningIntervalId);
                this.cleaningIntervalId = -1;
            }
        };
        TimeKeeper /*extends EventEmitter.EventEmitter*/.prototype.addListener = function (listener) {
            this.listeners.push(listener);
        };
        TimeKeeper /*extends EventEmitter.EventEmitter*/.prototype.removeListener = function (listener) {
            for (var i = 0; i < this.listeners.length; i++) {
                if (this.listeners[i] === listener) {
                    this.listeners.splice(i, 1);
                    return;
                }
            }
        };
        TimeKeeper /*extends EventEmitter.EventEmitter*/.prototype.addEvent = function (event) {
            event.id = TimeKeeper.EVENT_ID;
            TimeKeeper.EVENT_ID++;
            this.collectedEvents.push(event);
            // expire items from the front of the cache
            if (this.collectedEvents.length > TimeKeeper._EVENT_CACHE_LIMIT) {
                this.collectedEvents.shift();
            }
        };
        TimeKeeper /*extends EventEmitter.EventEmitter*/.prototype.initAutoCleaning = function () {
            var _this = this;
            if (this.cleaningIntervalId === -1) {
                this.cleaningIntervalId = Platform.setInterval(function () {
                    var now = Date.now();
                    _this.collectedEvents.forEach(function (event) {
                        if (!event.stopTime && (now - event.startTime.getTime()) >= TimeKeeper._MAX_TIMER_LENGTH) {
                            event.stop();
                        }
                    });
                }, TimeKeeper._CLEAN_UP_INTERVAL);
            }
        };
        TimeKeeper /*extends EventEmitter.EventEmitter*/.prototype.getCollectedEvents = function () {
            return this.collectedEvents.slice(0);
        };
        TimeKeeper /*extends EventEmitter.EventEmitter*/.prototype.clearCollectedEvents = function () {
            this.collectedEvents = [];
        };
        TimeKeeper /*extends EventEmitter.EventEmitter*/.prototype._onEventStopped = function (event) {
            var emitEvents = [event];
            var listeners = this.listeners.slice(0);
            for (var i = 0; i < listeners.length; i++) {
                try {
                    listeners[i](emitEvents);
                }
                catch (e) {
                    errors.onUnexpectedError(e);
                }
            }
        };
        TimeKeeper /*extends EventEmitter.EventEmitter*/.prototype.setInitialCollectedEvents = function (events, startTime) {
            var _this = this;
            if (!this.isEnabled()) {
                return;
            }
            if (startTime) {
                TimeKeeper.PARSE_TIME = startTime;
            }
            events.forEach(function (event) {
                var e = new TimerEvent(_this, event.name, event.topic, event.startTime, event.description);
                e.stop(event.stopTime);
                _this.addEvent(e);
            });
        };
        /**
         * After being started for 1 minute, all timers are automatically stopped.
         */
        TimeKeeper /*extends EventEmitter.EventEmitter*/._MAX_TIMER_LENGTH = 60000; // 1 minute
        /**
         * Every 2 minutes, a sweep of current started timers is done.
         */
        TimeKeeper /*extends EventEmitter.EventEmitter*/._CLEAN_UP_INTERVAL = 120000; // 2 minutes
        /**
         * Collect at most 1000 events.
         */
        TimeKeeper /*extends EventEmitter.EventEmitter*/._EVENT_CACHE_LIMIT = 1000;
        TimeKeeper /*extends EventEmitter.EventEmitter*/.EVENT_ID = 1;
        TimeKeeper /*extends EventEmitter.EventEmitter*/.PARSE_TIME = new Date();
        return TimeKeeper /*extends EventEmitter.EventEmitter*/;
    })();
    exports.TimeKeeper /*extends EventEmitter.EventEmitter*/ = TimeKeeper /*extends EventEmitter.EventEmitter*/;
    var timeKeeper = new TimeKeeper();
    exports.nullEvent = new NullTimerEvent();
    function start(topic, name, start, description) {
        return timeKeeper.start(topic, name, start, description);
    }
    exports.start = start;
    function getTimeKeeper() {
        return timeKeeper;
    }
    exports.getTimeKeeper = getTimeKeeper;
});
//# sourceMappingURL=timer.js.map