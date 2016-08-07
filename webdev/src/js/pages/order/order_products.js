require.config(requireConfig);
require(["jquery", "ProductView", "ProductController", "remote"],function($, ProductView, ProductController, Remote) {
	"use strict";

    //var productView = new ProductView('.product_list');
    //var cart = new Cart({
		//usage         : 'operate',
		//deliverPrice  : DATA['deliverPrice'],
		//products      : DATA['products'] || {},
		//totalAmount : DATA['totalAmount'] || 0,
		//selectedProduct : DATA['productCount'] || 0,
    //	confirmHandler: function() {
    //		console.log("起送价"+cart.deliverPrice);
    //		console.log("所有产品"+cart.selectedProducts);
    //		console.log("总价"+cart.totalAmount);
    //		console.log("总份数"+cart.selectedProduct);
    //		var products = cart.selectedProducts;
    //
    //		var productIds = new Array();
    //		var productCounts = new Array();
    //		var productNames = new Array();
    //		var sellingPrices = new Array();
    //		var productQuantitys = new Array();
    //		var spiceTypes = new Array();
    //
    //
    //		for(var propName in products){
    //			var product = products[propName];
    //			if(product.status == 1){ //已选
    //				productIds.push(product.id);
    //				productCounts.push(product.count);
    //				productNames.push(product.name);
    //				sellingPrices.push(product.price);
    //				productQuantitys.push(product.quantity);
    //				spiceTypes.push(product.spiceType);
    //				console.log(product.spiceType);
    //			}
    //		}
    //
    //		var commitData = {
    //			"originalAmount" : cart.totalAmount,
    //			"productCount" : cart.selectedProduct,
    //			"productIds" : productIds.toString(),
    //			"productCounts" : productCounts.toString(),
    //			"productQuantitys" : productQuantitys.toString(),
    //			"productNames" : productNames.toString(),
    //			"sellingPrices" : sellingPrices.toString(),
    //			"spiceTypes" : spiceTypes.toString()
    //		};
    //
    //
    //		Remote.commitProductsData(commitData, function(res){
		//		if(res == "success"){
		//			window.location.href = '/order/userInfo';
		//		}
    //
    //		});
    //
    //	}
    //});
	new ProductController({
		deliverPrice  : DATA['deliverPrice'],
		products      : DATA['products'] || [],
		discounts     : DATA['discounts'] || [],

		confirmHandler: function(totalCount, totalAmount, originalAmount, productData, discountData) {

			//console.log('totalCount    :' + totalCount);
			//console.log('totalAmount   :' + totalAmount);
			//console.log('originalAmount:' + originalAmount);
			//console.log('productData   :' + productData);
			//console.log('discountData  :' + discountData);

			//var productIds = new Array();
			//var productCounts = new Array();
			//var productNames = new Array();
			//var sellingPrices = new Array();
			//var productQuantitys = new Array();
			//var spiceTypes = new Array();
            //
            //
			//for(var propName in products){
			//	var product = products[propName];
			//	if(product.status == 1){ //已选
			//		productIds.push(product.id);
			//		productCounts.push(product.count);
			//		productNames.push(product.name);
			//		sellingPrices.push(product.price);
			//		productQuantitys.push(product.quantity);
			//		spiceTypes.push(product.spiceType);
			//		console.log(product.spiceType);
			//	}
			//}
            //
			//var commitData = {
			//	"originalAmount" : cart.totalAmount,
			//	"productCount" : cart.selectedProduct,
			//	"productIds" : productIds.toString(),
			//	"productCounts" : productCounts.toString(),
			//	"productQuantitys" : productQuantitys.toString(),
			//	"productNames" : productNames.toString(),
			//	"sellingPrices" : sellingPrices.toString(),
			//	"spiceTypes" : spiceTypes.toString()
			//};
            //
            //
			Remote.commitProductsData({
				productCount: totalCount,
				originalAmount: originalAmount,
				receivableAmount: totalAmount,
				productData: productData,
				discountData: discountData
			}, function(res){
				if(res == "success"){
					window.location.href = '/order/userInfo';
				}

			});

		}
	});

})