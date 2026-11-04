import * as THREE from 'three'

export function createWorkpiece(scene) {
	const pivot = new THREE.Group()
	scene.add(pivot)
	const body = new THREE.Group()
	pivot.add(body)
	const axisX = new THREE.ArrowHelper(new THREE.Vector3(1, 0, 0), new THREE.Vector3(0.035, 0, 0), 0.09, 0xff4d6d, 0.012, 0.006)
	const axisY = new THREE.ArrowHelper(new THREE.Vector3(0, 0, -1), new THREE.Vector3(0, 0, -0.035), 0.09, 0x4d9eff, 0.012, 0.006)
	scene.add(axisX, axisY)

	function updateGeometry(parameters) {
		body.traverse((object) => {
			object.geometry?.dispose()
			if (Array.isArray(object.material)) object.material.forEach((material) => material.dispose())
			else object.material?.dispose()
		})
		body.clear()
		const width = parameters.width / 1000
		const depth = parameters.depth / 1000
		const height = parameters.height / 1000
		const geometry = new THREE.BoxGeometry(width, height, depth)
		const mesh = new THREE.Mesh(geometry, new THREE.MeshPhysicalMaterial({ color: 0xf0f0ff, transparent: true, opacity: 0.75, roughness: 0.32, metalness: 0.08, side: THREE.DoubleSide }))
		mesh.position.y = -height / 2
		mesh.castShadow = true
		mesh.receiveShadow = true
		body.add(mesh)
		const edges = new THREE.LineSegments(new THREE.EdgesGeometry(geometry), new THREE.LineBasicMaterial({ color: 0x4444aa }))
		edges.position.copy(mesh.position)
		body.add(edges)
		const cg = new THREE.Mesh(new THREE.SphereGeometry(0.004, 20, 16), new THREE.MeshStandardMaterial({ color: 0xff4d6d, emissive: 0xff4d6d, emissiveIntensity: 1.5 }))
		cg.position.set(parameters.offsetX / 1000, (parameters.cgZ - parameters.height) / 1000, -parameters.offsetY / 1000)
		body.add(cg)
		const contact = new THREE.Mesh(new THREE.SphereGeometry(0.003, 20, 16), new THREE.MeshStandardMaterial({ color: 0x00d4ff, emissive: 0x00d4ff, emissiveIntensity: 1.5, transparent: true, depthTest: false, depthWrite: false }))
		contact.position.y = 0.012
		contact.renderOrder = 2
		body.add(contact)
	}

	function setPose(sample, parameters) {
		pivot.position.y = parameters.height / 1000 + sample.lift
		pivot.rotation.set(sample.thetaX, 0, -sample.thetaY, 'XYZ')
		axisX.position.y = pivot.position.y
		axisY.position.y = pivot.position.y
	}
	return { updateGeometry, setPose, pivot }
}
