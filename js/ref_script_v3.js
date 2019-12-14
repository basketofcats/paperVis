var paperData = {},
    titleBegin = 1200,  // svg高度
    selectedPaper,      // 当前选择论文
    searchResult,       // 搜索结果
    references,         // 当前选择论文引用论文列表
    citedBy,            // 当前选择论文被引用论文列表
    maxPaperCitations,  // 每年论文中最大被引用量
    maxPaperCitation,   // 所有论文中最大被引用量
    maxPaperCitationOnSelected,
    searchTitleTarget,
    maxPaperCitedAndCitations,
    isShowCitation = -1,   // 显示引用度
    dWidth,
    svgGroup,
    fontSize = 2,
    displayTitleLength = 75 // 论文名显示最大长度
;

function clearSelectedPaper() {
    selectedPaper = null;
    searchResult = null;
    references = [];
    citedBy = [];
    updateText();
}

function showCitation() {
    isShowCitation = -isShowCitation;
    updateText();
}

function getMaxCitations() {
    maxPaperCitations = [];
    maxPaperCitedAndCitations = [];
    maxPaperCitation = 0;
    for (let year = 2001; year < 2019; year += 2) {
        if (!paperData.hasOwnProperty(year.toString()))
            continue;
        let maxCitation = 0;
        for (let i = 0; i < paperData[year].length; i++)
            maxCitation = Math.max(maxCitation, paperData[year][i].cited_count);

        maxPaperCitations.push(maxCitation);
        maxPaperCitation = Math.max(maxPaperCitation, maxCitation);

        let maxCitedAndCitation = 0;
        for (let i = 0; i < paperData[year].length; i++) {
            let sum = paperData[year][i].cited_by.length + paperData[year][i].references.length;
            maxCitedAndCitation = Math.max(maxCitedAndCitation, sum);
        }

        maxPaperCitedAndCitations.push(maxCitedAndCitation);
    }
}

function updateText() {
    referencePaperPos = [];
    citedPaperPos = [];
    let j = 0;
    let obj;
    for (let year = 2001; year < 2019; year++) {
        if (paperData.hasOwnProperty(year.toString())) {
            let xOffset = j;

            let citationScale = d3.scale.linear()
                .domain([0, maxPaperCitations[parseInt((year - 2001) / 2)]])
                .range([0, dWidth - 10]);

            let barId = "#b" + year;
            let currentData = paperData[year];
            svgGroup.select(barId)
                .selectAll("text")
                .data(currentData)
                .transition()
                .duration(500)
                .style("fill", function (d) {
                    if (searchResult) {
                        if (d.isTarget) return 'Black';
                        return 'LightGrey';
                    }
                    if (selectedPaper) {
                        if (d.title === selectedPaper.title) return 'Black';
                        if (citedBy.indexOf(d.id) > -1) return 'ForestGreen';
                        if (references.indexOf(d.id) > -1) return 'DodgerBlue';
                        return 'LightGrey';
                    } else {
                        return 'Black';
                    }
                })
                .text(function (d) {
                    if (d.title.length < displayTitleLength) return d.title;
                    else return d.title.substring(0, displayTitleLength - 3) + '...';
                })
                .attr("transform", function (d, i) {
                    let x = (xOffset + 1) * dWidth - 15 - 30;
                    let y = titleBegin - 0.5 * fontSize - (currentData.length - i) * (fontSize + 0.5);
                    if (selectedPaper) {
                        if (d.title === selectedPaper.title) {
                            selectedPaperPos = {x: x, y: y - fontSize * 0.3};
                        } else if (citedBy.indexOf(d.id) > -1) {
                            obj = {x: x, y: y - fontSize * 0.3};
                            referencePaperPos.push(obj);
                        } else if (references.indexOf(d.id) > -1) {
                            let l = d.title.length;
                            obj = {x: x, y: y - fontSize * 0.3, l: l};
                            citedPaperPos.push(obj);
                        }
                    }
                    return "translate(" + x + "," + y + ")";
                })
            ;
            let rectId = "#r" + year;
            svgGroup.select(rectId)
                .selectAll("rect")
                .data(currentData)
                .transition()
                .duration(500)
                .attr("width", function (d) {
                    if (isShowCitation === 1) {
                        if (selectedPaper) {
                            if (references.indexOf(d.id) > -1 || citedBy.indexOf(d.id) > -1
                                || d.title === selectedPaper.title)
                                return citationScale(d.cited_count);
                            else return 0;
                        } else if (searchResult) {
                            if (d['isTarget'])
                                return citationScale(d.cited_count);
                            return 0;
                        } else
                            return citationScale(d.cited_count);
                    }
                    return 0;
                });
            j++;
        }
    }

    // draw link
    svgGroup.selectAll('.link').remove();

    let tmpList, lineGeneratorBasis;
    for (let i = 0; i < referencePaperPos.length; i++) {
        tmpList = [];
        tmpList.push({x: (selectedPaperPos.x + Math.min(75, selectedPaper.title.length)), y: selectedPaperPos.y});
        tmpList.push({x: (selectedPaperPos.x + Math.min(75, selectedPaper.title.length) + 10), y: selectedPaperPos.y});
        tmpList.push({x: (referencePaperPos[i].x - 10), y: referencePaperPos[i].y});
        tmpList.push(referencePaperPos[i]);

        lineGeneratorBasis = d3.svg.line()
            .x(d => d.x)
            .y(d => d.y)
            .interpolate('basis');

        svgGroup.append('path')
            .attr("class", "link")
            .style("fill", "none")
            .style("stroke", "green")
            .style("stroke-width", 1)
            .style("stroke-opacity", 0.3)
            .attr('d', lineGeneratorBasis(tmpList));
    }

    for (i = 0; i < citedPaperPos.length; i++) {
        tmpList = [];
        tmpList.push({x: (citedPaperPos[i].x + Math.min(75, citedPaperPos[i].l)), y: citedPaperPos[i].y});
        tmpList.push({x: (citedPaperPos[i].x + Math.min(75, citedPaperPos[i].l) + 10), y: citedPaperPos[i].y});
        tmpList.push({x: (selectedPaperPos.x - 10), y: selectedPaperPos.y});
        tmpList.push(selectedPaperPos);

        lineGeneratorBasis = d3.svg.line()
            .x(d => d.x)
            .y(d => d.y)
            .interpolate('basis');

        svgGroup.append('path')
            .attr("class", "link")
            .style("fill", "none")
            .style("stroke", "blue")
            .style("stroke-width", 1)
            .style("stroke-opacity", 0.3)
            .attr('d', lineGeneratorBasis(tmpList));
    }

}

