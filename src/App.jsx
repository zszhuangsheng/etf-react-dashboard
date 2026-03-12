import { useState, useMemo, useEffect, useCallback } from "react";
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
  PieChart, Pie,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, ReferenceLine, Cell, ScatterChart, Scatter
} from "recharts";
import { fetchMonthlyData, interpolateMonthly } from "./fetcher.js";

/* ═══════════════════════════════════════════════════════════
   DESIGN SYSTEM
═══════════════════════════════════════════════════════════ */
const D = {
  bg:"#07090e", surface:"#0c1018", card:"#111827",
  border:"#1c2535", border2:"#243040",
  green:"#4ade80", red:"#f87171", accent:"#a3e635",
  text:"#e2e8f0", muted:"#7b8fa3", dim:"#131c28",
  orange:"#fb923c", purple:"#818cf8", spy:"#f59e0b",
};

const ETF_PALETTE = [
  "#38bdf8","#f59e0b","#a3e635","#f87171",
  "#818cf8","#fb923c","#4ade80","#e879f9",
  "#67e8f9","#fde047","#86efac","#fca5a5",
];

/* ═══════════════════════════════════════════════════════════
   ETF CATALOGUE  –  add any ticker here to include it
═══════════════════════════════════════════════════════════ */
const ETF_CATALOGUE = {
  /* ── Broad Market ──────────────────────────────────── */
  SPY: {
    name:"SPDR S&P 500 ETF",
    category:"大盘指数",
    benchmark:"QQQ",
    divYield:1.4, divGrowth:6, beta:1.0, er:0.09,
    maxDD:-33.0, cagr:13.5, sharpe:0.82,
    color:"#f59e0b",
    description:"追踪标普500指数，代表美国最大500家上市公司，是全球规模最大的ETF",
    strengths:["最广市场覆盖","科技牛市完整捕获","极高流动性","久经考验"],
    risks:["科技集中风险（前10只占30%+）","熊市跌幅较深","股息率低"],
    bestFor:"长期资本增值 / 核心配置 / 指数化投资",
    sectors:[
      {name:"科技",pct:31.3},{name:"医疗",pct:12.5},{name:"金融",pct:12.9},
      {name:"消费周期",pct:10.7},{name:"工业",pct:8.4},{name:"通信",pct:8.9},
      {name:"消费必需",pct:6.0},{name:"其他",pct:9.3},
    ],
    holdings:[
      {ticker:"AAPL",name:"苹果",      weight:7.1, divYield:0.5,divGrowth:5, pe:29.1,fcf:3.2,streak:12},
      {ticker:"MSFT",name:"微软",      weight:6.3, divYield:0.7,divGrowth:10,pe:34.8,fcf:2.8,streak:21},
      {ticker:"NVDA",name:"英伟达",    weight:6.1, divYield:0.03,divGrowth:150,pe:54.2,fcf:4.1,streak:12},
      {ticker:"AMZN",name:"亚马逊",    weight:3.9, divYield:0.0,divGrowth:0, pe:45.3,fcf:2.1,streak:0},
      {ticker:"META",name:"Meta",      weight:2.5, divYield:0.4,divGrowth:0, pe:28.7,fcf:3.4,streak:1},
      {ticker:"GOOGL",name:"谷歌A",    weight:2.1, divYield:0.4,divGrowth:0, pe:23.1,fcf:2.9,streak:1},
      {ticker:"GOOG", name:"谷歌C",    weight:1.8, divYield:0.4,divGrowth:0, pe:23.1,fcf:2.9,streak:1},
      {ticker:"BRK.B",name:"伯克希尔B",weight:1.7, divYield:0.0,divGrowth:0, pe:21.4,fcf:1.8,streak:0},
      {ticker:"TSLA", name:"特斯拉",   weight:1.6, divYield:0.0,divGrowth:0, pe:72.3,fcf:1.2,streak:0},
      {ticker:"LLY",  name:"礼来",     weight:1.3, divYield:0.7,divGrowth:15,pe:48.7,fcf:2.3,streak:9},
    ],
    annualReturns:[
      {y:"2013",r:32.4},{y:"2014",r:13.7},{y:"2015",r:1.4},{y:"2016",r:12.0},
      {y:"2017",r:21.8},{y:"2018",r:-4.4},{y:"2019",r:31.5},{y:"2020",r:18.4},
      {y:"2021",r:28.7},{y:"2022",r:-18.2},{y:"2023",r:26.3},{y:"2024",r:25.0},
    ],
    monthly:[
      ["2012-01",132.97,0],["2012-03",139.97,0.65],["2012-06",135.81,0],["2012-09",145.85,0.68],["2012-12",142.41,0.72],
      ["2013-03",156.67,0.72],["2013-06",160.42,0.78],["2013-09",170.69,0.80],["2013-12",184.69,0.85],
      ["2014-03",186.19,0.82],["2014-06",194.45,0.88],["2014-09",195.89,0.91],["2014-12",205.54,0.96],
      ["2015-03",206.92,0.91],["2015-06",207.78,0.96],["2015-09",190.35,0.96],["2015-12",203.87,1.02],
      ["2016-03",205.52,1.02],["2016-06",208.72,1.07],["2016-09",217.07,1.10],["2016-12",223.53,1.14],
      ["2017-03",235.73,1.10],["2017-06",242.15,1.16],["2017-09",252.82,1.22],["2017-12",266.86,1.27],
      ["2018-03",263.15,1.23],["2018-06",271.58,1.28],["2018-09",290.91,1.34],["2018-12",249.92,1.42],
      ["2019-03",281.77,1.38],["2019-06",293.65,1.46],["2019-09",299.77,1.50],["2019-12",321.86,1.58],
      ["2020-03",258.00,1.49],["2020-06",308.07,1.54],["2020-09",333.72,1.58],["2020-12",373.88,1.68],
      ["2021-03",396.04,1.68],["2021-06",427.14,1.77],["2021-09",432.68,1.88],["2021-12",477.48,1.99],
      ["2022-03",452.69,2.00],["2022-06",382.21,2.07],["2022-09",362.79,2.15],["2022-12",382.44,2.23],
      ["2023-03",411.00,2.15],["2023-06",441.43,2.23],["2023-09",430.57,2.27],["2023-12",475.53,2.38],
      ["2024-03",521.41,2.38],["2024-06",545.05,2.45],["2024-09",568.00,2.57],["2024-12",585.00,2.65],
    ],
  },

  /* ── Tech Growth ────────────────────────────────────── */
  QQQ: {
    name:"Invesco QQQ Trust",
    category:"科技成长",
    benchmark:"SPY",
    divYield:0.6, divGrowth:8, beta:1.18, er:0.20,
    maxDD:-35.1, cagr:17.2, sharpe:0.88,
    color:"#a3e635",
    description:"追踪纳斯达克100指数，重仓全球最大科技公司，历史上表现最强的主流ETF之一",
    strengths:["历史最高CAGR","AI/科技完整暴露","全球顶尖企业","流动性极佳"],
    risks:["科技集中风险极高","熊市跌幅大","估值偏高","不含金融股"],
    bestFor:"科技牛市 / 高风险偏好 / 长期成长型投资者",
    sectors:[
      {name:"科技",pct:49.8},{name:"通信",pct:16.1},{name:"消费周期",pct:13.5},
      {name:"医疗",pct:6.5},{name:"工业",pct:5.0},{name:"其他",pct:9.1},
    ],
    holdings:[
      {ticker:"AAPL", name:"苹果",   weight:9.1,divYield:0.5,divGrowth:5,  pe:29.1,fcf:3.2,streak:12},
      {ticker:"MSFT", name:"微软",   weight:8.2,divYield:0.7,divGrowth:10, pe:34.8,fcf:2.8,streak:21},
      {ticker:"NVDA", name:"英伟达", weight:8.0,divYield:0.03,divGrowth:150,pe:54.2,fcf:4.1,streak:12},
      {ticker:"AMZN", name:"亚马逊", weight:5.5,divYield:0.0,divGrowth:0,  pe:45.3,fcf:2.1,streak:0},
      {ticker:"META", name:"Meta",   weight:3.5,divYield:0.4,divGrowth:0,  pe:28.7,fcf:3.4,streak:1},
      {ticker:"TSLA", name:"特斯拉", weight:3.2,divYield:0.0,divGrowth:0,  pe:72.3,fcf:1.2,streak:0},
      {ticker:"GOOGL",name:"谷歌A",  weight:2.8,divYield:0.4,divGrowth:0,  pe:23.1,fcf:2.9,streak:1},
      {ticker:"GOOG", name:"谷歌C",  weight:2.5,divYield:0.4,divGrowth:0,  pe:23.1,fcf:2.9,streak:1},
      {ticker:"COST", name:"Costco", weight:2.3,divYield:0.6,divGrowth:13, pe:52.1,fcf:2.1,streak:19},
      {ticker:"NFLX", name:"Netflix",weight:2.1,divYield:0.0,divGrowth:0,  pe:44.6,fcf:2.8,streak:0},
    ],
    annualReturns:[
      {y:"2013",r:36.6},{y:"2014",r:19.0},{y:"2015",r:9.4},{y:"2016",r:7.1},
      {y:"2017",r:32.7},{y:"2018",r:-0.1},{y:"2019",r:38.6},{y:"2020",r:48.6},
      {y:"2021",r:27.3},{y:"2022",r:-32.6},{y:"2023",r:54.9},{y:"2024",r:26.0},
    ],
    monthly:[
      ["2012-01",61.2,0],["2012-03",68.1,0.3],["2012-06",63.2,0],["2012-09",71.3,0.3],["2012-12",63.5,0.3],
      ["2013-03",69.4,0.3],["2013-06",71.8,0.35],["2013-09",80.2,0.35],["2013-12",87.3,0.38],
      ["2014-03",86.1,0.35],["2014-06",92.4,0.38],["2014-09",98.3,0.40],["2014-12",103.4,0.42],
      ["2015-03",108.2,0.40],["2015-06",109.1,0.42],["2015-09",101.3,0.42],["2015-12",113.2,0.45],
      ["2016-03",106.4,0.42],["2016-06",109.8,0.45],["2016-09",118.3,0.47],["2016-12",121.2,0.49],
      ["2017-03",131.4,0.46],["2017-06",140.5,0.49],["2017-09",148.7,0.52],["2017-12",161.4,0.55],
      ["2018-03",162.3,0.52],["2018-06",174.9,0.55],["2018-09",188.4,0.59],["2018-12",152.3,0.62],
      ["2019-03",179.3,0.58],["2019-06",185.4,0.62],["2019-09",192.3,0.65],["2019-12",212.6,0.69],
      ["2020-03",193.1,0.65],["2020-06",253.7,0.69],["2020-09",269.1,0.73],["2020-12",313.7,0.78],
      ["2021-03",316.9,0.74],["2021-06",352.1,0.79],["2021-09",366.1,0.85],["2021-12",399.8,0.91],
      ["2022-03",349.7,0.87],["2022-06",270.3,0.93],["2022-09",258.7,0.99],["2022-12",265.4,1.05],
      ["2023-03",321.4,1.01],["2023-06",370.3,1.07],["2023-09",358.7,1.11],["2023-12",410.9,1.16],
      ["2024-03",444.9,1.12],["2024-06",472.3,1.18],["2024-09",489.4,1.24],["2024-12",517.3,1.29],
    ],
  },

  /* ── High-Dividend ─────────────────────────────────── */
  SCHD: {
    name:"Schwab US Dividend Equity",
    category:"高股息",
    benchmark:"SPY",
    divYield:3.5,  divGrowth:10, beta:0.75, er:0.06,
    maxDD:-27.3, cagr:11.5, sharpe:0.71,
    color:"#38bdf8",
    description:"追踪道琼斯美国股息100指数，精选连续10年增息+FCF覆盖率高的百只股票",
    strengths:["熊市防御（Beta 0.75）","股息连续增长","低费用率0.06%","季度派息"],
    risks:["牛市跑输成长ETF","科技权重极低","对利率敏感"],
    bestFor:"退休收入 / 防御配置 / 长期持股",
    sectors:[
      {name:"能源",pct:21.2},{name:"消费必需",pct:18.9},{name:"医疗",pct:16.0},
      {name:"工业",pct:11.4},{name:"消费周期",pct:9.6},{name:"科技",pct:9.1},
      {name:"金融",pct:8.0},{name:"其他",pct:5.8},
    ],
    holdings:[
      {ticker:"LMT",name:"洛克希德·马丁",weight:4.81,divYield:2.8,divGrowth:5,pe:17.2,fcf:1.8,streak:21},
      {ticker:"COP",name:"康菲石油",      weight:4.32,divYield:3.1,divGrowth:9,pe:12.4,fcf:2.3,streak:13},
      {ticker:"VZ", name:"威瑞森电信",    weight:4.31,divYield:6.5,divGrowth:2,pe:8.9, fcf:1.2,streak:17},
      {ticker:"CVX",name:"雪佛龙",        weight:4.31,divYield:4.0,divGrowth:7,pe:14.1,fcf:2.1,streak:36},
      {ticker:"BMY",name:"百时美施贵宝",  weight:4.28,divYield:4.9,divGrowth:5,pe:11.3,fcf:1.9,streak:15},
      {ticker:"MRK",name:"默克",          weight:4.23,divYield:2.9,divGrowth:7,pe:13.8,fcf:2.4,streak:13},
      {ticker:"MO", name:"奥驰亚",        weight:4.13,divYield:9.2,divGrowth:4,pe:9.7, fcf:1.5,streak:54},
      {ticker:"TXN",name:"德州仪器",      weight:4.06,divYield:3.0,divGrowth:13,pe:33.4,fcf:1.6,streak:20},
      {ticker:"KO", name:"可口可乐",      weight:4.03,divYield:3.1,divGrowth:4,pe:22.7,fcf:1.7,streak:62},
      {ticker:"PEP",name:"百事可乐",      weight:4.01,divYield:3.2,divGrowth:7,pe:21.5,fcf:1.8,streak:51},
    ],
    annualReturns:[
      {y:"2013",r:26.8},{y:"2014",r:10.2},{y:"2015",r:0.9},{y:"2016",r:17.3},
      {y:"2017",r:17.6},{y:"2018",r:-5.3},{y:"2019",r:28.7},{y:"2020",r:2.1},
      {y:"2021",r:29.5},{y:"2022",r:-5.8},{y:"2023",r:4.3},{y:"2024",r:14.8},
    ],
    monthly:[
      ["2012-01",26.35,0.15],["2012-03",27.54,0.15],["2012-06",27.23,0.17],["2012-09",28.76,0.17],["2012-12",28.65,0.19],
      ["2013-03",31.23,0.19],["2013-06",31.20,0.21],["2013-09",33.45,0.21],["2013-12",35.67,0.23],
      ["2014-03",36.45,0.22],["2014-06",37.89,0.23],["2014-09",37.98,0.24],["2014-12",38.23,0.25],
      ["2015-03",39.54,0.24],["2015-06",39.45,0.25],["2015-09",36.45,0.25],["2015-12",37.89,0.27],
      ["2016-03",37.89,0.27],["2016-06",39.45,0.28],["2016-09",40.56,0.29],["2016-12",41.23,0.30],
      ["2017-03",43.45,0.29],["2017-06",44.67,0.30],["2017-09",46.23,0.32],["2017-12",48.34,0.33],
      ["2018-03",46.12,0.32],["2018-06",47.89,0.33],["2018-09",50.67,0.35],["2018-12",44.23,0.37],
      ["2019-03",49.67,0.36],["2019-06",52.12,0.38],["2019-09",54.23,0.39],["2019-12",57.23,0.41],
      ["2020-03",42.12,0.39],["2020-06",49.23,0.40],["2020-09",50.89,0.41],["2020-12",56.78,0.44],
      ["2021-03",61.23,0.44],["2021-06",65.34,0.46],["2021-09",66.12,0.49],["2021-12",72.34,0.52],
      ["2022-03",73.45,0.52],["2022-06",63.23,0.54],["2022-09",61.23,0.56],["2022-12",66.45,0.58],
      ["2023-03",70.45,0.56],["2023-06",71.89,0.58],["2023-09",68.34,0.59],["2023-12",73.12,0.62],
      ["2024-03",77.12,0.62],["2024-06",77.89,0.64],["2024-09",82.34,0.67],["2024-12",79.45,0.69],
    ],
  },

  /* ── Dividend Growth ──────────────────────────────── */
  VYM: {
    name:"Vanguard High Dividend Yield",
    category:"高股息",
    benchmark:"SCHD",
    divYield:2.9, divGrowth:6, beta:0.78, er:0.06,
    maxDD:-26.0, cagr:10.8, sharpe:0.68,
    color:"#818cf8",
    description:"追踪FTSE高股息收益率指数，持有约400只高股息股票，分散度远高于SCHD",
    strengths:["超高分散度（~400只）","低费用率","稳定派息","低Beta防御"],
    risks:["股息增长率低于SCHD","成长性相对弱","金融/能源偏重"],
    bestFor:"防御配置 / 股息收入 / 分散化高股息",
    sectors:[
      {name:"金融",pct:21.5},{name:"医疗",pct:15.8},{name:"消费必需",pct:14.2},
      {name:"工业",pct:12.8},{name:"能源",pct:9.3},{name:"科技",pct:9.0},
      {name:"公用事业",pct:7.8},{name:"其他",pct:9.6},
    ],
    holdings:[
      {ticker:"JPMORGAN",name:"摩根大通",weight:4.2,divYield:2.1,divGrowth:8, pe:12.8,fcf:2.1,streak:13},
      {ticker:"JNJ",     name:"强生",   weight:3.8,divYield:3.1,divGrowth:5, pe:14.2,fcf:2.4,streak:61},
      {ticker:"ABBV",    name:"艾伯维", weight:3.5,divYield:3.9,divGrowth:9, pe:19.3,fcf:2.6,streak:12},
      {ticker:"XOM",     name:"埃克森", weight:3.3,divYield:3.6,divGrowth:4, pe:13.7,fcf:2.0,streak:41},
      {ticker:"PG",      name:"宝洁",   weight:3.1,divYield:2.4,divGrowth:6, pe:24.3,fcf:2.2,streak:67},
      {ticker:"HD",      name:"家得宝", weight:2.9,divYield:2.4,divGrowth:12,pe:22.1,fcf:2.5,streak:14},
      {ticker:"CVX",     name:"雪佛龙", weight:2.8,divYield:4.0,divGrowth:7, pe:14.1,fcf:2.1,streak:36},
      {ticker:"AVGO",    name:"博通",   weight:2.6,divYield:1.6,divGrowth:15,pe:31.2,fcf:2.9,streak:13},
      {ticker:"KO",      name:"可口可乐",weight:2.4,divYield:3.1,divGrowth:4, pe:22.7,fcf:1.7,streak:62},
      {ticker:"PFE",     name:"辉瑞",   weight:2.2,divYield:6.2,divGrowth:2, pe:11.4,fcf:1.4,streak:13},
    ],
    annualReturns:[
      {y:"2013",r:22.0},{y:"2014",r:12.8},{y:"2015",r:-0.3},{y:"2016",r:16.2},
      {y:"2017",r:16.2},{y:"2018",r:-6.2},{y:"2019",r:26.4},{y:"2020",r:1.0},
      {y:"2021",r:27.7},{y:"2022",r:-1.0},{y:"2023",r:2.7},{y:"2024",r:13.3},
    ],
    monthly:[
      ["2012-01",51.2,0.45],["2012-03",54.1,0.46],["2012-06",52.8,0.48],["2012-09",55.3,0.49],["2012-12",53.4,0.51],
      ["2013-03",58.2,0.50],["2013-06",57.1,0.52],["2013-09",62.3,0.54],["2013-12",65.2,0.56],
      ["2014-03",67.4,0.54],["2014-06",70.1,0.57],["2014-09",71.3,0.59],["2014-12",73.5,0.61],
      ["2015-03",74.2,0.59],["2015-06",72.8,0.62],["2015-09",67.4,0.62],["2015-12",73.2,0.65],
      ["2016-03",72.1,0.63],["2016-06",76.3,0.67],["2016-09",78.4,0.70],["2016-12",84.9,0.73],
      ["2017-03",88.1,0.70],["2017-06",88.4,0.74],["2017-09",93.2,0.78],["2017-12",98.7,0.82],
      ["2018-03",91.3,0.79],["2018-06",93.4,0.83],["2018-09",98.7,0.87],["2018-12",87.4,0.91],
      ["2019-03",94.3,0.88],["2019-06",99.2,0.93],["2019-09",101.3,0.97],["2019-12",110.2,1.01],
      ["2020-03",82.3,0.97],["2020-06",92.4,1.01],["2020-09",96.3,1.05],["2020-12",111.3,1.09],
      ["2021-03",118.4,1.06],["2021-06",126.3,1.11],["2021-09",127.4,1.17],["2021-12",142.3,1.23],
      ["2022-03",147.2,1.20],["2022-06",132.4,1.26],["2022-09",127.3,1.32],["2022-12",140.7,1.38],
      ["2023-03",143.2,1.33],["2023-06",144.3,1.40],["2023-09",137.4,1.45],["2023-12",145.2,1.51],
      ["2024-03",152.3,1.46],["2024-06",155.4,1.53],["2024-09",160.3,1.60],["2024-12",164.7,1.66],
    ],
  },

  /* ── Dividend Growth ──────────────────────────────── */
  DGRO: {
    name:"iShares Core Dividend Growth",
    category:"股息成长",
    benchmark:"SCHD",
    divYield:2.4, divGrowth:10, beta:0.82, er:0.08,
    maxDD:-25.2, cagr:11.2, sharpe:0.74,
    color:"#fb923c",
    description:"追踪晨星美国股息成长指数，侧重未来股息增长潜力而非当前高股息率，科技成分更高",
    strengths:["股息增长率高","科技暴露更充分","低费用率","防御+成长平衡"],
    risks:["当前股息率较低","持仓偏大盘蓝筹","相比SCHD更贵"],
    bestFor:"平衡增长与收入 / 中长期持股 / SCHD补充配置",
    sectors:[
      {name:"科技",pct:22.1},{name:"医疗",pct:18.3},{name:"金融",pct:16.2},
      {name:"工业",pct:12.4},{name:"消费必需",pct:11.1},{name:"消费周期",pct:8.9},
      {name:"能源",pct:4.8},{name:"其他",pct:6.2},
    ],
    holdings:[
      {ticker:"MSFT",name:"微软",   weight:5.2,divYield:0.7,divGrowth:10,pe:34.8,fcf:2.8,streak:21},
      {ticker:"AAPL",name:"苹果",   weight:4.8,divYield:0.5,divGrowth:5, pe:29.1,fcf:3.2,streak:12},
      {ticker:"JNJ", name:"强生",   weight:3.9,divYield:3.1,divGrowth:5, pe:14.2,fcf:2.4,streak:61},
      {ticker:"JPM", name:"摩根大通",weight:3.6,divYield:2.1,divGrowth:8, pe:12.8,fcf:2.1,streak:13},
      {ticker:"PG",  name:"宝洁",   weight:3.2,divYield:2.4,divGrowth:6, pe:24.3,fcf:2.2,streak:67},
      {ticker:"HD",  name:"家得宝", weight:3.0,divYield:2.4,divGrowth:12,pe:22.1,fcf:2.5,streak:14},
      {ticker:"AVGO",name:"博通",   weight:2.8,divYield:1.6,divGrowth:15,pe:31.2,fcf:2.9,streak:13},
      {ticker:"UNH", name:"联合健康",weight:2.6,divYield:1.6,divGrowth:13,pe:19.4,fcf:2.7,streak:14},
      {ticker:"MRK", name:"默克",   weight:2.4,divYield:2.9,divGrowth:7, pe:13.8,fcf:2.4,streak:13},
      {ticker:"TXN", name:"德州仪器",weight:2.2,divYield:3.0,divGrowth:13,pe:33.4,fcf:1.6,streak:20},
    ],
    annualReturns:[
      {y:"2015",r:1.8},{y:"2016",r:15.4},{y:"2017",r:20.1},{y:"2018",r:-5.7},
      {y:"2019",r:29.8},{y:"2020",r:12.3},{y:"2021",r:27.1},{y:"2022",r:-9.8},
      {y:"2023",r:16.2},{y:"2024",r:15.9},
    ],
    monthly:[
      ["2015-01",23.4,0.2],["2015-06",24.1,0.22],["2015-12",23.8,0.23],
      ["2016-06",26.4,0.24],["2016-12",27.5,0.26],
      ["2017-06",30.1,0.27],["2017-12",33.1,0.29],
      ["2018-06",34.2,0.30],["2018-12",31.2,0.33],
      ["2019-06",37.4,0.32],["2019-12",40.4,0.35],
      ["2020-06",41.3,0.36],["2020-12",45.4,0.39],
      ["2021-06",52.1,0.40],["2021-12",57.8,0.44],
      ["2022-06",50.3,0.45],["2022-12",52.1,0.48],
      ["2023-06",57.4,0.49],["2023-12",60.5,0.52],
      ["2024-06",66.2,0.53],["2024-12",70.1,0.57],
    ],
  },

  /* ── International ──────────────────────────────────── */
  VXUS: {
    name:"Vanguard Total Intl Stock",
    category:"国际股票",
    benchmark:"SPY",
    divYield:3.2, divGrowth:4, beta:0.85, er:0.07,
    maxDD:-36.8, cagr:5.8, sharpe:0.41,
    color:"#67e8f9",
    description:"追踪FTSE全球（美国除外）指数，覆盖47个国家约8600只股票，是最广泛的非美指数ETF",
    strengths:["极致分散（8600+持仓）","低估值","汇率分散","低费用率"],
    risks:["长期跑输美股","地缘政治风险","汇率波动","新兴市场不稳定"],
    bestFor:"全球分散 / 对冲美股集中风险 / 低估值价值配置",
    sectors:[
      {name:"金融",pct:22.3},{name:"工业",pct:16.1},{name:"消费周期",pct:13.4},
      {name:"医疗",pct:10.2},{name:"科技",pct:9.8},{name:"消费必需",pct:9.1},
      {name:"能源",pct:6.5},{name:"其他",pct:12.6},
    ],
    holdings:[
      {ticker:"SAMSUNGname","name":"三星电子",weight:1.8,divYield:2.8,divGrowth:3, pe:14.2,fcf:1.9,streak:8},
      {ticker:"NESN",  name:"雀巢",       weight:1.6,divYield:3.1,divGrowth:4, pe:20.3,fcf:2.1,streak:26},
      {ticker:"ASML",  name:"阿斯麦",     weight:1.4,divYield:0.9,divGrowth:20,pe:36.4,fcf:2.8,streak:8},
      {ticker:"ROCHE", name:"罗氏制药",   weight:1.3,divYield:3.8,divGrowth:3, pe:14.1,fcf:2.3,streak:34},
      {ticker:"NOVO",  name:"诺和诺德",   weight:1.2,divYield:1.2,divGrowth:15,pe:31.2,fcf:3.1,streak:20},
      {ticker:"LVMH",  name:"LVMH",       weight:1.1,divYield:1.8,divGrowth:8, pe:22.4,fcf:2.4,streak:14},
      {ticker:"TM",    name:"丰田",       weight:1.0,divYield:2.9,divGrowth:5, pe:11.3,fcf:1.7,streak:10},
      {ticker:"TSM",   name:"台积电",     weight:0.9,divYield:1.4,divGrowth:12,pe:28.7,fcf:2.6,streak:10},
      {ticker:"BHP",   name:"必和必拓",   weight:0.8,divYield:5.1,divGrowth:2, pe:12.8,fcf:2.0,streak:8},
      {ticker:"AZN",   name:"阿斯利康",   weight:0.7,divYield:2.0,divGrowth:7, pe:24.3,fcf:2.2,streak:11},
    ],
    annualReturns:[
      {y:"2013",r:15.2},{y:"2014",r:-3.9},{y:"2015",r:-4.2},{y:"2016",r:4.5},
      {y:"2017",r:27.2},{y:"2018",r:-14.2},{y:"2019",r:21.8},{y:"2020",r:11.1},
      {y:"2021",r:8.6},{y:"2022",r:-16.0},{y:"2023",r:15.7},{y:"2024",r:4.8},
    ],
    monthly:[
      ["2012-01",41.2,0.3],["2012-06",38.4,0.4],["2012-12",45.3,0.8],
      ["2013-06",49.1,0.4],["2013-12",52.1,0.9],
      ["2014-06",50.3,0.4],["2014-12",50.1,0.9],
      ["2015-06",49.3,0.4],["2015-12",47.9,0.9],
      ["2016-06",47.3,0.4],["2016-12",50.1,0.9],
      ["2017-06",58.3,0.4],["2017-12",63.7,0.9],
      ["2018-06",57.3,0.4],["2018-12",54.6,0.9],
      ["2019-06",61.3,0.4],["2019-12",66.4,0.9],
      ["2020-06",61.2,0.4],["2020-12",73.7,0.9],
      ["2021-06",79.3,0.5],["2021-12",79.9,1.0],
      ["2022-06",63.2,0.5],["2022-12",67.2,1.0],
      ["2023-06",75.3,0.5],["2023-12",77.8,1.1],
      ["2024-06",78.4,0.5],["2024-12",81.6,1.2],
    ],
  },

  /* ── Bonds / Fixed Income ───────────────────────────── */
  BND: {
    name:"Vanguard Total Bond Market",
    category:"债券",
    benchmark:"AGG",
    divYield:4.2, divGrowth:0, beta:0.05, er:0.03,
    maxDD:-17.4, cagr:2.8, sharpe:0.38,
    color:"#fde047",
    description:"追踪彭博美国综合债券指数，覆盖美国投资级债券（政府债+公司债+MBS），是核心债券配置",
    strengths:["极低风险","月度派息","通缩保护","股市对冲"],
    risks:["加息周期大幅回撤","实际收益低于通胀","成长性为零"],
    bestFor:"保守配置 / 退休资产保护 / 股债平衡中的稳定器",
    sectors:[
      {name:"美国国债",pct:44.2},{name:"政府机构MBS",pct:21.3},{name:"公司债",pct:19.8},
      {name:"商业MBS",pct:5.1},{name:"资产支持证券",pct:4.7},{name:"其他",pct:4.9},
    ],
    holdings:[
      {ticker:"US10Y", name:"10年期美债",weight:18.3,divYield:4.4,divGrowth:0,pe:0,fcf:0,streak:0},
      {ticker:"FNMA",  name:"房利美MBS",weight:12.4,divYield:5.1,divGrowth:0,pe:0,fcf:0,streak:0},
      {ticker:"US5Y",  name:"5年期美债", weight:11.2,divYield:4.3,divGrowth:0,pe:0,fcf:0,streak:0},
      {ticker:"US2Y",  name:"2年期美债", weight:8.3, divYield:4.8,divGrowth:0,pe:0,fcf:0,streak:0},
      {ticker:"US30Y", name:"30年期美债",weight:6.4, divYield:4.6,divGrowth:0,pe:0,fcf:0,streak:0},
      {ticker:"CORP_A",name:"A级公司债", weight:5.8, divYield:5.2,divGrowth:0,pe:0,fcf:0,streak:0},
      {ticker:"CORP_AA",name:"AA级公司债",weight:4.9,divYield:4.8,divGrowth:0,pe:0,fcf:0,streak:0},
      {ticker:"FHLMC", name:"联邦住宅贷款",weight:4.2,divYield:5.0,divGrowth:0,pe:0,fcf:0,streak:0},
      {ticker:"GNMA",  name:"吉利美MBS",weight:3.8, divYield:5.3,divGrowth:0,pe:0,fcf:0,streak:0},
      {ticker:"TIPS",  name:"通胀挂钩债",weight:3.2,divYield:3.8,divGrowth:0,pe:0,fcf:0,streak:0},
    ],
    annualReturns:[
      {y:"2013",r:-2.3},{y:"2014",r:5.9},{y:"2015",r:0.4},{y:"2016",r:2.6},
      {y:"2017",r:3.5},{y:"2018",r:0.0},{y:"2019",r:8.7},{y:"2020",r:7.7},
      {y:"2021",r:-1.8},{y:"2022",r:-13.1},{y:"2023",r:5.5},{y:"2024",r:1.3},
    ],
    monthly:[
      ["2012-01",82.1,0.25],["2012-06",83.4,0.26],["2012-12",81.3,0.27],
      ["2013-06",77.2,0.25],["2013-12",79.6,0.26],
      ["2014-06",81.3,0.26],["2014-12",84.2,0.27],
      ["2015-06",83.1,0.26],["2015-12",83.5,0.27],
      ["2016-06",84.7,0.26],["2016-12",79.4,0.27],
      ["2017-06",81.2,0.27],["2017-12",82.1,0.28],
      ["2018-06",79.3,0.27],["2018-12",82.2,0.29],
      ["2019-06",85.3,0.28],["2019-12",89.3,0.29],
      ["2020-06",90.1,0.28],["2020-12",96.3,0.29],
      ["2021-06",94.2,0.27],["2021-12",94.5,0.28],
      ["2022-06",80.3,0.28],["2022-12",82.9,0.33],
      ["2023-06",84.2,0.34],["2023-12",87.5,0.34],
      ["2024-06",86.3,0.36],["2024-12",88.7,0.38],
    ],
  },

  /* ── Real Estate ────────────────────────────────────── */
  VNQ: {
    name:"Vanguard Real Estate ETF",
    category:"房地产",
    benchmark:"SPY",
    divYield:4.1, divGrowth:3, beta:0.72, er:0.13,
    maxDD:-40.5, cagr:8.4, sharpe:0.52,
    color:"#e879f9",
    description:"追踪MSCI US Investable Market Real Estate 25/50指数，覆盖美国REIT和房地产公司",
    strengths:["高股息率","通胀对冲属性","低相关性","季度派息"],
    risks:["利率敏感度最高","2020/2022大幅回撤","成长性有限"],
    bestFor:"通胀对冲 / 分散化 / 高现金流需求",
    sectors:[
      {name:"多元化REIT",pct:23.4},{name:"工业REIT",pct:18.2},{name:"公寓REIT",pct:14.3},
      {name:"零售REIT",pct:12.1},{name:"医疗REIT",pct:10.8},{name:"办公REIT",pct:7.2},
      {name:"数据中心",pct:8.4},{name:"其他",pct:5.6},
    ],
    holdings:[
      {ticker:"PLD", name:"普洛斯",     weight:7.8,divYield:2.7,divGrowth:8, pe:41.2,fcf:1.4,streak:9},
      {ticker:"AMT", name:"美国铁塔",   weight:6.2,divYield:3.1,divGrowth:10,pe:38.7,fcf:1.7,streak:12},
      {ticker:"EQIX",name:"Equinix",    weight:5.8,divYield:2.1,divGrowth:9, pe:75.3,fcf:1.3,streak:9},
      {ticker:"WELL",name:"韦尔塔",     weight:4.3,divYield:2.9,divGrowth:6, pe:29.8,fcf:1.6,streak:12},
      {ticker:"SPG", name:"西蒙地产",   weight:4.1,divYield:5.2,divGrowth:4, pe:22.4,fcf:1.5,streak:9},
      {ticker:"DLR", name:"数字地产",   weight:3.8,divYield:3.3,divGrowth:5, pe:36.1,fcf:1.4,streak:13},
      {ticker:"PSA", name:"公共储存",   weight:3.5,divYield:4.4,divGrowth:3, pe:27.8,fcf:1.6,streak:8},
      {ticker:"O",   name:"Realty Income",weight:3.2,divYield:5.8,divGrowth:4,pe:45.2,fcf:1.3,streak:25},
      {ticker:"EXR", name:"Extra Space", weight:2.9,divYield:4.1,divGrowth:5, pe:26.3,fcf:1.5,streak:12},
      {ticker:"AVB", name:"AvalonBay",  weight:2.7,divYield:3.3,divGrowth:4, pe:28.4,fcf:1.4,streak:11},
    ],
    annualReturns:[
      {y:"2013",r:2.9},{y:"2014",r:30.3},{y:"2015",r:2.4},{y:"2016",r:8.5},
      {y:"2017",r:5.0},{y:"2018",r:-5.9},{y:"2019",r:29.0},{y:"2020",r:-4.7},
      {y:"2021",r:40.4},{y:"2022",r:-26.2},{y:"2023",r:12.2},{y:"2024",r:8.9},
    ],
    monthly:[
      ["2012-01",59.2,0.7],["2012-03",62.1,0.71],["2012-06",61.3,0.72],["2012-09",66.7,0.74],["2012-12",62.4,0.76],
      ["2013-03",72.3,0.74],["2013-06",63.4,0.78],["2013-09",65.2,0.80],["2013-12",64.2,0.83],
      ["2014-03",73.1,0.80],["2014-06",76.4,0.84],["2014-09",80.3,0.88],["2014-12",83.6,0.91],
      ["2015-03",86.2,0.88],["2015-06",82.3,0.92],["2015-09",78.4,0.93],["2015-12",85.5,0.97],
      ["2016-03",87.4,0.94],["2016-06",91.2,0.98],["2016-09",92.3,1.02],["2016-12",82.7,1.06],
      ["2017-03",83.4,1.03],["2017-06",84.1,1.07],["2017-09",85.3,1.11],["2017-12",86.9,1.15],
      ["2018-03",79.4,1.11],["2018-06",83.2,1.16],["2018-09",84.3,1.21],["2018-12",81.8,1.26],
      ["2019-03",89.3,1.22],["2019-06",94.2,1.27],["2019-09",97.4,1.32],["2019-12",105.8,1.37],
      ["2020-03",72.1,1.32],["2020-06",82.3,1.37],["2020-09",84.1,1.42],["2020-12",100.8,1.47],
      ["2021-03",112.4,1.43],["2021-06",124.3,1.49],["2021-09",127.4,1.55],["2021-12",141.3,1.61],
      ["2022-03",122.4,1.56],["2022-06",97.3,1.62],["2022-09",93.2,1.68],["2022-12",104.3,1.74],
      ["2023-03",108.4,1.69],["2023-06",107.2,1.75],["2023-09",98.3,1.81],["2023-12",116.9,1.87],
      ["2024-03",120.3,1.82],["2024-06",118.4,1.88],["2024-09",130.2,1.95],["2024-12",127.4,2.01],
    ],
  },
};

