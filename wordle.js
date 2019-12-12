let width = 900;
let height = 600;

let layout;
let wordle_svg;
let word_cloud;

let fill = d3.scale.category10();

let keywords;

// 读取json文件
d3.json("./data/wordle-info.json", function(data){
   //设定一个线性非连贯比例尺来进行给不同大小的词赋颜色.
    // var color = d3.scale.linear()
    //     .domain([0,1,2,3,4,5,6,10,15,20,100])
    //     // .range(d3.scale.category20());
    //     .range(["#ddd", "#ccc", "#bbb", "#aaa", "#999", "#888", "#777", "#666", "#555", "#444", "#333", "#222"]); 

    keywords = data;

    begin();

});

function begin(){
    layout = d3.layout.cloud()
        .size([width, height])
        .words(keywords.map(function(d){
            return {text: d.text, size: Math.sqrt(d.size)};
        }))
        .padding(5)
        // .rotate(function() { return ~~(Math.random() * 2) * 90; })
        .rotate(0)
        .fontSize(function(d) { 
            return d.size; 
        })
        .on("end", draw);
    
    // 开始画图
    layout.start();
    
    function draw(words) {
        // d3.select("#word_cloud")
        wordle_svg = d3.select("body")
            .append("div")
            .append("svg")//根据id选择父对象插入svg
            .attr("viewBox", [0, 0, width, height])
            .attr("width", width)
            .attr("height", height)
            .style("fill","white")
            .call(d3.zoom().scaleExtent([1 / 2, 8]).on("zoom", function () {wordle_svg.attr("transform", d3.event.transform)}))
            .append("g")
            .attr("class", "wordcloud")
            .attr("transform", "translate(" + [width / 2, height / 2] + ")");
        
        word_cloud = wordle_svg
            .selectAll("text")
            .data(words)

        //Entering words
        word_cloud.enter()
            .append("text")
            .transition()
            .duration(2000)
            .style("font-size", function(d) { return d.size + "px"; })
            // .style("font-size", 1)
            .style("fill", function(d, i) { return fill(i); })
            .attr("text-anchor", "middle")
            .attr("transform", function(d) {
                return "translate(" + [d.x, d.y] + ")rotate(" + d.rotate + ")";
            })
            .text(function(d) { 
                return d.text; 
            });

        //Entering and existing words
        // word_cloud
        //     .transition()
        //         .duration(1000)
        //         .style("font-size", function(d) { return d.size + "px"; })
        //         .attr("transform", function(d) {
        //             return "translate(" + [d.x, d.y] + ")rotate(" + d.rotate + ")";
        //         })
        //         .style("fill-opacity", 1);

        // //Exiting words
        // word_cloud.exit()
        //     .transition()
        //         .duration(2000)
        //         .style('fill-opacity', 1e-6)
        //         .attr('font-size', 1)
        //         .remove();
    }
}

function drawUpdate(words){
    d3.layout.cloud()
        .size([width, height])
        .words(words)
        .padding(5)
        // .rotate(function() { return ~~(Math.random() * 2) * 90; })
        .rotate(0)
        .font("Impact")
        .fontSize(function(d) { return d.size; })
        .start();
 
    d3.select("svg")
        .selectAll("g")
        .attr("transform", "translate(" + [width / 2, height / 2] + ")")
        .selectAll("text")
        .data(words).enter().append("text")
        .transition()
        .duration(2000)
        .style("font-size", function(d) { return d.size + "px"; })
        .style("font-family", "Impact")
        .style("fill", function(d, i) { return fill(i); })
        .attr("transform", function(d) {
            return "translate(" + [d.x, d.y] + ")rotate(" + d.rotate + ")";
        })
        .text(function(d) { return d.text; });
}

function randomWord() {
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

    for( var i=0; i < 5; i++ )
        text += possible.charAt(Math.floor(Math.random() * possible.length));

    return text;
}
function randomWeight(){
  var r = Math.round(Math.random() * 100);
  return r;
}

// setInterval(function () { 
//     // var d_new = data;
//     keywords.push({text:randomWord(),size:randomWeight()});

//     drawUpdate(keywords.map(function(d) {
//         console.log("update");
//         return {text: d.text, size: Math.sqrt(d.size * 2)};
//     }));
// }, 500);