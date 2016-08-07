define(["Sheet"], function(Sheet){
	"use strict";

	var $dom = window.document;

	function CartView(opt) {
		var products = opt.products || [];
		var usage = opt.usage || 'display';

		// 生成购物车的内容
		var $cartContent = renderInit();
		// 弹出层定义
		var sheetCart = new Sheet({
			create  : true,
			style   : 'bottom',
			content : $cartContent,
			header  : {
				title   : '0',
				button  : '关闭',
				handler : function() {
				}
			}
		});
		// 显示购物车的实例方法
		this.show = function() {
			sheetCart.show();
		}

		// 弹出层左上角的合计
		var $cartSum = sheetCart.getHeader().querySelector('.wui_sheet_title_left');

		if( usage === 'operate') {
			opt.ctrl.registerEventHandler('dataInit', function (product) {
				createOperateCell(opt.ctrl, $cartContent, product);
			});
			opt.ctrl.registerEventHandler('dataChange', function (newProduct) {
				var productId = newProduct['productId'];
				var $cardProduct;
				if (!newProduct['activityId']) {
					$cardProduct = $cartContent.querySelector('#cart_product_' + productId);
				} else {
					$cardProduct = $cartContent.querySelector('#cart_actproduct_' + productId);
				}

				if (!$cardProduct) {
					// 购物车中没有的产品,,则新创建一个购物车条目
					createOperateCell(opt.ctrl, $cartContent, newProduct);
				} else {
					if( newProduct['sellingCount'] == 0) {
						// 购物车中菜品数量已经为空,则删除购物车的条目
						$cardProduct.parentNode.removeChild($cardProduct);
					} else {
						// 购物车中已经存在的产品,修改相关菜品的数量
						$cardProduct.querySelector('.spinner_count').innerHTML = newProduct['sellingCount'];
					}
				}
			});
			opt.ctrl.registerEventHandler('dataSummary', function (totalCount, totalAmount, originalAmount) {
				if( totalCount == 0) {
					sheetCart.close();
				} else {
					$cartSum.innerHTML = totalCount + '份菜品,' +
						'原价: <span class="money">' + originalAmount / 100 + '</span>,' +
						'优惠价: <span class="money">' + totalAmount / 100 + '</span>';
				}
			});
		} else {
			// 在仅需要显示的购物车组件中,直接在左上角显示相关的数据
			$cartSum.innerHTML = opt.selectedProduct + '份菜品,' +
					'原价: <span class="money">' + (opt.originalAmount / 100) + '</span>,' +
					'优惠价: <span class="money">' + (opt.receivableAmount / 100) + '</span>';

			// 初始化菜品列表
			var products = opt.products || [];
			products.forEach(function (product, index) {
				createDisplayCell($cartContent, product);
			});
		}


		this.updateAmount = function(totalAmount) {
			$cartSum.innerHTML = opt.selectedProduct + '份菜品,' +
				'原价: <span class="money">' + opt.originalAmount / 100 + '</span>,' +
				'优惠价: <span class="money">' + totalAmount / 100 + '</span>';
		}
	}

	function renderInit() {
		var $cartContainer = $dom.createElement('div');
		addClass($cartContainer, 'wui_cells');
		addClass($cartContainer, 'cart_contents');

		// 返回生成的处理容器对象
		return $cartContainer;
	}

	function createOperateCell(ctrl, $cartContainer, product) {
		// 生成购物车中的单个购物车的页面元素
		var $newEl = $dom.createElement('div');
		if( !product['activityId']) {
			$newEl.setAttribute('id', 'cart_product_' + product['productId']);
		} else {
			$newEl.setAttribute('id', 'cart_actproduct_' + product['productId']);
		}
		addClass($newEl, 'wui_cell');

		var htmlData =
			'<div class="wui_cell_ct wui_cell_primary">' +
			'<p class="ct_text ct_120">' + product['productName'] + '</p>' +
			'<span class="cart_product_delete font_24 color_999">删除</span>' +
			'</div>' +
			'<div class="wui_cell_rt cell_rt_bd clear">';
		if( product['activityId']) {
			htmlData += '<i class="icon_list_discount left"></i>';
		}
		htmlData = htmlData +
			'<span class="money cart_product_price left">' + product['sellingPrice'] / 100 + '</span>' +
			'<div class="right spinner">' +
			'<i class="spinner_minus icon_cart_minus"></i>' +
			'<span class="spinner_count">' + product['sellingCount'] + '</span>' +
			'<i class="spinner_add icon_cart_add"></i>' +
			'</div>' +
			'</div>';
		$newEl.innerHTML = htmlData;

		$cartContainer.appendChild($newEl);

		// 并绑定加号、减号和删除的事件
		$newEl.querySelector('.spinner_add').addEventListener('click', function() {
			ctrl.inc(null, product);
		});
		$newEl.querySelector('.spinner_minus').addEventListener('click', function() {
			ctrl.dec(null, product, 1);
		});
		$newEl.querySelector('.cart_product_delete').addEventListener('click', function() {
			var productPropId = 'product_' + product['productId'];
			ctrl.dec(null, product, product['sellingCount']);
		});
	}

	function createDisplayCell($cartContainer, product) {
		var $newEl = $dom.createElement('div');
		if( !product['activityId']) {
			$newEl.setAttribute('id', 'cart_product_' + product['productId']);
		} else {
			$newEl.setAttribute('id', 'cart_actproduct_' + product['productId']);
		}
		addClass($newEl, 'wui_cell');

		var htmlData =
			'<div class="wui_cell_ct wui_cell_primary">' +
			'<p class="ct_text ct_90">' + product['productName'] + '</p>' +
			'</div>' +
			'<div class="wui_cell_rt  cell_rt_bd clear">';
		if( product['activityId']) {
			htmlData += '<i class="icon_list_discount left"></i>';
		}
		htmlData += '<span class="money cart_product_price left">' + product['sellingPrice'] / 100 + '</span>' +
			'<span class="productCount right">' + product['sellingCount'] + '份</span>' +
			'</div>';
		$newEl.innerHTML = htmlData;

		$cartContainer.appendChild($newEl);
	}

	function addClass($el, className) {
		if ($el.classList) {
			$el.classList.add(className);
		} else {
			$el.className += className;
		}
	}
	
	return CartView;
})
