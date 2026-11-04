import GUI from 'lil-gui'

export function createGui(container, parameters, onChange) {
	const gui = new GUI({ container, title: 'パラメータ', autoPlace: false })
	const work = gui.addFolder('ワーク設定')
	work.add(parameters, 'width', 50, 300, 1).name('幅 W [mm]')
	work.add(parameters, 'depth', 50, 300, 1).name('奥行き D [mm]')
	work.add(parameters, 'height', 10, 100, 1).name('高さ H [mm]')
	work.add(parameters, 'mass', 50, 1000, 1).name('質量 m [g]')
	const offsets = gui.addFolder('重心オフセット')
	const offsetX = offsets.add(parameters, 'offsetX', -parameters.width / 2, parameters.width / 2, 1).name('Δx [mm]')
	const offsetY = offsets.add(parameters, 'offsetY', -parameters.depth / 2, parameters.depth / 2, 1).name('Δy [mm]')
	const cgZ = offsets.add(parameters, 'cgZ', 0, parameters.height, 1).name('z_cg [mm]')
	const pad = gui.addFolder('吸着パッド')
	pad.add(parameters, 'linked').name('XY連動モード')
	const stiffnessX = pad.add(parameters, 'stiffnessX', 0.001, 1, 0.001).name('回転剛性 X [N·m/rad]')
	const stiffnessY = pad.add(parameters, 'stiffnessY', 0.001, 1, 0.001).name('回転剛性 Y [N·m/rad]')
	const dampingX = pad.add(parameters, 'dampingX', 0, 0.1, 0.001).name('減衰係数 X [N·m·s/rad]')
	const dampingY = pad.add(parameters, 'dampingY', 0, 0.1, 0.001).name('減衰係数 Y [N·m·s/rad]')
	const movement = gui.addFolder('持ち上げ動作（台形プロファイル）')
	movement.add(parameters, 'acceleration', 0.1, 5, 0.1).name('最大加速度 [m/s²]')
	movement.add(parameters, 'accelTime', 50, 1000, 1).name('加減速時間 [ms]')
	movement.add(parameters, 'cruiseTime', 0, 2000, 1).name('等速時間 [ms]')
	movement.add(parameters, 'settleTime', 200, 3000, 1).name('整定待ち [ms]')

	function sync(property) {
		offsetX.min(-parameters.width / 2).max(parameters.width / 2)
		offsetY.min(-parameters.depth / 2).max(parameters.depth / 2)
		cgZ.max(parameters.height)
		if (property === 'height') parameters.cgZ = Math.min(parameters.cgZ, parameters.height)
		parameters.offsetX = Math.max(-parameters.width / 2, Math.min(parameters.width / 2, parameters.offsetX))
		parameters.offsetY = Math.max(-parameters.depth / 2, Math.min(parameters.depth / 2, parameters.offsetY))
		if (parameters.linked) {
			parameters.stiffnessY = parameters.stiffnessX
			parameters.dampingY = parameters.dampingX
		}
		for (const controller of [stiffnessY, dampingY]) controller.disable(parameters.linked)
		gui.controllersRecursive().forEach((controller) => controller.updateDisplay())
	}
	gui.onChange(({ property }) => {
		sync(property)
		onChange()
	})
	sync()
	return gui
}
