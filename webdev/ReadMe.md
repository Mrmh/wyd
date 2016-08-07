




#系统中特殊字体的使用方法:
 http://www.youziku.com/onlinefont/index
 
 只需要输入需要显示的字体,然后引入文件即可.


#gulp使用说明

我们当前的目录是

- node_modules  => 依赖包
- src    => 源文件
- build  => 测试环境,代码包括各种 map 文件,方便调试
- dist   => 发布环境,可以直接发布到服务器上


## 常用命令
- 在系统中,使用 gulp 或者 其他成员更新了node 模块,那首先需要,安装依赖,执行:

  npm install

- 执行一次编译 ,执行:
  
  gulp

 
- 时刻保持编译,执行 :
   
   gulp watch

   以上两条命令执行之后,会把结果输出到build 目录

-  对原文件进行处理,输出到dist目录,执行 :
    
    gulp dist
    
   
-  发布代码 , 执行 :

    gulp deploy
    
  
##  静态资源
    
资源文件的路径 定义在 paths 中.    
    
  var paths = {
 
 > cssSrc :[
         './src/scss/**/*.scss'
     ],
     htmlSrc :[
           './src/html/**/*.html'
     ],
     jsSrc:[
         './src/js/**/*.js'
     ],
     /*
     release 中的资源可直接发布,这里单独处理,方便后期维护,如有需要可添加其他资源文件
     * */
     release:{
         images :[
             './src/img/**/*.*'
         ]
     },
     build  : './build',
     output : './dist',
     //deploy : '../webapp/assets',
     deploy : './deploy/assets',
     backup : './backup'
 }   
   
    
   
   
   
    

