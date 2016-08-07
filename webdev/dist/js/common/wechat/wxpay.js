/**
create by cgz
*/
define(function() {
	
	var pay = function(orderId, payAmount, onCancel, onFail){
		require.config(requireConfig);
		require(['remote', 'wxJsSdk', 'Dialog'], function(Remote, wx, Dialog) {
			var showMsg = function(msg){
				Dialog.show({
					content: msg,
					footer: [{
							position: 'center',
							text: '确认',
							handler : function() {
								window.location = base + '/order/detail/' + orderId;
							}
					}]
				});
			};
			
			Remote.getJsApiTicketSign(function (ticket) {
				// 配置微信请求信息
				wx.config({
					debug: false,
					appId: ticket.appId,
					timestamp: ticket.timestamp,
					nonceStr: ticket.nonceStr,
					signature: ticket.signature,
					jsApiList: ['chooseWXPay']
				});
			
				Remote.postPay(orderId, payAmount, function (paydata) {
					wx.ready(function () {
						wx.chooseWXPay({
							timestamp: paydata.timeStamp,
							nonceStr: paydata.nonceStr,
							package: paydata.package,
							signType: 'MD5',
							paySign: paydata.paySign,
							success: function (res) {
								if (res.errMsg == "chooseWXPay:ok") {
									window.location = base + '/order/' + orderId + '/success';
								}else{
									if( onFail ) {
										onFail();
									} else {
										showMsg("支付失败");
									}
								}
							},
							cancel:function(res){
								if( onCancel ) {
									onCancel();
								} else {
									showMsg("支付已取消");
								}
							},
	                		fail:function(res){
								if( onFail ) {
									onFail();
								} else {
									showMsg("支付失败");
								}
	                		}
						});
					});
				});
			});
		});
	}	
	
	return {
		pay : pay
	}
});