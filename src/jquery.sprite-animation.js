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
	
	/**
	 * Patching older version of jQuery
	 * 
	 * @param val - the variable to evaluate against
	 * @returns boolean
	 */ 
	_isNumeric = function (val) {
		var isNum = false;
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
	 * Utility method for getting the current timestamp
	 * 
	 * @returns integer (in ms since January 1st, 1970)
	 */
	_now = function () {
		return (new Date()).getTime();
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
		else if (colOverflow && !rowOverflow) {
			o.current.row++;
			o.current.col = 0;
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
	
	_setTimeout = function (fx, elem, delay) {
		var frm = reqAnFrm || w.setTimeout;

		return frm(fx, useReqAnFrm ? elem : delay);
	},

	_clearTimeout = function (timeout) {
		var frm = cancelReqAnFrm || w.clearTimeout;

		return frm(timeout);
	},
	
	/**
	 * Utility function for the timer (next frame)
	 * 
	 * @param elem - the target jQuery object
	 * @param o - options
	 * @returns null
	 */
	_nextFrame = function (elem, o) {
		var 
		data = elem.data(),
		delay = _getSpeed(o),
		// use FF timestamp or now
		start = w.mozAnimationStartTime || _now(),
		frame = function (timestamp) {
			var n = timestamp || _now(), // take UA timestamp, if available
				diff = n - data[o.dataKey+'timestamp'],
				ratio = Math.floor(diff/delay),
				i;
				
			if (!delay || ratio >= 1) {
				data[o.dataKey+'timestamp'] = n;
				// this loops assure sync animations
				// when the fps can't be acheived
				for (i = 0; i < (ratio || 1); i++) {
					_animate(elem, o, i === ratio-1);
				}
			} else {
				data[o.dataKey] = _setTimeout(frame, elem, delay);
			}
		};
		// start polling now
		frame(start);
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
	 * @param scheduleTimer - tells the method to call _nextFrame
	 * @returns null
	 */
	_animate = function (elem, o, scheduleTimer) {
		
		// calculate our new values
		var shouldAdvance = _preAnimate(o);
		
		// actual transition
		_transition(elem, o);
		
		// next step
		if (shouldAdvance.shouldAdvance) {
			// frame callback
			if ($.isFunction(o.frameComplete)) {
				o.frameComplete.call(elem, o);
			}
			
			// iteration callback
			if (shouldAdvance.iterationEnd && $.isFunction(o.iterationComplete)) {
				o.iterationComplete.call(elem, o);
			}
			
			// if we need to schedule for repaint
			if (scheduleTimer) {
				_nextFrame(elem, o);
			}
			
		} else {
			// animation ended callabck
			if ($.isFunction(o.animationComplete)) {
				o.animationComplete.call(elem, o);
			}
		}
		
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
			_clearTimeout(timer);
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
		_clearTimeout(timer);
		timer = data[o.dataKey] = null;
		data[o.dataKey+'timestamp'] = _now();
		
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