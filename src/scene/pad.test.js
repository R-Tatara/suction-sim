import test from 'node:test'
import assert from 'node:assert/strict'
import * as THREE from 'three'
import { defaults } from '../physics/rk4.js'
import { createWorkpiece } from './workpiece.js'
import { createPad } from './pad.js'

test('pad follows the workpiece translation and rotation', () => {
	const scene = new THREE.Scene()
	const workpiece = createWorkpiece(scene)
	const updateGuide = createPad(scene, workpiece.pivot)
	const pad = workpiece.pivot.children.find((child) => child.children.some((object) => object.isMesh))
	assert.ok(pad)
	assert.equal(pad.children[0].material.color.getHex(), 0x69ddf3)
	assert.equal(pad.children[0].geometry.parameters.radiusTop / pad.children[0].geometry.parameters.radiusBottom, 0.5)

	workpiece.setPose({ lift: 0.1, thetaX: 0.2, thetaY: -0.3 }, defaults)
	updateGuide()
	const padPosition = pad.getWorldPosition(new THREE.Vector3())
	const padRotation = pad.getWorldQuaternion(new THREE.Quaternion())
	assert.ok(padPosition.distanceTo(workpiece.pivot.position) < 1e-10)
	assert.ok(padRotation.angleTo(workpiece.pivot.quaternion) < 1e-10)
	const guide = scene.children.find((child) => child.isLine)
	assert.ok(Math.abs(guide.geometry.attributes.position.getY(1) - workpiece.pivot.position.y) < 1e-7)
})

test('shaft stays vertical above the pad while following lift', () => {
	const scene = new THREE.Scene()
	const workpiece = createWorkpiece(scene)
	const updatePad = createPad(scene, workpiece.pivot)
	const shaft = scene.children.find((child) => child.isMesh && child.geometry.type === 'CylinderGeometry')
	assert.ok(shaft)
	assert.equal(shaft.geometry.parameters.radiusTop, 0.005)
	assert.equal(shaft.geometry.parameters.radiusBottom, 0.005)
	assert.equal(shaft.geometry.parameters.height, 0.1)
	assert.equal(shaft.material.color.getHex(), 0x92999e)

	for (const sample of [
		{ lift: 0, thetaX: 0, thetaY: 0 },
		{ lift: 0.1, thetaX: 0.2, thetaY: -0.3 },
	]) {
		workpiece.setPose(sample, defaults)
		updatePad()
		assert.ok(Math.abs(shaft.position.y - (workpiece.pivot.position.y + 0.06)) < 1e-10)
		assert.ok(shaft.getWorldQuaternion(new THREE.Quaternion()).angleTo(new THREE.Quaternion()) < 1e-10)
	}
})

test('suction point stays visible in front of the pad, shaft and workpiece', () => {
	const scene = new THREE.Scene()
	const workpiece = createWorkpiece(scene)
	createPad(scene, workpiece.pivot)
	for (let index = 0; index < 2; index++) {
		workpiece.updateGeometry(defaults)
		const contact = workpiece.pivot.children.flatMap((group) => group.children).find((object) => object.isMesh && object.material.color.getHex() === 0x00d4ff)
		assert.ok(contact)
		assert.equal(contact.material.transparent, true)
		assert.equal(contact.material.depthTest, false)
		assert.equal(contact.material.depthWrite, false)
		assert.ok(contact.renderOrder > 0)
	}
})

test('axis arrows start near the origin and point outward', () => {
	const scene = new THREE.Scene()
	createWorkpiece(scene)
	const [axisX, axisY] = scene.children.slice(1)
	assert.ok(axisX.position.x > 0)
	assert.ok(axisY.position.z < 0)
	assert.ok(new THREE.Vector3(0, 1, 0).applyQuaternion(axisX.quaternion).x > 0)
	assert.ok(new THREE.Vector3(0, 1, 0).applyQuaternion(axisY.quaternion).z < 0)
})