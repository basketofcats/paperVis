let width = 900;
let height = 600;

let layout;
let wordle_svg;
let word_cloud;
let myWordCloud;

let fill = d3.scale.category20();

let keywords;
let keywordsEveryYear;

// 保留词云大小
let min_size = 30;
let max_size = 100;

// 展示关键词个数
let show_size = 50;
let xScale;

function update_XScale(){
    let x_min = 100;
    let x_max = 0;
    keywords.map(function(d){
        x_min = Math.min(x_min, Math.sqrt(d.size));
        x_max = Math.min(x_max, Math.sqrt(d.size));
    })
    xScale = d3.scale.linear()
        .domain([x_min, x_max]) 
        .range([min_size, max_size]); 
}

function begin(){
    //Create a new instance of the word cloud visualisation.
    myWordCloud = wordCloud();
    myWordCloud.update(keywords);
    myWordCloud.update(keywords);
}

// 读取json文件
d3.json("./data/wordle-info.json", function(data){
    keywords = data;
    update_XScale();

    keywordsEveryYear = [];

    begin();

    for (let i = 2001;i <= 2017; i += 2){
        filename = "./data/wordle-info-" + i + ".json";
        d3.json(filename, function(data){
            keywordsEveryYear.push(data);
        })
    }
});

function wordCloud() {
    //Construct the word cloud's SVG element
    wordle_svg = d3.select("body")
        .append("div")
        .append("svg")
        .attr("viewBox", [0, 0, width, height])
        .attr("preserveAspectRatio", "xMidYMid slice")
        .attr("width", width)
        .attr("height", height)
        .style("fill","white")
        .call(d3.zoom().scaleExtent([1 / 2, 8]).on("zoom", function () {
            wordle_svg.attr("transform", d3.event.transform);
        }))
        .append("g")
        .attr("id", "wordcloud")

    //Draw the word cloud
    function draw(words) {
        word_cloud = wordle_svg.selectAll("text")
                        .data(words)

        //Entering words
        word_cloud.enter()
            .append("text")
            .attr('font-size', 1)
            .style("fill", function(d, i) { return fill(i); })
            .attr("text-anchor", "middle")
            .text(function(d) { return d.text; });

        //Entering and existing words
        word_cloud
            .transition()
                .duration(600)
                .style("font-size", function(d) { return d.size + "px"; })
                .attr("transform", function(d) {
                    return "translate(" + [d.x + width / 2, d.y + height / 2] + ")rotate(" + d.rotate + ")";
                })
                .style("fill-opacity", 1);

        //Exiting words
        word_cloud.exit()
            .transition()
                .duration(200)
                .style('fill-opacity', 1e-6)
                .attr('font-size', 1)
                .remove();
    }

    return {
        update: function(words) {
            d3.layout.cloud().size([width, height])
                // .words(words.map(function(d){
                //     return {text: d.text, size: xScale(d.size)};
                // }))
                .words(words.map(function(d){
                    return {text: d.text, size: Math.sqrt(d.size)};
                }))
                .padding(5)
                .rotate(0)
                .fontSize(function(d) { return d.size; })
                .on("end", draw)
                .start();
        }
    }
}

$('.range-slider').jRange({
    from: 2001,
    to: 2017,
    step: 2,
    scale: [2001, 2005, 2009, 2013, 2017],
    format: '%s',
    width: 300,
    showLabels: true,
    isRange : true
});

$("#wordle_button").click(function(){
    var aa = $(".range-slider").val();
    let from = parseInt(aa.substr(0, 4));
    let to = parseInt(aa.substr(5, 9));

    from = (from - 2001) / 2;
    to = (to - 2001) / 2;
    if (from == to){
        keywords = keywordsEveryYear[from];
        myWordCloud.update(keywords);
        return;
    }
    
    keywords = [];
    let total_keywords = {};
    for (let i = from;i <= to;i++){
        keywordsEveryYear[i].map(function(d){
            if (d.text in total_keywords){
                total_keywords[d.text] += d.size;
            }else{
                total_keywords[d.text] = d.size;
            }
        })
    }

    var items = Object.keys(total_keywords).map(function(key) {
        return [key, total_keywords[key]];
    });

    // Sort the array based on the second element
    items.sort(function(first, second) {
        return second[1] - first[1];
    });
    for (let i = 0;i < show_size;i++){
        tmp = {}
        tmp['text'] = items[i][0];
        tmp['size'] = items[i][1];
        keywords.push(tmp);
    }
    update_XScale();
    myWordCloud.update(keywords);
});

