define(function(){
	"use strict";

	function lazyLoader(target) {
		this.images = $('[data-original]', $(target));
	}

	lazyLoader.prototype.render = function() {
		$.each(this.images, function(index, item){
			if(item.getBoundingClientRect().top < document.documentElement.clientHeight && !item.isLoad){
				item.isLoad = true;
				item.style.cssText = "transition: ''; opacity: 0;"
				var url = $(item).data('original');
				load(item, url);
				(function(){
					setTimeout(function(){
						item.style.cssText = "transition: 1s; opacity: 1;"
					}, 16)
				})();
			}
		});
	}

	function load(obj, url){
		var oImg = new Image();
		oImg.onload = function(){
			oImg.onload = null;
			obj.src = oImg.src;
		}
		oImg.src = url;
	}

	return lazyLoader;
})
