import { DebugProtocol } from 'vscode-debugprotocol';
import { IDebugTransformer, ISetBreakpointsArgs, ILaunchRequestArgs, IAttachRequestArgs, ISetBreakpointsResponseBody, IStackTraceResponseBody } from '../chrome/debugAdapterInterfaces';
/**
 * If sourcemaps are enabled, converts from source files on the client side to runtime files on the target side
 */
export declare class SourceMapTransformer implements IDebugTransformer {
    private _sourceMaps;
    private _requestSeqToSetBreakpointsArgs;
    private _allRuntimeScriptPaths;
    private _pendingBreakpointsByPath;
    private _webRoot;
    private _authoredPathsToMappedBPLines;
    private _authoredPathsToMappedBPCols;
    launch(args: ILaunchRequestArgs): void;
    attach(args: IAttachRequestArgs): void;
    private init(args);
    clearTargetContext(): void;
    /**
     * Apply sourcemapping to the setBreakpoints request path/lines
     */
    setBreakpoints(args: ISetBreakpointsArgs, requestSeq: number): Promise<void>;
    /**
     * Apply sourcemapping back to authored files from the response
     */
    setBreakpointsResponse(response: ISetBreakpointsResponseBody, requestSeq: number): void;
    /**
     * Apply sourcemapping to the stacktrace response
     */
    stackTraceResponse(response: IStackTraceResponseBody): void;
    scriptParsed(event: DebugProtocol.Event): void;
    /**
     * Resolve any pending breakpoints for this script
     */
    private resolvePendingBreakpointsForScript(scriptUrl);
}
