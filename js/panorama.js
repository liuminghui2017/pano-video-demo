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

let	video = null
let video_duration = 0
let zoom_control = null
let m_play_btn = null
let control_btn = null
let progress = null
let time_state = null
let touch_mask = null

let progress_timer = null
let is_video_ready = false

let ZOOM = 1

initVideoControl()
initPanorama()
animate()

function initVideoControl() {
	video = document.getElementById('video')
	touch_mask = document.getElementById('touch-mask')
	zoom_control = document.getElementsByClassName('zoom-control')[0]
	m_play_btn = document.getElementsByClassName('play-btn-x')[0]
	control_btn = document.getElementsByClassName('control-btn')[0]
	progress = document.getElementsByClassName('progress')[0]
	time_state = document.getElementsByClassName('time')[0]

	video.addEventListener('loadedmetadata', onVideoLoadedMetaData)
	video.addEventListener('play', onVideoPlay)
	video.addEventListener('pause', onVideoPause)
	video.addEventListener('ended', onVideoEnd)

	zoom_control.addEventListener('click', onZoomBtnPress, true)
	m_play_btn.addEventListener('click', onMainPlayBtnPress, true)
	control_btn.addEventListener('click', onControlBtnPress, true)
}

function initPanorama() {
	var container = document.getElementById('container');
	// 初始化相机
	camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 1100);
	// 初始化场景
	scene = new THREE.Scene();
	// 创建贴图占位
	texture_placeholder = document.createElement('canvas');
	texture_placeholder.width = 128;
	texture_placeholder.height = 128;

	var context = texture_placeholder.getContext('2d');
	context.fillStyle = 'rgb( 200, 200, 200 )';
	context.fillRect(0, 0, texture_placeholder.width, texture_placeholder.height);

	// 贴图

	texture = new THREE.VideoTexture(video);
	texture.minFilter = THREE.LinearFilter;
	texture.magFilter = THREE.LinearFilter;
	texture.format = THREE.RGBFormat;
	var material =  new THREE.MeshBasicMaterial({ map: texture, overdraw: 0.5 })
	// 创建几何体
	var geometry = new THREE.SphereGeometry(500, 60, 40);
	geometry.scale(- 1, 1, 1);
	// 贴图
	var mesh = new THREE.Mesh(geometry, material)
	// 添加到场景
	scene.add(mesh)
	// 初始化渲染器
	renderer = new THREE.WebGLRenderer();
	renderer.setPixelRatio(window.devicePixelRatio);
	renderer.setSize(window.innerWidth, window.innerHeight);
	// renderer.setSize(270, 135);
	container.appendChild(renderer.domElement);
	renderer.autoClear = false;

	// 监听触摸事件
	touch_mask.addEventListener('touchstart', onDocumentTouchStart, false);
	touch_mask.addEventListener('touchmove', onDocumentTouchMove, false);
	touch_mask.addEventListener('touchend', onDocumentTouchEnd, false);
	window.addEventListener('resize', onWindowResize, false);

	

}

// 监听窗口大小调整事件
function onWindowResize() {
	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();
	renderer.setSize(window.innerWidth, window.innerHeight);
}

// 监听触摸开始事件
function onDocumentTouchStart(event) {
	isUserInteracting = true;
	if (event.touches.length == 1) {
		// event.preventDefault();
		onPointerDownPointerX = event.touches[0].pageX;
		onPointerDownPointerY = event.touches[0].pageY;
		onPointerDownLon = lon;
		onPointerDownLat = lat;
	}
}

// 监听触摸滑动事件
function onDocumentTouchMove(event) {
	if (event.touches.length == 1) {
		// event.preventDefault();
		lon = (onPointerDownPointerX - event.touches[0].pageX) * 0.1 + onPointerDownLon;
		lat = (event.touches[0].pageY - onPointerDownPointerY) * 0.1 + onPointerDownLat;
	}
}

// 监听触摸滑动事件
function onDocumentTouchEnd(event) {
	isUserInteracting = false;
}

// 监听视频获取基础信息事件
function onVideoLoadedMetaData() {
	is_video_ready = true
	video_duration = video.duration
	time_state.textContent = '00:00/' + getForamtTimeStr(video_duration)
}

// 监听视频播放事件
function onVideoPlay() {
	progress_timer && clearInterval(progress_timer)
	progress_timer = setInterval(function(){
		time_state.textContent = getForamtTimeStr(video.currentTime) + '/' + getForamtTimeStr(video_duration)
		progress.value = (video.currentTime / video_duration) * 100
	}, 1000)
}

// 监听视频暂停事件
function onVideoPause() {
	progress.value = video.currentTime / video_duration
	progress_timer && clearInterval(progress_timer)
}

// 监听视频播放完成事件 - 循环播放时不会触发
function onVideoEnd() {
	// console.log('video end')
}

// 监听播放按钮点击事件
function onMainPlayBtnPress() {
	if (!is_video_ready) return
	m_play_btn.style = 'display:none;'
	control_btn.className = 'control-btn pause'
	video.play()
}

// 监听控制栏按钮点击事件
function onControlBtnPress() {
	if (!is_video_ready) return
	let state = control_btn.className.split(' ')[1]
	if (state == 'play') {
		m_play_btn.style = 'display:none;'
		control_btn.className = 'control-btn pause'
		video.play()
	}
	if (state == 'pause') {
		m_play_btn.style = ''
		control_btn.className = 'control-btn play'
		video.pause()
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
	requestAnimationFrame(animate);
	update();
}

// 刷新函数
function update() {
	if (isUserInteracting === false && autoAnimate === true) {
		lon += 0.1;
	}
	lat = Math.max(- 85, Math.min(85, lat));
	phi = THREE.Math.degToRad(90 - lat);
	theta = THREE.Math.degToRad(lon);

	target.x = 500 * Math.sin(phi) * Math.cos(theta);
	target.y = 500 * Math.cos(phi);
	target.z = 500 * Math.sin(phi) * Math.sin(theta);

	camera.lookAt(target);

	renderer.render(scene, camera);
}