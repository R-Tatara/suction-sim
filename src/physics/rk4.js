export const defaults = {
	width: 180, depth: 110, height: 40, mass: 300,
	offsetX: 5, offsetY: 5, cgZ: 20,
	linked: true, stiffnessX: 0.1, stiffnessY: 0.1,
	dampingX: 0.005, dampingY: 0.005,
	acceleration: 0.5, accelTime: 300, cruiseTime: 500, settleTime: 1000,
}

export function motionAt(time, parameters) {
	const accelEnd = parameters.accelTime / 1000
	const cruiseEnd = accelEnd + parameters.cruiseTime / 1000
	const motionEnd = cruiseEnd + accelEnd
	const acceleration = parameters.acceleration
	const peakVelocity = acceleration * accelEnd
	const accelHeight = acceleration * accelEnd ** 2 / 2

	if (time < accelEnd) {
		return { acceleration, lift: acceleration * time ** 2 / 2 }
	}
	if (time < cruiseEnd) {
		return { acceleration: 0, lift: accelHeight + peakVelocity * (time - accelEnd) }
	}
	if (time < motionEnd) {
		const elapsed = time - cruiseEnd
		return { acceleration: -acceleration, lift: accelHeight + peakVelocity * (cruiseEnd - accelEnd + elapsed) - acceleration * elapsed ** 2 / 2 }
	}
	return { acceleration: 0, lift: peakVelocity * cruiseEnd }
}

export function simulate(parameters, step = 0.001) {
	const mass = parameters.mass / 1000
	const width = parameters.width / 1000
	const depth = parameters.depth / 1000
	const height = parameters.height / 1000
	const inertiaX = mass * (depth ** 2 + height ** 2) / 12
	const inertiaY = mass * (width ** 2 + height ** 2) / 12
	const totalMs = 2 * parameters.accelTime + parameters.cruiseTime + parameters.settleTime
	const count = Math.round(totalMs / (step * 1000))
	const derivative = (state, acceleration) => [
		state[1],
		(mass * (9.81 + acceleration) * parameters.offsetY / 1000 * Math.cos(state[0]) - parameters.stiffnessX * state[0] - parameters.dampingX * state[1]) / inertiaX,
		state[3],
		(mass * (9.81 + acceleration) * parameters.offsetX / 1000 * Math.cos(state[2]) - parameters.stiffnessY * state[2] - parameters.dampingY * state[3]) / inertiaY,
	]
	const add = (state, change, scale) => state.map((value, index) => value + change[index] * scale)
	let state = [0, 0, 0, 0]
	const samples = []
	for (let index = 0; index <= count; index++) {
		const time = index * step
		samples.push({ time, thetaX: state[0], thetaY: state[2], ...motionAt(time, parameters) })
		if (index === count) break
		const acceleration = motionAt(time + step / 2, parameters).acceleration
		const first = derivative(state, acceleration)
		const second = derivative(add(state, first, step / 2), acceleration)
		const third = derivative(add(state, second, step / 2), acceleration)
		const fourth = derivative(add(state, third, step), acceleration)
		state = state.map((value, axis) => value + step * (first[axis] + 2 * second[axis] + 2 * third[axis] + fourth[axis]) / 6)
	}

	const equilibrium = (offset, stiffness) => {
		const torque = mass * 9.81 * Math.abs(offset) / 1000
		let lower = 0
		let upper = Math.PI / 2
		for (let index = 0; index < 40; index++) {
			const middle = (lower + upper) / 2
			if (stiffness * middle < torque * Math.cos(middle)) lower = middle
			else upper = middle
		}
		return Math.sign(offset) * (lower + upper) / 2
	}
	const steadyX = equilibrium(parameters.offsetY, parameters.stiffnessX)
	const steadyY = equilibrium(parameters.offsetX, parameters.stiffnessY)
	const motionEndMs = 2 * parameters.accelTime + parameters.cruiseTime
	const settled = (sample) => Math.abs(sample.thetaX - steadyX) <= Math.max(0.002, Math.abs(steadyX) * 0.02)
		&& Math.abs(sample.thetaY - steadyY) <= Math.max(0.002, Math.abs(steadyY) * 0.02)
	let settlingMs = null
	for (let index = samples.length - 1; index >= 0 && samples[index].time * 1000 >= motionEndMs - 0.0001; index--) {
		if (!settled(samples[index])) break
		settlingMs = Math.round(samples[index].time * 1000 - motionEndMs)
	}
	return {
		samples,
		totalMs,
		motionEndMs,
		steadyX,
		steadyY,
		peakX: Math.max(...samples.map((sample) => Math.abs(sample.thetaX))),
		peakY: Math.max(...samples.map((sample) => Math.abs(sample.thetaY))),
		settlingMs,
		lift: samples.at(-1).lift,
	}
}
