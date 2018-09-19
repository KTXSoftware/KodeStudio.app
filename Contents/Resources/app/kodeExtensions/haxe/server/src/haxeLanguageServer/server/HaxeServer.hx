package haxeLanguageServer.server;

import haxe.Json;
import js.Promise;
import js.node.Net;
import js.node.net.Socket;
import js.node.net.Server;
import js.node.child_process.ChildProcess as ChildProcessObject;
import js.node.child_process.ChildProcess.ChildProcessEvent;
import js.node.Buffer;
import js.node.ChildProcess;
import js.node.stream.Readable;
import jsonrpc.CancellationToken;
import haxeLanguageServer.helper.SemVer;
import haxeLanguageServer.protocol.Server.ServerMethods;
import haxeLanguageServer.protocol.Protocol;

class HaxeServer {
	final context:Context;
	var proc:ChildProcessObject;
	var buffer:MessageBuffer;
	var nextMessageLength:Int;
	var requestsHead:DisplayRequest;
	var requestsTail:DisplayRequest;
	var currentRequest:DisplayRequest;
	var socketListener:js.node.net.Server;
	var stopProgressCallback:Void->Void;
	var startRequest:Void->Void;
	var crashes:Int = 0;
	var supportedMethods:Array<String>;

	public var version(default, null):SemVer;

	public function new(context:Context) {
		this.context = context;
	}

	static final reTrailingNewline = ~/\r?\n$/;

	public function start(?callback:Void->Void) {
		// we still have requests in our queue that are not cancelable, such as a build - try again later
		if (hasNonCancellableRequests()) {
			startRequest = callback;
			return;
		}

		supportedMethods = [];
		startRequest = null;
		stop();

		inline function error(s)
			context.sendShowMessage(Error, s);

		var env = new haxe.DynamicAccess();
		for (key in js.Node.process.env.keys())
			env[key] = js.Node.process.env[key];
		for (key in context.displayServerConfig.env.keys())
			env[key] = context.displayServerConfig.env[key];

		var haxePath = context.displayServerConfig.path;
		var checkRun = ChildProcess.spawnSync(haxePath, ["-version"], {env: env});
		if (checkRun.error != null) {
			if (checkRun.error.message.indexOf("ENOENT") >= 0) {
				if (haxePath == "haxe") // default
					return error("Could not find Haxe in PATH. Is it installed?");
				else
					return error('Path to Haxe executable is not valid: \'$haxePath\'. Please check your settings.');
			}
			return error('Error starting Haxe server: ${checkRun.error}');
		}

		var output = (checkRun.stderr : Buffer).toString().trim();
		if (output == "")
			output = (checkRun.stdout : Buffer).toString().trim(); // haxe 4.0 prints -version output to stdout instead

		if (checkRun.status != 0)
			return error("Haxe version check failed: " + output);

		version = SemVer.parse(output);
		if (version == null)
			return error("Error parsing Haxe version " + haxe.Json.stringify(output));

		var isVersionSupported = version >= new SemVer(3, 4, 0);
		if (!isVersionSupported)
			return error('Unsupported Haxe version! Minimum required: 3.4.0. Found: $version.');

		buffer = new MessageBuffer();
		nextMessageLength = -1;

		proc = ChildProcess.spawn(context.displayServerConfig.path, context.displayServerConfig.arguments.concat(["--wait", "stdio"]), {env: env});

		proc.stdout.on(ReadableEvent.Data, function(buf:Buffer) {
			context.sendLogMessage(Log, reTrailingNewline.replace(buf.toString(), ""));
		});
		proc.stderr.on(ReadableEvent.Data, onData);
		proc.on(ChildProcessEvent.Exit, onExit);

		function onInitComplete() {
			stopProgress();
			buildCompletionCache();
			if (callback != null)
				callback();
		}

		stopProgressCallback = context.startProgress("Initializing Haxe/JSON-RPC protocol");
		context.callHaxeMethod(Methods.Initialize, {supportsResolve: true}, null, result -> {
			supportedMethods = result.methods;
			configure();
			onInitComplete();
			return null;
		}, error -> {
			// the "invalid format" error is expected for Haxe versions <= 4.0.0-preview.3
			if (error.startsWith("Error: Invalid format")) {
				trace("Haxe version does not support JSON-RPC, using legacy --display API.");
			} else {
				trace(error);
			}
			onInitComplete();
		});

		var displayPort = context.config.displayPort;
		if (socketListener == null && displayPort != null) {
			if (displayPort == "auto") {
				getAvailablePort(6000).then(startSocketServer);
			} else {
				startSocketServer(displayPort);
			}
		}
	}

