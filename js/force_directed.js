let force_width = 1000;
let force_height = 600;

// 数据
let total_links;
let total_nodes;
let links;
let nodes;
let rela_p2a;
let rela_a2p;

// D3变量
let node;
let link;
let node_text;
let force_svg;

let div;
let simulation;

// 展示字体大小
let font_size = 16;
// 节点大小
let circle_size = 10;
// 高亮字体大小：保留
let font_size_highlight = 7;
// 论文节点颜色
let paper_color = "green";
// 作者节点颜色：保留
let author_color = "blue";
// 选定节点颜色
let center_color = "red";
// 图片大小
let image_size = 8;

//拖拽开始绑定的回调函数参数为node节点，首先判断事件是否活动并设置动画的a曲线值。
//这个值是设置动画效果的，然后重新渲染。
//这里fx为当前节点的固定坐标，x为节点的原始坐标。
function dragstarted(d) {
    if (!d3.event.active) simulation.alphaTarget(0.3).restart();
    d.fx = d.x;
    d.fy = d.y;
}
//拖拽中的回调函数，参数还是为node节点，这里不断的更新节点的固定坐标根据鼠标事件的坐标
function dragged(d) {
    d.fx = d3.event.x;
    d.fy = d3.event.y;
}
//拖拽结束回调函数，参数也是node节点，判断事件状态动画系数设置为0结束动画，并设置固定坐标都为null。
function dragended(d) {
    if (!d3.event.active) simulation.alphaTarget(0);
    d.fx = null;
    d.fy = null;
}

function clearFDG(){
    nodes = [];
    links = [];
    links = links.map(d => Object.create(d));
    nodes = nodes.map(d => Object.create(d));

    link = link.data(links);
    link.exit().remove();

    node = node.data(nodes);
    node.exit().remove();
}

// node_name : info['title']
// node_id : "paper" + "-" + year + "-" + str(info['id'])
function click_update(node_name, node_id){
    if (node_id[0] == 'a'){
        return;
    }
    clearFDG();
    nodes = [];
    links = [];
    let author = [];
    for (let i in rela_p2a[node_name]){
        let idx = rela_p2a[node_name][i];
        author.push(total_nodes[idx]);
        nodes.push(total_nodes[idx]);
    }
    for (let i in author){
        let auth = author[i].node_name;
        for (j in rela_a2p[auth]){
            let idx = rela_a2p[auth][j];
            if (nodes.indexOf(total_nodes[idx]) == -1){
                nodes.push(total_nodes[idx]);
            }
            let l = {};
            l['source'] = author[i].node_id;
            l['target'] = total_nodes[idx].node_id;
            links.push(l);
        }
    }

    div.transition()
        .duration(200)
        .style("opacity", 0);

    showForce(-1000, node_id);
}

function simulate(strengh_force){
    simulation = d3.forceSimulation(nodes)
    // 表示link连接时，使用node的id字段
    .force("link", d3.forceLink(links).id(d => d.node_id))
    .force("charge", d3.forceManyBody().strength(strengh_force))
    .force("x", d3.forceX())
    .force("y", d3.forceY())
    .force("center", d3.forceCenter(force_width / 2, force_height / 2));

    simulation.force("link").links(links).distance(100);

    simulation.on("tick", () => {
        link
            .attr("x1", d => d.source.x)
            .attr("y1", d => d.source.y)
            .attr("x2", d => d.target.x)
            .attr("y2", d => d.target.y);
        node
            .attr("cx", d => d.x)
            .attr("cy", d => d.y);
        node.attr("transform", function(d) {
            return "translate(" + d.x + "," + d.y + ")";
        });
        // 更新文字坐标
        node_text
            .transition()
            .duration(1000)
            .attr("cx", function(d) {
                return d.x;
            })
            .attr("cy", function(d) {
                return d.y;
            });
    });
}

