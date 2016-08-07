

require.config(requireConfig);
require(["jquery", "LazyLoader", "fastClick","swiper"],function($, LazyLoader, FastClick) {
    FastClick.attach(document.body);

    var swiper = new Swiper ('.swiper-container', {
        pagination: '.swiper-pagination',
        paginationClickable: true,
        //loop:true,
        autoplay : 2000,
        autoplayDisableOnInteraction : false
    })

    /*在此吐槽lazyload*/
    //$("img.lazy").lazyload({
    //
    //    threshold : 350 , //设置灵敏度，表示进入显示区域还有200像素就开始加载
    //    effect : "fadeIn" , //使用淡入特效
    //    failure_limit : 10 ,//容差范围，一定要设置此值，原因说明请参考原文档
    //    event : "touchmove" //修改触发事件为滚动
    //});

    var lazyLoader = new LazyLoader(".products");
    lazyLoader.render();

    var isClick=false;
    var $categories = $(".menu_list_item");
    var $products = $(".product_classify");
    var $productsBox= $(".products");
    var $categoryContainer = $('.menu_list');
    var $currentClassify = $(".current_classify");
    var $discountInfo = $(".discount_info");

    //$discountInfo.hide();
    var changeTop = $products.eq(0).offset().top;

    // 处理产品视图的调试和宽度
    $(".product_list").css("height", calcsize());
    window.onresize = function() {
        $(".product_list").css("height", thisHeight);
    };
    var thisHeight = calcsize();
    function calcsize() {
        return $(window).height() - $(".wui_header").height() - $(".wui_footer").height() + "px";
    }

    if($products.find($discountInfo).length > 0){
        $currentClassify.html($products.html());
    }

    $categories.eq(0).addClass('active');
    $productsBox.on("touchmove",function(e){
        e && e.stopPropagation();

        lazyLoader.render();

        if(isClick){
            return;
        };
        if($products.eq(0).position().top > 0){
            $currentClassify.css("display","none");
        }else{
            $currentClassify.css("display","block");
        }
        $boxright=$(this);
        $products.each(function(index){
            if( $(this).offset().top >= 0){
                //左侧当前菜品类别距离顶部位置
                var aTop = $categories.eq(index).position().top;
                //右侧当前标题距离顶部的高度
                //var pTop=$products.eq(index).offset().top;
                var pTop=$(this).offset().top;

                //判断当左侧隐藏时，显示被隐藏菜单

                if (aTop >= $categoryContainer.height() || aTop <= 0) {
                    $categoryContainer.stop().animate({scrollTop: aTop}, 350, function () {
                        return false;
                    });
                }
                //更换悬浮导航条的内容及左侧选中状态
                if (pTop <= changeTop + $(this).height()) {
                    $currentClassify.html($(this).html());
                    $categories.eq(index).addClass("active").siblings().removeClass("active");
                } else{
                    $currentClassify.html($products.eq(index-1).html());
                    $categories.eq(index - 1).addClass("active").siblings().removeClass("active");
                }
                return false;
            }
        });
    });
    $categories.on("click",function(){
        isClick=true;
        var _index=$categories.index($(this));
        $currentClassify.html($products.eq(_index).html());
        $(this).addClass("active").siblings().removeClass("active");

        //右侧菜品滚动到对应位置
        var distance=$products.eq(_index).position().top;
        $productsBox.stop(true,true).animate({scrollTop:$productsBox.scrollTop()+distance},300,function(){
            lazyLoader.render();
            isClick=false;
        });
        return false;
    });
});