

// 读取json文件
d3.json("./data/wordle-info.json", function(keywords){

   //设定一个线性非连贯比例尺来进行给不同大小的词赋颜色.
   var color = d3.scale.linear()
            .domain([0,1,2,3,4,5,6,10,15,20,100])
            .range(["#ddd", "#ccc", "#bbb", "#aaa", "#999", "#888", "#777", "#666", "#555", "#444", "#333", "#222"]); 
    
    d3.layout.cloud().size([800, 300])
            .words(keywords.map(function(d){
                return {text: d.text, size: Math.sqrt(d.size)};
            }))
            // .words([
            //     "Hello", "world", "normally", "you", "want", "more", "words",
            //     "than", "this"].map(function(d) {
            //     return {text: d, size: 10 + Math.random() * 90, test: "haha"}
            // }))
            .rotate(0)
            .fontSize(function(d) { 
                return d.size; 
            })
            .on("end", draw)
            .start();

    function draw(words) {
        // d3.select("#word_cloud")
        d3.select("body").append("svg")//根据id选择父对象插入svg
                .attr("width", "100%")
                .attr("height", "100%")
                .attr("viewBox","0 0 900 400")
                .attr("style", "border: 1px solid black")
                .attr("preserveAspectRatio","xMaxYMax meet")
                .attr("class", "wordcloud")
                .append("g")
                .attr("transform", "translate(400,200)")
                .selectAll("text")
                .data(words)
                .enter().append("text")
                .style("font-size", function(d) { return d.size + "px"; })
                .style("fill", function(d, i) { return color(i); })
                .attr("transform", function(d) {
                    return "translate(" + [d.x, d.y] + ")rotate(" + d.rotate + ")";
                })
                .text(function(d) { return d.text; });
    }

})