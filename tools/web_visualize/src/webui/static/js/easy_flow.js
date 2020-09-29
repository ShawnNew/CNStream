var chart;
var current_item = 0;

function checkDAG(json) {
    if (json == "false") {
        alert("Json config is invalid\nThe pipeline must be a DAG.")
        return false;
    }
    return true;
}

function showMessage(index){
    var cnodes = document.getElementsByClassName("demo-collapse-item-cnt");
    var otmp = cnodes[current_item].style.opacity;
    cnodes[current_item].style.height = cnodes[index].style.height;
    cnodes[current_item].style.opacity = cnodes[index].style.opacity;
    cnodes[index].style.height = ($("#right").height() - 50 * 4) + "px";
    cnodes[index].style.opacity = otmp;
    var req = document.getElementById("item-" + current_item);
    var res = document.getElementById("item-" + index);
    var qtmp = req.className;
    req.className = res.className;
    res.className = qtmp;
    var json = JSON.stringify(chart.toJson(), null, 4);
    function showJson(callback) {
        callback = callback.replace(/[EIW][0-9]+.*:.*:.*:[0-9]+\]/gi, "")
        let callback_lines = callback.split(/[\n]/)
        if (callback_lines[0] === "Check module config file successfully!") {
            $('#json-output').val(json);
        } else {
            $('#json-output').val("Json config is invalid.\nPlease click 'Check Result' to check.\nAnd modify your configuration.");
        }
    }
    function showCheckJsonResult(callback) {
        callback = callback.replace(/[EIW][0-9]+.*:.*:.*:[0-9]+\]/gi, "")
        let callback_lines = callback.split(/[\n]/)
        document.getElementById("check-result").innerHTML = "";
        callback_lines.forEach(v => {
            document.getElementById("check-result").innerHTML += v + "<br>";
        });
    }
    if (checkDAG(json) == true) {
        if (index == 2) {
            postData("./checkJson", json, showJson, function() { console.log("Check Json error"); }, 'application/json; charset=UTF-8');
        } else if (index == 3) {
            postData("./checkJson", json, showCheckJsonResult, function() { console.log("Check Json error"); }, 'application/json; charset=UTF-8');
        }
    } 
    current_item = index;
};

function showJson() {
    showMessage(2);
}

function showCheckJsonResult() {
    showMessage(3);
}

