require.config(requireConfig);

define((['Sheet', 'commonLogic']),function(Sheet, _) {
	"use strict";

	// 对于当天的最快送餐时间,即以当前时间的75分钟后开始送餐
	var ELAPSED_MINUTES = 75;

	var $dom = window.document;

	var template =

			'<ul class="horizon_lines_top ">' +
			  '<li class="horizon_line ts_day_line"></li>' +
			'</ul>' +
			'<ul class="horizon_lines_bottom">' +
			  '<li class="horizon_line ts_day_line"></li>' +
			'</ul>';
	
	function DateSelector(opt) {
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
				title   : opt.title,
				button  : opt.button,
				handler : function() {
					opt.handler && opt.handler(that.dates[that.selIndex]);
				}
			}
		});

		this.operateDate = null;
		this.totalDates = 0;
		this.closeTime = '';

		this.dates = [];
		this.selIndex = -1;
	}

	DateSelector.prototype.show = function () {
		this.sheetTime.show();
	}

	/**
	 * 设定新的日期
	 * @param appointDate 已经设定用餐日期,如果为空则表示还未设置用餐日期,则默认为当天或门店开始营业的日期
	 * @param operateDate 门店的运营日期,为了应对预售处理的情况
	 * @param totalDates 门店设定的可订餐的时间长度
	 * @param closeTime 门店的每天的结束营业时间,有可以在凌晨,此时需要做特殊处理
     */
	DateSelector.prototype.setDate = function (opt) {
		// 处理传入的参数
		var totalDates = opt.totalDates || 15;
		if( totalDates <=0 ) totalDates = 15;

		var closeTime = opt.closeTime || "00:00";

		//如果未运营,只能选择开始运营后的日期
		var operateDate = opt.operateDate || '';
		if(operateDate && _.parseDateTime(operateDate) < new Date()) {
			operateDate = _.formatDate(new Date(), 'yyyy-MM-dd'); // 使用今天的日期
		}

		// 这三者相等,表示数据没有变化,这时不需要重新渲染日期数据
		if( (this.operateDate === operateDate) ||
			(this.totalDates === totalDates) ||
			(this.closeTime === closeTime) ) {
			return;
		}

		// 缓存传入的参数
		this.appointDate = opt.appointDate;
		this.operateDate = operateDate;
		this.totalDates = totalDates;
		this.closeTime = closeTime;

		if (this.$el) {
			this.$el.parentNode.removeChild(this.$el);
		}

		render(this);
	}

	function render (that) {
		var $el = that.$el;
		var operateDate = that.operateDate;
		var totalDates = that.totalDates;

		$el = $dom.createElement('div');
		_.addClass($el, 'ts_datetime');
		that.$container.appendChild($el);

		// 在target中创建相关的数据容器
		$el.innerHTML = '<ul class="ts_day"></ul>';

		var $date = $el.querySelector('.ts_day');

		var currCloseTime = _.parseTime(that.closeTime);
		if( currCloseTime.getHours() >= 0 && currCloseTime.getHours() < 5) {
			// 如果结束时间在0点以后，表示在凌晨结束营业，日期加一天
			currCloseTime.setDate(currCloseTime.getDate() + 1);
		}
		currCloseTime.setMinutes(currCloseTime.getMinutes() - 15);

		//创建日期数据
		// 根据传入的参数计算当前应当设定的日期和时间等
		var startDate;
		if( operateDate !== '' ) {
			// 运营日期不是当天
			startDate = _.parseDateTime(operateDate);
		} else {
			startDate = new Date();
			startDate.setMinutes(startDate.getMinutes() + ELAPSED_MINUTES);
			// 如果当前时间未超过了停止送餐时间，但是已经是凌晨,则表明送餐时间已经第二天的凌晨
			if( startDate < currCloseTime && startDate.getHours() >= 0 && startDate.getHours() < 5) {
				startDate.setDate(startDate.getDate() - 1);
			}
		}

		var strDate = '';
		var currIndex = 0;
		for(var i = 0; i < totalDates; i++) {
			var dateStr = _.formatDate(startDate, 'dd');
			strDate +=
				'<li id="date_' + dateStr + '">' +
				'<span class="current_month">' + _.formatDate(startDate, 'MM月') + '</span>' +
				'&nbsp;&nbsp;' + dateStr + '日</li>';

			that.dates[i] = _.formatDate(startDate, 'yyyy-MM-dd');
			startDate.setDate(startDate.getDate() + 1);
			if (that.appointDate && that.appointDate === that.dates[i]) {
				currIndex = i;
			}
		}
		$date.innerHTML = strDate;

		bind(that, $date, currIndex);

		return $el;
	}

	// 绑定滚动事件
	function bind(that, $date, currIndex) {
		var startY, offsetY, curY;
		var length = that.totalDates;

		// 计算每个li的高度
		var itemHeight = parseFloat(getComputedStyle($date.querySelector('li')).height);

		var handleScrollTo = function(newDateIndex, overmove) {
			if(that.selIndex === newDateIndex) {
				if( !overmove ) {
					return;
				}
			}

			that.selIndex = newDateIndex;
			if( that.selIndex < 0) {
				that.selIndex = 0;
			}

			// 触发滚动处理
			curY = (1 - that.selIndex) * itemHeight;
			$date.style.webkitTransform = 'translateY(' + curY + 'px)';
		}

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

		[].filter.call($date.querySelectorAll('li'), function($item, index) {
			$item.addEventListener('touchstart', startHandler, false);
			$item.addEventListener('touchmove', moveHandler, false);
			$item.addEventListener('touchend', endHandler, false);
		});

		handleScrollTo(currIndex, true);
	}

	return DateSelector;
});
