import test from 'node:test'
import assert from 'node:assert/strict'
import { defaults, motionAt, simulate } from './rk4.js'

test('trapezoidal acceleration has continuous lift and stops at the expected height', () => {
  const times = [0, 0.3, 0.8, 1.1, 2.1]
  const acceleration = [0.5, 0, -0.5, 0, 0]
  const lift = [0, 0.0225, 0.0975, 0.12, 0.12]
  times.forEach((time, index) => {
    assert.equal(motionAt(time, defaults).acceleration, acceleration[index])
    assert.ok(Math.abs(motionAt(time, defaults).lift - lift[index]) < 1e-10)
  })
})

test('zero offset never tilts; both axes respond independently with the correct sign', () => {
  const centered = simulate({ ...defaults, offsetX: 0, offsetY: 0 })
  assert.equal(centered.samples.length, 2101)
  assert.equal(centered.peakX, 0)
  assert.equal(centered.peakY, 0)
  assert.equal(centered.settlingMs, 0)

  const shifted = simulate({ ...defaults, offsetX: -20, offsetY: 10 })
  assert.ok(shifted.steadyX > 0)
  assert.ok(shifted.steadyY < 0)
  assert.ok(shifted.samples[100].thetaX > 0)
  assert.ok(shifted.samples[100].thetaY < 0)
  assert.ok(Math.abs(shifted.lift - 0.12) < 1e-10)
})

test('static equilibrium remains bounded at minimum stiffness', () => {
  const result = simulate({ ...defaults, stiffnessX: 0.001, offsetY: 50 })
  assert.ok(result.steadyX > 0)
  assert.ok(result.steadyX < Math.PI / 2)
  assert.ok(Math.abs(0.001 * result.steadyX - 0.3 * 9.81 * 0.05 * Math.cos(result.steadyX)) < 1e-9)
})