import Chart from 'chart.js/auto'

const degrees = (radians) => radians * 180 / Math.PI
const color = (name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim()

const markers = {
	id: 'markers',
	afterDatasetsDraw(chart) {
		const { ctx, chartArea, scales, options } = chart
		const config = options.plugins.markers
		if (!config || !chartArea) return
		ctx.save()
		ctx.beginPath()
		ctx.rect(chartArea.left, chartArea.top, chartArea.width, chartArea.height)
		ctx.clip()
		ctx.strokeStyle = color('--text-secondary')
		ctx.lineWidth = 1
		ctx.setLineDash([4, 4])
		for (const boundary of config.boundaries || []) {
			const x = scales.x.getPixelForValue(boundary)
			ctx.beginPath()
			ctx.moveTo(x, chartArea.top)
			ctx.lineTo(x, chartArea.bottom)
			ctx.stroke()
		}
		if (config.steady) {
			for (const [value, lineColor] of config.steady) {
				ctx.strokeStyle = lineColor
				const y = scales.y.getPixelForValue(value)
				ctx.beginPath()
				ctx.moveTo(chartArea.left, y)
				ctx.lineTo(chartArea.right, y)
				ctx.stroke()
			}
		}
		ctx.strokeStyle = color('--text-secondary')
		if (config.zero) {
			const y = scales.y.getPixelForValue(0)
			ctx.beginPath()
			ctx.moveTo(chartArea.left, y)
			ctx.lineTo(chartArea.right, y)
			ctx.stroke()
		}
		ctx.setLineDash([])
		if (config.phases) {
			ctx.fillStyle = color('--text-primary')
			ctx.font = '11px Inter, sans-serif'
			for (const [label, middle] of config.phases) {
				const x = scales.x.getPixelForValue(middle)
				ctx.fillText(label, x - ctx.measureText(label).width / 2, chartArea.top + 14)
			}
		}
		if (config.cursor !== undefined) {
			ctx.strokeStyle = color('--accent-cyan')
			ctx.lineWidth = 2
			const x = scales.x.getPixelForValue(config.cursor)
			ctx.beginPath()
			ctx.moveTo(x, chartArea.top)
			ctx.lineTo(x, chartArea.bottom)
			ctx.stroke()
		}
		ctx.restore()
	},
}
Chart.register(markers)

export function createCharts(angleCanvas, accelerationCanvas) {
	const options = {
		responsive: true, maintainAspectRatio: false, animation: false,
		parsing: false, normalized: true,
		elements: { point: { radius: 0 }, line: { borderWidth: 2 } },
		plugins: { legend: { position: 'bottom', labels: { color: color('--text-secondary'), boxWidth: 12 } }, markers: {} },
		scales: {
			x: { type: 'linear', title: { display: true, text: '時間 [ms]', color: color('--text-secondary') }, ticks: { color: color('--text-secondary') }, grid: { color: color('--border') } },
			y: { title: { display: true, color: color('--text-secondary') }, ticks: { color: color('--text-secondary') }, grid: { color: color('--border') } },
		},
	}
	const angle = new Chart(angleCanvas, {
		type: 'line', data: { datasets: [] },
		options: structuredClone(options),
	})
	angle.options.scales.y.title.text = '傾き [deg]'
	const acceleration = new Chart(accelerationCanvas, {
		type: 'line', data: { datasets: [] },
		options: structuredClone(options),
	})
	acceleration.options.scales.y.title.text = '加速度 [m/s²]'

	function update(result, parameters) {
		const points = result.samples.filter((_, index) => index % 5 === 0 || index === result.samples.length - 1)
		const data = (get) => points.map((sample) => ({ x: sample.time * 1000, y: get(sample) }))
		angle.data.datasets = [
			{ label: 'θx', data: data((sample) => degrees(sample.thetaX)), borderColor: color('--accent-red') },
			{ label: 'θy', data: data((sample) => degrees(sample.thetaY)), borderColor: color('--accent-blue') },
			{ label: '合成角', data: data((sample) => degrees(Math.hypot(sample.thetaX, sample.thetaY))), borderColor: color('--text-secondary'), borderDash: [6, 4] },
		]
		const boundaries = [parameters.accelTime, parameters.accelTime + parameters.cruiseTime, result.motionEndMs]
		angle.options.plugins.markers = {
			boundaries, cursor: 0,
			steady: [
				[degrees(result.steadyX), color('--accent-red')],
				[degrees(result.steadyY), color('--accent-blue')],
				[degrees(Math.hypot(result.steadyX, result.steadyY)), color('--text-secondary')],
			],
		}
		acceleration.data.datasets = [
			{ label: 'a_z', data: data((sample) => sample.acceleration), borderColor: color('--accent-green'), backgroundColor: color('--chart-fill'), fill: 'origin', stepped: 'before' },
		]
		acceleration.options.plugins.markers = {
			boundaries, zero: true, cursor: 0,
			phases: [
				['加速', parameters.accelTime / 2],
				['等速', parameters.accelTime + parameters.cruiseTime / 2],
				['減速', parameters.accelTime + parameters.cruiseTime + parameters.accelTime / 2],
				['整定', result.motionEndMs + parameters.settleTime / 2],
			],
		}
		angle.update('none')
		acceleration.update('none')
	}
	function setCursor(timeMs) {
		angle.options.plugins.markers.cursor = timeMs
		acceleration.options.plugins.markers.cursor = timeMs
		angle.draw()
		acceleration.draw()
	}
	return { update, setCursor }
}
