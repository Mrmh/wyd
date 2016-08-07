/**
 * create by CGZ
 */
require.config(requireConfig);
require(['commonLogic', 'remote', 'Dialog'], function(_, Remote, Dialog) {
	$(document).ready(function() {
		var refreshBindClick = function(){
			$('[data-page]').on('click', function() {
				var page = $(this).data("page");
				if (page) {
					window.location = page;
				}
			});
		};
		
		var loadMoreFunction = function() {
			var page = $(this).data("curr-page");
			var memberOrderDataList = null; // 返回的结果
			Remote.orderListLoadMore(page, function(memberOrderDataList) {
				if (memberOrderDataList == null || memberOrderDataList.length == 0) {
					$(".order_more_div").html('<div data-curr-page="1" class="btn_order_more font_34">没有更多了</div>');
				} else {
					var loadContent = "";
					$(".order_more_div").remove();
					$.each(memberOrderDataList, function(index, memberOrderData) {
						
						loadContent += "<div data-page='/order/detail/" 
								 	+ memberOrderData.order.id
									+"'" 
									+ "class='wui_cell "; 
									if(memberOrderData.order.workStatus == 6 || memberOrderData.order.orderStatus == 3){
										loadContent += " order_finish";
									}
						loadContent += "'>"
									+ "<div class='wui_cell_lt'>";
									
									if(memberOrderData.order.orderStatus < 2) {
					    				loadContent += "<i class='icon_myinfo_process_order'></i>";
									}else if(memberOrderData.order.orderStatus = 2) {
			                    		if(memberOrderData.order.workStatus == 3){
				                    		loadContent += "<i class='icon_myinfo_process_cooking'></i>";
										}else if(memberOrderData.order.workStatus == 4 || memberOrderData.order.workStatus == 5){
			                    			loadContent += "<i class='icon_myinfo_process_delivery'></i>";
										}else if(memberOrderData.order.workStatus == 6){
			                    			loadContent += "<i class='icon_myinfo_process_finish'></i>";
										}else{
											loadContent += "<i class='icon_myinfo_process_order'></i>";
										}
									}else{
				                    		loadContent += "<i class='icon_myinfo_process_order'></i>";
									}		                    	
									
							loadContent += "</div>"
									+ "<div class='wui_cell_ct wui_cell_primary'>"
									+ "<span class='orderContent_time'>"
									+ memberOrderData.order.appointDate + " "
									+ memberOrderData.order.appointTime
									+ "</span>"
									+ "<span class='orderContent_address'>"
						if(!_.isEmpty(memberOrderData.order.deliverAddress))
							loadContent += memberOrderData.order.deliverAddress.replace("@","");
						loadContent += "</span>"
									+ "<span>";
							if(memberOrderData.order.payType == "free")
								loadContent += "免单";
							else if(memberOrderData.order.payType == "credit")
								loadContent += "挂账";
							else {
								if(memberOrderData.order.payStatus != 0){
									loadContent += "<span class='orderContent_pay'>" 
											+ "需付<span class='money'>"
											+ ((memberOrderData.order.receivableAmount - memberOrderData.order.paidAmount)/100)
											+ "</span></span>";
								}else{
									loadContent += "支付完成";
								}
							}
									 
						loadContent += "</span>"
									+ "<span class='orderContnet_price'>原价<span class='money'>"
									+ (memberOrderData.order.originalAmount/100)
									+ "</span></span>";
						if(memberOrderData.order.workStatus == 6 && memberOrderData.order.commentStatus != 0) {
                			loadContent += "<a href='" + memberOrderData.order.id + "/score' class='order_operate_btn icon_myinfo_process_score'></a>";
						}
							loadContent += "</div><div class='wui_cell_rt'><i class='icon_arrow_right'></i></div>"
									+ "</div>";
								});
						$(".wui_cells").append(loadContent);
						
						var loadMoreBtnHtml = "<div class='wui_cell order_more_div'>";
						if(memberOrderDataList.length >= 6) {
							loadMoreBtnHtml += "	<div id='load_more_btn' data-curr-page='"+ (page+1) +"' class='btn_order_more font_34'>显示更多</div>";
						}
        				loadMoreBtnHtml += "</div>";
						$(".wui_cells").append(loadMoreBtnHtml);
	        				
						$("#load_more_btn").on("click", loadMoreFunction);
						refreshBindClick();
					}
			});
		}
		
		
		$("#load_more_btn").on("click", loadMoreFunction);
		refreshBindClick();
	});
});