function showForce(strengh_force = -10, node_id = ""){
    links = links.map(d => Object.create(d));
    nodes = nodes.map(d => Object.create(d));

    simulate(strengh_force);

    link = link.data(links);
    link.exit().remove();
    var linkEnter = link
        .enter()
        .append("line")
        .attr("class","link")
        .attr("id",function(d,i) {return 'line'+i})
        .attr('marker-end','url(#end)')
        .style("stroke","#ccc")
        .style("pointer-events", "none");
    link = linkEnter.merge(link);

    // remove 
    node = node.data(nodes);
    node.exit().remove();
    var nodeEnter = node.enter()
        .append("g")
        .attr("class","node")
        .on("mouseover", function(d) {
            // 额外增加一个标签
            div.transition()
                .duration(200)
                .style("opacity", .9);
            div.html(() => {
                    if (d.node_id[0] == 'p'){
                        return d.node_name + "<br>year: " + d.node_id.substring(6, 10) + " cite: " + d.node_cite;
                    }else{
                        return d.node_name;
                    }
                })
                .style("left", (d3.event.pageX - 70) + "px")
                .style("top", (d3.event.pageY - 90) + "px");
                // .style("left", (d3.event.pageX + 10) + "px")
                // .style("top", (d3.event.pageY) + "px");

            d3.select(this).select("image").transition()
                .duration(200)
                .attr("x", -2 * image_size)
                .attr("y", -2 * image_size)
                .attr("width", 4 * image_size)
                .attr("height", 4 * image_size); 

            // 将已有的text内容上移
            d3.select(this).select("text")
                .attr("dx", -10)
                .attr("dy",-10)
                .style("fill", "blue")
                .style("stroke", "blue")
                .style("stroke-width", ".5px")
                .style("font-size", font_size_highlight)
                .style("opacity", 0);
                // .style("z-index",999);
        })
        .on("mouseout", function () {
            div.transition()
                .duration(200)
                .style("opacity", 0);

            d3.select(this).select("image").transition()
                .duration(200)
                .attr("x", -image_size)
                .attr("y", -image_size)
                .attr("width", 2 * image_size)
                .attr("height", 2 * image_size); 

            d3.select(this).select("text")
                .attr("dx",5)
                .attr("dy",5)
                .style("fill", "black")
                .style("stroke", null)
                .style("stroke-width", "0px")
                .style("font-size", font_size)
                .style("opacity", 1)
                .style("z-index", null);
        })
        .on("click", function (d){
            click_update(d.node_name, d.node_id);
            updatePaperDetail(d.node_id);
        })
        .call(d3.drag()
                .on("start", dragstarted)
                .on("drag", dragged)
                .on("end", dragended)
        );

    let idx = -1;
    //new 
    node_text = nodeEnter.append("text")
        .style("fill", "black")
        .style("font-size", font_size)
        .attr("dx", 5)
        .attr("dy", 5)
        .text(function(d, i) {
            if (d.node_id === node_id){
                idx = i;
            }
            if (d.node_id[0] === "a") {
                return d.node_name;
            } else{
                return "";
            }
        });

    //add circle
    node_circle = nodeEnter
        .append("circle")
        .transition()
        .duration(100)
        .attr("r", function(d,i){
            if (d.node_id[0] == 'p'){
                return Math.min(2 * circle_size, Math.max(circle_size - 1, Math.sqrt(d.node_cite / 2)));
                // return Math.min(6, Math.max(2, Math.sqrt(d.node_cite / 2)));
            }else{
                return circle_size;
            }
        })
        .style("fill", function(d,i){
            if (i == idx){
                return center_color;
            }
            if (d.node_id[0] == 'p'){
                return paper_color;
            }else{
                return author_color;
            }
        })
        .style("stroke-width","1")
        .style("stroke", function(d,i){
            if (d.node_id[0] == 'p'){
                return paper_color;
            }else{
                return author_color;
            }
        })
        .style("opacity", function(d,i){
            if (d.node_id[0] == 'p'){
                return 1;
            }else{
                return 0;
            }
        });
    
    //add image
    node_image = nodeEnter.append("image")
    .attr("xlink:href", function(d, i) {
        if (d.node_id[0] == 'a') {
            return "./img/people.png";
        } else {
            return null;
        }
    })
    .attr("x", -image_size)
    .attr("y", -image_size)
    .attr("width", 2 * image_size)
    .attr("height", 2 * image_size); 

    if (idx != -1){
        nodes[idx].fx = force_width / 2;
        nodes[idx].fy = force_height / 2;
    }

    node = nodeEnter.merge(node);
}

function FDG_init(){
    div = d3.select("#panel_3").append("div")
        .attr("class", "tooltip")
        .style("opacity", 0);

    // 缩放功能
    force_svg = d3.select("#panel_3").append("div")
        .append("svg")
        .attr("viewBox", [0, 0, force_width, force_height])
        // 设置div的宽和高
        .attr("width", force_width)
        .attr("height", force_height)
        .style("fill","white")
        .call(d3.zoom().scaleExtent([1 / 2, 8]).on("zoom", function () {force_svg.attr("transform", d3.event.transform)})).append("g");
        
    force_svg.append("g").attr("id","link_group");
    force_svg.append("g").attr("id","node_group");

    node = force_svg.select("#node_group").selectAll(".node");
    link = force_svg.select("#link_group").selectAll(".line");
}

// 读取json文件
d3.json("./data/FDG-info.json", function(data){
    total_links = data.links;
    total_nodes = data.nodes;

    // nodes = total_nodes;
    // links = total_links;

    nodes = [{"node_id": "paper-2001-45", "node_name": "Human tracking in multiple cameras", "node_cite": 110}, {"node_id": "author-S. Khan", "node_name": "S. Khan"}];
    links = [{"source": "author-S. Khan", "target": "paper-2001-45"}];

    // console.log(nodes);
    rela_p2a = data.rela_p2a;
    rela_a2p = data.rela_a2p;

    FDG_init();
    showForce();
});