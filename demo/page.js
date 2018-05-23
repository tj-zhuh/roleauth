

require.config({
    paths: {        
        "jquery": "jquery-1.12.4"
    }
})

var _, $;

define(function (require) {

    $ = require('jquery');
    _ = require('lodash');

    $(function () {
        
        Page.init();

    })

}); 


var Page = {
    current_RoleId: '',
    init: function () {
        var that = this;

        $("#query").click(function () {
            that.query(that.current_RoleId);
        })

        // 全选
        $('#button-select-all').click(function () {

            var allChecked = _.all(that.all_nodes, 'checked');

            for (var i = 0; i < that.all_nodes.length; i++) {
                var node = that.all_nodes[i];
                node.setCheckState(!allChecked);
            }
        })

        // 保存
        $('#submit-edit').click(function () {
            var obj = {};
            obj.RoleId = that.current_RoleId;

            var menufeatureIds = [];

            for (var i = 0; i < that.all_nodes.length; i++) {
                var node = that.all_nodes[i];
                if (node.checked && node.businessId) {
                    menufeatureIds.push(node.businessId);
                }
            }

            obj.MenufeatureIds = menufeatureIds.toString();

            Util.ajax({
                url: '/api/ManageRoleauthors/Save',
                type: 'post',
                data: obj,
                show_success_msg: true,
                success_msg: '保存成功'
            })
        })

        // 选择tab
        //$('#menu-level1-tab').on('mouseover', 'li', function () {
        $('#menu-level1-tab').on('click', 'li', function () {
            var tabId = $(this).attr('tabId');
            $('#menu-level1-tab li').removeClass('active');
            $(this).addClass('active');

            $('#auth-panel .tab-sub-panel').hide();
            $('#auth-panel .tab-sub-panel[tabId=' + tabId + ']').show();

            if (window.top.G) {
                window.top.G.RefreshHeight();
            }
        })

        // 选择节点
        $('#auth-panel').on('click', 'cite', function (e) {
            var nodeId = $(this).attr('nodeId');
            var node = _.find(that.all_nodes, 'nodeId', nodeId);

            if (node) {
                node.changeCheckState();
            }
        })

        this.prepare_window_selector();
    },

    query: function (roleId) {
        var that = this; 
        var data = get2();
        var data2 = get3();
        that.menu_tree = data2.Models;
        that.show_auths(that.menu_tree, data.Models); 
    },

    all_nodes: [],

    horizontally_group_count: 3,

    show_auths: function (tree, auths) {
        var that = this;

        // 先清空之前的
        $("#menu-level1-tab li").remove();
        $("#auth-panel .tab-sub-panel").remove();

        var list = this.translate(tree, auths);
        var root = list[0];
        this.all_nodes = list;

        for (var i = 0; i < root.children.length; i++) {

            // 一级菜单的每个节点
            var nodeLevel1 = root.children[i];

            // li是tab标签
            var li = $("<li></li>");

            // sub是tab的body
            var sub = $("<ul class='tab-sub-panel horizontally-grouped'></ul>");

            // 在li和sub中维护tabId
            li.attr('tabId', nodeLevel1.nodeId);
            sub.attr('tabId', nodeLevel1.nodeId);

            // cite保存tab标签里的选择框
            //var cite = $("<cite></cite>");
            //li.append(cite);

            // span是标签名字
            var span = $("<span></span>");
            span.html(nodeLevel1.nodeName);
            li.append(span);

            // innerLiArr维护sub里面分的三列
            var innerLiArr = [];
            for (var j = 0; j < that.horizontally_group_count; j++) {

                // innerLi是sub的一列
                var innerLi = $("<li class='group'></li>");

                // 在sub中添加innerLi
                sub.append(innerLi);

                // 在innerLiArr中添加项
                innerLiArr.push(innerLi);
            }

            // 遍历一级菜单中的每个二级菜单
            for (var j = 0; j < nodeLevel1.children.length; j++) {

                // 二级菜单节点
                var nodeLevel2 = nodeLevel1.children[j];

                // 计算放在哪个innerLi中
                var k = j % that.horizontally_group_count;

                // 创建一个panel，用于存放tree
                var panel = $("<div class='tree-panel'></div>");

                // 把这个panel加到innerLi中
                innerLiArr[k].append(panel);

                // 绘制tree
                nodeLevel2.draw(panel, 2);
            }

            // 默认选中第一个tab
            if (i == 0) {
                li.addClass('active');
                sub.addClass('active');
            }

            // 把tab的li和sub加到页面中
            $('#menu-level1-tab').append(li);
            $('#auth-panel').append(sub);
        }

        // 调整iframe高度
        if (window.top.G) {
            window.top.G.RefreshHeight();
        }

        // 更新选中情况
        root.updateCheckStateRecursive();
    },

    // 组成树结构
    translate: function (menu, auths) {
        var list = [];
        var copy_tree = menu;

        var root = new Node();
        root.nodeId = 'root';
        root.nodeName = 'root';
        root.level = 0;
        list.push(root);
         
        // 循环
        while (copy_tree.length > 0) {

            // 是否找到新的子节点
            var found = false;

            // 遍历在list中已存在的节点
            for (var i = 0; i < list.length; i++) {

                // parent是在list已经存在的节点
                var parent = list[i];

                // 寻找parent的子节点
                var child = _.find(copy_tree, 'ParentId', parent.nodeId);

                // 如果找到了子节点
                if (child) {

                    // 在copy_tree删除子节点
                    _.remove(copy_tree, child);

                    var node = new Node();
                    node.nodeId = child.MenuId;
                    node.nodeName = child.MenuName;

                    // 在list中添加子节点
                    list.push(node);

                    // 在parent中添加节点
                    parent.append(node);

                    // 记录已经找到子节点了
                    found = true;

                    // 退出for循环
                    break;
                }
            }

            // 如果找到了，继续找
            if (found) {
                continue;
            }

            // 再也找不到新的子节点，退出while
            break;
        }



        for (var i = 0; i < auths.length; i++) {
            var auth = auths[i];

            // 遍历在list中的节点
            for (var j = 0; j < list.length; j++) {

                // parent是在list中的节点
                var parent = list[j];

                // 寻找子节点
                if (auth.MenuId == parent.nodeId && parent.level == 3) {
                    var node = new Node();
                    node.nodeId = 'auth' + auth.MenufeatureId;
                    node.nodeName = auth.FeatureAlias;
                    node.businessId = auth.MenufeatureId;
                    node.checked = auth.Active;

                    parent.append(node);
                    list.push(node);

                    break;
                }
            }
        }

        return list;
    },

    all_roles: [],
    prepare_window_selector: function () {
        var that = this;

        $('#choice-role').click(function () {

            if (that.all_roles.length == 0) {
                return;
            }

            that.open_window();
        })

        $('#window-save').click(function () {
            var id = $("#rolelist li.active").attr('RoleId');
            var name = $("#rolelist li.active").attr('RoleName');
            if (!id) {
                Util.alert('请选择一个角色');
                return;
            }
            that.select_role(id, name);
        })

        $('#window-close').click(function () {
            that.close_window();
        });
        $('#window-cancel').click(function () {
            that.close_window();
        })

        var data = get1();

        var list = data.Models;
        that.all_roles = list;

        if (list.length == 0) {
            $('#RoleName').html('没有角色可供选择');
            return;
        }

        that.current_RoleId = list[0].RoleId;
        $('#RoleName').val(list[0].RoleName);
        that.query(list[0].RoleId);

        var ul = $("#rolelist");

        for (var i = 0; i < data.Models.length; i++) {
            var item = data.Models[i];

            var li = $("<li>");
            li.append(item.RoleName);
            li.attr('RoleId', item.RoleId);
            li.attr('RoleName', item.RoleName);

            if (item.RoleId == that.current_RoleId) {
                li.addClass('active');
            }

            ul.append(li);
        }

        $("#rolelist li").click(function () {
            $("#rolelist li").removeClass('active');
            $(this).addClass('active');
        })

        $("#rolelist li").dblclick(function () {
            var RoleId = $(this).attr('RoleId');
            var RoleName = $(this).attr('RoleName');
            that.select_role(RoleId, RoleName);
        })
        
    },

    open_window: function () {
        var that = this;
        $('.window').fadeIn(200);

        var clearSlct = "getSelection" in window
        ? function () {
            window.getSelection().removeAllRanges();
        } : function () {
            document.selection.empty();
        };
        clearSlct();
    },

    close_window: function () {
        $('.window').hide();
    },

    select_role: function (id, name) {
        $('#RoleName').val(name);
        this.close_window();
        this.current_RoleId = id;
        this.query(id);
    },
};




