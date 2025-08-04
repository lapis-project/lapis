function _toConsumableArray(r) {
	return (
		_arrayWithoutHoles(r) ||
		_iterableToArray(r) ||
		_unsupportedIterableToArray(r) ||
		_nonIterableSpread()
	);
}
function _nonIterableSpread() {
	throw new TypeError(
		"Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.",
	);
}
function _iterableToArray(r) {
	if (("undefined" != typeof Symbol && null != r[Symbol.iterator]) || null != r["@@iterator"])
		return Array.from(r);
}
function _arrayWithoutHoles(r) {
	if (Array.isArray(r)) return _arrayLikeToArray(r);
}
function ownKeys(e, r) {
	var t = Object.keys(e);
	if (Object.getOwnPropertySymbols) {
		var o = Object.getOwnPropertySymbols(e);
		(r &&
			(o = o.filter(function (r) {
				return Object.getOwnPropertyDescriptor(e, r).enumerable;
			})),
			t.push.apply(t, o));
	}
	return t;
}
function _objectSpread(e) {
	for (var r = 1; r < arguments.length; r++) {
		var t = null != arguments[r] ? arguments[r] : {};
		r % 2
			? ownKeys(Object(t), !0).forEach(function (r) {
					_defineProperty(e, r, t[r]);
				})
			: Object.getOwnPropertyDescriptors
				? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t))
				: ownKeys(Object(t)).forEach(function (r) {
						Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r));
					});
	}
	return e;
}
function _defineProperty(e, r, t) {
	return (
		(r = _toPropertyKey(r)) in e
			? Object.defineProperty(e, r, { value: t, enumerable: !0, configurable: !0, writable: !0 })
			: (e[r] = t),
		e
	);
}
function _typeof(o) {
	"@babel/helpers - typeof";
	return (
		(_typeof =
			"function" == typeof Symbol && "symbol" == typeof Symbol.iterator
				? function (o) {
						return typeof o;
					}
				: function (o) {
						return o &&
							"function" == typeof Symbol &&
							o.constructor === Symbol &&
							o !== Symbol.prototype
							? "symbol"
							: typeof o;
					}),
		_typeof(o)
	);
}
function _createForOfIteratorHelper(r, e) {
	var t = ("undefined" != typeof Symbol && r[Symbol.iterator]) || r["@@iterator"];
	if (!t) {
		if (
			Array.isArray(r) ||
			(t = _unsupportedIterableToArray(r)) ||
			(e && r && "number" == typeof r.length)
		) {
			t && (r = t);
			var _n = 0,
				F = function F() {};
			return {
				s: F,
				n: function n() {
					return _n >= r.length ? { done: !0 } : { done: !1, value: r[_n++] };
				},
				e: function e(r) {
					throw r;
				},
				f: F,
			};
		}
		throw new TypeError(
			"Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.",
		);
	}
	var o,
		a = !0,
		u = !1;
	return {
		s: function s() {
			t = t.call(r);
		},
		n: function n() {
			var r = t.next();
			return ((a = r.done), r);
		},
		e: function e(r) {
			((u = !0), (o = r));
		},
		f: function f() {
			try {
				a || null == t["return"] || t["return"]();
			} finally {
				if (u) throw o;
			}
		},
	};
}
function _slicedToArray(r, e) {
	return (
		_arrayWithHoles(r) ||
		_iterableToArrayLimit(r, e) ||
		_unsupportedIterableToArray(r, e) ||
		_nonIterableRest()
	);
}
function _nonIterableRest() {
	throw new TypeError(
		"Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.",
	);
}
function _unsupportedIterableToArray(r, a) {
	if (r) {
		if ("string" == typeof r) return _arrayLikeToArray(r, a);
		var t = {}.toString.call(r).slice(8, -1);
		return (
			"Object" === t && r.constructor && (t = r.constructor.name),
			"Map" === t || "Set" === t
				? Array.from(r)
				: "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t)
					? _arrayLikeToArray(r, a)
					: void 0
		);
	}
}
function _arrayLikeToArray(r, a) {
	(null == a || a > r.length) && (a = r.length);
	for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e];
	return n;
}
function _iterableToArrayLimit(r, l) {
	var t =
		null == r ? null : ("undefined" != typeof Symbol && r[Symbol.iterator]) || r["@@iterator"];
	if (null != t) {
		var e,
			n,
			i,
			u,
			a = [],
			f = !0,
			o = !1;
		try {
			if (((i = (t = t.call(r)).next), 0 === l)) {
				if (Object(t) !== t) return;
				f = !1;
			} else for (; !(f = (e = i.call(t)).done) && (a.push(e.value), a.length !== l); f = !0);
		} catch (r) {
			((o = !0), (n = r));
		} finally {
			try {
				if (!f && null != t["return"] && ((u = t["return"]()), Object(u) !== u)) return;
			} finally {
				if (o) throw n;
			}
		}
		return a;
	}
}
function _arrayWithHoles(r) {
	if (Array.isArray(r)) return r;
}
function _defineProperties(e, r) {
	for (var t = 0; t < r.length; t++) {
		var o = r[t];
		((o.enumerable = o.enumerable || !1),
			(o.configurable = !0),
			"value" in o && (o.writable = !0),
			Object.defineProperty(e, _toPropertyKey(o.key), o));
	}
}
function _createClass(e, r, t) {
	return (
		r && _defineProperties(e.prototype, r),
		t && _defineProperties(e, t),
		Object.defineProperty(e, "prototype", { writable: !1 }),
		e
	);
}
function _toPropertyKey(t) {
	var i = _toPrimitive(t, "string");
	return "symbol" == _typeof(i) ? i : i + "";
}
function _toPrimitive(t, r) {
	if ("object" != _typeof(t) || !t) return t;
	var e = t[Symbol.toPrimitive];
	if (void 0 !== e) {
		var i = e.call(t, r || "default");
		if ("object" != _typeof(i)) return i;
		throw new TypeError("@@toPrimitive must return a primitive value.");
	}
	return ("string" === r ? String : Number)(t);
}
function _classCallCheck(a, n) {
	if (!(a instanceof n)) throw new TypeError("Cannot call a class as a function");
}
function _callSuper(t, o, e) {
	return (
		(o = _getPrototypeOf(o)),
		_possibleConstructorReturn(
			t,
			_isNativeReflectConstruct()
				? Reflect.construct(o, e || [], _getPrototypeOf(t).constructor)
				: o.apply(t, e),
		)
	);
}
function _possibleConstructorReturn(t, e) {
	if (e && ("object" == _typeof(e) || "function" == typeof e)) return e;
	if (void 0 !== e) throw new TypeError("Derived constructors may only return object or undefined");
	return _assertThisInitialized(t);
}
function _assertThisInitialized(e) {
	if (void 0 === e)
		throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
	return e;
}
function _inherits(t, e) {
	if ("function" != typeof e && null !== e)
		throw new TypeError("Super expression must either be null or a function");
	((t.prototype = Object.create(e && e.prototype, {
		constructor: { value: t, writable: !0, configurable: !0 },
	})),
		Object.defineProperty(t, "prototype", { writable: !1 }),
		e && _setPrototypeOf(t, e));
}
function _wrapNativeSuper(t) {
	var r = "function" == typeof Map ? new Map() : void 0;
	return (
		(_wrapNativeSuper = function _wrapNativeSuper(t) {
			if (null === t || !_isNativeFunction(t)) return t;
			if ("function" != typeof t)
				throw new TypeError("Super expression must either be null or a function");
			if (void 0 !== r) {
				if (r.has(t)) return r.get(t);
				r.set(t, Wrapper);
			}
			function Wrapper() {
				return _construct(t, arguments, _getPrototypeOf(this).constructor);
			}
			return (
				(Wrapper.prototype = Object.create(t.prototype, {
					constructor: { value: Wrapper, enumerable: !1, writable: !0, configurable: !0 },
				})),
				_setPrototypeOf(Wrapper, t)
			);
		}),
		_wrapNativeSuper(t)
	);
}
function _construct(t, e, r) {
	if (_isNativeReflectConstruct()) return Reflect.construct.apply(null, arguments);
	var o = [null];
	o.push.apply(o, e);
	var p = new (t.bind.apply(t, o))();
	return (r && _setPrototypeOf(p, r.prototype), p);
}
function _isNativeReflectConstruct() {
	try {
		var t = !Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {}));
	} catch (t) {}
	return (_isNativeReflectConstruct = function _isNativeReflectConstruct() {
		return !!t;
	})();
}
function _isNativeFunction(t) {
	try {
		return -1 !== Function.toString.call(t).indexOf("[native code]");
	} catch (n) {
		return "function" == typeof t;
	}
}
function _setPrototypeOf(t, e) {
	return (
		(_setPrototypeOf = Object.setPrototypeOf
			? Object.setPrototypeOf.bind()
			: function (t, e) {
					return ((t.__proto__ = e), t);
				}),
		_setPrototypeOf(t, e)
	);
}
function _getPrototypeOf(t) {
	return (
		(_getPrototypeOf = Object.setPrototypeOf
			? Object.getPrototypeOf.bind()
			: function (t) {
					return t.__proto__ || Object.getPrototypeOf(t);
				}),
		_getPrototypeOf(t)
	);
}
/**!
 * audioMotion-analyzer
 * High-resolution real-time graphic audio spectrum analyzer JS module
 *
 * @version 4.5.1
 * @author  Henrique Avila Vianna <hvianna@gmail.com> <https://henriquevianna.com>
 * @license AGPL-3.0-or-later
 */

var VERSION = "4.5.1";

// internal constants
var PI = Math.PI,
	TAU = 2 * PI,
	HALF_PI = PI / 2,
	C_1 = 8.17579892; // frequency for C -1

var CANVAS_BACKGROUND_COLOR = "#000",
	CHANNEL_COMBINED = "dual-combined",
	CHANNEL_HORIZONTAL = "dual-horizontal",
	CHANNEL_SINGLE = "single",
	CHANNEL_VERTICAL = "dual-vertical",
	COLOR_BAR_INDEX = "bar-index",
	COLOR_BAR_LEVEL = "bar-level",
	COLOR_GRADIENT = "gradient",
	DEBOUNCE_TIMEOUT = 60,
	EVENT_CLICK = "click",
	EVENT_FULLSCREENCHANGE = "fullscreenchange",
	EVENT_RESIZE = "resize",
	GRADIENT_DEFAULT_BGCOLOR = "#111",
	FILTER_NONE = "",
	FILTER_A = "A",
	FILTER_B = "B",
	FILTER_C = "C",
	FILTER_D = "D",
	FILTER_468 = "468",
	FONT_FAMILY = "sans-serif",
	FPS_COLOR = "#0f0",
	LEDS_UNLIT_COLOR = "#7f7f7f22",
	MODE_GRAPH = 10,
	REASON_CREATE = "create",
	REASON_FSCHANGE = "fschange",
	REASON_LORES = "lores",
	REASON_RESIZE = EVENT_RESIZE,
	REASON_USER = "user",
	SCALEX_BACKGROUND_COLOR = "#000c",
	SCALEX_LABEL_COLOR = "#fff",
	SCALEX_HIGHLIGHT_COLOR = "#4f4",
	SCALEY_LABEL_COLOR = "#888",
	SCALEY_MIDLINE_COLOR = "#555",
	SCALE_BARK = "bark",
	SCALE_LINEAR = "linear",
	SCALE_LOG = "log",
	SCALE_MEL = "mel";

// built-in gradients
var PRISM = ["#a35", "#c66", "#e94", "#ed0", "#9d5", "#4d8", "#2cb", "#0bc", "#09c", "#36b"],
	GRADIENTS = [
		[
			"classic",
			{
				colorStops: [
					"red",
					{
						color: "yellow",
						level: 0.85,
						pos: 0.6,
					},
					{
						color: "lime",
						level: 0.475,
					},
				],
			},
		],
		[
			"prism",
			{
				colorStops: PRISM,
			},
		],
		[
			"rainbow",
			{
				dir: "h",
				colorStops: ["#817"].concat(PRISM, ["#639"]),
			},
		],
		[
			"orangered",
			{
				bgColor: "#3e2f29",
				colorStops: ["OrangeRed"],
			},
		],
		[
			"steelblue",
			{
				bgColor: "#222c35",
				colorStops: ["SteelBlue"],
			},
		],
	];

// settings defaults
var DEFAULT_SETTINGS = {
	alphaBars: false,
	ansiBands: false,
	barSpace: 0.1,
	bgAlpha: 0.7,
	channelLayout: CHANNEL_SINGLE,
	colorMode: COLOR_GRADIENT,
	fadePeaks: false,
	fftSize: 8192,
	fillAlpha: 1,
	frequencyScale: SCALE_LOG,
	gradient: GRADIENTS[0][0],
	gravity: 3.8,
	height: undefined,
	ledBars: false,
	linearAmplitude: false,
	linearBoost: 1,
	lineWidth: 0,
	loRes: false,
	lumiBars: false,
	maxDecibels: -25,
	maxFPS: 0,
	maxFreq: 22000,
	minDecibels: -85,
	minFreq: 20,
	mirror: 0,
	mode: 0,
	noteLabels: false,
	outlineBars: false,
	overlay: false,
	peakFadeTime: 750,
	peakHoldTime: 500,
	peakLine: false,
	radial: false,
	radialInvert: false,
	radius: 0.3,
	reflexAlpha: 0.15,
	reflexBright: 1,
	reflexFit: true,
	reflexRatio: 0,
	roundBars: false,
	showBgColor: true,
	showFPS: false,
	showPeaks: true,
	showScaleX: true,
	showScaleY: false,
	smoothing: 0.5,
	spinSpeed: 0,
	splitGradient: false,
	start: true,
	trueLeds: false,
	useCanvas: true,
	volume: 1,
	weightingFilter: FILTER_NONE,
	width: undefined,
};

// custom error messages
var ERR_AUDIO_CONTEXT_FAIL = [
		"ERR_AUDIO_CONTEXT_FAIL",
		"Could not create audio context. Web Audio API not supported?",
	],
	ERR_INVALID_AUDIO_CONTEXT = ["ERR_INVALID_AUDIO_CONTEXT", "Provided audio context is not valid"],
	ERR_UNKNOWN_GRADIENT = ["ERR_UNKNOWN_GRADIENT", "Unknown gradient"],
	ERR_FREQUENCY_TOO_LOW = ["ERR_FREQUENCY_TOO_LOW", "Frequency values must be >= 1"],
	ERR_INVALID_MODE = ["ERR_INVALID_MODE", "Invalid mode"],
	ERR_REFLEX_OUT_OF_RANGE = ["ERR_REFLEX_OUT_OF_RANGE", "Reflex ratio must be >= 0 and < 1"],
	ERR_INVALID_AUDIO_SOURCE = [
		"ERR_INVALID_AUDIO_SOURCE",
		"Audio source must be an instance of HTMLMediaElement or AudioNode",
	],
	ERR_GRADIENT_INVALID_NAME = [
		"ERR_GRADIENT_INVALID_NAME",
		"Gradient name must be a non-empty string",
	],
	ERR_GRADIENT_NOT_AN_OBJECT = ["ERR_GRADIENT_NOT_AN_OBJECT", "Gradient options must be an object"],
	ERR_GRADIENT_MISSING_COLOR = [
		"ERR_GRADIENT_MISSING_COLOR",
		"Gradient colorStops must be a non-empty array",
	];
