require.config(requireConfig);

define((['Sheet', 'commonLogic']),function(Sheet, _) {
	"use strict";

	// 对于当天的最快送餐时间,即以当前时间的75分钟后开始送餐
	var ELAPSED_MINUTES = 75;

	var $dom = window.document;

	var template =
		'<ul class="horizon_lines_top">' +
			'<li class="horizon_line"></li>' +
			'<li class="horizon_line horize_line_middle"></li>' +
		'</ul>' +
		'<ul class="horizon_lines_bottom">' +
			'<li class="horizon_line"></li>' +
			'<li class="horizon_line horize_line_middle"></li>' +
		'</ul>';

	//
	// 传入的参数包括：
	//    openTime    : 每天送餐开始时间，HH:MM
	//    closeTime   : 每天送餐截止时间，HH:MM
	//    operdateDate: 运营开始时间，如果为''表示从今天开始计算运营日期,YYYY-MM-DD
	//    presaleDates: 预约总日期数，默认为15天
	//
	function TimeSelector(opt) {
		var that = this;

		// 时间选择框的根元素
		this.$container = $dom.createElement('div');
		_.addClass(this.$container, 'dialog_box');
		this.$container.innerHTML = template;

		// 弹出层定义
		this.sheetTime = new Sheet({
			create  : true,
			style   : 'bottom',
			content : this.$container,
			header  : {
				title: opt.title,
				button: opt.button,
				handler: function () {
					opt.handler && opt.handler(that.hours[that.selHourIndex] + ":" + that.minutes[that.selMinuteIndex]);
				}
			}
		});

		this.openTime = opt.openTime;    	// 门店每日开始营业时间
		this.closeTime = opt.closeTime;	// 门店每日开始营业时间

		// 对内部的数据进行初始化
		this.hours = [];
		this.minutes = [];

		this.appointDate = '';     // 当前指定的日期
		this.appointTime = '';
	}

	TimeSelector.prototype.show = function () {
		this.sheetTime.show();
	}

	TimeSelector.prototype.setTime = function (opt) {
		var that = this;

		var appointDate = opt.appointDate;

		if (appointDate === this.appointDate) { // 营运开始日期没有变化
			return; // 不需要重新渲染页面
		}

		this.appointDate = appointDate;
		this.appointTime = opt.appointTime || this.openTime; //缺省的用餐时间

		this.selHourIndex = -1;
		this.selMinuteIndex = -1;

		if (this.$el) {
			this.$el.parentNode.removeChild(this.$el);
		}

		this.$el = $dom.createElement('div');
		_.addClass(this.$el, 'ts_datetime');
		this.$container.appendChild(this.$el);

		// 在target中创建相关的数据容器
		this.$el.innerHTML =
			'<ul class="ts_hour"></ul>' +
			'<ul class="ts_min"></ul>';

		this.$hour = this.$el.querySelector('.ts_hour');
		this.$minute = this.$el.querySelector('.ts_min');

		var startHour = _.parseTime(this.openTime);
		var currCloseTime = _.parseTime(this.closeTime);
		if( currCloseTime.getHours() >= 0 && currCloseTime.getHours() < 8) {
			// 如果结束时间在0点以后，表示在凌晨结束营业，日期加一天
			currCloseTime.setDate(currCloseTime.getDate() + 1);
		}
		currCloseTime.setMinutes(currCloseTime.getMinutes() - 15); // 因为送餐时间是按向前15分钟计算,所以这里这样处理

		var funcScrollHour, funcScrollMinute;

		// 处理小时信息
		this.hours = [];

		// 计算起始时间和结束时间用于生成小时列表
		var strHour = '';
		for(var i = 0; startHour < currCloseTime; i++) {
			var hourStr = _.formatDate(startHour, 'hh');
			strHour += '<li id="hour_' +  hourStr + '">';
			if( hourStr === '00' || hourStr === '01') {
				strHour += '<span class="timeTips">次日</span>'
			}
			strHour += hourStr + '时</li>';

			this.hours[i] = hourStr;
			startHour.setHours(startHour.getHours() + 1);
		}
		this.$hour.innerHTML = strHour;
		funcScrollHour = bind(this.$hour, this.hours.length, function(newCurrIndex, overmove){
			handleHourScrollTo(that, newCurrIndex, overmove, funcScrollHour, funcScrollMinute);
		});


		// 初始化分钟
		this.minutes = ['00', '15', '30', '45'];

		var strMinute = '';
		for (var i = 0; i < this.minutes.length; i++) {
			strMinute += '<li id="minute_' + this.minutes[i] + '">' + this.minutes[i] + '分</li>';
		}
		this.$minute.innerHTML = strMinute;
		funcScrollMinute = bind(this.$minute, this.minutes.length, function(newCurrIndex, overmove){
			handleMinuteScrollTo(that, newCurrIndex, overmove, funcScrollMinute);
		});

		// 计算当前最小可用的小时和分钟索引
		calcCurrIndex(this, currCloseTime);

		// 按当前传入的预约时间滚动到相应的时间
		handleHourScrollTo(that,  find(that.hours, that.appointTime.substring(0, 2)), true, funcScrollHour, funcScrollMinute);
		handleMinuteScrollTo(that, find(that.minutes, that.appointTime.substring(3, 5)), true, funcScrollMinute);
	}

	// 根据传入的时间处理滚动列表中的第一组选项
	function calcCurrIndex(that, currCloseTime) {
		var appointDate = _.parseDateTime(that.appointDate + ' 11:00');

		var firstHourStr, firstMinuteStr;

		if( appointDate < currCloseTime) {
			that.isToday = true;

			var startDate = new Date();
			startDate.setMinutes(startDate.getMinutes() + ELAPSED_MINUTES);
			// 如果当前时间未超过了停止送餐时间，但是已经是凌晨,则表明送餐时间已经第二天的凌晨
			if( startDate < currCloseTime && startDate.getHours() >= 0 && startDate.getHours() < 5) {
				startDate.setDate(startDate.getDate() - 1);
			}

			// 对于今天的日期进行一些相关的处理
			var minute = startDate.getMinutes();
			if (minute == 0) {
				firstMinuteStr = '00';
			} else if (minute > 0 && minute <= 15) {
				firstMinuteStr = '15';
			} else if (minute > 15 && minute <= 30) {
				firstMinuteStr = '30';
			} else if (minute > 30 && minute <= 45) {
				firstMinuteStr = '45';
			} else {
				startDate.setHours(startDate.getHours() + 1);
				firstMinuteStr = '00';
			}
			firstHourStr = _.formatDate(startDate, "hh");
		} else {
			firstHourStr = that.openTime.substring(0, 2);
			firstMinuteStr = that.openTime.substring(3, 5);
		}

		that.currHourIndex = find(that.hours, firstHourStr);
		that.currMinuteIndex = find(that.minutes, firstMinuteStr);
	}

	function find(array, data) {
		var currIndex = 0;
		array.forEach(function(item, index) {
			if( item === data) {
				currIndex = index;
				return true;
			}
		});
		return currIndex;
	}


	// 绑定滚动事件
	function bind($el, length, handleScrollTo) {
		var startY, offsetY, curY;

		// 计算每个li的高度
		var itemHeight = parseFloat(getComputedStyle($el.querySelector('li')).height);

		var scroll = function(index) {
			curY = (1 - index) * itemHeight;
			$el.style.webkitTransform = 'translateY(' + curY + 'px)';
		};

		var startHandler = function(e){
			var parent;

			startY = e.touches[0].pageY;

			parent = this.parentNode;
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

			offsetY = Math.round(offsetY / itemHeight) * itemHeight; // 取整
			if(offsetY > itemHeight){
				offsetY = itemHeight;
			} else if (offsetY < (0 - itemHeight) * (length - 2)) {
				offsetY = (0 - itemHeight) * (length - 2);
			};
			var index = Math.floor(1 - offsetY / itemHeight);

			handleScrollTo(index, true);
		};

		[].filter.call($el.querySelectorAll('li'), function($item, index) {
			$item.addEventListener('touchstart', startHandler, false);
			$item.addEventListener('touchmove', moveHandler, false);
			$item.addEventListener('touchend', endHandler, false);
		});

		return scroll;
	}

	function handleHourScrollTo(that, newHourIndex, overmove, funcScrollHour, funcScrollMinute) {
		var i;

		if(that.selHourIndex === newHourIndex) {
			if( !overmove ) {
				return; // 时间没有变化，不做处理
			}
		} else {
			that.selHourIndex = newHourIndex;

			if (that.isToday) {
				for( i = 0; i < that.currHourIndex; i++) {
					_.addClass(that.$hour.querySelector('#hour_' + that.hours[i]), 'ts_gray');
				}

				if (that.selHourIndex < that.currHourIndex) {
					that.selHourIndex = that.currHourIndex;
				}

				if (that.selHourIndex === that.currHourIndex) {
					for (i = 0; i < that.currMinuteIndex; i++) {
						_.addClass(that.$minute.querySelector('#minute_' + that.minutes[i]), 'ts_gray');
					}
					if( that.selMinuteIndex < that.currMinuteIndex) {
						that.selMinuteIndex = that.currMinuteIndex;
					}
				} else if (that.selHourIndex > that.currHourIndex) {
					// 第一个可用时间以后的时间，则需要把分钟显示设置为可用
					// 处理分钟列表
					for (i = 0; i < that.minutes.length; i++) {
						_.removeClass(that.$minute.querySelector('#minute_' + that.minutes[i]), 'ts_gray');
					}
				}
			}
		}

		funcScrollHour(that.selHourIndex);
		funcScrollMinute(that.selMinuteIndex);
	}

	function handleMinuteScrollTo(that, newMinuteIndex, overmove, funcScrollMinute) {
		if(that.selMinuteIndex === newMinuteIndex) {
			if( !overmove ) {
				return; // 时间没有变化，不做处理
			}
		} else {
			that.selMinuteIndex = newMinuteIndex;

			if (that.isToday) {
				if (that.selHourIndex == that.currHourIndex && that.selMinuteIndex < that.currMinuteIndex) {
					that.selMinuteIndex = that.currMinuteIndex;
				}
				//
				//if (that.selHourIndex == that.currHourIndex && that.selMinuteIndex < that.currMinuteIndex) {
				//	that.selMinuteIndex = that.currMinuteIndex;
				//}
			}
		}
		funcScrollMinute(that.selMinuteIndex);
	}

	return TimeSelector;
});