function Node() {

    // 元素Id，节点的唯一标识，用于寻找上下级
    this.nodeId;

    // 业务Id，最终提交时，会所有选中的元素的businessId
    this.businessId;

    // 元素名字
    this.nodeName;

    // div元素，里面存放checkbox和节点名称
    this.span;

    this.checkbox;

    // ul元素，里面存放子元素
    this.ul;

    // 对parent节点的引用
    this.parent;

    // 层级
    this.level;

    // 所有孩子节点
    this.children = [];

    // 是否选中
    this.checked = false;

    // 获得所有后代
    this.getDescendant = function () {

        var list = [];

        for (var i = 0; i < this.children.length; i++) {
            list.push(this.children[i]);
        }

        for (var i = 0; i < this.children.length; i++) {
            var sub = this.children[i].getDescendant();
            for (var j = 0; j < sub.length; j++) {
                list.push(sub[j]);
            }
        }

        return list;
    }

    // 添加子节点
    this.append = function (child) {
        child.level = this.level + 1;
        child.parent = this;
        this.children.push(child);
    }

    // 递归更新选中状态
    this.updateCheckStateRecursive = function () {
        var that = this;
        for (var i = 0; i < this.children.length; i++) {
            that.children[i].updateCheckStateRecursive();
        }

        if (that.children.length > 0) {
            var allChildrenChecked = _.all(that.children, 'checked')
            if (that.checked != allChildrenChecked) {
                that.setCheckState(allChildrenChecked);

                if (that.parent) {
                    that.parent.updateCheckStateRecursive();
                }
            }
        }
    }

    // 递归更新选中状态-->仅向上递归
    this.updateCheckStateRecursiveUp = function () {
        var that = this;

        if (that.children.length > 0) {
            var allChildrenChecked = _.all(that.children, 'checked')
            if (that.checked != allChildrenChecked) {
                that.setCheckState(allChildrenChecked);
            }
        }

        if (that.parent) {
            that.parent.updateCheckStateRecursiveUp();
        }
    }

    // 修改选中状态
    this.changeCheckState = function () {

        var that = this;
        var currentState = that.checked;
        var newState = !currentState;

        var descendants = that.getDescendant();
        for (var i = 0 ; i < descendants.length; i++) {
            descendants[i].setCheckState(newState);
        }

        that.setCheckState(newState);
        that.updateCheckStateRecursiveUp();
    }

    this.setCheckState = function (state) {
        this.checked = state;

        if (this.checkbox) {
            if (state) {
                this.checkbox.addClass('active');
            } else {
                this.checkbox.removeClass('active');
            }
        }
    }

    // 绘制当前节点
    // container：容器（
    // rootLevel：层级=rootLevel的节点放在容器里，其他节点放在父节点的ul中
    this.draw = function (container, rootLevel) {
        var that = this;

        // 画一个div
        var div = $("<div class='node'></div>");

        // 为div设置class和属性
        div.addClass('level' + that.level);
        div.attr('level', that.level);
        div.attr('nodeId', that.nodeId);

        // 首元素标识
        if (that.parent && that.nodeId == that.parent.children[0].nodeId) {
            div.addClass('first');
        }

        // 画checkbox
        var checkbox = $("<cite></cite>");
        checkbox.attr('nodeId', that.nodeId);

        // 在div中添加复选框，以及节点名字
        div.append(checkbox);
        div.append(that.nodeName);

        // 设置checkbox的选中状态
        if (that.checked) {
            checkbox.addClass('active');
        }

        // 画一个ul
        var ul = $("<ul></ul>");

        if (that.level <= rootLevel) {
            // 画在container容器中
            $(container).append(div);
            $(container).append(ul);

        } else {

            var li = $("<li></li>");
            li.append(div);
            li.append(ul);

            // 放在父节点的ul里
            that.parent.ul.append(li);

        }

        // 保存元素的索引
        that.div = div;
        that.ul = ul;
        that.checkbox = checkbox;

        // 绘制子节点
        for (var i = 0; i < that.children.length; i++) {
            that.children[i].draw(container);
        }
    }
}