var AudioMotionError = /*#__PURE__*/ (function (_Error) {
	function AudioMotionError(error, value) {
		var _this;
		_classCallCheck(this, AudioMotionError);
		var _error = _slicedToArray(error, 2),
			code = _error[0],
			message = _error[1];
		_this = _callSuper(this, AudioMotionError, [
			message + (value !== undefined ? ": ".concat(value) : ""),
		]);
		_this.name = "AudioMotionError";
		_this.code = code;
		return _this;
	}
	_inherits(AudioMotionError, _Error);
	return _createClass(AudioMotionError);
})(/*#__PURE__*/ _wrapNativeSuper(Error)); // helper function - output deprecation warning message on console
var deprecate = function deprecate(name, alternative) {
	return console.warn("".concat(name, " is deprecated. Use ").concat(alternative, " instead."));
};

// helper function - check if a given object is empty (also returns `true` on null, undefined or any non-object value)
var isEmpty = function isEmpty(obj) {
	for (var p in obj) return false;
	return true;
};

// helper function - validate a given value with an array of strings (by default, all lowercase)
// returns the validated value, or the first element of `list` if `value` is not found in the array
var validateFromList = function validateFromList(value, list) {
	var modifier = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : "toLowerCase";
	return list[Math.max(0, list.indexOf(("" + value)[modifier]()))];
};

// helper function - find the Y-coordinate of a point located between two other points, given its X-coordinate
var findY = function findY(x1, y1, x2, y2, x) {
	return y1 + ((y2 - y1) * (x - x1)) / (x2 - x1);
};

// Polyfill for Array.findLastIndex()
if (!Array.prototype.findLastIndex) {
	Array.prototype.findLastIndex = function (callback) {
		var index = this.length;
		while (index-- > 0) {
			if (callback(this[index])) return index;
		}
		return -1;
	};
}

