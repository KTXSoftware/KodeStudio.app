/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
'use strict';
define(["require", "exports", 'vs/base/common/platform', 'vs/workbench/parts/execution/electron-browser/executionService', 'vs/workbench/parts/execution/electron-browser/terminalService', 'vs/platform/instantiation/common/extensions', 'vs/workbench/parts/execution/common/execution'], function (require, exports, env, executionService_1, terminalService_1, extensions_1, execution_1) {
    if (env.isWindows) {
        extensions_1.registerSingleton(execution_1.IExecutionService, executionService_1.WinExecutionService);
        extensions_1.registerSingleton(execution_1.ITerminalService, terminalService_1.WinTerminalService);
    }
    else if (env.isMacintosh) {
        extensions_1.registerSingleton(execution_1.IExecutionService, executionService_1.MacExecutionService);
        extensions_1.registerSingleton(execution_1.ITerminalService, terminalService_1.MacTerminalService);
    }
    else if (env.isLinux) {
        extensions_1.registerSingleton(execution_1.IExecutionService, executionService_1.LinuxExecutionService);
        extensions_1.registerSingleton(execution_1.ITerminalService, terminalService_1.LinuxTerminalService);
    }
});
//# sourceMappingURL=execution.contribution.js.map