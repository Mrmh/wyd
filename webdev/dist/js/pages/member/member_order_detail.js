/**
 * create by CGZ
 */
require.config(requireConfig);
require(['commonLogic', 'wxpay'], function(_, Wxpay) {
	
	$("#pay_btn").on("click", function(){
		Wxpay.pay(orderId, payAmount);
	});
	
});