function updatePaperDetails() {

    d3.select("#pDetails").selectAll("div").remove();

    let i;
    let div = d3.select("#pDetails").append("div");
    let span20 = "<span style=\"padding-left:20px\"></span>";
    if (selectedPaper) {
        let abstract = selectedPaper.abstract;

        let authorsList = selectedPaper.authors[0];
        for (i = 1; i < selectedPaper.authors.length; i++)
            authorsList += (span20 + selectedPaper.authors[i]);
        let keywordStringList = selectedPaper.keywords;

        let keywordsList = selectedPaper.keywords[0];
        for (i = 1; i < keywordStringList.length; i++)
            keywordsList += ', ' + keywordStringList[i];

        div.html(
            "<h1>" + (selectedPaper.title) + "</h1>" +
            "<p>" + (authorsList) + "</p>" +
            "<h3> Abstract </h3>" +
            "<p  align=\"left\">" + (abstract) + "</p>" +
            "<p  align=\"left\">" + "Keywords: " + keywordsList + "</p>" +
            "<p  align=\"left\">" + "Year: "+ selectedPaper.year + span20 + "Cited by " + selectedPaper.cited_count + "</p>" +
            "<p  align=\"left\">" + "External Link: " +
            "<a href=\"" + selectedPaper.link + "\">" + selectedPaper.link + "</a></p>"
        );
    } else {
        div.html("<h1>" + "No paper selected" + "</h1>");
    }
}

