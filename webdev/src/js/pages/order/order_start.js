require.config(requireConfig);
require(['DateSelector', 'remote', 'Sheet', 'Dialog', 'Toast', "fastClick", 'commonLogic', 'BMap', 'swiper'], function (DateSelector, remote, Sheet, Dialog, Toast, FastClick, _) {

    FastClick.attach(document.body);

    // 时间选择、地址列表、新增地址、地图
    var sheetAddressList;

    $(function () {
        var requestData = {
            storeId: DATA['storeId'],
            storeArea: DATA['area'],
            location: DATA['location'],
            detailAddress: DATA['detailAddress'],
            addressId: DATA['addressId'],
            appointDate: DATA['appointDate'],
            closeTime: DATA['closeTime'],
            operateDate: DATA['operateDate'],
            presaleDates: DATA['presaleDates']
        };

        var needInit = true;
        if (DATA['unfinished']) {
            needInit = false;

            Dialog.show({
                content: '您有一份订单尚未完成,需要继续吗?',
                footer: [{
                    position: 'left',
                    text: '放弃',
                    handler: function () {
                        remote.cleanOrder();

                        init(requestData);
                    }
                },
                    {
                        position: 'right',
                        text: '继续',
                        handler: function () {
                            // 跳转到菜品选择页面
                            window.location.href = "/order/product/list";
                        }
                    }]
            });
        }
        if (needInit) {
            init(requestData);
        }
    });


    ///////////////////初始化页面方法///////////////////////////////
    function init(requestData) {
        var addressListView;
        var dateSelector;

        setAppointDateStr(requestData['appointDate']);

        $('.order_location').on('click', function () {
            if (!addressListView) {
                addressListView = new AddressListView(DATA['addressId'] && 'address' + DATA['addressId'], DATA['addresses'], function (addressData) {
                    $('#ctrl_detail_address').text(addressData['location'] + " " + addressData['detailAddress']);
                    $('#ctrl_cityname').text(addressData['cityName']);

                    requestData['addressId'] = addressData['addressId'];
                    requestData['storeId'] = addressData['storeId'];
                    requestData['storeArea'] = addressData['area'];
                    requestData['location'] = addressData['location'];
                    requestData['detailAddress'] = addressData['detailAddress'];
                    requestData['openTime'] = addressData['openTime'];
                    requestData['closeTime'] = addressData['closeTime'];
                    requestData['operateDate'] = addressData['operateDate'];

                    if (!requestData['appointDate']) {
                        setAppointDateStr(addressData['appointDate'], requestData['appointDate']);
                        requestData['appointDate'] = addressData['appointDate']; //在定位后的推荐订餐日期
                    }

                    if (!dateSelector) {
                        dateSelector = new DateSelector({
                            title: '请选择用餐日期',
                            button: '确认',
                            handler: function (appointDate) {
                                setAppointDateStr(appointDate);

                                requestData['appointDate'] = appointDate;
                            }
                        });
                    }

                    // 使用新的参数初始化日期选择器
                    dateSelector.setDate({
                        appointDate: requestData['appointDate'],
                        operateDate: requestData['operateDate'],
                        totalDates: requestData['presaleDates'],
                        closeTime: requestData['closeTime']
                    });
                }, function () {
                });
            }

            addressListView.show();
        });

        $('.order_appointdate').on('click', function () {
            if (!requestData['detailAddress']) {
                Dialog.show({
                    content: '请输入送餐地址',
                    footer: [{
                        position: 'center',
                        text: '知道了'
                    }]
                });
                return;
            }

            if (!dateSelector) {
                dateSelector = new DateSelector({
                    title: '请输入用餐日期',
                    button: '确认',
                    handler: function (appointDate) {
                        setAppointDateStr(appointDate);

                        requestData['appointDate'] = appointDate;
                    }
                });
            }

            dateSelector.setDate({
                appointDate: requestData['appointDate'],
                operateDate: requestData['operateDate'],
                totalDates: requestData['presaleDates'],
                closeTime: requestData['closeTime']
            });

            //$(".dialog_box").removeClass().addClass("dialog_box date_select");
            dateSelector.show();

        });

        ////////////////// 确认按钮事件///////////////////
        function onConfirm() {
            if (!requestData['detailAddress']) {
                Dialog.show({
                    content: '请选择输入送餐地址',
                    footer: [{
                        position: 'center',
                        text: '知道了'
                    }]
                });
                return;
            }

            if (!requestData['appointDate']) {
                Dialog.show({
                    content: '请选择输入用餐时间',
                    footer: [{
                        position: 'center',
                        text: '知道了'
                    }]
                });
                return;
            }



            if ( requestData['storeId'] !== 6) {
                Dialog.show({
                    content:'没看系统提示吧，不乖哦～ 快用［点餐时光机］下单吧',
                    footer:[{
                        position:'left',
                        text:'算了',
                        handler: function(){
                        }
                    }, {
                        position: 'right',
                        text: '点餐时光机',
                        handler: function () {
                            window.location.href = 'http://wan1dian.100am.cn/wan1dian/wechat/StdFood!query.action';
                        }
                    }]
                });
                return;
            }


            //requestData['isToday'] = isToday;
            remote.commitPreOrderData(requestData, function (res) {
                window.location.href = "/order/product/list"
            });
        }
        $('.btn_confirm').on('click', function () {
            onConfirm();
        });
        $('.ctrl_confirm').on('click', function () {
            onConfirm();
        });
    }

    function setAppointDateStr(newDateStr, oldDateStr) {
        var dispDateStr = newDateStr;
        if (!dispDateStr) {
            $('#ctrl_appoint_date').text('请选择');
            return;
        } else if (dispDateStr === oldDateStr) {
            // 没有变化
            return;
        } else {
            var currDateStr = _.formatDate(new Date(), 'yyyy-MM-dd');
            if (dispDateStr === currDateStr) {
                dispDateStr = '今天';
            }
        }
        $('#ctrl_appoint_date').text(dispDateStr);
    }

    ////////////////////更新地址列表事件,从模板中加载//////////////////////
    function updateSheetAddressList() {
        remote.getOrderStartPageAddressList({}, function (htmlstr) {
            $("#address_list").html(htmlstr);
            sheetAddressList = new Sheet({
                target: '#dialog_location_list'
            });
        });
    }

    function AddressListView(currAddressId, addresses, onConfirm, onCancel) {
        var addressNewView;

        //初始化地址选择sheet
        var sheetAddressList = new Sheet({
            target: '#dialog_location_list'
        });

        var $div = $('#dialog_location_list');
        var $newAddress = $('#add_new_address', $div);
        var $addressList = $('#address_list', $div);

        addresses = addresses || {};

        $newAddress.on('click', function () {
            createAddressNewView();
            sheetAddressList.close();
            addressNewView.show();
        });

        ////////////////返回按钮事件///////////////////////
        $('#dialog_location_list .btn_back_top').on('click', function () {
            sheetAddressList.close();
        });

        // 选择列表中的地址
        $('.address_item', $div).on('click', function () {
            onClickAddressItem(this);
        });


        this.show = function () {
            if (!currAddressId) {
                createAddressNewView();
                addressNewView.show();
            } else {
                sheetAddressList.show();
            }
        }

        function onClickAddressItem(el) {
            var addressId = $(el).attr('id');

            if (addressId !== currAddressId) {
                var currAddress = addresses[addressId];

                $('#' + addressId).addClass('active');
                $('#' + currAddressId).removeClass('active');

                if (!currAddress['operateDate'] || _.parseDateTime(currAddress['operateDate']) < new Date()) {
                    // 如果没有定义开始运营日期或当前日期<开始运营日期
                    currAddress['appointDate'] = _.formatDate(new Date(), 'yyyy-MM-dd');
                } else {
                    currAddress['appointDate'] = currAddress['operateDate'];
                }

                // 记录当前地址对应的门店信息
                onConfirm({
                    addressId: currAddress['id'],
                    location: currAddress['location'],
                    detailAddress: currAddress['detailAddress'],
                    cityCode: currAddress['cityCode'] || '',
                    cityName: currAddress['cityName'] || '',
                    storeId: currAddress['storeId'],
                    area: currAddress['area'],
                    openTime: currAddress['openTime'],
                    closeTime: currAddress['closeTime'],
                    operateDate: currAddress['operateDate'],
                    appointDate: currAddress['appointDate']
                });

                currAddressId = addressId;

                $(".order_intro").text(currAddress['storeNotice']);
            } else {
                onCancel();
            }

            sheetAddressList.close();
        }

        function createAddressNewView() {
            if (!addressNewView) {
                addressNewView = new AddressNewView(function (mapData) {
                    $('.address_item', $addressList).removeClass('active');

                    var addressHtml =
                        '<div id="address' + mapData['addressId'] + '" class="wui_cell address_item active">' +
                        '<div class="wui_cell_lt">' +
                        '<i class="btn_list_select_normal"></i>' +
                        '</div>' +
                        '<div class="wui_cell_ct wui_cell_primary ct_text_rows">' +
                        '<p class="upper_title address_street">' + mapData['location'] + mapData['detailAddress'] + '</p>' +
                        '<p class="side_title color_999 address_door">' + mapData['cityName'] + '</p>' +
                        '</div>' +
                        '</div>';
                    $addressList.append(addressHtml);

                    var addressId = 'address' + mapData['addressId'];
                    addresses[addressId] = mapData;

                    $('.address_item', $div).unbind().bind('click', function () {
                        onClickAddressItem(this);
                    });

                    onClickAddressItem($('#' + addressId));
                }, function () {
                    if (currAddressId) {
                        sheetAddressList.show();
                    }
                });
            }
            addressNewView.clearInput();
        }
    }


    function AddressNewView(onConfirm, onCancel) {
        var mapView; // 地图处理页面

        //初始化新增地址sheet
        var sheetAddressNew = new Sheet({
            target: '#dialog_location_new'
        });

        //var map;
        var locCity; // 地理定位的城市
        var locPoint; // 地理定位的点
        var currCity, currCityCode;
        var mapData;

        var $div = $('#dialog_location_new');
        var $cityList = $("#city_list", $div);
        var $cityItem = $(".select_items", $div);
        var $searchId = $("#searchId");
        var $roomnum = $("#room_num");
        var inputted = false;

        this.clearInput = function () {
            $("#transFee").text('');
        }

        // 初始化城市列表
        var cities = [];
        $cityItem.each(function (index, item) {
            cities.push({
                code: $(item).data('code'),
                name: $(item).val()
            });
        });

        // 确认处理方法
        var innerConfirm = function () {
            mapData['location'] = $searchId.val();
            mapData['detailAddress'] = $roomnum.val();
            mapData['cityCode'] = currCityCode;
            mapData['cityName'] = currCity;

            // 调用后台接口保存地址信息
            remote.commitNewAddress({
                location: mapData['location'],
                cityCode: mapData['cityCode'],
                cityName: mapData['cityName'],
                longitude: mapData['addressLong'],
                latitude: mapData['addressLat'],
                storeId: mapData['storeId'],
                area: mapData['area'],
                detailAddress: mapData['detailAddress']
            }, function (res) {
                sheetAddressNew.close();

                mapData['addressId'] = res;
                mapData['id'] = res;
                onConfirm(mapData);
            });

            // 删除已有的地址信息
            $searchId.val('');
            $roomnum.val('');
            inputted = false;
        }

        /////////城市选择事件/////////////////////
        $cityList.on("change", function () {
            var newCity = $(this).find("option:selected").text();
            if (newCity != currCity) {
                currCityCode = $(this).find("option:selected").data("code");
                currCity = newCity;

                // 删除已有的地址信息
                $searchId.val('');
                $roomnum.val('');
                inputted = false;


                if (mapView) {
                    mapView.setCity(currCity);
                }
            }
        });

        $searchId.on("click", function () {
            if (!mapView) {
                mapView = new MapView(locCity, locPoint, currCity, function (data) {
                    // 对返回的数据进行保存
                    mapData = data;
                    $searchId.val(mapData['location']);
                    sheetAddressNew.show();
                }, function () {
                    sheetAddressNew.show();
                });
            }
            sheetAddressNew.close();
            mapView.show();
        });

        //////////////详细地址输入框失去焦点事件///////////////////////////////
        $roomnum.on("input", function () {
            //判断是否输入完成
            if (!_.isEmpty($("#searchId").val()) && !_.isEmpty($("#room_num").val())) {
                inputted = true;
                $(".address_finish").addClass('active');
            } else {
                $(".address_finish").removeClass('active');
            }
        });

        $(".address_finish").on('click', function () {
            if (!inputted) return;

            innerConfirm();
        });

        $('#dialog_location_new .btn_back_top').on('click', function () {
            sheetAddressNew.close();

            onCancel();
        });


        this.show = function () {
            //if( !map ) {
            //map = new BMap.Map("hideMap");
            // 这里只需要城市信息,所以直接使用地图初始化的信息即可,通过定位太慢了!
            //locCity = map.$g;
            //locateByCity(locCity); // 第一次进入时需要定位地市


            //}
            if(!locPoint) { // 只在未定位时才进行定位
                locateCity();
            }
            sheetAddressNew.show();
        }

        function locateByCity(setCity) {
            currCity = '广州市', currCityCode = 'gz'

            cities.forEach(function (city, index) {
                if (city.name === setCity) {
                    currCity = city.name;
                    currCityCode = city.code;
                    return false;
                }
            });

            $cityList.val(currCity);
        }

        // 定位城市，并把位置记录下来，借MapView使用
        function locateCity() {
            var geolocation = new BMap.Geolocation();
            // 定位城市
            // 不在可选城市，默认为广州
            geolocation.getCurrentPosition(function (r) {
                if (this.getStatus() == BMAP_STATUS_SUCCESS) {
                    var geoc = new BMap.Geocoder();
                    // 保存定位到的点
                    locPoint = new BMap.Point(r.point.lng, r.point.lat);
                    geoc.getLocation(r.point, function (rs) {
                        var addComp = rs.addressComponents;
                        var city = addComp.city.substr(0, 3);
                        // 保存定位到的城市
                        locCity = city;
                        console.log("定位到的城市名：" + locCity);

                        locateByCity(city);
                        Toast.close();
                    });
                } else {
                    console.log('failed' + this.getStatus());
                }
            }, {enableHighAccuracy: true});

            //TODO 因为有时候定位慢，为了保证能拿到定位的点
            Toast.show("正在定位");
        }
    }


    // locCity : 是指地图定位的城市
    // locPoint: 定位到的点
    // currCity: 是指当前选择的地市
    function MapView(locCity, locPoint, currCity, onConfirm, onCancel) {
        var sheetAddressMap = new Sheet({
            target: '#dialog_location_map'
        });

        var $suggestId = $("#suggestId");
        var currPoint; // 已经选择的当前的坐标点
        var map;

        // 这个对象用于查询地址相应的坐标
        var localSearch;

        var innerConfirm = function (storeData, location, lng, lat) {
            $suggestId.text('');
            sheetAddressMap.close();
            // 门店公告
            if (storeData.notice)
                $(".order_intro").text(storeData.notice);

            onConfirm({
                addressLong: lng,
                addressLat: lat,
                location: location,
                storeId: storeData['storeId'],
                area: storeData['area'],
                openTime: storeData['openTime'],
                closeTime: storeData['closeTime'],
                operateDate: storeData['operateDate']
            });
        }

        this.setCity = function (newCity) {
            if (currCity !== newCity) {
                currCity = newCity;

                currPoint = null;
                $("#suggestId").val('');
                if (map) {
                    map.setCurrentCity(newCity);
                    map.centerAndZoom(newCity, 18);
                }
            }
        }

        this.show = function () {
            $suggestId.val('');

            sheetAddressMap.show();
            initMap();
            // 当前位置侯选地址

            //$suggestId.focus();
        };

        $('#dialog_location_map .btn_back_top').on('click', function () {
            sheetAddressMap.close();
            onCancel();
        });

        ////////////初始化地图///////////////////////////////////////
        var autoComplete;
        // 此方法暂时未被使用。
        function locationInbrowser() {
            var geolocation = new BMap.Geolocation();
            geolocation.getCurrentPosition(function (r) {
                if (this.getStatus() == BMAP_STATUS_SUCCESS) {
                    var mk = new BMap.Marker(r.point);
                    //map.addOverlay(mk);
                    map.panTo(r.point);

                    var point = new BMap.Point(r.point.lng, r.point.lat);
                    map.centerAndZoom(point, 18); // 设置地图显示的中心地图，及显示的放大倍数
                    console.log('您的位置：' + r.point.lng + ',' + r.point.lat);
                }
                else {
                    console.log('failed:' + this.getStatus());
                }
            }, {enableHighAccuracy: true});
        }

        // 显示侯选地址列表
        function getLocationList() {
            // 地图中心点
            var centerMarker = new BMap.Marker();
            $(".location_list").html("");
            centerMarker.setPosition(map.getCenter());
            centerMarker.setAnimation(BMAP_ANIMATION_BOUNCE);//跳动的动画

            var thisLng = centerMarker.point.lng;
            var thisLat = centerMarker.point.lat;

            map.clearOverlays();
            //map.addOverlay(centerMarker);

            point = new BMap.Point(thisLng, thisLat);
            var searchKeywords = ["大厦", "小区", "学校", "酒店", "车站", "地铁站", "街道", "政府"];

            var options = {
                onSearchComplete: function (results) {
                    if (localSearchBottom.getStatus() == BMAP_STATUS_SUCCESS) {
                        // 判断状态是否正确
                        var newDiv = [];
                        $.each(results, function (index, result) {
                            for (var i = 0; i < result.getCurrentNumPois(); i++) {
                                newDiv += '<div lng="' + result.getPoi(i).point.lng + '" lat="' + result.getPoi(i).point.lat + '" class="location_item">' +
                                    '<span class="upper_title">' + result.getPoi(i).title + '</span>' +
                                    '<span class="side_text">' + result.getPoi(i).address + '</span>' +
                                    '</div>';
                            }
                        });
                        $(".location_list").append(newDiv);

                        // 选中事件
                        $(".location_item").off();
                        $(".location_item").on("click", function () {
                            var locationTitle = $(this).find(".upper_title").text();
                            var lng = $(this).attr("lng");
                            var lat = $(this).attr("lat");
                            localStoreByRemote(lng, lat, locationTitle);

                            // 选中后改变地图上的点
                            map.clearOverlays();
                            currPoint = new BMap.Point(lng, lat);
                            map.centerAndZoom(currPoint, 18);
                            //map.addOverlay(new BMap.Marker(currPoint));
                        });
                    } else {
                        console.log("status:" + localSearchBottom.getStatus());
                    }
                }
            };

            var localSearchBottom = new BMap.LocalSearch(point, options);
            // 最后一个参数为半径
            localSearchBottom.searchNearby(searchKeywords, point, 100);
        }

        function initMap() {
            if (!map) {
                map = new BMap.Map("container", {enableHighResolution: true, enableDblclickZoom: false});

                var opts = {type: BMAP_NAVIGATION_CONTROL_ZOOM};  //缩放控件
                map.addControl(new BMap.NavigationControl(opts));
                map.disablePinchToZoom();	//禁用双指操作缩放。
                map.disableDoubleClickZoom();
                map.enableDblclickZoom = false;
                // 地图
                map.addEventListener('dragend', function (e) {    //移动结束后定位
                    getLocationList();
                });
                localSearch = new BMap.LocalSearch(map);
            }

            if (currPoint) { // 不需要处理
                //var point = new BMap.Point(currPoint.lng, currPoint.lat);
                //map.centerAndZoom(point, 18); // 设置地图显示的中心地图，及显示的放大倍数
            } else {
                //if( locCity === currCity) {
                // locationInbrowser();
                //} else {
                // 如果不是当前定位地市与选择城市不符,则按城市进行定位
                //map.centerAndZoom(currCity, 18);
                //}
                if (locCity === currCity) { //定位的城市和选择的城市相符,把中心移至定位到的点上
                    // 如果已定位到
                    if (locPoint) {
                        //map.addOverlay(mk);

                        //var mk = new BMap.Marker(locPoint);
                        map.centerAndZoom(locPoint, 18);
                        //map.panTo(locPoint);
                        map.panBy(300 ,225);
                    } else {
                        map.centerAndZoom(currCity, 18);
                        map.setCurrentCity(currCity);
                    }
                } else {
                    map.centerAndZoom(currCity, 18);
                    map.setCurrentCity(currCity);
                }
            }
            getLocationList();

            if (!autoComplete) {
                autoComplete = new BMap.Autocomplete({
                    "input": "suggestId",
                    "location": map
                });

                // 鼠标点击下拉列表后的事件
                autoComplete.addEventListener("onconfirm", function (e) {
                    var _value = e.item.value;
                    var locateValue = _value.city + _value.district + _value.business;
                    //验证所选地址是否在当前城市
                    var reg = new RegExp("^" + currCity);
                    if (reg.test(_value.city)) {
                        localSearch.search(locateValue);
                        // t1: 清除地图上所有覆盖物
                        map.clearOverlays();
                    } else {
                        //不在当前城市
                        Dialog.show({
                            content: '您选择的用餐地址不在' + currCity + '!',
                            footer: [{
                                position: 'center',
                                text: '知道了',
                                handler: function () {
                                    $suggestId.select();
                                }
                            }]
                        });
                    }
                });

                localSearch.enableAutoViewport(); // 允许自动调节窗体大小
                localSearch.setSearchCompleteCallback(function (searchResult) {
                    if (searchResult && searchResult.getNumPois() > 0) {
                        var poi = searchResult.getPoi(0);
                        if (poi.point) {
                            map.centerAndZoom(poi.point, 18);
                            //map.addOverlay(new BMap.Marker(poi.point)); // 添加标注
                            console.log(poi.title + ":" + poi.address + ", poi.point:" + poi.point.lng + "," + poi.point.lat);

                            //设置当前点
                            currPoint = poi.point;
                            // 定位门店信息
                            localStoreByRemote(poi.point.lng, poi.point.lat, poi.title);
                        } else {
                            console.log("poi.point is null");
                        }
                    }
                });
            }
        }

        // 通过经纬度确认门店信息
        function localStoreByRemote(lng, lat, title) {
            remote.locateStore(lng, lat, function (res) {
                var storeData = res;
                if ("C" === storeData.area) { //C区
                    calculateTransFee({lng: lng, lat: lat}, storeData, function (fee) {
                        // 保存门店信息
                        innerConfirm(storeData, title, lng, lat);
                    });
                } else { //AB区
                    // 保存门店信息
                    innerConfirm(storeData, title, lng, lat);
                }
            }, function (res) {
                beyondCArea(res);
            });
        }

        //////////////不在配送范围(超过C区)处理/////////////////////////////////
        var storeMapSheet;
        var swiper;

        function beyondCArea(res) {
            //不在配送范围
            Dialog.show({
                content: res.error,
                footer: [{
                    position: 'left',
                    text: '重选',
                    handler: function () {
                        remote.cleanOrder();
                    }
                },
                    {
                        position: 'right',
                        text: '查看地图',
                        handler: function () {
                            //图片地址
                            var pics = [];
                            var html = "";
                            if (currCity == "广州市") {
                                pics = ["http://7xs4xd.com2.z0.glb.qiniucdn.com/TianHeBei_1.jpg", "http://7xs4xd.com2.z0.glb.qiniucdn.com/PanYu_1.jpg"
                                    , "http://7xs4xd.com2.z0.glb.qiniucdn.com/HuaDu_1.jpg"];
                            } else if (currCity == "北京市") {
                                pics = ["http://7xs4xd.com2.z0.glb.qiniucdn.com/BeiJing.jpg"];
                            } else if (currCity == "上海市") {
                                pics = ["http://7xs4xd.com2.z0.glb.qiniucdn.com/ShangHai.jpg"];
                            } else if (currCity == "深圳市") {
                                pics = ["http://7xs4xd.com2.z0.glb.qiniucdn.com/NanShan.jpg"];
                            } else {
                                return;
                            }

                            $.each(pics, function (index, pic) {
                                html += '<div class="swiper-slide"><img src="' + pic + '" class="main-img"></div>';
                            });

                            if (!storeMapSheet) {
                                var $storeMaps = document.createElement('div');
                                _.addClass($storeMaps, 'store_maps');
                                $storeMaps.setAttribute('id', 'ctrl_store_maps');
                                $storeMaps.innerHTML = '<div class="btn_closeMap" style="z-index:10;"></div>'
                                    + '<div class="swiper-container">'
                                    + '<div class="swiper-wrapper" id="ctrl_maps_content"></div>'
                                    + '<div class="swiper-pagination"></div>'
                                    + '</div>';

                                storeMapSheet = new Sheet({
                                    create: true,
                                    style: 'full',
                                    content: $storeMaps
                                });


                                $('#ctrl_store_maps .btn_closeMap').on('click', function () {
                                    storeMapSheet.close();
                                });
                            }

                            $('#ctrl_maps_content').html(html);

                            if (!swiper) {
                                swiper = new Swiper('.swiper-container', {
                                    pagination: '.swiper-pagination',
                                    paginationClickable: true,
                                    observer: true,
                                    observeParents: true,
                                    loop: false
                                });
                            }

                            storeMapSheet.show();
                        }
                    }]
            });
        }

        /////////////计算费用/////////////////////////
        var driving;

        function calculateTransFee(point1, point2, onConfirmFee) {
            var $transFee = $("#transFee");
            if (driving === undefined) {
                driving = new BMap.DrivingRoute(map, {
                    onSearchComplete: function calculatePrice(rs) {
                        var message = '';
                        if (rs && rs.taxiFare && rs.taxiFare.day) {
                            $transFee.text('地址超出免费送餐区域!需要您支付来回出租车费,约：' + rs.taxiFare.day.totalFare * 2 + '元,实际费用以出租车发票为准');
                        } else {
                            $transFee.text('地址超出免费送餐区域!需要您支付来回出租车费,实际费用以出租车发票为准');
                        }
                        onConfirmFee();
                    },
                    renderOptions: {
                        map: map,
                        autoViewport: false
                    }
                });
            }
            // 打车费用查询
            driving.search(new BMap.Point(point1.lng, point1.lat), new BMap.Point(point2.longitude, point2.latitude));
        }
    }

    //用户输入呼出键盘，解决footer浮动
    //window.onresize = function() {
    //	var top = $(".wui_footer").offset().top;
    //	var user_message_box = $('.wui_footer');
    //	top > 400 ? user_message_box.hide() : user_message_box.show();
    //};
});