	function configure() {
		context.callHaxeMethod(ServerMethods.Configure, {noModuleChecks: true, print: context.displayServerConfig.print}, null, _ -> null, error -> {
			trace("Error during " + ServerMethods.Configure + " " + error);
		});
	}

	function buildCompletionCache() {
		if (!context.config.buildCompletionCache || context.displayArguments == null)
			return;

		startCompletionInitializationProgress("Building Cache");
		process("cache build", context.displayArguments.concat(["--no-output"]), null, true, null, Processed(function(_) {
			stopProgress();
			if (supports(ServerMethods.ReadClassPaths)) {
				readClassPaths();
			} else {
				trace("Done.");
			}
		}, function(error) {
			context.protocol.sendNotification(LanguageServerMethods.CacheBuildFailed);
			stopProgress();
			trace("Failed - try fixing the error(s) and restarting the language server:\n\n" + error);
		}));
	}

	function readClassPaths() {
		startCompletionInitializationProgress("Parsing Classpaths");
		context.callHaxeMethod(ServerMethods.ReadClassPaths, null, null, _ -> {
			stopProgress();
			trace("Done.");
			return null;
		}, error -> {
			stopProgress();
			trace("Failed - " + error);
		});
	}

	function startCompletionInitializationProgress(message:String) {
		stopProgressCallback = context.startProgress(message);
		trace(message + "...");
	}

	function hasNonCancellableRequests():Bool {
		if (currentRequest != null && !currentRequest.cancellable)
			return true;

		var request = requestsHead;
		while (request != null) {
			if (!request.cancellable) {
				return true;
			}
			request = request.next;
		}

		return false;
	}

	// https://gist.github.com/mikeal/1840641#gistcomment-2337132
	function getAvailablePort(startingAt:Int):Promise<Int> {
		function getNextAvailablePort(currentPort:Int, cb:Int->Void) {
			var server = Net.createServer();
			server.listen(currentPort, "localhost", () -> {
				server.once(ServerEvent.Close, cb.bind(currentPort));
				server.close();
			});
			server.on(ServerEvent.Error, _ -> getNextAvailablePort(currentPort + 1, cb));
		}

		return new Promise((resolve, reject) -> getNextAvailablePort(startingAt, resolve));
	}

	public function startSocketServer(port:Int) {
		if (socketListener != null) {
			socketListener.close();
		}
		socketListener = Net.createServer(function(socket) {
			trace("Client connected");
			socket.on(SocketEvent.Data, function(data:Buffer) {
				var s = data.toString();
				var split = s.split("\n");
				split.pop(); // --connect passes extra \0
				function callback(result:DisplayResult) {
					switch (result) {
						case DResult(data):
							socket.write(data);
						case DCancelled:
					}
					socket.end();
					socket.destroy();
					trace("Client disconnected");
				}
				process("compilation", split, null, false, null, Raw(callback));
			});
			socket.on(SocketEvent.Error, function(err) {
				trace("Socket error: " + err);
			});
		});
		socketListener.listen(port, "localhost");
		context.sendLogMessage(Log, 'Listening on port $port');
		context.protocol.sendNotification(LanguageServerMethods.DidChangeDisplayPort, {port: port});
	}

