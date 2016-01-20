/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
'use strict';
define(["require", "exports", 'vs/base/common/winjs.base', 'vs/base/common/assert', 'vs/base/browser/browser', 'vs/base/browser/builder', 'vs/base/browser/dom', 'vs/base/common/uuid', 'vs/css!./progressbar'], function (require, exports, WinJS, Assert, Browser, Builder, DOM, Uuid) {
    var css_done = 'done';
    var css_active = 'active';
    var css_infinite = 'infinite';
    var css_discrete = 'discrete';
    var css_progress_container = 'progress-container';
    var css_progress_bit = 'progress-bit';
    var $ = Builder.$;
    /**
     * A progress bar with support for infinite or discrete progress.
     */
    var ProgressBar = (function () {
        function ProgressBar(builder) {
            this.toUnbind = [];
            this.workedVal = 0;
            this.create(builder);
        }
        ProgressBar.prototype.create = function (parent) {
            var _this = this;
            parent.div({ 'class': css_progress_container }, function (builder) {
                _this.element = builder.clone();
                builder.div({ 'class': css_progress_bit }).on([DOM.EventType.ANIMATION_START, DOM.EventType.ANIMATION_END, DOM.EventType.ANIMATION_ITERATION], function (e) {
                    switch (e.type) {
                        case DOM.EventType.ANIMATION_START:
                        case DOM.EventType.ANIMATION_END:
                            _this.animationRunning = e.type === DOM.EventType.ANIMATION_START;
                            break;
                        case DOM.EventType.ANIMATION_ITERATION:
                            if (_this.animationStopToken) {
                                _this.animationStopToken(null);
                            }
                            break;
                    }
                }, _this.toUnbind);
                _this.bit = builder.getHTMLElement();
            });
        };
        ProgressBar.prototype.off = function () {
            this.bit.style.width = 'inherit';
            this.bit.style.opacity = '1';
            this.element.removeClass(css_active);
            this.element.removeClass(css_infinite);
            this.element.removeClass(css_discrete);
            this.workedVal = 0;
            this.totalWork = undefined;
        };
        /**
         * Indicates to the progress bar that all work is done.
         */
        ProgressBar.prototype.done = function () {
            return this.doDone(true);
        };
        /**
         * Stops the progressbar from showing any progress instantly without fading out.
         */
        ProgressBar.prototype.stop = function () {
            return this.doDone(false);
        };
        ProgressBar.prototype.doDone = function (delayed) {
            var _this = this;
            this.element.addClass(css_done);
            // let it grow to 100% width and hide afterwards
            if (!this.element.hasClass(css_infinite)) {
                this.bit.style.width = 'inherit';
                if (delayed) {
                    WinJS.Promise.timeout(200).then(function () { return _this.off(); });
                }
                else {
                    this.off();
                }
            }
            else {
                this.bit.style.opacity = '0';
                if (delayed) {
                    WinJS.Promise.timeout(200).then(function () { return _this.off(); });
                }
                else {
                    this.off();
                }
            }
            return this;
        };
        /**
         * Use this mode to indicate progress that has no total number of work units.
         */
        ProgressBar.prototype.infinite = function () {
            this.bit.style.width = '2%';
            this.bit.style.opacity = '1';
            this.element.removeClass(css_discrete);
            this.element.removeClass(css_done);
            this.element.addClass(css_active);
            this.element.addClass(css_infinite);
            if (!Browser.hasCSSAnimationSupport()) {
                // Use a generated token to avoid race conditions from reentrant calls to this function
                var currentProgressToken = Uuid.v4().asHex();
                this.currentProgressToken = currentProgressToken;
                this.manualInfinite(currentProgressToken);
            }
            return this;
        };
        ProgressBar.prototype.manualInfinite = function (currentProgressToken) {
            var _this = this;
            this.bit.style.width = '5%';
            this.bit.style.display = 'inherit';
            var counter = 0;
            var animationFn = function () {
                WinJS.Promise.timeout(50).then(function () {
                    // Return if another manualInfinite() call was made
                    if (currentProgressToken !== _this.currentProgressToken) {
                        return;
                    }
                    else if (_this.element.hasClass(css_done)) {
                        _this.bit.style.display = 'none';
                        _this.bit.style.left = '0';
                    }
                    else if (_this.element.isHidden()) {
                        animationFn();
                    }
                    else {
                        counter = (counter + 1) % 95;
                        _this.bit.style.left = counter + '%';
                        animationFn();
                    }
                });
            };
            // Start Animation
            animationFn();
        };
        /**
         * Tells the progress bar the total number of work. Use in combination with workedVal() to let
         * the progress bar show the actual progress based on the work that is done.
         */
        ProgressBar.prototype.total = function (value) {
            this.workedVal = 0;
            this.totalWork = value;
            return this;
        };
        /**
         * Finds out if this progress bar is configured with total work
         */
        ProgressBar.prototype.hasTotal = function () {
            return !isNaN(this.totalWork);
        };
        /**
         * Tells the progress bar that an amount of work has been completed.
         */
        ProgressBar.prototype.worked = function (value) {
            Assert.ok(!isNaN(this.totalWork), 'Total work not set');
            value = Number(value);
            Assert.ok(!isNaN(value), 'Value is not a number');
            value = Math.max(1, value);
            this.workedVal += value;
            this.workedVal = Math.min(this.totalWork, this.workedVal);
            if (this.element.hasClass(css_infinite)) {
                this.element.removeClass(css_infinite);
            }
            if (this.element.hasClass(css_done)) {
                this.element.removeClass(css_done);
            }
            if (!this.element.hasClass(css_active)) {
                this.element.addClass(css_active);
            }
            if (!this.element.hasClass(css_discrete)) {
                this.element.addClass(css_discrete);
            }
            this.bit.style.width = 100 * (this.workedVal / this.totalWork) + '%';
            return this;
        };
        /**
         * Returns the builder this progress bar is building in.
         */
        ProgressBar.prototype.getContainer = function () {
            return $(this.element);
        };
        ProgressBar.prototype.dispose = function () {
            while (this.toUnbind.length) {
                this.toUnbind.pop()();
            }
        };
        return ProgressBar;
    })();
    exports.ProgressBar = ProgressBar;
});
//# sourceMappingURL=progressbar.js.map