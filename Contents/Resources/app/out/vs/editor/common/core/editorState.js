/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
'use strict';
define(["require", "exports", 'vs/base/common/strings', 'vs/editor/common/editorCommon'], function (require, exports, Strings, EditorCommon) {
    var EditorState = (function () {
        function EditorState(editor, flags) {
            var _this = this;
            this.flags = flags;
            flags.forEach(function (flag) {
                switch (flag) {
                    case EditorCommon.CodeEditorStateFlag.Value:
                        var model = editor.getModel();
                        _this.modelVersionId = model ? Strings.format('{0}#{1}', model.getAssociatedResource().toString(), model.getVersionId()) : null;
                        break;
                    case EditorCommon.CodeEditorStateFlag.Position:
                        _this.position = editor.getPosition();
                        break;
                    case EditorCommon.CodeEditorStateFlag.Selection:
                        _this.selection = editor.getSelection();
                        break;
                    case EditorCommon.CodeEditorStateFlag.Scroll:
                        _this.scrollLeft = editor.getScrollLeft();
                        _this.scrollTop = editor.getScrollTop();
                        break;
                }
            });
        }
        EditorState.prototype._equals = function (other) {
            if (!(other instanceof EditorState)) {
                return false;
            }
            var state = other;
            if (this.modelVersionId !== state.modelVersionId) {
                return false;
            }
            if (this.scrollLeft !== state.scrollLeft || this.scrollTop !== state.scrollTop) {
                return false;
            }
            if (!this.position && state.position || this.position && !state.position || this.position && state.position && !this.position.equals(state.position)) {
                return false;
            }
            if (!this.selection && state.selection || this.selection && !state.selection || this.selection && state.selection && !this.selection.equalsRange(state.selection)) {
                return false;
            }
            return true;
        };
        EditorState.prototype.validate = function (editor) {
            return this._equals(new EditorState(editor, this.flags));
        };
        return EditorState;
    })();
    exports.EditorState = EditorState;
});
//# sourceMappingURL=editorState.js.map