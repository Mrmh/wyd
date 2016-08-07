/**
 * Created by kk on 16/1/26.
 */
require.config(requireConfig);
define(([ 'jquery', 'Toast', 'Dialog', 'commonLogic' ]), function($, Toast, Dialog, _) {
	"use strict";

	var post = function(url, data, message, callback, errorCallback){
		ajax(url, "post", data, message, callback, errorCallback);
	}
	
	var get = function(url, data, message, callback, errorCallback) {
		ajax(url, "get", data, message, callback, errorCallback);
	}
	
	//内部方法，不需要暴露
	//errorCallback为业务逻辑错误(有error信息)时回调，非请求错误回调
	var ajax = function(url, method, data, message, callback, errorCallback) {
		if(_.isEmpty(message)) {
			message = '请稍候...';
		}
		
		if(_.isEmpty(method)){
			method = "post";
		}

		data = data || {};

		Toast.show(message);
		$.ajax({
			url  : base + url,
			type : method,
			data : data,
			success : function(respdata) {
				Toast.close();
				if(respdata && respdata.error) {
					if( errorCallback ) {
						errorCallback(respdata);
					} else {
						Dialog.show({
							content: respdata.error,
							footer: [{
								position: 'center',
								text: '知道了'
							}]
						});
					}
				}else{
					callback(respdata);
				}
			},
			error : function(err) {
				Toast.close();
				console.log(err);
			}

		});
	}
	// 定位门店
	var locateStore = function(lang, lat, callback, errorCallback) {
		post('/order/address/locate', {
			longitude : lang,
			latitude : lat
		}, '', callback, errorCallback);
	};

	// 清除订单中的产品信息
	var cleanOrder = function(data, callback) {
		post('/order/clean', data, '', callback || function() {});
	};

	// 提交地址时间信息
	var commitPreOrderData = function(data, callback) {
		post('/order/preOrder', data, '正在为您准备菜单', callback);
	};
	
	//保存地址
	var commitNewAddress = function(data, callback) {
		post('/order/address/add', data, "正在保存", callback);
	} 
	
	var getOrderStartPageAddressList = function(data, callback){
		get('/order/start/address/list', data, "加载中", callback);
	}

	//提交菜品选择信息
	var commitProductsData = function(productData, callback){
		post('/order/orderProducts', productData, '正在保存您的选择', callback);
	}

	//提交用户信息
	var commitUserData = function(userData, callback){
		post('/order/userInfo', userData, '', callback);
	}

	//提交用餐信息
	var makeOrder = function(orderData, callback, errorCallback){
		post('/order/make', orderData, '正在为您创建订单...', callback, errorCallback);
	}

	//提交微信支付信息
	var postPay = function(orderId, amount, callback){
		post('/order/pay/' + orderId, { amount: amount}, '正在发起微信支付...', callback);
	}

	//取得js_ticket
	var getJsApiTicketSign = function(callback){
		var signUrl = location.href.split('#')[0];
		post('/wechat/getJsApiTicketSign',
			 { url: signUrl,
			     i: Math.random()
			 }, '正在发起微信支付...', callback);
	};

	//订单列表加载更多
	var orderListLoadMore = function (page, callback) {
		$.ajax({
			url  : base + '/member/order/list/load',
			type : 'post',
			data : {'page' : page },
			success : function(res) {
				callback(res);
			}
		});
	};
	

	//获取标签列表
	var getTagList = function(tagTypeId, callback){
		$.ajax({
			type : "get",
			url : base + "/member/profile/tag/list",
			data : {'tagTypeId' : tagTypeId,
				'i' : new Date()
			},
			success : function(res) {
				callback(res);
			}
		});
	}

	var updateMemberProfile = function(params, callback){
		var url = "/member/profile";
		post(url, params, "正在保存", function(res){
			callback(res);
		});
	}

	//提交订单评分
	var commitOrderScore = function(scoreData, callback){
		var url = "/member/order/score";
		post(url, scoreData, "正在保存", function(res){
			callback(res);
		});
	}
	
	var orderArrive = function(orderId){
		var url = "/raider/order/" + orderId + "/arrive";
		get(url, {}, "正在处理...", function(res){
			if(res == "success"){
				Dialog.show({
					content : "订单已送达",
					footer: [{
		            		position: 'center',
		            		text: '返回订单列表',
		            		handler : function(){
								window.location.href = base + "/raider/order/list";			
	            			}
		            	}]
	            	
				});
			}
		});
	}
	
	return {
		get			:	 get,
		post		: 	post,
		locateStore : 	locateStore,
		makeOrder   : 	makeOrder,
		postPay     :   postPay,
		cleanOrder  : 	cleanOrder,
		getTagList  : 	getTagList,
		commitPreOrderData  : 	commitPreOrderData,
		commitNewAddress    :   commitNewAddress,
		getOrderStartPageAddressList : getOrderStartPageAddressList,
		commitProductsData  : 	commitProductsData,
		commitUserData 		: 	commitUserData,
		commitOrderScore 	: 	commitOrderScore,
		orderListLoadMore   : 	orderListLoadMore,
		getJsApiTicketSign  : 	getJsApiTicketSign,
		updateMemberProfile : 	updateMemberProfile,
		orderArrive			:	orderArrive
	};
});