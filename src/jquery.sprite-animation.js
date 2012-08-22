/*
*	Sprite Animation v1.0 - jQuery plugin
*
*	Copyright (c) 2012 Deux Huit Huit (http://www.nitriques.com/open-source/)
*	Licensed under the MIT (https://raw.github.com/DeuxHuitHuit/jQuery-sprite-animation/master/LICENSE.txt)
*/

(function ($, undefined) {
	
	"use strict";
	
	// defaults settings
	$.extend({
		spriteAnimation: {
			defaults : {
				cols: 1,        // number of column in the sprite
				rows: 3,        // number of rows in the sprite
				speed: 100,     // number of ms between each frame
				fps: null,		// speed can also be set on a frame per second basis
				// can also be a function that returns number of ms between each frame
				// speed: function (col, row, total) {
				//   return 10 * col;
				// },
				iterations: 0,  // number of maximum iterations (0 for infinite)
				delay: 0,       // number of ms added at the end of each iteration
				width: 'auto',  // auto | number of pixel per step
				height: 'auto', // auto | number of pixel per step
				startCol: 0,    // start col offset
				startRow: 0,    // start row offset
				dataKey: 'sprite-animation',
				count: function () { return this.cols * this.rows; },
				frameAnimation: true, // set to false to force the use of setTimeout
				beforeFrame: null,   // callback before each frame
				frameComplete: null, // callback on each frame
				iterationComplete: null, // callback at the end of each iteration
				animationComplete: null // callback at the end of the animation (after all iterations)
			}
		}
	});
	
	// variables definitions
	var
	
	w = window,
	
	reqAnFrm = w.requestAnimationFrame || w.mozRequestAnimationFrame ||  
				w.webkitRequestAnimationFrame || w.msRequestAnimationFrame ||
				w.oRequestAnimationFrame,
				
	cancelReqAnFrm = w.cancelAnimationFrame || 
				w.webkitCancelRequestAnimationFrame || w.webkitCancelAnimationFrame ||
				w.mozCancelRequestAnimationFrame || w.oCancelRequestAnimationFrame ||
				w.msCancelRequestAnimationFrame,
				
	useReqAnFrm = !!reqAnFrm && !!cancelReqAnFrm,
	
	mustUseReqAnFrm = function (options) {
		return options.frameAnimation && useReqAnFrm;
	},
	
	/**
	 * Patching older version of jQuery
	 * 
	 * @param val - the variable to evaluate against
	 * @returns boolean
	 */ 
	_isNumeric = function (val) {
		var isNum = false;
		// should we really need jQuery here,
		// since the WHOLE code as been rewritten ?
		if ($.isFunction($.isNumeric)) {
			isNum = $.isNumeric(val);
		} else if ($.isFunction($.isNaN)) {
			isNum = !$.isNaN(val);
		} else {
			isNum = val !== true && val !== false && val != null && !window.isNaN(val);
		}
		
		return isNum;
	},
	
	/**
	 * Utility method that concats the x and y values
	 * 
	 * @param x
	 * @param y
	 * @returns "Xpx Ypx"
	 */
	_createBackgroundPosition = function (x, y) {
		return x + 'px ' + y + 'px';
	},
	
	/**
	 * Check if the animation should continue to next frame.
	 * Returns true if it does, based on the given options.
	 * 
	 * @param o - options
	 * @returns boolean
	 */
	_preAnimate = function (o) {
		// increment index, always
		o.current.index ++;
		
		// reset the delay
		o.current.delay = 0;
		
		// detect overflows
		var endOverflow = o.current.index >= o.count(),
			rowOverflow = o.current.row+1 >= o.rows,
			colOverflow = o.current.col+1 >= o.cols,
			shouldAdvance = true;
		
		// detect end overflow
		if ( endOverflow ) {
			
			// increment iteration count
			o.current.iteration ++;
			
			// restart from the beginning
			o.current.index = 0;
			o.current.row = 0;
			o.current.col = 0;
			
			// add the delay
			o.current.delay = o.delay;
			
			// detect iteration overflow
			shouldAdvance = o.iterations === 0 || // unlimited
							(o.iterations !== 0 && o.current.iteration < o.iterations); // limited
		} 
		
		// detect col overflow
		// checking rowOveflow is unnesscary since we will have end oveflow
		else if (colOverflow && !rowOverflow) {
			o.current.row++;
			o.current.col = 0;
		}
		
		// detect row overflow
		else if (rowOverflow) {
			// is this possible ???
		}
		
		// advance
		else {
			o.current.col++;
		}
		
		return {
			shouldAdvance: shouldAdvance,
			iterationEnd: endOverflow
		};
	},
	
	/**
	 * Utility function that computes the value of the
	 * timeout duration. It checks in the options speed
	 * is a value or function. If it's neither, the default
	 * is used 
	 * 
	 * @param o - options
	 * @returns number - in ms
	 */
	_getSpeed = function (o) {
		var speed;
		
		// evaluate fps
		if (_isNumeric(o.fps) && o.fps > 0) {
			speed = parseInt(1000 / o.fps, 10);
		
		// check if speed is numeric
		} else if (_isNumeric(o.speed)) {
			speed = o.speed;
			
		// check if speed is a function
		} else if ($.isFunction(o.speed)) {
			speed = o.speed(o.current.col, o.current.row, o.count());
		}
		
		// assure value is numeric
		if (!_isNumeric(speed)) {
			speed = 0;
		}
		
		// add current delay
		speed += o.current.delay;
		
		return speed;
	},
	
	/**
	 * Utility function that wraps capabilities
	 * of window.requestAnimationFrame and window.setTimeout.
	 * The implementation used depends on the UA and options.
	 * 
	 * @param fx - the callback function 
	 * @param elem - the element to be animated
	 * @param o - options
	 * @param time - the time for the setTimeout function
	 * @returns number - timer handle, if given by the UA
	 */
	_setTimeout = function (fx, elem, o, time) {
		var frm = mustUseReqAnFrm(o) ? reqAnFrm : w.setTimeout;

		return frm(fx, mustUseReqAnFrm(o) ? elem : time);
	},

	/**
	 * Utility function that wraps capabilities
	 * of window.cancelAnimationFrame and window.clearTimeout.
	 * The implementation used depends on the UA and options.
	 * 
	 * @param timeout - the timer handle
	 * @param o - options
	 * @returns null
	 */
	_clearTimeout = function (timeout, o) {
		var frm = mustUseReqAnFrm(o) ? cancelReqAnFrm : w.clearTimeout;

		return frm(timeout);
	},
	
	/**
	 * Utility function for the timer (next animation frame).
	 * This function is called at each end of animation
	 * and handles the tick.
	 * 
	 * @param elem - the target jQuery object
	 * @param o - options
	 * @returns object - the result of _preAnimate
	 */
	_nextFrame = function (elem, o) {
		var 
		data = elem.data(),
		// use FF timestamp or now
		start = w.mozAnimationStartTime || $.now(),
		// frame check
		// this function is the timeout callback
		tick = function (timestamp) {
			var delay = _getSpeed(o),
				n = timestamp || $.now(), // take UA timestamp, if available
				diff = n - data[o.dataKey+'timestamp'],
				ratio = Math.round(diff/delay),
				i = 0;
				
			if (!delay || ratio >= 1) {
				// update timestamp now
				// the be able to time the time
				// taken by our code
				data[o.dataKey+'timestamp'] = $.now();
			
				// this loops assure sync animations
				// when the requested fps can't be achieved
				for (; i < (ratio || 1); i++) {
					var res = _animate(elem, o, data, i === ratio-1);
					
					if (!res.shouldAdvance || res.iterationEnd) {
						if (res.iterationEnd) {
							nextTick(delay);
						}
						break;
					}
				}
				
			} else {
				console.log('skip');
				nextTick(delay);
			}
		},
		nextTick = function (delay) {
			data[o.dataKey] = _setTimeout(tick, elem, o, delay);
		};
		
		data[o.dataKey+'timestamp'] = start;
		
		// start polling now
		tick(start);
	},
	
	/**
	 * Utility function that apply a background position based
	 * on the values in the current object in the option parameter
	 * 
	 * @param elem - the target jQuery object
	 * @param o - options
	 * @returns null
	 */
	_transition = function (elem, o) {
		elem.css({'background-position': _createBackgroundPosition(-o.current.col * o.width, -o.current.row * o.height) });
	},
	
	/**
	 * Actual animation frame. Will be called by the timer.
	 * 
	 * @param elem - the target jQuery object
	 * @param o - options
	 * @param data - the element's related data object
	 * @param scheduleTimer - tells the method to call _nextFrame
	 * @returns null
	 */
	_animate = function (elem, o, data, scheduleTimer) {
		
		// before frame callback
		if ($.isFunction(o.beforeFrame)) {
			o.beforeFrame.call(elem, o);
		}
		
		// calculate our new values
		var shouldAdvance = _preAnimate(o);
		
		// actual transition
		_transition(elem, o);
		
		// next step
		if (shouldAdvance.shouldAdvance) {
			
			// frame callback
			// only if a new schedule is planned
			if (scheduleTimer && $.isFunction(o.frameComplete)) {
				o.frameComplete.call(elem, o);
			}
			
			// iteration callback
			if (shouldAdvance.iterationEnd && $.isFunction(o.iterationComplete)) {
				o.iterationComplete.call(elem, o);
			}
			
			// if we need to schedule for repaint
			if (scheduleTimer) {
				
				// request next frame
				_nextFrame(elem, o);
			}
			
		} else {
			// animation ended callabck
			if ($.isFunction(o.animationComplete)) {
				o.animationComplete.call(elem, o);
			}
		}
		return shouldAdvance;
	};
	// end var block
	
	// actual plugin
	$.fn.spriteAnimation = function (options) {
		// check if we have a non empty jQuery object
		if (!this.each || !this[0]) {
			return this;
		}
		
		// create current options object
		var o = $.extend({}, $.spriteAnimation.defaults, options),
			t = $(this),
			data = t.data(),
			timer = data[o.dataKey];
		
		// check if options passed is a stop command
		if (options === 'stop') {
			o = data[o.dataKey + '-options'];
			_clearTimeout(timer, o);
			timer = data[o.dataKey] = null;
			return this;
		// or a start command
		} else if (options === 'start') {
			o = data[o.dataKey + '-options'];
			if (!timer && !!o) {
				_nextFrame(t, o);
			}
			return this;
		}
		
		// extend o with the current object
		o = $.extend(true, o, {
			// extend the current object in it
			current : {
				row: o.startRow || 0,
				col: o.startCol || 0,
				iteration: 0,
				index: ((o.startRow * o.cols) + o.startCol) || 0,
				delay: 0
			}
		});
		
		// clear any running timer
		_clearTimeout(timer, o);
		timer = null;
		
		// assure with
		if (o.width == 'auto') {
			o.width = t.width();
		}
		// assure height
		if (o.height == 'auto') {
			o.height = t.height();
		}
		
		// Save options
		data[o.dataKey + '-options'] = o;
		
		// set initial values
		_transition(t, o);
		
		// start animation in a seperate context
		// to prevent call stack build from stopping here
		w.setTimeout(function startFrameAnimation () {
			_nextFrame(t, o);
		});
		
		// return current scope
		return this;
	};

	$.extend($.spriteAnimation, { _private: {
		_createBackgroundPosition: _createBackgroundPosition,
		_preAnimate: _preAnimate,
		_transition: _transition,
		_getSpeed: _getSpeed,
		_isNumeric: _isNumeric
	}});

})(jQuery);