function get1() {
    var obj = JSON.parse('{"Models":[{"RoleId":"1d22f56b0312638A27bc86aa","InstitutionId":null,"RoleName":"设备能源-管理员","RoleCode":null,"ParentRole":null,"DictionaryId":null,"RoleLevel":null,"RoleType":null,"BusinessSort":null,"DescriptionInfo":null,"LastmodifyTime":"2016-11-30 19:48:45","EnableSign":1,"EnableStatus":1},{"RoleId":"1d22f56bcb411a2A27bc86aa","InstitutionId":null,"RoleName":"计控车间-管理员","RoleCode":null,"ParentRole":null,"DictionaryId":null,"RoleLevel":null,"RoleType":null,"BusinessSort":null,"DescriptionInfo":null,"LastmodifyTime":"2016-11-30 19:48:35","EnableSign":1,"EnableStatus":1},{"RoleId":"1d22f59591ccfdcA27bc86aa","InstitutionId":null,"RoleName":"动力车间-管理员","RoleCode":null,"ParentRole":null,"DictionaryId":null,"RoleLevel":null,"RoleType":null,"BusinessSort":null,"DescriptionInfo":null,"LastmodifyTime":"2016-11-30 19:48:39","EnableSign":1,"EnableStatus":1},{"RoleId":"1d23fd86fdf2afdA27bc86aa","InstitutionId":null,"RoleName":"冶炼厂部-管理员","RoleCode":null,"ParentRole":null,"DictionaryId":null,"RoleLevel":null,"RoleType":null,"BusinessSort":null,"DescriptionInfo":null,"LastmodifyTime":"2016-11-30 19:49:04","EnableSign":1,"EnableStatus":1},{"RoleId":"1d24077613f1683A27bc86aa","InstitutionId":null,"RoleName":"电解车间-管理员","RoleCode":null,"ParentRole":null,"DictionaryId":null,"RoleLevel":null,"RoleType":null,"BusinessSort":null,"DescriptionInfo":null,"LastmodifyTime":"2016-11-30 19:48:50","EnableSign":1,"EnableStatus":1},{"RoleId":"1d24077613f1683A27bc86ab","InstitutionId":null,"RoleName":"能源系统-管理员","RoleCode":null,"ParentRole":null,"DictionaryId":null,"RoleLevel":null,"RoleType":null,"BusinessSort":null,"DescriptionInfo":null,"LastmodifyTime":"2016-11-30 19:49:49","EnableSign":1,"EnableStatus":1},{"RoleId":"1d25cc62a8ee2f3A27bc86aa","InstitutionId":null,"RoleName":"临时分组","RoleCode":null,"ParentRole":null,"DictionaryId":null,"RoleLevel":null,"RoleType":null,"BusinessSort":null,"DescriptionInfo":null,"LastmodifyTime":"2016-12-23 10:42:13","EnableSign":1,"EnableStatus":1}],"Request":"","Effects":7,"Success":true,"Errors":null,"Total":0}');    
    return obj;
}

function get2() {
    var obj = JSON.parse('{"Models":[{"MenuId":"1d212ec84b350bbA27bc86aa","MenuName":"账号管理","ParentId":"1d212ec50a7b5fcA27bc86aa","ParentName":"账号管理","FeatureId":"1d212e6bd877918A27bc86ad","FeatureAlias":"查询","RoleauthorsId":null,"Active":false,"MenufeatureId":"1d2350b8cdb370cA27bc86ac"},{"MenuId":"1d212ec84b350bbA27bc86aa","MenuName":"账号管理","ParentId":"1d212ec50a7b5fcA27bc86aa","ParentName":"账号管理","FeatureId":"1d212e6bd877918A27bc86aa","FeatureAlias":"添加","RoleauthorsId":null,"Active":false,"MenufeatureId":"1d2350b8cdb370cA27bc86ab"},{"MenuId":"1d212ec84b350bbA27bc86aa","MenuName":"账号管理","ParentId":"1d212ec50a7b5fcA27bc86aa","ParentName":"账号管理","FeatureId":"1d212e6bd877918A27bc86ab","FeatureAlias":"删除","RoleauthorsId":null,"Active":false,"MenufeatureId":"1d2350b8cdb370cA27bc86ae"},{"MenuId":"1d212ec84b350bbA27bc86aa","MenuName":"账号管理","ParentId":"1d212ec50a7b5fcA27bc86aa","ParentName":"账号管理","FeatureId":"1d212e6bd877918A27bc86ac","FeatureAlias":"修改","RoleauthorsId":null,"Active":false,"MenufeatureId":"1d2350b8cdb370cA27bc86aa"},{"MenuId":"1d212ec84b350bbA27bc86aa","MenuName":"账号管理","ParentId":"1d212ec50a7b5fcA27bc86aa","ParentName":"账号管理","FeatureId":"1d212e6bd877918A27bc86ae","FeatureAlias":"重置密码","RoleauthorsId":null,"Active":false,"MenufeatureId":"1d2350b8cdb370cA27bc86ad"},{"MenuId":"1d212ecced5c114A27bc86aa","MenuName":"部门管理","ParentId":"1d212ec50a7b5fcA27bc86aa","ParentName":"账号管理","FeatureId":"1d212e6bd877918A27bc86ab","FeatureAlias":"删除","RoleauthorsId":null,"Active":false,"MenufeatureId":"1d2350b8b08b61aA27bc86ae"},{"MenuId":"1d212ecced5c114A27bc86aa","MenuName":"部门管理","ParentId":"1d212ec50a7b5fcA27bc86aa","ParentName":"账号管理","FeatureId":"1d212e6bd877918A27bc86ac","FeatureAlias":"修改","RoleauthorsId":null,"Active":false,"MenufeatureId":"1d2350b8b08b61aA27bc86ad"},{"MenuId":"1d212ecced5c114A27bc86aa","MenuName":"部门管理","ParentId":"1d212ec50a7b5fcA27bc86aa","ParentName":"账号管理","FeatureId":"1d212e6bd877918A27bc86aa","FeatureAlias":"添加","RoleauthorsId":null,"Active":false,"MenufeatureId":"1d2350b8b08b61aA27bc86aa"},{"MenuId":"1d212ecced5c114A27bc86aa","MenuName":"部门管理","ParentId":"1d212ec50a7b5fcA27bc86aa","ParentName":"账号管理","FeatureId":"1d212e6bd877918A27bc86ad","FeatureAlias":"查询","RoleauthorsId":null,"Active":false,"MenufeatureId":"1d2350b8b08b61aA27bc86ac"},{"MenuId":"1d2130066b9f1aeA27bc86aa","MenuName":"计量器具管理","ParentId":"1d212ef551b626fA27bc86aa","ParentName":"计量器具","FeatureId":"1d212e6bd877918A27bc86ad","FeatureAlias":"查询","RoleauthorsId":null,"Active":false,"MenufeatureId":"1d2350b1d16f9caA27bc86ae"}],"Request":"?RoleId=1d22f56b0312638A27bc86aa","Effects":393,"Success":true,"Errors":null,"Total":393}');
    return obj;
}

