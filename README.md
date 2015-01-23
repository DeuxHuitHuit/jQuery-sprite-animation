# jQuery Sprite Animation [![Build Status](https://secure.travis-ci.org/DeuxHuitHuit/jQuery-sprite-animation.png?branch=master)](http://travis-ci.org/DeuxHuitHuit/jQuery-sprite-animation) 

> jQuery plugin that quickly enables you to create 'gif' style animation with a png/jpeg sprite

## Usage

```js
$('.element').spriteAnimation(defaults : {
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
	endOnLastFrame: false, // ends on last frame instead of the first
	dataKey: 'sprite-animation',
	count: function () { return this.cols * this.rows; },
	frameAnimation: true, // set to false to force the use of setTimeout
	beforeFrame: null,   // callback before each frame
	frameComplete: null, // callback on each frame
	iterationComplete: null, // callback at the end of each iteration
	animationComplete: null // callback at the end of the animation (after all iterations)
});

```

## Methods

```js
$('.element').spriteAnimation('stop');
$('.element').spriteAnimation('start');
```