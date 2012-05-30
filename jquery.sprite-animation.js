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
								// function that returns number of ms between
				speed: function (col, row, total) {	
					return 500;
				},
				iterations: 0, 	// number of iteration (0 for infinite)
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
				_transition: _transition
			}
		}
	});
	
	//
	
	// private methods
	function _createBackgroundPosition(x, y) {
		return x + 'px ' + y + 'px';
	};
	
	function _preAnimate(o) {
		// increment index, always
		o.currentIndex ++;
		
		var endOverflow = o.currentIndex >= o.count(),
			rowOverflow = o.currentRow+1 >= o.rows,
			colOverflow = o.currentCol+1 >= o.cols,
			shouldAdvance = true;
		
		// detect end overflow
		if ( endOverflow ) {
			
			// increment iteration count
			o.currentIteration++;
			
			// restart from the beginning
			o.currentIndex = 0;
			o.currentRow = 0;
			o.currentCol = 0;
			
			// detect iteration overflow
			shouldAdvance = o.iterations == 0 || o.currentIteration < o.iterations;
		} 
		
		// detect col overflow
		else if (colOverflow && !rowOverflow) {
			o.currentRow++;
			o.currentCol = 0;
		} else {
			o.currentCol++;
		}
		return shouldAdvance;
	};
	
	function _nextStep(elem, o) {
		setTimeout(function () {
			_animate(elem, o);
		}, o.speed(o.currentRow, o.currentCol, o.count()));
	};
	
	function _transition(elem, o) {
		elem.css({'background-position': _createBackgroundPosition(-o.currentCol * o.width, -o.currentRow * o.height) });
	};
	
	function _animate(elem, o) {
		
		// calculate our new values
		var shouldAdvance = _preAnimate(o);
		
		// actual transition
		_transition(elem, o);
		
		// next step
		if (shouldAdvance) {
			_nextStep(elem, o);
		}
	};
	
	// actual plugin
	$.fn.spriteAnimation = function (options) {
		if (!this.each || !this[0]) {
			return this;
		}
		
		var o = $.extend({}, $.spriteAnimation.defaults, options);

		return this.each(function (index, elem) {
			var t = $(elem),
				d = $.extend(true, o, {
					currentRow: o.startRow,
					currentCol: o.startCol,
					currentIteration: 0,
					currentIndex: (o.startRow * o.cols) + o.startCol
				});
			
			if (d.width == 'auto') {
				d.width = t.width();
			}
			if (d.height == 'auto') {
				d.height = t.height();
			}
			
			
			// set initial values
			_transition(t, o);
			
			// start animation
			_nextStep(t, d);
		});
	};
	
})(jQuery);