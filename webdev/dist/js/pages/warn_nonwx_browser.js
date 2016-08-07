/**
 * Created by kk on 16/1/29.
 */
require.config(requireConfig);
require([ 'judgeUA', 'commonLogic' ], function(judgeUA) {
    $(function() {

        if(judgeUA.isWeiChat()){
            alert('您在使用微信浏览本网页');
        }else{
            alert('请使用微信浏览');
        }
    });
});
