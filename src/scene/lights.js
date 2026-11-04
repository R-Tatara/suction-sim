import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'

export function createScene(container) {
	const scene = new THREE.Scene()
	scene.background = new THREE.Color(0x0d0d12)
	scene.fog = new THREE.FogExp2(0x0d0d12, 0.015)
	const camera = new THREE.PerspectiveCamera(45, 1, 0.01, 10)
	camera.position.set(0.25, 0.26, 0.3)
	const renderer = new THREE.WebGLRenderer({ antialias: true })
	renderer.setPixelRatio(Math.min(devicePixelRatio, 2))
	renderer.shadowMap.enabled = true
	renderer.shadowMap.type = THREE.PCFShadowMap
	renderer.outputColorSpace = THREE.SRGBColorSpace
	container.append(renderer.domElement)
	const controls = new OrbitControls(camera, renderer.domElement)
	controls.target.set(0, 0.12, 0)
	controls.enableDamping = true
	controls.minDistance = 0.12
	controls.maxDistance = 2
	controls.update()

	scene.add(new THREE.AmbientLight(0x222233, 0.6))
	const key = new THREE.DirectionalLight(0x8888cc, 0.8)
	key.position.set(0.2, 0.4, 0.25)
	key.castShadow = true
	key.shadow.mapSize.set(1024, 1024)
	scene.add(key)
	const rim = new THREE.DirectionalLight(0x334466, 0.4)
	rim.position.set(-0.2, 0.2, -0.2)
	scene.add(rim)
	const grid = new THREE.GridHelper(1, 20, 0x2a2a3d, 0x1e1e2e)
	grid.position.y = -0.004
	scene.add(grid)

	const resize = () => {
		const { width, height } = container.getBoundingClientRect()
		if (!width || !height) return
		camera.aspect = width / height
		camera.updateProjectionMatrix()
		renderer.setSize(width, height)
	}
	new ResizeObserver(resize).observe(container)
	resize()
	return { scene, camera, renderer, controls }
}
