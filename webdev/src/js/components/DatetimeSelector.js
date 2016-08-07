require.config(requireConfig);

define((['Sheet']),function(Sheet) {
	"use strict";

	var $dom = window.document;

	var template =
		        '<ul class="horizon_lines_top">' +
		          '<li class="horizon_line"></li>' +
		          '<li class="horizon_line horize_line_middle"></li>' +
		          '<li class="horizon_line"></li>' +
		        '</ul>' +
		        '<ul class="horizon_lines_bottom">' +
		          '<li class="horizon_line"></li>' +
		          '<li class="horizon_line horize_line_middle"></li>' +
		          '<li class="horizon_line"></li>' +
		        '</ul>';

	//
	// 传入的参数包括：
	//    openTime    : 每天送餐开始时间，HH:MM
	//    closeTime   : 每天送餐截止时间，HH:MM
	//    operdateDate: 运营开始时间，如果为''表示从今天开始计算运营日期,YYYY-MM-DD
	//    presaleDates: 预约总日期数，默认为15天
	//
	function TimeSelector(opt) {
		// 时间选择框的根元素
		this.$container = $dom.createElement('div');
		addClass(this.$container, 'dialog_box');
		this.$container.innerHTML = template;

		// 弹出层定义
		this.sheetTime = new Sheet({
			create  : true,
			style   : 'bottom',
			content : this.$container,
			header  : opt.header
		});

		// 对内部的数据进行初始化
		this.data = {};
		this.data.dates = [];
		this.data.hours = [];
		this.data.minutes = [];
		
		this.control = {};
		this.control.selDateIndex = -1;
		this.control.selHourIndex = -1;
		this.control.selMinuteIndex = -1;
		
		// 处理传入的参数
		this.openTime = '';
		this.closeTime = '';
		this.operateDate = '';
		this.presaleDates = 0;
		this.appointDate = '';
		this.appointTime = '';
	}

	TimeSelector.prototype.show = function () {
		// 对当前时间进行一些预处理
		this.calcCurrIndex();
		this.handleDateScrollTo(this.control.currDateIndex);

		this.sheetTime.show();
	}

	TimeSelector.prototype.setDate = function (opt) {
		// 处理传入的参数
		this.appointDate = opt.appointDate || '';
		this.appointTime = opt.appointTime || '';

		var openTime = opt.openTime || '11:00';
		var closeTime = opt.closeTime || '00:00';
		var presaleDates = opt.presaleDates || 15;
		var operateDate = '';
		//如果未运营,只能选择开始运营后的日期
		if(opt.operateDate && parseDateTime(opt.operateDate) > new Date()) {
			operateDate = opt.operateDate || '';
		}

		if (this.presaleDates === presaleDates && // 预售时间长短没有变化
			this.openTime === openTime && this.closeTime === closeTime && // 起止时间没有变化
			this.operateDate === operateDate) { // 营运开始日期没有变化
			return; // 不需要重新渲染页面
		}

		if (this.$el) {
			this.$el.parentNode.removeChild(this.$el);
		}

		this.$el = $dom.createElement('div');
		addClass(this.$el, 'ts_datetime');
		this.$container.appendChild(this.$el);

		// 在target中创建相关的数据容器
		this.$el.innerHTML =
			'<ul class="ts_day"></ul>' +
			'<ul class="ts_hour"></ul>' +
			'<ul class="ts_min"></ul>';

		this.$date = this.$el.querySelector('.ts_day');
		this.$hour = this.$el.querySelector('.ts_hour');
		this.$minute = this.$el.querySelector('.ts_min');

		var startHour = parseTime(openTime);
		var currCloseTime = parseTime(closeTime);
		if( currCloseTime.getHours() >= 0 && currCloseTime.getHours() < 8) {
			// 如果结束时间在0点以后，表示在凌晨结束营业，日期加一天
			currCloseTime.setDate(currCloseTime.getDate() + 1);
		}
		currCloseTime.setMinutes(currCloseTime.getMinutes() - 15);

		//创建日期数据
		this.data.dates = [];
		// 根据传入的参数计算当前应当设定的日期和时间等
		var startDate;
		if( operateDate !== '' ) {
			// 运营日期不是当天
			startDate = parseDateTime(operateDate);
			this.control.isIncludeToday = false;
		} else {
			startDate = new Date();
			startDate.setMinutes(startDate.getMinutes() + 60);
			// 如果当前时间未超过了停止送餐时间，开始送餐时间为凌晨,则从前一个日期开始计算
			if( startDate < currCloseTime && startDate.getHours() >= 0 && startDate.getHours() < 5) {
				startDate.setDate(startDate.getDate() - 1);
			}
			this.control.isIncludeToday = true;
		}
		this.operateDate = operateDate;

		var strDate = '';
		for(var i = 0; i < presaleDates; i++) {
			var dateStr = formatDate(startDate, 'dd');
			strDate +=
				'<li id="date_' +  dateStr + '">' +
				'<span class="current_month">' + formatDate(startDate, 'MM月') + '</span>' +
				'&nbsp;&nbsp;' + dateStr + '日</li>';

			this.data.dates[i] = formatDate(startDate, 'yyyy-MM-dd');
			startDate.setDate(startDate.getDate() + 1);
		}
		this.$date.innerHTML = strDate;
		this.presaleDates = presaleDates;

		// 处理小时信息
		this.data.hours = [];

		// 计算起始时间和结束时间用于生成小时列表
		var strHour = '';
		for(var i = 0; startHour < currCloseTime; i++) {
			var hourStr = formatDate(startHour, 'hh');
			strHour += '<li id="hour_' +  hourStr + '">' + hourStr + '时</li>';

			this.data.hours[i] = hourStr;
			startHour.setHours(startHour.getHours() + 1);
		}

		this.$hour.innerHTML = strHour;
		this.openTime = openTime;
		this.closeTime = closeTime;

		// 初始化分钟
		if( !this.data.minutes || this.data.minutes.length == 0 ) {
			this.data.minutes = ['00', '15', '30', '45'];
			
			var strMinute = '';
			for (var i = 0; i < this.data.minutes.length; i++) {
				strMinute += '<li id="minute_' + this.data.minutes[i] + '">' + this.data.minutes[i] + '分</li>';
			}
			this.$minute.innerHTML = strMinute;
		}
		
		this.itemHeight = parseInt(getComputedStyle(this.$hour.querySelector('li')).height);
		this.bind();

		this.calcCurrIndex();
		this.handleDateScrollTo(0);
	}

	TimeSelector.prototype.find = function(t, d) {
		var currIndex = 0;
		var attrs;
		if( t === 'date' ) {
			attrs = this.data.dates;
		} else if( t === 'hour') {
			attrs = this.data.hours;
		} else if( t === 'minute') {
			attrs = this.data.minutes;
		}

		attrs.forEach(function(item, index) {
			if( item === d) {
				currIndex = index;
				return true;
			}
		});
		return currIndex;
	}
	
	TimeSelector.prototype.calcCurrIndex = function () {
		var currTime;
		if( this.appointDate !== '') {
			// 根据传入的参数确定当前的时间
			currTime = parseDateTime(this.appointDate + ' ' + this.appointTime);
		} else {
			if( this.control.isIncludeToday ) {
				// 如果未设定预约时间,则默认使用当天的日期

				// 先在当前时间上增加60分钟，这个是最早送餐时间
				currTime = new Date();
				currTime.setMinutes(currTime.getMinutes() + 60);
			}
		}
		if( currTime ) {
			var openTime = parseTime(this.openTime);
			// 如果当前时间小于开始营业时间
			if( currTime < openTime) {
				currTime = openTime;
			}
		}

		var currCloseTime = parseTime(this.closeTime);
		if( currCloseTime.getHours() >= 0 && currCloseTime.getHours() < 8) {
			// 如果结束时间在0点以后，表示在凌晨结束营业，日期加一天
			currCloseTime.setDate(currCloseTime.getDate() + 1);
		}

		// 对于营运日期在今天以后的情况以及指定日期在今天结束日期以后的时间,直接在数组中进行匹配
		if( !this.control.isIncludeToday || currTime > currCloseTime) {
			this.control.currDateIndex = this.find('date', formatDate(currTime, 'yyyy-MM-dd'));
			this.control.currHourIndex = this.find('hour', formatDate(currTime, 'hh'));
			this.control.currMinuteIndex = this.find('minute', formatDate(currTime, 'mm'));;
			return;
		}

		this.control.currDateIndex = 0; // 日期默认都是从第一条开始处理
		var minute = currTime.getMinutes();
		var firstMinuteStr = '00';
		if( minute == 0) {
		} else if(minute > 0 && minute <= 15) {
			firstMinuteStr = '15';
		} else if(minute > 15 && minute <= 30) {
			firstMinuteStr = '30';
		} else if(minute > 30 && minute <= 45) {
			firstMinuteStr = '45';
		} else {
			currTime.setHours(currTime.getHours() + 1);
			firstMinuteStr = '00';
		}

		var firstHourStr = formatDate(currTime, "hh");
		
		for(var i = 0; i < this.data.hours.length; i++) {
			if( this.data.hours[i] === firstHourStr) {
				this.control.currHourIndex = i;
				break;
			} 
		}
		for(var i = 0; i < this.data.minutes.length; i++) {
			if( this.data.minutes[i] === firstMinuteStr) {
				this.control.currMinuteIndex = i;
				break;
			} 
		}
	}
	
	// 绑定滚动事件
	TimeSelector.prototype.bind = function () {
		var that = this;
		var startY, offsetY, curY, length;
		
		var $intro = $dom.querySelector('span.order_intro');
		
		var startHandler = function(e){
			var parent;
			
			startY = e.touches[0].pageY;

			parent = this.parentNode;
			if(parent.classList.contains('ts_day')){
				curY = that.control.dayOffsetY;
				length = that.data.dates.length;
			} else if(parent.classList.contains('ts_hour')){
				curY = that.control.hourOffsetY;
				length = that.data.hours.length;
			} else if(parent.classList.contains('ts_min')){
				curY = that.control.minOffsetY;
				length = that.data.minutes.length;
			};
			parent.style.webkitTransition='none';
		};
		
		var moveHandler = function(e){
			e.preventDefault();
			offsetY = e.touches[0].pageY - startY + curY;

			var parent = this.parentNode;
			parent.style.webkitTransform = 'translateY(' + offsetY + 'px)';
		};
		
		var endHandler = function(e){
			var parent = this.parentNode;
			if( !offsetY ) return;

			var overmove = false;
			offsetY = Math.round(offsetY / that.itemHeight) * that.itemHeight; // 取整
			if(offsetY > that.itemHeight){
				offsetY = that.itemHeight;
				overmove = true;
			} else if (offsetY < (0 - that.itemHeight) * (length - 2)) {
				offsetY = (0 - that.itemHeight) * (length - 2);
				overmove = true;
			};
			var index = 1 - offsetY / that.itemHeight;

			if (parent.classList.contains('ts_day')) {
				that.handleDateScrollTo(index, overmove);
			} else if (parent.classList.contains('ts_hour')) {
				that.handleHourScrollTo(index, overmove);
			} else if (parent.classList.contains('ts_min')) {
				that.handleMinuteScrollTo(index, overmove);
			};
		};
	
		var $els = [this.$date, this.$hour, this.$minute];
		for(var i = 0; i < $els.length; i++) {
			[].filter.call(toArray($els[i].querySelectorAll('li')), function($item, index) {
				$item.addEventListener('touchstart', startHandler, false);
				$item.addEventListener('touchmove', moveHandler, false);
				$item.addEventListener('touchend', endHandler, false);
			});
		}
	}

	TimeSelector.prototype.scroll = function($el, index) {
		var offset = (1 - index) * this.itemHeight;
		$el.style.webkitTransform = 'translateY(' + offset + 'px)';
//		$el.style.webkitTransition = 'all .4s';
		return offset;
	}

	TimeSelector.prototype.handleDateScrollTo = function(newDateIndex, overmove) {
		var i;

		if( this.control.selDateIndex === newDateIndex ) {
			if(overmove) {
				this.control.dayOffsetY = this.scroll(this.$date, this.control.selDateIndex);
				this.control.hourOffsetY = this.scroll(this.$hour, this.control.selHourIndex);
				this.control.minOffsetY = this.scroll(this.$minute, this.control.selMinuteIndex);
			}
			return; // 日期没有变化
		}

		var oldDateIndex = this.control.selDateIndex;
		var oldHourIndex = this.control.selHourIndex;
		var oldMinuteIndex = this.control.selMinuteIndex;

		this.control.isToday = false;
		this.control.selDateIndex = newDateIndex;
		if( this.control.isIncludeToday ) {
			// 在有今天数据的情况下，序列号为0的一定是今天的数据
			if( newDateIndex === 0) { 
				this.control.isToday = true;

				// 处理时间列表
				for( i = 0; i < this.control.currHourIndex; i++) {
					addClass(this.$hour.querySelector('#hour_' + this.data.hours[i]), 'ts_gray');
				}
				if( this.control.selHourIndex < this.control.currHourIndex) {
					this.control.selHourIndex = this.control.currHourIndex;
				}

				// 处理分钟列表
				for( i = 0; i < this.control.currMinuteIndex; i++) {
					addClass(this.$minute.querySelector('#minute_' + this.data.minutes[i]), 'ts_gray');
				}
				if( this.control.selMinuteIndex < this.control.currMinuteIndex) {
					this.control.selMinuteIndex = this.control.currMinuteIndex;
				}
			} else if( oldDateIndex == 0) {
				for( i = 0; i < this.data.hours.length; i++) {
					removeClass(this.$hour.querySelector('#hour_' + this.data.hours[i]), 'ts_gray');
				}
				for( i = 0; i < this.data.minutes.length; i++) {
					removeClass(this.$minute.querySelector('#minute_' + this.data.minutes[i]), 'ts_gray');
				}
			}
		}

		this.control.dayOffsetY = this.scroll(this.$date, this.control.selDateIndex);
		this.control.hourOffsetY = this.scroll(this.$hour, this.control.selHourIndex);
		this.control.minOffsetY = this.scroll(this.$minute, this.control.selMinuteIndex);
	}

	TimeSelector.prototype.handleHourScrollTo = function(newHourIndex, overmove) {
		var i;

		if(this.control.selHourIndex === newHourIndex) {
			if( overmove ) {
				this.control.hourOffsetY = this.scroll(this.$hour, this.control.selHourIndex);
				this.control.minOffsetY = this.scroll(this.$minute, this.control.selMinuteIndex);
			}
			return; // 时间没有变化，不做处理
		}

		var oldHourIndex = this.control.selHourIndex;
		var oldMinuteIndex = this.control.selMinuteIndex;

		this.control.selHourIndex = newHourIndex;

		if( this.control.isIncludeToday && this.control.isToday) {
			if( this.control.selHourIndex < this.control.currHourIndex) {
				this.control.selHourIndex = this.control.currHourIndex;
			}

			if( this.control.selHourIndex === this.control.currHourIndex) {
				for( i = 0; i < this.control.currMinuteIndex; i++) {
					addClass(this.$minute.querySelector('#minute_' + this.data.minutes[i]), 'ts_gray');
				}
				this.control.selMinuteIndex = this.control.currMinuteIndex;
			} else if( this.control.selHourIndex > this.control.currHourIndex) {
				// 第一个可用时间以后的时间，则需要把分钟显示设置为可用
				// 处理分钟列表
				for( i = 0; i < this.data.minutes.length; i++) {
					removeClass(this.$minute.querySelector('#minute_' + this.data.minutes[i]), 'ts_gray');
				}
			} 
		}
				
		this.control.hourOffsetY = this.scroll(this.$hour, this.control.selHourIndex);
		this.control.minOffsetY = this.scroll(this.$minute, this.control.selMinuteIndex);
	}

	TimeSelector.prototype.handleMinuteScrollTo = function(newMinuteIndex, overmove) {
		if(this.control.selMinuteIndex === newMinuteIndex) {
			if( overmove ) {
				this.scroll(this.$minute, this.control.selMinuteIndex);
			}
			return; // 时间没有变化，不做处理
		}

		var oldMinuteIndex = this.control.selMinuteIndex;

		this.control.selMinuteIndex = newMinuteIndex;

		if( this.control.isIncludeToday && this.control.isToday ) {
			if( this.control.selHourIndex == this.control.currHourIndex && this.control.selMinuteIndex < this.control.currMinuteIndex) {
				this.control.selMinuteIndex = this.control.currMinuteIndex;
			}
		}
				
		this.control.minOffsetY = this.scroll(this.$minute, this.control.selMinuteIndex);
	}

	TimeSelector.prototype.getSelectDate = function() {
		return this.data.dates[this.control.selDateIndex];
	}
	
	TimeSelector.prototype.getSelectTime = function() {
		return this.data.hours[this.control.selHourIndex] + ":" + this.data.minutes[this.control.selMinuteIndex];
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

	function formatDate(date, format) {
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
	
	return TimeSelector;
});
