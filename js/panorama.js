let camera = null
let scene = null
let renderer = null

let texture_placeholder = null
let isUserInteracting = false
let	autoAnimate = true
let	onMouseDownMouseX = 0
let onMouseDownMouseY = 0
let	lon = 90
let onMouseDownLon = 0
let	lat = 0 
let onMouseDownLat = 0
let	phi = 0 
let theta = 0
let texture = null
let	target = new THREE.Vector3()

let	m_video = null
let video_duration = 0
let zoom_control = null
let m_play_btn = null
let control_btn = null
let progress = null
let time_state = null
let touch_mask = null

let progress_timer = null
let is_video_ready = false

let ZOOM = 0.5

initVideoControl()	
initPanorama()
animate()


function init(src) {
	initVideoControl(src)	
	initPanorama()
	animate()
}

function initVideoControl(src) {
	m_video = document.getElementById('video')
	touch_mask = document.getElementById('touch-mask')
	zoom_control = document.getElementsByClassName('zoom-control')[0]
	m_play_btn = document.getElementsByClassName('play-btn-x')[0]
	control_btn = document.getElementsByClassName('control-btn')[0]
	progress = document.getElementsByClassName('progress')[0]
	time_state = document.getElementsByClassName('time')[0]

	// m_video.src = "http://stdag-image.oss-cn-beijing.aliyuncs.com/em1_video/20190308/313847173936313221002e00_1551888000-20190308113432595.mp4"
	// m_video.src = src

	m_video.addEventListener('loadedmetadata', onVideoLoadedMetaData)
	m_video.addEventListener('play', onVideoPlay)
	m_video.addEventListener('pause', onVideoPause)
	m_video.addEventListener('ended', onVideoEnd)

	zoom_control.addEventListener('click', onZoomBtnPress, true)
	m_play_btn.addEventListener('click', onMainPlayBtnPress, true)
	control_btn.addEventListener('click', onControlBtnPress, true)
}

function initPanorama() {
	var container = document.getElementById('container')
	// 初始化相机
	camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 1100)
	camera.zoom = ZOOM
	camera.updateProjectionMatrix()
	// 初始化场景
	scene = new THREE.Scene()

	// 初始化渲染器
	renderer = new THREE.WebGLRenderer()
	renderer.setPixelRatio(window.devicePixelRatio)
	renderer.setSize(window.innerWidth, window.innerHeight)
	container.appendChild(renderer.domElement)
	renderer.autoClear = false


	texture = new THREE.VideoTexture(m_video)
	texture.minFilter = THREE.LinearFilter
	texture.magFilter = THREE.LinearFilter
	texture.format = THREE.RGBFormat
	let material =  new THREE.MeshBasicMaterial({ map: texture, overdraw: 0.5 })
	// 创建几何体
	let geometry = new THREE.SphereGeometry(500, 60, 40)
	geometry.scale(-1, 1, 1)
	// 贴图
	let mesh = new THREE.Mesh(geometry, material)
	// 添加到场景
	scene.add(mesh)


	// 监听触摸事件
	touch_mask.addEventListener('touchstart', onDocumentTouchStart, false)
	touch_mask.addEventListener('touchmove', onDocumentTouchMove, false)
	touch_mask.addEventListener('touchend', onDocumentTouchEnd, false)
	window.addEventListener('resize', onWindowResize, false)
}

// 监听窗口大小调整事件
function onWindowResize() {
	camera.aspect = window.innerWidth / window.innerHeight
	camera.updateProjectionMatrix()
	renderer.setSize(window.innerWidth, window.innerHeight)
}

// 监听触摸开始事件
function onDocumentTouchStart(event) {
	isUserInteracting = true
	if (event.touches.length == 1) {
		// event.preventDefault();
		onMouseDownMouseX = event.touches[0].pageX
		onMouseDownMouseY = event.touches[0].pageY
		onMouseDownLon = lon
		onMouseDownLat = lat
	}
}

// 监听触摸滑动事件
function onDocumentTouchMove(event) {
	if (event.touches.length == 1) {
		// event.preventDefault();
		lon = (onMouseDownMouseX - event.touches[0].pageX) * 0.1 + onMouseDownLon
		lat = (event.touches[0].pageY - onMouseDownMouseY) * 0.1 + onMouseDownLat
	}
}

// 监听触摸滑动事件
function onDocumentTouchEnd() {
	isUserInteracting = false
}

// 监听视频获取基础信息事件
function onVideoLoadedMetaData() {
	is_video_ready = true
	video_duration = m_video.duration
	time_state.textContent = '00:00/' + getForamtTimeStr(video_duration)
}

// 监听视频播放事件
function onVideoPlay() {
	progress_timer && clearInterval(progress_timer)
	progress_timer = setInterval(function() {
		time_state.textContent = getForamtTimeStr(m_video.currentTime) + '/' + getForamtTimeStr(video_duration)
		progress.value = (m_video.currentTime / video_duration) * 100
	}, 1000)
}

// 监听视频暂停事件
function onVideoPause() {
	progress.value = m_video.currentTime / video_duration
	progress_timer && clearInterval(progress_timer)
}

// 监听视频播放完成事件 - 循环播放时不会触发
function onVideoEnd() {
	// console.log('video end')
}

// 监听播放按钮点击事件
function onMainPlayBtnPress() {
	if (!is_video_ready) return
	m_play_btn.className = 'play-btn-x hide'
	control_btn.className = 'control-btn pause'
	m_video.play()
}

// 监听控制栏按钮点击事件
function onControlBtnPress() {
	if (!is_video_ready) return
	let state = control_btn.className.split(' ')[1]
	if (state == 'play') {
		m_play_btn.className = 'play-btn-x hide'
		control_btn.className = 'control-btn pause'
		m_video.play()
	}
	if (state == 'pause') {
		m_play_btn.className = 'play-btn-x'
		control_btn.className = 'control-btn play'
		m_video.pause()
	}
}

// 监听缩放按钮点击事件
function onZoomBtnPress(e) {
	e.stopPropagation()
	if (e.target.className == 'zoom-in-btn') {
		ZOOM = Math.min(2, ZOOM + 0.5)
		zoom(ZOOM)
	}
	if (e.target.className == 'zoom-out-btn') {
		ZOOM = Math.max(0.5, ZOOM - 0.5)
		zoom(ZOOM)
	}
}

// 缩放
function zoom(zoomSize) {
	camera.zoom = zoomSize
	camera.updateProjectionMatrix()
	renderer.setSize(window.innerWidth, window.innerHeight)
}

// 格式化时间
function getForamtTimeStr(seconds) {
	let min = Math.floor(seconds / 60)
	let sec = Math.floor(seconds % 60)
	return `${min > 9 ? '' : '0'}${min}:${sec > 9 ? '' : '0'}${sec}`
}

// 绘制循环
function animate() {
	requestAnimationFrame(animate)
	update()
}

// 刷新函数
function update() {
	if (isUserInteracting === false && autoAnimate === true) {
		lon += 0.1
	}
	lat = Math.max(-85, Math.min(85, lat))
	phi = THREE.Math.degToRad(90 - lat)
	theta = THREE.Math.degToRad(lon)

	target.x = 500 * Math.sin(phi) * Math.cos(theta)
	target.y = 500 * Math.cos(phi)
	target.z = 500 * Math.sin(phi) * Math.sin(theta)

	camera.lookAt(target)

	renderer.render(scene, camera)
}

