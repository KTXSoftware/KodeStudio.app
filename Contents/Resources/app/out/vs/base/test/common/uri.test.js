/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
'use strict';
define(["require", "exports", 'assert', 'vs/base/common/uri', 'vs/base/common/marshalling', 'vs/base/common/paths'], function (require, exports, assert, uri_1, marshalling_1, paths_1) {
    suite('URI', function () {
        test('file#toString', function () {
            assert.equal(uri_1.default.file('c:/win/path').toString(), 'file:///c%3A/win/path');
            assert.equal(uri_1.default.file('C:/win/path').toString(), 'file:///c%3A/win/path');
            assert.equal(uri_1.default.file('c:/win/path/').toString(), 'file:///c%3A/win/path/');
            assert.equal(uri_1.default.file('/c:/win/path').toString(), 'file:///c%3A/win/path');
            assert.equal(uri_1.default.file('c:\\win\\path').toString(), 'file:///c%3A/win/path');
            assert.equal(uri_1.default.file('c:\\win/path').toString(), 'file:///c%3A/win/path');
        });
        test('file#path', function () {
            assert.equal(uri_1.default.file('c:/win/path').fsPath.replace(/\\/g, '/'), 'c:/win/path');
            assert.equal(uri_1.default.file('c:/win/path/').fsPath.replace(/\\/g, '/'), 'c:/win/path/');
            assert.equal(uri_1.default.file('C:/win/path').fsPath.replace(/\\/g, '/'), 'c:/win/path');
            assert.equal(uri_1.default.file('/c:/win/path').fsPath.replace(/\\/g, '/'), 'c:/win/path');
            assert.equal(uri_1.default.file('./c/win/path').fsPath.replace(/\\/g, '/'), './c/win/path');
            assert.equal(uri_1.default.file('c:\\win\\path').fsPath.replace(/\\/g, '/'), 'c:/win/path');
            assert.equal(uri_1.default.file('c:\\win/path').fsPath.replace(/\\/g, '/'), 'c:/win/path');
        });
        test('http#toString', function () {
            assert.equal(uri_1.default.create('http', 'www.msft.com', '/my/path').toString(), 'http://www.msft.com/my/path');
            assert.equal(uri_1.default.create('http', 'www.msft.com', '/my/path').toString(), 'http://www.msft.com/my/path');
            assert.equal(uri_1.default.create('http', 'www.MSFT.com', '/my/path').toString(), 'http://www.msft.com/my/path');
            assert.equal(uri_1.default.create('http', '', 'my/path').toString(), 'http:my/path');
            assert.equal(uri_1.default.create('http', '', '/my/path').toString(), 'http:/my/path');
            assert.equal(uri_1.default.create('', '', 'my/path').toString(), 'my/path');
            assert.equal(uri_1.default.create('', '', '/my/path').toString(), '/my/path');
        });
        test('with', function () {
            assert.equal(uri_1.default.create().withScheme('http').withPath('/api/files/test.me').withQuery('t=1234').toString(), 'http:/api/files/test.me?t=1234');
            assert.equal(uri_1.default.create().with('http', '', '/api/files/test.me', 't=1234', '').toString(), 'http:/api/files/test.me?t=1234');
            assert.equal(uri_1.default.create().with('https', '', '/api/files/test.me', 't=1234', '').toString(), 'https:/api/files/test.me?t=1234');
            assert.equal(uri_1.default.create().with('HTTP', '', '/api/files/test.me', 't=1234', '').toString(), 'HTTP:/api/files/test.me?t=1234');
            assert.equal(uri_1.default.create().with('HTTPS', '', '/api/files/test.me', 't=1234', '').toString(), 'HTTPS:/api/files/test.me?t=1234');
            assert.equal(uri_1.default.create().with('boo', '', '/api/files/test.me', 't=1234', '').toString(), 'boo:/api/files/test.me?t%3D1234');
        });
        test('parse', function () {
            var value = uri_1.default.parse('http:/api/files/test.me?t=1234');
            assert.equal(value.scheme, 'http');
            assert.equal(value.authority, '');
            assert.equal(value.path, '/api/files/test.me');
            assert.equal(value.query, 't=1234');
            assert.equal(value.fragment, '');
            value = uri_1.default.parse('http://api/files/test.me?t=1234');
            assert.equal(value.scheme, 'http');
            assert.equal(value.authority, 'api');
            assert.equal(value.path, '/files/test.me');
            assert.equal(value.fsPath, paths_1.normalize('/files/test.me', true));
            assert.equal(value.query, 't=1234');
            assert.equal(value.fragment, '');
            value = uri_1.default.parse('inmemory:');
            assert.equal(value.scheme, 'inmemory');
            assert.equal(value.authority, '');
            assert.equal(value.path, '');
            assert.equal(value.query, '');
            assert.equal(value.fragment, '');
            value = uri_1.default.parse('api/files/test');
            assert.equal(value.scheme, '');
            assert.equal(value.authority, '');
            assert.equal(value.path, 'api/files/test');
            assert.equal(value.query, '');
            assert.equal(value.fragment, '');
            value = uri_1.default.parse('api');
            assert.equal(value.scheme, '');
            assert.equal(value.authority, '');
            assert.equal(value.path, 'api');
            assert.equal(value.query, '');
            assert.equal(value.fragment, '');
            value = uri_1.default.parse('/api/files/test');
            assert.equal(value.scheme, '');
            assert.equal(value.authority, '');
            assert.equal(value.path, '/api/files/test');
            assert.equal(value.query, '');
            assert.equal(value.fragment, '');
            value = uri_1.default.parse('?test');
            assert.equal(value.scheme, '');
            assert.equal(value.authority, '');
            assert.equal(value.path, '');
            assert.equal(value.query, 'test');
            assert.equal(value.fragment, '');
            value = uri_1.default.parse('#test');
            assert.equal(value.scheme, '');
            assert.equal(value.authority, '');
            assert.equal(value.path, '');
            assert.equal(value.query, '');
            assert.equal(value.fragment, 'test');
        });
        // Useful reference:
        test('unc', function () {
            var uri = uri_1.default.file('\\\\localhost\\c$\\GitDevelopment\\express');
            assert.equal(uri.toString(), 'file://localhost/c%24/GitDevelopment/express');
            assert.equal(uri.path, '/c$/GitDevelopment/express');
            assert.equal(uri.fsPath, paths_1.normalize('//localhost/c$/GitDevelopment/express', true));
        });
        // Useful reference:
        test('correctFileUriToFilePath', function () {
            var test = function (input, expected) {
                expected = paths_1.normalize(expected, true);
                assert.equal(uri_1.default.parse(input).fsPath, expected, 'Result for ' + input);
            };
            test('file:///c:/alex.txt', 'c:\\alex.txt');
            test('file:///c:/Source/Z%C3%BCrich%20or%20Zurich%20(%CB%88zj%CA%8A%C9%99r%C9%AAk,/Code/resources/app/plugins', 'c:\\Source\\Zürich or Zurich (ˈzjʊərɪk,\\Code\\resources\\app\\plugins');
            test('file://monacotools/isi.txt', '\\\\monacotools\\isi.txt');
            test('file://monacotools1/certificates/SSL/', '\\\\monacotools1\\certificates\\SSL\\');
        });
        test('Bug 16793:# in folder name => mirror models get out of sync', function () {
            var uri1 = uri_1.default.file('C:\\C#\\file.txt');
            assert.equal(marshalling_1.deserialize(marshalling_1.serialize(uri1.toString())), uri1.toString());
        });
        test('URI#parse', function () {
            var value = uri_1.default.parse('file:///c:/test/me');
            assert.equal(value.scheme, 'file');
            assert.equal(value.authority, '');
            assert.equal(value.path, '/c:/test/me');
            assert.equal(value.fragment, '');
            assert.equal(value.query, '');
            assert.equal(value.fsPath, paths_1.normalize('c:/test/me', true));
            value = uri_1.default.parse('file://shares/files/c%23/p.cs');
            assert.equal(value.scheme, 'file');
            assert.equal(value.authority, 'shares');
            assert.equal(value.path, '/files/c#/p.cs');
            assert.equal(value.fragment, '');
            assert.equal(value.query, '');
            assert.equal(value.fsPath, paths_1.normalize('//shares/files/c#/p.cs', true));
            value = uri_1.default.parse('file:///c:/Source/Z%C3%BCrich%20or%20Zurich%20(%CB%88zj%CA%8A%C9%99r%C9%AAk,/Code/resources/app/plugins/c%23/plugin.json');
            assert.equal(value.path, '/c:/Source/Zürich or Zurich (ˈzjʊərɪk,/Code/resources/app/plugins/c#/plugin.json');
            value = uri_1.default.parse('file:///c:/test %25/path');
            assert.equal(value.path, '/c:/test %/path');
            value = uri_1.default.parse('file:#d');
            assert.equal(value.scheme, 'file');
            assert.equal(value.fragment, 'd');
            value = uri_1.default.parse('file:?q');
            assert.equal(value.scheme, 'file');
            assert.equal(value.query, 'q');
            value = uri_1.default.parse('http:/api/files/test.me?t=1234');
            assert.equal(value.scheme, 'http');
            assert.equal(value.authority, '');
            assert.equal(value.path, '/api/files/test.me');
            assert.equal(value.query, 't=1234');
            assert.equal(value.fragment, '');
            value = uri_1.default.parse('http://api/files/test.me?t=1234');
            assert.equal(value.scheme, 'http');
            assert.equal(value.authority, 'api');
            assert.equal(value.path, '/files/test.me');
            assert.equal(value.query, 't=1234');
            assert.equal(value.fragment, '');
            value = uri_1.default.parse('inmemory:');
            assert.equal(value.scheme, 'inmemory');
            assert.equal(value.authority, '');
            assert.equal(value.path, '');
            assert.equal(value.query, '');
            assert.equal(value.fragment, '');
            value = uri_1.default.parse('api/files/test');
            assert.equal(value.scheme, '');
            assert.equal(value.authority, '');
            assert.equal(value.path, 'api/files/test');
            assert.equal(value.query, '');
            assert.equal(value.fragment, '');
            value = uri_1.default.parse('api');
            assert.equal(value.scheme, '');
            assert.equal(value.authority, '');
            assert.equal(value.path, 'api');
            assert.equal(value.query, '');
            assert.equal(value.fragment, '');
            value = uri_1.default.parse('/api/files/test');
            assert.equal(value.scheme, '');
            assert.equal(value.authority, '');
            assert.equal(value.path, '/api/files/test');
            assert.equal(value.query, '');
            assert.equal(value.fragment, '');
            value = uri_1.default.parse('?test');
            assert.equal(value.scheme, '');
            assert.equal(value.authority, '');
            assert.equal(value.path, '');
            assert.equal(value.query, 'test');
            assert.equal(value.fragment, '');
            value = uri_1.default.parse('#test');
            assert.equal(value.scheme, '');
            assert.equal(value.authority, '');
            assert.equal(value.path, '');
            assert.equal(value.query, '');
            assert.equal(value.fragment, 'test');
        });
        test('URI#parse, disallow //path when no authority', function () {
            assert.throws(function () { return uri_1.default.parse('file:////shares/files/p.cs'); });
            var value = uri_1.default.parse('file://shares//files/p.cs');
            assert.equal(value.authority, 'shares');
            assert.equal(value.path, '//files/p.cs');
            value = uri_1.default.parse('file:///j%3A//');
            assert.equal(value.path, '/j://');
        });
        test('URI#file', function () {
            var value = uri_1.default.file('\\\\shäres\\path\\c#\\plugin.json');
            assert.equal(value.scheme, 'file');
            assert.equal(value.authority, 'shäres');
            assert.equal(value.path, '/path/c#/plugin.json');
            assert.equal(value.fragment, '');
            assert.equal(value.query, '');
            assert.equal(value.toString(), 'file://sh%C3%A4res/path/c%23/plugin.json');
            // identity toString -> parse -> toString
            value = uri_1.default.parse(value.toString());
            assert.equal(value.scheme, 'file');
            assert.equal(value.authority, 'shäres');
            assert.equal(value.path, '/path/c#/plugin.json');
            assert.equal(value.fragment, '');
            assert.equal(value.query, '');
            assert.equal(value.toString(), 'file://sh%C3%A4res/path/c%23/plugin.json');
            value = uri_1.default.file('c:\\test with %\\path');
            assert.equal(value.path, '/c:/test with %/path');
            assert.equal(value.toString(), 'file:///c%3A/test%20with%20%25/path');
            value = uri_1.default.file('c:\\test with %25\\path');
            assert.equal(value.path, '/c:/test with %25/path');
            assert.equal(value.toString(), 'file:///c%3A/test%20with%20%2525/path');
            value = uri_1.default.file('c:\\test with %25\\c#code');
            assert.equal(value.path, '/c:/test with %25/c#code');
            assert.equal(value.toString(), 'file:///c%3A/test%20with%20%2525/c%23code');
        });
        test('URI#file, auto-slash windows drive letter', function () {
            var value = uri_1.default.file('c:\\test\\drive');
            assert.equal(value.path, '/c:/test/drive');
            assert.equal(value.toString(), 'file:///c%3A/test/drive');
        });
        test('URI#file, disallow scheme', function () {
            assert.throws(function () { return uri_1.default.file('file:///some/path'); });
        });
        test('URI.toString, only scheme and query', function () {
            var value = uri_1.default.parse('stuff:?qüery');
            assert.equal(value.toString(), 'stuff:?q%C3%BCery');
        });
        test('URI#toString, upper-case percent espaces', function () {
            var value = uri_1.default.parse('file://sh%c3%a4res/path');
            assert.equal(value.toString(), 'file://sh%C3%A4res/path');
        });
        test('URI#toString, escape all the bits', function () {
            var value = uri_1.default.file('/Users/jrieken/Code/_samples/18500/Mödel + Other Thîngß/model.js');
            assert.equal(value.toString(), 'file:///Users/jrieken/Code/_samples/18500/M%C3%B6del%20%2B%20Other%20Th%C3%AEng%C3%9F/model.js');
        });
        test('URI#toString, don\'t encode port', function () {
            var value = uri_1.default.parse('http://localhost:8080/far');
            assert.equal(value.toString(), 'http://localhost:8080/far');
            value = uri_1.default.create('http', 'löcalhost:8080', '/far', undefined, undefined);
            assert.equal(value.toString(), 'http://l%C3%B6calhost:8080/far');
        });
        test('correctFileUriToFilePath2', function () {
            var test = function (input, expected) {
                expected = paths_1.normalize(expected, true);
                var value = uri_1.default.parse(input);
                assert.equal(value.fsPath, expected, 'Result for ' + input);
                var value2 = uri_1.default.file(value.fsPath);
                assert.equal(value2.fsPath, expected, 'Result for ' + input);
                assert.equal(value.toString(), value2.toString());
            };
            test('file:///c:/alex.txt', 'c:\\alex.txt');
            test('file:///c:/Source/Z%C3%BCrich%20or%20Zurich%20(%CB%88zj%CA%8A%C9%99r%C9%AAk,/Code/resources/app/plugins', 'c:\\Source\\Zürich or Zurich (ˈzjʊərɪk,\\Code\\resources\\app\\plugins');
            test('file://monacotools/isi.txt', '\\\\monacotools\\isi.txt');
            test('file://monacotools1/certificates/SSL/', '\\\\monacotools1\\certificates\\SSL\\');
        });
        test('URI - (de)serialize', function () {
            var values = [
                uri_1.default.parse('http://localhost:8080/far'),
                uri_1.default.file('c:\\test with %25\\c#code'),
                uri_1.default.file('\\\\shäres\\path\\c#\\plugin.json'),
                uri_1.default.parse('http://api/files/test.me?t=1234'),
                uri_1.default.parse('http://api/files/test.me?t=1234#fff'),
                uri_1.default.parse('http://api/files/test.me#fff'),
            ];
            // console.profile();
            // let c = 100000;
            // while (c-- > 0) {
            for (var _i = 0; _i < values.length; _i++) {
                var value = values[_i];
                var data = value._toSerialized();
                var clone = uri_1.default._fromSerialized(data);
                assert.equal(clone.scheme, value.scheme);
                assert.equal(clone.authority, value.authority);
                assert.equal(clone.path, value.path);
                assert.equal(clone.query, value.query);
                assert.equal(clone.fragment, value.fragment);
                assert.equal(clone.fsPath, value.fsPath);
                assert.equal(clone.toString(), value.toString());
            }
            // }
            // console.profileEnd();
        });
        test('URI - http, query & toString', function () {
            var uri = uri_1.default.parse('http://go.microsoft.com/fwlink/?LinkId=518008');
            assert.equal(uri.query, 'LinkId=518008');
            assert.equal(uri.toString(), 'http://go.microsoft.com/fwlink/?LinkId=518008');
            var uri2 = uri_1.default.parse(uri.toString());
            assert.equal(uri2.query, 'LinkId=518008');
            assert.equal(uri2.query, uri.query);
            uri = uri_1.default.parse('http://go.microsoft.com/fwlink/?LinkId=518008&foö&ké¥=üü');
            assert.equal(uri.query, 'LinkId=518008&foö&ké¥=üü');
            assert.equal(uri.toString(), 'http://go.microsoft.com/fwlink/?LinkId=518008&fo%C3%B6&k%C3%A9%C2%A5=%C3%BC%C3%BC');
        });
    });
});
//# sourceMappingURL=uri.test.js.map