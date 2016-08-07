/**
 * Created by CGZ on 16/4/6.
 */

define(function(){
	"use strict";
	$('[data-page]').on('click', function() {
			var page = $(this).data("page");
			if (page) {
				window.location = page;
			}
	});
	
	//用户输入呼出键盘，解决footer浮动
	//window.onresize = function() {
	//	var top = $(".wui_footer").offset().top;
	//	var user_message_box = $('.wui_footer');
	//	top > 400 ? user_message_box.hide() : user_message_box.show();
	//};
	
	var isEmpty = function(obj) {
		if(typeof(obj) != "undefined"){
			if(obj != null){
				if(obj != "" && obj.length != 0){
					return false;
				}
			}
		}
		return true;
	}

	function toArray(collection){
		var ary = [];
		for(var i=0, len = collection.length; i < len; i++){
			ary.push(collection[i]);
		}
		return ary;
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

	function parseDateTime(datetime) {
		return new Date(Date.parse(datetime.replace(/-/g, "/")));
	}

	function parseTime(time) {
		var currDate = formatDate(new Date(), 'yyyy/MM/dd ');
		return new Date(Date.parse(currDate + time));
	}

	var formatDate = function(date, format) {
		var o = {
			"M+" : date.getMonth()+1, //month
			"d+" : date.getDate(), //day
			"h+" : date.getHours(), //hour
			"m+" : date.getMinutes(), //minute
			"s+" : date.getSeconds(), //second
			"q+" : Math.floor((date.getMonth()+3)/3), //quarter
			"S" : date.getMilliseconds() //millisecond
		};
		if(/(y+)/.test(format))
		{
			format=format.replace(RegExp.$1,(date.getFullYear()+"").substr(4- RegExp.$1.length));
		}
		for(var k in o)
		{
			if(new RegExp("("+ k +")").test(format))
			{
				format = format.replace(RegExp.$1,RegExp.$1.length==1? o[k] :("00"+ o[k]).substr((""+ o[k]).length));
			}
		}
		return format;
	};
	
	return {
		isEmpty		: 		isEmpty,
		parseDateTime : 	parseDateTime,
		parseTime   : 	    parseTime,
		formatDate  :		formatDate,
		toArray     :		toArray,
		addClass	:		addClass,
		removeClass	:		removeClass
	}
})