/* ═══════════════════════════════════════════════════════════
   BUBBLE CONFIG — dynamic axes per ETF category
═══════════════════════════════════════════════════════════ */
const BUBBLE_CONFIG = {
  "高股息":   { xKey:"divYield", yKey:"divGrowth", xMax:10, yMax:16, xLabel:"股息率", yLabel:"股息增长率", xFmt:v=>`${v}%`, yFmt:v=>`${v}%/yr` },
  "股息成长": { xKey:"divYield", yKey:"divGrowth", xMax:10, yMax:16, xLabel:"股息率", yLabel:"股息增长率", xFmt:v=>`${v}%`, yFmt:v=>`${v}%/yr` },
  "大盘指数": { xKey:"pe",       yKey:"fcf",       xMax:80, yMax:5,  xLabel:"市盈率 PE", yLabel:"FCF 覆盖率", xFmt:v=>`${v}x`, yFmt:v=>`${v}x` },
  "科技成长": { xKey:"pe",       yKey:"fcf",       xMax:80, yMax:5,  xLabel:"市盈率 PE", yLabel:"FCF 覆盖率", xFmt:v=>`${v}x`, yFmt:v=>`${v}x` },
  "国际股票": { xKey:"divYield", yKey:"pe",        xMax:10, yMax:40, xLabel:"股息率",    yLabel:"市盈率 PE",   xFmt:v=>`${v}%`, yFmt:v=>`${v}x` },
  "房地产":   { xKey:"divYield", yKey:"pe",        xMax:10, yMax:80, xLabel:"股息率",    yLabel:"市盈率 PE",   xFmt:v=>`${v}%`, yFmt:v=>`${v}x` },
  "债券":     { xKey:"divYield", yKey:"weight",    xMax:8,  yMax:20, xLabel:"收益率",    yLabel:"配置权重 %",  xFmt:v=>`${v}%`, yFmt:v=>`${v}%` },
};
const BUBBLE_DEFAULT = BUBBLE_CONFIG["高股息"];