// AudioMotionAnalyzer class
var AudioMotionAnalyzer = /*#__PURE__*/ (function () {
	/**
	 * CONSTRUCTOR
	 *
	 * @param {object} [container] DOM element where to insert the analyzer; if undefined, uses the document body
	 * @param {object} [options]
	 * @returns {object} AudioMotionAnalyzer object
	 */
	function AudioMotionAnalyzer(container) {
		var _this2 = this;
		var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
		_classCallCheck(this, AudioMotionAnalyzer);
		this._ready = false;

		// Initialize internal objects
		this._aux = {}; // auxiliary variables
		this._canvasGradients = []; // CanvasGradient objects for channels 0 and 1
		this._destroyed = false;
		this._energy = {
			val: 0,
			peak: 0,
			hold: 0,
		};
		this._flg = {}; // flags
		this._fps = 0;
		this._gradients = {}; // registered gradients
		this._last = 0; // timestamp of last rendered frame
		this._outNodes = []; // output nodes
		this._ownContext = false;
		this._selectedGrads = []; // names of the currently selected gradients for channels 0 and 1
		this._sources = []; // input nodes

		// Check if options object passed as first argument
		if (!(container instanceof Element)) {
			if (isEmpty(options) && !isEmpty(container)) options = container;
			container = null;
		}
		this._ownCanvas = !(options.canvas instanceof HTMLCanvasElement);

		// Create a new canvas or use the one provided by the user
		var canvas = this._ownCanvas ? document.createElement("canvas") : options.canvas;
		canvas.style = "max-width: 100%;";
		this._ctx = canvas.getContext("2d");

		// Register built-in gradients
		var _iterator = _createForOfIteratorHelper(GRADIENTS),
			_step;
		try {
			for (_iterator.s(); !(_step = _iterator.n()).done; ) {
				var _step$value = _slicedToArray(_step.value, 2),
					name = _step$value[0],
					_options = _step$value[1];
				this.registerGradient(name, _options);
			}

			// Set container
		} catch (err) {
			_iterator.e(err);
		} finally {
			_iterator.f();
		}
		this._container = container || (!this._ownCanvas && canvas.parentElement) || document.body;

		// Make sure we have minimal width and height dimensions in case of an inline container
		this._defaultWidth = this._container.clientWidth || 640;
		this._defaultHeight = this._container.clientHeight || 270;

		// Use audio context provided by user, or create a new one

		var audioCtx;
		if (options.source && (audioCtx = options.source.context)) {
			// get audioContext from provided source audioNode
		} else if ((audioCtx = options.audioCtx)) {
			// use audioContext provided by user
		} else {
			try {
				audioCtx = new (window.AudioContext || window.webkitAudioContext)();
				this._ownContext = true;
			} catch (err) {
				throw new AudioMotionError(ERR_AUDIO_CONTEXT_FAIL);
			}
		}

		// make sure audioContext is valid
		if (!audioCtx.createGain) throw new AudioMotionError(ERR_INVALID_AUDIO_CONTEXT);

		/*
    	Connection routing:
    	===================
    		for dual channel layouts:                +--->  analyzer[0]  ---+
        	                                     |                      |
    	(source) --->  input  --->  splitter  ---+                      +--->  merger  --->  output  ---> (destination)
        	                                     |                      |
            	                                 +--->  analyzer[1]  ---+
    		for single channel layout:
    		(source) --->  input  ----------------------->  analyzer[0]  --------------------->  output  ---> (destination)
    	*/

		// create the analyzer nodes, channel splitter and merger, and gain nodes for input/output connections
		var analyzer = (this._analyzer = [audioCtx.createAnalyser(), audioCtx.createAnalyser()]);
		var splitter = (this._splitter = audioCtx.createChannelSplitter(2));
		var merger = (this._merger = audioCtx.createChannelMerger(2));
		this._input = audioCtx.createGain();
		this._output = audioCtx.createGain();

		// connect audio source if provided in the options
		if (options.source) this.connectInput(options.source);

		// connect splitter -> analyzers
		for (var _i = 0, _arr = [0, 1]; _i < _arr.length; _i++) {
			var i = _arr[_i];
			splitter.connect(analyzer[i], i);
		}

		// connect merger -> output
		merger.connect(this._output);

		// connect output -> destination (speakers)
		if (options.connectSpeakers !== false) this.connectOutput();

		// create auxiliary canvases for the X-axis and radial scale labels
		for (var _i2 = 0, _arr2 = ["_scaleX", "_scaleR"]; _i2 < _arr2.length; _i2++) {
			var ctx = _arr2[_i2];
			this[ctx] = document.createElement("canvas").getContext("2d");
		}

		// set fullscreen element (defaults to canvas)
		this._fsEl = options.fsElement || canvas;

		// Update canvas size on container / window resize and fullscreen events

		// Fullscreen changes are handled quite differently across browsers:
		// 1. Chromium browsers will trigger a `resize` event followed by a `fullscreenchange`
		// 2. Firefox triggers the `fullscreenchange` first and then the `resize`
		// 3. Chrome on Android (TV) won't trigger a `resize` event, only `fullscreenchange`
		// 4. Safari won't trigger `fullscreenchange` events at all, and on iPadOS the `resize`
		//    event is triggered **on the window** only (last tested on iPadOS 14)

		// helper function for resize events
		var onResize = function onResize() {
			if (!_this2._fsTimeout) {
				// delay the resize to prioritize a possible following `fullscreenchange` event
				_this2._fsTimeout = window.setTimeout(function () {
					if (!_this2._fsChanging) {
						_this2._setCanvas(REASON_RESIZE);
						_this2._fsTimeout = 0;
					}
				}, DEBOUNCE_TIMEOUT);
			}
		};

		// if browser supports ResizeObserver, listen for resize on the container
		if (window.ResizeObserver) {
			this._observer = new ResizeObserver(onResize);
			this._observer.observe(this._container);
		}

		// create an AbortController to remove event listeners on destroy()
		this._controller = new AbortController();
		var signal = this._controller.signal;

		// listen for resize events on the window - required for fullscreen on iPadOS
		window.addEventListener(EVENT_RESIZE, onResize, {
			signal: signal,
		});

		// listen for fullscreenchange events on the canvas - not available on Safari
		canvas.addEventListener(
			EVENT_FULLSCREENCHANGE,
			function () {
				// set flag to indicate a fullscreen change in progress
				_this2._fsChanging = true;

				// if there is a scheduled resize event, clear it
				if (_this2._fsTimeout) window.clearTimeout(_this2._fsTimeout);

				// update the canvas
				_this2._setCanvas(REASON_FSCHANGE);

				// delay clearing the flag to prevent any shortly following resize event
				_this2._fsTimeout = window.setTimeout(function () {
					_this2._fsChanging = false;
					_this2._fsTimeout = 0;
				}, DEBOUNCE_TIMEOUT);
			},
			{
				signal: signal,
			},
		);

		// Resume audio context if in suspended state (browsers' autoplay policy)
		var _unlockContext = function unlockContext() {
			if (audioCtx.state == "suspended")
				audioCtx.resume().then(function () {
					return window.removeEventListener(EVENT_CLICK, _unlockContext);
				});
		};
		window.addEventListener(EVENT_CLICK, _unlockContext);

		// reset FPS-related variables when window becomes visible (avoid FPS drop due to frames not rendered while hidden)
		document.addEventListener(
			"visibilitychange",
			function () {
				if (document.visibilityState != "hidden") {
					_this2._frames = 0;
					_this2._time = performance.now();
				}
			},
			{
				signal: signal,
			},
		);

		// Set configuration options and use defaults for any missing properties
		this._setProps(options, true);

		// Add canvas to the container (only when canvas not provided by user)
		if (this.useCanvas && this._ownCanvas) this._container.appendChild(canvas);

		// Finish canvas setup
		this._ready = true;
		this._setCanvas(REASON_CREATE);
	}

	/**
	 * ==========================================================================
	 *
	 * PUBLIC PROPERTIES GETTERS AND SETTERS
	 *
	 * ==========================================================================
	 */
	return _createClass(
		AudioMotionAnalyzer,
		[
			{
				key: "alphaBars",
				get: function get() {
					return this._alphaBars;
				},
				set: function set(value) {
					this._alphaBars = !!value;
					this._calcBars();
				},
			},
			{
				key: "ansiBands",
				get: function get() {
					return this._ansiBands;
				},
				set: function set(value) {
					this._ansiBands = !!value;
					this._calcBars();
				},
			},
			{
				key: "barSpace",
				get: function get() {
					return this._barSpace;
				},
				set: function set(value) {
					this._barSpace = +value || 0;
					this._calcBars();
				},
			},
			{
				key: "channelLayout",
				get: function get() {
					return this._chLayout;
				},
				set: function set(value) {
					this._chLayout = validateFromList(value, [
						CHANNEL_SINGLE,
						CHANNEL_HORIZONTAL,
						CHANNEL_VERTICAL,
						CHANNEL_COMBINED,
					]);

					// update node connections
					this._input.disconnect();
					this._input.connect(
						this._chLayout != CHANNEL_SINGLE ? this._splitter : this._analyzer[0],
					);
					this._analyzer[0].disconnect();
					if (this._outNodes.length)
						// connect analyzer only if the output is connected to other nodes
						this._analyzer[0].connect(
							this._chLayout != CHANNEL_SINGLE ? this._merger : this._output,
						);
					this._calcBars();
					this._makeGrad();
				},
			},
			{
				key: "colorMode",
				get: function get() {
					return this._colorMode;
				},
				set: function set(value) {
					this._colorMode = validateFromList(value, [
						COLOR_GRADIENT,
						COLOR_BAR_INDEX,
						COLOR_BAR_LEVEL,
					]);
				},
			},
			{
				key: "fadePeaks",
				get: function get() {
					return this._fadePeaks;
				},
				set: function set(value) {
					this._fadePeaks = !!value;
				},
			},
			{
				key: "fftSize",
				get: function get() {
					return this._analyzer[0].fftSize;
				},
				set: function set(value) {
					for (var _i3 = 0, _arr3 = [0, 1]; _i3 < _arr3.length; _i3++) {
						var i = _arr3[_i3];
						this._analyzer[i].fftSize = value;
					}
					var binCount = this._analyzer[0].frequencyBinCount;
					this._fftData = [new Float32Array(binCount), new Float32Array(binCount)];
					this._calcBars();
				},
			},
			{
				key: "frequencyScale",
				get: function get() {
					return this._frequencyScale;
				},
				set: function set(value) {
					this._frequencyScale = validateFromList(value, [
						SCALE_LOG,
						SCALE_BARK,
						SCALE_MEL,
						SCALE_LINEAR,
					]);
					this._calcBars();
				},
			},
			{
				key: "gradient",
				get: function get() {
					return this._selectedGrads[0];
				},
				set: function set(value) {
					this._setGradient(value);
				},
			},
			{
				key: "gradientLeft",
				get: function get() {
					return this._selectedGrads[0];
				},
				set: function set(value) {
					this._setGradient(value, 0);
				},
			},
			{
				key: "gradientRight",
				get: function get() {
					return this._selectedGrads[1];
				},
				set: function set(value) {
					this._setGradient(value, 1);
				},
			},
			{
				key: "gravity",
				get: function get() {
					return this._gravity;
				},
				set: function set(value) {
					this._gravity = value > 0 ? +value : this._gravity || DEFAULT_SETTINGS.gravity;
				},
			},
			{
				key: "height",
				get: function get() {
					return this._height;
				},
				set: function set(h) {
					this._height = h;
					this._setCanvas(REASON_USER);
				},
			},
			{
				key: "ledBars",
				get: function get() {
					return this._showLeds;
				},
				set: function set(value) {
					this._showLeds = !!value;
					this._calcBars();
				},
			},
			{
				key: "linearAmplitude",
				get: function get() {
					return this._linearAmplitude;
				},
				set: function set(value) {
					this._linearAmplitude = !!value;
				},
			},
			{
				key: "linearBoost",
				get: function get() {
					return this._linearBoost;
				},
				set: function set(value) {
					this._linearBoost = value >= 1 ? +value : 1;
				},
			},
			{
				key: "lineWidth",
				get: function get() {
					return this._lineWidth;
				},
				set: function set(value) {
					this._lineWidth = +value || 0;
				},
			},
			{
				key: "loRes",
				get: function get() {
					return this._loRes;
				},
				set: function set(value) {
					this._loRes = !!value;
					this._setCanvas(REASON_LORES);
				},
			},
			{
				key: "lumiBars",
				get: function get() {
					return this._lumiBars;
				},
				set: function set(value) {
					this._lumiBars = !!value;
					this._calcBars();
					this._makeGrad();
				},
			},
			{
				key: "maxDecibels",
				get: function get() {
					return this._analyzer[0].maxDecibels;
				},
				set: function set(value) {
					for (var _i4 = 0, _arr4 = [0, 1]; _i4 < _arr4.length; _i4++) {
						var i = _arr4[_i4];
						this._analyzer[i].maxDecibels = value;
					}
				},
			},
			{
				key: "maxFPS",
				get: function get() {
					return this._maxFPS;
				},
				set: function set(value) {
					this._maxFPS = value < 0 ? 0 : +value || 0;
				},
			},
			{
				key: "maxFreq",
				get: function get() {
					return this._maxFreq;
				},
				set: function set(value) {
					if (value < 1) throw new AudioMotionError(ERR_FREQUENCY_TOO_LOW);
					else {
						this._maxFreq = Math.min(value, this.audioCtx.sampleRate / 2);
						this._calcBars();
					}
				},
			},
			{
				key: "minDecibels",
				get: function get() {
					return this._analyzer[0].minDecibels;
				},
				set: function set(value) {
					for (var _i5 = 0, _arr5 = [0, 1]; _i5 < _arr5.length; _i5++) {
						var i = _arr5[_i5];
						this._analyzer[i].minDecibels = value;
					}
				},
			},
			{
				key: "minFreq",
				get: function get() {
					return this._minFreq;
				},
				set: function set(value) {
					if (value < 1) throw new AudioMotionError(ERR_FREQUENCY_TOO_LOW);
					else {
						this._minFreq = +value;
						this._calcBars();
					}
				},
			},
			{
				key: "mirror",
				get: function get() {
					return this._mirror;
				},
				set: function set(value) {
					this._mirror = Math.sign(value) | 0; // ensure only -1, 0 or 1
					this._calcBars();
					this._makeGrad();
				},
			},
			{
				key: "mode",
				get: function get() {
					return this._mode;
				},
				set: function set(value) {
					var mode = value | 0;
					if (mode >= 0 && mode <= 10 && mode != 9) {
						this._mode = mode;
						this._calcBars();
						this._makeGrad();
					} else throw new AudioMotionError(ERR_INVALID_MODE, value);
				},
			},
			{
				key: "noteLabels",
				get: function get() {
					return this._noteLabels;
				},
				set: function set(value) {
					this._noteLabels = !!value;
					this._createScales();
				},
			},
			{
				key: "outlineBars",
				get: function get() {
					return this._outlineBars;
				},
				set: function set(value) {
					this._outlineBars = !!value;
					this._calcBars();
				},
			},
			{
				key: "peakFadeTime",
				get: function get() {
					return this._peakFadeTime;
				},
				set: function set(value) {
					this._peakFadeTime =
						value >= 0 ? +value : this._peakFadeTime || DEFAULT_SETTINGS.peakFadeTime;
				},
			},
			{
				key: "peakHoldTime",
				get: function get() {
					return this._peakHoldTime;
				},
				set: function set(value) {
					this._peakHoldTime = +value || 0;
				},
			},
			{
				key: "peakLine",
				get: function get() {
					return this._peakLine;
				},
				set: function set(value) {
					this._peakLine = !!value;
				},
			},
			{
				key: "radial",
				get: function get() {
					return this._radial;
				},
				set: function set(value) {
					this._radial = !!value;
					this._calcBars();
					this._makeGrad();
				},
			},
			{
				key: "radialInvert",
				get: function get() {
					return this._radialInvert;
				},
				set: function set(value) {
					this._radialInvert = !!value;
					this._calcBars();
					this._makeGrad();
				},
			},
			{
				key: "radius",
				get: function get() {
					return this._radius;
				},
				set: function set(value) {
					this._radius = +value || 0;
					this._calcBars();
					this._makeGrad();
				},
			},
			{
				key: "reflexRatio",
				get: function get() {
					return this._reflexRatio;
				},
				set: function set(value) {
					value = +value || 0;
					if (value < 0 || value >= 1) throw new AudioMotionError(ERR_REFLEX_OUT_OF_RANGE);
					else {
						this._reflexRatio = value;
						this._calcBars();
						this._makeGrad();
					}
				},
			},
			{
				key: "roundBars",
				get: function get() {
					return this._roundBars;
				},
				set: function set(value) {
					this._roundBars = !!value;
					this._calcBars();
				},
			},
			{
				key: "smoothing",
				get: function get() {
					return this._analyzer[0].smoothingTimeConstant;
				},
				set: function set(value) {
					for (var _i6 = 0, _arr6 = [0, 1]; _i6 < _arr6.length; _i6++) {
						var i = _arr6[_i6];
						this._analyzer[i].smoothingTimeConstant = value;
					}
				},
			},
			{
				key: "spinSpeed",
				get: function get() {
					return this._spinSpeed;
				},
				set: function set(value) {
					value = +value || 0;
					if (this._spinSpeed === undefined || value == 0) this._spinAngle = -HALF_PI; // initialize or reset the rotation angle
					this._spinSpeed = value;
				},
			},
			{
				key: "splitGradient",
				get: function get() {
					return this._splitGradient;
				},
				set: function set(value) {
					this._splitGradient = !!value;
					this._makeGrad();
				},
			},
			{
				key: "stereo",
				get: function get() {
					deprecate("stereo", "channelLayout");
					return this._chLayout != CHANNEL_SINGLE;
				},
				set: function set(value) {
					deprecate("stereo", "channelLayout");
					this.channelLayout = value ? CHANNEL_VERTICAL : CHANNEL_SINGLE;
				},
			},
			{
				key: "trueLeds",
				get: function get() {
					return this._trueLeds;
				},
				set: function set(value) {
					this._trueLeds = !!value;
				},
			},
			{
				key: "volume",
				get: function get() {
					return this._output.gain.value;
				},
				set: function set(value) {
					this._output.gain.value = value;
				},
			},
			{
				key: "weightingFilter",
				get: function get() {
					return this._weightingFilter;
				},
				set: function set(value) {
					this._weightingFilter = validateFromList(
						value,
						[FILTER_NONE, FILTER_A, FILTER_B, FILTER_C, FILTER_D, FILTER_468],
						"toUpperCase",
					);
				},
			},
			{
				key: "width",
				get: function get() {
					return this._width;
				},
				set: function set(w) {
					this._width = w;
					this._setCanvas(REASON_USER);
				},

				// Read only properties
			},
			{
				key: "audioCtx",
				get: function get() {
					return this._input.context;
				},
			},
			{
				key: "canvas",
				get: function get() {
					return this._ctx.canvas;
				},
			},
			{
				key: "canvasCtx",
				get: function get() {
					return this._ctx;
				},
			},
			{
				key: "connectedSources",
				get: function get() {
					return this._sources;
				},
			},
			{
				key: "connectedTo",
				get: function get() {
					return this._outNodes;
				},
			},
			{
				key: "fps",
				get: function get() {
					return this._fps;
				},
			},
			{
				key: "fsHeight",
				get: function get() {
					return this._fsHeight;
				},
			},
			{
				key: "fsWidth",
				get: function get() {
					return this._fsWidth;
				},
			},
			{
				key: "isAlphaBars",
				get: function get() {
					return this._flg.isAlpha;
				},
			},
			{
				key: "isBandsMode",
				get: function get() {
					return this._flg.isBands;
				},
			},
			{
				key: "isDestroyed",
				get: function get() {
					return this._destroyed;
				},
			},
			{
				key: "isFullscreen",
				get: function get() {
					return (
						this._fsEl &&
						(document.fullscreenElement || document.webkitFullscreenElement) === this._fsEl
					);
				},
			},
			{
				key: "isLedBars",
				get: function get() {
					return this._flg.isLeds;
				},
			},
			{
				key: "isLumiBars",
				get: function get() {
					return this._flg.isLumi;
				},
			},
			{
				key: "isOctaveBands",
				get: function get() {
					return this._flg.isOctaves;
				},
			},
			{
				key: "isOn",
				get: function get() {
					return !!this._runId;
				},
			},
			{
				key: "isOutlineBars",
				get: function get() {
					return this._flg.isOutline;
				},
			},
			{
				key: "pixelRatio",
				get: function get() {
					return this._pixelRatio;
				},
			},
			{
				key: "isRoundBars",
				get: function get() {
					return this._flg.isRound;
				},
			},
			{
				key: "connectInput",
				value:
					/**
					 * ==========================================================================
					 *
					 * PUBLIC METHODS
					 *
					 * ==========================================================================
					 */

					/**
					 * Connects an HTML media element or audio node to the analyzer
					 *
					 * @param {object} an instance of HTMLMediaElement or AudioNode
					 * @returns {object} a MediaElementAudioSourceNode object if created from HTML element, or the same input object otherwise
					 */
					function connectInput(source) {
						var isHTML = source instanceof HTMLMediaElement;
						if (!(isHTML || source.connect)) throw new AudioMotionError(ERR_INVALID_AUDIO_SOURCE);

						// if source is an HTML element, create an audio node for it; otherwise, use the provided audio node
						var node = isHTML ? this.audioCtx.createMediaElementSource(source) : source;
						if (!this._sources.includes(node)) {
							node.connect(this._input);
							this._sources.push(node);
						}
						return node;
					},

				/**
				 * Connects the analyzer output to another audio node
				 *
				 * @param [{object}] an AudioNode; if undefined, the output is connected to the audio context destination (speakers)
				 */
			},
			{
				key: "connectOutput",
				value: function connectOutput() {
					var node =
						arguments.length > 0 && arguments[0] !== undefined
							? arguments[0]
							: this.audioCtx.destination;
					if (this._outNodes.includes(node)) return;
					this._output.connect(node);
					this._outNodes.push(node);

					// when connecting the first node, also connect the analyzer nodes to the merger / output nodes
					if (this._outNodes.length == 1) {
						for (var _i7 = 0, _arr7 = [0, 1]; _i7 < _arr7.length; _i7++) {
							var i = _arr7[_i7];
							this._analyzer[i].connect(
								this._chLayout == CHANNEL_SINGLE && !i ? this._output : this._merger,
								0,
								i,
							);
						}
					}
				},

				/**
				 * Destroys instance
				 */
			},
			{
				key: "destroy",
				value: function destroy() {
					if (!this._ready) return;
					var audioCtx = this.audioCtx,
						canvas = this.canvas,
						_controller = this._controller,
						_input = this._input,
						_merger = this._merger,
						_observer = this._observer,
						_ownCanvas = this._ownCanvas,
						_ownContext = this._ownContext,
						_splitter = this._splitter;
					this._destroyed = true;
					this._ready = false;
					this.stop();

					// remove event listeners
					_controller.abort();
					if (_observer) _observer.disconnect();

					// clear callbacks and fullscreen element
					this.onCanvasResize = null;
					this.onCanvasDraw = null;
					this._fsEl = null;

					// disconnect audio nodes
					this.disconnectInput();
					this.disconnectOutput(); // also disconnects analyzer nodes
					_input.disconnect();
					_splitter.disconnect();
					_merger.disconnect();

					// if audio context is our own (not provided by the user), close it
					if (_ownContext) audioCtx.close();

					// remove canvas from the DOM (if not provided by the user)
					if (_ownCanvas) canvas.remove();

					// reset flags
					this._calcBars();
				},

				/**
				 * Disconnects audio sources from the analyzer
				 *
				 * @param [{object|array}] a connected AudioNode object or an array of such objects; if falsy, all connected nodes are disconnected
				 * @param [{boolean}] if true, stops/releases audio tracks from disconnected media streams (e.g. microphone)
				 */
			},
			{
				key: "disconnectInput",
				value: function disconnectInput(sources, stopTracks) {
					if (!sources) sources = Array.from(this._sources);
					else if (!Array.isArray(sources)) sources = [sources];
					var _iterator2 = _createForOfIteratorHelper(sources),
						_step2;
					try {
						for (_iterator2.s(); !(_step2 = _iterator2.n()).done; ) {
							var node = _step2.value;
							var idx = this._sources.indexOf(node);
							if (stopTracks && node.mediaStream) {
								var _iterator3 = _createForOfIteratorHelper(node.mediaStream.getAudioTracks()),
									_step3;
								try {
									for (_iterator3.s(); !(_step3 = _iterator3.n()).done; ) {
										var track = _step3.value;
										track.stop();
									}
								} catch (err) {
									_iterator3.e(err);
								} finally {
									_iterator3.f();
								}
							}
							if (idx >= 0) {
								node.disconnect(this._input);
								this._sources.splice(idx, 1);
							}
						}
					} catch (err) {
						_iterator2.e(err);
					} finally {
						_iterator2.f();
					}
				},

				/**
				 * Disconnects the analyzer output from other audio nodes
				 *
				 * @param [{object}] a connected AudioNode object; if undefined, all connected nodes are disconnected
				 */
			},
			{
				key: "disconnectOutput",
				value: function disconnectOutput(node) {
					if (node && !this._outNodes.includes(node)) return;
					this._output.disconnect(node);
					this._outNodes = node
						? this._outNodes.filter(function (e) {
								return e !== node;
							})
						: [];

					// if disconnected from all nodes, also disconnect the analyzer nodes so they keep working on Chromium
					// see https://github.com/hvianna/audioMotion-analyzer/issues/13#issuecomment-808764848
					if (this._outNodes.length == 0) {
						for (var _i8 = 0, _arr8 = [0, 1]; _i8 < _arr8.length; _i8++) {
							var i = _arr8[_i8];
							this._analyzer[i].disconnect();
						}
					}
				},

				/**
				 * Returns analyzer bars data
				 *
				 * @returns {array}
				 */
			},
			{
				key: "getBars",
				value: function getBars() {
					return Array.from(this._bars, function (_ref) {
						var posX = _ref.posX,
							freq = _ref.freq,
							freqLo = _ref.freqLo,
							freqHi = _ref.freqHi,
							hold = _ref.hold,
							peak = _ref.peak,
							value = _ref.value;
						return {
							posX: posX,
							freq: freq,
							freqLo: freqLo,
							freqHi: freqHi,
							hold: hold,
							peak: peak,
							value: value,
						};
					});
				},

				/**
				 * Returns the energy of a frequency, or average energy of a range of frequencies
				 *
				 * @param [{number|string}] single or initial frequency (Hz), or preset name; if undefined, returns the overall energy
				 * @param [{number}] ending frequency (Hz)
				 * @returns {number|null} energy value (0 to 1) or null, if the specified preset is unknown
				 */
			},
			{
				key: "getEnergy",
				value: function getEnergy(startFreq, endFreq) {
					if (startFreq === undefined) return this._energy.val;

					// if startFreq is a string, check for presets
					if (startFreq != +startFreq) {
						if (startFreq == "peak") return this._energy.peak;
						var presets = {
							bass: [20, 250],
							lowMid: [250, 500],
							mid: [500, 2e3],
							highMid: [2e3, 4e3],
							treble: [4e3, 16e3],
						};
						if (!presets[startFreq]) return null;
						var _presets$startFreq = _slicedToArray(presets[startFreq], 2);
						startFreq = _presets$startFreq[0];
						endFreq = _presets$startFreq[1];
					}
					var startBin = this._freqToBin(startFreq),
						endBin = endFreq ? this._freqToBin(endFreq) : startBin,
						chnCount = this._chLayout == CHANNEL_SINGLE ? 1 : 2;
					var energy = 0;
					for (var channel = 0; channel < chnCount; channel++) {
						for (var i = startBin; i <= endBin; i++)
							energy += this._normalizedB(this._fftData[channel][i]);
					}
					return energy / (endBin - startBin + 1) / chnCount;
				},

				/**
				 * Returns current analyzer settings in object format
				 *
				 * @param [{string|array}] a property name or an array of property names to not include in the returned object
				 * @returns {object} Options object
				 */
			},
			{
				key: "getOptions",
				value: function getOptions(ignore) {
					if (!Array.isArray(ignore)) ignore = [ignore];
					var options = {};
					for (
						var _i9 = 0, _Object$keys = Object.keys(DEFAULT_SETTINGS);
						_i9 < _Object$keys.length;
						_i9++
					) {
						var prop = _Object$keys[_i9];
						if (!ignore.includes(prop)) {
							if (prop == "gradient" && this.gradientLeft != this.gradientRight) {
								options.gradientLeft = this.gradientLeft;
								options.gradientRight = this.gradientRight;
							} else if (prop != "start") options[prop] = this[prop];
						}
					}
					return options;
				},

				/**
				 * Registers a custom gradient
				 *
				 * @param {string} name
				 * @param {object} options
				 */
			},
			{
				key: "registerGradient",
				value: function registerGradient(name, options) {
					if (typeof name != "string" || name.trim().length == 0)
						throw new AudioMotionError(ERR_GRADIENT_INVALID_NAME);
					if (_typeof(options) != "object") throw new AudioMotionError(ERR_GRADIENT_NOT_AN_OBJECT);
					var colorStops = options.colorStops;
					if (!Array.isArray(colorStops) || !colorStops.length)
						throw new AudioMotionError(ERR_GRADIENT_MISSING_COLOR);
					var count = colorStops.length,
						isInvalid = function isInvalid(val) {
							return +val != val || val < 0 || val > 1;
						};

					// normalize all colorStops as objects with `pos`, `color` and `level` properties
					colorStops.forEach(function (colorStop, index) {
						var pos = index / Math.max(1, count - 1);
						if (_typeof(colorStop) != "object")
							// only color string was defined
							colorStops[index] = {
								pos: pos,
								color: colorStop,
							};
						else if (isInvalid(colorStop.pos)) colorStop.pos = pos;
						if (isInvalid(colorStop.level)) colorStops[index].level = 1 - index / count;
					});

					// make sure colorStops is in descending `level` order and that the first one has `level == 1`
					// this is crucial for proper operation of 'bar-level' colorMode!
					colorStops.sort(function (a, b) {
						return a.level < b.level ? 1 : a.level > b.level ? -1 : 0;
					});
					colorStops[0].level = 1;
					this._gradients[name] = {
						bgColor: options.bgColor || GRADIENT_DEFAULT_BGCOLOR,
						dir: options.dir,
						colorStops: colorStops,
					};

					// if the registered gradient is one of the currently selected gradients, regenerate them
					if (this._selectedGrads.includes(name)) this._makeGrad();
				},

				/**
				 * Set dimensions of analyzer's canvas
				 *
				 * @param {number} w width in pixels
				 * @param {number} h height in pixels
				 */
			},
			{
				key: "setCanvasSize",
				value: function setCanvasSize(w, h) {
					this._width = w;
					this._height = h;
					this._setCanvas(REASON_USER);
				},

				/**
				 * Set desired frequency range
				 *
				 * @param {number} min lowest frequency represented in the x-axis
				 * @param {number} max highest frequency represented in the x-axis
				 */
			},
			{
				key: "setFreqRange",
				value: function setFreqRange(min, max) {
					if (min < 1 || max < 1) throw new AudioMotionError(ERR_FREQUENCY_TOO_LOW);
					else {
						this._minFreq = Math.min(min, max);
						this.maxFreq = Math.max(min, max); // use the setter for maxFreq
					}
				},

				/**
				 * Set custom parameters for LED effect
				 * If called with no arguments or if any property is invalid, clears any previous custom parameters
				 *
				 * @param {object} [params]
				 */
			},
			{
				key: "setLedParams",
				value: function setLedParams(params) {
					var maxLeds, spaceV, spaceH;

					// coerce parameters to Number; `NaN` results are rejected in the condition below
					if (params) {
						((maxLeds = params.maxLeds | 0),
							// ensure integer
							(spaceV = +params.spaceV),
							(spaceH = +params.spaceH));
					}
					this._ledParams =
						maxLeds > 0 && spaceV > 0 && spaceH >= 0 ? [maxLeds, spaceV, spaceH] : undefined;
					this._calcBars();
				},

				/**
				 * Shorthand function for setting several options at once
				 *
				 * @param {object} options
				 */
			},
			{
				key: "setOptions",
				value: function setOptions(options) {
					this._setProps(options);
				},

				/**
				 * Adjust the analyzer's sensitivity
				 *
				 * @param {number} min minimum decibels value
				 * @param {number} max maximum decibels value
				 */
			},
			{
				key: "setSensitivity",
				value: function setSensitivity(min, max) {
					for (var _i0 = 0, _arr9 = [0, 1]; _i0 < _arr9.length; _i0++) {
						var i = _arr9[_i0];
						this._analyzer[i].minDecibels = Math.min(min, max);
						this._analyzer[i].maxDecibels = Math.max(min, max);
					}
				},

				/**
				 * Start the analyzer
				 */
			},
			{
				key: "start",
				value: function start() {
					this.toggleAnalyzer(true);
				},

				/**
				 * Stop the analyzer
				 */
			},
			{
				key: "stop",
				value: function stop() {
					this.toggleAnalyzer(false);
				},

				/**
				 * Start / stop canvas animation
				 *
				 * @param {boolean} [force] if undefined, inverts the current state
				 * @returns {boolean} resulting state after the change
				 */
			},
			{
				key: "toggleAnalyzer",
				value: function toggleAnalyzer(force) {
					var _this3 = this;
					var hasStarted = this.isOn;
					if (force === undefined) force = !hasStarted;

					// Stop the analyzer if it was already running and must be disabled
					if (hasStarted && !force) {
						cancelAnimationFrame(this._runId);
						this._runId = 0;
					}
					// Start the analyzer if it was stopped and must be enabled
					else if (!hasStarted && force && !this._destroyed) {
						this._frames = 0;
						this._time = performance.now();
						this._runId = requestAnimationFrame(function (timestamp) {
							return _this3._draw(timestamp);
						}); // arrow function preserves the scope of *this*
					}
					return this.isOn;
				},

				/**
				 * Toggles canvas full-screen mode
				 */
			},
			{
				key: "toggleFullscreen",
				value: function toggleFullscreen() {
					if (this.isFullscreen) {
						if (document.exitFullscreen) document.exitFullscreen();
						else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
					} else {
						var fsEl = this._fsEl;
						if (!fsEl) return;
						if (fsEl.requestFullscreen) fsEl.requestFullscreen();
						else if (fsEl.webkitRequestFullscreen) fsEl.webkitRequestFullscreen();
					}
				},

				/**
				 * ==========================================================================
				 *
				 * PRIVATE METHODS
				 *
				 * ==========================================================================
				 */

				/**
				 * Return the frequency (in Hz) for a given FFT bin
				 */
			},
			{
				key: "_binToFreq",
				value: function _binToFreq(bin) {
					return (bin * this.audioCtx.sampleRate) / this.fftSize || 1; // returns 1 for bin 0
				},

				/**
				 * Compute all internal data required for the analyzer, based on its current settings
				 */
			},
			{
				key: "_calcBars",
				value: function _calcBars() {
					var _this4 = this;
					var bars = (this._bars = []); // initialize object property

					if (!this._ready) {
						this._flg = {
							isAlpha: false,
							isBands: false,
							isLeds: false,
							isLumi: false,
							isOctaves: false,
							isOutline: false,
							isRound: false,
							noLedGap: false,
						};
						return;
					}
					var _ansiBands = this._ansiBands,
						_barSpace = this._barSpace,
						canvas = this.canvas,
						_chLayout = this._chLayout,
						_maxFreq = this._maxFreq,
						_minFreq = this._minFreq,
						_mirror = this._mirror,
						_mode = this._mode,
						_radial = this._radial,
						_radialInvert = this._radialInvert,
						_reflexRatio = this._reflexRatio,
						centerX = canvas.width >> 1,
						centerY = canvas.height >> 1,
						isDualVertical = _chLayout == CHANNEL_VERTICAL && !_radial,
						isDualHorizontal = _chLayout == CHANNEL_HORIZONTAL,
						isBands = _mode % 10 != 0,
						isOctaves = isBands && this._frequencyScale == SCALE_LOG,
						isLeds = this._showLeds && isBands && !_radial,
						isLumi = this._lumiBars && isBands && !_radial,
						isAlpha = this._alphaBars && !isLumi && _mode != MODE_GRAPH,
						isOutline = this._outlineBars && isBands && !isLumi && !isLeds,
						isRound = this._roundBars && isBands && !isLumi && !isLeds,
						noLedGap = _chLayout != CHANNEL_VERTICAL || (_reflexRatio > 0 && !isLumi),
						channelHeight =
							(canvas.height - (isDualVertical && !isLeds ? 0.5 : 0)) >> isDualVertical,
						analyzerHeight = (channelHeight * (isLumi || _radial ? 1 : 1 - _reflexRatio)) | 0,
						analyzerWidth = canvas.width - centerX * (isDualHorizontal || _mirror != 0),
						channelGap = isDualVertical ? canvas.height - channelHeight * 2 : 0,
						initialX = centerX * (_mirror == -1 && !isDualHorizontal && !_radial);
					var innerRadius =
							(Math.min(canvas.width, canvas.height) *
								0.375 *
								(_chLayout == CHANNEL_VERTICAL ? 1 : this._radius)) |
							0,
						outerRadius = Math.min(centerX, centerY);
					if (_radialInvert && _chLayout != CHANNEL_VERTICAL) {
						var _ref2 = [outerRadius, innerRadius];
						innerRadius = _ref2[0];
						outerRadius = _ref2[1];
					}

					/**
					 *	CREATE ANALYZER BANDS
					 *
					 *	USES:
					 *		analyzerWidth
					 *		initialX
					 *		isBands
					 *		isOctaves
					 *
					 *	GENERATES:
					 *		bars (populates this._bars)
					 *		bardWidth
					 *		scaleMin
					 *		unitWidth
					 */

					// helper function to add a bar to the bars array
					// bar object format:
					// {
					//	 posX,
					//   freq,
					//   freqLo,
					//   freqHi,
					//   binLo,
					//   binHi,
					//   ratioLo,
					//   ratioHi,
					//   peak,    // peak value
					//   hold,    // peak hold frames (negative value indicates peak falling / fading)
					//   alpha,   // peak alpha (used by fadePeaks)
					//   value    // current bar value
					// }
					var barsPush = function barsPush(args) {
						return bars.push(
							_objectSpread(
								_objectSpread({}, args),
								{},
								{
									peak: [0, 0],
									hold: [0],
									alpha: [0],
									value: [0],
								},
							),
						);
					};

					/*
      	A simple interpolation is used to obtain an approximate amplitude value for any given frequency,
      	from the available FFT data. We find the FFT bin which closer matches the desired frequency	and
      	interpolate its value with that of the next adjacent bin, like so:
      			v = v0 + ( v1 - v0 ) * ( log2( f / f0 ) / log2( f1 / f0 ) )
      		                       \__________________________________/
      		                                        |
      		                                      ratio
      		where:
      			f  - desired frequency
      		v  - amplitude (volume) of desired frequency
      		f0 - frequency represented by the lower FFT bin
      		f1 - frequency represented by the upper FFT bin
      		v0 - amplitude of f0
      		v1 - amplitude of f1
      		ratio is calculated in advance here, to reduce computational complexity during real-time rendering.
      */

					// helper function to calculate FFT bin and interpolation ratio for a given frequency
					var calcRatio = function calcRatio(freq) {
						var bin = _this4._freqToBin(freq, "floor"),
							// find closest FFT bin
							lower = _this4._binToFreq(bin),
							upper = _this4._binToFreq(bin + 1),
							ratio = Math.log2(freq / lower) / Math.log2(upper / lower);
						return [bin, ratio];
					};
					var barWidth, scaleMin, unitWidth;
					if (isOctaves) {
						// helper function to round a value to a given number of significant digits
						// `atLeast` set to true prevents reducing the number of integer significant digits
						var roundSD = function roundSD(value, digits, atLeast) {
							return +value.toPrecision(
								atLeast ? Math.max(digits, (1 + Math.log10(value)) | 0) : digits,
							);
						};

						// helper function to find the nearest preferred number (Renard series) for a given value
						var nearestPreferred = function nearestPreferred(value) {
							// R20 series is used here, as it provides closer approximations for 1/2 octave bands (non-standard)
							var preferred = [
									1, 1.12, 1.25, 1.4, 1.6, 1.8, 2, 2.24, 2.5, 2.8, 3.15, 3.55, 4, 4.5, 5, 5.6, 6.3,
									7.1, 8, 9, 10,
								],
								power = Math.log10(value) | 0,
								normalized = value / Math.pow(10, power);
							var i = 1;
							while (i < preferred.length && normalized > preferred[i]) i++;
							if (normalized - preferred[i - 1] < preferred[i] - normalized) i--;
							return ((preferred[i] * Math.pow(10, power + 5)) | 0) / 1e5; // keep 5 significant digits
						};

						// ANSI standard octave bands use the base-10 frequency ratio, as preferred by [ANSI S1.11-2004, p.2]
						// The equal-tempered scale uses the base-2 ratio
						var bands = [0, 24, 12, 8, 6, 4, 3, 2, 1][_mode],
							bandWidth = _ansiBands ? Math.pow(10, 3 / (bands * 10)) : Math.pow(2, 1 / bands),
							// 10^(3/10N) or 2^(1/N)
							halfBand = Math.pow(bandWidth, 0.5);
						var analyzerBars = [],
							currFreq = _ansiBands ? 7.94328235 / (bands % 2 ? 1 : halfBand) : C_1;
						// For ANSI bands with even denominators (all except 1/1 and 1/3), the reference frequency (1 kHz)
						// must fall on the edges of a pair of adjacent bands, instead of midband [ANSI S1.11-2004, p.2]
						// In the equal-tempered scale, all midband frequencies represent a musical note or quarter-tone.

						do {
							var freq = currFreq; // midband frequency

							var freqLo = roundSD(freq / halfBand, 4, true),
								freqHi = roundSD(freq * halfBand, 4, true),
								_calcRatio = calcRatio(freqLo),
								_calcRatio2 = _slicedToArray(_calcRatio, 2),
								binLo = _calcRatio2[0],
								ratioLo = _calcRatio2[1],
								_calcRatio3 = calcRatio(freqHi),
								_calcRatio4 = _slicedToArray(_calcRatio3, 2),
								binHi = _calcRatio4[0],
								ratioHi = _calcRatio4[1];

							// for 1/1, 1/2 and 1/3 ANSI bands, use the preferred numbers to find the nominal midband frequency
							// for 1/4 to 1/24, round to 2 or 3 significant digits, according to the MSD [ANSI S1.11-2004, p.12]
							if (_ansiBands)
								freq =
									bands < 4
										? nearestPreferred(freq)
										: roundSD(freq, freq.toString()[0] < 5 ? 3 : 2);
							else freq = roundSD(freq, 4, true);
							if (freq >= _minFreq)
								barsPush({
									posX: 0,
									freq: freq,
									freqLo: freqLo,
									freqHi: freqHi,
									binLo: binLo,
									binHi: binHi,
									ratioLo: ratioLo,
									ratioHi: ratioHi,
								});
							currFreq *= bandWidth;
						} while (currFreq <= _maxFreq);
						barWidth = analyzerWidth / bars.length;
						bars.forEach(function (bar, index) {
							return (bar.posX = initialX + index * barWidth);
						});
						var firstBar = bars[0],
							lastBar = bars[bars.length - 1];
						scaleMin = this._freqScaling(firstBar.freqLo);
						unitWidth = analyzerWidth / (this._freqScaling(lastBar.freqHi) - scaleMin);

						// clamp edge frequencies to minFreq / maxFreq, if necessary
						// this is done after computing scaleMin and unitWidth, for the proper positioning of labels on the X-axis
						if (firstBar.freqLo < _minFreq) {
							firstBar.freqLo = _minFreq;
							var _calcRatio5 = calcRatio(_minFreq);
							var _calcRatio6 = _slicedToArray(_calcRatio5, 2);
							firstBar.binLo = _calcRatio6[0];
							firstBar.ratioLo = _calcRatio6[1];
						}
						if (lastBar.freqHi > _maxFreq) {
							lastBar.freqHi = _maxFreq;
							var _calcRatio7 = calcRatio(_maxFreq);
							var _calcRatio8 = _slicedToArray(_calcRatio7, 2);
							lastBar.binHi = _calcRatio8[0];
							lastBar.ratioHi = _calcRatio8[1];
						}
					} else if (isBands) {
						// a bands mode is selected, but frequency scale is not logarithmic

						var _bands = [0, 24, 12, 8, 6, 4, 3, 2, 1][_mode] * 10;
						var invFreqScaling = function invFreqScaling(x) {
							switch (_this4._frequencyScale) {
								case SCALE_BARK:
									return 1960 / (26.81 / (x + 0.53) - 1);
								case SCALE_MEL:
									return 700 * (Math.pow(2, x) - 1);
								case SCALE_LINEAR:
									return x;
							}
						};
						barWidth = analyzerWidth / _bands;
						scaleMin = this._freqScaling(_minFreq);
						unitWidth = analyzerWidth / (this._freqScaling(_maxFreq) - scaleMin);
						for (var i = 0, posX = 0; i < _bands; i++, posX += barWidth) {
							var _freqLo = invFreqScaling(scaleMin + posX / unitWidth),
								_freq = invFreqScaling(scaleMin + (posX + barWidth / 2) / unitWidth),
								_freqHi = invFreqScaling(scaleMin + (posX + barWidth) / unitWidth),
								_calcRatio9 = calcRatio(_freqLo),
								_calcRatio0 = _slicedToArray(_calcRatio9, 2),
								_binLo = _calcRatio0[0],
								_ratioLo = _calcRatio0[1],
								_calcRatio1 = calcRatio(_freqHi),
								_calcRatio10 = _slicedToArray(_calcRatio1, 2),
								_binHi = _calcRatio10[0],
								_ratioHi = _calcRatio10[1];
							barsPush({
								posX: initialX + posX,
								freq: _freq,
								freqLo: _freqLo,
								freqHi: _freqHi,
								binLo: _binLo,
								binHi: _binHi,
								ratioLo: _ratioLo,
								ratioHi: _ratioHi,
							});
						}
					} else {
						// Discrete frequencies modes
						barWidth = 1;
						scaleMin = this._freqScaling(_minFreq);
						unitWidth = analyzerWidth / (this._freqScaling(_maxFreq) - scaleMin);
						var minIndex = this._freqToBin(_minFreq, "floor"),
							maxIndex = this._freqToBin(_maxFreq);
						var lastPos = -999;
						for (var _i1 = minIndex; _i1 <= maxIndex; _i1++) {
							var _freq2 = this._binToFreq(_i1),
								// frequency represented by this index
								_posX = initialX + Math.round(unitWidth * (this._freqScaling(_freq2) - scaleMin)); // avoid fractionary pixel values

							// if it's on a different X-coordinate, create a new bar for this frequency
							if (_posX > lastPos) {
								barsPush({
									posX: _posX,
									freq: _freq2,
									freqLo: _freq2,
									freqHi: _freq2,
									binLo: _i1,
									binHi: _i1,
									ratioLo: 0,
									ratioHi: 0,
								});
								lastPos = _posX;
							} // otherwise, add this frequency to the last bar's range
							else if (bars.length) {
								var _lastBar = bars[bars.length - 1];
								_lastBar.binHi = _i1;
								_lastBar.freqHi = _freq2;
								_lastBar.freq = Math.pow(_lastBar.freqLo * _freq2, 0.5); // compute center frequency (geometric mean)
							}
						}
					}

					/**
					 *  COMPUTE ATTRIBUTES FOR THE LED BARS
					 *
					 *	USES:
					 *		analyzerHeight
					 *		barWidth
					 *		noLedGap
					 *
					 *	GENERATES:
					 * 		spaceH
					 * 		spaceV
					 *		this._leds
					 */

					var spaceH = 0,
						spaceV = 0;
					if (isLeds) {
						// adjustment for high pixel-ratio values on low-resolution screens (Android TV)
						var dPR =
							this._pixelRatio /
							(window.devicePixelRatio > 1 && window.screen.height <= 540 ? 2 : 1);
						var params = [
							[],
							[128, 3, 0.45],
							// mode 1
							[128, 4, 0.225],
							// mode 2
							[96, 6, 0.225],
							// mode 3
							[80, 6, 0.225],
							// mode 4
							[80, 6, 0.125],
							// mode 5
							[64, 6, 0.125],
							// mode 6
							[48, 8, 0.125],
							// mode 7
							[24, 16, 0.125], // mode 8
						];

						// use custom LED parameters if set, or the default parameters for the current mode
						var customParams = this._ledParams,
							_ref3 = customParams || params[_mode],
							_ref4 = _slicedToArray(_ref3, 3),
							maxLeds = _ref4[0],
							spaceVRatio = _ref4[1],
							spaceHRatio = _ref4[2];
						var ledCount,
							maxHeight = analyzerHeight;
						if (customParams) {
							var minHeight = 2 * dPR;
							var blockHeight;
							ledCount = maxLeds + 1;
							do {
								ledCount--;
								blockHeight = maxHeight / ledCount / (1 + spaceVRatio);
								spaceV = blockHeight * spaceVRatio;
							} while ((blockHeight < minHeight || spaceV < minHeight) && ledCount > 1);
						} else {
							// calculate vertical spacing - aim for the reference ratio, but make sure it's at least 2px
							var refRatio = 540 / spaceVRatio;
							spaceV = Math.min(spaceVRatio * dPR, Math.max(2, (maxHeight / refRatio + 0.1) | 0));
						}

						// remove the extra spacing below the last line of LEDs
						if (noLedGap) maxHeight += spaceV;

						// recalculate the number of leds, considering the effective spaceV
						if (!customParams) ledCount = Math.min(maxLeds, (maxHeight / (spaceV * 2)) | 0);
						spaceH = spaceHRatio >= 1 ? spaceHRatio : barWidth * spaceHRatio;
						this._leds = [
							ledCount,
							spaceH,
							spaceV,
							maxHeight / ledCount - spaceV, // ledHeight
						];
					}

					// COMPUTE ADDITIONAL BAR POSITIONING, ACCORDING TO THE CURRENT SETTINGS
					// uses: _barSpace, barWidth, spaceH

					var barSpacePx = Math.min(
						barWidth - 1,
						_barSpace * (_barSpace > 0 && _barSpace < 1 ? barWidth : 1),
					);
					if (isBands) barWidth -= Math.max(isLeds ? spaceH : 0, barSpacePx);
					bars.forEach(function (bar, index) {
						var posX = bar.posX,
							width = barWidth;

						// in bands modes we need to update bar.posX to account for bar/led spacing

						if (isBands) {
							if (_barSpace == 0 && !isLeds) {
								// when barSpace == 0 use integer values for perfect gapless positioning
								posX |= 0;
								width |= 0;
								if (index > 0 && posX > bars[index - 1].posX + bars[index - 1].width) {
									posX--;
									width++;
								}
							} else posX += Math.max(isLeds ? spaceH : 0, barSpacePx) / 2;
							bar.posX = posX; // update
						}
						bar.barCenter = posX + (barWidth == 1 ? 0 : width / 2);
						bar.width = width;
					});

					// COMPUTE CHANNEL COORDINATES (uses spaceV)

					var channelCoords = [];
					for (var _i10 = 0, _arr0 = [0, 1]; _i10 < _arr0.length; _i10++) {
						var channel = _arr0[_i10];
						var channelTop =
								_chLayout == CHANNEL_VERTICAL ? (channelHeight + channelGap) * channel : 0,
							channelBottom = channelTop + channelHeight,
							analyzerBottom = channelTop + analyzerHeight - (!isLeds || noLedGap ? 0 : spaceV);
						channelCoords.push({
							channelTop: channelTop,
							channelBottom: channelBottom,
							analyzerBottom: analyzerBottom,
						});
					}

					// SAVE INTERNAL PROPERTIES

					this._aux = {
						analyzerHeight: analyzerHeight,
						analyzerWidth: analyzerWidth,
						centerX: centerX,
						centerY: centerY,
						channelCoords: channelCoords,
						channelHeight: channelHeight,
						channelGap: channelGap,
						initialX: initialX,
						innerRadius: innerRadius,
						outerRadius: outerRadius,
						scaleMin: scaleMin,
						unitWidth: unitWidth,
					};
					this._flg = {
						isAlpha: isAlpha,
						isBands: isBands,
						isLeds: isLeds,
						isLumi: isLumi,
						isOctaves: isOctaves,
						isOutline: isOutline,
						isRound: isRound,
						noLedGap: noLedGap,
					};

					// generate the X-axis and radial scales
					this._createScales();
				},

				/**
				 * Generate the X-axis and radial scales in auxiliary canvases
				 */
			},
			{
				key: "_createScales",
				value: function _createScales() {
					if (!this._ready) return;
					var _this$_aux = this._aux,
						analyzerWidth = _this$_aux.analyzerWidth,
						initialX = _this$_aux.initialX,
						innerRadius = _this$_aux.innerRadius,
						scaleMin = _this$_aux.scaleMin,
						unitWidth = _this$_aux.unitWidth,
						canvas = this.canvas,
						_frequencyScale = this._frequencyScale,
						_mirror = this._mirror,
						_noteLabels = this._noteLabels,
						_radial = this._radial,
						_scaleX = this._scaleX,
						_scaleR = this._scaleR,
						canvasX = _scaleX.canvas,
						canvasR = _scaleR.canvas,
						freqLabels = [],
						isDualHorizontal = this._chLayout == CHANNEL_HORIZONTAL,
						isDualVertical = this._chLayout == CHANNEL_VERTICAL,
						minDimension = Math.min(canvas.width, canvas.height),
						scale = ["C", , "D", , "E", "F", , "G", , "A", , "B"],
						scaleHeight = (minDimension / 34) | 0,
						fontSizeX = canvasX.height >> 1,
						fontSizeR = scaleHeight >> 1,
						labelWidthX = fontSizeX * (_noteLabels ? 0.7 : 1.5),
						labelWidthR = fontSizeR * (_noteLabels ? 1 : 2),
						root12 = Math.pow(2, 1 / 12);
					if (!_noteLabels && (this._ansiBands || _frequencyScale != SCALE_LOG)) {
						freqLabels.push(16, 31.5, 63, 125, 250, 500, 1e3, 2e3, 4e3);
						if (_frequencyScale == SCALE_LINEAR)
							freqLabels.push(6e3, 8e3, 10e3, 12e3, 14e3, 16e3, 18e3, 20e3, 22e3);
						else freqLabels.push(8e3, 16e3);
					} else {
						var freq = C_1;
						for (var octave = -1; octave < 11; octave++) {
							for (var note = 0; note < 12; note++) {
								if (freq >= this._minFreq && freq <= this._maxFreq) {
									var pitch = scale[note],
										isC = pitch == "C";
									if ((pitch && _noteLabels && !_mirror && !isDualHorizontal) || isC)
										freqLabels.push(_noteLabels ? [freq, pitch + (isC ? octave : "")] : freq);
								}
								freq *= root12;
							}
						}
					}

					// in radial dual-vertical layout, the scale is positioned exactly between both channels, by making the canvas a bit larger than the inner diameter
					canvasR.width = canvasR.height = Math.max(
						minDimension * 0.15,
						(innerRadius << 1) + isDualVertical * scaleHeight,
					);
					var centerR = canvasR.width >> 1,
						radialY = centerR - scaleHeight * 0.7; // vertical position of text labels in the circular scale

					// helper function
					var radialLabel = function radialLabel(x, label) {
						var angle = TAU * (x / canvas.width),
							adjAng = angle - HALF_PI,
							// rotate angles so 0 is at the top
							posX = radialY * Math.cos(adjAng),
							posY = radialY * Math.sin(adjAng);
						_scaleR.save();
						_scaleR.translate(centerR + posX, centerR + posY);
						_scaleR.rotate(angle);
						_scaleR.fillText(label, 0, 0);
						_scaleR.restore();
					};

					// clear scale canvas
					canvasX.width |= 0;
					_scaleX.fillStyle = _scaleR.strokeStyle = SCALEX_BACKGROUND_COLOR;
					_scaleX.fillRect(0, 0, canvasX.width, canvasX.height);
					_scaleR.arc(centerR, centerR, centerR - scaleHeight / 2, 0, TAU);
					_scaleR.lineWidth = scaleHeight;
					_scaleR.stroke();
					_scaleX.fillStyle = _scaleR.fillStyle = SCALEX_LABEL_COLOR;
					_scaleX.font = "".concat(fontSizeX, "px ").concat(FONT_FAMILY);
					_scaleR.font = "".concat(fontSizeR, "px ").concat(FONT_FAMILY);
					_scaleX.textAlign = _scaleR.textAlign = "center";
					var prevX = -labelWidthX / 4,
						prevR = -labelWidthR;
					for (var _i11 = 0, _freqLabels = freqLabels; _i11 < _freqLabels.length; _i11++) {
						var item = _freqLabels[_i11];
						var _ref5 = Array.isArray(item)
								? item
								: [item, item < 1e3 ? item | 0 : "".concat(((item / 100) | 0) / 10, "k")],
							_ref6 = _slicedToArray(_ref5, 2),
							_freq3 = _ref6[0],
							label = _ref6[1],
							x = unitWidth * (this._freqScaling(_freq3) - scaleMin),
							y = canvasX.height * 0.75,
							_isC = label[0] == "C",
							maxW =
								fontSizeX * (_noteLabels && !_mirror && !isDualHorizontal ? (_isC ? 1.2 : 0.6) : 3);

						// set label color - no highlight when mirror effect is active (only Cs displayed)
						_scaleX.fillStyle = _scaleR.fillStyle =
							_isC && !_mirror && !isDualHorizontal ? SCALEX_HIGHLIGHT_COLOR : SCALEX_LABEL_COLOR;

						// prioritizes which note labels are displayed, due to the restricted space on some ranges/scales
						if (_noteLabels) {
							var isLog = _frequencyScale == SCALE_LOG,
								isLinear = _frequencyScale == SCALE_LINEAR;
							var allowedLabels = ["C"];
							if (
								isLog ||
								_freq3 > 2e3 ||
								(!isLinear && _freq3 > 250) ||
								((!_radial || isDualVertical) && ((!isLinear && _freq3 > 125) || _freq3 > 1e3))
							)
								allowedLabels.push("G");
							if (
								isLog ||
								_freq3 > 4e3 ||
								(!isLinear && _freq3 > 500) ||
								((!_radial || isDualVertical) && ((!isLinear && _freq3 > 250) || _freq3 > 2e3))
							)
								allowedLabels.push("E");
							if (
								(isLinear && _freq3 > 4e3) ||
								((!_radial || isDualVertical) &&
									(isLog || _freq3 > 2e3 || (!isLinear && _freq3 > 500)))
							)
								allowedLabels.push("D", "F", "A", "B");
							if (!allowedLabels.includes(label[0])) continue; // skip this label
						}

						// linear scale
						if (x >= prevX + labelWidthX / 2 && x <= analyzerWidth) {
							_scaleX.fillText(
								label,
								isDualHorizontal && _mirror == -1 ? analyzerWidth - x : initialX + x,
								y,
								maxW,
							);
							if (isDualHorizontal || (_mirror && (x > labelWidthX || _mirror == 1)))
								_scaleX.fillText(
									label,
									isDualHorizontal && _mirror != 1
										? analyzerWidth + x
										: (initialX || canvas.width) - x,
									y,
									maxW,
								);
							prevX = x + Math.min(maxW, _scaleX.measureText(label).width) / 2;
						}

						// radial scale
						if (x >= prevR + labelWidthR && x < analyzerWidth - labelWidthR) {
							// avoid overlapping the last label over the first one
							radialLabel(isDualHorizontal && _mirror == 1 ? analyzerWidth - x : x, label);
							if (isDualHorizontal || (_mirror && (x > labelWidthR || _mirror == 1)))
								// avoid overlapping of first labels on mirror mode
								radialLabel(isDualHorizontal && _mirror != -1 ? analyzerWidth + x : -x, label);
							prevR = x;
						}
					}
				},

				/**
				 * Redraw the canvas
				 * this is called 60 times per second by requestAnimationFrame()
				 */
			},
			{
				key: "_draw",
				value: function _draw(timestamp) {
					var _this5 = this;
					// schedule next canvas update
					this._runId = requestAnimationFrame(function (timestamp) {
						return _this5._draw(timestamp);
					});

					// frame rate control
					var elapsed = timestamp - this._time,
						// time since last FPS computation
						frameTime = timestamp - this._last,
						// time since last rendered frame
						targetInterval = this._maxFPS ? 975 / this._maxFPS : 0; // small tolerance for best results

					if (frameTime < targetInterval) return;
					this._last = timestamp - (targetInterval ? frameTime % targetInterval : 0); // thanks https://stackoverflow.com/a/19772220/2370385
					this._frames++;
					if (elapsed >= 1000) {
						// update FPS every second
						this._fps = (this._frames / elapsed) * 1000;
						this._frames = 0;
						this._time = timestamp;
					}

					// initialize local constants

					var _this$_flg = this._flg,
						isAlpha = _this$_flg.isAlpha,
						isBands = _this$_flg.isBands,
						isLeds = _this$_flg.isLeds,
						isLumi = _this$_flg.isLumi,
						isOctaves = _this$_flg.isOctaves,
						isOutline = _this$_flg.isOutline,
						isRound = _this$_flg.isRound,
						noLedGap = _this$_flg.noLedGap,
						_this$_aux2 = this._aux,
						analyzerHeight = _this$_aux2.analyzerHeight,
						centerX = _this$_aux2.centerX,
						centerY = _this$_aux2.centerY,
						channelCoords = _this$_aux2.channelCoords,
						channelHeight = _this$_aux2.channelHeight,
						channelGap = _this$_aux2.channelGap,
						initialX = _this$_aux2.initialX,
						innerRadius = _this$_aux2.innerRadius,
						outerRadius = _this$_aux2.outerRadius,
						_bars = this._bars,
						canvas = this.canvas,
						_canvasGradients = this._canvasGradients,
						_chLayout = this._chLayout,
						_colorMode = this._colorMode,
						_ctx = this._ctx,
						_energy = this._energy,
						_fadePeaks = this._fadePeaks,
						fillAlpha = this.fillAlpha,
						_fps = this._fps,
						_linearAmplitude = this._linearAmplitude,
						_lineWidth = this._lineWidth,
						maxDecibels = this.maxDecibels,
						minDecibels = this.minDecibels,
						_mirror = this._mirror,
						_mode = this._mode,
						overlay = this.overlay,
						_radial = this._radial,
						showBgColor = this.showBgColor,
						showPeaks = this.showPeaks,
						useCanvas = this.useCanvas,
						_weightingFilter = this._weightingFilter,
						canvasX = this._scaleX.canvas,
						canvasR = this._scaleR.canvas,
						fadeFrames = (_fps * this._peakFadeTime) / 1e3,
						fpsSquared = Math.pow(_fps, 2),
						gravity = this._gravity * 1e3,
						holdFrames = (_fps * this._peakHoldTime) / 1e3,
						isDualCombined = _chLayout == CHANNEL_COMBINED,
						isDualHorizontal = _chLayout == CHANNEL_HORIZONTAL,
						isDualVertical = _chLayout == CHANNEL_VERTICAL,
						isSingle = _chLayout == CHANNEL_SINGLE,
						isTrueLeds = isLeds && this._trueLeds && _colorMode == COLOR_GRADIENT,
						analyzerWidth = _radial ? canvas.width : this._aux.analyzerWidth,
						finalX = initialX + analyzerWidth,
						showPeakLine = showPeaks && this._peakLine && _mode == MODE_GRAPH,
						maxBarHeight = _radial ? outerRadius - innerRadius : analyzerHeight,
						nominalMaxHeight = maxBarHeight / this._pixelRatio,
						dbRange = maxDecibels - minDecibels,
						_ref7 = this._leds || [],
						_ref8 = _slicedToArray(_ref7, 4),
						ledCount = _ref8[0],
						ledSpaceH = _ref8[1],
						ledSpaceV = _ref8[2],
						ledHeight = _ref8[3];
					if (_energy.val > 0 && _fps > 0) this._spinAngle += (this._spinSpeed * TAU) / 60 / _fps; // spinSpeed * angle increment per frame for 1 RPM

					/* HELPER FUNCTIONS */

					// create Reflex effect
					var doReflex = function doReflex(channel) {
						if (_this5._reflexRatio > 0 && !isLumi && !_radial) {
							var posY, height;
							if (_this5.reflexFit || isDualVertical) {
								// always fit reflex in vertical stereo mode
								posY = isDualVertical && channel == 0 ? channelHeight + channelGap : 0;
								height = channelHeight - analyzerHeight;
							} else {
								posY = canvas.height - analyzerHeight * 2;
								height = analyzerHeight;
							}
							_ctx.save();

							// set alpha and brightness for the reflection
							_ctx.globalAlpha = _this5.reflexAlpha;
							if (_this5.reflexBright != 1)
								_ctx.filter = "brightness(".concat(_this5.reflexBright, ")");

							// create the reflection
							_ctx.setTransform(1, 0, 0, -1, 0, canvas.height);
							_ctx.drawImage(
								canvas,
								0,
								channelCoords[channel].channelTop,
								canvas.width,
								analyzerHeight,
								0,
								posY,
								canvas.width,
								height,
							);
							_ctx.restore();
						}
					};

					// draw scale on X-axis
					var drawScaleX = function drawScaleX() {
						if (_this5.showScaleX) {
							if (_radial) {
								_ctx.save();
								_ctx.translate(centerX, centerY);
								if (_this5._spinSpeed) _ctx.rotate(_this5._spinAngle + HALF_PI);
								_ctx.drawImage(canvasR, -canvasR.width >> 1, -canvasR.width >> 1);
								_ctx.restore();
							} else _ctx.drawImage(canvasX, 0, canvas.height - canvasX.height);
						}
					};

					// returns the gain (in dB) for a given frequency, considering the currently selected weighting filter
					var weightingdB = function weightingdB(freq) {
						var f2 = Math.pow(freq, 2),
							SQ20_6 = 424.36,
							SQ107_7 = 11599.29,
							SQ158_5 = 25122.25,
							SQ737_9 = 544496.41,
							SQ12194 = 148693636,
							linearTodB = function linearTodB(value) {
								return 20 * Math.log10(value);
							};
						switch (_weightingFilter) {
							case FILTER_A:
								// A-weighting https://en.wikipedia.org/wiki/A-weighting
								var rA =
									(SQ12194 * Math.pow(f2, 2)) /
									((f2 + SQ20_6) * Math.sqrt((f2 + SQ107_7) * (f2 + SQ737_9)) * (f2 + SQ12194));
								return 2 + linearTodB(rA);
							case FILTER_B:
								var rB =
									(SQ12194 * f2 * freq) /
									((f2 + SQ20_6) * Math.sqrt(f2 + SQ158_5) * (f2 + SQ12194));
								return 0.17 + linearTodB(rB);
							case FILTER_C:
								var rC = (SQ12194 * f2) / ((f2 + SQ20_6) * (f2 + SQ12194));
								return 0.06 + linearTodB(rC);
							case FILTER_D:
								var h =
										(Math.pow(1037918.48 - f2, 2) + 1080768.16 * f2) /
										(Math.pow(9837328 - f2, 2) + 11723776 * f2),
									rD =
										(freq / 6.8966888496476e-5) * Math.sqrt(h / ((f2 + 79919.29) * (f2 + 1345600)));
								return linearTodB(rD);
							case FILTER_468:
								// ITU-R 468 https://en.wikipedia.org/wiki/ITU-R_468_noise_weighting
								var h1 =
										-4.737338981378384e-24 * Math.pow(freq, 6) +
										2.043828333606125e-15 * Math.pow(freq, 4) -
										1.363894795463638e-7 * f2 +
										1,
									h2 =
										1.306612257412824e-19 * Math.pow(freq, 5) -
										2.118150887518656e-11 * Math.pow(freq, 3) +
										5.559488023498642e-4 * freq,
									rI = (1.246332637532143e-4 * freq) / Math.hypot(h1, h2);
								return 18.2 + linearTodB(rI);
						}
						return 0; // unknown filter
					};

					// draws (stroke) a bar from x,y1 to x,y2
					var strokeBar = function strokeBar(x, y1, y2) {
						_ctx.beginPath();
						_ctx.moveTo(x, y1);
						_ctx.lineTo(x, y2);
						_ctx.stroke();
					};

					// conditionally strokes current path on canvas
					var strokeIf = function strokeIf(flag) {
						if (flag && _lineWidth) {
							var alpha = _ctx.globalAlpha;
							_ctx.globalAlpha = 1;
							_ctx.stroke();
							_ctx.globalAlpha = alpha;
						}
					};

					// converts a value in [0;1] range to a height in pixels that fits into the current LED elements
					var ledPosY = function ledPosY(value) {
						return Math.max(0, ((value * ledCount) | 0) * (ledHeight + ledSpaceV) - ledSpaceV);
					};

					// update energy information
					var updateEnergy = function updateEnergy(newVal) {
						_energy.val = newVal;
						if (_energy.peak > 0) {
							_energy.hold--;
							if (_energy.hold < 0)
								_energy.peak +=
									((_energy.hold * gravity) / fpsSquared / canvas.height) * _this5._pixelRatio;
							// TO-DO: replace `canvas.height * this._pixelRatio` with `maxNominalHeight` when implementing dual-channel energy
						}
						if (newVal >= _energy.peak) {
							_energy.peak = newVal;
							_energy.hold = holdFrames;
						}
					};

					/* MAIN FUNCTION */

					if (overlay) _ctx.clearRect(0, 0, canvas.width, canvas.height);
					var currentEnergy = 0;
					var nBars = _bars.length,
						nChannels = isSingle ? 1 : 2;
					var _loop = function _loop(channel) {
						var _channelCoords$channe = channelCoords[channel],
							channelTop = _channelCoords$channe.channelTop,
							channelBottom = _channelCoords$channe.channelBottom,
							analyzerBottom = _channelCoords$channe.analyzerBottom,
							channelGradient = _this5._gradients[_this5._selectedGrads[channel]],
							colorStops = channelGradient.colorStops,
							colorCount = colorStops.length,
							bgColor = !showBgColor || (isLeds && !overlay) ? "#000" : channelGradient.bgColor,
							radialDirection = isDualVertical && _radial && channel ? -1 : 1,
							invertedChannel = (!channel && _mirror == -1) || (channel && _mirror == 1),
							radialOffsetX =
								!isDualHorizontal || (channel && _mirror != 1)
									? 0
									: analyzerWidth >> (channel || !invertedChannel),
							angularDirection = isDualHorizontal && invertedChannel ? -1 : 1; // 1 = clockwise, -1 = counterclockwise
						/*
        			Expanded logic for radialOffsetX and angularDirection:
        
        			let radialOffsetX = 0,
        				angularDirection = 1;
        
        			if ( isDualHorizontal ) {
        				if ( channel == 0 ) { // LEFT channel
        					if ( _mirror == -1 ) {
        						radialOffsetX = analyzerWidth;
        						angularDirection = -1;
        					}
        					else
        						radialOffsetX = analyzerWidth >> 1;
        				}
        				else {                // RIGHT channel
        					if ( _mirror == 1 ) {
        						radialOffsetX = analyzerWidth >> 1;
        						angularDirection = -1;
        					}
        				}
        			}
        */
						// draw scale on Y-axis (uses: channel, channelTop)
						var drawScaleY = function drawScaleY() {
							var scaleWidth = canvasX.height,
								fontSize = scaleWidth >> 1,
								max = _linearAmplitude ? 100 : maxDecibels,
								min = _linearAmplitude ? 0 : minDecibels,
								incr = _linearAmplitude ? 20 : 5,
								interval = analyzerHeight / (max - min),
								atStart = _mirror != -1 && (!isDualHorizontal || channel == 0 || _mirror == 1),
								atEnd = _mirror != 1 && (!isDualHorizontal || channel != _mirror);
							_ctx.save();
							_ctx.fillStyle = SCALEY_LABEL_COLOR;
							_ctx.font = "".concat(fontSize, "px ").concat(FONT_FAMILY);
							_ctx.textAlign = "right";
							_ctx.lineWidth = 1;
							for (var val = max; val > min; val -= incr) {
								var posY = channelTop + (max - val) * interval,
									even = (val % 2 == 0) | 0;
								if (even) {
									var labelY = posY + fontSize * (posY == channelTop ? 0.8 : 0.35);
									if (atStart) _ctx.fillText(val, scaleWidth * 0.85, labelY);
									if (atEnd)
										_ctx.fillText(
											val,
											(isDualHorizontal ? analyzerWidth : canvas.width) - scaleWidth * 0.1,
											labelY,
										);
									_ctx.strokeStyle = SCALEY_LABEL_COLOR;
									_ctx.setLineDash([2, 4]);
									_ctx.lineDashOffset = 0;
								} else {
									_ctx.strokeStyle = SCALEY_MIDLINE_COLOR;
									_ctx.setLineDash([2, 8]);
									_ctx.lineDashOffset = 1;
								}
								_ctx.beginPath();
								_ctx.moveTo(initialX + scaleWidth * even * atStart, ~~posY + 0.5); // for sharp 1px line (https://stackoverflow.com/a/13879402/2370385)
								_ctx.lineTo(finalX - scaleWidth * even * atEnd, ~~posY + 0.5);
								_ctx.stroke();
							}
							_ctx.restore();
						};

						// FFT bin data interpolation (uses fftData)
						var interpolate = function interpolate(bin, ratio) {
							var value =
								fftData[bin] +
								(bin < fftData.length - 1 ? (fftData[bin + 1] - fftData[bin]) * ratio : 0);
							return isNaN(value) ? -Infinity : value;
						};

						// converts a given X-coordinate to its corresponding angle in radial mode (uses angularDirection)
						var getAngle = function getAngle(x) {
							var dir =
								arguments.length > 1 && arguments[1] !== undefined
									? arguments[1]
									: angularDirection;
							return dir * TAU * ((x + radialOffsetX) / canvas.width) + _this5._spinAngle;
						};

						// converts planar X,Y coordinates to radial coordinates (uses: getAngle(), radialDirection)
						var radialXY = function radialXY(x, y, dir) {
							var height = innerRadius + y * radialDirection,
								angle = getAngle(x, dir);
							return [centerX + height * Math.cos(angle), centerY + height * Math.sin(angle)];
						};

						// draws a polygon of width `w` and height `h` at (x,y) in radial mode (uses: angularDirection, radialDirection)
						var radialPoly = function radialPoly(x, y, w, h, stroke) {
							_ctx.beginPath();
							for (
								var _i12 = 0, _arr1 = _mirror && !isDualHorizontal ? [1, -1] : [angularDirection];
								_i12 < _arr1.length;
								_i12++
							) {
								var dir = _arr1[_i12];
								var _ref9 = isRound ? [getAngle(x, dir), getAngle(x + w, dir)] : [],
									_ref0 = _slicedToArray(_ref9, 2),
									startAngle = _ref0[0],
									endAngle = _ref0[1];
								_ctx.moveTo.apply(_ctx, _toConsumableArray(radialXY(x, y, dir)));
								_ctx.lineTo.apply(_ctx, _toConsumableArray(radialXY(x, y + h, dir)));
								if (isRound)
									_ctx.arc(
										centerX,
										centerY,
										innerRadius + (y + h) * radialDirection,
										startAngle,
										endAngle,
										dir != 1,
									);
								else _ctx.lineTo.apply(_ctx, _toConsumableArray(radialXY(x + w, y + h, dir)));
								_ctx.lineTo.apply(_ctx, _toConsumableArray(radialXY(x + w, y, dir)));
								if (isRound && !stroke)
									// close the bottom line only when not in outline mode
									_ctx.arc(
										centerX,
										centerY,
										innerRadius + y * radialDirection,
										endAngle,
										startAngle,
										dir == 1,
									);
							}
							strokeIf(stroke);
							_ctx.fill();
						};

						// set fillStyle and strokeStyle according to current colorMode (uses: channel, colorStops, colorCount)
						var setBarColor = function setBarColor() {
							var value = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 0;
							var barIndex = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;
							var color;
							// for graph mode, always use the channel gradient (ignore colorMode)
							if ((_colorMode == COLOR_GRADIENT && !isTrueLeds) || _mode == MODE_GRAPH)
								color = _canvasGradients[channel];
							else {
								var selectedIndex =
									_colorMode == COLOR_BAR_INDEX
										? barIndex % colorCount
										: colorStops.findLastIndex(function (item) {
												return isLeds ? ledPosY(value) <= ledPosY(item.level) : value <= item.level;
											});
								color = colorStops[selectedIndex].color;
							}
							_ctx.fillStyle = _ctx.strokeStyle = color;
						};

						// CHANNEL START

						if (useCanvas) {
							// set transform (horizontal flip and translation) for dual-horizontal layout
							if (isDualHorizontal && !_radial) {
								var translateX = analyzerWidth * (channel + invertedChannel),
									flipX = invertedChannel ? -1 : 1;
								_ctx.setTransform(flipX, 0, 0, 1, translateX, 0);
							}

							// fill the analyzer background if needed (not overlay or overlay + showBgColor)
							if (!overlay || showBgColor) {
								if (overlay) _ctx.globalAlpha = _this5.bgAlpha;
								_ctx.fillStyle = bgColor;

								// exclude the reflection area when overlay is true and reflexAlpha == 1 (avoids alpha over alpha difference, in case bgAlpha < 1)
								if (channel == 0 || (!_radial && !isDualCombined))
									_ctx.fillRect(
										initialX,
										channelTop - channelGap,
										analyzerWidth,
										(overlay && _this5.reflexAlpha == 1 ? analyzerHeight : channelHeight) +
											channelGap,
									);
								_ctx.globalAlpha = 1;
							}

							// draw dB scale (Y-axis) - avoid drawing it twice on 'dual-combined' channel layout
							if (_this5.showScaleY && !isLumi && !_radial && (channel == 0 || !isDualCombined))
								drawScaleY();

							// set line width and dash for LEDs effect
							if (isLeds) {
								_ctx.setLineDash([ledHeight, ledSpaceV]);
								_ctx.lineWidth = _bars[0].width;
							} else
								// for outline effect ensure linewidth is not greater than half the bar width
								_ctx.lineWidth = isOutline ? Math.min(_lineWidth, _bars[0].width / 2) : _lineWidth;

							// set clipping region
							_ctx.save();
							if (!_radial) {
								var region = new Path2D();
								region.rect(0, channelTop, canvas.width, analyzerHeight);
								_ctx.clip(region);
							}
						} // if ( useCanvas )

						// get a new array of data from the FFT
						var fftData = _this5._fftData[channel];
						_this5._analyzer[channel].getFloatFrequencyData(fftData);

						// apply weighting
						if (_weightingFilter)
							fftData = fftData.map(function (val, idx) {
								return val + weightingdB(_this5._binToFreq(idx));
							});

						// start drawing path (for graph mode)
						_ctx.beginPath();

						// store line graph points to create mirror effect in radial mode
						var points = [];

						// draw bars / lines
						var _loop2 = function _loop2() {
							var bar = _bars[barIndex],
								posX = bar.posX,
								barCenter = bar.barCenter,
								width = bar.width,
								freq = bar.freq,
								binLo = bar.binLo,
								binHi = bar.binHi,
								ratioLo = bar.ratioLo,
								ratioHi = bar.ratioHi;
							var barValue = Math.max(interpolate(binLo, ratioLo), interpolate(binHi, ratioHi));

							// check additional bins (if any) for this bar and keep the highest value
							for (var j = binLo + 1; j < binHi; j++) {
								if (fftData[j] > barValue) barValue = fftData[j];
							}

							// normalize bar amplitude in [0;1] range
							barValue = _this5._normalizedB(barValue);
							bar.value[channel] = barValue;
							currentEnergy += barValue;

							// update bar peak
							if (bar.peak[channel] > 0 && bar.alpha[channel] > 0) {
								bar.hold[channel]--;
								// if hold is negative, start peak drop or fade out
								if (bar.hold[channel] < 0) {
									if (_fadePeaks && !showPeakLine) {
										var initialAlpha =
											!isAlpha || (isOutline && _lineWidth > 0)
												? 1
												: isAlpha
													? bar.peak[channel]
													: fillAlpha;
										bar.alpha[channel] = initialAlpha * (1 + bar.hold[channel] / fadeFrames); // hold is negative, so this is <= 1
									} else
										bar.peak[channel] +=
											(bar.hold[channel] * gravity) / fpsSquared / nominalMaxHeight;
									// make sure the peak value is reset when using fadePeaks
									if (bar.alpha[channel] <= 0) bar.peak[channel] = 0;
								}
							}

							// check if it's a new peak for this bar
							if (barValue >= bar.peak[channel]) {
								bar.peak[channel] = barValue;
								bar.hold[channel] = holdFrames;
								// check whether isAlpha or isOutline are active to start the peak alpha with the proper value
								bar.alpha[channel] =
									!isAlpha || (isOutline && _lineWidth > 0) ? 1 : isAlpha ? barValue : fillAlpha;
							}

							// if not using the canvas, move earlier to the next bar
							if (!useCanvas) return 1; // continue

							// set opacity for bar effects
							_ctx.globalAlpha = isLumi || isAlpha ? barValue : isOutline ? fillAlpha : 1;

							// set fillStyle and strokeStyle for the current bar
							setBarColor(barValue, barIndex);

							// compute actual bar height on screen
							var barHeight = isLumi
								? maxBarHeight
								: isLeds
									? ledPosY(barValue)
									: (barValue * maxBarHeight) | 0;

							// Draw current bar or line segment

							if (_mode == MODE_GRAPH) {
								// compute the average between the initial bar (barIndex==0) and the next one
								// used to smooth the curve when the initial posX is off the screen, in mirror and radial modes
								var nextBarAvg = barIndex
									? 0
									: (_this5._normalizedB(fftData[_bars[1].binLo]) * maxBarHeight + barHeight) / 2;
								if (_radial) {
									if (barIndex == 0) {
										if (isDualHorizontal)
											_ctx.moveTo.apply(_ctx, _toConsumableArray(radialXY(0, 0)));
										_ctx.lineTo.apply(
											_ctx,
											_toConsumableArray(radialXY(0, posX < 0 ? nextBarAvg : barHeight)),
										);
									}
									// draw line to the current point, avoiding overlapping wrap-around frequencies
									if (posX >= 0) {
										var point = [posX, barHeight];
										_ctx.lineTo.apply(_ctx, _toConsumableArray(radialXY.apply(void 0, point)));
										points.push(point);
									}
								} else {
									// Linear
									if (barIndex == 0) {
										// start the line off-screen using the previous FFT bin value as the initial amplitude
										if (_mirror == -1 && !isDualHorizontal)
											_ctx.moveTo(
												initialX,
												analyzerBottom - (posX < initialX ? nextBarAvg : barHeight),
											);
										else {
											var prevFFTData = binLo
												? _this5._normalizedB(fftData[binLo - 1]) * maxBarHeight
												: barHeight; // use previous FFT bin value, when available
											_ctx.moveTo(initialX - _lineWidth, analyzerBottom - prevFFTData);
										}
									}
									// draw line to the current point
									// avoid X values lower than the origin when mirroring left, otherwise draw them for best graph accuracy
									if (isDualHorizontal || _mirror != -1 || posX >= initialX)
										_ctx.lineTo(posX, analyzerBottom - barHeight);
								}
							} else {
								if (isLeds) {
									// draw "unlit" leds - avoid drawing it twice on 'dual-combined' channel layout
									if (showBgColor && !overlay && (channel == 0 || !isDualCombined)) {
										var alpha = _ctx.globalAlpha;
										_ctx.strokeStyle = LEDS_UNLIT_COLOR;
										_ctx.globalAlpha = 1;
										strokeBar(barCenter, channelTop, analyzerBottom);
										// restore properties
										_ctx.strokeStyle = _ctx.fillStyle;
										_ctx.globalAlpha = alpha;
									}
									if (isTrueLeds) {
										// ledPosY() is used below to fit one entire led height into the selected range
										var colorIndex = isLumi
											? 0
											: colorStops.findLastIndex(function (item) {
													return ledPosY(barValue) <= ledPosY(item.level);
												});
										var last = analyzerBottom;
										for (var i = colorCount - 1; i >= colorIndex; i--) {
											_ctx.strokeStyle = colorStops[i].color;
											var y =
												analyzerBottom -
												(i == colorIndex ? barHeight : ledPosY(colorStops[i].level));
											strokeBar(barCenter, last, y);
											last = y - ledSpaceV;
										}
									} else strokeBar(barCenter, analyzerBottom, analyzerBottom - barHeight);
								} else if (posX >= initialX) {
									if (_radial) radialPoly(posX, 0, width, barHeight, isOutline);
									else if (isRound) {
										var halfWidth = width / 2,
											_y = analyzerBottom + halfWidth; // round caps have an additional height of half bar width

										_ctx.beginPath();
										_ctx.moveTo(posX, _y);
										_ctx.lineTo(posX, _y - barHeight);
										_ctx.arc(barCenter, _y - barHeight, halfWidth, PI, TAU);
										_ctx.lineTo(posX + width, _y);
										strokeIf(isOutline);
										_ctx.fill();
									} else {
										var offset = isOutline ? _ctx.lineWidth : 0;
										_ctx.beginPath();
										_ctx.rect(posX, analyzerBottom + offset, width, -barHeight - offset);
										strokeIf(isOutline);
										_ctx.fill();
									}
								}
							}

							// Draw peak
							var peakValue = bar.peak[channel],
								peakAlpha = bar.alpha[channel];
							if (
								peakValue > 0 &&
								peakAlpha > 0 &&
								showPeaks &&
								!showPeakLine &&
								!isLumi &&
								posX >= initialX &&
								posX < finalX
							) {
								// set opacity for peak
								if (_fadePeaks) _ctx.globalAlpha = peakAlpha;
								else if (isOutline && _lineWidth > 0)
									// when lineWidth == 0 ctx.globalAlpha remains set to `fillAlpha`
									_ctx.globalAlpha = 1;
								else if (isAlpha)
									// isAlpha (alpha based on peak value) supersedes fillAlpha if lineWidth == 0
									_ctx.globalAlpha = peakValue;

								// select the peak color for 'bar-level' colorMode or 'trueLeds'
								if (_colorMode == COLOR_BAR_LEVEL || isTrueLeds) setBarColor(peakValue);

								// render peak according to current mode / effect
								if (isLeds) {
									var ledPeak = ledPosY(peakValue);
									if (ledPeak >= ledSpaceV)
										// avoid peak below first led
										_ctx.fillRect(posX, analyzerBottom - ledPeak, width, ledHeight);
								} else if (!_radial)
									_ctx.fillRect(posX, analyzerBottom - peakValue * maxBarHeight, width, 2);
								else if (_mode != MODE_GRAPH) {
									// radial (peaks for graph mode are done by the peakLine code)
									var _y2 = peakValue * maxBarHeight;
									radialPoly(
										posX,
										_y2,
										width,
										!_this5._radialInvert || isDualVertical || _y2 + innerRadius >= 2 ? -2 : 2,
									);
								}
							}
						};
						for (var barIndex = 0; barIndex < nBars; barIndex++) {
							if (_loop2()) continue;
						} // for ( let barIndex = 0; barIndex < nBars; barIndex++ )

						// if not using the canvas, move earlier to the next channel
						if (!useCanvas) return 1; // continue

						// restore global alpha
						_ctx.globalAlpha = 1;

						// Fill/stroke drawing path for graph mode
						if (_mode == MODE_GRAPH) {
							setBarColor(); // select channel gradient

							if (_radial && !isDualHorizontal) {
								if (_mirror) {
									var p;
									while ((p = points.pop()))
										_ctx.lineTo.apply(
											_ctx,
											_toConsumableArray(
												radialXY.apply(void 0, _toConsumableArray(p).concat([-1])),
											),
										);
								}
								_ctx.closePath();
							}
							if (_lineWidth > 0) _ctx.stroke();
							if (fillAlpha > 0) {
								if (_radial) {
									// exclude the center circle from the fill area
									var start = isDualHorizontal ? getAngle(analyzerWidth >> 1) : 0,
										end = isDualHorizontal ? getAngle(analyzerWidth) : TAU;
									_ctx.moveTo.apply(
										_ctx,
										_toConsumableArray(radialXY(isDualHorizontal ? analyzerWidth >> 1 : 0, 0)),
									);
									_ctx.arc(
										centerX,
										centerY,
										innerRadius,
										start,
										end,
										isDualHorizontal ? !invertedChannel : true,
									);
								} else {
									// close the fill area
									_ctx.lineTo(finalX, analyzerBottom);
									_ctx.lineTo(initialX, analyzerBottom);
								}
								_ctx.globalAlpha = fillAlpha;
								_ctx.fill();
								_ctx.globalAlpha = 1;
							}

							// draw peak line (and standard peaks on radial)
							if (showPeakLine || (_radial && showPeaks)) {
								points = []; // for mirror line on radial
								_ctx.beginPath();
								_bars.forEach(function (b, i) {
									var x = b.posX,
										h = b.peak[channel],
										m = i ? "lineTo" : "moveTo";
									if (_radial && x < 0) {
										var nextBar = _bars[i + 1];
										h = findY(x, h, nextBar.posX, nextBar.peak[channel], 0);
										x = 0;
									}
									h *= maxBarHeight;
									if (showPeakLine) {
										_ctx[m].apply(
											_ctx,
											_toConsumableArray(_radial ? radialXY(x, h) : [x, analyzerBottom - h]),
										);
										if (_radial && _mirror && !isDualHorizontal) points.push([x, h]);
									} else if (h > 0) radialPoly(x, h, 1, -2); // standard peaks (also does mirror)
								});
								if (showPeakLine) {
									var _p;
									while ((_p = points.pop()))
										_ctx.lineTo.apply(
											_ctx,
											_toConsumableArray(
												radialXY.apply(void 0, _toConsumableArray(_p).concat([-1])),
											),
										); // mirror line points
									_ctx.lineWidth = 1;
									_ctx.stroke(); // stroke peak line
								}
							}
						}
						_ctx.restore(); // restore clip region

						if (isDualHorizontal && !_radial) _ctx.setTransform(1, 0, 0, 1, 0, 0);

						// create Reflex effect - for dual-combined and dual-horizontal do it only once, after channel 1
						if ((!isDualHorizontal && !isDualCombined) || channel) doReflex(channel);
					};
					for (var channel = 0; channel < nChannels; channel++) {
						if (_loop(channel)) continue;
					} // for ( let channel = 0; channel < nChannels; channel++ ) {

					updateEnergy(currentEnergy / (nBars << (nChannels - 1)));
					if (useCanvas) {
						// Mirror effect
						if (_mirror && !_radial && !isDualHorizontal) {
							_ctx.setTransform(-1, 0, 0, 1, canvas.width - initialX, 0);
							_ctx.drawImage(
								canvas,
								initialX,
								0,
								centerX,
								canvas.height,
								0,
								0,
								centerX,
								canvas.height,
							);
							_ctx.setTransform(1, 0, 0, 1, 0, 0);
						}

						// restore solid lines
						_ctx.setLineDash([]);

						// draw frequency scale (X-axis)
						drawScaleX();
					}

					// display current frame rate
					if (this.showFPS) {
						var size = canvasX.height;
						_ctx.font = "bold ".concat(size, "px ").concat(FONT_FAMILY);
						_ctx.fillStyle = FPS_COLOR;
						_ctx.textAlign = "right";
						_ctx.fillText(Math.round(_fps), canvas.width - size, size * 2);
					}

					// call callback function, if defined
					if (this.onCanvasDraw) {
						_ctx.save();
						_ctx.fillStyle = _ctx.strokeStyle = _canvasGradients[0];
						this.onCanvasDraw(this, {
							timestamp: timestamp,
							canvasGradients: _canvasGradients,
						});
						_ctx.restore();
					}
				},

				/**
				 * Return scaled frequency according to the selected scale
				 */
			},
			{
				key: "_freqScaling",
				value: function _freqScaling(freq) {
					switch (this._frequencyScale) {
						case SCALE_LOG:
							return Math.log2(freq);
						case SCALE_BARK:
							return (26.81 * freq) / (1960 + freq) - 0.53;
						case SCALE_MEL:
							return Math.log2(1 + freq / 700);
						case SCALE_LINEAR:
							return freq;
					}
				},

				/**
				 * Return the FFT data bin (array index) which represents a given frequency
				 */
			},
			{
				key: "_freqToBin",
				value: function _freqToBin(freq) {
					var method = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : "round";
					var max = this._analyzer[0].frequencyBinCount - 1,
						bin = Math[method]((freq * this.fftSize) / this.audioCtx.sampleRate);
					return bin < max ? bin : max;
				},

				/**
				 * Generate currently selected gradient
				 */
			},
			{
				key: "_makeGrad",
				value: function _makeGrad() {
					var _this6 = this;
					if (!this._ready) return;
					var canvas = this.canvas,
						_ctx = this._ctx,
						_radial = this._radial,
						_reflexRatio = this._reflexRatio,
						_this$_aux3 = this._aux,
						analyzerWidth = _this$_aux3.analyzerWidth,
						centerX = _this$_aux3.centerX,
						centerY = _this$_aux3.centerY,
						initialX = _this$_aux3.initialX,
						innerRadius = _this$_aux3.innerRadius,
						outerRadius = _this$_aux3.outerRadius,
						isLumi = this._flg.isLumi,
						isDualVertical = this._chLayout == CHANNEL_VERTICAL,
						analyzerRatio = 1 - _reflexRatio,
						gradientHeight = isLumi
							? canvas.height
							: (canvas.height * (1 - _reflexRatio * !isDualVertical)) | 0;
					// for vertical stereo we keep the full canvas height and handle the reflex areas while generating the color stops
					var _loop3 = function _loop3() {
						var channel = _arr10[_i13];
						var currGradient = _this6._gradients[_this6._selectedGrads[channel]],
							colorStops = currGradient.colorStops,
							isHorizontal = currGradient.dir == "h";
						var grad;
						if (_radial)
							grad = _ctx.createRadialGradient(
								centerX,
								centerY,
								outerRadius,
								centerX,
								centerY,
								innerRadius - (outerRadius - innerRadius) * isDualVertical,
							);
						else
							grad = _ctx.createLinearGradient.apply(
								_ctx,
								_toConsumableArray(
									isHorizontal
										? [initialX, 0, initialX + analyzerWidth, 0]
										: [0, 0, 0, gradientHeight],
								),
							);
						if (colorStops) {
							var dual = isDualVertical && !_this6._splitGradient && (!isHorizontal || _radial);
							var _loop4 = function _loop4(channelArea) {
								var maxIndex = colorStops.length - 1;
								colorStops.forEach(function (colorStop, index) {
									var offset = colorStop.pos;

									// in dual mode (not split), use half the original offset for each channel
									if (dual) offset /= 2;

									// constrain the offset within the useful analyzer areas (avoid reflex areas)
									if (isDualVertical && !isLumi && !_radial && !isHorizontal) {
										offset *= analyzerRatio;
										// skip the first reflex area in split mode
										if (!dual && offset > 0.5 * analyzerRatio) offset += 0.5 * _reflexRatio;
									}

									// only for dual-vertical non-split gradient (creates full gradient on both halves of the canvas)
									if (channelArea == 1) {
										// add colors in reverse order if radial or lumi are active
										if (_radial || isLumi) {
											var revIndex = maxIndex - index;
											colorStop = colorStops[revIndex];
											offset = 1 - colorStop.pos / 2;
										} else {
											// if the first offset is not 0, create an additional color stop to prevent bleeding from the first channel
											if (index == 0 && offset > 0) grad.addColorStop(0.5, colorStop.color);
											// bump the offset to the second half of the gradient
											offset += 0.5;
										}
									}

									// add gradient color stop
									grad.addColorStop(offset, colorStop.color);

									// create additional color stop at the end of first channel to prevent bleeding
									if (isDualVertical && index == maxIndex && offset < 0.5)
										grad.addColorStop(0.5, colorStop.color);
								});
							};
							for (var channelArea = 0; channelArea < 1 + dual; channelArea++) {
								_loop4(channelArea);
							} // for ( let channelArea = 0; channelArea < 1 + dual; channelArea++ )
						}
						_this6._canvasGradients[channel] = grad;
					};
					for (var _i13 = 0, _arr10 = [0, 1]; _i13 < _arr10.length; _i13++) {
						_loop3();
					} // for ( const channel of [0,1] )
				},

				/**
				 * Normalize a dB value in the [0;1] range
				 */
			},
			{
				key: "_normalizedB",
				value: function _normalizedB(value) {
					var isLinear = this._linearAmplitude,
						boost = isLinear ? 1 / this._linearBoost : 1,
						clamp = function clamp(val, min, max) {
							return val <= min ? min : val >= max ? max : val;
						},
						dBToLinear = function dBToLinear(val) {
							return Math.pow(10, val / 20);
						};
					var maxValue = this.maxDecibels,
						minValue = this.minDecibels;
					if (isLinear) {
						maxValue = dBToLinear(maxValue);
						minValue = dBToLinear(minValue);
						value = Math.pow(dBToLinear(value), boost);
					}
					return clamp((value - minValue) / Math.pow(maxValue - minValue, boost), 0, 1);
				},

				/**
				 * Internal function to change canvas dimensions on demand
				 */
			},
			{
				key: "_setCanvas",
				value: function _setCanvas(reason) {
					if (!this._ready) return;
					var canvas = this.canvas,
						_ctx = this._ctx,
						canvasX = this._scaleX.canvas,
						pixelRatio = window.devicePixelRatio / (this._loRes + 1);
					var screenWidth = window.screen.width * pixelRatio,
						screenHeight = window.screen.height * pixelRatio;

					// Fix for iOS Safari - swap width and height when in landscape
					if (Math.abs(window.orientation) == 90 && screenWidth < screenHeight) {
						var _ref1 = [screenHeight, screenWidth];
						screenWidth = _ref1[0];
						screenHeight = _ref1[1];
					}
					var isFullscreen = this.isFullscreen,
						isCanvasFs = isFullscreen && this._fsEl == canvas,
						newWidth = isCanvasFs
							? screenWidth
							: ((this._width || this._container.clientWidth || this._defaultWidth) * pixelRatio) |
								0,
						newHeight = isCanvasFs
							? screenHeight
							: ((this._height || this._container.clientHeight || this._defaultHeight) *
									pixelRatio) |
								0;

					// set/update object properties
					this._pixelRatio = pixelRatio;
					this._fsWidth = screenWidth;
					this._fsHeight = screenHeight;

					// if this is not the constructor call and canvas dimensions haven't changed, quit
					if (reason != REASON_CREATE && canvas.width == newWidth && canvas.height == newHeight)
						return;

					// apply new dimensions
					canvas.width = newWidth;
					canvas.height = newHeight;

					// if not in overlay mode, paint the canvas black
					if (!this.overlay) {
						_ctx.fillStyle = "#000";
						_ctx.fillRect(0, 0, newWidth, newHeight);
					}

					// set lineJoin property for area fill mode (this is reset whenever the canvas size changes)
					_ctx.lineJoin = "bevel";

					// update dimensions of the scale canvas
					canvasX.width = newWidth;
					canvasX.height = Math.max(20 * pixelRatio, (Math.min(newWidth, newHeight) / 32) | 0);

					// calculate bar positions and led options
					this._calcBars();

					// (re)generate gradient
					this._makeGrad();

					// detect fullscreen changes (for Safari)
					if (this._fsStatus !== undefined && this._fsStatus !== isFullscreen)
						reason = REASON_FSCHANGE;
					this._fsStatus = isFullscreen;

					// call the callback function, if defined
					if (this.onCanvasResize) this.onCanvasResize(reason, this);
				},

				/**
				 * Select a gradient for one or both channels
				 *
				 * @param {string} name gradient name
				 * @param [{number}] desired channel (0 or 1) - if empty or invalid, sets both channels
				 */
			},
			{
				key: "_setGradient",
				value: function _setGradient(name, channel) {
					if (!this._gradients.hasOwnProperty(name))
						throw new AudioMotionError(ERR_UNKNOWN_GRADIENT, name);
					if (![0, 1].includes(channel)) {
						this._selectedGrads[1] = name;
						channel = 0;
					}
					this._selectedGrads[channel] = name;
					this._makeGrad();
				},

				/**
				 * Set object properties
				 */
			},
			{
				key: "_setProps",
				value: function _setProps(options, useDefaults) {
					// callback functions properties
					var callbacks = ["onCanvasDraw", "onCanvasResize"];

					// properties not in the defaults (`stereo` is deprecated)
					var extraProps = ["gradientLeft", "gradientRight", "stereo"];

					// build an array of valid properties; `start` is not an actual property and is handled after setting everything else
					var validProps = Object.keys(DEFAULT_SETTINGS)
						.filter(function (e) {
							return e != "start";
						})
						.concat(callbacks, extraProps);
					if (useDefaults || options === undefined)
						options = _objectSpread(_objectSpread({}, DEFAULT_SETTINGS), options); // merge options with defaults

					for (
						var _i14 = 0, _Object$keys2 = Object.keys(options);
						_i14 < _Object$keys2.length;
						_i14++
					) {
						var prop = _Object$keys2[_i14];
						if (callbacks.includes(prop) && typeof options[prop] !== "function")
							// check invalid callback
							this[prop] = undefined;
						else if (validProps.includes(prop))
							// set only valid properties
							this[prop] = options[prop];
					}

					// deprecated - move this to the constructor in the next major release (`start` should be constructor-specific)
					if (options.start !== undefined) this.toggleAnalyzer(options.start);
				},
			},
		],
		[
			{
				key: "version",
				get: function get() {
					return VERSION;
				},
			},
		],
	);
})();
export { AudioMotionAnalyzer };
export default AudioMotionAnalyzer;
