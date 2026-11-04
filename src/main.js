import './style.css'
import { defaults, simulate } from './physics/rk4.js'
import { createScene } from './scene/lights.js'
import { createWorkpiece } from './scene/workpiece.js'
import { createPad } from './scene/pad.js'
import { createGui } from './ui/gui.js'
import { createCharts } from './ui/chart.js'
import { updateDashboard } from './ui/dashboard.js'

document.querySelector('#app').innerHTML = `
  <header class="topbar">
    <div class="brand"><span class="brand-mark"></span><div><h1>物品吸着シミュレータ</h1><small>OBJECT SUCTION SIMULATOR</small></div></div>
    <div class="controls">
      <button id="play" title="再生" aria-label="再生">▶ <span>再生</span></button>
      <button id="pause" title="一時停止" aria-label="一時停止">⏸ <span>一時停止</span></button>
      <button id="reset" title="リセット" aria-label="リセット">↺ <span>リセット</span></button>
      <label class="speed">速度 <select id="speed" aria-label="再生速度"><option value="0.25">×0.25</option><option value="0.5">×0.5</option><option value="1" selected>×1</option><option value="2">×2</option><option value="4">×4</option></select></label>
    </div>
  </header>
  <main class="workspace">
    <aside class="sidebar"><div class="section-heading">SETUP <span>01 / PARAMETERS</span></div><div id="gui"></div></aside>
    <section class="viewport" aria-label="3D シミュレーション">
      <div class="viewport-heading"><span class="live-dot"></span> 3D VIEW <span id="phase">待機</span></div>
      <div id="scene"></div>
      <div class="axis-legend"><span class="red">━ θx</span><span class="blue">━ θy</span><span class="cyan">● 吸着点</span><span class="red">● 重心</span></div>
      <div class="time-readout"><span id="clock">0000</span> <small>/ <span id="duration">2100</span> ms</small></div>
      <div id="dashboard" class="dashboard">
        <div class="dashboard-title">解析値 <span>RESULTS</span></div>
        <div class="metric primary red"><span>θx 定常値</span><strong data-value="steadyX">0.0°</strong></div>
        <div class="metric primary blue"><span>θy 定常値</span><strong data-value="steadyY">0.0°</strong></div>
        <div class="metric primary cyan"><span>合成傾き</span><strong data-value="combined">0.0°</strong></div>
        <div class="metric"><span>θx ピーク</span><strong data-value="peakX">0.0°</strong></div>
        <div class="metric"><span>θy ピーク</span><strong data-value="peakY">0.0°</strong></div>
        <div class="metric"><span>整定時間</span><strong data-value="settling">--</strong></div>
        <div class="metric"><span>持ち上げ高さ</span><strong data-value="lift">0 mm</strong></div>
      </div>
    </section>
  </main>
  <section class="charts" aria-label="時系列グラフ">
    <div class="chart-panel"><div class="chart-heading"><h2>傾き角 <span>θx / θy / 合成</span></h2><small>01 — ROTATION</small></div><div class="chart-canvas"><canvas id="angle-chart"></canvas></div></div>
    <div class="chart-panel"><div class="chart-heading"><h2>加速度プロファイル <span>a_z(t)</span></h2><small>02 — MOTION</small></div><div class="chart-canvas"><canvas id="acceleration-chart"></canvas></div></div>
  </section>
`

const parameters = { ...defaults }
const sceneElement = document.querySelector('#scene')
const { scene, renderer, camera, controls } = createScene(sceneElement)
const workpiece = createWorkpiece(scene)
const updatePadGuide = createPad(scene, workpiece.pivot)
const charts = createCharts(document.querySelector('#angle-chart'), document.querySelector('#acceleration-chart'))
let result
let playing = false
let timeMs = 0
let previousFrame = 0

function pose() {
  const sample = result.samples[Math.min(result.samples.length - 1, Math.round(timeMs))]
  workpiece.setPose(sample, parameters)
  updatePadGuide()
  document.querySelector('#clock').textContent = Math.round(timeMs).toString().padStart(4, '0')
  const phase = timeMs === 0 ? '待機' : timeMs < parameters.accelTime ? '加速' : timeMs < parameters.accelTime + parameters.cruiseTime ? '等速' : timeMs < result.motionEndMs ? '減速' : timeMs < result.totalMs ? '整定' : '完了'
  document.querySelector('#phase').textContent = phase
  charts.setCursor(timeMs)
}

function calculate() {
  result = simulate(parameters)
  document.querySelector('#duration').textContent = result.totalMs
  updateDashboard(document.querySelector('#dashboard'), result)
  charts.update(result, parameters)
}

createGui(document.querySelector('#gui'), parameters, () => {
  playing = false
  timeMs = 0
  workpiece.updateGeometry(parameters)
  calculate()
  pose()
})
workpiece.updateGeometry(parameters)
calculate()
pose()

document.querySelector('#play').addEventListener('click', () => {
  calculate()
  if (timeMs >= result.totalMs) timeMs = 0
  playing = true
  previousFrame = 0
})
document.querySelector('#pause').addEventListener('click', () => { playing = false })
document.querySelector('#reset').addEventListener('click', () => {
  playing = false
  timeMs = 0
  pose()
})

function frame(now) {
  if (playing) {
    if (previousFrame) timeMs = Math.min(result.totalMs, timeMs + Math.min(now - previousFrame, 100) * Number(document.querySelector('#speed').value))
    previousFrame = now
    pose()
    if (timeMs >= result.totalMs) playing = false
  }
  controls.update()
  renderer.render(scene, camera)
  requestAnimationFrame(frame)
}
requestAnimationFrame(frame)