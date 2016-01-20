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
define(["require", "exports", 'vs/base/common/winjs.base', 'vs/base/common/platform', 'vs/base/common/types', 'vs/base/common/actions', 'vs/base/browser/ui/dropdown/dropdown'], function (require, exports, WinJS, Platform, Types, Actions, Dropdown) {
    var LinksDropdownMenu = (function (_super) {
        __extends(LinksDropdownMenu, _super);
        function LinksDropdownMenu(container, options) {
            _super.call(this, container, options);
            this.tooltip = options.tooltip;
        }
        /*protected*/ LinksDropdownMenu.prototype.onEvent = function (e, activeElement) {
            if (e instanceof KeyboardEvent && (e.ctrlKey || (Platform.isMacintosh && e.metaKey))) {
                return; // allow to use Ctrl/Meta in workspace dropdown menu
            }
            this.hide();
        };
        return LinksDropdownMenu;
    })(Dropdown.DropdownMenu);
    exports.LinksDropdownMenu = LinksDropdownMenu;
    var LinkDropdownAction = (function (_super) {
        __extends(LinkDropdownAction, _super);
        function LinkDropdownAction(id, name, clazz, url, forceOpenInNewTab) {
            _super.call(this, id, name, clazz, true, function (e) {
                var urlString = url;
                if (Types.isFunction(url)) {
                    urlString = url();
                }
                if (forceOpenInNewTab || (e instanceof MouseEvent && (e.ctrlKey || (Platform.isMacintosh && e.metaKey)))) {
                    window.open(urlString, '_blank');
                }
                else {
                    window.location.href = urlString;
                }
                return WinJS.Promise.as(true);
            });
        }
        return LinkDropdownAction;
    })(Actions.Action);
    exports.LinkDropdownAction = LinkDropdownAction;
});
//# sourceMappingURL=linksDropdown.js.map