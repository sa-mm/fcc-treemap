// @ts-check

const w = 600
const h = 800
const padding = 60

var svg = d3.select('div#container')
  .append('svg')
  .attr('preserveAspectRatio', 'xMinYMin meet')
  .attr('viewBox', '0 0 ' + w + ' ' + h)
  .classed('svg-content', true)

var title = svg.append('g')
  .attr('transform', 'translate(' + (w / 2) + ',' + (padding / 2) + ')')

title.append('text')
  .attr('id', 'title')
  .style('text-anchor', 'middle')
  .text('Video Game Sales')

title.append('text')
  .attr('id', 'description')
  .attr('y', 20)
  .style('text-anchor', 'middle')
  .style('font-size', 'small')
  .text('Top 100 Most Sold Video Games Grouped by Platform')

var fader = function (color) { return d3.interpolateRgb(color, '#fff')(0.2) }
var color = d3.scaleOrdinal(d3.schemeCategory20.map(fader))
var format = d3.format(',d')

var gamesTreemap = d3.treemap()
  .tile(d3.treemapResquarify)
  .size([w, ((2 / 3) * h) - padding])
  .round(true)
  .paddingInner(1)

const kickURL = 'https://cdn.rawgit.com/freeCodeCamp/testable-projects-fcc/a80ce8f9/src/data/tree_map/kickstarter-funding-data.json'
const movieURL = 'https://cdn.rawgit.com/freeCodeCamp/testable-projects-fcc/a80ce8f9/src/data/tree_map/movie-data.json'
const gamesURL = 'https://cdn.rawgit.com/freeCodeCamp/testable-projects-fcc/a80ce8f9/src/data/tree_map/video-game-sales-data.json'

d3.queue()
  .defer(d3.json, kickURL)
  .defer(d3.json, movieURL)
  .defer(d3.json, gamesURL)
  .await(ready)

function ready(error, kickPledges, movieSales, gamesSales) {
  if (error) throw error

  const tooltip = d3.select('body')
    .append('div')
    .style('position', 'absolute')
    .style('z-index', '10')
    .style('visibility', 'hidden')
    .attr('id', 'tooltip')

  var gamesRoot = d3.hierarchy(gamesSales)
    .eachBefore(function (d) { d.data.id = (d.parent ? d.parent.data.id + '.' : '') + d.data.name })
    .sum(sumByValue)
    .sort(function (a, b) { return b.height - a.height || b.value - a.value })

  gamesTreemap(gamesRoot)

  var treeContainer = svg.append('g')
    .attr('transform', 'translate(0,' + padding + ')')

  var cell = treeContainer.selectAll('g')
    .data(gamesRoot.leaves())
    .enter().append('g')
    .attr('transform', function (d) { return 'translate(' + d.x0 + ',' + d.y0 + ')' })

  const onMouseOverCB = (d, i) => {
    tooltip.text(d.data.value)
    tooltip.attr('data-value', d.data.value)
    return tooltip.style('visibility', 'visible')
  }

  cell.append('rect')
    .classed('tile', true)
    .attr('id', function (d) { return d.data.id })
    .attr('width', function (d) { return d.x1 - d.x0 })
    .attr('height', function (d) { return d.y1 - d.y0 })
    .attr('fill', function (d) { return color(d.parent.data.id) })
    .attr('data-name', d => d.data.name)
    .attr('data-category', d => d.parent.data.id)
    .attr('data-value', d => d.data.value)
    .on('mouseover', onMouseOverCB)
    .on('mousemove', function () { return tooltip.style('top', (d3.event.pageY - 10) + 'px').style('left', (d3.event.pageX + 10) + 'px') })
    .on('mouseout', function () { return tooltip.style('visibility', 'hidden') })

  cell.append('text')
    .selectAll('tspan')
    .data(d => d.data.name.split(' '))
    .enter().append('tspan')
    .attr('x', 4)
    .attr('y', (d, i) => (i * 8) + 8)
    .style('font-size', '8px')
    .text(d => d)

  // This example takes each name and splits it name into an array at every capital letter
  //
  // So, the dataset for each text element is then ['Grand', 'Theft', 'Auto IV']
  // And for each tspan d will correspond to one of the items in that array (e.g., 'Grand')
  /*
  <text class="tile-text">
    <tspan x="4" y="13" style="font-style: normal; font-variant: normal; font-weight: normal; font-stretch: normal; font-size: 8px; line-height: normal; font-family: sans-serif;">Grand </tspan>
    <tspan x="4" y="23" style="font-style: normal; font-variant: normal; font-weight: normal; font-stretch: normal; font-size: 8px; line-height: normal; font-family: sans-serif;">Theft </tspan>
    <tspan x="4" y="33" style="font-style: normal; font-variant: normal; font-weight: normal; font-stretch: normal; font-size: 8px; line-height: normal; font-family: sans-serif;">Auto IV</tspan>
  </text>
  */
  // cell.append("text")
  //   .attr('class', 'tile-text')
  //   .selectAll("tspan")
  //   .data(function (d) { return d.data.name.split(/(?=[A-Z][^A-Z])/g); })
  //   .enter().append("tspan")
  //   .attr("x", 4)
  //   .attr("y", function (d, i) { return 13 + i * 10; })
  //   .style('font', '8px sans-serif')
  //   .text(function (d) { return d; });

  var legend = svg.append('g')
    .attr('transform', 'translate(' + (padding / 2) + ',' + (((2 / 3) * h) + (padding / 2)) + ')')
    .attr('id', d => {
      if (d) {
        console.log(d.data.category)
      }
      return 'legend'
    })

  legend.append('g')
    .selectAll('g')
    .data(gamesSales.children)
    .enter().append('text')
    .attr('x', (d, i) => i * 30)
    .style('font-size', '10px')
    .text(d => d.name)

  legend.append('g')
    .selectAll('g')
    .data(gamesSales.children)
    .enter().append('rect')
    .attr('x', (d, i) => (i * 30) + 5)
    .attr('y', 5)
    .attr('height', 10)
    .attr('width', 10)
    .style('fill', function (d) { return color(d.id) })

  function sumByValue(d) {
    return +d.value
  }
}
