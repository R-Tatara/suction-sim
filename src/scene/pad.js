import * as THREE from 'three'

export function createPad(scene, pivot) {
	const group = new THREE.Group()
	pivot.add(group)
	const pad = new THREE.Mesh(new THREE.CylinderGeometry(0.011, 0.022, 0.008, 32), new THREE.MeshStandardMaterial({ color: 0x69ddf3, emissive: 0x21a8ca, emissiveIntensity: 0.3, roughness: 0.85 }))
	pad.position.y = 0.006
	pad.castShadow = true
	group.add(pad)
	const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.005, 0.005, 0.1, 32), new THREE.MeshBasicMaterial({ color: 0x92999e }))
	shaft.castShadow = true
	scene.add(shaft)
	const guideGeometry = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()])
	const guide = new THREE.Line(guideGeometry, new THREE.LineDashedMaterial({ color: 0x444466, dashSize: 0.008, gapSize: 0.005 }))
	guide.frustumCulled = false
	scene.add(guide)
	return () => {
		shaft.position.y = pivot.position.y + 0.06
		guideGeometry.attributes.position.setY(1, pivot.position.y)
		guideGeometry.attributes.position.needsUpdate = true
		guide.computeLineDistances()
	}
}
