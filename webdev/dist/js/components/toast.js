/**
 * .dialog 包含.animated相关的定义
 *   .dialog_header
 *      .dialog_title
 *   .dialog_content
 *   .dialog_footer
 *      .dialog_button_left
 *      .dialog_button_right
 *      
 * .bounce_center_in
 * .bounce_center_out
 *   
 * .dialog_background
 */
define(function(){
	"use strict";

	var $dom = window.document;
	var $container = $dom.querySelector(".wui_container");

	var $el;

	/**
	 * opt:
	 *   text       : toast中的文字
	 *   waitting   : 显示等待图标,默认为显示
	 */
	function show(text, waitting) {
		$el = document.createElement('div');
		addClass($el, 'wui_toast');

		var $body = $dom.createElement('div');
		addClass($body, 'wui_toast_body');
		addClass($body, 'wui_bounce');
		$el.appendChild($body);

		var $image = $dom.createElement('div');
		addClass($image, 'wui_toast_image');
		$body.appendChild($image);

		var $content = $dom.createElement('div');
		addClass($content, 'wui_toast_content');
		$body.appendChild($content);

		waitting = waitting || true;
		if( waitting ) {
			var $wait = $dom.createElement('div');
			addClass($wait, 'wui-fading-circle');
			$wait.innerHTML =
				'<div class="wui-circle1 wui-circle"></div>' +
				'<div class="wui-circle2 wui-circle"></div>' +
				'<div class="wui-circle3 wui-circle"></div>' +
				'<div class="wui-circle4 wui-circle"></div>' +
				'<div class="wui-circle5 wui-circle"></div>' +
				'<div class="wui-circle6 wui-circle"></div>' +
				'<div class="wui-circle7 wui-circle"></div>' +
				'<div class="wui-circle8 wui-circle"></div>' +
				'<div class="wui-circle9 wui-circle"></div>' +
				'<div class="wui-circle10 wui-circle"></div>' +
				'<div class="wui-circle11 wui-circle"></div>' +
				'<div class="wui-circle12 wui-circle"></div>';
			$content.appendChild($wait);
		}

		if( typeof text === 'string' && text !== '') {
			var $text = $dom.createElement('p');
			addClass($text, 'wui_toast_text');
			$text.innerHTML = text;
			$content.appendChild($text);
		}

		$container.appendChild($el);
	}

	function close() {
		$el.parentNode.removeChild($el);
	}

	function addClass($el, className) {
		if ($el.classList) {
			$el.classList.add(className);
		} else {
			$el.className += className;
		}
	}

	return {
		show : show,
		close: close
	}
})
