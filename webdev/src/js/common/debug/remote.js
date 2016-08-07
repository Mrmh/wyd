/**
 * Created by kk on 16/1/26.
 */
require.config(requireConfig);
define((['jquery']),function($) {
	"use strict";

	var locateStore = function(lang, lat, callback) {
		 //返回成功
		callback({
			"storeId" : "0001",
			"storeNmae" : "珠江新城店",
			"area" : "C",
			"deliverPrice" : "100",
			"lang" : "113.333993",
			"lat" : "23.10849"
		});

		// 测试失败的情况
		// callback("您的地址不在服务区，请重新选择！", null);
	};
	
	// 提交地址时间信息
	var commitLocation = function(opt) {
		var data = '<br/><br/>'
			     + 'location:' + '<br/>'
			     + '  street:' + opt.locationStreet + '<br/>'
		         + '  detail:' + opt.locationDetail + '<br/>'
		         + '<br/><br/>'
		         + 'store   :' + '<br/>'
		         + '  id    :' + opt.storeId + '<br/>'
		         + '  area  :' + opt.storeArea + '<br/>'
		         + '<br/><br/>'
		         + 'appoint :' + '<br/>'
		         + '  date  :' + opt.appointDate + '<br/>'
		         + '  time  :' + opt.appointTime + '<br/>';
		alert(data);
	};

	//订单列表加载更多
	var orderListLoadMore = function (page, callback) {
		$.ajax({
			type :"post",
			url : base + "/member/order/list/load",
			data : {'page' : page },
			success : function(res) {
				callback(res);
			}
		});
	};
	
	//取得js_ticket
	var getJsApiTicketSign = function(signUrl, callback){
		
		$.ajax({
			type : "post",
			url : 	base + "/wechat/getJsApiTicketSign",
			data : {
				"url" : signUrl,
				"i" : Math.random()
			},
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
		$.ajax({
			type : "post",
			url : base + "/member/profile",
			data : params,
			success : function(res) {
				callback(res);
			}
		});
	}
	
	return {
		locateStore : locateStore,
		commitLocation : commitLocation,
		orderListLoadMore : orderListLoadMore,
		getJsApiTicketSign : getJsApiTicketSign,
		getTagList : getTagList,
		updateMemberProfile : updateMemberProfile
	};
});
