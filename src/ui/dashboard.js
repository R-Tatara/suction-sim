const degrees = (radians) => (radians * 180 / Math.PI).toFixed(1)

export function updateDashboard(container, result) {
	const values = {
		steadyX: `${degrees(result.steadyX)}°`,
		steadyY: `${degrees(result.steadyY)}°`,
		combined: `${degrees(Math.hypot(result.steadyX, result.steadyY))}°`,
		peakX: `${degrees(result.peakX)}°`,
		peakY: `${degrees(result.peakY)}°`,
		settling: result.settlingMs === null ? '未整定' : `${result.settlingMs} ms`,
		lift: `${(result.lift * 1000).toFixed(0)} mm`,
	}
	for (const [key, value] of Object.entries(values)) container.querySelector(`[data-value="${key}"]`).textContent = value
}
