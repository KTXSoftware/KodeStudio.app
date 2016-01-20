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
define(["require", "exports", 'assert', 'vs/editor/common/modes/textToHtmlTokenizer', 'vs/editor/common/modes/abstractState', 'vs/editor/common/modes/supports'], function (require, exports, assert, textToHtmlTokenizer_1, abstractState_1, supports) {
    suite('Editor Modes - textToHtmlTokenizer', function () {
        test('TextToHtmlTokenizer', function () {
            var mode = new Mode();
            var result = textToHtmlTokenizer_1.tokenizeToHtmlContent('.abc..def...gh', mode);
            assert.ok(!!result);
            var children = result.children;
            assert.equal(children.length, 6);
            assert.equal(children[0].text, '.');
            assert.equal(children[0].className, 'token');
            assert.equal(children[0].tagName, 'span');
            assert.equal(children[1].text, 'abc');
            assert.equal(children[1].className, 'token text');
            assert.equal(children[1].tagName, 'span');
            assert.equal(children[2].text, '..');
            assert.equal(children[2].className, 'token');
            assert.equal(children[2].tagName, 'span');
            assert.equal(children[3].text, 'def');
            assert.equal(children[3].className, 'token text');
            assert.equal(children[3].tagName, 'span');
            assert.equal(children[4].text, '...');
            assert.equal(children[4].className, 'token');
            assert.equal(children[4].tagName, 'span');
            assert.equal(children[5].text, 'gh');
            assert.equal(children[5].className, 'token text');
            assert.equal(children[5].tagName, 'span');
            result = textToHtmlTokenizer_1.tokenizeToHtmlContent('.abc..def...gh\n.abc..def...gh', mode);
            assert.ok(!!result);
            children = result.children;
            assert.equal(children.length, 12 + 1 /* +1 for the line break */);
            assert.equal(children[6].tagName, 'br');
        });
    });
    var State = (function (_super) {
        __extends(State, _super);
        function State(mode) {
            _super.call(this, mode);
        }
        State.prototype.makeClone = function () {
            return new State(this.getMode());
        };
        State.prototype.tokenize = function (stream) {
            return { type: stream.next() === '.' ? '' : 'text' };
        };
        return State;
    })(abstractState_1.AbstractState);
    var Mode = (function () {
        function Mode() {
            var _this = this;
            this.tokenizationSupport = new supports.TokenizationSupport(this, {
                getInitialState: function () { return new State(_this); }
            }, false, false);
        }
        Mode.prototype.getId = function () {
            return "testMode";
        };
        Mode.prototype.toSimplifiedMode = function () {
            return this;
        };
        return Mode;
    })();
});
//# sourceMappingURL=textToHtmlTokenizer.test.js.map