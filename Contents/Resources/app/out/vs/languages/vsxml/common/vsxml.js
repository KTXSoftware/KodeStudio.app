/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
/* In order to use VSXML in your own modes, you need to have an IState
 * which implements IVSXMLWrapperState. Upon a START token such as '///',
 * the wrapper state can return a new VSXMLEmbeddedState as the nextState in
 * the tokenization result.
*/
'use strict';
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
define(["require", "exports", 'vs/base/common/objects', 'vs/base/common/errors', 'vs/editor/common/modes/abstractState', 'vs/languages/vsxml/common/vsxmlTokenTypes'], function (require, exports, objects, errors, abstractState_1, vsxmlTokenTypes) {
    var separators = '<>"=/';
    var whitespace = '\t ';
    var isEntity = objects.createKeywordMatcher(['summary', 'reference', 'returns', 'param', 'loc']);
    var isAttribute = objects.createKeywordMatcher(['type', 'path', 'name', 'locid', 'filename', 'format', 'optional']);
    var isSeparator = objects.createKeywordMatcher(separators.split(''));
    var EmbeddedState = (function (_super) {
        __extends(EmbeddedState, _super);
        function EmbeddedState(mode, state, parentState) {
            _super.call(this, mode);
            this.state = state;
            this.parentState = parentState;
        }
        EmbeddedState.prototype.getParentState = function () {
            return this.parentState;
        };
        EmbeddedState.prototype.makeClone = function () {
            return new EmbeddedState(this.getMode(), abstractState_1.AbstractState.safeClone(this.state), abstractState_1.AbstractState.safeClone(this.parentState));
        };
        EmbeddedState.prototype.equals = function (other) {
            if (other instanceof EmbeddedState) {
                return (_super.prototype.equals.call(this, other) &&
                    abstractState_1.AbstractState.safeEquals(this.state, other.state) &&
                    abstractState_1.AbstractState.safeEquals(this.parentState, other.parentState));
            }
            return false;
        };
        EmbeddedState.prototype.setState = function (nextState) {
            this.state = nextState;
        };
        EmbeddedState.prototype.postTokenize = function (result, stream) {
            return result;
        };
        EmbeddedState.prototype.tokenize = function (stream) {
            var result = this.state.tokenize(stream);
            if (result.nextState !== undefined) {
                this.setState(result.nextState);
            }
            result.nextState = this;
            return this.postTokenize(result, stream);
        };
        return EmbeddedState;
    })(abstractState_1.AbstractState);
    exports.EmbeddedState = EmbeddedState;
    var VSXMLEmbeddedState = (function (_super) {
        __extends(VSXMLEmbeddedState, _super);
        function VSXMLEmbeddedState(mode, state, parentState) {
            _super.call(this, mode, state, parentState);
        }
        VSXMLEmbeddedState.prototype.equals = function (other) {
            if (other instanceof VSXMLEmbeddedState) {
                return (_super.prototype.equals.call(this, other));
            }
            return false;
        };
        VSXMLEmbeddedState.prototype.setState = function (nextState) {
            _super.prototype.setState.call(this, nextState);
            this.getParentState().setVSXMLState(nextState);
        };
        VSXMLEmbeddedState.prototype.postTokenize = function (result, stream) {
            if (stream.eos()) {
                result.nextState = this.getParentState();
            }
            return result;
        };
        return VSXMLEmbeddedState;
    })(EmbeddedState);
    exports.VSXMLEmbeddedState = VSXMLEmbeddedState;
    var VSXMLState = (function (_super) {
        __extends(VSXMLState, _super);
        function VSXMLState(mode, name, parent, whitespaceTokenType) {
            if (whitespaceTokenType === void 0) { whitespaceTokenType = ''; }
            _super.call(this, mode);
            this.name = name;
            this.parent = parent;
            this.whitespaceTokenType = whitespaceTokenType;
        }
        VSXMLState.prototype.equals = function (other) {
            if (other instanceof VSXMLState) {
                return (_super.prototype.equals.call(this, other) &&
                    this.whitespaceTokenType === other.whitespaceTokenType &&
                    this.name === other.name &&
                    abstractState_1.AbstractState.safeEquals(this.parent, other.parent));
            }
            return false;
        };
        VSXMLState.prototype.tokenize = function (stream) {
            stream.setTokenRules(separators, whitespace);
            if (stream.skipWhitespace().length > 0) {
                return { type: this.whitespaceTokenType };
            }
            return this.stateTokenize(stream);
        };
        VSXMLState.prototype.stateTokenize = function (stream) {
            throw errors.notImplemented();
        };
        return VSXMLState;
    })(abstractState_1.AbstractState);
    exports.VSXMLState = VSXMLState;
    var VSXMLString = (function (_super) {
        __extends(VSXMLString, _super);
        function VSXMLString(mode, parent) {
            _super.call(this, mode, 'string', parent, vsxmlTokenTypes.TOKEN_VALUE);
        }
        VSXMLString.prototype.makeClone = function () {
            return new VSXMLString(this.getMode(), this.parent ? this.parent.clone() : null);
        };
        VSXMLString.prototype.equals = function (other) {
            if (other instanceof VSXMLString) {
                return (_super.prototype.equals.call(this, other));
            }
            return false;
        };
        VSXMLString.prototype.stateTokenize = function (stream) {
            while (!stream.eos()) {
                var token = stream.nextToken();
                if (token === '"') {
                    return { type: vsxmlTokenTypes.TOKEN_VALUE, nextState: this.parent };
                }
            }
            return { type: vsxmlTokenTypes.TOKEN_VALUE, nextState: this.parent };
        };
        return VSXMLString;
    })(VSXMLState);
    exports.VSXMLString = VSXMLString;
    var VSXMLTag = (function (_super) {
        __extends(VSXMLTag, _super);
        function VSXMLTag(mode, parent) {
            _super.call(this, mode, 'expression', parent, 'vs');
        }
        VSXMLTag.prototype.makeClone = function () {
            return new VSXMLTag(this.getMode(), this.parent ? this.parent.clone() : null);
        };
        VSXMLTag.prototype.equals = function (other) {
            if (other instanceof VSXMLTag) {
                return (_super.prototype.equals.call(this, other));
            }
            return false;
        };
        VSXMLTag.prototype.stateTokenize = function (stream) {
            var token = stream.nextToken();
            var tokenType = this.whitespaceTokenType;
            if (token === '>') {
                return { type: 'punctuation.vs', nextState: this.parent };
            }
            else if (token === '"') {
                return { type: vsxmlTokenTypes.TOKEN_VALUE, nextState: new VSXMLString(this.getMode(), this) };
            }
            else if (isEntity(token)) {
                tokenType = 'tag.vs';
            }
            else if (isAttribute(token)) {
                tokenType = vsxmlTokenTypes.TOKEN_KEY;
            }
            else if (isSeparator(token)) {
                tokenType = 'punctuation.vs';
            }
            return { type: tokenType, nextState: this };
        };
        return VSXMLTag;
    })(VSXMLState);
    exports.VSXMLTag = VSXMLTag;
    var VSXMLExpression = (function (_super) {
        __extends(VSXMLExpression, _super);
        function VSXMLExpression(mode, parent) {
            _super.call(this, mode, 'expression', parent, 'vs');
        }
        VSXMLExpression.prototype.makeClone = function () {
            return new VSXMLExpression(this.getMode(), this.parent ? this.parent.clone() : null);
        };
        VSXMLExpression.prototype.equals = function (other) {
            if (other instanceof VSXMLExpression) {
                return (_super.prototype.equals.call(this, other));
            }
            return false;
        };
        VSXMLExpression.prototype.stateTokenize = function (stream) {
            var token = stream.nextToken();
            if (token === '<') {
                return { type: 'punctuation.vs', nextState: new VSXMLTag(this.getMode(), this) };
            }
            return { type: this.whitespaceTokenType, nextState: this };
        };
        return VSXMLExpression;
    })(VSXMLState);
    exports.VSXMLExpression = VSXMLExpression;
});
//# sourceMappingURL=vsxml.js.map