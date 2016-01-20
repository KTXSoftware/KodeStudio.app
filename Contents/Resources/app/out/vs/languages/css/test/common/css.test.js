/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
'use strict';
define(["require", "exports", 'vs/editor/common/modes', 'vs/editor/test/common/modesUtil', 'vs/languages/css/common/css', 'vs/languages/css/common/css.contribution'], function (require, exports, Modes, modesUtil, css_1) {
    suite('CSS Colorizing', function () {
        var assertWords = modesUtil.assertWords;
        var wordDefinition;
        var tokenizationSupport;
        var assertOnEnter;
        suiteSetup(function (done) {
            modesUtil.load('css').then(function (mode) {
                tokenizationSupport = mode.tokenizationSupport;
                assertOnEnter = modesUtil.createOnEnterAsserter(mode.getId(), mode.onEnterSupport);
                wordDefinition = mode.tokenTypeClassificationSupport.getWordDefinition();
                done();
            });
        });
        test('Skip whitespace', function () {
            modesUtil.assertTokenization(tokenizationSupport, [{
                    line: '      body ',
                    tokens: [
                        { startIndex: 0, type: '' },
                        { startIndex: 6, type: css_1.cssTokenTypes.TOKEN_SELECTOR_TAG + '.css' },
                        { startIndex: 10, type: '' }
                    ] }
            ]);
        });
        //	body {
        //	  margin: 0;
        //	  padding: 3em 6em;
        //	  font-family: tahoma, arial, sans-serif;
        //	  text-decoration: none !important;
        //	  color: #000
        //	}
        test('CSS rule', function () {
            modesUtil.assertTokenization(tokenizationSupport, [{
                    line: 'body {',
                    tokens: [
                        { startIndex: 0, type: css_1.cssTokenTypes.TOKEN_SELECTOR_TAG + '.css' },
                        { startIndex: 4, type: '' },
                        { startIndex: 5, type: 'punctuation.bracket.css', bracket: Modes.Bracket.Open }
                    ] }, {
                    line: '  margin: 0;',
                    tokens: [
                        { startIndex: 0, type: '' },
                        { startIndex: 2, type: css_1.cssTokenTypes.TOKEN_PROPERTY + '.css' },
                        { startIndex: 8, type: 'punctuation.css' },
                        { startIndex: 9, type: '' },
                        { startIndex: 10, type: css_1.cssTokenTypes.TOKEN_VALUE + '.numeric.css' },
                        { startIndex: 11, type: 'punctuation.css' }
                    ] }, {
                    line: '  padding: 3em 6em;',
                    tokens: [
                        { startIndex: 0, type: '' },
                        { startIndex: 2, type: css_1.cssTokenTypes.TOKEN_PROPERTY + '.css' },
                        { startIndex: 9, type: 'punctuation.css' },
                        { startIndex: 10, type: '' },
                        { startIndex: 11, type: css_1.cssTokenTypes.TOKEN_VALUE + '.numeric.css' },
                        { startIndex: 12, type: css_1.cssTokenTypes.TOKEN_VALUE + '.unit.css' },
                        { startIndex: 14, type: '' },
                        { startIndex: 15, type: css_1.cssTokenTypes.TOKEN_VALUE + '.numeric.css' },
                        { startIndex: 16, type: css_1.cssTokenTypes.TOKEN_VALUE + '.unit.css' },
                        { startIndex: 18, type: 'punctuation.css' }
                    ] }, {
                    line: '  font-family: tahoma, arial, sans-serif;',
                    tokens: [
                        { startIndex: 0, type: '' },
                        { startIndex: 2, type: css_1.cssTokenTypes.TOKEN_PROPERTY + '.css' },
                        { startIndex: 13, type: 'punctuation.css' },
                        { startIndex: 14, type: '' },
                        { startIndex: 15, type: css_1.cssTokenTypes.TOKEN_VALUE + '.css' },
                        { startIndex: 21, type: 'punctuation.css' },
                        { startIndex: 22, type: '' },
                        { startIndex: 23, type: css_1.cssTokenTypes.TOKEN_VALUE + '.css' },
                        { startIndex: 28, type: 'punctuation.css' },
                        { startIndex: 29, type: '' },
                        { startIndex: 30, type: css_1.cssTokenTypes.TOKEN_VALUE + '.css' },
                        { startIndex: 40, type: 'punctuation.css' }
                    ] }, {
                    line: '  text-decoration: none !important;',
                    tokens: [
                        { startIndex: 0, type: '' },
                        { startIndex: 2, type: css_1.cssTokenTypes.TOKEN_PROPERTY + '.css' },
                        { startIndex: 17, type: 'punctuation.css' },
                        { startIndex: 18, type: '' },
                        { startIndex: 19, type: css_1.cssTokenTypes.TOKEN_VALUE + '.css' },
                        { startIndex: 23, type: '' },
                        { startIndex: 24, type: css_1.cssTokenTypes.TOKEN_VALUE + '.keyword.css' },
                        { startIndex: 34, type: 'punctuation.css' }
                    ] }, {
                    line: '  color: #000',
                    tokens: [
                        { startIndex: 0, type: '' },
                        { startIndex: 2, type: css_1.cssTokenTypes.TOKEN_PROPERTY + '.css' },
                        { startIndex: 7, type: 'punctuation.css' },
                        { startIndex: 8, type: '' },
                        { startIndex: 9, type: css_1.cssTokenTypes.TOKEN_VALUE + '.hex.css' }
                    ] }, {
                    line: '  }',
                    tokens: [
                        { startIndex: 0, type: '' },
                        { startIndex: 2, type: 'punctuation.bracket.css', bracket: Modes.Bracket.Close }
                    ] }
            ]);
        });
        test('CSS units and numerics', function () {
            modesUtil.assertTokenization(tokenizationSupport, [{
                    line: '* { padding: 3em -9pt -0.5px; }',
                    tokens: [
                        { startIndex: 0, type: 'punctuation.css' },
                        { startIndex: 1, type: '' },
                        { startIndex: 2, type: 'punctuation.bracket.css' },
                        { startIndex: 3, type: '' },
                        { startIndex: 4, type: css_1.cssTokenTypes.TOKEN_PROPERTY + '.css' },
                        { startIndex: 11, type: 'punctuation.css' },
                        { startIndex: 12, type: '' },
                        { startIndex: 13, type: css_1.cssTokenTypes.TOKEN_VALUE + '.numeric.css' },
                        { startIndex: 14, type: css_1.cssTokenTypes.TOKEN_VALUE + '.unit.css' },
                        { startIndex: 16, type: '' },
                        { startIndex: 17, type: css_1.cssTokenTypes.TOKEN_VALUE + '.numeric.css' },
                        { startIndex: 19, type: css_1.cssTokenTypes.TOKEN_VALUE + '.unit.css' },
                        { startIndex: 21, type: '' },
                        { startIndex: 22, type: css_1.cssTokenTypes.TOKEN_VALUE + '.numeric.css' },
                        { startIndex: 26, type: css_1.cssTokenTypes.TOKEN_VALUE + '.unit.css' },
                        { startIndex: 28, type: 'punctuation.css' },
                        { startIndex: 29, type: '' },
                        { startIndex: 30, type: 'punctuation.bracket.css' }
                    ] }
            ]);
        });
        test('CSS unfinished unit and numerics', function () {
            modesUtil.assertTokenization(tokenizationSupport, [{
                    line: '* { padding: -',
                    tokens: [
                        { startIndex: 0, type: 'punctuation.css' },
                        { startIndex: 1, type: '' },
                        { startIndex: 2, type: 'punctuation.bracket.css' },
                        { startIndex: 3, type: '' },
                        { startIndex: 4, type: css_1.cssTokenTypes.TOKEN_PROPERTY + '.css' },
                        { startIndex: 11, type: 'punctuation.css' },
                        { startIndex: 12, type: '' }
                    ] }
            ]);
        });
        test('CSS single line comment', function () {
            modesUtil.assertTokenization(tokenizationSupport, [{
                    line: 'h1 /*comment*/ p {',
                    tokens: [
                        { startIndex: 0, type: css_1.cssTokenTypes.TOKEN_SELECTOR_TAG + '.css' },
                        { startIndex: 2, type: '' },
                        { startIndex: 3, type: 'comment.css' },
                        { startIndex: 14, type: '' },
                        { startIndex: 15, type: css_1.cssTokenTypes.TOKEN_SELECTOR_TAG + '.css' },
                        { startIndex: 16, type: '' },
                        { startIndex: 17, type: 'punctuation.bracket.css', bracket: Modes.Bracket.Open }
                    ] }
            ]);
        });
        test('CSS multi line comment', function () {
            modesUtil.assertTokenization(tokenizationSupport, [{
                    line: 'h1 /*com',
                    tokens: [
                        { startIndex: 0, type: css_1.cssTokenTypes.TOKEN_SELECTOR_TAG + '.css' },
                        { startIndex: 2, type: '' },
                        { startIndex: 3, type: 'comment.css' }
                    ] }, {
                    line: 'ment*/ p',
                    tokens: [
                        { startIndex: 0, type: 'comment.css' },
                        { startIndex: 6, type: '' },
                        { startIndex: 7, type: css_1.cssTokenTypes.TOKEN_SELECTOR_TAG + '.css' }
                    ] }
            ]);
        });
        test('CSS ID rule', function () {
            modesUtil.assertTokenization(tokenizationSupport, [{
                    line: '#myID {',
                    tokens: [
                        { startIndex: 0, type: css_1.cssTokenTypes.TOKEN_SELECTOR + '.id.css' },
                        { startIndex: 5, type: '' },
                        { startIndex: 6, type: 'punctuation.bracket.css', bracket: Modes.Bracket.Open }
                    ] }
            ]);
        });
        test('CSS Class rules', function () {
            modesUtil.assertTokenization(tokenizationSupport, [{
                    line: '.myID {',
                    tokens: [
                        { startIndex: 0, type: css_1.cssTokenTypes.TOKEN_SELECTOR + '.class.css' },
                        { startIndex: 5, type: '' },
                        { startIndex: 6, type: 'punctuation.bracket.css', bracket: Modes.Bracket.Open }
                    ] }
            ]);
        });
        test('CSS multi-line string with an escaped newline', function () {
            modesUtil.assertTokenization(tokenizationSupport, [{
                    line: '@import url("something.css");',
                    tokens: [
                        { startIndex: 0, type: css_1.cssTokenTypes.TOKEN_AT_KEYWORD + '.css' },
                        { startIndex: 7, type: '' },
                        { startIndex: 8, type: css_1.cssTokenTypes.TOKEN_VALUE + '.css' },
                        { startIndex: 11, type: 'punctuation.parenthesis.css', bracket: Modes.Bracket.Open },
                        { startIndex: 12, type: 'string.css' },
                        { startIndex: 27, type: 'punctuation.parenthesis.css', bracket: Modes.Bracket.Close },
                        { startIndex: 28, type: 'punctuation.css' }
                    ] }
            ]);
        });
        test('CSS empty string value', function () {
            modesUtil.assertTokenization(tokenizationSupport, [{
                    line: 'body {',
                    tokens: null }, {
                    line: '  content: "";',
                    tokens: [
                        { startIndex: 0, type: '' },
                        { startIndex: 2, type: css_1.cssTokenTypes.TOKEN_PROPERTY + '.css' },
                        { startIndex: 9, type: 'punctuation.css' },
                        { startIndex: 10, type: '' },
                        { startIndex: 11, type: 'string.css' },
                        { startIndex: 13, type: 'punctuation.css' }
                    ] }
            ]);
        });
        test('CSS font face', function () {
            modesUtil.assertTokenization(tokenizationSupport, [{
                    line: '@font-face {',
                    tokens: [
                        { startIndex: 0, type: css_1.cssTokenTypes.TOKEN_AT_KEYWORD + '.css' },
                        { startIndex: 10, type: '' },
                        { startIndex: 11, type: 'punctuation.bracket.css', bracket: Modes.Bracket.Open }
                    ] }, {
                    line: '  font-family: "Opificio";',
                    tokens: [
                        { startIndex: 0, type: '' },
                        { startIndex: 2, type: css_1.cssTokenTypes.TOKEN_PROPERTY + '.css' },
                        { startIndex: 13, type: 'punctuation.css' },
                        { startIndex: 14, type: '' },
                        { startIndex: 15, type: 'string.css' },
                        { startIndex: 25, type: 'punctuation.css' }
                    ] }
            ]);
        });
        test('CSS string with escaped quotes', function () {
            modesUtil.assertTokenization(tokenizationSupport, [{
                    line: '"s\\"tr" ',
                    tokens: [
                        { startIndex: 0, type: 'string.css' },
                        { startIndex: 7, type: '' }
                    ] }
            ]);
        });
        test('CSS key frame animation syntax', function () {
            modesUtil.assertTokenization(tokenizationSupport, [{
                    line: '@-webkit-keyframes infinite-spinning {',
                    tokens: [
                        { startIndex: 0, type: css_1.cssTokenTypes.TOKEN_AT_KEYWORD + '.css' },
                        { startIndex: 18, type: '' },
                        { startIndex: 19, type: css_1.cssTokenTypes.TOKEN_VALUE + '.css' },
                        { startIndex: 36, type: '' },
                        { startIndex: 37, type: 'punctuation.bracket.css', bracket: Modes.Bracket.Open }
                    ] }, {
                    line: '  from {',
                    tokens: [
                        { startIndex: 0, type: '' },
                        { startIndex: 2, type: css_1.cssTokenTypes.TOKEN_SELECTOR_TAG + '.css' },
                        { startIndex: 6, type: '' },
                        { startIndex: 7, type: 'punctuation.bracket.css' }
                    ] }, {
                    line: '  -webkit-transform: rotate(0deg);',
                    tokens: [
                        { startIndex: 0, type: '' },
                        { startIndex: 2, type: css_1.cssTokenTypes.TOKEN_PROPERTY + '.css' },
                        { startIndex: 19, type: 'punctuation.css' },
                        { startIndex: 20, type: '' },
                        { startIndex: 21, type: css_1.cssTokenTypes.TOKEN_VALUE + '.css' },
                        { startIndex: 27, type: 'punctuation.parenthesis.css' },
                        { startIndex: 28, type: css_1.cssTokenTypes.TOKEN_VALUE + '.numeric.css' },
                        { startIndex: 29, type: css_1.cssTokenTypes.TOKEN_VALUE + '.unit.css' },
                        { startIndex: 32, type: 'punctuation.parenthesis.css' },
                        { startIndex: 33, type: 'punctuation.css' }
                    ] }, {
                    line: '	 }',
                    tokens: [
                        { startIndex: 0, type: '' },
                        { startIndex: 2, type: 'punctuation.bracket.css' }
                    ] }, {
                    line: '  to {',
                    tokens: [
                        { startIndex: 0, type: '' },
                        { startIndex: 2, type: css_1.cssTokenTypes.TOKEN_SELECTOR_TAG + '.css' },
                        { startIndex: 4, type: '' },
                        { startIndex: 5, type: 'punctuation.bracket.css' }
                    ] }, {
                    line: '  -webkit-transform: rotate(360deg);',
                    tokens: [
                        { startIndex: 0, type: '' },
                        { startIndex: 2, type: css_1.cssTokenTypes.TOKEN_PROPERTY + '.css' },
                        { startIndex: 19, type: 'punctuation.css' },
                        { startIndex: 20, type: '' },
                        { startIndex: 21, type: css_1.cssTokenTypes.TOKEN_VALUE + '.css' },
                        { startIndex: 27, type: 'punctuation.parenthesis.css' },
                        { startIndex: 28, type: css_1.cssTokenTypes.TOKEN_VALUE + '.numeric.css' },
                        { startIndex: 31, type: css_1.cssTokenTypes.TOKEN_VALUE + '.unit.css' },
                        { startIndex: 34, type: 'punctuation.parenthesis.css' },
                        { startIndex: 35, type: 'punctuation.css' }
                    ] }, {
                    line: '	 }',
                    tokens: [
                        { startIndex: 0, type: '' },
                        { startIndex: 2, type: 'punctuation.bracket.css' }
                    ] }, {
                    line: '}',
                    tokens: [
                        { startIndex: 0, type: 'punctuation.bracket.css' }
                    ] }
            ]);
        });
        test('CSS @import related coloring bug 9553', function () {
            modesUtil.assertTokenization(tokenizationSupport, [{
                    line: '@import url("something.css");',
                    tokens: [
                        { startIndex: 0, type: css_1.cssTokenTypes.TOKEN_AT_KEYWORD + '.css' },
                        { startIndex: 7, type: '' },
                        { startIndex: 8, type: css_1.cssTokenTypes.TOKEN_VALUE + '.css' },
                        { startIndex: 11, type: 'punctuation.parenthesis.css', bracket: Modes.Bracket.Open },
                        { startIndex: 12, type: 'string.css' },
                        { startIndex: 27, type: 'punctuation.parenthesis.css', bracket: Modes.Bracket.Close },
                        { startIndex: 28, type: 'punctuation.css' }
                    ] }, {
                    line: '.rule1{}',
                    tokens: [
                        { startIndex: 0, type: css_1.cssTokenTypes.TOKEN_SELECTOR + '.class.css' },
                        { startIndex: 6, type: 'punctuation.bracket.css', bracket: Modes.Bracket.Open },
                        { startIndex: 7, type: 'punctuation.bracket.css', bracket: Modes.Bracket.Close }
                    ] }, {
                    line: '.rule2{}',
                    tokens: [
                        { startIndex: 0, type: css_1.cssTokenTypes.TOKEN_SELECTOR + '.class.css' },
                        { startIndex: 6, type: 'punctuation.bracket.css', bracket: Modes.Bracket.Open },
                        { startIndex: 7, type: 'punctuation.bracket.css', bracket: Modes.Bracket.Close }
                    ] }
            ]);
        });
        test('Triple quotes - bug #9870', function () {
            modesUtil.assertTokenization(tokenizationSupport, [{
                    line: '"""',
                    tokens: [
                        { startIndex: 0, type: 'string.css' }
                    ] },
                {
                    line: '""""',
                    tokens: [
                        { startIndex: 0, type: 'string.css' }
                    ] },
                {
                    line: '"""""',
                    tokens: [
                        { startIndex: 0, type: 'string.css' }
                    ] }
            ]);
        });
        //	@import url('something.css');@import url('something.css');
        test('import statement - bug #10308', function () {
            modesUtil.assertTokenization(tokenizationSupport, [{
                    line: '@import url("something.css");@import url("something.css");',
                    tokens: [
                        { startIndex: 0, type: css_1.cssTokenTypes.TOKEN_AT_KEYWORD + '.css' },
                        { startIndex: 7, type: '' },
                        { startIndex: 8, type: css_1.cssTokenTypes.TOKEN_VALUE + '.css' },
                        { startIndex: 11, type: 'punctuation.parenthesis.css', bracket: Modes.Bracket.Open },
                        { startIndex: 12, type: 'string.css' },
                        { startIndex: 27, type: 'punctuation.parenthesis.css', bracket: Modes.Bracket.Close },
                        { startIndex: 28, type: 'punctuation.css' },
                        { startIndex: 29, type: css_1.cssTokenTypes.TOKEN_AT_KEYWORD + '.css' },
                        { startIndex: 36, type: '' },
                        { startIndex: 37, type: css_1.cssTokenTypes.TOKEN_VALUE + '.css' },
                        { startIndex: 40, type: 'punctuation.parenthesis.css', bracket: Modes.Bracket.Open },
                        { startIndex: 41, type: 'string.css' },
                        { startIndex: 56, type: 'punctuation.parenthesis.css', bracket: Modes.Bracket.Close },
                        { startIndex: 57, type: 'punctuation.css' }
                    ] }
            ]);
        });
        // .a{background:#f5f9fc !important}.b{font-family:"Helvetica Neue", Helvetica;height:31px;}
        test('!important - bug #9578', function () {
            modesUtil.assertTokenization(tokenizationSupport, [{
                    line: '.a{background:#f5f9fc !important}.b{font-family:"Helvetica Neue", Helvetica;height:31px;}',
                    tokens: [
                        { startIndex: 0, type: css_1.cssTokenTypes.TOKEN_SELECTOR + '.class.css' },
                        { startIndex: 2, type: 'punctuation.bracket.css', bracket: Modes.Bracket.Open },
                        { startIndex: 3, type: css_1.cssTokenTypes.TOKEN_PROPERTY + '.css' },
                        { startIndex: 13, type: 'punctuation.css' },
                        { startIndex: 14, type: css_1.cssTokenTypes.TOKEN_VALUE + '.hex.css' },
                        { startIndex: 21, type: '' },
                        { startIndex: 22, type: css_1.cssTokenTypes.TOKEN_VALUE + '.keyword.css' },
                        { startIndex: 32, type: 'punctuation.bracket.css', bracket: Modes.Bracket.Close },
                        { startIndex: 33, type: css_1.cssTokenTypes.TOKEN_SELECTOR + '.class.css' },
                        { startIndex: 35, type: 'punctuation.bracket.css', bracket: Modes.Bracket.Open },
                        { startIndex: 36, type: css_1.cssTokenTypes.TOKEN_PROPERTY + '.css' },
                        { startIndex: 47, type: 'punctuation.css' },
                        { startIndex: 48, type: 'string.css' },
                        { startIndex: 64, type: 'punctuation.css' },
                        { startIndex: 65, type: '' },
                        { startIndex: 66, type: css_1.cssTokenTypes.TOKEN_VALUE + '.css' },
                        { startIndex: 75, type: 'punctuation.css' },
                        { startIndex: 76, type: css_1.cssTokenTypes.TOKEN_PROPERTY + '.css' },
                        { startIndex: 82, type: 'punctuation.css' },
                        { startIndex: 83, type: css_1.cssTokenTypes.TOKEN_VALUE + '.numeric.css' },
                        { startIndex: 85, type: css_1.cssTokenTypes.TOKEN_VALUE + '.unit.css' },
                        { startIndex: 87, type: 'punctuation.css' },
                        { startIndex: 88, type: 'punctuation.bracket.css', bracket: Modes.Bracket.Close }
                    ] }
            ]);
        });
        //.even { background: #fff url(data:image/gif;base64,R0lGODlhBgASALMAAOfn5+rq6uvr6+zs7O7u7vHx8fPz8/b29vj4+P39/f///wAAAAAAAAAAAAAAAAAAACwAAAAABgASAAAIMAAVCBxIsKDBgwgTDkzAsKGAhxARSJx4oKJFAxgzFtjIkYDHjwNCigxAsiSAkygDAgA7) repeat-x bottom}
        test('base64-encoded data uris - bug #9580', function () {
            modesUtil.assertTokenization(tokenizationSupport, [{
                    line: '.even { background: #fff url(data:image/gif;base64,R0lGODlhBgASALMAAOfn5+rq6uvr6+zs7O7u7vHx8fPz8/b29vj4+P39/f///wAAAAAAAAAAAAAAAAAAACwAAAAABgASAAAIMAAVCBxIsKDBgwgTDkzAsKGAhxARSJx4oKJFAxgzFtjIkYDHjwNCigxAsiSAkygDAgA7) repeat-x bottom}',
                    tokens: [
                        { startIndex: 0, type: css_1.cssTokenTypes.TOKEN_SELECTOR + '.class.css' },
                        { startIndex: 5, type: '' },
                        { startIndex: 6, type: 'punctuation.bracket.css', bracket: Modes.Bracket.Open },
                        { startIndex: 7, type: '' },
                        { startIndex: 8, type: css_1.cssTokenTypes.TOKEN_PROPERTY + '.css' },
                        { startIndex: 18, type: 'punctuation.css' },
                        { startIndex: 19, type: '' },
                        { startIndex: 20, type: css_1.cssTokenTypes.TOKEN_VALUE + '.hex.css' },
                        { startIndex: 24, type: '' },
                        { startIndex: 25, type: css_1.cssTokenTypes.TOKEN_VALUE + '.css' },
                        { startIndex: 28, type: 'punctuation.parenthesis.css', bracket: Modes.Bracket.Open },
                        { startIndex: 29, type: 'string.css' },
                        { startIndex: 215, type: 'punctuation.parenthesis.css', bracket: Modes.Bracket.Close },
                        { startIndex: 216, type: '' },
                        { startIndex: 217, type: css_1.cssTokenTypes.TOKEN_VALUE + '.css' },
                        { startIndex: 225, type: '' },
                        { startIndex: 226, type: css_1.cssTokenTypes.TOKEN_VALUE + '.css' },
                        { startIndex: 232, type: 'punctuation.bracket.css', bracket: Modes.Bracket.Close }
                    ] }
            ]);
        });
        //.a{background:url(/a.jpg)}
        test('a colorization is incorrect in url - bug #9581', function () {
            modesUtil.assertTokenization(tokenizationSupport, [{
                    line: '.a{background:url(/a.jpg)}',
                    tokens: [
                        { startIndex: 0, type: css_1.cssTokenTypes.TOKEN_SELECTOR + '.class.css' },
                        { startIndex: 2, type: 'punctuation.bracket.css', bracket: Modes.Bracket.Open },
                        { startIndex: 3, type: css_1.cssTokenTypes.TOKEN_PROPERTY + '.css' },
                        { startIndex: 13, type: 'punctuation.css' },
                        { startIndex: 14, type: css_1.cssTokenTypes.TOKEN_VALUE + '.css' },
                        { startIndex: 17, type: 'punctuation.parenthesis.css', bracket: Modes.Bracket.Open },
                        { startIndex: 18, type: 'string.css' },
                        { startIndex: 24, type: 'punctuation.parenthesis.css', bracket: Modes.Bracket.Close },
                        { startIndex: 25, type: 'punctuation.bracket.css', bracket: Modes.Bracket.Close }
                    ] }
            ]);
        });
        test('Bracket Matching', function () {
            modesUtil.assertTokenization(tokenizationSupport, [{
                    line: 'p{}',
                    tokens: [
                        { startIndex: 0, type: css_1.cssTokenTypes.TOKEN_SELECTOR_TAG + '.css' },
                        { startIndex: 1, type: 'punctuation.bracket.css', bracket: Modes.Bracket.Open },
                        { startIndex: 2, type: 'punctuation.bracket.css', bracket: Modes.Bracket.Close }
                    ] }
            ]);
        });
        test('Bracket Matching #2', function () {
            modesUtil.assertTokenization(tokenizationSupport, [{
                    line: 'p:nth() {}',
                    tokens: [
                        { startIndex: 0, type: css_1.cssTokenTypes.TOKEN_SELECTOR_TAG + '.css' },
                        { startIndex: 5, type: 'punctuation.parenthesis.css', bracket: Modes.Bracket.Open },
                        { startIndex: 6, type: 'punctuation.parenthesis.css', bracket: Modes.Bracket.Close },
                        { startIndex: 7, type: '' },
                        { startIndex: 8, type: 'punctuation.bracket.css', bracket: Modes.Bracket.Open },
                        { startIndex: 9, type: 'punctuation.bracket.css', bracket: Modes.Bracket.Close }
                    ] }
            ]);
        });
        test('Word definition', function () {
            assertWords('a b cde'.match(wordDefinition), ['a', 'b', 'cde']);
            assertWords('font-family: courier, monospace;'.match(wordDefinition), ['font-family', ':', 'courier', 'monospace']);
            assertWords('border: 1px solid 000000;'.match(wordDefinition), ['border', ':', '1px', 'solid', '000000']);
            assertWords('{font: italic small-caps 900 14px tahoma }'.match(wordDefinition), ['font', ':', 'italic', 'small-caps', '900', '14px', 'tahoma']);
        });
        test('onEnter', function () {
            assertOnEnter.indents('', '.myRule {', '');
            assertOnEnter.indents('', 'background: url(', '');
            assertOnEnter.indents('', '.myRule[', '');
            assertOnEnter.indentsOutdents('', '.myRule {', '}');
        });
        test('identifier escaping', function () {
            modesUtil.assertTokenization(tokenizationSupport, [{
                    line: 'input[type= \\"submit\\"',
                    tokens: [
                        { startIndex: 0, type: css_1.cssTokenTypes.TOKEN_SELECTOR_TAG + '.css' },
                        { startIndex: 5, type: 'punctuation.css' },
                        { startIndex: 6, type: css_1.cssTokenTypes.TOKEN_SELECTOR_TAG + '.css' },
                        { startIndex: 10, type: 'punctuation.css' },
                        { startIndex: 11, type: '' },
                        { startIndex: 12, type: css_1.cssTokenTypes.TOKEN_SELECTOR_TAG + '.css' }
                    ] }
            ]);
        });
        test('identifier escaping2, bug 19945', function () {
            modesUtil.assertTokenization(tokenizationSupport, [{
                    line: '.rule {\\',
                    tokens: [
                        { startIndex: 0, type: css_1.cssTokenTypes.TOKEN_SELECTOR + '.class.css' },
                        { startIndex: 5, type: '' },
                        { startIndex: 6, type: 'punctuation.bracket.css', bracket: Modes.Bracket.Open },
                        { startIndex: 7, type: css_1.cssTokenTypes.TOKEN_PROPERTY + '.css' }
                    ] }
            ]);
        });
    });
});
//# sourceMappingURL=css.test.js.map