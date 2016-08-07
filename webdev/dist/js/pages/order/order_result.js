/**
 * Created by kk on 16/1/25.
 */
require.config(requireConfig);
require(['jquery','fastClick'],function($,FastClick){
    var $doc = $(document);
    //点击晒单,提示分享到朋友圈
    FastClick.attach(document.body);
    $doc.on('click','#show_my_order',function(){
        //alert('click!');
        $('.mask').addClass('active');
    });

    $doc.on('click','.mask',function(){
        $('.mask').removeClass('active');
    });
})



