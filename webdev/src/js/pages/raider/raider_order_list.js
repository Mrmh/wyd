/**
 * create by CGZ
 * 
 */
 require.config(requireConfig);
 require(['jquery', 'remote', 'fastClick'], function($, Remote, FastClick) {
 	$(document).ready(function() {
 		FastClick.attach(document.body);
 		$(".order_operate_btn").on("click", function(e) {
 			e.stopPropagation();
 			var orderId = $(this).data("id");
 			Remote.orderArrive(orderId);
 		});
 	});
 });