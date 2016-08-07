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
	 *   target : 窗口ID
	 *       
	 *   header  文本标题，默认居中
	 *
	 *   style   : text
	 *             div
	 *   content 具体内容
	 *           
	 *   footer: []
	 *     position: left, center, right
	 *     text    : 按钮文字
	 *     hanlder : 按钮点击后的处理逻辑    
	 */
	function show(opt) {
		var dlgTemplate =
			'<div class="wui_dialog_body bounce_center">' +
			  '<div class="wui_dialog_image"></div>' +
			  '<div class="wui_dialog_header"></div>' +
			  '<div class="wui_dialog_content"></div>' +
			  '<div class="wui_dialog_footer"></div>' +
			'</div>';

		$el = document.createElement('div');
		addClass($el, 'wui_dialog');
		$el.innerHTML = dlgTemplate;

		var $header = $el.querySelector('.wui_dialog_header');
		var $content = $el.querySelector('.wui_dialog_content');
		var $footer = $el.querySelector('.wui_dialog_footer');

		// 标题
		if( !opt.title || opt.title === '') {
			$header.innerHTML = '';
		} else {
			$header.innerHTML = '<div class="wui_dialog_title_center">' + opt.title + '</div>';
		}
		
		//处理内容数据
		var content = opt.content || null;
		var style = opt.style || 'text';
		if( content !== null) {
			if( style === 'text' ) {
				$content.innerHTML = '<p class="wui_dialog_content_p">' + content + "</p>";
			} else {
				$content.innerHTML = content;
			}
		}
		
		//处理脚部数据
		var footer = opt.footer || null;
		if( footer != null) {
			footer.forEach(function(item, i){
				var $newEl = document.createElement('div');
				addClass($newEl, 'wui_dialog_button_' + item.position);
				$newEl.innerHTML = item.text;

				$newEl.addEventListener('click', function(){
					item.handler && item.handler();
					close();
				});
				$footer.appendChild($newEl);
			});
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
		show : show
	}
})
