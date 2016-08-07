define(["Sheet"], function(Sheet){
	"use strict";

	var $dom = window.document;
	
	//
	// products      : 已经选择的菜品信息
	//                如果有则需要根据它对购物车进行初始化
	// totalAmount   : 总价格
	// selectedProduct : 总产品数量
	//
	// usage         : 购物车有两种用途,
	//                operate 一种是操作
	//                display 一种是显示,只需要处理购物车的弹出层
	//
	// deliverPrice  : 起送价
	// confirmHandler: 确定后的处理逻辑
	//
	function Cart(opt) {
		var that = this;

		// 处理传入的参数信息
		// 以id为key, 包含产品名称、已选择数量等
		this.selectedProducts = {};
		var products = opt.products || [];

		this.deliverPrice = opt.deliverPrice || 15000; // 当前的起送金额
		this.totalAmount = opt.totalAmount || 0; // 订单总金额
		this.selectedProduct = opt.selectedProduct || 0; // 已经选择的总产品份数
		this.usage = opt.usage || 'display';
		// 确认处理方法
		this.confirmHandler = opt.confirmHandler || function() {};

		// 生成购物车的内容
		this.$cartContent = render(this, this.usage, products);
		// 弹出层定义
		this.sheetCart = new Sheet({
			create  : true,
			style   : 'bottom',
			content : this.$cartContent,
			header  : {
				title   : '0',
				button  : '关闭',
				handler : function() {
				}
			}
		});
		// 弹出层左上角的合计
		this.$cartSum = this.sheetCart.getHeader().querySelector('.wui_sheet_title_left');


		if( this.usage === 'operate') {
			// 菜品
			this.$product = $dom.querySelector('ul.products');
			// footer-中间的显示信息
			this.$selectedProductAmount = $dom.querySelector('#selected_product_amount');
			this.$selectedProductAmount.innerHTML = '快到碗里来';
			// footer-左边的菜品总数
			this.$selectedProductCount = $dom.querySelector('#selected_product_count');
			this.$selectedProductCount.style.display = 'none';

			this.$btnOrder = null; // 订餐按钮的元素

			this.$selectedConfirm = $dom.querySelector('#selected_confirm');

			// 菜品列表中的元素初始化时就存在，先绑定事件
			[].filter.call(this.$product.querySelectorAll('.icon_menu_add'), function ($item, index) {
				$item.addEventListener('click', function () {
					var $liProduct = this.parentNode.parentNode.parentNode.parentNode;
					var productId = $liProduct.getAttribute('id').substr('product_'.length);
					that.inc(productId);
				});
			});
			[].filter.call(this.$product.querySelectorAll('.icon_menu_minus'), function ($item, index) {
				$item.addEventListener('click', function () {
					var $liProduct = this.parentNode.parentNode.parentNode.parentNode;
					var productId = $liProduct.getAttribute('id').substr('product_'.length);
					that.dec(productId, 1);
				});
			});

			// 点击底部弹出购物车
			this.$selectedProductAmount.addEventListener('click', function () {
				if (that.selectedProduct > 0) {
					// 只有在选择菜品后才会显示购物车
					that.sheetCart.show();
				}
			});
			$dom.querySelector(".icon_shoppingcart").addEventListener('click', function () {
				if (that.selectedProduct > 0) {
					// 只有在选择菜品后才会显示购物车
					that.sheetCart.show();
				}
			});
		}

		this.handleTotal();
	}

	function render(that, usage, products) {
		var $cartContainer = $dom.createElement('div');
		addClass($cartContainer, 'wui_cells');
		addClass($cartContainer, 'cart_contents');

		if( products !== undefined && products.length > 0) {
			products.forEach(function (product, index) {
				if (usage === 'operate') {
					createOperateCell(that, $cartContainer, product);
				} else {
					createDisplayCell(that, $cartContainer, product);
				}
				that.selectedProducts['product_' + product['id']] = product;
			});
		}
		// 返回生成的处理容器对象
		return $cartContainer;
	}

	function createOperateCell(that, $cartContainer, product) {
		// 在菜品列表中显示减号和数量
		var $product = $dom.querySelector('ul.products');
		var $currProductListEl = $product.querySelector('#product_' + product['id']);
		$currProductListEl.querySelector('.icon_menu_minus').style.display = 'inline-block';
		$currProductListEl.querySelector('.product_count').innerHTML = product['count'];
		$currProductListEl.querySelector('.product_count').style.display = 'inline-block';

		// 生成购物车中的单个购物车的页面元素
		var $newEl = $dom.createElement('div');
		$newEl.setAttribute('id', 'cart_product_' + product['id']);
		addClass($newEl, 'wui_cell');

		$newEl.innerHTML =
			'<div class="wui_cell_ct wui_cell_primary">' +
			  '<p class="ct_text ct_120">' + product['name'] + '</p>' +
			  '<span class="cart_product_delete font_24 color_999">删除</span>' +
			'</div>' +
			'<div class="wui_cell_rt cell_rt_bd clear">' +
			  '<i class="icon_list_discount left"></i>' +
			  '<span class="money cart_product_price left">' + product['price'] / 100 + '</span>' +
			  '<div class="right spinner">' +
			    '<i class="spinner_minus icon_cart_minus"></i>' +
			    '<span class="spinner_count">' + product['count'] + '</span>' +
			    '<i class="spinner_add icon_cart_add"></i>' +
			  '</div>' +
			'</div>';

		$cartContainer.appendChild($newEl);

		// 并绑定加号、减号和删除的事件
		$newEl.querySelector('.spinner_add').addEventListener('click', function() {
			that.inc(product['id']);
		});
		$newEl.querySelector('.spinner_minus').addEventListener('click', function() {
			that.dec(product['id'], 1);
		});
		$newEl.querySelector('.cart_product_delete').addEventListener('click', function() {
			var productPropId = 'product_' + product['id'];
			that.dec(product['id'], product['count']);
		});
	}

	function createDisplayCell(that, $cartContainer, product) {
		var $newEl = $dom.createElement('div');
		$newEl.setAttribute('id', 'cart_product_' + product['id']);
		addClass($newEl, 'wui_cell');

		$newEl.innerHTML =
			'<div class="wui_cell_ct wui_cell_primary">' +
			  '<p class="ct_text ct_90">' + product['name'] + '</p>' +
			'</div>' +
			'<div class="wui_cell_rt  cell_rt_bd clear">' +
			    '<span class="money cart_product_price left">' + product['price'] / 100 + '</span>' +
			    '<span class="productCount right">' + product['count'] + '份</span>' +
		    '</div>';

		$cartContainer.appendChild($newEl);
	}

	Cart.prototype.show = function() {
		this.sheetCart.show();
	}

	// 某产品增加数量
	Cart.prototype.inc = function(productId) {
		var that = this;
		var $newli, $currCartProductEl, product, insertCartProduct;
		var productPropId = 'product_' + productId;
		var $currProductListEl = this.$product.querySelector('#' + productPropId);

		product = this.selectedProducts[productPropId];
		if( product === undefined) {
			// 新加入选择的产品
			product = {
				id    : productId,
				name  : $currProductListEl.querySelector('.product_name').innerHTML,
				quantity  : $currProductListEl.querySelector('.product_qty').innerHTML.split("/")[0],
				spiceType : parseInt($currProductListEl.getAttribute('data-spice')),
				price : parseInt($currProductListEl.getAttribute('data-price')),
				count : 0,
				status: 1
			}
			this.selectedProducts[productPropId] = product;
		} else {
			if( product.status === 0) {
				product.status = 1;
				product.count = 0;
			}
		}

		var stock = parseInt($currProductListEl.getAttribute("data-stock"));
		if( product.count === stock) {
			// TODO 库存不足,不能再增加数量了
			return;
		}

		// 统计增加
		product.count = product.count + 1;
		this.totalAmount = this.totalAmount + product.price;
		this.selectedProduct += 1;
		
		// 增加产品列表中的产品数量
		$currProductListEl.querySelector('.product_count').innerHTML = product.count;

		// 如果原来的数量为0，则:
		if( product.count === 1) {
			createOperateCell(this, this.$cartContent, product);
		} else {
			// 如果原来的数量不为0，则：
			//   增加购物车中的产品数量
			$currCartProductEl = this.$cartContent.querySelector('#cart_' + productPropId);
			$currCartProductEl.querySelector('.spinner_count').innerHTML = product.count;
		}
		
		// 修改汇总信息
		this.handleTotal();
	}
 	
	// 某产品减少数量
	Cart.prototype.dec = function(productId, count) {
		var $currProductListEl, $currCartProductEl, product;
		var productPropId = 'product_' + productId;

		var product = this.selectedProducts[productPropId];
		if( product === undefined) {
			return;
		}

		// 选择的数量减一
		product.count = product.count - count;
		this.totalAmount = this.totalAmount - product.price * count;
		this.selectedProduct -= count;

		// 增加产品列表中的产品数量
		$currProductListEl = this.$product.querySelector('#' + productPropId);
		$currProductListEl.querySelector('.product_count').innerHTML = product.count;

		$currCartProductEl = this.$cartContent.querySelector('#cart_' + productPropId);
		
		if( product.count == 0) {
			product.status = 0;
			
			// 修改后的数量已经为0，则：
			//    在菜品列表中隐藏减号和数量
			$currProductListEl.querySelector('.icon_menu_minus').style.display = 'none';
			$currProductListEl.querySelector('.product_count').style.display = 'none';
			//    解绑处理事件及删除购物车中的产品项目
			$currCartProductEl.querySelector('.icon_cart_add').removeEventListener('click', function() { });
			$currCartProductEl.querySelector('.icon_cart_minus').removeEventListener('click', function() { });
			$currCartProductEl.querySelector('.cart_product_delete').removeEventListener('click', function() { });
			$currCartProductEl.parentNode.removeChild($currCartProductEl);
			
			if( this.selectedProduct == 0) {
				this.sheetCart.close();
			}
		} else {
			// 修改后的数量不为0，则
			//    在购物车中修改数量显示
			$currCartProductEl.querySelector('.spinner_count').innerHTML = product.count;
		}
		this.handleTotal();
	};
	
	Cart.prototype.handleTotal = function(productId, count) {
		var that = this;
		var footerRightContent;

		if( this.usage === 'display') {
			this.$cartSum.innerHTML = this.selectedProduct + '份菜品,合计: <span class="money">' + this.totalAmount / 100+'</span>';
			return;
		}

		// 修改汇总信息
		if( this.selectedProduct == 0) {
			this.$selectedProductAmount.innerHTML = '快到碗里来';
			this.$selectedProductCount.style.display = 'none';
			this.$cartSum.innerHTML = '';
		} else {
			this.$selectedProductAmount.innerHTML = '<i class="icon_total"></i><span class="money color_red">' + this.totalAmount / 100+'</span>';
			this.$cartSum.innerHTML = this.selectedProduct + '份菜品,合计: <span class="money">' + this.totalAmount / 100+'</span>';
			this.$selectedProductCount.textContent = this.selectedProduct;
			this.$selectedProductCount.style.display = '';
		}
		
		if( this.totalAmount < this.deliverPrice) {
			if( this.$btnOrder ) {
				// 在删除元素前先解绑相关的事件
				this.$btnOrder.removeEventListener('click', function(){ });
				this.$btnOrder = null;
			}
			
			// 还未到起送价
			this.$selectedConfirm.innerHTML = '<span class="gptu">还差<span class="money">' + ((this.deliverPrice - this.totalAmount) / 100) + '</span></span>' +
                                              '<span class="inall">起送<span class="money">' + (this.deliverPrice / 100) + '</span></span>';
		} else {
			if( this.$btnOrder === null) {
				this.$selectedConfirm.innerHTML = '<i class="btn_order"></i>';

	            this.$btnOrder = $dom.querySelector('.btn_order');
	            this.$btnOrder.addEventListener('click', function() {
	            	that.confirmHandler();
	            });
			}
		}
	}

	// 从购物车中删除菜品
	Cart.prototype.delete = function(productId) {
		var productPropId = 'product_' + productId;

		var product = this.selectedProducts[productPropId];
		if( !product ) {
			return;
		}

		var $currCartProductEl = this.$cartContent.querySelector('#cart_' + productPropId);
		$currCartProductEl.parentNode.removeChild($currCartProductEl);

		this.totalAmount = this.totalAmount - product['price'] * product['count'];
		this.selectedProduct -= product['count'];

		this.handleTotal();
	}

	function addClass($el, className) {
		if ($el.classList) {
			$el.classList.add(className);
		} else {
			$el.className += className;
		}
	}
	
	return Cart;
})