	public function stop() {
		if (proc != null) {
			proc.removeAllListeners();
			proc.kill();
			proc = null;
		}

		stopProgress();

		// cancel all callbacks
		var request = requestsHead;
		while (request != null) {
			request.cancel();
			request = request.next;
		}

		requestsHead = requestsTail = currentRequest = null;
		updateRequestQueue();
	}

	function stopProgress() {
		if (stopProgressCallback != null) {
			stopProgressCallback();
		}
		stopProgressCallback = null;
	}

	public function restart(reason:String, ?callback:Void->Void) {
		context.sendLogMessage(Log, 'Haxe server restart requested: $reason');
		start(function() {
			context.sendLogMessage(Log, 'Restarted Haxe server: $reason');
			if (callback != null)
				callback();
		});
	}

	function onExit(_, _) {
		crashes++;
		if (crashes < 3) {
			restart("Haxe process was killed");
			return;
		}

		var haxeResponse = buffer.getContent();

		// invalid compiler argument?
		var invalidOptionRegex = ~/unknown option `(.*?)'./;
		if (invalidOptionRegex.match(haxeResponse)) {
			var option = invalidOptionRegex.matched(1);
			context.sendShowMessage(Error, 'Invalid compiler argument \'$option\' detected. ' +
				'Please verify "haxe.displayConfigurations" and "haxe.displayServer.arguments".');
			return;
		}

		context.sendShowMessage(Error,
			"Haxe process has crashed 3 times, not attempting any more restarts. Please check the output channel for the full error.");
		trace("\nError message from the compiler:\n");
		trace(haxeResponse);
	}

	function onData(data:Buffer) {
		buffer.append(data);
		while (true) {
			if (nextMessageLength == -1) {
				var length = buffer.tryReadLength();
				if (length == -1)
					return;
				nextMessageLength = length;
			}
			var msg = buffer.tryReadContent(nextMessageLength);
			if (msg == null)
				return;
			nextMessageLength = -1;
			if (currentRequest != null) {
				var request = currentRequest;
				currentRequest = null;
				request.onData(msg);
				updateRequestQueue();
				checkQueue();
			}
		}
	}

	public function process(label:String, args:Array<String>, token:CancellationToken, cancellable:Bool, stdin:String, handler:ResultHandler) {
		// create a request object
		var request = new DisplayRequest(label, args, token, cancellable, stdin, handler);

		// if the request is cancellable, set a cancel callback to remove request from queue
		if (token != null) {
			token.setCallback(function() {
				if (request == currentRequest)
					return; // currently processing requests can't be canceled

				// remove from the queue
				if (request == requestsHead)
					requestsHead = request.next;
				if (request == requestsTail)
					requestsTail = request.prev;
				if (request.prev != null)
					request.prev.next = request.next;
				if (request.next != null)
					request.next.prev = request.prev;

				// notify about the cancellation
				request.cancel();
				updateRequestQueue();
			});
		}

		// add to the queue
		if (requestsHead == null) {
			requestsHead = requestsTail = request;
		} else {
			requestsTail.next = request;
			request.prev = requestsTail;
			requestsTail = request;
		}

		// process the queue
		checkQueue();
		updateRequestQueue();
	}

	function checkQueue() {
		// a restart has been requested
		if (startRequest != null) {
			start(startRequest);
			return;
		}

		// there's a currently processing request, wait and don't send another one to Haxe
		if (currentRequest != null)
			return;

		// pop the first request still in queue, set it as current and send to Haxe
		if (requestsHead != null) {
			currentRequest = requestsHead;
			requestsHead = currentRequest.next;
			updateRequestQueue();
			proc.stdin.write(currentRequest.prepareBody());
		}
	}

	public function supports<P, R>(method:HaxeRequestMethod<P, R>) {
		return supportedMethods.indexOf(method) != -1;
	}

	function updateRequestQueue() {
		if (!context.sendMethodResults) {
			return;
		}
		var queue = [];
		var request = currentRequest;
		while (request != null) {
			queue.push(request.label);
			request = request.next;
		}
		context.protocol.sendNotification(LanguageServerMethods.DidChangeRequestQueue, {queue: queue});
	}
}
