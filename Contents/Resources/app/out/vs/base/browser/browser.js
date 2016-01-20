/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
'use strict';
define(["require", "exports", 'vs/base/common/types', 'vs/base/common/platform'], function (require, exports, types, Platform) {
    var globals = (typeof self === 'object' ? self : global);
    // MAC:
    // chrome: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_7_2) AppleWebKit/535.2 (KHTML, like Gecko) Chrome/15.0.874.100 Safari/535.2"
    // safari: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_7_2) AppleWebKit/534.51.22 (KHTML, like Gecko) Version/5.1.1 Safari/534.51.22"
    //
    // WINDOWS:
    // chrome: "Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/535.2 (KHTML, like Gecko) Chrome/15.0.874.102 Safari/535.2"
    // IE: "Mozilla/4.0 (compatible; MSIE 8.0; Windows NT 6.1; WOW64; Trident/5.0; SLCC2; .NET CLR 2.0.50727; .NET CLR 3.5.30729; .NET CLR 3.0.30729; Media Center PC 6.0; .NET4.0C; .NET4.0E; MS-RTC LM 8; InfoPath.3; Zune 4.7)"
    // Opera:	"Opera/9.80 (Windows NT 6.1; U; en) Presto/2.9.168 Version/11.52"
    // FF: "Mozilla/5.0 (Windows NT 6.1; WOW64; rv:8.0) Gecko/20100101 Firefox/8.0"
    // LINUX:
    // chrome: "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/39.0.2171.71 Safari/537.36"
    // firefox: "Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:34.0) Gecko/20100101 Firefox/34.0"
    var userAgent = globals.navigator ? globals.navigator.userAgent : '';
    var isTest = !!globals.isTest;
    // DOCUMENTED FOR FUTURE REFERENCE:
    // When running IE11 in IE10 document mode, the code below will identify the browser as being IE10,
    // which is correct because IE11 in IE10 document mode will reimplement all the bugs of IE10
    exports.isIE11 = (userAgent.indexOf('Trident') >= 0 && userAgent.indexOf('MSIE') < 0);
    exports.isIE10 = (userAgent.indexOf('MSIE 10') >= 0);
    exports.isIE9 = (userAgent.indexOf('MSIE 9') >= 0);
    exports.isIE11orEarlier = exports.isIE11 || exports.isIE10 || exports.isIE9;
    exports.isIE10orEarlier = exports.isIE10 || exports.isIE9;
    exports.isIE10orLater = exports.isIE11 || exports.isIE10;
    exports.isOpera = (userAgent.indexOf('Opera') >= 0);
    exports.isFirefox = (userAgent.indexOf('Firefox') >= 0);
    exports.isWebKit = (userAgent.indexOf('AppleWebKit') >= 0);
    exports.isChrome = (userAgent.indexOf('Chrome') >= 0);
    exports.isSafari = (userAgent.indexOf('Chrome') === -1) && (userAgent.indexOf('Safari') >= 0);
    exports.isIPad = (userAgent.indexOf('iPad') >= 0);
    exports.canUseTranslate3d = !exports.isIE9 && !exports.isFirefox;
    exports.enableEmptySelectionClipboard = exports.isWebKit;
    /**
     * Returns if the browser supports the history.pushState function or not.
     */
    function canPushState() {
        return (!_disablePushState && globals.history && globals.history.pushState);
    }
    exports.canPushState = canPushState;
    ;
    var _disablePushState = false;
    /**
     * Helpful when we detect that pushing state does not work for some reason (e.g. FF prevents pushState for security reasons in some cases)
     */
    function disablePushState() {
        _disablePushState = true;
    }
    exports.disablePushState = disablePushState;
    /**
     * Returns if the browser supports CSS 3 animations.
     */
    function hasCSSAnimationSupport() {
        if (this._hasCSSAnimationSupport === true || this._hasCSSAnimationSupport === false) {
            return this._hasCSSAnimationSupport;
        }
        if (!globals.document) {
            return false;
        }
        var supported = false;
        var element = globals.document.createElement('div');
        var properties = ['animationName', 'webkitAnimationName', 'msAnimationName', 'MozAnimationName', 'OAnimationName'];
        for (var i = 0; i < properties.length; i++) {
            var property = properties[i];
            if (!types.isUndefinedOrNull(element.style[property]) || element.style.hasOwnProperty(property)) {
                supported = true;
                break;
            }
        }
        if (supported) {
            this._hasCSSAnimationSupport = true;
        }
        else {
            this._hasCSSAnimationSupport = false;
        }
        return this._hasCSSAnimationSupport;
    }
    exports.hasCSSAnimationSupport = hasCSSAnimationSupport;
    /**
     * Returns if the browser supports the provided video mime type or not.
     */
    function canPlayVideo(type) {
        if (!globals.document) {
            return false;
        }
        var video = globals.document.createElement('video');
        if (video.canPlayType) {
            var canPlay = video.canPlayType(type);
            return canPlay === 'maybe' || canPlay === 'probably';
        }
        return false;
    }
    exports.canPlayVideo = canPlayVideo;
    /**
     * Returns if the browser supports the provided audio mime type or not.
     */
    function canPlayAudio(type) {
        if (!globals.document) {
            return false;
        }
        var audio = globals.document.createElement('audio');
        if (audio.canPlayType) {
            var canPlay = audio.canPlayType(type);
            return canPlay === 'maybe' || canPlay === 'probably';
        }
        return false;
    }
    exports.canPlayAudio = canPlayAudio;
    function isInWebWorker() {
        return !globals.document && typeof (globals.importScripts) !== 'undefined';
    }
    exports.isInWebWorker = isInWebWorker;
    function supportsExecCommand(command) {
        return ((exports.isIE11orEarlier || Platform.isNative)
            && document.queryCommandSupported(command));
    }
    exports.supportsExecCommand = supportsExecCommand;
});
//# sourceMappingURL=browser.js.map