/**
 * create by CGZ
 * 订单支付
 */
require.config(requireConfig);
require(['remote', 'wxPay'], function(Remote,WxPay) {
	$(document).ready(function() {
		var signUrl = location.href.split('#')[0];
		
		Remote.getJsApiTicketSign(payParams['orderId'], function(res){
			WxPay.initPay(res);
			WxPay.pay(payParams, function(res){
	           if(res.errMsg == "chooseWXPay:ok" ) {
					window.location = base + '/order/' + payParams['orderId'] + '/success';
	           } else if(res.errMsg == "chooseWXPay:cancel" ) {
				   window.location = base + '/member/order/' + payParams['orderId'];
	           }else if(res.errMsg == "chooseWXPay:fail" ) {
				   window.location = base + '/member/order/' + payParams['orderId'];
	           }
			});
		});
	});
	
});