function yearBar() {
    let axisWidth = 1240;
    let zoomListener = d3.behavior.zoom()
        .center([axisWidth / 2, (titleBegin + 50) / 2])
        .scaleExtent([1, 8]).on("zoom", zoom);

    function zoom() {
        svgGroup.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
    }

    let baseSvg = d3.select("#pView").append("svg")
        .attr("width", axisWidth)
        .attr("height", titleBegin + 50)
        .call(zoomListener);

    svgGroup = baseSvg.append("g");
    let tooltip = d3.select("#pView").append("div")
        .attr("class", "tooltip")
        .style("opacity", 0);

    let length = 0;
    for (let year in paperData) {
        length++;
    }
    dWidth = axisWidth / (length + 1);

    let dateList = [];
    let dateRange = [];
    dateList.push("");
    dateRange.push(0);
    let i = 1;
    for (let year in paperData) {
        if (paperData.hasOwnProperty(year)) {
            dateList.push(year);
            dateRange.push(dWidth * i);
            i++;
        }
    }
    dateList.push("");
    dateRange.push(dWidth * (i + 1));

    let dScale = d3.scale.ordinal()
        .domain(dateList)
        .range(dateRange);
    let dAxis = d3.svg.axis()
        .scale(dScale)
        .orient("bottom")
        .outerTickSize(0);

    svgGroup.append("g")
        .attr("class", "axis")
        .call(dAxis)
        .attr("transform", function () {
            return "translate(-45," + titleBegin + ")"
        });

    let maxHeights = [];
    for (let year in paperData) {
        maxHeights.push(titleBegin);
    }

    let selection, j = 0, highlightPaperIdx = 0, highlightPaperTotal = 0;
    if (selectedPaper) {
        highlightPaperTotal = selectedPaper[0][0].__data__.cited_by.length +
            selectedPaper[0][0].__data__.references.length + 1;
    }

    let yWidth = 470 / 52;
    let yOffset = (titleBegin - yWidth * highlightPaperTotal) * 0.5;
    // let citationScale;

    for (let year = 2001; year < 2019; year += 2) {
        if (!paperData.hasOwnProperty(year.toString()))
            continue;

        let xOffset = j;
        let barId = "b" + year;
        let recId = "r" + year;
        let currentData = paperData[year];

        selection = svgGroup.append("g")
            .attr("id", function () {
                return recId;
            })
            .selectAll("rect")
            .data(currentData);

        selection.enter().append("rect")
            .attr("x", 0)
            .attr("y", 0)
            .attr("width", 0)
            .attr("height", fontSize)
            .attr("transform", function (d, i) {
                return "translate(" + ((xOffset + 1) * dWidth - 15 - 30) + ","
                    + (titleBegin - 1.5 * fontSize + 0.15 - (currentData.length - i) * (fontSize + 0.5)) + ")"
            })
            .attr("fill", "orange");

        selection = svgGroup.append("g")
            .attr("id", function () {
                return barId;
            })
            .selectAll("text")
            .data(currentData);

        selection.enter().append("text")
            .attr("style", "cursor: pointer")
            .text(function (d) {
                if (d.title.length < displayTitleLength)
                    return d.title;
                return d.title.substring(0, displayTitleLength - 3) + "...";
            })
            .style("font-weight", "normal")
            .attr("font-size", function (d) {
                if (selectedPaper && d.title === selectedPaper[0][0].__data__.title)
                    return (fontSize + 1) + "px";
                return fontSize + "px";
            })
            .attr("transform", function (d, i) {
                return "translate(" + ((xOffset + 1) * dWidth - 15 - 30) + ","
                    + (titleBegin - 0.5 * fontSize - (currentData.length - i) * (fontSize + 0.5)) + ")"
            })
            .attr("fill", function (d) {
                if (selectedPaper) {
                    if (d.title === selectedPaper[0][0].__data__.title)
                        return "Black";
                    return "LightGray";
                }
                return "Black";
            })
            .on("click", function () {
                searchResult = null;

                selectedPaper = d3.select(this)[0][0].__data__;
                references = d3.select(this)[0][0].__data__.references;
                citedBy = d3.select(this)[0][0].__data__.cited_by;

                updateText();
                updatePaperDetails();
                d3.event.stopPropagation();
            })
            .on("mouseover", function (d) {
                tooltip.transition()
                    .duration(200)
                    .style("opacity", 0.7);

                let span10 = "<span style=\"padding-left:10px\"></span>";
                let authorsList = "";
                for (let i = 0; i < d.authors.length - 1; i++) {
                    authorsList += d.authors[i] + span10;
                    if ((i + 1) % 3 === 0)
                        authorsList += '<br/>';
                }
                authorsList += d.authors[d.authors.length - 1] + '<br/>';

                let colorText = 'Black';
                if (searchResult) {
                    if (d.isTarget) colorText = 'Black';
                    else colorText = 'DarkGrey';
                } else if (selectedPaper) {
                    if (d.title === selectedPaper.title) colorText = 'Black';
                    else if (citedBy.indexOf(d.id) > -1) colorText = 'ForestGreen';
                    else if (references.indexOf(d.id) > -1) colorText = 'DodgerBlue';
                    else colorText = 'DarkGrey';
                }

                tooltip.html(
                    "<a style=\"font-size:10px; color:" + colorText + "\">" + d.year + "</a><br/>" +
                    "<a style=\"font-size:15px; color:" + colorText + "\">" + (d.title) + "</a><br/>" +
                    "<a style=\"font-size:8px; color:" + colorText + "\">" + authorsList + "</a>")
                    .style("left", (d3.event.pageX) + "px")
                    .style("top", (d3.event.pageY - 28) + "px")
                    .style("background", 'LightGrey')
                ;

            })
            .on("mouseout", function () {
                tooltip.transition()
                    .duration(500)
                    .style("opacity", 0);
            });

        selection.transition()
            .duration(500)
            .style("fill", function (d) {
                if (selectedPaper) {
                    if (d.title === selectedPaper.title) return 'Black';
                    if (references.indexOf(d.id) > -1) return 'OrangeRed';
                    if (citedBy.indexOf(d.id) > -1) return 'DarkGreen';
                    return 'none';
                } else {
                    return 'Black';
                }
            })
            .attr("font-size", function (d) {
                if (selectedPaper) {
                    if (d.title === selectedPaper.title ||
                        references.indexOf(d.id) > -1 ||
                        citedBy.indexOf(d.id) > -1)
                        return (fontSize + 8) + "px";
                    else return fontSize + "px";
                } else {
                    return fontSize + "px";
                }
            })
            .attr("transform", function (d, i) {
                if (selectedPaper) {
                    if (d.title === selectedPaper.title ||
                        references.indexOf(d.id) > -1 ||
                        citedBy.indexOf(d.id) > -1) {
                        highlightPaperIdx = highlightPaperIdx + 1;
                        maxHeights[parseInt((d.year - 2001) / 2)] =
                            Math.min(maxHeights[parseInt((d.year - 2001) / 2)],
                                (titleBegin - ((highlightPaperIdx - 1) * yWidth + yOffset) - 5));

                        return "translate(" + ((xOffset + 1) * dWidth - 15 - 30) + ","
                            + (titleBegin - ((highlightPaperIdx - 1) * yWidth + yOffset) + ")"
                            );
                    } else
                        return "translate(" + ((xOffset + 1) * dWidth - 15 - 30) + ","
                            + (titleBegin - 0.5 * fontSize - (currentData.length - i) * (fontSize + 0.5)) + ")"
                } else {
                    return "translate(" + ((xOffset + 1) * dWidth - 15 - 30) + ","
                        + (titleBegin - 0.5 * fontSize - (currentData.length - i) * (fontSize + 0.5)) + ")"
                }
            })
            .text(function (d) {
                if (d.title.length < displayTitleLength) return d.title;
                else return d.title.substring(0, displayTitleLength - 3) + '...';
            })
        ;

        selection.exit()
            .attr("opacity", 1)
            .transition()
            .duration(2000)
            .attr("height", 0)
            .attr("opacity", 0)
            .remove();

        j++;
    }
}

