/*
* 	Sprite Animation v1.0 - jQuery plugin
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
				cols: 1, 		// number of column in the sprite
				rows: 3, 		// number of rows in the sprite
				speed: 100,		// number of ms between each frame
				// can also be a function that returns number of ms between each frame
				// speed: function (col, row, total) {	
				//	return 10 * col;
				// },
				iterations: 0, 	// number of iteration (0 for infinite)
				delay: 0,		// number of ms added at the end of each iteration
				width: 'auto', 	// auto | number of pixel per step
				height: 'auto',	// auto | number of pixel per step
				startCol: 0,	// start col offset
				startRow: 0,	// start row offset
				dataKey: 'sprite-animation',
				count: function () { return this.cols * this.rows; }
			},
			_private: {
				_createBackgroundPosition: _createBackgroundPosition,
				_preAnimate: _preAnimate,
				_transition: _transition,
				_getSpeed: _getSpeed,
				_isNumeric: _isNumeric
			}
		}
	});
	
	// patching older version of jquery
	function _isNumeric(val) {
		var isNum = false;
		if ($.isFunction($.isNumeric)) {
			isNum = $.isNumeric(val);
		} else if ($.isFunction($.isNaN)) {
			isNum = !$.isNaN(val);
		} else {
			isNum = val != null && !window.isNaN(val);
		}
		
		return isNum;
	};
	
	// private methods
	function _createBackgroundPosition(x, y) {
		return x + 'px ' + y + 'px';
	};
	
	function _preAnimate(o) {
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
			shouldAdvance = o.iterations == 0 ||  // unlimited
						   (o.iterations != 0 && o.current.iteration < o.iterations); // limited
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
		
		return shouldAdvance;
	};
	
	function _getSpeed(o) {
		// get default value
		var speed = $.spriteAnimation.defaults.speed;
		
		// evaluate
		if (_isNumeric(o.speed)) {
			speed = o.speed;
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
	};
	
	function _nextFrame(elem, o) {
		timer = setTimeout(function timeout () {
			_animate(elem, o);
		}, _getSpeed(o));
	};
	
	function _transition(elem, o) {
		elem.css({'background-position': _createBackgroundPosition(-o.current.col * o.width, -o.current.row * o.height) });
	};
	
	function _animate(elem, o) {
		
		// calculate our new values
		var shouldAdvance = _preAnimate(o);
		
		// actual transition
		_transition(elem, o);
		
		// next step
		if (shouldAdvance) {
			_nextFrame(elem, o);
		}
	};
	
	var timer = null;
	
	// actual plugin
	$.fn.spriteAnimation = function (options) {
		// check if we have a non empty jQuery object
		if (!this.each || !this[0]) {
			return this;
		}
		
		// check if options passed is a stop command
		if (options === 'stop') {
			clearTimeout(timer);
			timer = null;
			return this;
		}
		
		// create current options object
		var o = $.extend({}, $.spriteAnimation.defaults, options),
			t = $(this);
		
		// extend o with the current object
		o = $.extend(true, o, {
			// extend the current object in it
			current : {
				row: options.startRow,
				col: options.startCol,
				iteration: 0,
				index: (o.startRow * o.cols) + o.startCol,
				delay: 0
			}
		});
		
		// assure with
		if (o.width == 'auto') {
			o.width = t.width();
		}
		// assure height
		if (o.height == 'auto') {
			o.height = t.height();
		}
		
		// set initial values
		_transition(t, o);
		
		// start animation
		_nextFrame(t, o);
		
		// return current scope
		return this;
	};
	
})(jQuery);