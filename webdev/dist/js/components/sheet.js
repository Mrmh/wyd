/**
 * Created by lmh on 2016/1/22.
 */


/**
 * .dialog 包含.animated相关的定义
 *   .dialog_header
 *      .dialog_title
 *   .dialog_content
 *      p
 *      ul
 *   .dialog_footer
 *      .dialog_button_left
 *      .dialog_button_center
 *      .dialog_button_right
 *      
 * 
 * .bounce_bottom_in
 * .bounce_bottom_out
 * .bounce_center_in
 * .bounce_center_out
 *   
 * .dialog_background
 */
define(function(){
	"use strict";
	var $dom = window.document;
	
	/**
	 * opt:
   	 *   style : bottom 对应样式bounce_bottom
	 *           full   对应样式bounce_full
	 *
	 *   create : true | false
	 *           是否需要新建处理对象
	 *   target : 在create为false时必须设定,使用当前页面中的一个元素
	 *
	 *   header
	 *     title: 标题
	 *     button: 按钮文字
	 *     handler: 按钮的操作行为
	 *   
	 *   content: 内容要素, 有两种格式:
	 *            类型是string,则需要自行选择,适用于在页面上定义了相关的内容模块
	 *            类型是dom元素,则直接在内容架构中增加相关的元素即可
	 *
	 *   footer: []
	 *     position: left, center, right
	 *     text    : 按钮文字
	 *     hanlder : 按钮点击后的处理逻辑    
	 */
	function Sheet(opt) {
		var that = this;

		opt = opt || {};
		var create = opt.create || false;
		if( !create ) {
			this.$sheetDiv = $dom.querySelector(opt.target);
			this.$body = this.$sheetDiv.querySelector('.wui_sheet_body');
		} else {
			this.$sheetDiv = $dom.createElement('div');
			addClass(this.$sheetDiv, 'wui_sheet');

			this.$body = $dom.createElement('div');
			addClass(this.$body, 'wui_sheet_body');
			this.$sheetDiv.appendChild(this.$body);

			// 加入到DOM中
			var $container = $dom.querySelector(".wui_container");
			$container.appendChild(this.$sheetDiv);

			//var $wuiSheet = $dom.querySelector(".wui_sheet");
			//$wuiSheet.addEventListener("touchmove",function(e){
			//	e.preventDefault();
			//});

		}

		this.style = opt.style || 'full';
		var dlgStyle = 'bounce_full';
		if( this.style === 'bottom') {
			dlgStyle = 'bounce_bottom';
		}
		addClass(this.$body, dlgStyle);
		
		this.openStyle = dlgStyle + '_in';
		this.closeStyle = dlgStyle + '_out';

		if( opt.header ) {
			if( create === true) {
				this.$header = $dom.createElement('div');
				addClass(this.$header, 'wui_sheet_header');
				this.$body.appendChild(this.$header);
			} else {
				this.$header = this.$body.querySelector('.wui_sheet_header');
			}

			var strHeader = '<div class="wui_sheet_header_con">';
			strHeader += '<div class="wui_sheet_title_left">' + opt.header.title + '</div>';
			if( opt.header.button ) {
			   strHeader += '<div class="wui_sheet_header_button">' + opt.header.button + '</div>'
			}
			strHeader += '</div>';
			this.$header.innerHTML = strHeader;
			
			if( opt.header.handler ) {
				var $headerHandler = this.$header.querySelector('.wui_sheet_header_button');
				$headerHandler.addEventListener('click', function(){
        			opt.header.handler && opt.header.handler();
        			that.close();
				});
			}
		}

		// 加入内容信息
		if( create === true) {
			var $contentContainer = $dom.createElement('div');
			addClass($contentContainer, 'wui_sheet_content');

			var $content = opt.content;
			if (typeof $content === 'string') {
				$content = $dom.querySelector($content);
			}
			this.$body.appendChild($contentContainer);
			$contentContainer.appendChild($content);
		}

		if( opt.footer ) {
			this.$footer = $dom.createElement('div');
			addClass(this.$footer, 'wui_sheet_footer');
			this.$body.appendChild(this.$footer);

			opt.footer.forEach(function(item, index){
				var $el = $dom.createElement('div');
				if( item.position === 'left') {
					addClass($el, 'wui_sheet_footer_lt');
				} else if( item.position === 'right') {
					addClass($el, 'wui_sheet_footer_rt');
				} else {
					addClass($el, 'wui_sheet_footer_ct');
				}
				$el.innerHTML = item.text;
				that.$footer.appendChild($el);

				$el.addEventListener('click', function(){
					item.handler && item.handler();
					that.close();
				});
			});
		}
		//this.$bg.addEventListener('click', function(){
		//	that.close();
		//});
	}

	Sheet.prototype.getHeader = function() {
		return this.$header;
	}

	Sheet.prototype.getFooter = function() {
		return this.$footer;
	}

	Sheet.prototype.show = function() {
		removeClass(this.$body, this.closeStyle);
		addClass(this.$body, this.openStyle);

		this.$sheetDiv.style.display = 'block';
//		fadeIn(this.$el);
	}

	Sheet.prototype.close = function() {
		removeClass(this.$body, this.openStyle);
		addClass(this.$body, this.closeStyle);

		this.$sheetDiv.style.display = 'none';
	}

	function addClass($el, className) {
		if ($el.classList) {
			$el.classList.add(className);
		} else {
			$el.className += className;
		}
	}
	
	function removeClass($el, className) {
		if ($el.classList)
		  $el.classList.remove(className);
		else
		  $el.className = el.className.replace(new RegExp('(^|\\b)' + className.split(' ').join('|') + '(\\b|$)', 'gi'), ' ');
	}

	return Sheet;
})