d3.select("#searchTitle").on("input", function() {searchTitleTarget = this.value;});

function searchTitle() {
    selectedPaper = null;
    references = [];
    citedBy = [];
    searchResult = [];
    maxPaperCitationOnSelected = 0;
    let target = new RegExp(searchTitleTarget, "i");
    for (let year = 2001; year < 2019; year += 2) {
        if (paperData.hasOwnProperty(year.toString())) {
            for (let i = 0; i < paperData[year].length; i++)
                if(paperData[year][i].title.match(target)) {
                    searchResult.push(paperData[year][i]);
                    maxPaperCitationOnSelected = Math.max(paperData[year][i].cited_count, maxPaperCitationOnSelected);
                    paperData[year][i]['isTarget'] = true;
                } else {
                    paperData[year][i]['isTarget'] = false;
                }
        }
    }
    // cannot find matching paper
    if (searchResult.length === 0)
        searchResult = null;
    /// only on matching paper, set it as selected paper
    else if (searchResult.length === 1) {
        selectedPaper = searchResult[0];
        searchResult = null;
        getMaxCitations();
    }
    updateText();
}

// 根据标题排序
function sortByTitle() {
    function compareTitle(a, b) {
        if (a.title < b.title)
            return -1;
        if (a.title > b.title)
            return 1;
        return 0;
    }

    for (let year = 2001; year < 2019; year += 2)
        paperData[year].sort(compareTitle);
    selectedPaper = null;

    updateText();
}

// 根据被引用量排序
function sortByCitation() {
    function compareCitation(a, b) {
        if (a.cited_count > b.cited_count)
            return -1;
        if (a.cited_count < b.cited_count)
            return 1;
        return 0;
    }

    for (let year = 2001; year < 2019; year += 2)
        paperData[year].sort(compareCitation);
    selectedPaper = null;

    updateText();
}

d3.json("data/paper_info.json", function (error, data) {
    if (error) throw error;
    paperData = data;
    getMaxCitations();
    yearBar();

    d3.select("#citationCheckbox").on("change", showCitation);
});

