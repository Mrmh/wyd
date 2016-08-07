/**
 * create by CGZ
 */
 require.config(requireConfig);
 require(['jquery', 'Dialog', 'Toast', 'remote', 'commonLogic'], function($, Dialog, Toast, Remote) {
 	$(document).ready(function() {
 		$(".order_operate_btn").on("click", function() {
 			var orderId = $(this).attr("order_id");
			Remote.orderArrive(orderId);
 		});
 	});
 });