/* ═══════════════════════════════════════════════════════════
   COMPUTED DATA HELPERS
═══════════════════════════════════════════════════════════ */
function buildTR(monthly) {
  let shares = 1;
  return monthly.map(([date, price, div]) => {
    if (div > 0) shares += (shares * div) / price;
    return { date, price, tr: parseFloat((shares * price).toFixed(2)), div };
  });
}

function buildDD(tr) {
  let peak = tr[0].price;
  return tr.map(d => {
    if (d.price > peak) peak = d.price;
    return { ...d, dd: parseFloat(((d.price - peak) / peak * 100).toFixed(2)) };
  });
}

function buildDCA(monthly, amt) {
  let shares = 0, invested = 0;
  return monthly.map(([date, price, div]) => {
    shares += amt / price;
    invested += amt;
    if (div > 0) shares += (shares * div) / price;
    return { date, value: Math.round(shares * price), invested };
  });
}

function calcCAGR(monthly) {
  if (monthly.length < 2) return 0;
  const first = monthly[0][1], last = monthly[monthly.length - 1][1];
  const years = monthly.length / 12;
  return parseFloat(((Math.pow(last / first, 1 / years) - 1) * 100).toFixed(1));
}

/** Dynamic XAxis interval: show ~12-15 labels max regardless of data length */
function dateInterval(dataLen, mobile = false) {
  if (dataLen <= 15) return 0;
  return Math.max(1, Math.floor(dataLen / (mobile ? 6 : 13)));
}

/** Compute average recovery months per drawdown range from dd array */
function computeRecoveryByRange(ddArr) {
  const bins = [
    { range:"5–10%", min:5, max:10, color:"#86efac" },
    { range:"10–15%", min:10, max:15, color:"#f59e0b" },
    { range:"15–20%", min:15, max:20, color:"#fb923c" },
    { range:"20–30%", min:20, max:30, color:"#f87171" },
    { range:">30%", min:30, max:999, color:"#dc2626" },
  ];
  // Find drawdown episodes: contiguous periods below 0
  const episodes = [];
  let inDD = false, maxDrop = 0, startIdx = 0;
  for (let i = 0; i < ddArr.length; i++) {
    if (ddArr[i].dd < -1) { // below -1% threshold to filter noise
      if (!inDD) { inDD = true; startIdx = i; maxDrop = 0; }
      maxDrop = Math.max(maxDrop, Math.abs(ddArr[i].dd));
    } else if (inDD) {
      episodes.push({ maxDrop, months: i - startIdx });
      inDD = false;
    }
  }
  if (inDD) episodes.push({ maxDrop, months: ddArr.length - startIdx });

  return bins.map(b => {
    const matching = episodes.filter(e => e.maxDrop >= b.min && e.maxDrop < b.max);
    const avg = matching.length > 0
      ? parseFloat((matching.reduce((s, e) => s + e.months, 0) / matching.length).toFixed(1))
      : 0;
    return { range: b.range, avgMonths: avg, count: matching.length, color: b.color };
  }).filter(b => b.count > 0);
}

/* ═══════════════════════════════════════════════════════════
   NAV SECTIONS
═══════════════════════════════════════════════════════════ */
const NAV = [
  { id:"overview",     icon:"◈", label:"概览" },
  { id:"return",       icon:"◎", label:"收益分析" },
  { id:"risk",         icon:"◉", label:"风险回调" },
  { id:"buystrategy",  icon:"◎", label:"买入策略" },
  { id:"holdings",     icon:"◧", label:"持仓分析" },
  { id:"compare",      icon:"◐", label:"横向对比" },
  { id:"retirement",   icon:"◭", label:"退休规划" },
  { id:"conclusion",   icon:"◆", label:"投资结论" },
];

/* ═══════════════════════════════════════════════════════════
   TOOLTIP
═══════════════════════════════════════════════════════════ */
const TT = ({ active, payload, label, money }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background:"#0c1018", border:`1px solid #243040`, borderRadius:8, padding:"10px 14px", fontSize:12 }}>
      <div style={{ color:D.muted, marginBottom:5, fontWeight:600 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color:p.color||D.text, marginBottom:2 }}>
          {p.name}: <strong>
            {money ? `$${Number(p.value).toLocaleString()}` : `${Number(p.value)>0&&!String(p.value).startsWith("-")?"+":""}${p.value}%`}
          </strong>
        </div>
      ))}
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════
   BUY STRATEGY COMPONENT (now a full standalone page)
