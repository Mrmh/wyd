define(["CartView"], function(CartView){
	"use strict";

	var $dom = window.document;

	// 菜品列表页面控制对象
	function ProductController(opt) {
		// 生成Data数据对象
		var productData = new ProductData();

		// 生成普通菜品视图对象
        new ProductDataView({ctrl: productData});
		// 生成优惠活动菜品视图对象
        new ActivityProductView({ctrl: productData});
		// 生成购物车视图对象
        var cartView = new CartView({ctrl: productData, usage: 'operate'});
        // 生成底部条的处理对象
        new TotalView({
            ctrl: productData,
            cartView: cartView,
            confirmHandler: function() {
                opt.confirmHandler(productData.getTotalCount(),
                                   productData.getTotalAmount(),
                                   productData.getOriginalAmount(),
                                   productData.getProductData(),
                                   productData.getDiscountData());
            }
        });

        if( opt.products ) {
            opt.products.forEach(function(product, index){
                var $product = $dom.querySelector("#product_" + product['productId']);
                var stock = 0;
                stock = $product && parseInt($product.getAttribute('data-stock'));

                product['stock'] = stock;
            });
        }
        productData.init(opt.deliverPrice || 15000, opt.products || [], opt.discounts || []);
    }

	function ProductData() {
        // 保存所有的事件处理参数,每个事件对应一个处理数组
        var eventHandlers = {};

        // 当前选择的菜品数据,每个菜品数据以productId或actProductId作为名称
        var productList = {};

        // 活动信息,现在在这里只处理菜品优惠
        var discountList = {};

        var totalCount = 0;
        var totalAmount = 0;
        var originalAmount = 0;

        var deliverPrice;
        this.init = function(initDeliverPrice, products, discounts) {
            deliverPrice = initDeliverPrice;

            discounts.forEach(function(discount, index){
                var activityId = 'activity' + discount['activityId'];
                discountList[activityId] = discount;
            });

            products.forEach(function(product, index){
                var productId, activityId;
                if( !product['activityId'] ) {
                    productId = 'product' + product['productId'];
                } else {
                    productId = 'actProduct' + product['productId'];
                    activityId = 'activity' + product['activityId'];
                }

                var activity;
                if( activityId ) {
                    activity = discountList[activityId];
                }

                product['status'] = 1;
                productList[productId] = product;

                totalCount += product['sellingCount'];
                totalAmount += product['sellingPrice'] * product['sellingCount'];
                originalAmount += product['price'] * product['sellingCount'];

                // 触发数量变化事件
                fireProductEvent('dataChange', product, activity);
            });

            fireSummaryEvent();
        };

		// 增加数量
		this.inc = function(activity, product) {
            var productId;
            if( !product['activityId'] ) {
                productId = 'product' + product['productId'];
            } else {
                productId = 'actProduct' + product['productId'];
            }

            var productData = productList[productId];
            var newProduct = false;
            if( !productData ) {
                newProduct = true;
                productData = product;
                productData['sellingCount'] = 0;
                productData['status'] = 0;
            }

            // 判断库存
            if( productData['sellingCount'] + 1 <= productData['stock']) {
                var activityData;
                if( activity || product['activityId'] ) {
                    activityData = checkActivity(activity, productData, 1);
                    if( !activityData ) {
                        // 如果活动检查不通过,则不再做后续处理
                        return;
                    }
                }

                // 放在这里主要为了就对在活动检查通过时才需要加入产品列表中,要不会出现一些脏数据
                if(newProduct) {
                    productList[productId] = product;
                }
                productData['status'] = 1;

                totalCount += 1;
                totalAmount += productData['sellingPrice'];
                originalAmount += productData['price'];

                productData['sellingCount'] += 1;
                product['sellingCount'] = productData['sellingCount'];

                // 触发数量变化事件
                fireProductEvent('dataChange', product, activityData);
                // 触发汇总事件
                fireSummaryEvent();
            }
		};

		// 减少数量
		this.dec = function(activity, product, count){
            var productId;
            if( !product['activityId'] ) {
                productId = 'product' + product['productId'];
            } else {
                productId = 'actProduct' + product['productId'];
            }

            var productData = productList[productId];
            if( !productData ) {
                // 不应当出现这种情况
                return;
            }

            if( productData['sellingCount'] - count >= 0) {
                var activityData;
                if( activity || product['activityId'] ) {
                    activityData = checkActivity(activity, productData, 0 - count);
                    if( !activityData ) {
                        // 如果活动检查不通过,则不再做后续处理
                        return;
                    }
                }

                totalCount -= count;
                totalAmount -= productData['sellingPrice'] * count;
                originalAmount -= productData['price'] * count;

                productData['sellingCount'] -= count;
                product['sellingCount'] = productData['sellingCount'];

                if( productData['sellingCount'] == 0) {
                    // 库存已经全部减少,则标志产品已经删除
                    productData['status'] = 0;
                }

                // 触发数量变化事件
                fireProductEvent('dataChange', product, activityData);
                // 触发汇总事件
                fireSummaryEvent();
            }
        };

		// 注册与数据相关的事件
		this.registerEventHandler = function(eventName, handler) {
            var handlers = eventHandlers[eventName] || [];
            handlers.push(handler);
            eventHandlers[eventName] = handlers;
		};

		// 取得产品数据
		this.getProductData = function() {
            var products = [];
            for( var productId in productList) {
                if( productList[productId]['status'] == 1) {
                    products.push(productList[productId]);
                }
            }

            return JSON.stringify(products);
		};

		// 取得优惠数据
		this.getDiscountData = function() {
            var discounts = [];
            for( var activityId in discountList) {
                if( discountList[activityId]['status'] == 1) {
                    discounts.push(discountList[activityId]);
                }
            }

            return JSON.stringify(discounts);
		};

        this.getTotalCount = function() {
            return totalCount;
        };

        this.getTotalAmount = function() {
            return totalAmount;
        };

        this.getOriginalAmount = function() {
            return originalAmount;
        };

        // 在增加产品时检查产品的数量
        function checkActivity(activity, product, count) {
            var activityId;
            if (activity) {
                activityId = 'activity' + activity['activityId'];
            } else {
                activityId = 'activity' + product['activityId'];
                if(!discountList[activityId]) {
                    // 在activity为空但是product中activityId不为空的情况只有是在购物车进行调用时
                    return null;
                }
            }
            var activityData = discountList[activityId];
            if( !activityData ) {
                activity['selectedCount'] = 0;
                activity['status'] = 1; // 此活动的数据是否有用,1表示启用,0表示未启用

                activityData = activity;
                discountList[activityId] = activityData;

                activityData['productDataList'] = []; // 保存活动中选择的菜品数据
                activityData['discountAmount'] = 0;
            }
            var actProductList = activityData['productDataList'];

            var actTotalCount = activityData['selectedCount'] + count; //处理后的总数量
            var actProductCount = product['sellingCount'] + count;

            if( actProductCount > activityData['productCount']) {
                // 每个产品选择的数量超过规定的数量
                return null;
            } else if( actTotalCount > activityData['productTotalCount']) {
                // 产品选择的数量超过了产品的最多数量
                return null;
            } else {
                if( actTotalCount <= 0) {
                    // 产品的总数量已经小于或等于0
                    activityData['selectedCount'] = 0;
                    activityData['discountAmount'] = 0;
                    activityData['status'] = 0;
                } else {
                    // 修改已选择菜品的总数量
                    activityData['selectedCount'] = actTotalCount;
                    activityData['discountAmount'] += (product['price'] - product['sellingPrice']) * count;
                    activityData['status'] = 1;

                    if( actProductList.length == 0) {
                        actProductList.push(product);
                    } else {
                        var foundIndex = -1;
                        actProductList.forEach(function(p, index){
                            if( p['productId'] === product['productId']) {
                                foundIndex = index;
                                return true;
                            }
                        });

                        if( foundIndex == -1) {
                            // 一般只会在增加时遇到这种情况
                            actProductList.push(product);
                        } else {
                            if( actProductCount == 0) {
                                actProductList.pop(actProductList[foundIndex]);
                            } else {
                                actProductList[foundIndex] = product; // 更新相关的值
                            }
                        }
                    }
                }
            }
            return activityData;
        }

        function fireProductEvent(eventName, product, activity) {
            var handlers = eventHandlers[eventName] || [];
            handlers.forEach(function(handler){
                handler(product, activity);
            });
        }

        function fireSummaryEvent() {
            var handlers = eventHandlers['dataSummary'] || [];
            handlers.forEach(function(handler){
                handler(totalCount, totalAmount, originalAmount, deliverPrice);
            });
        }
	}

    // 页面底部汇总框的视图处理对象
    function TotalView(opt) {
        // footer-中间的显示信息
        var $selectedProductAmount = $dom.querySelector('#selected_product_amount');
        $selectedProductAmount.innerHTML = '快到碗里来';
        // footer-左边的菜品总数
        var $selectedProductCount = $dom.querySelector('#selected_product_count');
        $selectedProductCount.style.display = 'none';

        // footer右部的起送价显示和操作按钮层
        var $selectedConfirm = $dom.querySelector('#selected_confirm');

        var $btnOrder = null;
        var selectedProduct = 0;
        opt.ctrl.registerEventHandler('dataSummary', function(totalCount, totalAmount, originalAmount, deliverPrice){
            selectedProduct = totalCount;

            // 修改汇总信息
            if( totalCount == 0) {
                $selectedProductAmount.innerHTML = '快到碗里来';
                $selectedProductCount.style.display = 'none';
            } else {
                $selectedProductAmount.innerHTML = '<i class="icon_total"></i><span class="money color_red">' + totalAmount / 100+'</span>';
                $selectedProductCount.textContent = selectedProduct;
                $selectedProductCount.style.display = '';
            }

            if( totalAmount < deliverPrice) {
                if( $btnOrder ) {
                    // 在删除元素前先解绑相关的事件
                    $btnOrder.removeEventListener('click', function(){ });
                    $btnOrder = null;
                }

                // 还未到起送价
                $selectedConfirm.innerHTML = '<span class="gptu">还差<span class="money">' + ((deliverPrice - totalAmount) / 100) + '</span></span>' +
                    '<span class="inall">起送<span class="money">' + (deliverPrice / 100) + '</span></span>';
            } else {
                if( $btnOrder === null) {
                    $selectedConfirm.innerHTML = '<i class="btn_order"></i>';

                    $btnOrder = $selectedConfirm.querySelector('.btn_order');
                    $btnOrder.addEventListener('click', function() {
                        opt.confirmHandler();
                    });
                }
            }
        });

        // 点击底部弹出购物车
        $selectedProductAmount.addEventListener('click', function () {
            if (selectedProduct > 0) {
                // 只有在选择菜品后才会显示购物车
                opt.cartView.show();
            }
        });
        $dom.querySelector(".icon_shoppingcart").addEventListener('click', function () {
            if (selectedProduct > 0) {
                // 只有在选择菜品后才会显示购物车
                opt.cartView.show();
            }
        });

    }

	// 普通菜品的视图对象
	function ProductDataView(opt) {
		// 搜索所有普通菜品的DOM数据
		var $products = $dom.querySelectorAll('.ctrl_product_data');

		// 关联菜品的点击事件
		[].filter.call($products, function ($item, index) {
			//先读取菜品相关的所有数据信息
			var product = {
				productId: $item.getAttribute('id').substr('product_'.length),
				spiceType: parseInt($item.getAttribute('data-spice')),
				price: parseInt($item.getAttribute('data-price')),
                sellingPrice: parseInt($item.getAttribute('data-price')),
				stock: parseInt($item.getAttribute('data-stock')),
				productName: $item.querySelector('.product_name').innerHTML,
				productQuantity: $item.querySelector('.product_qty').innerHTML.split("/")[0]
			};

            if( product['stock'] > 0) { // 在产品有库存时才需要进行这样的处理
                var disableBtnAdd = false;

                // 用户点击菜品的加号
                var $btnAdd = $item.querySelector('.icon_menu_add');
                $btnAdd.addEventListener('click', function () {
                    if( !disableBtnAdd) {
                        opt.ctrl.inc(null, product);
                    }
                });
                // 用户点击菜品的减号
                var $btnMinus = $item.querySelector('.icon_menu_minus');
                $btnMinus.addEventListener('click', function () {
                    opt.ctrl.dec(null, product, 1);
                });

                var $productCount = $item.querySelector('.product_count');
                opt.ctrl.registerEventHandler('dataChange', function (newProduct, activity) {
                    // 当有数据变化的事件发生时进行如下的处理
                    if (!newProduct['activityId'] && product['productId'] === newProduct['productId']) {
                        var productCount = newProduct['sellingCount'];
                        if (productCount >= 1) {
                            $productCount.innerHTML = newProduct['sellingCount'];
                            if( productCount == 1) {
                                $btnMinus.style.display = 'inline-block';
                                $productCount.style.display = 'inline-block';
                            }

                            if( productCount == newProduct['stock']) {
                                addClass($btnAdd, 'disabled');
                                disableBtnAdd = true;
                            } else {
                                if( disableBtnAdd ) {
                                    removeClass($item.querySelector('.icon_menu_add'), 'disabled');
                                    disableBtnAdd = false;
                                }
                            }
                        } else {
                            $btnMinus.style.display = 'none';
                            $productCount.style.display = 'none';
                            if( disableBtnAdd ) {
                                removeClass($item.querySelector('.icon_menu_add'), 'disabled');
                                disableBtnAdd = false;
                            }
                        }
                    }
                });
            }
		});
	}

    // 优惠活动菜品的视图对象
    function ActivityProductView(opt) {
        // 搜索所有优惠活动菜品的DOM数据
        var $activities = $dom.querySelectorAll('.ctrl_activities');

        // 关联菜品的点击事件
        [].filter.call($activities, function ($activity, index) {
            var activity = {
                activityId: $activity.getAttribute('id').substr('activity_'.length),
                name: $activity.getAttribute('data-name'),
                productCount: parseInt($activity.getAttribute('data-productcount')),
                productTotalCount: parseInt($activity.getAttribute('data-totalcount')),
                discountType: $activity.getAttribute('data-discounttype'),
                actShared: $activity.getAttribute('data-actshared'),
                pointShared: $activity.getAttribute('data-pointshared')
            };

            var checkStatus = parseInt($activity.getAttribute('data-checkstatus'));
            if( checkStatus != 0) {
                return; // 如果活动的状态不是正常状态则不做相关处理
            }

            var $products = $dom.querySelectorAll('.ctrl_activity_' + activity['activityId'] + '_products');
            var singleProduct = (activity['productCount'] == 1);
            var toTotalCount = false;

            // 关联菜品的点击事件
            [].filter.call($products, function ($item, index) {
                //先读取菜品相关的所有数据信息
                var product = {
                    productId: $item.getAttribute('id').substr('actproduct_'.length),
                    activityId: activity['activityId'],
                    spiceType: parseInt($item.getAttribute('data-spice')),
                    price: parseInt($item.getAttribute('data-price')),
                    sellingPrice: parseInt($item.getAttribute('data-sellingprice')),
                    stock: activity['productCount'],
                    productName: $item.querySelector('.product_name').innerHTML,
                    productQuantity: $item.querySelector('.product_qty').innerHTML.split("/")[0]
                };

                // 读取基本产品的库存信息
                var $baseProduct = $dom.querySelector("#product_" + product['productId']);
                var stock = 0;
                stock = $baseProduct && parseInt($baseProduct.getAttribute('data-stock'));

                var $productSelect = $item.querySelector('.product_select');
                if( stock > 0) {
                    var $discountInfo, $btnOperate, addOper = true; // 只有单个菜品时使用的变量
                    var $btnMinus, $btnAdd, $productCount,disableBtnAdd = false; // 在可以选择多个菜品时使用
                    if( singleProduct ) {
                        $productSelect.innerHTML =
                            '<p class="product_discount_info font_32 color_white">每单1份</p>' +
                            '<i class="ctrl_operate icon_menu_add"></i>';

                            // 每个菜品只能选择一份
                        $discountInfo = $productSelect.querySelector('.product_discount_info');
                        $btnOperate = $productSelect.querySelector('.ctrl_operate');

                        // 用户点击菜品的加号
                        $btnOperate.addEventListener('click', function () {
                            if( addOper ) {
                                opt.ctrl.inc(activity, product);
                            } else {
                                opt.ctrl.dec(activity, product, 1);
                            }
                        });
                    } else {
                        $productSelect.innerHTML =
                            '<i class="icon_menu_minus" style="display:none;"></i>' +
                            '<span class="product_count font_40 color_white font_strong" style="display:none;">0</span>' +
                            '<i class="icon_menu_add"></i>';

                        // 每个菜品可以选择多份
                        // 用户点击菜品的加号
                        $btnAdd = $productSelect.querySelector('.icon_menu_add');
                        $btnAdd.addEventListener('click', function () {
                            if( !disableBtnAdd) {
                                opt.ctrl.inc(activity, product);
                            }
                        });
                        // 用户点击菜品的减号
                        $btnMinus = $productSelect.querySelector('.icon_menu_minus');
                        $btnMinus.addEventListener('click', function () {
                            opt.ctrl.dec(activity, product, 1);
                        });

                        $productCount = $productSelect.querySelector('.product_count');
                    }

                    opt.ctrl.registerEventHandler('dataChange', function (newProduct, newActivity) {
                        // 当有数据变化的事件发生时进行如下的处理
                        if (newActivity && activity['activityId'] === newActivity['activityId'] && product['productId'] === newProduct['productId']) {
                            var productCount = newProduct['sellingCount'];
                            if (productCount >= 1) {
                                if( singleProduct ) {
                                    $discountInfo.innerHTML = '已选1份';
                                    removeClass($discountInfo, 'color_white');
                                    addClass($discountInfo, 'color_999');

                                    removeClass($btnOperate, 'icon_menu_add');
                                    addClass($btnOperate, 'icon_menu_minus');
                                    $btnOperate.style.display = 'inline-block';

                                    addOper = false;
                                } else {
                                    $productCount.innerHTML = product['sellingCount'];
                                    if (productCount == 1) {
                                        $btnMinus.style.display = 'inline-block';
                                        $productCount.style.display = 'inline-block';
                                    }

                                    if (productCount == activity['productCount'] || productCount == stock) {
                                        addClass($btnAdd, 'disabled');
                                        disableBtnAdd = true;
                                    } else {
                                        if (disableBtnAdd) {
                                            removeClass($item.querySelector('.icon_menu_add'), 'disabled');
                                            disableBtnAdd = false;
                                        }
                                    }
                                }

                                addClass($item, 'ctrl_selected');
                                if( newActivity['selectedCount'] == activity['productTotalCount']) {
                                    toTotalCount = true;

                                    // 已经达到了总数量限制
                                    Array.prototype.forEach.call($products, function ($product, index) {
                                        if( hasClass($product, 'ctrl_actproduct_outstock') || hasClass($product, 'ctrl_selected')) {
                                            return;
                                        }

                                        if( singleProduct ) {
                                            var $currDiscountInfo = $product.querySelector('.product_discount_info');
                                            var $currBtnOperate = $product.querySelector('.ctrl_operate');

                                            if( $currDiscountInfo ) {
                                                $currDiscountInfo.innerHTML = '';
                                                addClass($currBtnOperate, 'disabled');
                                            }
                                        } else {
                                            var $currBtnAdd = $product.querySelector('.icon_menu_add');
                                            addClass($currBtnAdd, 'disabled');
                                        }

                                    });
                                }
                            } else {
                                removeClass($item, 'ctrl_selected');
                                if( singleProduct ) {
                                    $discountInfo.innerHTML = '每单1份';
                                    removeClass($discountInfo, 'color_999');
                                    addClass($discountInfo, 'color_white');

                                    removeClass($btnOperate, 'icon_menu_minus');
                                    addClass($btnOperate, 'icon_menu_add');

                                    addOper = true;
                                } else {
                                    $btnMinus.style.display = 'none';
                                    $productCount.style.display = 'none';
                                }

                                if( newActivity['selectedCount'] < activity['productTotalCount']) {
                                    if( toTotalCount ) {
                                        toTotalCount = false;

                                        // 已经达到了总数量限制
                                        Array.prototype.forEach.call($products, function ($product, index) {
                                            if( hasClass($product, 'ctrl_actproduct_outstock') || hasClass($product, 'ctrl_selected')) {
                                                return;
                                            }

                                            if (singleProduct) {
                                                var $currDiscountInfo = $product.querySelector('.product_discount_info');
                                                var $currBtnOperate = $product.querySelector('.ctrl_operate');

                                                if ($currDiscountInfo) {
                                                    $currDiscountInfo.innerHTML = '每单1份';
                                                    removeClass($currBtnOperate, 'disabled');
                                                }
                                            } else {
                                                var $currBtnAdd = $product.querySelector('.icon_menu_add');
                                                removeClass($currBtnAdd, 'disabled');
                                            }
                                        });
                                    }
                                }
                            }
                        }
                    });
                } else {
                    // 如果相关菜品已经售罄,则在这里显示提醒信息
                    $productSelect.innerHTML = '<p class="product_discount_info font_32 color_999">今日售罄</p>';
                    addClass($item, 'ctrl_actproduct_outstock');
                }
            });
        });
    }

    function addClass($el, className) {
        if ($el.classList) {
            $el.classList.add(className);
        } else {
            $el.className += className;
        }
    }

    function removeClass($el, className) {
        if ($el.classList)
            $el.classList.remove(className);
        else
            $el.className = el.className.replace(new RegExp('(^|\\b)' + className.split(' ').join('|') + '(\\b|$)', 'gi'), ' ');
    }

    function hasClass($el, className) {
        if ($el.classList)
            return $el.classList.contains(className);
        else
            return new RegExp('(^| )' + className + '( |$)', 'gi').test($el.className);
    }

    return ProductController;
});
