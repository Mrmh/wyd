/**
 * Created by kk on 16/1/26.
 */

require.config(requireConfig);


require(['jquery', 'Dialog', 'remote', 'CartView', 'DateSelector', 'TimeSelector', 'commonLogic', 'fastClick'], function ($, Dialog, Remote, CartView, DateSelector, TimeSelector, _, FastClick) {

    FastClick.attach(document.body);

    var $user_name = $(".contact_name"), $user_phone = $(".contact_phone");
    var $remark = $("textarea[name=remark]");

    if (DATA['userName'] != null) {
        $('.contact_name').val(DATA['userName']);
    } else {
        $('.contact_name').val("");
    }

    if (DATA['mobile'] != null) {
        $('.contact_phone').val(DATA['mobile']);
    } else {
        $('.contact_phone').val("");
    }

    // 显示用餐日期的提示
    dispAppointDate(DATA['appointDate']);

    var dateSelector = new DateSelector({
        title: '您的用餐日期',
        button: '完成',
        handler: function (selectDate) {
            if( selectDate == DATA['appointDate']) {
                return;
            }

            DATA['appointDate'] = selectDate;
            DATA['appointTime'] = '';
            dispAppointDate(selectDate);

            timeSelector.setTime({
                appointDate: selectDate
            });
            $('.arriveTime').text('选择时间');
        }
    });

    $('#dishArriveDate').on("click", function () {
        dateSelector.setDate({
            appointDate: DATA['appointDate'],
            operateDate: DATA['operateDate'],
            totalDates : DATA['presaleDates'],
            closeTime  : DATA['closeTime']
        });
        dateSelector.show();
    });


    var timeSelector = new TimeSelector({
        openTime: DATA['openTime'],
        closeTime: DATA['closeTime'],
        title: '您的用餐时间',
        button: '完成',
        handler: function (selectTime) {
            if( selectTime === DATA['appointTime']) {
                return;
            }

            var strTime = '';
            var strSelectHour = selectTime.substring(0, 2);
            if( strSelectHour === '00' || strSelectHour === '01') {
                strTime += '<span class="timeTips">次日</span>';
            }
            strTime += selectTime;
            $('.arriveTime').html(strTime);

            DATA['appointTime'] = selectTime;
        }
    });

    $('#dishArriveTime').on("click", function () {
        timeSelector.setTime({
            appointDate: DATA['appointDate'],
            appointTime: DATA['appointTime']
        });
        timeSelector.show();
    });

    //购物车
    var cart;
    $("#product_list").on("click", function () {
        if (!cart) {
            cart = new CartView({
                usage: 'display',
                deliverPrice: DATA['deliverPrice'] / 100,
                products: DATA['products'],
                originalAmount: DATA['originalAmount'],
                receivableAmount: DATA['receivableAmount'],
                selectedProduct: DATA['productCount'],
                confirmHandler: function () {
                }
            });
        }
        cart.show();
    });

    //修改操作
    $('#modify_address').on("click", function () {
        Dialog.show({
            content: '修改地址需要重新选菜下单，您确认吗？',
            footer: [{
                position: 'left',
                text: '取消'
            },
                {
                    position: 'right',
                    text: '确认',
                    handler: function () {
                        Remote.cleanOrder({cleanType: 1}, function () {
                            // 跳转到菜品选择页面
                            window.location.href = "/order/start";
                        });
                    }
                }]
        });
    });

    // 点击下一页的时候对本页面的输入数据判断之后,进行存储
    $(".btn_order_next").on('click', function () {
        if (_.isEmpty($user_name.val())) {
            showErrMsg("请输入联系人姓名", function () {
                $user_name.focus();
            });
        } else if (_.isEmpty($user_phone.val())) {
            showErrMsg("请输入联系人手机号码", function () {
                $user_phone.focus();
            });
        } else if (!isValidMobileNumber()) {
            showErrMsg("手机号码格式有误", function () {
                $user_phone.focus();
            });
        } else if (_.isEmpty(DATA['appointDate']) || _.isEmpty(DATA['appointTime'])) {
            showErrMsg("请选择用餐时间");
        } else {
            Remote.commitUserData(
                {
                    userName: $user_name.val(),
                    mobile: $user_phone.val(),
                    remark: $remark.val(),
                    appointDate: DATA['appointDate'],
                    appointTime: DATA['appointTime']
                }, function (res) {
                    if (res == "success")
                        window.location.href = "/order/detail/prepay";
                });
        }

    });

    function showErrMsg(msg, handler) {
        Dialog.show({
            content: msg,
            footer: [{
                position: 'center',
                text: '知道了',
                handler: handler
            }]
        });
    }

    function isValidMobileNumber() {

        var MobileNumber = $('.contact_phone').val();
        if ((/^1[3|4|5|7|8]\d{9}$/.test(MobileNumber))) {
            return true;
        } else {
            return false;
        }
    }


    $('.icon_goBack').on('click', function () {
        window.location.href = '/order/product/list';
    });

    function dispAppointDate(appointDate) {
        var currDate = _.formatDate(new Date(), 'yyyy-MM-dd');
        if (appointDate == currDate) {
            $('.dishArrivedate').text("今天");
        } else {
            $('.dishArrivedate').text(appointDate);
        }
    }
});