/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/
"use strict";
var mockery = require('mockery');
var assert = require('assert');
var testUtils = require('./testUtils');
var path;
var MODULE_UNDER_TEST = '../src/utils';
suite('Utils', function () {
    function getUtils() {
        return require(MODULE_UNDER_TEST);
    }
    setup(function () {
        testUtils.setupUnhandledRejectionListener();
        mockery.enable({ useCleanCache: true, warnOnReplace: false });
        testUtils.registerWin32Mocks();
        mockery.registerMock('fs', { statSync: function () { } });
        mockery.registerMock('http', {});
        path = require('path');
        mockery.registerAllowables([
            MODULE_UNDER_TEST, 'url', './logger']);
    });
    teardown(function () {
        testUtils.removeUnhandledRejectionListener();
        mockery.deregisterAll();
        mockery.disable();
    });
    suite('getPlatform()/getBrowserPath()', function () {
        test('osx', function () {
            mockery.registerMock('os', { platform: function () { return 'darwin'; } });
            var Utils = getUtils();
            assert.equal(Utils.getPlatform(), 1 /* OSX */);
            assert.equal(Utils.getBrowserPath(), '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome');
        });
        test('win', function () {
            // Overwrite the statSync mock to say the x86 path doesn't exist
            var statSync = function (aPath) {
                if (aPath.indexOf('(x86)') >= 0)
                    throw new Error('Not found');
            };
            mockery.registerMock('fs', { statSync: statSync });
            var Utils = getUtils();
            assert.equal(Utils.getPlatform(), 0 /* Windows */);
            assert.equal(Utils.getBrowserPath(), 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe');
        });
        test('winx86', function () {
            var Utils = getUtils();
            assert.equal(Utils.getPlatform(), 0 /* Windows */);
            assert.equal(Utils.getBrowserPath(), 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe');
        });
        test('linux', function () {
            mockery.registerMock('os', { platform: function () { return 'linux'; } });
            var Utils = getUtils();
            assert.equal(Utils.getPlatform(), 2 /* Linux */);
            assert.equal(Utils.getBrowserPath(), '/usr/bin/google-chrome');
        });
        test('freebsd (default to Linux for anything unknown)', function () {
            mockery.registerMock('os', { platform: function () { return 'freebsd'; } });
            var Utils = getUtils();
            assert.equal(Utils.getPlatform(), 2 /* Linux */);
            assert.equal(Utils.getBrowserPath(), '/usr/bin/google-chrome');
        });
    });
    suite('existsSync()', function () {
        test('it returns false when statSync throws', function () {
            var statSync = function (aPath) {
                if (aPath.indexOf('notfound') >= 0)
                    throw new Error('Not found');
            };
            mockery.registerMock('fs', { statSync: statSync });
            var Utils = getUtils();
            assert.equal(Utils.existsSync('exists'), true);
            assert.equal(Utils.existsSync('thisfilenotfound'), false);
        });
    });
    suite('reversedArr()', function () {
        test('it does not modify the input array', function () {
            var arr = [2, 4, 6];
            getUtils().reversedArr(arr);
            assert.deepEqual(arr, [2, 4, 6]);
            arr = [1];
            getUtils().reversedArr(arr);
            assert.deepEqual(arr, [1]);
        });
        test('it reverses the array', function () {
            assert.deepEqual(getUtils().reversedArr([1, 3, 5, 7]), [7, 5, 3, 1]);
            assert.deepEqual(getUtils().reversedArr([-1, 'hello', null, undefined, [1, 2]]), [[1, 2], undefined, null, 'hello', -1]);
        });
    });
    suite('promiseTimeout()', function () {
        test('when given a promise it fails if the promise never resolves', function () {
            return getUtils().promiseTimeout(new Promise(function () { }), 5).then(function () { return assert.fail('This promise should fail'); }, function (e) { });
        });
        test('when given a promise it succeeds if the promise resolves', function () {
            return getUtils().promiseTimeout(Promise.resolve('test'), 5).then(function (result) {
                assert.equal(result, 'test');
            }, function (e) { return assert.fail('This promise should pass'); });
        });
        test('when not given a promise it resolves', function () {
            return getUtils().promiseTimeout(null, 5).then(null, function () { return assert.fail('This promise should pass'); });
        });
    });
    suite('retryAsync()', function () {
        test('when the function passes, it resolves with the value', function () {
            return getUtils().retryAsync(function () { return Promise.resolve('pass'); }, /*timeoutMs=*/ 5).then(function (result) {
                assert.equal(result, 'pass');
            }, function (e) {
                assert.fail('This should have passed');
            });
        });
        test('when the function fails, it rejects', function () {
            return getUtils().retryAsync(function () { return getUtils().errP('fail'); }, /*timeoutMs=*/ 5)
                .then(function () { return assert.fail('This promise should fail'); }, function (e) { return assert.equal(e.message, 'fail'); });
        });
    });
    suite('canonicalizeUrl()', function () {
        function testCanUrl(inUrl, expectedUrl) {
            var Utils = getUtils();
            assert.equal(Utils.canonicalizeUrl(inUrl), expectedUrl);
        }
        test('enforces path.sep slash', function () {
            testCanUrl('c:\\thing\\file.js', 'c:\\thing\\file.js');
            testCanUrl('c:/thing/file.js', 'c:\\thing\\file.js');
        });
        test('removes file:///', function () {
            testCanUrl('file:///c:/file.js', 'c:\\file.js');
        });
        test('unescape when doing url -> path', function () {
            testCanUrl('file:///c:/path%20with%20spaces', 'c:\\path with spaces');
        });
        test('ensures local path starts with / on OSX', function () {
            mockery.registerMock('os', { platform: function () { return 'darwin'; } });
            testCanUrl('file:///Users/scripts/app.js', '/Users/scripts/app.js');
        });
        test('force lowercase drive letter on Win to match VS Code', function () {
            // note default 'os' mock is win32
            testCanUrl('file:///D:/FILE.js', 'd:\\FILE.js');
        });
        test('removes query params from url', function () {
            var cleanUrl = 'http://site.com/My/Cool/Site/script.js';
            var url = cleanUrl + '?stuff';
            testCanUrl(url, cleanUrl);
        });
        test('strips trailing slash', function () {
            testCanUrl('http://site.com/', 'http://site.com');
        });
    });
    suite('fixDriveLetterAndSlashes', function () {
        test('works for c:/... cases', function () {
            assert.equal(getUtils().fixDriveLetterAndSlashes('C:/path/stuff'), 'c:\\path\\stuff');
            assert.equal(getUtils().fixDriveLetterAndSlashes('c:/path\\stuff'), 'c:\\path\\stuff');
            assert.equal(getUtils().fixDriveLetterAndSlashes('C:\\path'), 'c:\\path');
            assert.equal(getUtils().fixDriveLetterAndSlashes('C:\\'), 'c:\\');
        });
        test('works for file:/// cases', function () {
            assert.equal(getUtils().fixDriveLetterAndSlashes('file:///C:/path/stuff'), 'file:///c:\\path\\stuff');
            assert.equal(getUtils().fixDriveLetterAndSlashes('file:///c:/path\\stuff'), 'file:///c:\\path\\stuff');
            assert.equal(getUtils().fixDriveLetterAndSlashes('file:///C:\\path'), 'file:///c:\\path');
            assert.equal(getUtils().fixDriveLetterAndSlashes('file:///C:\\'), 'file:///c:\\');
        });
    });
    suite('getUrl', function () {
        var URL = 'http://testsite.com/testfile';
        var RESPONSE = 'response';
        function registerMockHTTP(dataResponses, error) {
            mockery.registerMock('http', { get: function (url, callback) {
                    assert.equal(url, URL);
                    if (error) {
                        return { on: function (eventName, eventCallback) {
                                if (eventName === 'error') {
                                    eventCallback(error);
                                }
                            } };
                    }
                    else {
                        callback({
                            statusCode: 200,
                            on: function (eventName, eventCallback) {
                                if (eventName === 'data') {
                                    dataResponses.forEach(eventCallback);
                                }
                                else if (eventName === 'end') {
                                    setTimeout(eventCallback, 0);
                                }
                            } });
                        return { on: function () { } };
                    }
                } });
        }
        test('combines chunks', function () {
            // Create a mock http.get that provides data in two chunks
            registerMockHTTP(['res', 'ponse']);
            return getUtils().getURL(URL).then(function (response) {
                assert.equal(response, RESPONSE);
            });
        });
        test('rejects the promise on an error', function () {
            registerMockHTTP(undefined, 'fail');
            return getUtils().getURL(URL).then(function (response) {
                assert.fail('Should not be resolved');
            }, function (e) {
                assert.equal(e, 'fail');
            });
        });
    });
    suite('isURL', function () {
        function assertIsURL(url) {
            assert(getUtils().isURL(url));
        }
        function assertNotURL(url) {
            assert(!getUtils().isURL(url));
        }
        test('returns true for URLs', function () {
            assertIsURL('http://localhost');
            assertIsURL('http://mysite.com');
            assertIsURL('file:///c:/project/code.js');
            assertIsURL('webpack:///webpack/webpackthing');
            assertIsURL('https://a.b.c:123/asdf?fsda');
        });
        test('returns false for not-URLs', function () {
            assertNotURL('a');
            assertNotURL('/project/code.js');
            assertNotURL('c:/project/code.js');
            assertNotURL('abc123!@#');
            assertNotURL('');
            assertNotURL(null);
        });
    });
    suite('lstrip', function () {
        test('does what it says', function () {
            assert.equal(getUtils().lstrip('test', 'te'), 'st');
            assert.equal(getUtils().lstrip('asdf', ''), 'asdf');
            assert.equal(getUtils().lstrip('asdf', null), 'asdf');
            assert.equal(getUtils().lstrip('asdf', 'asdf'), '');
            assert.equal(getUtils().lstrip('asdf', '123'), 'asdf');
            assert.equal(getUtils().lstrip('asdf', 'sdf'), 'asdf');
        });
    });
    suite('pathToFileURL', function () {
        test('converts windows-style paths', function () {
            assert.equal(getUtils().pathToFileURL('c:\\code\\app.js'), 'file:///c:/code/app.js');
        });
        test('converts unix-style paths', function () {
            assert.equal(getUtils().pathToFileURL('/code/app.js'), 'file:///code/app.js');
        });
        test('encodes as URI and forces forwards slash', function () {
            assert.equal(getUtils().pathToFileURL('c:\\path with spaces\\blah.js'), 'file:///c:/path%20with%20spaces/blah.js');
        });
    });
});

//# sourceMappingURL=utils.test.js.map