Chart.ready(() => {
    let start_x = 50;
    let start_y = 20;
    let layout_step = 80;
    let layout_count = 0;

    let current_node_id = null;
    let key_down = false;


    changeName = function() {
        let new_name = $('#txt_' + current_node_id).val();
        $("#" + current_node_id).text(new_name);
        $(this).parent('div').remove();

        let node = chart.changeNodeName(current_node_id, new_name);
        $("#name").val(new_name);
        let node_id = '#' + current_node_id;
        if (chart.getRemovable(current_node_id)) {
            let removeIcon = $('<div>').addClass('remove');
            $(node_id).append(removeIcon);
        }
        UpdateParamInfo();
    }


    onBlurChangeName = function() {
        if (!key_down) {
            changeName();
        }
    }


    onKeyEnterChangeName = function() {
        let e = window.event || arguments[0];
        if (e.keyCode == 13) {
            key_down = true;
            changeName();
        }
    }

    let createChart = function() {
        return new Chart($('#demo-chart'), {
            clickNode(data) {
                if (!data) return;
                showNodeInfo(data);
                current_node_id = data.node_id;
            },
            delNode(data) {
                hideNodeInfo();
                UpdateJson();
            },
            dblClickNode(data) {
                if (!data) return;
                key_down = false;
                current_node_id = data.node_id;
                let org_name = $("#" + data.node_id).text();
                $("#" + data.node_id).text("");
                let input_text = $('<input>').addClass('input_txt')
                    .attr("id", "txt_" + data.node_id)
                    .attr("onBlur", "onBlurChangeName()")
                    .attr('onkeydown', "onKeyEnterChangeName()");
                input_text.val(org_name);
                $("#" + data.node_id).append(input_text);
                $('#txt_' + data.node_id).focus();
            },
            connNode() {
                UpdateJson();
            },
            disconnNode() {
                UpdateJson();
            }
        })
    };


    let createStartNode = function() {
        let start = chart.addNode(MODULES[0].name, start_x, start_y, {
            class: "node-start",
            data: MODULES[0],
            removable: false
        });
        start.addPort({ is_source: true });
        return start
    };


    const addNodeToChart = (name, params) => {
        params = params || {};
        params.data = params.data || {};
        params.class = name;

        let position = getPosition();
        let node = chart.addNode(name, position[0], position[1], params);
        node.addPort({ is_source: true });
        node.addPort({ is_target: true, position: 'Top' });
        UpdateJson();
    };


    let getPosition = function() {
        if (layout_count == 23) { layout_count = 0; }
        layout_count = layout_count + 1;
        return new Array(start_x + layout_step * layout_count / 3.5, start_y + layout_step * (layout_count % 7));
    };


    let showNodeInfo = (data) => {
        if (!data) return;

        $('.module-name')[0].style.display = 'block';
        $('.module-desc')[0].style.display = 'block';
        $('.module-params')[0].style.display = 'block';
        $('.param-desc')[0].style.display = 'block';

        $('.right').find('.module-name').text(data.class_name || '');
        $('.right').find('.module-desc').text(data.desc || '');
        UpdateParamInfo();

        let list_html_params = `<br>`;
        let needed_params = data["name"] == "source" ? ['show_perf_info'] : ['name', 'parallelism', 'max_input_queue_size', 'show_perf_info'];
        needed_params.forEach(v => {
            if (data.hasOwnProperty(v)) {
                list_html_params += `<div class='param-item'>${v}:<input id='${v}' value='${data[v]}'/></div>`;
            }
        });
        list_html_params += `<div class='hidden-custom-btn'>${"custom_params"} 🔽</div><div class='custom-params'>`;
        if (data.hasOwnProperty("custom_params")) {
            $.each(data["custom_params"], function(key, value) {
                list_html_params += `<div class='param-item'>· ${key}:<input id='c_${key}' value='${value}'/></div>`;
            });
        }
        list_html_params += `</div><br><div class='submit-params'>Submit</div>`;

        $('.module-params').html(list_html_params);
        $('.custom-params').toggle();
        $('#name').focus();

        let list_html_param_desc = `<br>`;
        if (PARAM_DESC.hasOwnProperty(data.class_name)) {
            $.each(PARAM_DESC[data.class_name], function(key, value) {
                if (key != "custom_params") {
                  list_html_param_desc += `<div class='param-desc-item'>${key}:<br><a class='desc-val'> ${value}</a></div>`;
                }
            });
            if (PARAM_DESC[data.class_name].hasOwnProperty("custom_params")) {
                list_html_param_desc += `<div class='hidden-custom-desc-btn'>${"custom_params"} 🔽</div><div class='custom-params-desc'>`;
                $.each(PARAM_DESC[data.class_name]["custom_params"], function(key, value) {
                    list_html_param_desc += `<div class='param-desc-item'>· ${key}:<br><a class='desc-val'> ${value}</a></div>`;
                });
            }

        }
        list_html_param_desc += `<br>`
        $('.param-desc').html(list_html_param_desc);
        $('.custom-params-desc').toggle();


        // add event listeners
        $('.hidden-custom-btn')[0].addEventListener('click', () => {
            $('.custom-params').toggle();
        })

        $('.submit-params')[0].addEventListener('click', () => {
            // update node parameters
            needed_params.forEach(v => {
                let str = $('#' + v).val();
                if (v == "show_perf_info" && (str == "true" || str == "false")) {
                    data[v] = Boolean(str == "true");
                } else if (str == "") {
                    data[v] = "";
                } else {
                    var n = Number(str); // return NaN if isnot a Number
                    data[v] = !isNaN(n) ? n : str;
                }
            });
            if (data.hasOwnProperty("custom_params")) {
                $.each(data["custom_params"], function(key, value) {
                    let str = $('#c_' + key).val();
                    if (str == "")
                        data["custom_params"][key] = "";
                    else {
                        var n = Number(str); // return NaN if isnot a Number
                        data["custom_params"][key] = !isNaN(n) ? n : str;
                    }
                });
            }
            // replace module name
            let node_id = '#' + current_node_id;
            $(node_id).text(data.name);
            if (chart.getRemovable(current_node_id)) {
                let removeIcon = $('<div>').addClass('remove');
                $(node_id).append(removeIcon);
            }
        })

        if ($('.hidden-custom-desc-btn')[0] != null) {
            $('.hidden-custom-desc-btn')[0].addEventListener('click', () => {
                $('.custom-params-desc').toggle();
            })
        }
    };


    let hideNodeInfo = () => {
        $('.module-name')[0].style.display = 'none';
        $('.module-desc')[0].style.display = 'none';
        $('.module-params')[0].style.display = 'none';
        $('.param-desc')[0].style.display = 'none';
    };

    downloadFile = function() {
        let elementA = document.createElement('a');
        elementA.setAttribute('href', 'data:text/plain;charset=utf-8,' + JSON.stringify(chart.toJson(), null, 4));
        elementA.setAttribute('download', "config.json");
        elementA.style.display = 'none';
        document.body.appendChild(elementA);
        elementA.click();
        document.body.removeChild(elementA);
    }

    function UpdateParamInfo() {
        if (current_item != 0 && current_item != 1) {
            showMessage(0);
        } else if (current_item == 2) {
            showJson();
        } else if (current_item == 3) {
            showCheckJsonResult();
        } else {
            showMessage(current_item);
        }
    }

    function UpdateJson() {
        if (current_item == 2) {
            showJson();
        }
    }


    const bindEvent = () => {
        $(".pipeline-panel").on('click', '.btn-add', function(event) {
            let target = $(event.target);
            let node = target.data('node');
            addNodeToChart(node.name, {
                data: node
            });
        });

        $(".btn-gen").click(() => {
            showJson();
        });

        $(".btn-save").click(() => {
            showJson();
            downloadFile();
        });

        $(".btn-clear").click(() => {
            $('#demo-chart').remove();
            chart.clear();
            $('<div id="demo-chart"></div>').appendTo($('.middle'));
            chart = createChart();
            start_node = createStartNode();
            hideNodeInfo();
            layout_count = 0;
            UpdateParamInfo();
        });

        $(".btn-return").click(() => {
            window.location.href="/home";
        });

        $(".btn-done").click(() => {
            var json = JSON.stringify(chart.toJson(), null, 4);
            function genDone(callback) {
                callback = callback.replace(/[EIW][0-9]+.*:.*:.*:[0-9]+\]/gi, "")
                let callback_lines = callback.split(/[\n]/)
                if (callback_lines[0] === "Check module config file successfully!") {
                    window.sessionStorage.setItem("designedJson", json);
                    window.location.href="/home";
                } else {
                    showMessage(2);
                    $('#json-output').val("Json config is invalid.\nPlease click 'check' button or 'Check Result' to check.\nAnd modify your configuration.\n\nAnd Try again");
                }
            }
            if (checkDAG(json) == true) {
                postData("./checkJson", json, genDone, function() { console.log("Check Json error"); }, 'application/json; charset=UTF-8');
            }
        });
    };


    // chart begin here
    chart = createChart();
    let start_node = createStartNode();
    bindEvent();

    let list_html_nodes = '';
    MODULES.forEach(node => {
        if (node.name != "source" && node.name != "ipc") {
            list_html_nodes += `<li><button class='btn-add' href='javascript:void(0)'>${node.label}</button></li>`;
        }
    });
    $('.nodes').html(list_html_nodes);
    $('.nodes').find('.btn-add').each(function(index) {
        $(this).data('node', $.extend(true, {}, MODULES[index + 1]));
    });
});