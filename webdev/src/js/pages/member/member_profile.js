/**
 * Created by cgz on 16/2/25.
 */
require.config(requireConfig);
require(["jquery", "remote", "Sheet", "Dialog", "fastClick"],function($, remote, Sheet, Dialog, FastClick) {
    var selectedTagIds = new Array();

	if(typeof(mTags) != "undefined"){
		//取出用户的tagId
		$.each(mTags, function(index, tag){
			selectedTagIds.push(tag);
		});
	}
    
    //获取tag
    $(".select_profile").on("click", function() {
    	var tagTypeId = $(this).data('typeid');
    	var tagTypeName = $(this).data('name');
    		
	    	remote.getTagList(tagTypeId, function(res){
	    		
	    		var htmlstr = "";
	    		var tags = res.tags;
	    		
	    		$.each(tags, function(index, tag) {
		    		htmlstr += '<div data-id="' + tag.id +'" class="wui_cell select_item">'
			    				+  	'<div class="wui_cell_lt">'
			    				+ 		'<i class="btn_list_select_normal"></i>'
			    				+  	'</div>'	
			    				+ 	'<div class="wui_cell_ct wui_cell_primary">'
			    				+		'<div class="ct_text ct_90">'
			    				+ 			 tag.name 
			    				+ 		'</div>'
			    				+ 	'</div>'
		    				+ '</div>';
	    		});
	    		
	    		
	    		
	    		$("#dialog_cells_div").html(htmlstr);
	    		$(".select_item").on("click",bandItemEvent);
				
	    		//已选标记
				selectedMark(selectedTagIds);
				
				//弹出框
				new Sheet({
					create  : false,
					target  : '#dialog_profile',
		            style   : 'bottom',
		            header: {
		                style : 'oper',
		                title : '最喜欢的'+ tagTypeName +'(可多选)',
		                button : '完成',
		                handler : function(){
		                } 
		            }
		        }).show();
	    	});
	    	
	    		
		//选择事件
		 var bandItemEvent = function() {
		 	var id = $(this).data("id");
			if($(this).hasClass("active")){
				$(this).removeClass("active");
				//删除已去选的元素
				selectedTagIds = $.grep(selectedTagIds, function(value) {
					return value != id;
				});
			} else {
				$(this).addClass("active");
				selectedTagIds.push(id);
			}
		};
		
		var selectedMark = function(tagIds){		    	
			$.each(tagIds, function(index, mid){
				$("div[data-id=" + mid + "]").addClass("active");
			});
		}
		
    });
    
    
    
    //保存按钮
  	$("#submitBtn").on("click", function() {
  		//遍历数组
	  		
		var id = $("input[name=id]").val();
		var name = $("input[name=name]").val();
		var mobile = $("input[name=mobile]").val();
		var job = $("input[name=job]").val();
		var birthday = $("input[name=birthday]").val();
		var gender = $("select[name=gender]").val();
		
		
		if(id == "" || name == "" || mobile == "" || birthday == ""){
			Dialog.show({
					content: '请完成输入',
	            	footer: [{
	            		position: 'center',
	            		text: '知道了'
	            	}]
			});
			return ;
		}
		
		/*if( selectedTagIds.length == 0 ){
			Dialog.show({
					content: '请完成最爱的选择',
	            	footer: [{
	            		position: 'center',
	            		text: '知道了'
	            	}]
			});
			return ;
		}*/
		
		
		var selectedTagIdsStr = selectedTagIds.toString();
		var params = {
		  	'id' :  id,
			'name' : name,
			'mobile' : mobile,
			'birthday' : birthday,
			'job'	: job,
			'gender' : gender,
			'tagIds' : selectedTagIdsStr
		};
		remote.updateMemberProfile(params, function(res){
			if(res == "success"){
				Dialog.show({
					content: '已保存',
	            	footer: [{
	            		position: 'center',
	            		text: '返回',
	            		handler : function(){
	            			window.location = "/member/index";
	            		}
	            	}]
				});
			}
		});
	});

});