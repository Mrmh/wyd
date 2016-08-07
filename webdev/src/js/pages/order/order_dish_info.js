/**
 * Created by lmh on 2016/1/21.
 */
require.config(requireConfig);
require(["jquery", "Dialog", "Sheet", "remote", "CartView", "wxpay", "fastClick"],function($, Dialog, Sheet, Remote, CartView, Wxpay, FastClick) {
	
	FastClick.attach(document.body);
	
    var $doc = $(document);

	// 是否是用户的首单
	var firstOrder = DATA['firstOrder'];

	var originalAmount = DATA['originalAmount']; //订单总金额
	var receivableAmount = DATA['receivableAmount']; // 订单应付金额
	var payingAmount = DATA['receivableAmount']; // 实际应付金额

	// 请求数据的默认值
	var needSpice = false;		//是否微辣
	var indoorService = true;	//进门服务

	var payType = "wechat";	//支付方式

	//购物车,仅显示,不做其它处理
	var cart = new CartView({
		usage           : 'display',
		deliverPrice    : DATA['deliverPrice'] / 100,
		products        : DATA['products'],
		originalAmount  : DATA['originalAmount'],
		receivableAmount: DATA['receivableAmount'],
		selectedProduct : DATA['productCount'],
    	confirmHandler: function() {
    	}
	});
	$("#display_cart").on("click", function(){
		cart.show();
	});
	$("#display_cart_top").on("click", function(){
		cart.show();
	});

	$(".btn_order_add").on("click", function(){
		window.location.href = '/order/product/list';
	});

	var dishwareHandler = new DishewareHandler();

	var discountHandler = new DiscountHandler(originalAmount, receivableAmount, cart);

	// 支付方式对话框
	var paymentSheet;
	$("#bounce_payments").on("click", function() {
		if( !paymentSheet ) {
			paymentSheet = new Sheet({
				create  : false,
				target  : '#dialog_payments',
				style   : 'bottom',
				header: {
					style : 'oper',
					title : '请选择您的支付方式',
					button : '确定',
					handler : function(){
						if(payType == "wechat"){
							$("#btn_order_next").removeClass("btn_order_done");
							$("#btn_order_next").addClass("btn_order_pay");
						}else if(payType == "cash" || payType == "pos"){
							$("#btn_order_next").removeClass("btn_order_pay");
							$("#btn_order_next").addClass("btn_order_done");
						}
					}
				}
			});

			//支付方式选中处理
			$(".select_payments").on("click", function() {
				$(".select_payments").removeClass("active");
				$(this).addClass("active");

				payType = $(this).data("code");
				$("#payment").text($('.ct_text', this).text());
			});
		}

		paymentSheet.show();
	});


    //口味处理
    $("#need_spice_checkbox").on("click", function(){
		needSpice = !$(this).prop("checked");
    });

    //进门服务处理
    $("#indoor_service_checkbox").on("click", function(){
		indoorService = $(this).prop("checked");
    });

    //下一步处理
    $("#btn_order_next").on("click", function() {
    	if( payType != "wechat" ){
			if(firstOrder && DATA['receivableAmount'] >= 60000 ){
				Dialog.show({
					content:'首单消费需要您先微信支付' + discountHandler.getReceivableAmount() / 2 + '元订金，感谢理解！',

					footer: [{
						position: 'left',
						text: '取消',
						handler: function () {
						}
					}, {
						position: 'right',
						text: '立即支付',
						handler: function () {
							payingAmount = discountHandler.getReceivableAmount() / 2;
							makeOrder(true);
						}
					}]
				});

				return ;
			}
    	}

		makeOrder();
	});
	
    
    $('.icon_goBack').on('click', function(){
    	window.location.href = '/order/userInfo';
    });
    
    var makeOrder = function(needPay){
		var request = {
			headCount: dishwareHandler.getHeadCount(),
			indoorService : indoorService,
			needSpice : needSpice,
			payType : payType,
			receivableAmount : discountHandler.getReceivableAmount(),
			discountData : discountHandler.getDiscountData(),
			payingAmount : payingAmount
		};

		Remote.makeOrder(request, function(res) {
			if(res.order_no !== undefined && res.order_no !== '') {
				//支付方式为在线支付
				if (payType !== "wechat" && !needPay) {
					window.location.href = "/order/" + res.order_id + "/success";
				} else {
					var orderId = res.order_id;
					function handleCancel() {
						Dialog.show({
							title: '支付取消',
							content: '您取消了微信支付,<br/>如果确认取消,您需要重新下单!',
							footer: [{
								position: 'left',
								text: '继续支付',
								handler: function() {
									Wxpay.pay(orderId, discountHandler.getReceivableAmount(), handleCancel, handleCancel);
								}
							},
								{
									position: 'right',
									text: '残忍取消',
									handler: function () {
										window.location.href = "/order/start";
									}
								}]
						});
					}
					Wxpay.pay(orderId, discountHandler.getReceivableAmount(), handleCancel, handleCancel);
				}
				return;
			}

			if(res.stock_status == -2) { //库存不足
				var productsHtml = "<div class='wui_cells'>"; //售罄列表
				$.each(res.product_list, function (index, product) {
					if (product.status == -2) {
						productsHtml += "<div class='wui_cell'>" +
							"<div class='wui_cell_ct wui_cell_primary'>" +
							"<p class='ct_text ct_90'>" +
							product.productName +
							"</p>" +
							"</div>" +
							"</div>";
						// 在购物车中删除相关的菜品
						//cart.delete(product['productId']);
					}
				});
				productsHtml += "</div>";

				if (res.validTotalAmount < DATA['deliverPrice']) {	//剩余商品不足起送价
					Dialog.show({
						style: 'div',
						title: '今日告罄！',
						content: productsHtml,
						footer: [{
							position: 'center',
							text: '补点其他菜',
							handler: function () {
								window.location.href = "/order/product/list";
							}
						}]
					});
				} else {
					Dialog.show({
						style: 'div',
						title: '今日告罄！',
						content: productsHtml,
						footer: [{
							position: 'left',
							text: '不要了',
							handler: makeOrder()
						},
							{
								position: 'right',
								text: '补点其他菜',
								handler: function () {
									window.location.href = "/order/product/list";
								}
							}]
					});
				}
			}
		}, function(res) {
			Dialog.show({
				content: res.error,
				footer: [{
					position: 'center',
					text: '再来一单',
					handler: function () {
						window.location.href = "/order/start";
					}
				}]
			});
		});
	}

	function DishewareHandler() {
		var $peopleCount = $("#people_count");
		var $dish_ware_amount_text = $("#dish_ware_amount_text");

		var peopleCount = parseInt($peopleCount.text());
		var handleDishware = false; // 现在不处理餐具费用相关事项

		//用餐人数处理
		$("#people_add").on('click', function () {
			peopleCount++;
			$peopleCount.text(peopleCount);
			handleDishware && updateDishWareAmount();
		});

		$("#people_sub").on('click', function () {
			if (peopleCount > 1) {
				peopleCount--;
				$peopleCount.text(peopleCount);
				handleDishware && updateDishWareAmount();
			}
		});

		//餐具处理
		if( handleDishware ) {
			$("#dish_ware_checkbox").on("click", function () {
				updateDishWareAmount();
			});
		}

		//更新餐具费用
		var updateDishWareAmount = function(){
			var needDishware = $("#dish_ware_checkbox").prop("checked");
			if(needDishware){
				var dishWareAmount = parseInt($("#people_count").text()) * DATA.DISHWARE_PER;
				$dish_ware_amount_text.html("<span class='money'>" + dishWareAmount + "</span>");
				$("#dish_ware_tip").html("每套餐具需要加收10元！");
				$("#total_amount_text").html("<span class='money'>" +  (receivableAmount/100 + dishWareAmount) + "</span>");
			}else{
				var dishWareAmount = 0 ;

				$dish_ware_amount_text.html("减<span class='money'>" + DATA.DISHWARE_NO_FEE / 100 + "</span>");
				$("#dish_ware_tip").html("感谢支持环保！");
				$("#total_amount_text").html("<span class='money'>" +  (receivableAmount/100 - DATA['DISHWARE_NO_FEE']) +"</span>");
			}
		};

		this.getHeadCount = function(request) {
			return peopleCount;
		}
	}

	function DiscountHandler(originalAmount, receivableAmount, cart) {
		var totalDiscountAmount = 0;
		//var pointDiscountAmount = 0; //猫眼石优惠总额
		//var actDiscountAmount = 0;  // 活动优惠总额

		var selectedActDiscounts = []; // 保存当前所有的优惠信息
		var pointDiscount; // 如果有值表示选中了猫眼石

		// 保存猫眼石优惠信息
		var $pointDiscount = $('.ctrl_point_discount');
		var enabledPoint = false;
		if( $pointDiscount ) {
			var checkStatus = $pointDiscount.data('checkstatus');
			if( checkStatus == 0) {
				pointDiscount = {
					activityId: $pointDiscount.attr('id').substring('discount_'.length),
					discountAmount: $pointDiscount.data('amount'),
					discountType: $pointDiscount.data('discounttype')
				};
				enabledPoint = true;

				var statusMessage = $('.ctrl_point_message').data('statusmessage');

				// 保存猫眼石优惠的额度
				totalDiscountAmount = pointDiscount['discountAmount'];

				$("#ctrl_point_checked").on("click", function () {
					enabledPoint = $(this).prop("checked");

					if (enabledPoint) {
						//$('.select_discounts.active').click();

						totalDiscountAmount = pointDiscount['discountAmount'];
						//pointDiscount = discount;
						$('.ctrl_point_amount').html('<span class="money color_red">' + (totalDiscountAmount / 100) + '</span>');
						$('.ctrl_point_message').html('<span class="color_red">猫眼石不与其它优惠同时使用</span>');
					} else {
						totalDiscountAmount = 0;
						//pointDiscount = null;
						$('.ctrl_point_amount').html('');
						$('.ctrl_point_message').html(statusMessage);
					}

					// 修改页面总金额展示
					updateReceivableAmount();
					//updateDiscountAmount();
				});
			}
		};

		// 读出当前所有的优惠信息
		var $discountContainer = $('#dialog_discount');
		if( $discountContainer ) {
			//折扣弹出层
			var discountSheet;
			$("#bounce_discount").on("click", function () {
				if (!discountSheet) {
					discountSheet = new Sheet({
						create: false,
						target: '#dialog_discount',
						style: 'bottom',
						header: {
							style: 'oper',
							title: getDisplayAmount(originalAmount, receivableAmount - totalDiscountAmount),
							button: '完成',
							handler: function () {
							}
						}
					});
				}
				discountSheet.show();
			});

			var $discounts = $('.select_discounts', $discountContainer);
			$discounts.each(function (index, discountDiv) {
				// 对于状态不OK的优惠不做处理
				var checkStatus = $(discountDiv).data('checkstatus');
				if( checkStatus != 0) return;

				var discount = {
					activityId: $(discountDiv).attr('id').substring('activity_'.length),
					discountAmount: $(discountDiv).data('amount'),
					discountType: $(discountDiv).data('paytype')
				};

				//if ('act-use-point' === discount['discountType']) {
				//	// 现在后台已经做了处理,不应当会出现这种情况
				//	return;
				//}

				// 计算所有活动的优惠总额度
				totalDiscountAmount += discount['discountAmount'];
				selectedActDiscounts.push(discount);

				// 绑定优惠的点击事件
				//$(discountDiv).on('click', function () {
				//	if ($(discountDiv).hasClass('active')) {
				//		totalDiscountAmount -= discount['discountAmount'];
				//		$(discountDiv).removeClass('active');
				//		selectedActDiscounts.pop(discount);
				//		$('#discount_amount').html('');
				//	} else {
				//		if( pointDiscount ) {
				//			// 如果当前猫眼石是选中状态
				//			$("#ctrl_point_checked").prop("checked", false);
				//			totalDiscountAmount = 0;
				//			pointDiscount = null;
				//			$('.ctrl_point_amount').html('');
				//		}
                //
				//		totalDiscountAmount += discount['discountAmount'];
				//		$(discountDiv).addClass('active');
				//		selectedActDiscounts.push(discount);
				//	}
                //
				//	// 修改页面总金额展示
				//	updateReceivableAmount();
				//	// 修改优惠活动相关的金额
				//	updateDiscountAmount();
				//});
			});

			updateDiscountAmount();
		}
		updateReceivableAmount();

		//if( $discountContainer && actDiscountAmount == 0) {
		//	$('#discount_amount').html('');
		//}
		//if( pointDiscountAmount > actDiscountAmount) {
		//	// 默认激活猫眼石优惠
		//	$("#ctrl_point_checked").click();
		//} else {
		//	// 默认激活活动相关的优惠
		//	$('.select_discounts', $discountContainer).click();
		//}

		this.getReceivableAmount = function() {
			return receivableAmount - totalDiscountAmount;
		}

		this.getDiscountData = function() {
			if( pointDiscount ) {
				if( enabledPoint ) {
					return JSON.stringify([pointDiscount]);
				} else {
					return JSON.stringify([]);
				}
			} else {
				return JSON.stringify(selectedActDiscounts);
			}
		}

		function updateReceivableAmount() {
			$('#total_amount_text').text((receivableAmount - totalDiscountAmount)/ 100);
			cart.updateAmount(receivableAmount - totalDiscountAmount);
		}

		function updateDiscountAmount() {
			var listValue = '查看';
			var headerValue = getDisplayAmount(originalAmount, receivableAmount - totalDiscountAmount);
			if( !pointDiscount && totalDiscountAmount > 0) {
				listValue = '<span  class="money color_red">' + (totalDiscountAmount / 100) + '</span>';
			}

			if( totalDiscountAmount > 0) {
				$('#discount_amount').html(listValue);
			} else {
				$('#discount_amount').html('');
			}
			$('.wui_sheet_header .wui_sheet_title_left', $discountContainer).html(headerValue);
		}

		function getDisplayAmount(originalAmount, receivableAmount) {
			return '原价: <span class="money">' + (originalAmount / 100) + '</span>,优惠价: <span class="money">' + (receivableAmount / 100) + '</span>';
		}
	}
});