function get3() {
    var obj = JSON.parse('{"Models":[{"MenuId":"1d2592b3cf8bf67A27bc86aa","MenuName":"统计单元查询","ParentId":"1d212fdbb5d1c2bA27bc86aa","MenuLevel":2},{"MenuId":"1d28800d93db7e1A27bc86aa","MenuName":"能耗分析","ParentId":"1d258eedb810cc2A27bc86aa","MenuLevel":2},{"MenuId":"1d288fb6bcea21aA27bc86aa","MenuName":"绩效分析","ParentId":"1d258ef93503699A27bc86aa","MenuLevel":2},{"MenuId":"1d28b197399ad28A27bc86aa","MenuName":"能源生产","ParentId":"1d258efad458ebdA27bc86aa","MenuLevel":2},{"MenuId":"1d28caafa704eacA27bc86aa","MenuName":"首页","ParentId":"root","MenuLevel":1},{"MenuId":"1d2989a8a0cde41A27bc86aa","MenuName":"能源成本","ParentId":"1d258ef9a1d5d29A27bc86aa","MenuLevel":2},{"MenuId":"1d2b8eecc2a4a62A27bc86aa","MenuName":"天然气补录[小时]","ParentId":"1d255def3a19b49A27bc86aa","MenuLevel":3},{"MenuId":"1d21266567e9f19A27bc86aa","MenuName":"菜单管理","ParentId":"1d212651c2676ecA27bc86aa","MenuLevel":2},{"MenuId":"1d212ec84b350bbA27bc86aa","MenuName":"账号管理","ParentId":"1d212ec50a7b5fcA27bc86aa","MenuLevel":3},{"MenuId":"1d212ed1b59acd5A27bc86aa","MenuName":"菜单权限分组","ParentId":"1d212ecef509278A27bc86aa","MenuLevel":3},{"MenuId":"1d212ed8ccca24cA27bc86aa","MenuName":"操作日志","ParentId":"1d212ed520f06baA27bc86aa","MenuLevel":3},{"MenuId":"1d212ee5f78a0dcA27bc86aa","MenuName":"基础单位","ParentId":"1d212ee4695722dA27bc86aa","MenuLevel":2},{"MenuId":"1d212eea806b0dfA27bc86aa","MenuName":"单位类型","ParentId":"1d212ee5f78a0dcA27bc86aa","MenuLevel":3},{"MenuId":"1d212eefb4c8339A27bc86aa","MenuName":"能源工厂","ParentId":"1d212eed0dfef18A27bc86aa","MenuLevel":2},{"MenuId":"1d212ef551b626fA27bc86aa","MenuName":"计量器具","ParentId":"1d28cab40eaf66eA27bc86aa","MenuLevel":2},{"MenuId":"1d212ef8df77232A27bc86aa","MenuName":"数据源管理","ParentId":"1d28cabcd8ca50bA27bc86aa","MenuLevel":2},{"MenuId":"1d21300118ffee4A27bc86aa","MenuName":"能源工厂模型","ParentId":"1d212eefb4c8339A27bc86aa","MenuLevel":3},{"MenuId":"1d213005b569d3cA27bc86aa","MenuName":"排班信息","ParentId":"1d212ef2c626bd3A27bc86aa","MenuLevel":3},{"MenuId":"1d2130066b9f1aeA27bc86aa","MenuName":"计量器具管理","ParentId":"1d212ef551b626fA27bc86aa","MenuLevel":3},{"MenuId":"1d2130080d2a1a1A27bc86aa","MenuName":"数据源管理","ParentId":"1d212ef8df77232A27bc86aa","MenuLevel":3},{"MenuId":"1d213008905086eA27bc86aa","MenuName":"采集点","ParentId":"1d212efa0a743f9A27bc86aa","MenuLevel":3},{"MenuId":"1d214ac57503401A27bc86aa","MenuName":"排放基础数据","ParentId":"1d214ac4c2bf1fbA27bc86aa","MenuLevel":3},{"MenuId":"1d22462f88d1947A27bc86aa","MenuName":"数据权限管理","ParentId":"1d22462b874a745A27bc86aa","MenuLevel":3},{"MenuId":"1d22dc70b47272fA27bc86aa","MenuName":"统计班次查询","ParentId":"1d2592b491c2bdaA27bc86aa","MenuLevel":3},{"MenuId":"1d24076fd4d782cA27bc86aa","MenuName":"电解月度统计","ParentId":"1d25951680bea0018d5d42b1","MenuLevel":3},{"MenuId":"1d24f6c83fdebf3A27bc86aa","MenuName":"能耗分析内容","ParentId":"1d24f6c51c4fa77A27bc86aa","MenuLevel":3},{"MenuId":"1d2512e94fd87c3A27bc86aa","MenuName":"通用折线","ParentId":"1d212fdbb5d1c2bA27bc86aa","MenuLevel":2},{"MenuId":"1d2512eae92fdbfA27bc86aa","MenuName":"通用折线模板","ParentId":"1d2512e94fd87c3A27bc86aa","MenuLevel":3},{"MenuId":"1d2550e65e3d83cA27bc86aa","MenuName":"全厂概览","ParentId":"1d2541f2aa2f166A27bc86aa","MenuLevel":3},{"MenuId":"1d256cde576aa06A27bc86aa","MenuName":"折标单元","ParentId":"1d25115f4016c32A27bc86aa","MenuLevel":3},{"MenuId":"1d2579b6c68cc56A27bc86aa","MenuName":"价格单元","ParentId":"1d2511849b8516bA27bc86aa","MenuLevel":3},{"MenuId":"1d25807dae1b921A27bc86aa","MenuName":"产品种类","ParentId":"1d25807d40bc292A27bc86aa","MenuLevel":3},{"MenuId":"1d258eedb810cc2A27bc86aa","MenuName":"能耗分析","ParentId":"root","MenuLevel":1},{"MenuId":"1d2592a6b431304A27bc86aa","MenuName":"天然气补录[日]","ParentId":"1d255def3a19b49A27bc86aa","MenuLevel":3},{"MenuId":"1d2592bcf4a9491A27bc86aa","MenuName":"监控页面管理","ParentId":"1d2592bb9341966A27bc86aa","MenuLevel":3},{"MenuId":"1d2592bdf159119A27bc86aa","MenuName":"图表名称","ParentId":"1d2592bc79c3078A27bc86aa","MenuLevel":3},{"MenuId":"1d25951680bea0018d5d42ab","MenuName":"贵溪冶炼厂","ParentId":"1d258efa13660e0A27bc86aa","MenuLevel":2},{"MenuId":"1d25d8894bf73fcA27bc86aa","MenuName":"能源实时监控","ParentId":"1d25d88875e380aA27bc86aa","MenuLevel":3},{"MenuId":"1d25d8a8346ed10A27bc86aa","MenuName":"绩效指标","ParentId":"1d25d8a69c42018A27bc86aa","MenuLevel":3},{"MenuId":"1d25d8acdd64049A27bc86aa","MenuName":"产品计划[日]","ParentId":"1d25d8ab7403313A27bc86aa","MenuLevel":3},{"MenuId":"1d25d8b001dd768A27bc86aa","MenuName":"天然气计划[日]","ParentId":"1d25d8ae07ffaa4A27bc86aa","MenuLevel":3},{"MenuId":"1d2673edcb55cfcA27bc86aa","MenuName":"文档权限分组","ParentId":"1d2673ec551aab5A27bc86aa","MenuLevel":3},{"MenuId":"1d26a40388bc659A27bc86aa","MenuName":"生产日报表","ParentId":"1d25951680bea0018d5d42ab","MenuLevel":3},{"MenuId":"1d288010b3a5e47A27bc86aa","MenuName":"能耗分析","ParentId":"1d28800d93db7e1A27bc86aa","MenuLevel":3},{"MenuId":"1d288fb7f259edbA27bc86aa","MenuName":"绩效分析","ParentId":"1d288fb6bcea21aA27bc86aa","MenuLevel":3},{"MenuId":"1d28b16b7cf913aA27bc86aa","MenuName":"首页","ParentId":"1d28b1671b77435A27bc86aa","MenuLevel":3},{"MenuId":"1d28b197fa06031A27bc86aa","MenuName":"能源生产","ParentId":"1d28b197399ad28A27bc86aa","MenuLevel":3},{"MenuId":"1d28cab04e69628A27bc86aa","MenuName":"首页","ParentId":"1d28caafa704eacA27bc86aa","MenuLevel":2},{"MenuId":"1d28cab173f27b3A27bc86aa","MenuName":"首页","ParentId":"1d28cab04e69628A27bc86aa","MenuLevel":3},{"MenuId":"1d292ff4c60bc14A27bc86aa","MenuName":"报警配置","ParentId":"1d292ff35a713d7A27bc86aa","MenuLevel":3},{"MenuId":"1d2989aa27d0bdaA27bc86aa","MenuName":"能源成本","ParentId":"1d2989a8a0cde41A27bc86aa","MenuLevel":3},{"MenuId":"1d29978a55336d6A27bc86aa","MenuName":"天然气预测","ParentId":"1d299789ae09a5aA27bc86aa","MenuLevel":3},{"MenuId":"1d29978d277a86eA27bc86aa","MenuName":"电力调度","ParentId":"1d29978c8dc8124A27bc86aa","MenuLevel":3},{"MenuId":"1d29ca96087f099A27bc86aa","MenuName":"能源介质","ParentId":"1d25115a2321cebA27bc86aa","MenuLevel":3},{"MenuId":"1d29ca9ce6282beA27bc86aa","MenuName":"文档管理","ParentId":"1d29ca9be2374a2A27bc86aa","MenuLevel":3},{"MenuId":"1d29caa2802f470A27bc86aa","MenuName":"分析录入[日]","ParentId":"1d29caa143f0477A27bc86aa","MenuLevel":3},{"MenuId":"1d2a14b571db7e2A27bc86aa","MenuName":"消息详情","ParentId":"1d29643bf76008eA27bc86aa","MenuLevel":3},{"MenuId":"1d2a2d41aa01743A27bc86aa","MenuName":"绩效报警单元","ParentId":"1d2a2d40458fc0eA27bc86aa","MenuLevel":3},{"MenuId":"1d21266abdc5aa9A27bc86aa","MenuName":"菜单管理","ParentId":"1d21266567e9f19A27bc86aa","MenuLevel":3},{"MenuId":"1d212ec50a7b5fcA27bc86aa","MenuName":"账号管理","ParentId":"1d212651c2676ecA27bc86aa","MenuLevel":2},{"MenuId":"1d212ecced5c114A27bc86aa","MenuName":"部门管理","ParentId":"1d212ec50a7b5fcA27bc86aa","MenuLevel":3},{"MenuId":"1d212ed9c4b0378A27bc86aa","MenuName":"接口日志","ParentId":"1d212ed520f06baA27bc86aa","MenuLevel":3},{"MenuId":"1d212eebc3affddA27bc86aa","MenuName":"单位管理","ParentId":"1d212ee5f78a0dcA27bc86aa","MenuLevel":3},{"MenuId":"1d212efa0a743f9A27bc86aa","MenuName":"采集点管理","ParentId":"1d28cabcd8ca50bA27bc86aa","MenuLevel":2},{"MenuId":"1d214ac66532335A27bc86aa","MenuName":"碳排放分析","ParentId":"1d214ac4c2bf1fbA27bc86aa","MenuLevel":3},{"MenuId":"1d224630d54b0bcA27bc86aa","MenuName":"数据权限配置","ParentId":"1d22462b874a745A27bc86aa","MenuLevel":3},{"MenuId":"1d22fef94757880A27bc86aa","MenuName":"菜单权限配置","ParentId":"1d212ecef509278A27bc86aa","MenuLevel":3},{"MenuId":"1d24076135df40aA27bc86aa","MenuName":"1#总降月统计","ParentId":"1d25951680bea0018d5d42ac","MenuLevel":3},{"MenuId":"1d25115a2321cebA27bc86aa","MenuName":"能源种类","ParentId":"1d212ee4695722dA27bc86aa","MenuLevel":2},{"MenuId":"1d2511d2796ebaaA27bc86aa","MenuName":"天然气结算","ParentId":"1d25951680bea0018d5d42ab","MenuLevel":3},{"MenuId":"1d2541f2aa2f166A27bc86aa","MenuName":"用能概览","ParentId":"1d212fdbb5d1c2bA27bc86aa","MenuLevel":2},{"MenuId":"1d2541f3985f52fA27bc86aa","MenuName":"用能概览-样板1","ParentId":"1d2541f2aa2f166A27bc86aa","MenuLevel":3},{"MenuId":"1d25453d475abebA27bc86aa","MenuName":"折线多选样板","ParentId":"1d2512e94fd87c3A27bc86aa","MenuLevel":3},{"MenuId":"1d2585c0ee83e5bA27bc86aa","MenuName":"折标系数","ParentId":"1d25115f4016c32A27bc86aa","MenuLevel":3},{"MenuId":"1d258ef93503699A27bc86aa","MenuName":"绩效分析","ParentId":"root","MenuLevel":1},{"MenuId":"1d258f15b45e694A27bc86aa","MenuName":"价格单价","ParentId":"1d2511849b8516bA27bc86aa","MenuLevel":3},{"MenuId":"1d2592be642ab39A27bc86aa","MenuName":"图表配置","ParentId":"1d2592bc79c3078A27bc86aa","MenuLevel":3},{"MenuId":"1d25951680bea0018d5d42ac","MenuName":"动力车间","ParentId":"1d258efa13660e0A27bc86aa","MenuLevel":2},{"MenuId":"1d25d8a8bf0c2e5A27bc86aa","MenuName":"绩效目标","ParentId":"1d25d8a69c42018A27bc86aa","MenuLevel":3},{"MenuId":"1d25d8ad6d242c2A27bc86aa","MenuName":"产品计划[月]","ParentId":"1d25d8ab7403313A27bc86aa","MenuLevel":3},{"MenuId":"1d25d8b0892d9edA27bc86aa","MenuName":"天然气计划[月]","ParentId":"1d25d8ae07ffaa4A27bc86aa","MenuLevel":3},{"MenuId":"1d2673ee8894f12A27bc86aa","MenuName":"文档权限配置","ParentId":"1d2673ec551aab5A27bc86aa","MenuLevel":3},{"MenuId":"1d28698b51797c1A27bc86aa","MenuName":"能源单元管理","ParentId":"1d2592b37fab8ccA27bc86aa","MenuLevel":3},{"MenuId":"1d28c0e0302374dA27bc86aa","MenuName":"计量器具检定","ParentId":"1d212ef551b626fA27bc86aa","MenuLevel":3},{"MenuId":"1d29643d36cd656A27bc86aa","MenuName":"消息配置","ParentId":"1d29643bf76008eA27bc86aa","MenuLevel":3},{"MenuId":"1d29ca9d5507a3bA27bc86aa","MenuName":"目录管理","ParentId":"1d29ca9be2374a2A27bc86aa","MenuLevel":3},{"MenuId":"1d29caa2b7294ccA27bc86aa","MenuName":"分析录入[月]","ParentId":"1d29caa143f0477A27bc86aa","MenuLevel":3},{"MenuId":"1d2a2d41e4cd2aaA27bc86aa","MenuName":"绩效报警参数","ParentId":"1d2a2d40458fc0eA27bc86aa","MenuLevel":3},{"MenuId":"1d212ecef509278A27bc86aa","MenuName":"菜单权限","ParentId":"1d212651c2676ecA27bc86aa","MenuLevel":2},{"MenuId":"1d212edaccf1c25A27bc86aa","MenuName":"错误日志","ParentId":"1d212ed520f06baA27bc86aa","MenuLevel":3},{"MenuId":"1d214ac1344228cA27bc86aa","MenuName":"能耗追踪","ParentId":"1d212fdbb5d1c2bA27bc86aa","MenuLevel":2},{"MenuId":"1d228e8a3992e5cA27bc86aa","MenuName":"部门介质","ParentId":"1d212eefb4c8339A27bc86aa","MenuLevel":3},{"MenuId":"1d22d0b515dbd65A27bc86aa","MenuName":"天","ParentId":"1d2592b438a1dbdA27bc86aa","MenuLevel":3},{"MenuId":"1d22db9bd126be3A27bc86aa","MenuName":"天","ParentId":"1d2592b3cf8bf67A27bc86aa","MenuLevel":3},{"MenuId":"1d22de46030c364A27bc86aa","MenuName":"日","ParentId":"1d214ac1344228cA27bc86aa","MenuLevel":3},{"MenuId":"1d22de8bc7b7eb3A27bc86aa","MenuName":"天","ParentId":"1d22de898ae0623A27bc86aa","MenuLevel":3},{"MenuId":"1d240761670c46aA27bc86aa","MenuName":"2#总降月统计","ParentId":"1d25951680bea0018d5d42ac","MenuLevel":3},{"MenuId":"1d24b024504173cA27bc86aa","MenuName":"天然气结算（详细）","ParentId":"1d25951680bea0018d5d42ab","MenuLevel":3},{"MenuId":"1d254723b527c84A27bc86aa","MenuName":"折线单选样板","ParentId":"1d2512e94fd87c3A27bc86aa","MenuLevel":3},{"MenuId":"1d256806c5eca75A27bc86aa","MenuName":"用能概览-样板2","ParentId":"1d2541f2aa2f166A27bc86aa","MenuLevel":3},{"MenuId":"1d25807d40bc292A27bc86aa","MenuName":"产品种类","ParentId":"1d212ee4695722dA27bc86aa","MenuLevel":2},{"MenuId":"1d258efad458ebdA27bc86aa","MenuName":"能源生产","ParentId":"root","MenuLevel":1},{"MenuId":"1d2592b37fab8ccA27bc86aa","MenuName":"计量单元管理","ParentId":"1d28cabcd8ca50bA27bc86aa","MenuLevel":2},{"MenuId":"1d25d8b11221783A27bc86aa","MenuName":"电力计划[日]","ParentId":"1d25d8ae07ffaa4A27bc86aa","MenuLevel":3},{"MenuId":"1d28b1671b77435A27bc86aa","MenuName":"全厂概览2","ParentId":"1d212fdbb5d1c2bA27bc86aa","MenuLevel":2},{"MenuId":"1d29ca9be2374a2A27bc86aa","MenuName":"标准文档管理","ParentId":"1d2510fa998d2edA27bc86aa","MenuLevel":2},{"MenuId":"1d2c31a73769e79A27bc86aa","MenuName":"流向图名称2.0","ParentId":"1d28e6f2d229db9A27bc86aa","MenuLevel":3},{"MenuId":"1d212ef2c626bd3A27bc86aa","MenuName":"排班信息","ParentId":"1d212eed0dfef18A27bc86aa","MenuLevel":2},{"MenuId":"1d22462b874a745A27bc86aa","MenuName":"数据权限","ParentId":"1d212651c2676ecA27bc86aa","MenuLevel":2},{"MenuId":"1d22d0b5f0e9e7aA27bc86aa","MenuName":"月","ParentId":"1d2592b438a1dbdA27bc86aa","MenuLevel":3},{"MenuId":"1d22de467a5589aA27bc86aa","MenuName":"月","ParentId":"1d214ac1344228cA27bc86aa","MenuLevel":3},{"MenuId":"1d22de898ae0623A27bc86aa","MenuName":"用能分析","ParentId":"1d212fdbb5d1c2bA27bc86aa","MenuLevel":2},{"MenuId":"1d22de8d83d6cc6A27bc86aa","MenuName":"月","ParentId":"1d22de898ae0623A27bc86aa","MenuLevel":3},{"MenuId":"1d25115f4016c32A27bc86aa","MenuName":"能源折标","ParentId":"1d212ee4695722dA27bc86aa","MenuLevel":2},{"MenuId":"1d254e26b0f3be7A27bc86aa","MenuName":"用能概览-样板3","ParentId":"1d2541f2aa2f166A27bc86aa","MenuLevel":3},{"MenuId":"1d256049143a95aA27bc86aa","MenuName":"堆叠折线单选样板","ParentId":"1d2512e94fd87c3A27bc86aa","MenuLevel":3},{"MenuId":"1d25766e5cb7bb5A27bc86aa","MenuName":"电力统计表","ParentId":"1d25951680bea0018d5d42ab","MenuLevel":3},{"MenuId":"1d258ee5c089ba4A27bc86aa","MenuName":"能源监控","ParentId":"root","MenuLevel":1},{"MenuId":"1d25d8b344d2a7fA27bc86aa","MenuName":"电力计划[月]","ParentId":"1d25d8ae07ffaa4A27bc86aa","MenuLevel":3},{"MenuId":"1d287eff404d55bA27bc86aa","MenuName":"平衡单元管理","ParentId":"1d2592b37fab8ccA27bc86aa","MenuLevel":3},{"MenuId":"1d2c31a7fadc0fbA27bc86aa","MenuName":"流向图配置2.0","ParentId":"1d28e6f2d229db9A27bc86aa","MenuLevel":3},{"MenuId":"1d2511849b8516bA27bc86aa","MenuName":"能源成本","ParentId":"1d212ee4695722dA27bc86aa","MenuLevel":2},{"MenuId":"1d25681a04eee15A27bc86aa","MenuName":"弹出window","ParentId":"1d2512e94fd87c3A27bc86aa","MenuLevel":3},{"MenuId":"1d2576710c0459fA27bc86aa","MenuName":"电力统计（各车间）","ParentId":"1d25951680bea0018d5d42ab","MenuLevel":3},{"MenuId":"1d2582a825fcd41A27bc86aa","MenuName":"总降调度","ParentId":"1d2541f2aa2f166A27bc86aa","MenuLevel":3},{"MenuId":"1d258efa13660e0A27bc86aa","MenuName":"能源报表","ParentId":"root","MenuLevel":1},{"MenuId":"1d2592b438a1dbdA27bc86aa","MenuName":"统计模型查询","ParentId":"1d212fdbb5d1c2bA27bc86aa","MenuLevel":2},{"MenuId":"1d2673ec551aab5A27bc86aa","MenuName":"文档权限","ParentId":"1d212651c2676ecA27bc86aa","MenuLevel":2},{"MenuId":"1d287f3fbe7c066A27bc86aa","MenuName":"绩效计算","ParentId":"1d2592b37fab8ccA27bc86aa","MenuLevel":3},{"MenuId":"1d2b8eede0e3b26A27bc86aa","MenuName":"电力补录[小时]","ParentId":"1d255def3a19b49A27bc86aa","MenuLevel":3},{"MenuId":"1d212ed520f06baA27bc86aa","MenuName":"日志查询","ParentId":"1d212651c2676ecA27bc86aa","MenuLevel":2},{"MenuId":"1d214ac4c2bf1fbA27bc86aa","MenuName":"碳排放","ParentId":"1d212fdbb5d1c2bA27bc86aa","MenuLevel":2},{"MenuId":"1d22d0b82341a83A27bc86aa","MenuName":"年","ParentId":"1d2592b438a1dbdA27bc86aa","MenuLevel":3},{"MenuId":"1d22de47c4072d2A27bc86aa","MenuName":"年","ParentId":"1d214ac1344228cA27bc86aa","MenuLevel":3},{"MenuId":"1d22de8e847b1d4A27bc86aa","MenuName":"年","ParentId":"1d22de898ae0623A27bc86aa","MenuLevel":3},{"MenuId":"1d255df1bc667d5A27bc86aa","MenuName":"电力补录[日]","ParentId":"1d255def3a19b49A27bc86aa","MenuLevel":3},{"MenuId":"1d2592b491c2bdaA27bc86aa","MenuName":"统计班次查询","ParentId":"1d212fdbb5d1c2bA27bc86aa","MenuLevel":2},{"MenuId":"1d28e46aab43b99A27bc86aa","MenuName":"成本计算","ParentId":"1d2592b37fab8ccA27bc86aa","MenuLevel":3},{"MenuId":"1d24f6c51c4fa77A27bc86aa","MenuName":"能耗分析","ParentId":"1d212fdbb5d1c2bA27bc86aa","MenuLevel":2},{"MenuId":"1d25951680bea0018d5d42b1","MenuName":"电解车间","ParentId":"1d258efa13660e0A27bc86aa","MenuLevel":2},{"MenuId":"1d28e46bbad5344A27bc86aa","MenuName":"折标计算","ParentId":"1d2592b37fab8ccA27bc86aa","MenuLevel":3},{"MenuId":"1d2bdacef5fa353A27bc86aa","MenuName":"净化水补录[小时]","ParentId":"1d255def3a19b49A27bc86aa","MenuLevel":3},{"MenuId":"1d2a142dd6c87a1A27bc86aa","MenuName":"能耗预测","ParentId":"1d2592b37fab8ccA27bc86aa","MenuLevel":3},{"MenuId":"1d2bdad06a1a966A27bc86aa","MenuName":"净化水补录[日]","ParentId":"1d255def3a19b49A27bc86aa","MenuLevel":3},{"MenuId":"1d287634178dfbaA27bc86aa","MenuName":"产品单元管理","ParentId":"1d2592b37fab8ccA27bc86aa","MenuLevel":3},{"MenuId":"1d2bdad75052dd1A27bc86aa","MenuName":"蒸汽补录[小时]","ParentId":"1d255def3a19b49A27bc86aa","MenuLevel":3},{"MenuId":"1d258ef9a1d5d29A27bc86aa","MenuName":"能源成本","ParentId":"root","MenuLevel":1},{"MenuId":"1d2a3a016db5b50A27bc86aa","MenuName":"产品同步配置","ParentId":"1d2592b37fab8ccA27bc86aa","MenuLevel":3},{"MenuId":"1d2bdad81bd2addA27bc86aa","MenuName":"蒸汽补录[日]","ParentId":"1d255def3a19b49A27bc86aa","MenuLevel":3},{"MenuId":"1d245304815bbe5A27bc86aa","MenuName":"1#总降日统计","ParentId":"1d25951680bea0018d5d42ac","MenuLevel":3},{"MenuId":"1d2510fa998d2edA27bc86aa","MenuName":"文档管理","ParentId":"root","MenuLevel":1},{"MenuId":"1d2a3a027aca3bbA27bc86aa","MenuName":"生产数据编码","ParentId":"1d2592b37fab8ccA27bc86aa","MenuLevel":3},{"MenuId":"1d2bdad9c5e317cA27bc86aa","MenuName":"氧气补录[小时]","ParentId":"1d255def3a19b49A27bc86aa","MenuLevel":3},{"MenuId":"1d245305ff964a5A27bc86aa","MenuName":"2#总降日统计","ParentId":"1d25951680bea0018d5d42ac","MenuLevel":3},{"MenuId":"1d2bdada6a05f55A27bc86aa","MenuName":"氧气补录[日]","ParentId":"1d255def3a19b49A27bc86aa","MenuLevel":3},{"MenuId":"1d2515905667158A27bc86aa","MenuName":"电力月度统计","ParentId":"1d25951680bea0018d5d42ac","MenuLevel":3},{"MenuId":"1d2592bc79c3078A27bc86aa","MenuName":"图表配置","ParentId":"1d212fdbb5d1c2bA27bc86aa","MenuLevel":2},{"MenuId":"1d212ee4695722dA27bc86aa","MenuName":"基础数据","ParentId":"root","MenuLevel":1},{"MenuId":"1d255def3a19b49A27bc86aa","MenuName":"数据补录","ParentId":"1d28cad858fb21eA27bc86aa","MenuLevel":2},{"MenuId":"1d25d8a69c42018A27bc86aa","MenuName":"绩效指标","ParentId":"1d212eed0dfef18A27bc86aa","MenuLevel":2},{"MenuId":"1d299789ae09a5aA27bc86aa","MenuName":"天然气预测","ParentId":"1d212fdbb5d1c2bA27bc86aa","MenuLevel":2},{"MenuId":"1d25d8ab7403313A27bc86aa","MenuName":"生产计划","ParentId":"1d28cad858fb21eA27bc86aa","MenuLevel":2},{"MenuId":"1d29978c8dc8124A27bc86aa","MenuName":"电力调度","ParentId":"1d212fdbb5d1c2bA27bc86aa","MenuLevel":2},{"MenuId":"1d212eed0dfef18A27bc86aa","MenuName":"能源工厂","ParentId":"root","MenuLevel":1},{"MenuId":"1d25d8ae07ffaa4A27bc86aa","MenuName":"用能计划","ParentId":"1d28cad858fb21eA27bc86aa","MenuLevel":2},{"MenuId":"1d292ff35a713d7A27bc86aa","MenuName":"能源报警","ParentId":"1d212eed0dfef18A27bc86aa","MenuLevel":2},{"MenuId":"1d29caa143f0477A27bc86aa","MenuName":"数据分析录入","ParentId":"1d212fdbb5d1c2bA27bc86aa","MenuLevel":2},{"MenuId":"1d29643bf76008eA27bc86aa","MenuName":"消息提示","ParentId":"1d212eed0dfef18A27bc86aa","MenuLevel":2},{"MenuId":"1d2a2d40458fc0eA27bc86aa","MenuName":"绩效报警单元","ParentId":"1d212fdbb5d1c2bA27bc86aa","MenuLevel":2},{"MenuId":"1d28e6f2d229db9A27bc86aa","MenuName":"首页流向图","ParentId":"1d212eed0dfef18A27bc86aa","MenuLevel":2},{"MenuId":"1d2592bb9341966A27bc86aa","MenuName":"监控页面管理","ParentId":"1d212eed0dfef18A27bc86aa","MenuLevel":2},{"MenuId":"1d25d88875e380aA27bc86aa","MenuName":"能源实时监控","ParentId":"1d258ee5c089ba4A27bc86aa","MenuLevel":2},{"MenuId":"1d28cab40eaf66eA27bc86aa","MenuName":"计量器具","ParentId":"root","MenuLevel":1},{"MenuId":"1d28cabcd8ca50bA27bc86aa","MenuName":"采集计量","ParentId":"root","MenuLevel":1},{"MenuId":"1d28cad858fb21eA27bc86aa","MenuName":"人工数据","ParentId":"root","MenuLevel":1},{"MenuId":"1d212fdbb5d1c2bA27bc86aa","MenuName":"其他功能","ParentId":"root","MenuLevel":1},{"MenuId":"1d212651c2676ecA27bc86aa","MenuName":"系统管理","ParentId":"root","MenuLevel":1}],"Request":"","Effects":177,"Success":true,"Errors":null,"Total":177}');
    return obj;
}