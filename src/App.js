import { useEffect, useRef } from 'react'
import * as d3 from 'd3'
import './App.css'
import { DATA } from './data'

function App({ chartWidth = 700, chartHeight = 300 }) {
  const chartRef = useRef(null)

  useEffect(() => {
    //remove last chart if it exists in rerendering
    d3.select('.voronoi').remove()
    networkGraphMaker(DATA)
    // eslint-disable-next-line
  }, [DATA])

  const margin = {
    top: 20,
    right: 25,
    bottom: 40,
    left: 55,
  }

  // const width = chartWidth - (margin.right + margin.left)
  // const height = chartHeight - (margin.top + margin.bottom)

  const networkGraphMaker = (data) => {
    const links = []
    data.forEach((item) => {
      item.out_edges.forEach((outEdge) => {
        links.push({
          source: outEdge.src,
          target: outEdge.dst,
          value: +item.card_no.slice(-6, -3),
        })
      })

      item.in_edges.forEach((outEdge) => {
        links.push({
          source: outEdge.src,
          target: outEdge.dst,
          value: +item.card_no.slice(-6, -3),
        })
      })

      // item.out_edges.forEach((outEdge) => {
      //   console.log(Number(outEdge.src.slice(4, 6)))
      //   links.push({
      //     source: {
      //       name: outEdge.src,
      //       // px: +outEdge.src.slice(-6, -3),
      //       // py: +outEdge.src.slice(-6, -3),
      //       x: +outEdge.src.slice(-6, -3) + Number(outEdge.src.slice(4, 5)),
      //       y: Number(outEdge.src.slice(-3)) + Number(outEdge.src.slice(4, 6)),
      //     },
      //     target: {
      //       name: outEdge.dst,
      //       // px: +outEdge.dst.slice(-6, -3),
      //       // py: +outEdge.dst.slice(-6, -3),
      //       x: +outEdge.dst.slice(-6, -3) + Number(outEdge.dst.slice(4, 6)),
      //       y: Number(outEdge.dst.slice(-3)) + Number(outEdge.dst.slice(4, 6)),
      //     },
      //     value: +item.card_no.slice(-6, -3),
      //   })
      // })

      // item.in_edges.forEach((outEdge) => {
      //   links.push({
      //     source: {
      //       name: outEdge.src,
      //       // px: +outEdge.src.slice(-6, -3),
      //       // py: +outEdge.src.slice(-6, -3),
      //       x: +outEdge.src.slice(-6, -3) + Number(outEdge.src.slice(4, 5)),
      //       y: Number(outEdge.src.slice(-3)) + Number(outEdge.src.slice(4, 6)),
      //     },
      //     target: {
      //       name: outEdge.dst,
      //       // px: +outEdge.dst.slice(-6, -3),
      //       // py: +outEdge.dst.slice(-6, -3),
      //       x: +outEdge.dst.slice(-6, -3) + Number(outEdge.dst.slice(4, 6)),
      //       y: Number(outEdge.dst.slice(-3)) + Number(outEdge.dst.slice(4, 6)),
      //     },
      //     value: +item.card_no.slice(-6, -3),
      //   })
      // })
    })

    console.log(links)
    var nodes = {}

    // Compute the distinct nodes from the links.
    links.forEach(function (link) {
      // nodes[link.source.name] = link.source
      // nodes[link.target.name] = link.target
      link.source = nodes[link.source] || (nodes[link.source] = { name: link.source })
      link.target = nodes[link.target] || (nodes[link.target] = { name: link.target })
      link.value = +link.value
    })

    console.log(nodes)
    var width = 800,
      height = 800,
      color = d3.scaleOrdinal().domain([0, links.length]).range(d3.schemeSet2)

    var force = d3
      .forceSimulation()
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('link', d3.forceLink(links).distance(80))
      .force('charge', d3.forceManyBody().strength(-50).distanceMax(250))
      .nodes(Object.values(nodes))
      .on('tick', tick)

    // Set the range
    var v = d3.scaleLinear().range([0, 100])

    // Scale the range of the data
    v.domain([
      0,
      d3.max(links, function (d) {
        return d.value
      }),
    ])

    // asign a type per value to encode opacity
    links.forEach(function (link) {
      if (v(link.value) <= 25) {
        link.type = 'twofive'
      } else if (v(link.value) <= 50 && v(link.value) > 25) {
        link.type = 'fivezero'
      } else if (v(link.value) <= 75 && v(link.value) > 50) {
        link.type = 'sevenfive'
      } else if (v(link.value) <= 100 && v(link.value) > 75) {
        link.type = 'onezerozero'
      }
    })

    const viz = d3.select(chartRef.current)

    var svg = viz.append('svg').attr('width', width).attr('height', height).attr('class', 'voronoi')

    // build the arrow.
    svg
      .append('svg:defs')
      .selectAll('marker')
      .data(['end']) // Different link/path types can be defined here
      .enter()
      .append('svg:marker') // This section adds in the arrows
      .attr('id', String)
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 15)
      .attr('refY', -1.5)
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .attr('orient', 'auto')
      .append('svg:path')
      .attr('d', 'M0,-5L10,0L0,5')

    // add the links and the arrows
    var path = svg
      .append('svg:g')
      .selectAll('path')
      .data(links)
      .enter()
      .append('svg:path')
      .attr('class', function (d) {
        return 'link ' + d.type
      })
      .attr('marker-end', 'url(#end)')

    // define the nodes
    var node = svg
      .selectAll('.node')
      .data(force.nodes())
      .enter()
      .append('g')
      .attr('class', 'node')
      .on('click', click)
      .on('dblclick', dblclick)
    // .call(force.drag)

    // add the nodes
    node
      .append('circle')
      .attr('r', 5)
      .style('fill', function (d) {
        return color(d.name)
      })

    // add the text
    node
      .append('text')
      .attr('x', 12)
      .attr('dy', '.35em')
      .text(function (d) {
        return d.name
      })

    // add the curvy lines
    function tick() {
      path.attr('d', function (d) {
        var dx = d.target.x - d.source.x,
          dy = d.target.y - d.source.y,
          dr = Math.sqrt(dx * dx + dy * dy)
        return 'M' + d.source.x + ',' + d.source.y + 'A' + dr + ',' + dr + ' 0 0,1 ' + d.target.x + ',' + d.target.y
      })

      node.attr('transform', function (d) {
        return 'translate(' + d.x + ',' + d.y + ')'
      })
    }

    // action to take on mouse click
    function click() {
      d3.select(this)
        .select('text')
        .transition()
        .duration(750)
        .attr('x', 22)
        .style('stroke', 'lightsteelblue')
        .style('stroke-width', '.5px')
        .style('font', '20px sans-serif')
      d3.select(this).select('circle').transition().duration(750).attr('r', 16)
    }

    // action to take on mouse double click
    function dblclick() {
      d3.select(this).select('circle').transition().duration(750).attr('r', 6)
      d3.select(this)
        .select('text')
        .transition()
        .duration(750)
        .attr('x', 12)
        .style('stroke', 'none')
        .style('fill', 'black')
        .style('stroke', 'none')
        .style('font', '10px sans-serif')
    }
  }

  return (
    <div className="App">
      <div id={'svg'} className={'viz'} ref={chartRef}></div>
    </div>
  )
}

export default App
