/**
 * create by CGZ
 */
require.config(requireConfig);
require(['jquery', 'Dialog', 'remote', 'commonLogic'], function($, Dialog, Remote, _) {
	$(document).ready(function(){
		var messager = null;
		//产品质量
		$(".service_rate_product").on("click", function(){
			var rate = $(this).data("rate");
			changeRate($(".service_rate_product"), rate, $("#rate_label_product"), $("input[name=productScore]"));
		});
		//服务质量
		$(".service_rate_service").on("click", function(){
			var rate = $(this).data("rate");
			changeRate($(".service_rate_service"), rate, $("#rate_label_service"), $("input[name=deliverScore]"));
		});
		//更改页面显示
		var changeRate = function(selectors, selectedRate, rateLabel, inputField) {
			$.each(selectors, function(index, e){
				var rate = $(e).data("rate");
				if(rate == selectedRate){
					$(e).removeClass("rate_" + rate + "_normal");
					$(e).addClass("rate_" + rate + "_selected");
				}else{
					$(e).addClass("rate_" + rate + "_normal");
					$(e).removeClass("rate_" + rate + "_selected");
				}
			});
			if(selectedRate == "good"){
				rateLabel.html("很好");
				inputField.val(3);
			}else if(selectedRate == "general"){
				rateLabel.html("一般");
				inputField.val(2);
			}else if(selectedRate == "bad"){
				rateLabel.html("差");
				inputField.val(1);
			}
		}
		
		
		//提交按钮
		$("#submit_btn").on("click", function(){
			var productScore =  $("input[name=productScore]").val();
			var deliverScore =  $("input[name=deliverScore]").val();
			var orderId =  		$("input[name=orderId]").val();
			var memberComment =  $("textarea[name=memberComment]").val();
			if( deliverScore == "" || productScore == ""){
				Dialog.show({
					content: '请完成评分',
	            	footer: [{
	            		position: 'center',
	            		text: '知道了'
	            	}]
            	});
			}else{
				var scoreData = {
					orderId : orderId,
					productScore : productScore,
					deliverScore : deliverScore,
					memberComment : memberComment 
				};
				
				Remote.commitOrderScore(scoreData, function(res){
					if(res == "success") {
						Dialog.show({
							content: '感谢评价',
			            	footer: [{
			            		position: 'center',
			            		text: '返回',
			            		handler : function(){
			            			window.location = base + "/order/detail/"+ scoreData.orderId;
			            		}
			            	}]
						});		
					}
				});
				
			}
		});
	
	});
});