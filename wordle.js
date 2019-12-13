let width = 900;
let height = 600;

let layout;
let wordle_svg;
let word_cloud;

let fill = d3.scale.category20();

let keywords;

// 读取json文件
d3.json("./data/wordle-info.json", function(data){
    keywords = data;

    begin();
});

function wordCloud() {
    //Construct the word cloud's SVG element
    wordle_svg = d3.select("body")
        .append("div")
        .append("svg")
        .attr("viewBox", [0, 0, width, height])
        .attr("width", width)
        .attr("height", height)
        .style("fill","white")
        .call(d3.zoom().scaleExtent([1 / 2, 8]).on("zoom", function () {
            // wordle_svg.attr("transform", d3.event.transform);
            // console.log(d3.event.scale);
            wordle_svg.attr("transform", "translate(" + [d3.event.transform.x + width / 2, d3.event.transform.y + height / 2] + ")");
        }))
        .append("g")
        .attr("id", "wordcloud")
        .attr("transform", "translate(" + [width / 2, height / 2] + ")");

    //Draw the word cloud
    function draw(words) {
        word_cloud = wordle_svg.selectAll("text")
                        .data(words)
                        // .data(words, function(d) { return d.text; })

        //Entering words
        word_cloud.enter()
            .append("text")
            .attr('font-size', 1)
            // .style("font-size", function(d) { return d.size + "px"; })
            // .style("font-family", "Impact")
            .style("fill", function(d, i) { return fill(i); })
            .attr("text-anchor", "middle")
            .text(function(d) { return d.text; });

        //Entering and existing words
        word_cloud
            .transition()
                .duration(600)
                .style("font-size", function(d) { return d.size + "px"; })
                .attr("transform", function(d) {
                    return "translate(" + [d.x, d.y] + ")rotate(" + d.rotate + ")";
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

    //Use the module pattern to encapsulate the visualisation code. We'll
    // expose only the parts that need to be public.
    return {
        //Recompute the word cloud for a new set of words. This method will
        // asycnhronously call draw when the layout has been computed.
        //The outside world will need to call this function, so make it part
        // of the wordCloud return value.
        update: function(words) {
            d3.layout.cloud().size([width, height])
                .words(words.map(function(d){
                    return {text: d.text, size: Math.sqrt(d.size)};
                }))
                .padding(5)
                .rotate(0)
                // .rotate(function() { return ~~(Math.random() * 2) * 90; })
                // .font("Impact")
                .fontSize(function(d) { return d.size; })
                .on("end", draw)
                .start();
        }
    }
}

function begin(){
    //Create a new instance of the word cloud visualisation.
    var myWordCloud = wordCloud();
    myWordCloud.update(keywords);
    myWordCloud.update(keywords);

    // function showNewWords(vis, i) {
    //     i = i || 0;
    
    //     vis.update(keywords);
    //     setTimeout(function() { showNewWords(vis, i + 1)}, 8000);
    // }

    // //Start cycling through the demo data
    // showNewWords(myWordCloud);
}