═══════════════════════════════════════════════════════════ */
function BuyStrategy({ etf, card, sectionTitle, isMobile=false }) {
  const g2r = isMobile ? "1fr" : "repeat(2,1fr)";
  const g3 = isMobile ? "1fr" : "repeat(3,1fr)";
  const g4 = isMobile ? "repeat(2,1fr)" : "repeat(4,1fr)";
  const chartH = isMobile ? 180 : 220;
  const [cap, setCap] = useState(10000);
  const [mult, setMult] = useState({ a:1.5, b:2.5, c:4.0, d:6.0 });

  const tranches = [
    { label:"底仓",      pct:40, trigger:"立即建仓", color:etf.color },
    { label:"第一批加仓", pct:20, trigger:"回调 5–10%",   color:"#86efac" },
    { label:"第二批加仓", pct:20, trigger:"回调 10–15%",  color:"#f59e0b" },
    { label:"第三批加仓", pct:15, trigger:"回调 15–20%",  color:"#fb923c" },
    { label:"黑天鹅备用", pct:5,  trigger:"回调 > 20%",   color:D.red },
  ];

  // Backtest: Pyramid vs plain DCA using monthly data
  const backtest = useMemo(() => {
    const base = 500;
    let pyrShares = 0, pyrInvested = 0;
    let dcaShares = 0, dcaInvested = 0;
    let peak = etf.monthly[0][1];
    const rows = [];
    for (let i = 0; i < etf.monthly.length; i++) {
      const [date, price, div] = etf.monthly[i];
      if (price > peak) peak = price;
      const dd = (price - peak) / peak * 100;
      const absDD = Math.abs(dd);
      let factor = 1;
      if (absDD >= 30) factor = mult.d;
      else if (absDD >= 20) factor = mult.c;
      else if (absDD >= 10) factor = mult.b;
      else if (absDD >= 5)  factor = mult.a;
      const pyrAmt = base * factor;
      pyrShares += pyrAmt / price;
      pyrInvested += pyrAmt;
      dcaShares += base / price;
      dcaInvested += base;
      if (div > 0) {
        pyrShares += (pyrShares * div) / price;
        dcaShares += (dcaShares * div) / price;
      }
      rows.push({ date, factor, dd: parseFloat(dd.toFixed(1)), pyramid: Math.round(pyrShares * price), dca: Math.round(dcaShares * price), pyrInvested: Math.round(pyrInvested), dcaInvested: Math.round(dcaInvested) });
    }
    return rows;
  }, [etf.monthly, mult]);

  const lastBT = backtest[backtest.length - 1] || {};
  const extraReturn = lastBT.pyramid && lastBT.dca ? lastBT.pyramid - lastBT.dca : 0;
  const pyrROI = lastBT.pyrInvested ? ((lastBT.pyramid / lastBT.pyrInvested - 1) * 100).toFixed(1) : 0;
  const dcaROI = lastBT.dcaInvested ? ((lastBT.dca / lastBT.dcaInvested - 1) * 100).toFixed(1) : 0;

  // Historical multiplier timeline data (sample every 3 months for readability)
  const timelineData = useMemo(() => {
    return backtest.filter((_, i) => i % 2 === 0 || backtest[i]?.factor > 1).map(r => ({
      date: r.date,
      factor: r.factor,
      dd: r.dd,
    }));
  }, [backtest]);

  const factorColor = f => f >= 6 ? D.red : f >= 4 ? "#fb923c" : f >= 2.5 ? "#f59e0b" : f >= 1.5 ? "#86efac" : D.muted;

  return (
    <div>
      {sectionTitle && sectionTitle("买入策略", `SECTION 04 · BUY STRATEGY · ${etf.name}`)}

      {/* Pyramid rules table */}
      <div style={{ ...card, marginBottom:20 }}>
        <div style={{ fontSize:11, letterSpacing:2, color:D.muted, marginBottom:14 }}>金字塔加仓规则</div>
        <div style={{ overflowX:"auto" }}>
          <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12, minWidth:500 }}>
            <thead>
              <tr style={{ borderBottom:`1px solid ${D.border2}` }}>
                {["回调区间","加仓倍数","月投入（基础$500）","策略理念"].map(h => (
                  <th key={h} style={{ padding:"8px 10px", textAlign:"left", color:D.muted, fontWeight:600, fontSize:11, letterSpacing:1 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                { range:"0–5%",  factor:"1.0x", amt:"$500",   idea:"正常定投，保持节奏", color:D.muted },
                { range:"5–10%", factor:`${mult.a}x`, amt:`$${Math.round(500*mult.a)}`, idea:"小幅加仓，利用短期波动", color:"#86efac" },
                { range:"10–20%",factor:`${mult.b}x`, amt:`$${Math.round(500*mult.b)}`, idea:"显著加仓，市场恐慌是机会", color:"#f59e0b" },
                { range:"20–30%",factor:`${mult.c}x`, amt:`$${Math.round(500*mult.c)}`, idea:"大幅加仓，历史级别买入窗口", color:"#fb923c" },
                { range:">30%",  factor:`${mult.d}x`, amt:`$${Math.round(500*mult.d)}`, idea:"全力加仓，极端恐慌=极端机会", color:D.red },
              ].map((r,i) => (
                <tr key={i} style={{ borderBottom:`1px solid ${D.border}` }}>
                  <td style={{ padding:"9px 10px", color:r.color, fontWeight:700 }}>{r.range}</td>
                  <td style={{ padding:"9px 10px", color:r.color, fontWeight:800, fontFamily:"monospace" }}>{r.factor}</td>
                  <td style={{ padding:"9px 10px", color:D.text, fontFamily:"monospace" }}>{r.amt}</td>
                  <td style={{ padding:"9px 10px", color:D.muted, fontSize:11 }}>{r.idea}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Capital allocation pyramid */}
      <div style={{ ...card, marginBottom:20 }}>
        <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:16, flexWrap:"wrap" }}>
          <span style={{ fontSize:12, color:D.muted }}>计划总资金：</span>
          {[5000,10000,20000,50000].map(v => (
            <button key={v} onClick={() => setCap(v)} style={{
              background: cap===v ? `${etf.color}15` : D.surface,
              border: `1px solid ${cap===v ? etf.color : D.border}`,
              borderRadius:6, padding:"4px 12px",
              color: cap===v ? etf.color : D.muted,
              cursor:"pointer", fontFamily:"inherit", fontSize:12,
            }}>${v.toLocaleString()}</button>
          ))}
        </div>
        <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:4, marginBottom:20 }}>
          {tranches.map((t,i) => {
            const w = 35 + t.pct * 1.6;
            return (
              <div key={i} style={{
                width:`${w}%`, minWidth:240,
                background:`${t.color}10`, border:`1px solid ${t.color}30`,
                borderRadius:6, padding:"8px 14px",
                display:"flex", justifyContent:"space-between",
              }}>
                <div>
                  <span style={{ fontSize:12, fontWeight:700, color:t.color }}>{t.label}</span>
                  <span style={{ fontSize:11, color:D.muted, marginLeft:8 }}>{t.trigger}</span>
                </div>
                <span style={{ fontSize:12, fontWeight:800, color:D.text }}>
                  ${Math.round(cap * t.pct / 100).toLocaleString()}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Adjustable multiplier sliders */}
      <div style={{ ...card, marginBottom:20 }}>
        <div style={{ fontSize:11, letterSpacing:2, color:D.muted, marginBottom:14 }}>可调回调加倍倍率</div>
        <div style={{ display:"grid", gridTemplateColumns:g2r, gap:12 }}>
          {[
            { key:"a", label:"回调 5–10%", color:"#86efac" },
            { key:"b", label:"回调 10–20%", color:"#f59e0b" },
            { key:"c", label:"回调 20–30%", color:"#fb923c" },
            { key:"d", label:"回调 >30%", color:D.red },
          ].map(s => (
            <div key={s.key}>
              <div style={{ display:"flex", justifyContent:"space-between", fontSize:11, marginBottom:3 }}>
                <span style={{ color:s.color }}>{s.label}</span>
                <span style={{ color:s.color, fontWeight:800, fontFamily:"monospace" }}>{mult[s.key]}x</span>
              </div>
              <input type="range" min={1} max={10} step={0.5} value={mult[s.key]}
                onChange={e => setMult(p => ({ ...p, [s.key]: Number(e.target.value) }))}
                style={{ width:"100%", accentColor:s.color }}/>
            </div>
          ))}
        </div>
      </div>

      {/* Backtest result cards */}
      <div style={{ display:"grid", gridTemplateColumns:g4, gap:10, marginBottom:16 }}>
        {[
          { label:"金字塔市值", val:`$${(lastBT.pyramid||0).toLocaleString()}`, color:etf.color },
          { label:"普通DCA市值", val:`$${(lastBT.dca||0).toLocaleString()}`, color:D.muted },
          { label:"额外收益", val:`$${extraReturn.toLocaleString()}`, color:extraReturn>0?D.green:D.red },
          { label:"收益率对比", val:`${pyrROI}% vs ${dcaROI}%`, color:D.accent },
        ].map((m,i) => (
          <div key={i} style={{ background:D.surface, border:`1px solid ${D.border}`, borderRadius:8, padding:"10px 8px", textAlign:"center" }}>
            <div style={{ fontSize:15, fontWeight:900, color:m.color, fontFamily:"monospace" }}>{m.val}</div>
            <div style={{ fontSize:10, color:D.muted, marginTop:4 }}>{m.label}</div>
          </div>
        ))}
      </div>

      {/* Backtest area chart */}
      <div style={{ ...card, marginBottom:20 }}>
        <div style={{ fontSize:11, letterSpacing:2, color:D.muted, marginBottom:8 }}>金字塔策略 vs 普通DCA — 历史回测</div>
        <ResponsiveContainer width="100%" height={chartH}>
          <AreaChart data={backtest} margin={{top:4,right:8,left:0,bottom:0}}>
            <defs>
              <linearGradient id="pyrGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor={etf.color} stopOpacity={0.3}/>
                <stop offset="95%" stopColor={etf.color} stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={D.border}/>
            <XAxis dataKey="date" tick={{fill:D.muted,fontSize:10}} interval={dateInterval(backtest.length, isMobile)}/>
            <YAxis tick={{fill:D.muted,fontSize:10}} tickFormatter={v=>`$${(v/1000).toFixed(0)}k`}/>
            <Tooltip content={<TT money/>}/>
            <Area type="monotone" dataKey="pyramid" name="金字塔策略" stroke={etf.color} fill="url(#pyrGrad)" strokeWidth={2} dot={false}/>
            <Area type="monotone" dataKey="dca"     name="普通DCA"   stroke={D.muted}   fill="none"          strokeWidth={1.5} dot={false} strokeDasharray="4 3"/>
            <Legend wrapperStyle={{fontSize: isMobile ? 10 : 11, paddingTop: isMobile ? 8 : 0}}/>
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Historical multiplier timeline chart */}
      <div style={{ ...card, marginBottom:20 }}>
        <div style={{ fontSize:11, letterSpacing:2, color:D.muted, marginBottom:10 }}>历史加仓倍数时间线（颜色=触发倍数）</div>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={timelineData} margin={{top:4,right:8,left:0,bottom:0}}>
            <CartesianGrid strokeDasharray="3 3" stroke={D.border}/>
            <XAxis dataKey="date" tick={{fill:D.muted,fontSize:10}} interval={Math.max(1, Math.floor(timelineData.length/(isMobile ? 7 : 15)))}/>
            <YAxis tick={{fill:D.muted,fontSize:10}} domain={[0, Math.max(mult.d+1, 8)]} tickFormatter={v=>`${v}x`}/>
            <Tooltip contentStyle={{background:D.card,border:`1px solid ${D.border}`,fontSize:12}}
              formatter={(v,name) => name==="factor" ? [`${v}x`,"加仓倍数"] : [`${v}%`,"回撤"]}/>
            <Bar dataKey="factor" name="factor" radius={[2,2,0,0]}>
              {timelineData.map((d,i) => <Cell key={i} fill={factorColor(d.factor)}/>)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Three advice cards */}
      <div style={{ display:"grid", gridTemplateColumns:g3, gap:14 }}>
        {[
          { icon:"💰", title:"资金管理", body:"总仓位不超过可投资金的40%用于单一ETF，保留现金应对极端回调机会。切勿All-in单次买入。", color:"#38bdf8" },
          { icon:"📏", title:"纪律执行", body:"严格按预设倍数执行，不受市场情绪影响。回调时恐惧是正常的，但数据证明纪律性买入长期收益更高。", color:"#f59e0b" },
          { icon:"🔭", title:"长期视角", body:"金字塔策略的优势需要完整市场周期（7-10年）才能充分体现。短期可能跑输纯DCA，但熊市后反弹更强。", color:D.green },
        ].map((c,i) => (
          <div key={i} style={{ ...card, borderTop:`3px solid ${c.color}` }}>
            <div style={{ fontSize:22, marginBottom:6 }}>{c.icon}</div>
            <div style={{ fontSize:13, fontWeight:800, color:c.color, marginBottom:8 }}>{c.title}</div>
            <div style={{ fontSize:12, color:D.text, lineHeight:1.8 }}>{c.body}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   RETIREMENT SECTION — enhanced with all missing charts
═══════════════════════════════════════════════════════════ */
function RetirementSection({ etf, card, isMobile=false }) {
  const g2r = isMobile ? "1fr" : "repeat(2,1fr)";
  const g3 = isMobile ? "1fr" : "repeat(3,1fr)";
  const gSide = isMobile ? "1fr" : "240px 1fr";
  const chartH = isMobile ? 180 : 220;
  const [age,       setAge]       = useState(25);
  const [retire,    setRetire]    = useState(60);
  const [assets,    setAssets]    = useState(100000);
  const [monthly,   setMonthly]   = useState(1000);
  const [target,    setTarget]    = useState(10000);
  const [ret,       setRet]       = useState(10);
  const [dg,        setDg]        = useState(etf.divGrowth);
  const [showTable, setShowTable] = useState(false);

  const years = Math.max(retire - age, 1);

  const sim = useMemo(() => {
    const rows = [];
    let a = assets;
    for (let y = 1; y <= years; y++) {
      a = a * (1 + ret/100) + monthly * 12;
      const schdPct = age+y < 40 ? 0.4 : age+y < 50 ? 0.6 : 0.8;
      const yoc = (etf.divYield/100) * Math.pow(1 + dg/100, y);
      const mDiv = Math.round(a * schdPct * yoc / 12);
      const annualDiv = mDiv * 12;
      rows.push({ y, age: age+y, assets: Math.round(a), schdPart: Math.round(a * schdPct), yoc: +(yoc*100).toFixed(2), monthlyDiv: mDiv, annualDiv });
    }
    return rows;
  }, [age, retire, assets, monthly, ret, dg, etf.divYield, years]);

  const final   = sim[sim.length - 1] || {};
  const hitAge  = sim.find(r => r.monthlyDiv >= target);

  return (
    <div>
      <div style={{ display:"grid", gridTemplateColumns:gSide, gap:16, marginBottom:20 }}>
        <div style={{ ...card }}>
          <div style={{ fontSize:11, letterSpacing:2, color:D.muted, marginBottom:14 }}>参数配置</div>
          {[
            { label:"当前年龄",    val:age,     set:setAge,     min:22, max:58,     step:1,    unit:"岁",  fmt:false },
            { label:"退休年龄",    val:retire,  set:setRetire,  min:40, max:70,     step:1,    unit:"岁",  fmt:false },
            { label:"现有资产",    val:assets,  set:setAssets,  min:0,  max:1000000,step:5000, unit:"$",   fmt:true },
            { label:"月定投",      val:monthly, set:setMonthly, min:0,  max:10000,  step:100,  unit:"$",   fmt:true },
            { label:"收入目标/月", val:target,  set:setTarget,  min:2000,max:50000, step:500,  unit:"$",   fmt:true },
            { label:"年化总回报",  val:ret,     set:setRet,     min:5,  max:15,     step:0.5,  unit:"%",   fmt:false },
            { label:"股息年增率",  val:dg,      set:setDg,      min:2,  max:20,     step:0.5,  unit:"%",   fmt:false },
          ].map((p,i) => (
            <div key={i} style={{ marginBottom:12 }}>
              <div style={{ display:"flex", justifyContent:"space-between", fontSize:11, marginBottom:3 }}>
                <span style={{ color:D.muted }}>{p.label}</span>
                <span style={{ color:etf.color, fontWeight:700, fontFamily:"monospace" }}>
                  {p.unit==="$" ? `$${p.fmt?p.val.toLocaleString():p.val}` : `${p.val}${p.unit}`}
                </span>
              </div>
              <input type="range" min={p.min} max={p.max} step={p.step} value={p.val}
                onChange={e => p.set(Number(e.target.value))}
                style={{ width:"100%", accentColor:etf.color }}/>
            </div>
          ))}
        </div>

        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
          <div style={{ display:"grid", gridTemplateColumns:g2r, gap:10 }}>
            {[
              { label:"退休时总资产",     val:`$${(final.assets||0).toLocaleString()}`,   color:etf.color },
              { label:"退休时月股息",     val:`$${(final.monthlyDiv||0).toLocaleString()}`, color: (final.monthlyDiv||0)>=target?D.green:D.red },
              { label:"届时 Yield on Cost", val:`${final.yoc||0}%`,                     color:D.accent },
              { label:"总投入倍数",       val:`${((final.assets||0)/(assets+monthly*12*years)).toFixed(1)}x`, color:D.purple },
            ].map((m,i) => (
              <div key={i} style={{ ...card, textAlign:"center", borderTop:`3px solid ${m.color}` }}>
                <div style={{ fontSize:22, fontWeight:900, color:m.color, fontFamily:"monospace" }}>{m.val}</div>
                <div style={{ fontSize:11, color:D.muted, marginTop:4 }}>{m.label}</div>
              </div>
            ))}
          </div>

          {hitAge && (
            <div style={{ background:`${hitAge.age<=retire?D.green:D.orange}10`, border:`1px solid ${hitAge.age<=retire?D.green:D.orange}30`, borderRadius:8, padding:"10px 14px", fontSize:12, color:hitAge.age<=retire?D.green:D.orange }}>
              {hitAge.age<=retire
                ? `🎯 ${hitAge.age}岁月股息达 $${target.toLocaleString()}，提前 ${retire-hitAge.age} 年可 FIRE`
                : `⚠ 需到 ${hitAge.age} 岁才能达标，建议增加月定投`}
            </div>
          )}

          {/* Asset growth chart (left side of split) */}
          <div style={{ ...card }}>
            <div style={{ fontSize:11, letterSpacing:2, color:D.muted, marginBottom:10 }}>资产增长预测</div>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={sim} margin={{top:4,right:8,left:0,bottom:0}}>
                <defs>
                  <linearGradient id="retGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor={etf.color} stopOpacity={0.3}/>
                    <stop offset="95%" stopColor={etf.color} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={D.border}/>
                <XAxis dataKey="age" tick={{fill:D.muted,fontSize:10}}/>
                <YAxis tick={{fill:D.muted,fontSize:10}} tickFormatter={v=>`$${(v/1e6).toFixed(1)}M`}/>
                <Tooltip content={<TT money/>}/>
                <Area type="monotone" dataKey="assets" name="总资产" stroke={etf.color} fill="url(#retGrad)" strokeWidth={2} dot={false}/>
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Monthly dividend bar chart — separate */}
      <div style={{ ...card, marginBottom:20 }}>
        <div style={{ fontSize:11, letterSpacing:2, color:D.muted, marginBottom:10 }}>月股息收入预测（达标后变绿）</div>
        <ResponsiveContainer width="100%" height={chartH}>
          <BarChart data={sim} margin={{top:4,right:8,left:0,bottom:0}}>
            <CartesianGrid strokeDasharray="3 3" stroke={D.border}/>
            <XAxis dataKey="age" tick={{fill:D.muted,fontSize:10}}/>
            <YAxis tick={{fill:D.muted,fontSize:10}} tickFormatter={v=>`$${v.toLocaleString()}`}/>
            <ReferenceLine y={target} stroke={D.red} strokeDasharray="4 3"
              label={{value:`目标$${target.toLocaleString()}/月`,fill:D.red,fontSize:10,position:"right"}}/>
            <Tooltip contentStyle={{background:D.card,border:`1px solid ${D.border}`,fontSize:12}}
              formatter={v=>[`$${Number(v).toLocaleString()}`,"月股息"]}/>
            <Bar dataKey="monthlyDiv" name="月股息" radius={[2,2,0,0]}>
              {sim.map((d,i) => <Cell key={i} fill={d.monthlyDiv >= target ? D.green : etf.color}/>)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Yield on Cost compounding effect chart */}
      <div style={{ ...card, marginBottom:20 }}>
        <div style={{ fontSize:11, letterSpacing:2, color:D.muted, marginBottom:10 }}>Yield on Cost 复利效应</div>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={sim} margin={{top:4,right:8,left:0,bottom:0}}>
            <defs>
              <linearGradient id="yocRetGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor={D.accent} stopOpacity={0.4}/>
                <stop offset="95%" stopColor={D.accent} stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={D.border}/>
            <XAxis dataKey="age" tick={{fill:D.muted,fontSize:10}}/>
            <YAxis tick={{fill:D.muted,fontSize:10}} tickFormatter={v=>`${v}%`}/>
            <Tooltip contentStyle={{background:D.card,border:`1px solid ${D.border}`,fontSize:12}}
              formatter={v=>[`${v}%`,"YoC"]}/>
            <Area type="monotone" dataKey="yoc" name="Yield on Cost" stroke={D.accent} fill="url(#yocRetGrad)" strokeWidth={2} dot={false}/>
            <ReferenceLine y={etf.divYield} stroke={D.muted} strokeDasharray="3 2" label={{value:`初始${etf.divYield}%`,fill:D.muted,fontSize:10}}/>
            <ReferenceLine y={10} stroke={D.orange} strokeDasharray="3 2" label={{value:"10% YoC",fill:D.orange,fontSize:10}}/>
            <ReferenceLine y={20} stroke={D.green} strokeDasharray="3 2" label={{value:"20% YoC",fill:D.green,fontSize:10}}/>
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Collapsible yearly data table */}
      <div style={{ ...card, marginBottom:20 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", cursor:"pointer" }} onClick={() => setShowTable(v => !v)}>
          <div style={{ fontSize:11, letterSpacing:2, color:D.muted }}>逐年详细数据表</div>
          <span style={{ fontSize:12, color:D.muted }}>{showTable ? "▲ 收起" : "▼ 展开"}</span>
        </div>
        {showTable && (
          <div style={{ overflowX:"auto", marginTop:14 }}>
            <table style={{ width:"100%", borderCollapse:"collapse", fontSize:11, minWidth:600 }}>
              <thead>
                <tr style={{ borderBottom:`1px solid ${D.border2}` }}>
                  {["年龄","总资产","ETF配置部分","YoC","月股息","年股息"].map(h => (
                    <th key={h} style={{ padding:"6px 8px", textAlign:"center", color:D.muted, fontWeight:600, fontSize:10, letterSpacing:1 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sim.filter((_,i) => i % Math.max(1, Math.floor(sim.length / 20)) === 0 || i === sim.length - 1).map((r,i) => (
                  <tr key={i} style={{ borderBottom:`1px solid ${D.border}`, background: r.monthlyDiv >= target ? `${D.green}08` : "transparent" }}>
                    <td style={{ padding:"6px 8px", textAlign:"center", color:D.text, fontWeight:700 }}>{r.age}岁</td>
                    <td style={{ padding:"6px 8px", textAlign:"center", color:etf.color, fontFamily:"monospace" }}>${r.assets.toLocaleString()}</td>
                    <td style={{ padding:"6px 8px", textAlign:"center", color:D.muted, fontFamily:"monospace" }}>${r.schdPart.toLocaleString()}</td>
                    <td style={{ padding:"6px 8px", textAlign:"center", color:D.accent, fontFamily:"monospace" }}>{r.yoc}%</td>
                    <td style={{ padding:"6px 8px", textAlign:"center", color:r.monthlyDiv >= target ? D.green : D.text, fontWeight:700, fontFamily:"monospace" }}>${r.monthlyDiv.toLocaleString()}</td>
                    <td style={{ padding:"6px 8px", textAlign:"center", color:D.muted, fontFamily:"monospace" }}>${r.annualDiv.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Three key assumption/warning cards */}
      <div style={{ display:"grid", gridTemplateColumns:g3, gap:14 }}>
        {[
          { icon:"📊", title:"假设基础", body:`模型假设年化总回报${ret}%、股息年增${dg}%，基于历史数据。实际表现会因市场周期波动，建议用保守参数（-2%）做压力测试。`, color:"#38bdf8" },
          { icon:"💸", title:"未计入的成本", body:"本模型未扣除：通胀侵蚀（年均2-3%）、资本利得税、州税、医疗保险、提前取款罚金。实际可用收入需打7-8折。", color:"#fb923c" },
          { icon:"🎲", title:"最大的变量", body:"序列回报风险：退休前5年遇到熊市会严重影响结果。建议退休前逐步降低股票比例，保留2-3年现金缓冲。", color:D.red },
        ].map((c,i) => (
          <div key={i} style={{ ...card, borderTop:`3px solid ${c.color}` }}>
            <div style={{ fontSize:22, marginBottom:6 }}>{c.icon}</div>
            <div style={{ fontSize:13, fontWeight:800, color:c.color, marginBottom:8 }}>{c.title}</div>
            <div style={{ fontSize:12, color:D.text, lineHeight:1.8 }}>{c.body}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   HOLDINGS SECTION — proper component (fixes hooks-in-IIFE)
═══════════════════════════════════════════════════════════ */
function HoldingsSection({ etf, selectedTicker, card, sectionTitle, isMobile=false }) {
  const g2 = isMobile ? "1fr" : "1fr 1fr";
  const g4 = isMobile ? "repeat(2,1fr)" : "repeat(4,1fr)";
  const [selH, setSelH] = useState(null);
  const sel = selH !== null ? etf.holdings[selH] : null;

  // Valuation averages
  const avgPE = etf.holdings.filter(h => h.pe > 0).reduce((s, h) => s + h.pe, 0) / Math.max(etf.holdings.filter(h => h.pe > 0).length, 1);
  const avgFCF = etf.holdings.reduce((s, h) => s + h.fcf, 0) / etf.holdings.length;
  const avgStreak = etf.holdings.reduce((s, h) => s + h.streak, 0) / etf.holdings.length;

  return (
    <div>
      {sectionTitle("持仓分析", `SECTION 05 · HOLDINGS ANALYSIS · ${selectedTicker}`)}

      {/* Fund overview cards */}
      <div style={{ display:"grid", gridTemplateColumns:g4, gap:12, marginBottom:20 }}>
        {[
          { label:"当前价格", val:`$${etf.monthly[etf.monthly.length-1]?.[1] || "N/A"}`, color:etf.color },
          { label:"股息率", val:`${etf.divYield}%`, color:D.green },
          { label:"费用率", val:`${etf.er}%`, color:D.muted },
          { label:"前10大持仓数", val:`${etf.holdings.length}`, color:D.accent },
        ].map((s,i) => (
          <div key={i} style={{ ...card, textAlign:"center", borderTop:`3px solid ${s.color}` }}>
            <div style={{ fontSize:22, fontWeight:900, color:s.color, fontFamily:"monospace" }}>{s.val}</div>
            <div style={{ fontSize:11, color:D.muted, marginTop:4 }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display:"grid", gridTemplateColumns:g2, gap:16, marginBottom:20 }}>
        {/* Top 10 holdings list */}
        <div style={{ ...card }}>
          <div style={{ fontSize:11, letterSpacing:2, color:D.muted, marginBottom:14 }}>前10大持仓</div>
          {etf.holdings.map((h,i) => (
            <div key={i} onClick={() => setSelH(selH===i?null:i)} style={{
              display:"flex", alignItems:"center", gap:8,
              padding:"7px 8px", marginBottom:3,
              background: selH===i ? `${etf.color}12` : "transparent",
              border:`1px solid ${selH===i?etf.color+"40":"transparent"}`,
              borderRadius:6, cursor:"pointer",
            }}>
              <div style={{ width:14, fontSize:11, fontWeight:700, color:D.muted }}>{i+1}</div>
              <div style={{ width:40, fontSize:11, fontWeight:900, color:etf.color, fontFamily:"monospace" }}>{h.ticker}</div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:11, color:D.text, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{h.name}</div>
              </div>
              <div style={{ flex:1, height:6, background:D.dim, borderRadius:3, minWidth:40 }}>
                <div style={{ height:"100%", width:`${h.weight*12}%`, background:`linear-gradient(90deg,${etf.color}60,${etf.color})`, borderRadius:3 }}/>
              </div>
              <div style={{ width:36, textAlign:"right", fontSize:12, fontWeight:700, color:etf.color, fontFamily:"monospace" }}>{h.weight}%</div>
            </div>
          ))}
        </div>

        {/* Sector pie chart + table */}
        <div style={{ ...card }}>
          <div style={{ fontSize:11, letterSpacing:2, color:D.muted, marginBottom:14 }}>行业分布</div>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={etf.sectors} dataKey="pct" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={2}>
                {etf.sectors.map((s,i) => <Cell key={i} fill={ETF_PALETTE[i % ETF_PALETTE.length]}/>)}
              </Pie>
              <Tooltip contentStyle={{background:D.card,border:`1px solid ${D.border}`,fontSize:12}}
                formatter={v=>[`${v}%`]}/>
            </PieChart>
          </ResponsiveContainer>
          <div style={{ marginTop:8 }}>
            {etf.sectors.map((s,i) => (
              <div key={i} style={{ display:"flex", justifyContent:"space-between", fontSize:11, padding:"3px 0", borderBottom:`1px solid ${D.border}` }}>
                <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                  <div style={{ width:8, height:8, borderRadius:2, background:ETF_PALETTE[i % ETF_PALETTE.length] }}/>
                  <span style={{ color:D.text }}>{s.name}</span>
                </div>
                <span style={{ color:ETF_PALETTE[i % ETF_PALETTE.length], fontWeight:700, fontFamily:"monospace" }}>{s.pct}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Valuation metrics cards */}
      <div style={{ display:"grid", gridTemplateColumns:g4, gap:12, marginBottom:20 }}>
        {[
          { label:"平均 PE", val:`${avgPE.toFixed(1)}x`, color:avgPE < 25 ? D.green : D.orange },
          { label:"平均 FCF 覆盖率", val:`${avgFCF.toFixed(1)}x`, color:avgFCF >= 1.8 ? D.green : D.red },
          { label:"平均连续增长", val:`${avgStreak.toFixed(0)}年`, color:avgStreak >= 15 ? D.green : D.muted },
          { label:"Beta 系数", val:`${etf.beta}`, color:etf.beta <= 0.8 ? D.green : D.muted },
        ].map((s,i) => (
          <div key={i} style={{ ...card, textAlign:"center" }}>
            <div style={{ fontSize:18, fontWeight:900, color:s.color, fontFamily:"monospace" }}>{s.val}</div>
            <div style={{ fontSize:10, color:D.muted, marginTop:4 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Individual stock metrics table */}
      <div style={{ ...card, marginBottom:20 }}>
        <div style={{ fontSize:11, letterSpacing:2, color:D.muted, marginBottom:14 }}>个股深度指标</div>
        <div style={{ overflowX:"auto" }}>
          <table style={{ width:"100%", borderCollapse:"collapse", fontSize:11, minWidth:650 }}>
            <thead>
              <tr style={{ borderBottom:`1px solid ${D.border2}` }}>
                {["个股","权重","股息率","增长率","PE","FCF覆盖","连续年数","护城河"].map(h => (
                  <th key={h} style={{ padding:"6px 8px", textAlign:h==="个股"?"left":"center", color:D.muted, fontWeight:600, fontSize:10, letterSpacing:1 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {etf.holdings.map((h,i) => {
                const moat = h.streak >= 50 ? "极宽" : h.streak >= 25 ? "宽" : h.streak >= 10 ? "中等" : "窄";
                const moatColor = h.streak >= 50 ? D.accent : h.streak >= 25 ? D.green : h.streak >= 10 ? D.orange : D.red;
                return (
                  <tr key={i} style={{ borderBottom:`1px solid ${D.border}` }}>
                    <td style={{ padding:"6px 8px" }}>
                      <span style={{ fontWeight:800, color:etf.color, fontFamily:"monospace" }}>{h.ticker}</span>
                      <span style={{ color:D.muted, fontSize:10, marginLeft:6 }}>{h.name}</span>
                    </td>
                    <td style={{ padding:"6px 8px", textAlign:"center", color:D.text }}>{h.weight}%</td>
                    <td style={{ padding:"6px 8px", textAlign:"center", color:h.divYield>=3?D.green:D.muted, fontWeight:700 }}>{h.divYield}%</td>
                    <td style={{ padding:"6px 8px", textAlign:"center", color:h.divGrowth>=7?D.green:D.muted }}>{h.divGrowth}%</td>
                    <td style={{ padding:"6px 8px", textAlign:"center", color:h.pe>0&&h.pe<=25?D.green:D.muted }}>{h.pe>0?`${h.pe}x`:"N/A"}</td>
                    <td style={{ padding:"6px 8px", textAlign:"center", color:h.fcf>=1.8?D.green:D.red }}>{h.fcf}x</td>
                    <td style={{ padding:"6px 8px", textAlign:"center", color:h.streak>=20?D.green:D.muted, fontWeight:700 }}>{h.streak}年</td>
                    <td style={{ padding:"6px 8px", textAlign:"center", color:moatColor, fontWeight:700 }}>{moat}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Scatter: dynamic axes per ETF category */}
      {(() => {
        const bc = BUBBLE_CONFIG[etf.category] || BUBBLE_DEFAULT;
        return (
          <div style={{ ...card, marginBottom:20 }}>
            <div style={{ fontSize:11, letterSpacing:2, color:D.muted, marginBottom:4 }}>{bc.xLabel} vs {bc.yLabel} 散点图</div>
            <div style={{ fontSize:11, color:D.muted, marginBottom:10 }}>气泡大小 = 持仓权重</div>
            <div style={{ position:"relative", height:240, background:D.dim, borderRadius:8, overflow:"hidden" }}>
              <div style={{ position:"absolute", left:"38%", top:0, bottom:0, width:1, background:D.border }}/>
              <div style={{ position:"absolute", left:0, right:0, top:"50%", height:1, background:D.border }}/>
              {etf.holdings.map((h,i) => {
                const xVal = h[bc.xKey] ?? 0;
                const yVal = h[bc.yKey] ?? 0;
                const x = 8 + (Math.min(xVal, bc.xMax) / bc.xMax) * 84;
                const y = 84 - (Math.min(yVal, bc.yMax) / bc.yMax) * 76;
                const sz = 16 + h.weight * 4;
                return (
                  <div key={i} title={`${h.ticker}: ${bc.xLabel} ${bc.xFmt(xVal)} · ${bc.yLabel} ${bc.yFmt(yVal)}`}
                    style={{
                      position:"absolute",
                      left:`calc(${x}% - ${sz/2}px)`, top:`calc(${y}% - ${sz/2}px)`,
                      width:sz, height:sz,
                      background:`${etf.color}25`, border:`2px solid ${etf.color}`,
                      borderRadius:"50%", display:"flex", alignItems:"center",
                      justifyContent:"center", fontSize:sz>28?9:7,
                      color:etf.color, fontWeight:700, cursor:"default",
                    }}>{h.ticker}</div>
                );
              })}
              <div style={{ position:"absolute", bottom:4, left:"50%", transform:"translateX(-50%)", fontSize:10, color:D.muted }}>← {bc.xLabel}低 · 高 →</div>
              <div style={{ position:"absolute", left:4, top:"50%", transform:"translateY(-50%) rotate(-90deg)", fontSize:10, color:D.muted }}>← {bc.yLabel}低 · 高 →</div>
            </div>
          </div>
        );
      })()}

      {/* Dividend streak horizontal bars */}
      <div style={{ ...card, marginBottom:20 }}>
        <div style={{ fontSize:11, letterSpacing:2, color:D.muted, marginBottom:14 }}>股息连续增长年数</div>
        {[...etf.holdings].sort((a,b)=>b.streak-a.streak).map((h,i) => {
          const isKing = h.streak>=50, isAris = h.streak>=25;
          const bc = isKing?D.accent:isAris?D.green:h.streak>=10?D.orange:D.red;
          const label = isKing?"👑 股息之王":isAris?"🏆 股息贵族":h.streak>=10?"✓ 合格":"—";
          return (
            <div key={i} style={{ display:"flex", alignItems:"center", gap:10, marginBottom:8 }}>
              <div style={{ width:40, fontSize:11, fontWeight:700, color:etf.color, fontFamily:"monospace" }}>{h.ticker}</div>
              <div style={{ flex:1, height:8, background:D.dim, borderRadius:4 }}>
                <div style={{ height:"100%", width:`${Math.min(h.streak/65*100,100)}%`, background:bc, borderRadius:4, transition:"width 0.8s" }}/>
              </div>
              <div style={{ width:32, textAlign:"right", fontSize:12, color:bc, fontWeight:700 }}>{h.streak}年</div>
              <div style={{ fontSize:10, color:bc, minWidth:80 }}>{label}</div>
            </div>
          );
        })}
      </div>

      {/* Detail card when stock selected */}
      {sel && (
        <div style={{ ...card, borderLeft:`4px solid ${etf.color}`, background:`linear-gradient(135deg,${etf.color}05,${D.card})`, marginBottom:20 }}>
          <div style={{ display:"flex", justifyContent:"space-between", marginBottom:14, flexWrap:"wrap", gap:10 }}>
            <div>
              <div style={{ fontSize:22, fontWeight:900, color:etf.color }}>{sel.ticker}</div>
              <div style={{ fontSize:12, color:D.text, marginTop:2 }}>{sel.name}</div>
              <div style={{ fontSize:11, color:D.muted, marginTop:1 }}>持仓权重 {sel.weight}%</div>
            </div>
            <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
              {[
                {label:"股息率",     val:`${sel.divYield}%`,     good:sel.divYield>=3},
                {label:"股息增长",   val:`${sel.divGrowth}%/yr`, good:sel.divGrowth>=7},
                {label:"PE",         val:`${sel.pe}x`,           good:sel.pe>0&&sel.pe<=25},
                {label:"FCF覆盖",    val:`${sel.fcf}x`,          good:sel.fcf>=1.8},
                {label:"连续增长",   val:`${sel.streak}年`,      good:sel.streak>=20},
              ].map((m,j) => (
                <div key={j} style={{ background:D.surface, border:`1px solid ${m.good?D.green+"40":D.border}`, borderRadius:8, padding:"7px 11px", textAlign:"center", minWidth:64 }}>
                  <div style={{ fontSize:13, fontWeight:800, color:m.good?D.green:D.muted }}>{m.val}</div>
                  <div style={{ fontSize:10, color:D.muted, marginTop:2 }}>{m.label}</div>
                </div>
              ))}
            </div>
          </div>
          <div>
            <div style={{ fontSize:10, color:D.muted, marginBottom:6 }}>股息健康度</div>
            <div style={{ display:"flex", gap:4, alignItems:"center" }}>
              {[sel.divYield>=3,sel.divGrowth>=7,sel.fcf>=1.8,sel.streak>=20,sel.pe>0&&sel.pe<=25].map((p,k) => (
                <div key={k} style={{ width:30, height:8, borderRadius:4, background:p?D.green:D.dim }}/>
              ))}
              <span style={{ fontSize:11, color:D.muted, marginLeft:8 }}>
                {[sel.divYield>=3,sel.divGrowth>=7,sel.fcf>=1.8,sel.streak>=20,sel.pe>0&&sel.pe<=25].filter(Boolean).length}/5
              </span>
            </div>
          </div>
        </div>
      )}

      {/* SCHD selection criteria cards */}
      <div style={{ display:"grid", gridTemplateColumns:g4, gap:12 }}>
        {[
          { label:"连续10年增息", icon:"📈", desc:"每年稳定增长股息，筛掉短期高息陷阱", color:"#38bdf8" },
          { label:"FCF 覆盖率", icon:"💰", desc:"自由现金流足够覆盖股息支出，可持续性强", color:D.green },
          { label:"合理估值 PE", icon:"📊", desc:"排除过高估值的股票，控制下行风险", color:D.orange },
          { label:"财务健康度", icon:"🛡️", desc:"负债率、ROE等综合评分，确保基本面稳健", color:D.accent },
        ].map((c,i) => (
          <div key={i} style={{ ...card, textAlign:"center", borderTop:`3px solid ${c.color}` }}>
            <div style={{ fontSize:22, marginBottom:6 }}>{c.icon}</div>
            <div style={{ fontSize:12, fontWeight:800, color:c.color, marginBottom:6 }}>{c.label}</div>
            <div style={{ fontSize:11, color:D.text, lineHeight:1.7 }}>{c.desc}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   COMPARE SECTION — compare all ETFs side by side
═══════════════════════════════════════════════════════════ */
function CompareSection({ activeETF, card, sectionTitle, isMobile=false }) {
  const g4 = isMobile ? "repeat(2,1fr)" : "repeat(4,1fr)";
  const [metric, setMetric] = useState("cagr");
  const tickers = Object.keys(ETF_CATALOGUE);
  const metrics = [
    { id:"cagr",     label:"年化收益 CAGR",   unit:"%",  higher:true },
    { id:"divYield", label:"股息率",           unit:"%",  higher:true },
    { id:"divGrowth",label:"股息增长率",       unit:"%",  higher:true },
    { id:"maxDD",    label:"最大回撤",         unit:"%",  higher:false },
    { id:"beta",     label:"Beta 系数",        unit:"",   higher:false },
    { id:"er",       label:"费用率",           unit:"%",  higher:false },
    { id:"sharpe",   label:"夏普比率",         unit:"",   higher:true },
  ];
  const m     = metrics.find(x => x.id === metric);
  const data  = tickers.map(t => ({
    ticker: t,
    name:   ETF_CATALOGUE[t].name.split(" ").slice(0,3).join(" "),
    val:    ETF_CATALOGUE[t][metric],
    color:  ETF_CATALOGUE[t].color,
    cat:    ETF_CATALOGUE[t].category,
  })).sort((a, b) => m.higher ? b.val - a.val : a.val - b.val);

  const radarData = [
    {axis:"成长性",   ...Object.fromEntries(tickers.map(t => [t, Math.min(ETF_CATALOGUE[t].cagr*5, 100)]))},
    {axis:"股息收益", ...Object.fromEntries(tickers.map(t => [t, Math.min(ETF_CATALOGUE[t].divYield*12, 100)]))},
    {axis:"抗跌性",   ...Object.fromEntries(tickers.map(t => [t, Math.max(0, 100+ETF_CATALOGUE[t].maxDD*2.5)]))},
    {axis:"稳定性",   ...Object.fromEntries(tickers.map(t => [t, Math.max(0, (2-ETF_CATALOGUE[t].beta)*50)]))},
    {axis:"股息增长", ...Object.fromEntries(tickers.map(t => [t, Math.min(ETF_CATALOGUE[t].divGrowth*6, 100)]))},
    {axis:"低成本",   ...Object.fromEntries(tickers.map(t => [t, Math.max(0, 100-ETF_CATALOGUE[t].er*400)]))},
  ];

  return (
    <div>
      {sectionTitle("横向对比", "SECTION 05 · CROSS-ETF COMPARISON")}

      {/* Metric selector */}
      <div style={{ display:"flex", gap:6, marginBottom:20, flexWrap:"wrap" }}>
        {metrics.map(mx => (
          <button key={mx.id} onClick={() => setMetric(mx.id)} style={{
            background: metric===mx.id ? `${activeETF.color}15` : D.surface,
            border: `1px solid ${metric===mx.id ? activeETF.color : D.border}`,
            borderRadius:6, padding:"5px 12px", color: metric===mx.id ? activeETF.color : D.muted,
            cursor:"pointer", fontFamily:"inherit", fontSize:12,
          }}>{mx.label}</button>
        ))}
      </div>

      {/* Bar chart */}
      <div style={{ ...card, marginBottom:20 }}>
        <div style={{ fontSize:11, letterSpacing:2, color:D.muted, marginBottom:10 }}>{m.label} — 全部ETF排名</div>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={data} margin={{top:4,right:16,left:0,bottom:0}} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke={D.border} horizontal={false}/>
            <XAxis type="number" tick={{fill:D.muted,fontSize:10}} tickFormatter={v=>`${v}${m.unit}`}/>
            <YAxis type="category" dataKey="ticker" tick={{fill:D.text,fontSize:12,fontFamily:"monospace"}} width={44}/>
            <Tooltip contentStyle={{background:D.card,border:`1px solid ${D.border}`,fontSize:12}}
              formatter={v=>[`${v}${m.unit}`, m.label]}/>
            <Bar dataKey="val" radius={[0,4,4,0]}>
              {data.map((d,i) => <Cell key={i} fill={d.color}/>)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Radar */}
      <div style={{ ...card, marginBottom:20 }}>
        <div style={{ fontSize:11, letterSpacing:2, color:D.muted, marginBottom:10 }}>多维能力雷达（标准化）</div>
        <ResponsiveContainer width="100%" height={300}>
          <RadarChart data={radarData} cx="50%" cy="50%" outerRadius={110}>
            <PolarGrid stroke={D.border}/>
            <PolarAngleAxis dataKey="axis" tick={{fill:D.muted,fontSize:12}}/>
            {tickers.map(t => (
              <Radar key={t} name={t} dataKey={t}
                stroke={ETF_CATALOGUE[t].color}
                fill={ETF_CATALOGUE[t].color}
                fillOpacity={0.08} strokeWidth={2}/>
            ))}
            <Legend wrapperStyle={{fontSize: isMobile ? 10 : 11, paddingTop: isMobile ? 8 : 0}}/>
            <Tooltip contentStyle={{background:D.card,border:`1px solid ${D.border}`,fontSize:12}}/>
          </RadarChart>
        </ResponsiveContainer>
      </div>

      {/* Full metrics table */}
      <div style={{ ...card }}>
        <div style={{ fontSize:11, letterSpacing:2, color:D.muted, marginBottom:14 }}>完整指标对照表</div>
        <div style={{ overflowX:"auto" }}>
          <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12, minWidth:600 }}>
            <thead>
              <tr style={{ borderBottom:`1px solid ${D.border2}` }}>
                {["ETF","类别","CAGR","股息率","增长率","最大回撤","Beta","费用率","夏普"].map(h => (
                  <th key={h} style={{ padding:"8px 10px", textAlign:h==="ETF"||h==="类别"?"left":"center", color:D.muted, fontWeight:600, fontSize:11, letterSpacing:1 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tickers.map((t, i) => {
                const e = ETF_CATALOGUE[t];
                const isActive = t === Object.keys(ETF_CATALOGUE).find(k => ETF_CATALOGUE[k] === activeETF);
                return (
                  <tr key={t} style={{ borderBottom:`1px solid ${D.border}`, background: isActive ? `${e.color}08` : i%2===0?"rgba(255,255,255,0.01)":"transparent" }}>
                    <td style={{ padding:"9px 10px" }}>
                      <span style={{ fontWeight:900, color:e.color, fontFamily:"monospace" }}>{t}</span>
                      {isActive && <span style={{ fontSize:10, color:e.color, marginLeft:6, opacity:0.7 }}>◀ 当前</span>}
                    </td>
                    <td style={{ padding:"9px 10px", color:D.muted, fontSize:11 }}>{e.category}</td>
                    <td style={{ padding:"9px 10px", textAlign:"center", color:D.green, fontWeight:700 }}>{e.cagr}%</td>
                    <td style={{ padding:"9px 10px", textAlign:"center", color:D.accent, fontWeight:700 }}>{e.divYield}%</td>
                    <td style={{ padding:"9px 10px", textAlign:"center", color:D.accent }}>{e.divGrowth}%</td>
                    <td style={{ padding:"9px 10px", textAlign:"center", color:D.red   }}>{e.maxDD}%</td>
                    <td style={{ padding:"9px 10px", textAlign:"center", color:D.muted }}>{e.beta}</td>
                    <td style={{ padding:"9px 10px", textAlign:"center", color:D.muted }}>{e.er}%</td>
                    <td style={{ padding:"9px 10px", textAlign:"center", color:D.spy   }}>{e.sharpe}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   MAIN APP
═══════════════════════════════════════════════════════════ */
export default function App() {
  const [selectedTicker, setSelectedTicker] = useState("SPY");
  const [active, setActive]                 = useState("overview");
  const [entered, setEntered]               = useState(false);
  const [dcaAmt, setDcaAmt]                 = useState(500);
  const [isMobile, setIsMobile]             = useState(typeof window !== "undefined" && window.innerWidth < 768);
  const [sidebarOpen, setSidebarOpen]       = useState(() => typeof window !== "undefined" && window.innerWidth >= 768);

  // Data fetching state
  const [liveData, setLiveData]             = useState({});   // { TICKER: { monthly, lastDate, source } }
  const [loading, setLoading]               = useState(false);
  const [dataSource, setDataSource]         = useState("offline"); // "yahoo" | "cache" | "offline"
  const [lastDate, setLastDate]             = useState(null);

  useEffect(() => { setTimeout(() => setEntered(true), 80); }, []);

  // Responsive breakpoint listener
  useEffect(() => {
    const onResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (!mobile) setSidebarOpen(true);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // Fetch data from Yahoo Finance on ticker change
  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (liveData[selectedTicker]) {
        setDataSource(liveData[selectedTicker].source);
        setLastDate(liveData[selectedTicker].lastDate);
        return;
      }
      setLoading(true);
      const result = await fetchMonthlyData(selectedTicker);
      if (cancelled) return;
      if (result && result.monthly && result.monthly.length > 10) {
        setLiveData(prev => ({ ...prev, [selectedTicker]: result }));
        setDataSource(result.source);
        setLastDate(result.lastDate);
      } else {
        // Fallback: interpolate hardcoded data
        const fallback = interpolateMonthly(ETF_CATALOGUE[selectedTicker].monthly);
        const last = fallback[fallback.length - 1]?.[0] || "N/A";
        setLiveData(prev => ({ ...prev, [selectedTicker]: { monthly: fallback, lastDate: last, source: "offline" } }));
        setDataSource("offline");
        setLastDate(last);
      }
      setLoading(false);
    }
    load();
    return () => { cancelled = true; };
  }, [selectedTicker]);

  const etfStatic = ETF_CATALOGUE[selectedTicker];
  // Use live monthly data if available, otherwise interpolate fallback
  const monthlyData = liveData[selectedTicker]?.monthly || interpolateMonthly(etfStatic.monthly);
  const etf = useMemo(() => ({ ...etfStatic, monthly: monthlyData }), [etfStatic, monthlyData]);

  const tr      = useMemo(() => buildTR(etf.monthly),  [etf.monthly]);
  const dd      = useMemo(() => buildDD(tr),            [tr]);
  const dca     = useMemo(() => buildDCA(etf.monthly, dcaAmt), [etf.monthly, dcaAmt]);
  const cagr    = useMemo(() => calcCAGR(etf.monthly),  [etf.monthly]);

  const tickers = Object.keys(ETF_CATALOGUE);

  const card         = { background:D.card, border:`1px solid ${D.border}`, borderRadius:12, padding:"20px" };
  const sectionTitle = (t, sub) => (
    <div style={{ marginBottom:20 }}>
      <div style={{ fontSize:11, letterSpacing:3, color:D.muted, marginBottom:6 }}>{sub}</div>
      <h2 style={{ margin:0, fontSize:22, fontWeight:800, color:D.text, letterSpacing:-0.5 }}>{t}</h2>
    </div>
  );

  // Responsive helpers
  const g4 = isMobile ? "repeat(2,1fr)" : "repeat(4,1fr)";
  const g3 = isMobile ? "1fr" : "repeat(3,1fr)";
  const g2 = isMobile ? "1fr" : "1fr 1fr";
  const g2r = isMobile ? "1fr" : "repeat(2,1fr)";
  const gSide = isMobile ? "1fr" : "240px 1fr";
  const chartH = isMobile ? 180 : 220;
  const chartHL = isMobile ? 200 : 260;

  /* ── Year-over-year heatmap ── */
  const heatmap = useMemo(() => {
    const m = {};
    for (let i=1; i<tr.length; i++) {
      const yr = tr[i].date.slice(0,4);
      const mo = parseInt(tr[i].date.slice(5,7));
      const r  = parseFloat(((tr[i].price / tr[i-1].price - 1) * 100).toFixed(2));
      if (!m[yr]) m[yr] = {};
      m[yr][mo] = r;
    }
    return m;
  }, [tr]);
  const hmYears = Object.keys(heatmap).sort();

  const hmColor = v => {
    if (v===undefined) return D.dim;
    if (v>=4) return "#14532d"; if (v>=2) return "#15803d"; if (v>=0.5) return "#166534";
    if (v>=-0.5) return "#374151";
    if (v>=-2) return "#7f1d1d"; if (v>=-4) return "#991b1b"; return "#450a0a";
  };

  return (
    <div style={{ display:"flex", minHeight:"100vh", background:D.bg, color:D.text, fontFamily:"'IBM Plex Mono','Courier New',monospace" }}>

      {/* ══ SIDEBAR BACKDROP (mobile) ═════════════════════ */}
      {isMobile && sidebarOpen && (
        <div onClick={() => setSidebarOpen(false)} style={{
          position:"fixed", inset:0, background:"rgba(0,0,0,0.5)",
          zIndex:49, transition:"opacity 0.25s",
        }}/>
      )}

      {/* ══ SIDEBAR ═══════════════════════════════════════ */}
      <div style={{
        ...(isMobile
          ? { position:"fixed", top:0, left:0, height:"100vh", width:280, zIndex:50,
              transform: sidebarOpen ? "translateX(0)" : "translateX(-100%)",
              transition:"transform 0.25s ease" }
          : { width: sidebarOpen ? 220 : 0, flexShrink:0, overflow:"hidden",
              position:"sticky", top:0, height:"100vh",
              transition:"width 0.25s ease" }),
        background:D.surface, borderRight:`1px solid ${D.border}`,
        display:"flex", flexDirection:"column",
      }}>
        <div style={{ padding:"20px 18px 12px", whiteSpace:"nowrap" }}>
          <div style={{ fontSize:10, letterSpacing:3, color:D.muted, marginBottom:4 }}>ETF RESEARCH PLATFORM</div>
          <div style={{ fontSize:15, fontWeight:900, color:D.text }}>深度研究</div>
        </div>

        {/* ETF Selector */}
        <div style={{ padding:"0 12px 12px", borderBottom:`1px solid ${D.border}` }}>
          <div style={{ fontSize:10, letterSpacing:2, color:D.muted, marginBottom:8, paddingLeft:6 }}>选择 ETF</div>
          {tickers.map(t => {
            const e = ETF_CATALOGUE[t];
            const sel = t === selectedTicker;
            return (
              <button key={t} onClick={() => { setSelectedTicker(t); setActive("overview"); if(isMobile) setSidebarOpen(false); }} style={{
                display:"flex", alignItems:"center", gap:8, width:"100%",
                padding:"8px 10px", marginBottom:3,
                background: sel ? `${e.color}15` : "transparent",
                border: `1px solid ${sel ? e.color+"50" : "transparent"}`,
                borderRadius:8, cursor:"pointer", fontFamily:"inherit",
                textAlign:"left", transition:"all 0.15s",
              }}>
                <div style={{ width:8, height:8, borderRadius:"50%", background:e.color, flexShrink:0 }}/>
                <div style={{ minWidth:0 }}>
                  <div style={{ fontSize:12, fontWeight:sel?800:500, color:sel?e.color:D.text, letterSpacing:0.5 }}>{t}</div>
                  <div style={{ fontSize:10, color:D.muted, marginTop:1 }}>{e.category}</div>
                </div>
                {sel && <div style={{ marginLeft:"auto", fontSize:10, color:e.color }}>▶</div>}
              </button>
            );
          })}
        </div>

        {/* Nav sections */}
        <div style={{ flex:1, padding:"8px 0", overflowY:"auto" }}>
          {NAV.map(n => (
            <button key={n.id} onClick={() => { setActive(n.id); if(isMobile) setSidebarOpen(false); }} style={{
              display:"flex", alignItems:"center", gap:10, width:"100%",
              padding:"10px 18px", background: active===n.id ? `${etf.color}12` : "transparent",
              border:"none", borderLeft: active===n.id ? `2px solid ${etf.color}` : "2px solid transparent",
              color: active===n.id ? etf.color : D.muted, cursor:"pointer",
              fontFamily:"inherit", fontSize:12, fontWeight: active===n.id ? 700 : 400,
              transition:"all 0.15s", textAlign:"left", whiteSpace:"nowrap",
            }}>
              <span style={{ fontSize:13 }}>{n.icon}</span>{n.label}
            </button>
          ))}
        </div>

        <div style={{ padding:"14px 18px", borderTop:`1px solid ${D.border}`, fontSize:10, color:D.muted, lineHeight:1.7, whiteSpace:"nowrap" }}>
          {tickers.length} 个 ETF · 实时可切换<br/>
          {dataSource === "yahoo" ? `数据截至 ${lastDate} · Yahoo Finance` :
           dataSource === "cache" ? `数据截至 ${lastDate} · 缓存` :
           `⚠ 离线数据 · ${lastDate || "fallback"}`}
        </div>
      </div>

      {/* ══ MAIN CONTENT ══════════════════════════════════ */}
      <div style={{ flex:1, overflow:"auto" }}>

        {/* Top bar */}
        <div style={{
          display:"flex", alignItems:"center", gap: isMobile ? 8 : 14, padding: isMobile ? "10px 14px" : "14px 28px",
          background:D.surface, borderBottom:`1px solid ${D.border}`,
          position:"sticky", top:0, zIndex:10, flexWrap: isMobile ? "wrap" : "nowrap",
        }}>
          <button onClick={() => setSidebarOpen(v => !v)} style={{
            background:"transparent", border:`1px solid ${D.border}`, borderRadius:6,
            color:D.muted, cursor:"pointer", fontFamily:"inherit", fontSize:13, padding:"4px 10px",
          }}>☰</button>

          {/* Ticker badge */}
          <div style={{ display:"flex", alignItems:"center", gap: isMobile ? 6 : 10 }}>
            <div style={{ width:10, height:10, borderRadius:"50%", background:etf.color }}/>
            <span style={{ fontSize:18, fontWeight:900, color:etf.color, letterSpacing:-0.5 }}>{selectedTicker}</span>
            {!isMobile && <span style={{ fontSize:12, color:D.muted }}>{etf.name}</span>}
            <span style={{
              fontSize:10, background:`${etf.color}15`, border:`1px solid ${etf.color}30`,
              borderRadius:4, padding:"2px 8px", color:etf.color,
            }}>{etf.category}</span>
          </div>

          {/* Quick stats */}
          <div style={{ marginLeft:"auto", display:"flex", gap: isMobile ? 12 : 20 }}>
            {[
              { label:"CAGR",  val:`${cagr}%`,          color:D.green },
              { label:"股息率",val:`${etf.divYield}%`,  color:etf.color },
              ...( isMobile ? [] : [
                { label:"费用率",val:`${etf.er}%`,         color:D.muted },
                { label:"Beta",  val:`${etf.beta}`,        color:D.muted },
              ]),
            ].map((s,i) => (
              <div key={i} style={{ textAlign:"center" }}>
                <div style={{ fontSize:13, fontWeight:800, color:s.color }}>{s.val}</div>
                <div style={{ fontSize:10, color:D.muted }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Data source banner */}
        <div style={{ padding: isMobile ? "6px 14px" : "6px 28px", fontSize:11, color:D.muted, background:D.surface, borderBottom:`1px solid ${D.border}`, display:"flex", alignItems:"center", gap:8 }}>
          {loading && <span style={{ display:"inline-block", width:10, height:10, border:`2px solid ${etf.color}`, borderTopColor:"transparent", borderRadius:"50%", animation:"spin 0.8s linear infinite" }}/>}
          <span>{dataSource === "yahoo" ? `数据截至：${lastDate} · 来源 Yahoo Finance` : dataSource === "cache" ? `数据截至：${lastDate} · 来源缓存` : `⚠ 离线数据`}</span>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>

        {/* Page content */}
        <div style={{ maxWidth: isMobile ? "none" : 900, padding: isMobile ? "14px 14px 40px" : "28px 28px 60px", opacity:entered&&!loading?1:loading?0.6:0, transition:"opacity 0.4s" }}>

          {/* ══ OVERVIEW ══════════════════════════════════ */}
          {active==="overview" && (() => {
            const dcaLast = dca[dca.length-1];
            return (
              <div>
                {sectionTitle("概览", `SECTION 01 · OVERVIEW · ${selectedTicker}`)}

                {/* Hero strip */}
                <div style={{ display:"grid", gridTemplateColumns:g4, gap:12, marginBottom:20 }}>
                  {[
                    { label:"CAGR（历史）",  val:`${cagr}%`,           sub:"含股息再投资",       color:etf.color },
                    { label:"当前股息率",     val:`${etf.divYield}%`,   sub:`年增长 ${etf.divGrowth}%`, color:D.green },
                    { label:"最大回撤",       val:`${etf.maxDD}%`,      sub:"历史最大",           color:D.red },
                    { label:"夏普比率",       val:`${etf.sharpe}`,      sub:"风险调整后回报",     color:D.accent },
                  ].map((s,i) => (
                    <div key={i} style={{ ...card, textAlign:"center", borderTop:`3px solid ${s.color}` }}>
                      <div style={{ fontSize:22, fontWeight:900, color:s.color }}>{s.val}</div>
                      <div style={{ fontSize:12, color:D.text, marginTop:4 }}>{s.label}</div>
                      <div style={{ fontSize:11, color:D.muted, marginTop:2 }}>{s.sub}</div>
                    </div>
                  ))}
                </div>

                {/* Description + strengths */}
                <div style={{ display:"grid", gridTemplateColumns:g2, gap:16, marginBottom:20 }}>
                  <div style={{ ...card }}>
                    <div style={{ fontSize:11, letterSpacing:2, color:D.muted, marginBottom:10 }}>基金简介</div>
                    <div style={{ fontSize:12, color:D.text, lineHeight:1.8, marginBottom:14 }}>{etf.description}</div>
                    <div style={{ fontSize:11, color:D.muted, marginBottom:6 }}>对标基准</div>
                    <div style={{ display:"flex", gap:8 }}>
                      <span style={{ fontSize:12, color:etf.color, background:`${etf.color}15`, border:`1px solid ${etf.color}30`, borderRadius:5, padding:"3px 10px" }}>{selectedTicker}</span>
                      <span style={{ fontSize:12, color:D.muted, background:`${D.muted}15`, border:`1px solid ${D.muted}30`, borderRadius:5, padding:"3px 10px" }}>vs {etf.benchmark}</span>
                    </div>
                  </div>
                  <div style={{ ...card }}>
                    <div style={{ fontSize:11, letterSpacing:2, color:D.green, marginBottom:10 }}>核心优势</div>
                    {etf.strengths.map((s,i) => (
                      <div key={i} style={{ display:"flex", gap:8, marginBottom:8, fontSize:12 }}>
                        <span style={{ color:D.green, flexShrink:0 }}>+</span>
                        <span style={{ color:D.text }}>{s}</span>
                      </div>
                    ))}
                    <div style={{ fontSize:11, letterSpacing:2, color:D.red, margin:"12px 0 8px" }}>主要风险</div>
                    {etf.risks.map((r,i) => (
                      <div key={i} style={{ display:"flex", gap:8, marginBottom:6, fontSize:12 }}>
                        <span style={{ color:D.red, flexShrink:0 }}>−</span>
                        <span style={{ color:D.muted }}>{r}</span>
                      </div>
                    ))}
                    <div style={{ marginTop:12, background:`${etf.color}08`, border:`1px solid ${etf.color}20`, borderRadius:6, padding:"8px 12px", fontSize:11 }}>
                      <span style={{ color:D.muted }}>最佳场景：</span>
                      <span style={{ color:etf.color, fontWeight:700 }}>{etf.bestFor}</span>
                    </div>
                  </div>
                </div>

                {/* Total return chart */}
                <div style={{ ...card, marginBottom:16 }}>
                  <div style={{ fontSize:11, letterSpacing:2, color:D.muted, marginBottom:10 }}>累计总回报（含股息再投资）</div>
                  <ResponsiveContainer width="100%" height={chartHL}>
                    <AreaChart data={tr} margin={{top:4,right:8,left:0,bottom:0}}>
                      <defs>
                        <linearGradient id="trGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%"  stopColor={etf.color} stopOpacity={0.35}/>
                          <stop offset="95%" stopColor={etf.color} stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke={D.border}/>
                      <XAxis dataKey="date" tick={{fill:D.muted,fontSize:10}} interval={dateInterval(tr.length, isMobile)}/>
                      <YAxis tick={{fill:D.muted,fontSize:10}} tickFormatter={v=>`$${v.toFixed(0)}`}/>
                      <Tooltip contentStyle={{background:D.card,border:`1px solid ${D.border}`,fontSize:12}}
                        formatter={v=>[`$${Number(v).toFixed(2)}`, "总回报"]}/>
                      <Area type="monotone" dataKey="tr" name="总回报" stroke={etf.color} fill="url(#trGrad)" strokeWidth={2} dot={false}/>
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                {/* $500/mo DCA result */}
                {dcaLast && (
                  <div style={{ ...card, background:`linear-gradient(135deg,${D.card},${etf.color}06)`, border:`1px solid ${etf.color}20` }}>
                    <div style={{ fontSize:11, letterSpacing:2, color:D.muted, marginBottom:14 }}>每月 $500 定投结果（全周期）</div>
                    <div style={{ display:"grid", gridTemplateColumns:g3, gap:16 }}>
                      {[
                        { label:"最终市值",  val:`$${dcaLast.value.toLocaleString()}`,    color:etf.color },
                        { label:"累计投入",  val:`$${dcaLast.invested.toLocaleString()}`,  color:D.muted },
                        { label:"总收益",    val:`${((dcaLast.value/dcaLast.invested-1)*100).toFixed(1)}%`, color:D.green },
                      ].map((s,i) => (
                        <div key={i} style={{ textAlign:"center" }}>
                          <div style={{ fontSize:22, fontWeight:900, color:s.color }}>{s.val}</div>
                          <div style={{ fontSize:11, color:D.muted, marginTop:4 }}>{s.label}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* ── 核心研究发现 ── */}
                <div style={{ marginTop:24, marginBottom:20 }}>
                  <div style={{ fontSize:11, letterSpacing:3, color:D.muted, marginBottom:6 }}>EXECUTIVE SUMMARY</div>
                  <h2 style={{ margin:0, fontSize:18, fontWeight:800, color:D.text, letterSpacing:-0.5 }}>核心研究发现</h2>
                </div>
                <div style={{ display:"grid", gridTemplateColumns:g2r, gap:14, marginBottom:24 }}>
                  {[
                    { icon:"📈", title:"收益模式差异", body:`${selectedTicker} CAGR ${cagr}% — 高股息ETF通过股息再投资和复利补偿价格增长差距，长期总回报可观`, color:etf.color },
                    { icon:"📉", title:"回撤风险特征", body:`60%+ 回调幅度小于10%，仅COVID期间达到最大回撤 ${etf.maxDD}%，整体波动远低于成长型ETF`, color:D.red },
                    { icon:"🛡️", title:"熊市防御优势", body:`2022年加息周期中表现远优于大盘，Beta ${etf.beta} 意味着市场每跌1%，仅跌${(etf.beta*100).toFixed(0)}%`, color:D.green },
                    { icon:"💰", title:"定投复利效应", body:dcaLast ? `$500/月定投全周期，总回报率 ${((dcaLast.value/dcaLast.invested-1)*100).toFixed(0)}%+，复利加速效果显著` : "定投数据计算中...", color:D.accent },
                  ].map((c,i) => (
                    <div key={i} style={{ ...card, borderLeft:`3px solid ${c.color}` }}>
                      <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}>
                        <span style={{ fontSize:18 }}>{c.icon}</span>
                        <span style={{ fontSize:13, fontWeight:800, color:c.color }}>{c.title}</span>
                      </div>
                      <div style={{ fontSize:12, color:D.text, lineHeight:1.8 }}>{c.body}</div>
                    </div>
                  ))}
                </div>

                {/* ── 投资者年龄定位矩阵（动态） ── */}
                {(() => {
                  // Dynamic: compare current ETF vs SPY (if current IS SPY, compare vs SCHD)
                  const isSPY = selectedTicker === "SPY";
                  const etfA = selectedTicker;
                  const etfB = isSPY ? "SCHD" : "SPY";
                  const colorA = etf.color;
                  const colorB = ETF_CATALOGUE[etfB]?.color || "#f59e0b";
                  // Allocation by category
                  const cat = etf.category;
                  let alloc;
                  if (["高股息"].includes(cat))      alloc = { accA:30, balA:50, distA:80 };
                  else if (["大盘指数"].includes(cat)) alloc = { accA:70, balA:50, distA:20 };
                  else if (["科技成长"].includes(cat)) alloc = { accA:40, balA:25, distA:10 };
                  else if (["债券"].includes(cat))     alloc = { accA:10, balA:20, distA:30 };
                  else                                 alloc = { accA:30, balA:40, distA:50 };

                  const stages = [
                    { stage:"积累期", age:"20–40岁", pctA:alloc.accA,  desc:`以${cat==="大盘指数"||cat==="科技成长"?"成长":"收入"}为主，最大化长期复利`, color:"#38bdf8", icon:"🚀" },
                    { stage:"平衡期", age:"40–55岁", pctA:alloc.balA,  desc:"成长与收入并重，逐步降低波动暴露", color:"#f59e0b", icon:"⚖️" },
                    { stage:"分配期", age:"55岁+",   pctA:alloc.distA, desc:"以现金流为核心，保护本金、稳定收入", color:"#4ade80", icon:"🏖️" },
                  ];
                  return (
                    <>
                      <div style={{ marginBottom:20 }}>
                        <div style={{ fontSize:11, letterSpacing:3, color:D.muted, marginBottom:6 }}>INVESTOR POSITIONING</div>
                        <h2 style={{ margin:0, fontSize:18, fontWeight:800, color:D.text, letterSpacing:-0.5 }}>投资者年龄定位矩阵 — {etfA} vs {etfB}</h2>
                      </div>
                      <div style={{ display:"grid", gridTemplateColumns:g3, gap:14 }}>
                        {stages.map((s,i) => (
                          <div key={i} style={{ ...card, borderTop:`3px solid ${s.color}`, textAlign:"center" }}>
                            <div style={{ fontSize:24, marginBottom:6 }}>{s.icon}</div>
                            <div style={{ fontSize:14, fontWeight:900, color:s.color }}>{s.stage}</div>
                            <div style={{ fontSize:12, color:D.muted, marginBottom:10 }}>{s.age}</div>
                            <div style={{ display:"flex", gap:4, marginBottom:10, justifyContent:"center" }}>
                              <div style={{ background:`${colorA}20`, border:`1px solid ${colorA}40`, borderRadius:6, padding:"6px 10px" }}>
                                <div style={{ fontSize:16, fontWeight:900, color:colorA }}>{s.pctA}%</div>
                                <div style={{ fontSize:10, color:D.muted }}>{etfA}</div>
                              </div>
                              <div style={{ background:`${colorB}20`, border:`1px solid ${colorB}40`, borderRadius:6, padding:"6px 10px" }}>
                                <div style={{ fontSize:16, fontWeight:900, color:colorB }}>{100 - s.pctA}%</div>
                                <div style={{ fontSize:10, color:D.muted }}>{etfB}</div>
                              </div>
                            </div>
                            <div style={{ fontSize:11, color:D.text, lineHeight:1.6 }}>{s.desc}</div>
                          </div>
                        ))}
                      </div>
                    </>
                  );
                })()}
              </div>
            );
          })()}

          {/* ══ RETURN ════════════════════════════════════ */}
          {active==="return" && (
            <div>
              {sectionTitle("收益分析", `SECTION 02 · RETURN ANALYSIS · ${selectedTicker}`)}

              {/* Annual returns bar */}
              <div style={{ ...card, marginBottom:16 }}>
                <div style={{ fontSize:11, letterSpacing:2, color:D.muted, marginBottom:10 }}>历年年化收益率</div>
                <ResponsiveContainer width="100%" height={chartH}>
                  <BarChart data={etf.annualReturns} margin={{top:4,right:8,left:0,bottom:0}}>
                    <CartesianGrid strokeDasharray="3 3" stroke={D.border}/>
                    <XAxis dataKey="y" tick={{fill:D.muted,fontSize:11}}/>
                    <YAxis tick={{fill:D.muted,fontSize:11}} tickFormatter={v=>`${v}%`}/>
                    <ReferenceLine y={0} stroke={D.border2}/>
                    <Tooltip contentStyle={{background:D.card,border:`1px solid ${D.border}`,fontSize:12}}
                      formatter={v=>[`${v}%`,"年收益"]}/>
                    <Bar dataKey="r" name="年收益" radius={[3,3,0,0]}>
                      {etf.annualReturns.map((d,i) => <Cell key={i} fill={d.r>=0?etf.color:D.red}/>)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Monthly heatmap */}
              <div style={{ ...card, marginBottom:16 }}>
                <div style={{ fontSize:11, letterSpacing:2, color:D.muted, marginBottom:14 }}>月度收益热力图</div>
                <div style={{ overflowX:"auto" }}>
                  <table style={{ borderCollapse:"collapse", fontSize:11 }}>
                    <thead>
                      <tr>
                        <th style={{ padding:"4px 8px", color:D.muted, textAlign:"left", minWidth:44 }}>年</th>
                        {["1","2","3","4","5","6","7","8","9","10","11","12"].map(m => (
                          <th key={m} style={{ padding:"4px 6px", color:D.muted, minWidth:36, textAlign:"center" }}>{m}月</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {hmYears.map(yr => (
                        <tr key={yr}>
                          <td style={{ padding:"3px 8px", color:D.muted, fontFamily:"monospace" }}>{yr}</td>
                          {[1,2,3,4,5,6,7,8,9,10,11,12].map(mo => {
                            const v = heatmap[yr]?.[mo];
                            return (
                              <td key={mo} title={v!==undefined?`${v}%`:""} style={{
                                padding:"3px 6px", background:hmColor(v),
                                textAlign:"center", borderRadius:3,
                                color: v!==undefined?(Math.abs(v)>2?"rgba(255,255,255,0.85)":"rgba(255,255,255,0.4)"):"transparent",
                              }}>{v!==undefined?v.toFixed(1):""}</td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* YoC projection */}
              <div style={{ ...card }}>
                <div style={{ fontSize:11, letterSpacing:2, color:D.muted, marginBottom:10 }}>Yield on Cost 复利预测（初始 {etf.divYield}%，年增 {etf.divGrowth}%）</div>
                <ResponsiveContainer width="100%" height={180}>
                  <AreaChart
                    data={Array.from({length:31},(_,i) => ({
                      yr:`第${i}年`,
                      yoc: parseFloat((etf.divYield * Math.pow(1+etf.divGrowth/100, i)).toFixed(2))
                    }))}
                    margin={{top:4,right:8,left:0,bottom:0}}>
                    <defs>
                      <linearGradient id="yocGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor={D.accent} stopOpacity={0.4}/>
                        <stop offset="95%" stopColor={D.accent} stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={D.border}/>
                    <XAxis dataKey="yr" tick={{fill:D.muted,fontSize:10}} interval={isMobile ? 8 : 4}/>
                    <YAxis tick={{fill:D.muted,fontSize:10}} tickFormatter={v=>`${v}%`}/>
                    <Tooltip contentStyle={{background:D.card,border:`1px solid ${D.border}`,fontSize:12}}
                      formatter={v=>[`${v}%`,"YoC"]}/>
                    <Area type="monotone" dataKey="yoc" stroke={D.accent} fill="url(#yocGrad)" strokeWidth={2} dot={false}/>
                    <ReferenceLine y={etf.divYield} stroke={D.muted} strokeDasharray="3 2" label={{value:"当前收益率",fill:D.muted,fontSize:10}}/>
                    <ReferenceLine y={10} stroke={D.spy}   strokeDasharray="3 2" label={{value:"10% YoC",fill:D.spy,fontSize:10}}/>
                    <ReferenceLine y={20} stroke={D.green} strokeDasharray="3 2" label={{value:"20% YoC",fill:D.green,fontSize:10}}/>
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* ══ RISK ══════════════════════════════════════ */}
          {active==="risk" && (
            <div>
              {sectionTitle("风险回调", `SECTION 03 · RISK ANALYSIS · ${selectedTicker}`)}

              {/* Drawdown chart */}
              <div style={{ ...card, marginBottom:16 }}>
                <div style={{ fontSize:11, letterSpacing:2, color:D.muted, marginBottom:10 }}>水下曲线（回撤幅度）</div>
                <ResponsiveContainer width="100%" height={chartH}>
                  <AreaChart data={dd} margin={{top:4,right:8,left:0,bottom:0}}>
                    <defs>
                      <linearGradient id="ddGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor={D.red} stopOpacity={0.5}/>
                        <stop offset="95%" stopColor={D.red} stopOpacity={0.05}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={D.border}/>
                    <XAxis dataKey="date" tick={{fill:D.muted,fontSize:10}} interval={dateInterval(dd.length, isMobile)}/>
                    <YAxis tick={{fill:D.muted,fontSize:10}} tickFormatter={v=>`${v}%`}/>
                    <ReferenceLine y={etf.maxDD} stroke={D.red} strokeDasharray="4 3"
                      label={{value:`最大回撤 ${etf.maxDD}%`,fill:D.red,fontSize:10,position:"right"}}/>
                    <Tooltip contentStyle={{background:D.card,border:`1px solid ${D.border}`,fontSize:12}}
                      formatter={v=>[`${v}%`,"回撤"]}/>
                    <Area type="monotone" dataKey="dd" name="回撤" stroke={D.red} fill="url(#ddGrad)" strokeWidth={1.5} dot={false}/>
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Key risk metrics */}
              <div style={{ display:"grid", gridTemplateColumns:g3, gap:12, marginBottom:16 }}>
                {[
                  { label:"最大回撤",    val:`${etf.maxDD}%`,   color:D.red,    note:"历史最深" },
                  { label:"Beta 系数",   val:`${etf.beta}`,     color:etf.color, note:"vs 市场" },
                  { label:"夏普比率",    val:`${etf.sharpe}`,   color:D.green,   note:"风险调整回报" },
                ].map((s,i) => (
                  <div key={i} style={{ ...card, textAlign:"center" }}>
                    <div style={{ fontSize:24, fontWeight:900, color:s.color }}>{s.val}</div>
                    <div style={{ fontSize:12, color:D.text, marginTop:4 }}>{s.label}</div>
                    <div style={{ fontSize:11, color:D.muted, marginTop:2 }}>{s.note}</div>
                  </div>
                ))}
              </div>

              {/* ── 熊市对比图 ── */}
              {(() => {
                const bearMarkets = [
                  { event:"2015 A股冲击", schd:-4.1, spy:-6.1 },
                  { event:"2018 Q4加息", schd:-12.8, spy:-13.5 },
                  { event:"2020 COVID", schd:-27.3, spy:-33.0 },
                  { event:"2022 加息周期", schd:-5.8, spy:-18.2 },
                ];
                return (
                  <div style={{ ...card, marginBottom:16 }}>
                    <div style={{ fontSize:11, letterSpacing:2, color:D.muted, marginBottom:10 }}>熊市对比 — SCHD vs SPY 最大回撤</div>
                    <ResponsiveContainer width="100%" height={240}>
                      <BarChart data={bearMarkets} margin={{top:4,right:16,left:0,bottom:0}}>
                        <CartesianGrid strokeDasharray="3 3" stroke={D.border}/>
                        <XAxis dataKey="event" tick={{fill:D.muted,fontSize:11}}/>
                        <YAxis tick={{fill:D.muted,fontSize:11}} tickFormatter={v=>`${v}%`}/>
                        <ReferenceLine y={0} stroke={D.border2}/>
                        <Tooltip contentStyle={{background:D.card,border:`1px solid ${D.border}`,fontSize:12}}
                          formatter={v=>[`${v}%`]}/>
                        <Bar dataKey="schd" name="SCHD" fill="#38bdf8" radius={[3,3,0,0]}/>
                        <Bar dataKey="spy" name="SPY" fill="#f59e0b" radius={[3,3,0,0]}/>
                        <Legend wrapperStyle={{fontSize: isMobile ? 10 : 11, paddingTop: isMobile ? 8 : 0}}/>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                );
              })()}

              {/* ── 回调概率分布 ── */}
              {(() => {
                const bins = [
                  { range:"<5%", min:0, max:5, color:"#4ade80" },
                  { range:"5–10%", min:5, max:10, color:"#86efac" },
                  { range:"10–15%", min:10, max:15, color:"#f59e0b" },
                  { range:"15–20%", min:15, max:20, color:"#fb923c" },
                  { range:"20–30%", min:20, max:30, color:"#f87171" },
                  { range:">30%", min:30, max:999, color:"#dc2626" },
                ];
                const ddVals = dd.filter(d => d.dd < 0).map(d => Math.abs(d.dd));
                const total = ddVals.length || 1;
                const probData = bins.map(b => ({
                  range: b.range,
                  pct: parseFloat(((ddVals.filter(v => v >= b.min && v < b.max).length / total) * 100).toFixed(1)),
                  color: b.color,
                }));
                return (
                  <div style={{ ...card, marginBottom:16 }}>
                    <div style={{ fontSize:11, letterSpacing:2, color:D.muted, marginBottom:10 }}>回调概率分布（基于历史水下数据）</div>
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={probData} layout="vertical" margin={{top:4,right:16,left:0,bottom:0}}>
                        <CartesianGrid strokeDasharray="3 3" stroke={D.border} horizontal={false}/>
                        <XAxis type="number" tick={{fill:D.muted,fontSize:11}} tickFormatter={v=>`${v}%`}/>
                        <YAxis type="category" dataKey="range" tick={{fill:D.text,fontSize:12}} width={55}/>
                        <Tooltip contentStyle={{background:D.card,border:`1px solid ${D.border}`,fontSize:12}}
                          formatter={v=>[`${v}%`,"出现概率"]}/>
                        <Bar dataKey="pct" name="概率" radius={[0,4,4,0]}>
                          {probData.map((d,i) => <Cell key={i} fill={d.color}/>)}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                );
              })()}

              {/* ── 平均恢复时间 ── */}
              {(() => {
                const recoveryData = computeRecoveryByRange(dd);
                if (recoveryData.length === 0) return null;
                return (
                  <div style={{ ...card, marginBottom:16 }}>
                    <div style={{ fontSize:11, letterSpacing:2, color:D.muted, marginBottom:10 }}>各跌幅区间平均恢复时间（月）</div>
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={recoveryData} layout="vertical" margin={{top:4,right:16,left:0,bottom:0}}>
                        <CartesianGrid strokeDasharray="3 3" stroke={D.border} horizontal={false}/>
                        <XAxis type="number" tick={{fill:D.muted,fontSize:11}} tickFormatter={v=>`${v}月`}/>
                        <YAxis type="category" dataKey="range" tick={{fill:D.text,fontSize:12}} width={55}/>
                        <Tooltip contentStyle={{background:D.card,border:`1px solid ${D.border}`,fontSize:12}}
                          formatter={(v,name) => name==="avgMonths" ? [`${v} 个月`,"平均恢复"] : [`${v} 次`,"发生次数"]}/>
                        <Bar dataKey="avgMonths" name="avgMonths" radius={[0,4,4,0]}>
                          {recoveryData.map((d,i) => <Cell key={i} fill={d.color}/>)}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                    <div style={{ display:"grid", gridTemplateColumns:`repeat(${isMobile ? Math.min(recoveryData.length, 2) : Math.min(recoveryData.length, 5)},1fr)`, gap:8, marginTop:12 }}>
                      {recoveryData.map((d,i) => (
                        <div key={i} style={{ textAlign:"center", padding:"8px 4px", background:`${d.color}10`, borderRadius:6, border:`1px solid ${d.color}20` }}>
                          <div style={{ fontSize:12, fontWeight:700, color:d.color }}>{d.range}</div>
                          <div style={{ fontSize:18, fontWeight:900, color:d.color, margin:"4px 0" }}>{d.avgMonths}<span style={{fontSize:11}}>月</span></div>
                          <div style={{ fontSize:11, color:D.muted }}>发生 {d.count} 次</div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}

              {/* ── 关键恢复规律 ── */}
              <div style={{ ...card, marginBottom:16 }}>
                <div style={{ fontSize:11, letterSpacing:2, color:D.muted, marginBottom:14 }}>关键恢复规律</div>
                <div style={{ display:"grid", gridTemplateColumns:g2r, gap:12 }}>
                  {[
                    { icon:"⏱️", title:"恢复速度", body:"10%以内的回调通常2–4个月恢复，20%以上回调需6–18个月", color:D.green },
                    { icon:"📊", title:"回调频率", body:"每年平均经历2–3次5%+回调，是正常市场节奏而非异常", color:"#38bdf8" },
                    { icon:"🛡️", title:"股息缓冲", body:"高股息ETF在回撤期间持续派息，自动降低实际成本基础", color:D.accent },
                    { icon:"🎯", title:"加仓窗口", body:"历史上每次15%+回调都是极佳的长期买入机会，无一例外", color:D.red },
                  ].map((r,i) => (
                    <div key={i} style={{ background:`${r.color}08`, border:`1px solid ${r.color}20`, borderRadius:8, padding:"12px 14px" }}>
                      <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:6 }}>
                        <span style={{ fontSize:16 }}>{r.icon}</span>
                        <span style={{ fontSize:12, fontWeight:800, color:r.color }}>{r.title}</span>
                      </div>
                      <div style={{ fontSize:12, color:D.text, lineHeight:1.7 }}>{r.body}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* DCA chart */}
              <div style={{ ...card }}>
                <div style={{ display:"flex", gap:8, marginBottom:14, alignItems:"center", flexWrap:"wrap" }}>
                  <span style={{ fontSize:11, letterSpacing:2, color:D.muted }}>定投模拟 — 每月：</span>
                  {[200,500,1000,2000].map(v => (
                    <button key={v} onClick={() => setDcaAmt(v)} style={{
                      background: dcaAmt===v ? `${etf.color}15` : D.surface,
                      border: `1px solid ${dcaAmt===v ? etf.color : D.border}`,
                      borderRadius:6, padding:"4px 12px",
                      color: dcaAmt===v ? etf.color : D.muted,
                      cursor:"pointer", fontFamily:"inherit", fontSize:12,
                    }}>${v}</button>
                  ))}
                </div>
                <ResponsiveContainer width="100%" height={chartH}>
                  <AreaChart data={dca} margin={{top:4,right:8,left:0,bottom:0}}>
                    <defs>
                      <linearGradient id="dcaGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor={etf.color} stopOpacity={0.35}/>
                        <stop offset="95%" stopColor={etf.color} stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={D.border}/>
                    <XAxis dataKey="date" tick={{fill:D.muted,fontSize:10}} interval={dateInterval(dca.length, isMobile)}/>
                    <YAxis tick={{fill:D.muted,fontSize:10}} tickFormatter={v=>`$${(v/1000).toFixed(0)}k`}/>
                    <Tooltip content={<TT money/>}/>
                    <Area type="monotone" dataKey="value"    name="市值"   stroke={etf.color} fill="url(#dcaGrad)" strokeWidth={2} dot={false}/>
                    <Area type="monotone" dataKey="invested" name="投入本金" stroke={D.muted}   fill="none"         strokeWidth={1} dot={false} strokeDasharray="4 3"/>
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* ══ BUY STRATEGY (independent page) ═══════════ */}
          {active==="buystrategy" && (
            <BuyStrategy etf={etf} card={card} sectionTitle={sectionTitle} isMobile={isMobile}/>
          )}

          {/* ══ HOLDINGS ══════════════════════════════════ */}
          {active==="holdings" && (
            <HoldingsSection etf={etf} selectedTicker={selectedTicker} card={card} sectionTitle={sectionTitle} isMobile={isMobile}/>
          )}

          {/* ══ COMPARE ═══════════════════════════════════ */}
          {active==="compare" && (
            <CompareSection activeETF={etf} card={card} sectionTitle={sectionTitle} isMobile={isMobile}/>
          )}

          {/* ══ RETIREMENT ════════════════════════════════ */}
          {active==="retirement" && (
            <div>
              {sectionTitle("退休规划", `SECTION 07 · RETIREMENT PLANNER · ${selectedTicker}`)}
              <RetirementSection etf={etf} card={card} isMobile={isMobile}/>
            </div>
          )}

          {/* ══ CONCLUSION ═════════════════════════════════ */}
          {active==="conclusion" && (() => {
            const isSPY = selectedTicker === "SPY";
            const etfA = selectedTicker;
            const etfB = isSPY ? "SCHD" : "SPY";
            const eA = ETF_CATALOGUE[etfA];
            const eB = ETF_CATALOGUE[etfB];
            const colorA = eA.color;
            const colorB = eB?.color || "#f59e0b";
            const cat = eA.category;
            let alloc;
            if (["高股息"].includes(cat))      alloc = { acc:30, bal:50, dist:80 };
            else if (["大盘指数"].includes(cat)) alloc = { acc:70, bal:50, dist:20 };
            else if (["科技成长"].includes(cat)) alloc = { acc:40, bal:25, dist:10 };
            else if (["债券"].includes(cat))     alloc = { acc:10, bal:20, dist:30 };
            else                                 alloc = { acc:30, bal:40, dist:50 };
            return (
            <div>
              {sectionTitle("投资结论", `SECTION 08 · INVESTMENT CONCLUSION · ${etfA} vs ${etfB}`)}

              {/* Dynamic rating cards */}
              <div style={{ display:"grid", gridTemplateColumns:g2, gap:16, marginBottom:24 }}>
                {[
                  {
                    ticker:etfA, rating: eA.sharpe >= 0.8 ? "A+" : eA.sharpe >= 0.6 ? "A" : "B+", subtitle:eA.category, color:colorA,
                    strengths:eA.strengths,
                    risks:eA.risks,
                    bestScene:eA.bestFor,
                  },
                  ...(eB ? [{
                    ticker:etfB, rating: eB.sharpe >= 0.8 ? "A+" : eB.sharpe >= 0.6 ? "A" : "B+", subtitle:eB.category, color:colorB,
                    strengths:eB.strengths,
                    risks:eB.risks,
                    bestScene:eB.bestFor,
                  }] : []),
                ].map((s,i) => (
                  <div key={i} style={{ ...card, borderTop:`4px solid ${s.color}` }}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
                      <div>
                        <div style={{ fontSize:22, fontWeight:900, color:s.color }}>{s.ticker}</div>
                        <div style={{ fontSize:12, color:D.muted }}>{s.subtitle}</div>
                      </div>
                      <div style={{ background:`${s.color}15`, border:`2px solid ${s.color}`, borderRadius:10, padding:"6px 14px" }}>
                        <div style={{ fontSize:22, fontWeight:900, color:s.color, textAlign:"center" }}>{s.rating}</div>
                      </div>
                    </div>
                    <div style={{ fontSize:11, letterSpacing:2, color:D.green, marginBottom:8 }}>核心优势</div>
                    {s.strengths.map((st,j) => (
                      <div key={j} style={{ display:"flex", gap:6, marginBottom:5, fontSize:12 }}>
                        <span style={{ color:D.green, flexShrink:0 }}>✓</span>
                        <span style={{ color:D.text }}>{st}</span>
                      </div>
                    ))}
                    <div style={{ fontSize:11, letterSpacing:2, color:D.red, margin:"12px 0 8px" }}>主要风险</div>
                    {s.risks.map((r,j) => (
                      <div key={j} style={{ display:"flex", gap:6, marginBottom:5, fontSize:12 }}>
                        <span style={{ color:D.red, flexShrink:0 }}>✗</span>
                        <span style={{ color:D.muted }}>{r}</span>
                      </div>
                    ))}
                    <div style={{ marginTop:12, background:`${s.color}08`, border:`1px solid ${s.color}20`, borderRadius:6, padding:"8px 12px", fontSize:12 }}>
                      <span style={{ color:D.muted }}>最佳场景：</span>
                      <span style={{ color:s.color, fontWeight:700 }}>{s.bestScene}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* 综合配置建议 — dynamic */}
              <div style={{ marginBottom:20 }}>
                <div style={{ fontSize:11, letterSpacing:3, color:D.muted, marginBottom:6 }}>ASSET ALLOCATION</div>
                <h2 style={{ margin:0, fontSize:18, fontWeight:800, color:D.text, letterSpacing:-0.5 }}>综合配置建议 — {etfA} + {etfB}</h2>
              </div>
              <div style={{ display:"grid", gridTemplateColumns:g3, gap:14, marginBottom:24 }}>
                {[
                  { stage:"20–40岁", pctA:alloc.acc,  desc:"积累期：最大化长期复利", color:"#38bdf8", icon:"🚀" },
                  { stage:"40–55岁", pctA:alloc.bal,  desc:"平衡期：兼顾增值与收入", color:"#f59e0b", icon:"⚖️" },
                  { stage:"55岁+",   pctA:alloc.dist, desc:"分配期：稳定现金流为核心", color:"#4ade80", icon:"🏖️" },
                ].map((s,i) => (
                  <div key={i} style={{ ...card, borderTop:`3px solid ${s.color}`, textAlign:"center" }}>
                    <div style={{ fontSize:24, marginBottom:4 }}>{s.icon}</div>
                    <div style={{ fontSize:15, fontWeight:900, color:s.color, marginBottom:4 }}>{s.stage}</div>
                    <div style={{ display:"flex", justifyContent:"center", gap:8, marginBottom:10 }}>
                      <div style={{ background:`${colorA}15`, borderRadius:8, padding:"8px 14px", border:`1px solid ${colorA}30` }}>
                        <div style={{ fontSize:22, fontWeight:900, color:colorA }}>{s.pctA}%</div>
                        <div style={{ fontSize:10, color:D.muted }}>{etfA}</div>
                      </div>
                      <div style={{ background:`${colorB}15`, borderRadius:8, padding:"8px 14px", border:`1px solid ${colorB}30` }}>
                        <div style={{ fontSize:22, fontWeight:900, color:colorB }}>{100 - s.pctA}%</div>
                        <div style={{ fontSize:10, color:D.muted }}>{etfB}</div>
                      </div>
                    </div>
                    <div style={{ fontSize:12, color:D.text, lineHeight:1.6 }}>{s.desc}</div>
                  </div>
                ))}
              </div>

              {/* 一句话总结 */}
              <div style={{
                ...card, textAlign:"center", padding:"28px 32px",
                background:`linear-gradient(135deg, ${colorA}08, ${colorB}08)`,
                border:`1px solid ${D.border2}`,
              }}>
                <div style={{ fontSize:11, letterSpacing:3, color:D.muted, marginBottom:14 }}>FINAL TAKEAWAY</div>
                <div style={{ fontSize:16, fontWeight:800, color:D.text, lineHeight:1.9 }}>
                  "{etfB} 让你变富，{etfA} 让你退休。<br/>它们是不同人生阶段的搭档，而非二选一。"
                </div>
                <div style={{ marginTop:14, fontSize:11, color:D.muted }}>—— ETF 深度研究结论</div>
              </div>
            </div>
            );
          })()}

        </div>
      </div>
    </div>
  );
}
