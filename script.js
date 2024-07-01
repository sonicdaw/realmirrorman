const video = document.getElementById('webcam');
const video2 = document.getElementById('webcam2');
const enableWebcamButton1 = document.getElementById('webcamButton1');
const enableWebcamButton2 = document.getElementById('webcamButton2');
var cameraList = document.getElementById("camera_list");
const bgmVolumeSlider = document.getElementById('bgm_volume');
const seVolumeSlider = document.getElementById('se_volume');
const navigationVolumeSlider = document.getElementById('navigation_volume');
const speechVolumeSlider = document.getElementById('speech_volume');

var canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d')
var canvas2 = document.getElementById('canvas2');
const ctx2 = canvas2.getContext('2d')
var canvas_score = document.getElementById('canvas_score');
const ctx_score = canvas_score.getContext('2d')
const cameraOptions = document.querySelector('.video-options>select');

const topRangeSlider1 = document.getElementById('top_range_1');
const bottomRangeSlider1 = document.getElementById('bottom_range_1');
const leftRangeSlider1 = document.getElementById('left_range_1');
const rightRangeSlider1 = document.getElementById('right_range_1');

const topRangeSlider2 = document.getElementById('top_range_2');
const bottomRangeSlider2 = document.getElementById('bottom_range_2');
const leftRangeSlider2 = document.getElementById('left_range_2');
const rightRangeSlider2 = document.getElementById('right_range_2');

const languageButton = document.getElementById('language_button');
const areaModeButton = document.getElementById('area_mode_change_button');
const startModeToggle = document.getElementById('startModeToggle');
const manualStartButton = document.getElementById('manualStartButton');

const WIDTH = 320;
const HEIGHT = 320;

// canvas1 range
let top_range_1 = 0;
let bottom_range_1 = 1;
let left_range_1 = 0;
let right_range_1 = 1;

// canvas2 range
let top_range_2 = 0;
let bottom_range_2 = 1;
let left_range_2 = 0;
let right_range_2 = 1;

var VOLUME_BGM = 0.2;
var VOLUME_SE = 0.7;
var VOLUME_NAVIGATION = 0.7;
var VOLUME_SPEECH = 1.0;

const VOLUME_DEFAULT = 1.0;
const VOLUME_HI = 0.8;
const VOLUME_MID = 0.7;
const VOLUME_LOW = 0.01;
const GAME_TIME = 90000;
const GAME_DOUBLE_POINT_TIME = 60000;

var timer;
var interval = 10;
var sound_on = false;
var game_score = 0;
var game_score_read_time = Date.now();
var game_time = Date.now();
var game_end_timer = Date.now();

// reference https://note.com/npaka/n/n839066c1f23a
const nose = 0
const leftEye = 1
const rightEye = 2
const leftEar = 3
const rightEar = 4
const leftShoulder = 5
const rightShoulder = 6
const leftElbow = 7
const rightElbow = 8
const leftWrist = 9
const rightWrist = 10
const leftHip = 11
const rightHip = 12
const leftKnee = 13
const rightKnee = 14
const leftAnkle = 15
const rightAnkle = 16
const numOfJoint = 17

var man1pose = new Array(numOfJoint);
var man2pose = new Array(numOfJoint);
var man1pose_temp = new Array(numOfJoint);
var man2pose_temp = new Array(numOfJoint);
var man1pose_move = 0;
var man2pose_move = 0;
var man1pose_time = Date.now();
var man2pose_time = Date.now();

var synchro_counter = 0;
const synchro_counter_max = 100;
var bgm_stopping = false;
var gameend_sound_played = false;
var swing_se_sound_count = 0;
var swing_se_sound_count_time = Date.now();
var cheers_played = {};

var inField_ManInFrontOfTheMirror = false;
var inField_ManInTheMirror = false;
var FilterinField_ManInFrontOfTheMirror = 0;
var FilterinField_ManInTheMirror = 0;
var Captured_ManInFrontOfTheMirror = false;
var Captured_ManInTheMirror = false;
const FilterinField_Max = 500;

const game_mode = Object.freeze({ WaitingForPlayers: 0, Playing: 1, Pause: 2, End: 3 });
var game_status = game_mode.WaitingForPlayers;
var areamode = 0;   // 0: Full body mode, 1: Upper body mode
var isAutoStart = true;
var language = "ja";
var language_instruction = "";

let announcementsMade = {
    tenSeconds: false,
    thirtySeconds: false,
    sixtySeconds: false
};

function toggle_language() {
  if (language === "ja") {
    language = "en";
    languageButton.textContent = "EN";
  } else {
    language = "ja";
    languageButton.textContent = "JP";
  }
  languageButton.classList.toggle('active-button');
}

function getUserMediaSupported() {
    return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
}

if (getUserMediaSupported()) {
    enableWebcamButton1.addEventListener('click', window.enableCam1);
    enableWebcamButton2.addEventListener('click', window.enableCam2);
} else {
    console.warn('getUserMedia() is not supported by your browser');
}

function change_areamode(event){
    if(areamode == 0){
        areamode = 1;
        areaModeButton.textContent = "UpperBody";
    }else{
        areamode = 0;
        areaModeButton.textContent = "FullBody";
    }
    areaModeButton.classList.toggle('active-button');
}

var model = undefined;

posenet.load().then(function (loadedModel) {
    model = loadedModel;
});

function vector_theta(x1, y1, x2, y2) {
    var dot = x1 * x2 + y1 * y2;

    var absA = Math.sqrt(x1 * x1 + y1 * y1);
    var absB = Math.sqrt(x2 * x2 + y2 * y2);
    var cosTheta = dot / (absA * absB);

    return theta = Math.acos(cosTheta);
}

function degree(theta) {
    return theta / (Math.PI / 180);
}

var joint_degree1 = new Array(numOfJoint);
var joint_degree2 = new Array(numOfJoint);
var synchro = 0;
var synchro_percent = 0;


// Draw -----------------------------------------------------------------------------------------

const drawLine = (ctx, kp0, kp1, mirror, color) => {
    if (kp0.score < 0.3 || kp1.score < 0.3) return
    ctx.strokeStyle = color;
    ctx.lineWidth = 2
    ctx.beginPath()
    if (mirror) {
        ctx.moveTo(WIDTH - kp0.position.x, kp0.position.y)
        ctx.lineTo(WIDTH - kp1.position.x, kp1.position.y)
    } else {
        ctx.moveTo(kp0.position.x, kp0.position.y)
        ctx.lineTo(kp1.position.x, kp1.position.y)
    }
    ctx.stroke();
}

const drawHead = (ctx, kp, kp2, mirror, color) => {
    if (kp.score < 0.3) return
    ctx.fillStyle = color;
    ctx.beginPath()
    if (mirror) {
        ctx.arc(WIDTH - kp.position.x, kp.position.y, Math.abs(kp2.position.x - kp.position.x) * 2, 0, 2 * Math.PI);
    } else {
        ctx.arc(kp.position.x, kp.position.y, Math.abs(kp2.position.x - kp.position.x) * 2, 0, 2 * Math.PI);
    }
    ctx.stroke()
}

const jointPairs = [
    [leftShoulder, rightShoulder],
    [leftShoulder, leftElbow],
    [leftElbow, leftWrist],
    [rightShoulder, rightElbow],
    [rightElbow, rightWrist],
    [leftShoulder, leftHip],
    [rightShoulder, rightHip],
    [leftHip, rightHip],
    [leftHip, leftKnee],
    [leftKnee, leftAnkle],
    [rightHip, rightKnee],
    [rightKnee, rightAnkle]
];

function drawPose(ctx, kp, joint_degree, mirror/*true for mirror draw*/, color) {
    if (kp[leftShoulder] == null) return false;

    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = 2;

    drawHead(ctx, kp[nose], kp[leftEye], mirror);

    ctx.beginPath();
    for (const [joint1, joint2] of jointPairs) {
        const [x1, y1] = mirror ? [WIDTH - kp[joint1].position.x, kp[joint1].position.y] : [kp[joint1].position.x, kp[joint1].position.y];
        const [x2, y2] = mirror ? [WIDTH - kp[joint2].position.x, kp[joint2].position.y] : [kp[joint2].position.x, kp[joint2].position.y];
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
    }
    ctx.stroke();

    for (const joint of [nose, leftEye, rightEye]) {
        const [x, y] = mirror ? [WIDTH - kp[joint].position.x, kp[joint].position.y] : [kp[joint].position.x, kp[joint].position.y];
        ctx.beginPath();
        ctx.arc(x, y, 3, 0, 2 * Math.PI);
        ctx.fill();
    }

    ctx.font = "20pt 'Times New Roman'";
    ctx.fillStyle = 'black';
/*    if (mirror) {
        ctx.fillText(joint_degree[leftShoulder] + "°", WIDTH - kp[leftShoulder].position.x, kp[leftShoulder].position.y);
        ctx.fillText(joint_degree[rightShoulder] + "°", WIDTH - kp[rightShoulder].position.x, kp[rightShoulder].position.y);
        ctx.fillText(joint_degree[leftElbow] + "°", WIDTH - kp[leftElbow].position.x, kp[leftElbow].position.y);
        ctx.fillText(joint_degree[rightElbow] + "°", WIDTH - kp[rightElbow].position.x, kp[rightElbow].position.y);
        ctx.fillText(joint_degree[leftHip] + "°", WIDTH - kp[leftHip].position.x, kp[leftHip].position.y);
        ctx.fillText(joint_degree[rightHip] + "°", WIDTH - kp[rightHip].position.x, kp[rightHip].position.y);
        ctx.fillText(joint_degree[rightKnee] + "°", WIDTH - kp[rightKnee].position.x, kp[rightKnee].position.y);
        ctx.fillText(joint_degree[leftKnee] + "°", WIDTH - kp[leftKnee].position.x, kp[leftKnee].position.y);

    } else {
        ctx.fillText(joint_degree[leftShoulder] + "°", kp[leftShoulder].position.x, kp[leftShoulder].position.y);
        ctx.fillText(joint_degree[rightShoulder] + "°", kp[rightShoulder].position.x, kp[rightShoulder].position.y);
        ctx.fillText(joint_degree[leftElbow] + "°", kp[leftElbow].position.x, kp[leftElbow].position.y);
        ctx.fillText(joint_degree[rightElbow] + "°", kp[rightElbow].position.x, kp[rightElbow].position.y);
        ctx.fillText(joint_degree[leftHip] + "°", kp[leftHip].position.x, kp[leftHip].position.y);
        ctx.fillText(joint_degree[rightHip] + "°", kp[rightHip].position.x, kp[rightHip].position.y);
        ctx.fillText(joint_degree[rightKnee] + "°", kp[rightKnee].position.x, kp[rightKnee].position.y);
        ctx.fillText(joint_degree[leftKnee] + "°", kp[leftKnee].position.x, kp[leftKnee].position.y);
    }*/
}

function clearPoseRect(ctx){
    ctx.clearRect(0, 0, WIDTH, HEIGHT);
}

function drawScoreTimeSynchro(ctx){
    ctx.clearRect(0, 0, 1700, 700);
    var offset = 180;
    var height_diff = 200;

    //  Draw Score
    ctx.beginPath()
    ctx.font = "150pt 'Times New Roman'";
    ctx.fillStyle = "#000000";
    ctx.fillText("Score: "+ game_score, 20, offset);
    ctx.stroke();

    //  Draw Time
    if(game_status == game_mode.Playing){
        ctx.beginPath()
        ctx.font = "150pt 'Times New Roman'";
        ctx.fillStyle = "#000000";
        ctx.fillText(Math.round((GAME_TIME - (Date.now() - game_time)) / 1000) + " sec", 20, offset + height_diff);
        ctx.stroke();
    }

    //  Draw Synchro
    ctx.beginPath();
    ctx.font = "100pt 'Times New Roman'";
    ctx.fillStyle = getSynchroColor(synchro_percent);
    ctx.fillText("Synchro: " + lastUpdatedSynchroRate + "% ("+ synchro_percent + "%)", 20, offset + height_diff * 2);
    ctx.stroke();

    if(game_status == game_mode.End || game_status == game_mode.WaitingForPlayers){
        ctx.beginPath()
        var status_text = "";
        if(game_status == game_mode.End){
            status_text = "Game End";
        }
        if(game_status == game_mode.WaitingForPlayers){
            status_text = "Ready";
        }
        ctx.font = "290pt 'Times New Roman'";
        ctx.fillStyle = "#000000";
        ctx.fillText(status_text, 20, 700 / 2);
        ctx.fillStyle = "#006400";
        ctx.fillText(status_text, 24, 700 / 2 + 4);
        ctx.stroke();
    }
}

function getSynchroColor(rate) {
    if (rate < 60) {
        return "#FF0000";
    } else if (rate < 80) {
        return "#FFA500";
    } else {
        return "#118B11";
    }
}

function draw_man() {
    clearPoseRect(ctx);
    if(Captured_ManInTheMirror){
        drawPose(ctx, man1pose, joint_degree1, false/*true*//*mirror draw*/, 'black');  // pose instance for analysis
    }else{
        drawPose(ctx, man1pose, joint_degree1, false/*true*//*mirror draw*/, 'lightgray');  // pose for draw
    }

    clearPoseRect(ctx2);
    if(Captured_ManInFrontOfTheMirror){
        drawPose(ctx2, man2pose, joint_degree2, true/*false*//*mirror draw*/, 'black');  // pose instance for analysis
    }else{
        drawPose(ctx2, man2pose, joint_degree2, true/*false*//*mirror draw*/, 'lightgray');  // pose for draw
    }
}

function draw_mirror_out_gauge() {
    ctx.beginPath();
    ctx.fillStyle = "red";
    ctx.fillRect(0, 0, (FilterinField_ManInTheMirror / FilterinField_Max) * WIDTH, 20);
    ctx.stroke();

    ctx2.beginPath();
    ctx2.fillStyle = "red";
    ctx2.fillRect(0, 0, (FilterinField_ManInFrontOfTheMirror / FilterinField_Max) * WIDTH, 20);
    ctx2.stroke();

    if(FilterinField_ManInTheMirror > 0){
        ctx.beginPath()
        ctx.font = "15pt 'Times New Roman'";
        ctx.fillStyle = "#ffffff";
        ctx.fillText("Out Of Field", 10, 17);
        ctx.stroke();
    }

    if(FilterinField_ManInFrontOfTheMirror > 0){
        ctx2.beginPath()
        ctx2.font = "15pt 'Times New Roman'";
        ctx2.fillStyle = "#ffffff";
        ctx2.fillText("Out Of Field", 10, 17);
        ctx2.stroke();
    }
}

function draw_man_in_out() {
    if (!inField_ManInTheMirror) {
        ctx.beginPath();
        ctx.fillStyle = 'rgba(128,128,128,0.8)';
        ctx.fillRect(0, 0, WIDTH, HEIGHT);
        ctx.stroke();
    }
    if (!inField_ManInFrontOfTheMirror) {
        ctx2.beginPath();
        ctx2.fillStyle = 'rgba(128,128,128,0.8)';
        ctx2.fillRect(0, 0, WIDTH, HEIGHT);
        ctx2.stroke();
    }
}

function draw_canvasarea(){
  // canvas1 out of range
  ctx.fillStyle = 'rgba(128, 128, 128, 0.5)';
  ctx.fillRect(0, 0, left_range_1 * WIDTH, HEIGHT);
  ctx.fillRect(right_range_1 * WIDTH, 0, WIDTH - right_range_1 * WIDTH, HEIGHT);
  ctx.fillRect(left_range_1 * WIDTH, 0, right_range_1 * WIDTH - left_range_1 * WIDTH, top_range_1 * HEIGHT);
  ctx.fillRect(left_range_1 * WIDTH, bottom_range_1 * HEIGHT, right_range_1 * WIDTH - left_range_1 * WIDTH, HEIGHT - bottom_range_1 * HEIGHT);

  // canvas2 out of range
  ctx2.fillStyle = 'rgba(128, 128, 128, 0.5)';
  ctx2.fillRect(0, 0, left_range_2 * WIDTH, HEIGHT);
  ctx2.fillRect(right_range_2 * WIDTH, 0, WIDTH - right_range_2 * WIDTH, HEIGHT);
  ctx2.fillRect(left_range_2 * WIDTH, 0, right_range_2 * WIDTH - left_range_2 * WIDTH, top_range_2 * HEIGHT);
  ctx2.fillRect(left_range_2 * WIDTH, bottom_range_2 * HEIGHT, right_range_2 * WIDTH - left_range_2 * WIDTH, HEIGHT - bottom_range_2 * HEIGHT);
}

function handle_move(){
    ctx.beginPath();
    ctx.fillStyle = "lightblue";
    ctx.fillRect(0, 21, (man1pose_move / 50000) * WIDTH, 20);
    ctx.stroke();

    ctx2.beginPath();
    ctx2.fillStyle = "lightblue";
    ctx2.fillRect(0, 21, (man2pose_move / 50000) * WIDTH, 20);
    ctx2.stroke();

    if(man1pose_move > 1000){
        ctx.beginPath()
        ctx.font = "15pt 'Times New Roman'";
        ctx.fillStyle = "#000000";
        ctx.fillText(Math.round(man1pose_move/10000), 0, 37);
        ctx.stroke();
    }

    if(man2pose_move > 1000){
        ctx2.beginPath()
        ctx2.font = "15pt 'Times New Roman'";
        ctx2.fillStyle = "#000000";
        ctx2.fillText(Math.round(man2pose_move/10000), 0, 37);
        ctx2.stroke();
    }
}



// Pose Analyze -----------------------------------------------------------------------------------------

function calc_pose_move_total_diff(kp_before, kp_after) {
    var move = 0;

    move += Math.pow(kp_before[leftElbow].position.x - kp_after[leftElbow].position.x, 2) + Math.pow(kp_before[leftElbow].position.y - kp_after[leftElbow].position.y, 2);
    move += Math.pow(kp_before[leftWrist].position.x - kp_after[leftWrist].position.x, 2) + Math.pow(kp_before[leftWrist].position.y - kp_after[leftWrist].position.y, 2);
    move += Math.pow(kp_before[leftKnee].position.x - kp_after[leftKnee].position.x, 2)   + Math.pow(kp_before[leftKnee].position.y - kp_after[leftKnee].position.y, 2);
    move += Math.pow(kp_before[leftAnkle].position.x - kp_after[leftAnkle].position.x, 2) + Math.pow(kp_before[leftAnkle].position.y - kp_after[leftAnkle].position.y, 2);

    move += Math.pow(kp_before[rightElbow].position.x - kp_after[rightElbow].position.x, 2) + Math.pow(kp_before[rightElbow].position.y - kp_after[rightElbow].position.y, 2);
    move += Math.pow(kp_before[rightWrist].position.x - kp_after[rightWrist].position.x, 2) + Math.pow(kp_before[rightWrist].position.y - kp_after[rightWrist].position.y, 2);
    move += Math.pow(kp_before[rightKnee].position.x - kp_after[rightKnee].position.x, 2)   + Math.pow(kp_before[rightKnee].position.y - kp_after[rightKnee].position.y, 2);
    move += Math.pow(kp_before[rightAnkle].position.x - kp_after[rightAnkle].position.x, 2) + Math.pow(kp_before[rightAnkle].position.y - kp_after[rightAnkle].position.y, 2);

    return move;
}

function calculate_joint_degree(kp) {
    if (kp[leftShoulder] == null) return false;
    var joint_degree = new Array(numOfJoint);

    joint_degree[nose] = 0; joint_degree[leftEye] = 0;  joint_degree[rightEye] = 0;   // not used
    joint_degree[leftEar] = 0;  joint_degree[rightEar] = 0; joint_degree[leftWrist] = 0;   // not used
    joint_degree[rightWrist] = 0; joint_degree[leftAnkle] = 0; joint_degree[rightAnkle] = 0;   // not used

    const leftShoulder_x = kp[leftShoulder].position.x;
    const leftShoulder_y = kp[leftShoulder].position.y;
    joint_degree[leftShoulder] = Math.round(degree(vector_theta(leftShoulder_x - kp[leftElbow].position.x, leftShoulder_y - kp[leftElbow].position.y,
        leftShoulder_x - kp[leftHip].position.x, leftShoulder_y - kp[leftHip].position.y)));

    const rightShoulder_x = kp[rightShoulder].position.x;
    const rightShoulder_y = kp[rightShoulder].position.y;
    joint_degree[rightShoulder] = Math.round(degree(vector_theta(rightShoulder_x - kp[rightElbow].position.x, rightShoulder_y - kp[rightElbow].position.y,
        rightShoulder_x - kp[rightHip].position.x, rightShoulder_y - kp[rightHip].position.y)));

    const leftElbow_x = kp[leftElbow].position.x;
    const leftElbow_y = kp[leftElbow].position.y;
    joint_degree[leftElbow] = Math.round(degree(vector_theta(leftElbow_x - kp[leftShoulder].position.x, leftElbow_y - kp[leftShoulder].position.y,
        leftElbow_x - kp[leftWrist].position.x, leftElbow_y - kp[leftWrist].position.y)));

    const rightElbow_x = kp[rightElbow].position.x;
    const rightElbow_y = kp[rightElbow].position.y;
    joint_degree[rightElbow] = Math.round(degree(vector_theta(rightElbow_x - kp[rightShoulder].position.x, rightElbow_y - kp[rightShoulder].position.y,
        rightElbow_x - kp[rightWrist].position.x, rightElbow_y - kp[rightWrist].position.y)));

    const leftHip_x = kp[leftHip].position.x;
    const leftHip_y = kp[leftHip].position.y;
    joint_degree[leftHip] = Math.round(degree(vector_theta(leftHip_x - kp[leftKnee].position.x, leftHip_y - kp[leftKnee].position.y,
        leftHip_x - kp[leftShoulder].position.x, leftHip_y - kp[leftShoulder].position.y)));

    const rightHip_x = kp[rightHip].position.x;
    const rightHip_y = kp[rightHip].position.y;
    joint_degree[rightHip] = Math.round(degree(vector_theta(rightHip_x - kp[rightKnee].position.x, rightHip_y - kp[rightKnee].position.y,
        rightHip_x - kp[rightShoulder].position.x, rightHip_y - kp[rightShoulder].position.y)));

    const rightKnee_x = kp[rightKnee].position.x;
    const rightKnee_y = kp[rightKnee].position.y;
    joint_degree[rightKnee] = Math.round(degree(vector_theta(rightKnee_x - kp[rightHip].position.x, rightKnee_y - kp[rightHip].position.y,
        rightKnee_x - kp[rightAnkle].position.x, rightKnee_y - kp[rightAnkle].position.y)));

    const leftKnee_x = kp[leftKnee].position.x;
    const leftKnee_y = kp[leftKnee].position.y;
    joint_degree[leftKnee] = Math.round(degree(vector_theta(leftKnee_x - kp[leftHip].position.x, leftKnee_y - kp[leftHip].position.y,
        leftKnee_x - kp[leftAnkle].position.x, leftKnee_y - kp[leftAnkle].position.y)));

    return joint_degree;
}

function isInField(kp, x_left, x_right, y_top, y_bottom) {
    if (kp[leftShoulder] == null) return false;
    var result = true;

    if (kp[leftShoulder].position.x < x_left || kp[leftShoulder].position.x > x_right) result = false;
    if (kp[rightShoulder].position.x < x_left || kp[rightShoulder].position.x > x_right) result = false;
    if (kp[leftElbow].position.x < x_left || kp[leftElbow].position.x > x_right) result = false;
    if (kp[rightElbow].position.x < x_left || kp[rightElbow].position.x > x_right) result = false;
    if (kp[leftWrist].position.x < x_left || kp[leftWrist].position.x > x_right) result = false;
    if (kp[rightWrist].position.x < x_left || kp[rightWrist].position.x > x_right) result = false;
    if(areamode == 0){  // Check only on Full Body Mode. Ignore if the area mode is not full
        if (kp[leftHip].position.x < x_left || kp[leftHip].position.x > x_right) result = false;
        if (kp[rightHip].position.x < x_left || kp[rightHip].position.x > x_right) result = false;
        if( kp[leftKnee].position.x < x_left || kp[leftKnee].position.x > x_right) result = false;
        if( kp[rightKnee].position.x < x_left || kp[rightKnee].position.x > x_right) result = false;
        if( kp[leftAnkle].position.x < x_left || kp[leftAnkle].position.x > x_right) result = false;
        if( kp[rightAnkle].position.x < x_left || kp[rightAnkle].position.x > x_right) result = false;
    }

    if (kp[leftShoulder].position.y < y_top || kp[leftShoulder].position.y > y_bottom) result = false;
    if (kp[rightShoulder].position.y < y_top || kp[rightShoulder].position.y > y_bottom) result = false;
    if (kp[leftElbow].position.y < y_top || kp[leftElbow].position.y > y_bottom) result = false;
    if (kp[rightElbow].position.y < y_top || kp[rightElbow].position.y > y_bottom) result = false;
    if (kp[leftWrist].position.y < y_top || kp[leftWrist].position.y > y_bottom) result = false;
    if (kp[rightWrist].position.y < y_top || kp[rightWrist].position.y > y_bottom) result = false;
    if(areamode == 0){  // Check only on Full Body Mode
        if (kp[leftHip].position.y < y_top || kp[leftHip].position.y > y_bottom) result = false;
        if (kp[rightHip].position.y < y_top || kp[rightHip].position.y > y_bottom) result = false;
        if( kp[leftKnee].position.y < y_top || kp[leftKnee].position.y > y_bottom) result = false;
        if( kp[rightKnee].position.y < y_top || kp[rightKnee].position.y > y_bottom) result = false;
        if( kp[leftAnkle].position.y < y_top || kp[leftAnkle].position.y > y_bottom) result = false;
        if( kp[rightAnkle].position.y < y_top || kp[rightAnkle].position.y > y_bottom) result = false;
    }

    return result;
}

function mirror_joint_degree(joint_degree) {
    var mirror_joint_degree = new Array(numOfJoint);

    mirror_joint_degree[nose] = 0; mirror_joint_degree[leftEye] = 0; mirror_joint_degree[rightEye] = 0;   // not used
    mirror_joint_degree[leftEar] = 0; mirror_joint_degree[rightEar] = 0; mirror_joint_degree[leftWrist] = 0;   // not used
    mirror_joint_degree[rightWrist] = 0; mirror_joint_degree[leftAnkle] = 0; mirror_joint_degree[rightAnkle] = 0;   // not used

    var temp_degree = joint_degree[leftShoulder];
    mirror_joint_degree[leftShoulder] = joint_degree[rightShoulder];
    mirror_joint_degree[rightShoulder] = temp_degree;

    temp_degree = joint_degree[leftElbow];
    mirror_joint_degree[leftElbow] = joint_degree[rightElbow];
    mirror_joint_degree[rightElbow] = temp_degree;

    temp_degree = joint_degree[leftWrist];
    mirror_joint_degree[leftWrist] = joint_degree[rightWrist];
    mirror_joint_degree[rightWrist] = temp_degree;

    temp_degree = joint_degree[leftHip];
    mirror_joint_degree[leftHip] = joint_degree[rightHip];
    mirror_joint_degree[rightHip] = temp_degree;

    temp_degree = joint_degree[leftKnee];
    mirror_joint_degree[leftKnee] = joint_degree[rightKnee];
    mirror_joint_degree[rightKnee] = temp_degree;

    temp_degree = joint_degree[leftKnee];
    mirror_joint_degree[leftKnee] = joint_degree[rightKnee];
    mirror_joint_degree[rightKnee] = temp_degree;

    return mirror_joint_degree;
}


// Compare Pose (Calc synchro) -----------------------------------------------------------------------------------------

function compare_joint_degree() {
    if(!Captured_ManInTheMirror || !Captured_ManInFrontOfTheMirror) {synchro=900;return;console.log("out of field!!!")}
    var sync_confidence = 0;
    var mirror_joint_degree2 = mirror_joint_degree(joint_degree2);
    for (var i = 0; i < numOfJoint; i++) {
        if(areamode == 1 && numOfJoint >= leftHip) continue;  // Ignore if the area mode is upper body and not upper body
        var diff = Math.abs(joint_degree1[i] - mirror_joint_degree2[i]);
        if (diff > 10) {
            sync_confidence = sync_confidence + diff;
        }else if (diff > 40) {
            sync_confidence = sync_confidence + diff * 2;
        }
    }
    let time = Date.now();
//    console.log("Calc synchro:" + Date(time) + " " + time)
    synchro = sync_confidence;

    return;
}

// Calc Synchro
let synchroRates = new Array(100).fill(100);
let synchroRateIndex = 0;
let lastUpdatedSynchroRate = 100;
let lastSynchroRateUpdateTime = Date.now();

function updateSynchroRate() {
    let currentSynchroRate = Math.round((1000 - synchro) / 10);
    if (currentSynchroRate < 0) currentSynchroRate = 0;

    synchroRates[synchroRateIndex] = currentSynchroRate;
    synchroRateIndex = (synchroRateIndex + 1) % 100;

    let maxSynchroRate = Math.max(...synchroRates);
    let averageSynchroRate = synchroRates.reduce((a, b) => a + b, 0) / synchroRates.length;

    if (currentSynchroRate > maxSynchroRate) {
        synchro_percent = currentSynchroRate;
    } else {
        synchro_percent = Math.round(averageSynchroRate);
    }

    let currentTime = Date.now();
    if (currentTime - lastSynchroRateUpdateTime >= 1000) {
        lastUpdatedSynchroRate = synchro_percent;
        lastSynchroRateUpdateTime = currentTime;
    }
}

let lastScoreUpdateTime = Date.now();
function add_score_and_synchro_percent() {
    if(game_status != game_mode.Playing) return;

    let currentTime = Date.now();
//    console.log("score calc: " + new Date(currentTime).toISOString() + " " + currentTime);

    var double_point = 1;
    if(Date.now() - game_time > GAME_DOUBLE_POINT_TIME){
        double_point = 2;
        console.log("doublePoint time");
    }

    synchro_percent = Math.round((1000 - synchro) / 10);
    if (synchro_percent < 0) synchro_percent = 0;

    if (synchro_percent >= 85) {
        if (currentTime - lastScoreUpdateTime >= 1000) {
            game_score += 10 * double_point;
            lastScoreUpdateTime = currentTime;
            console.log("game score add " + double_point)
        }
    }else if(synchro_percent < 80 && synchro_percent > 60){
        game_score--;
    }else{  // less than 60
        game_score -= 10;
    }

    // Move point calculation
    let move_value = Math.max(Math.round(man1pose_move/10000), Math.round(man2pose_move/10000));
    if (move_value > 0 && synchro_percent > 85) {
        let move_points = (synchro_percent - 85) * move_value;
        move_points = Math.min(move_points, 1000) * double_point;
        game_score += Math.max(0, Math.round(move_points));
    }

    // Sound
    if (synchro_percent < 60) {
        playNavigationSound(sound_navigation_list.Synchronized_alert);
    } else if (synchro_percent < 80) {
        playNavigationSound(sound_navigation_list.Not_synchronized);
    } else {        // Synchro >= 80
        if(move_value > 3){
            playSound_se(sound_se_list.se_MagicCharge1_soundeffectlab,VOLUME_HI);  // Super Power Point
        }else if(move_value > 1){
            playSound_se(sound_se_list.se_MagicCharge2_soundeffectlab,VOLUME_MID);  // Power Point
        }
    }
    man1pose_move = 0;
    man2pose_move = 0;

    if(game_score < 0)game_score = 0;

    if (game_score >= 500 && game_score < 1000 && !cheers_played[500]) {
        playSound_se(sound_se_list.se_Cheers_soundeffectlab, VOLUME_MID);
        read_score();
        cheers_played[500] = true;
    } else if (game_score >= 1000 && game_score < 1500 && !cheers_played[1000]) {
        playSound_se(sound_se_list.se_Cheers_soundeffectlab, VOLUME_MID);
        read_score();
        cheers_played[1000] = true;
    } else if (game_score >= 1500 && game_score < 2000 && !cheers_played[1500]) {
        playSound_se(sound_se_list.se_Cheers_soundeffectlab, VOLUME_MID);
        read_score();
        cheers_played[1500] = true;
    } else if (game_score >= 2000 && !cheers_played[2000]) {
        playSound_se(sound_se_list.se_CheersStadium_soundeffectlab, VOLUME_DEFAULT);
        read_score();
        cheers_played[2000] = true;
    }
}

// Punch sound detect -----------------------------------------------------------------------------------------
let prevLeftWristPos1 = null;
let prevRightWristPos1 = null;
let prevLeftWristPos2 = null;
let prevRightWristPos2 = null;
let prevLeftWristTime1 = Date.now();
let prevRightWristTime1 = Date.now();
let prevLeftWristTime2 = Date.now();
let prevRightWristTime2 = Date.now();
let isLeftPunchMoving1 = false;
let isRightPunchMoving1 = false;
let isLeftPunchMoving2 = false;
let isRightPunchMoving2 = false;
const speedThreshold = 600; // pixel/sec
const speedThreshold_low = 0.2;

function calc_wrist_speed(wristPos, prevWristPos, prevWristTime) {
  const currentTime = Date.now();
  if (prevWristPos === null || currentTime - prevWristTime < 50) {
    return { speed: 0, currentTime: prevWristTime };
  }

  const deltaTime = (currentTime - prevWristTime) / 1000;
  const deltaPos = Math.sqrt(
    Math.pow(wristPos.x - prevWristPos.x, 2) +
    Math.pow(wristPos.y - prevWristPos.y, 2)
  );
  const speed = deltaPos / deltaTime;

  return speed;
}

function handle_punch_sound(WristPos, prevWristPos, prevWristTime, isPunchMoving) {
  const WristSpeed = calc_wrist_speed(WristPos, prevWristPos, prevWristTime);

  if (WristSpeed > speedThreshold && !isPunchMoving) {
    isPunchMoving = true;
  } else if (WristSpeed <= speedThreshold_low && isPunchMoving) {
    playSound_se(sound_se_list.se_Punch_soundeffectlab, VOLUME_MID);
    isPunchMoving = false;
  }

  const currentTime = Date.now();
  if(currentTime - prevWristTime < 100){
    return {prevWristTime: prevWristTime, isPunchMoving: isPunchMoving};
  }else{
    return {prevWristTime: currentTime, isPunchMoving: isPunchMoving};
  }
}




// Man Status -----------------------------------------------------------------------------------------

function update_man_status() {
    // Calc Man1 in the mirror
    var ResultInField;
    if (Captured_ManInTheMirror) {
        ResultInField = isInField(man1pose, left_range_1*WIDTH, right_range_1*WIDTH, top_range_1*HEIGHT, bottom_range_1*HEIGHT);
    } else {
        ResultInField = false;
    }
    if (!inField_ManInTheMirror && ResultInField) {      // out of field to in field
        inField_ManInTheMirror = true;
        playNavigationSound(sound_navigation_list.FoundManInTheMirror);
        FilterinField_ManInTheMirror = 0;
    }

    if (ResultInField) {
        FilterinField_ManInTheMirror = 0;
    }
    if (inField_ManInTheMirror && !ResultInField) {      // in field to out of field
        FilterinField_ManInTheMirror++;
        if (FilterinField_ManInTheMirror > FilterinField_Max) {         // Detect filter
            inField_ManInTheMirror = false;
            playNavigationSound(sound_navigation_list.LostManInTheMirror);
        }
    }
    joint_degree1 = calculate_joint_degree(man1pose);



    // Calc Man1 in front of the mirror
    if (Captured_ManInFrontOfTheMirror) {
        ResultInField = isInField(man2pose, left_range_2*WIDTH, right_range_2*WIDTH, top_range_2*HEIGHT, bottom_range_2*HEIGHT);
    } else {
        ResultInField = false;
    }
    if (!inField_ManInFrontOfTheMirror && ResultInField) {      // out of field to in field
        inField_ManInFrontOfTheMirror = true;
        playNavigationSound(sound_navigation_list.FoundManInFrontOfTheMirror);
        FilterinField_ManInFrontOfTheMirror = 0;
    }

    if (ResultInField) {
        FilterinField_ManInFrontOfTheMirror = 0;
    }
    if (inField_ManInFrontOfTheMirror && !ResultInField) {      // in field to out of field
        FilterinField_ManInFrontOfTheMirror++;
        if (FilterinField_ManInFrontOfTheMirror > FilterinField_Max) {         // Detect filter
            inField_ManInFrontOfTheMirror = false;
            playNavigationSound(sound_navigation_list.LostManInFrontOfTheMirror);
        }
    }
    joint_degree2 = calculate_joint_degree(man2pose);
}



// Cam Pose Capture -----------------------------------------------------------------------------------------
let lastValidShoulderWidth1 = null;
let lastValidShoulderWidth2 = null;
const INVALID_POSE_THRESHOLD = 1000;
const ANALYZE_INTERVAL = 100;

function predictWebcam_common(predictVideo, predictFunc) {
    model.estimateMultiplePoses(predictVideo, {
        flipHorizontal: false,
        maxDetections: 3,       // number of person to detect
        scoreThreshold: 0.5,
        nmsRadius: 20
    }).then(function (predictions) {
        // Detect near center person
        const isVideo1 = predictVideo === video;
        const leftRange = isVideo1 ? left_range_1 * WIDTH : left_range_2 * WIDTH;
        const rightRange = isVideo1 ? right_range_1 * WIDTH : right_range_2 * WIDTH;
        const topRange = isVideo1 ? top_range_1 * HEIGHT : top_range_2 * HEIGHT;
        const bottomRange = isVideo1 ? bottom_range_1 * HEIGHT : bottom_range_2 * HEIGHT;

        const centerX = (leftRange + rightRange) / 2;
        let closestPose = null;
        let closestDistance = Infinity;

        for (const pose of predictions) {
            if(pose.score < 0.3 || !isInField(pose.keypoints, leftRange, rightRange, topRange, bottomRange)) continue;
            const shoulderCenterX = (pose.keypoints[leftShoulder].position.x + pose.keypoints[rightShoulder].position.x) / 2;
            const distance = Math.abs(shoulderCenterX - centerX);
            if (distance < closestDistance) {
                closestDistance = distance;
                closestPose = pose;
            }
        }

        const currentTime = Date.now();
        const lastPoseTime = isVideo1 ? man1pose_time : man2pose_time;

        if (closestPose) {                    // found available pose
            const currentPose = closestPose.keypoints;
            const lastValidShoulderWidth = isVideo1 ? lastValidShoulderWidth1 : lastValidShoulderWidth2;
            if (isValidPose_in30diff(currentPose, lastValidShoulderWidth) ||
                currentTime - (lastPoseTime || currentTime) >= INVALID_POSE_THRESHOLD) {

                if (isVideo1) { // viode1
                    let time = Date.now();
//                    console.log("Capture Video1: " + Date(time) + " " + time)
                    lastValidShoulderWidth1 = getShoulderWidth(currentPose);
                    if(currentTime - man1pose_time > ANALYZE_INTERVAL) {
                        if(man1pose_temp[0] == null) {
                            man1pose_temp = Object.assign({}, currentPose);
                        }
                        man1pose_move = calc_pose_move_total_diff(man1pose_temp, currentPose);  // diff from previous pose
                        man1pose_temp = Object.assign({}, currentPose);                         // for next analysis
                        man1pose_time = currentTime;
                    }
                    man1pose = Object.assign({}, currentPose);
                    Captured_ManInTheMirror = true;
                } else {        // video2
                    let time = Date.now();
//                    console.log("Capture Video2: " + Date(time) + " " + time)
                    lastValidShoulderWidth2 = getShoulderWidth(currentPose);
                    if(currentTime - man2pose_time > ANALYZE_INTERVAL) {
                        if(man2pose_temp[0] == null) {
                            man2pose_temp = Object.assign({}, currentPose);
                        }
                        man2pose_move = calc_pose_move_total_diff(man2pose_temp, currentPose);
                        man2pose_temp = Object.assign({}, currentPose);
                        man2pose_time = currentTime;
                    }
                    man2pose = Object.assign({}, currentPose);
                    Captured_ManInFrontOfTheMirror = true;
                }
            }
        }else{                                  // not found available pose
            let NotAvailablePose = null;
            let NotAvailableScore = 0;
            for (const pose of predictions) {
                if(NotAvailableScore < pose.score){
                    NotAvailablePose = pose;
                    NotAvailableScore = pose.score;
                }
            }
            if (isVideo1) {
                if(NotAvailablePose != null){
                    man1pose = Object.assign({}, NotAvailablePose.keypoints);
                }
                lastValidShoulderWidth1 = null;
                man1pose_time = currentTime;
                Captured_ManInTheMirror = false;
            } else {
                if(NotAvailablePose != null){
                    man2pose = Object.assign({}, NotAvailablePose.keypoints);
                }
                lastValidShoulderWidth2 = null;
                man2pose_time = currentTime;
                Captured_ManInFrontOfTheMirror = false;
            }
        }

        window.requestAnimationFrame(predictFunc);
    });
}

function getShoulderWidth(pose) {
    return Math.abs(pose[leftShoulder].position.x - pose[rightShoulder].position.x);
}

function isValidPose_in30diff(currentPose, lastValidShoulderWidth) {
    if (lastValidShoulderWidth === null) return true;

    const currentShoulderWidth = getShoulderWidth(currentPose);
    const widthDifference = Math.abs(currentShoulderWidth - lastValidShoulderWidth) / lastValidShoulderWidth;

    return widthDifference < 0.3;
}

// in the mirror
function predictWebcam() {
    predictWebcam_common(video, predictWebcam);
}

// in front of the mirror
function predictWebcam2() {
    predictWebcam_common(video2, predictWebcam2);
}


// Setup Cam/Sound by Setup Button -----------------------------------------------------------------------------------------

function getDeviceList_SoundOn() {
    window.getDeviceList();
    initSound_bgm();
    initSound_se();
    initSound_navigation();
    sound_on = true;
    navigation_seq = 0;

    // Camera Auto Set
    setTimeout(function() {
        var videoDevices = cameraList.options;
        if (videoDevices.length === 1) {
            // Set 1 cam
            cameraList.selectedIndex = 0;
            enableWebcamButton1.click();
            enableWebcamButton2.click();
        } else if (videoDevices.length >= 2) {
            // Set 2 cam
            cameraList.selectedIndex = 0;
            enableWebcamButton1.click();
            cameraList.selectedIndex = 1;
            enableWebcamButton2.click();
        }
    }, 500); // 500msec delay to set cam
}


// Manual start button -----------------------------------------------------------------------------------------
function updateStartButtonState() {
    manualStartButton.disabled = !(inField_ManInFrontOfTheMirror && inField_ManInTheMirror);
}

startModeToggle.addEventListener('click', function() {
    isAutoStart = !isAutoStart;
    startModeToggle.textContent = isAutoStart ? 'Auto Start' : 'Manual Start';
    manualStartButton.style.display = isAutoStart ? 'none' : 'inline-block';
});

manualStartButton.addEventListener('click', function() {
    if (inField_ManInFrontOfTheMirror && inField_ManInTheMirror) {
        startGame();
    }
});



// Cam area UI -----------------------------------------------------------------------------------------
topRangeSlider1.addEventListener('input', function() {
    top_range_1 = parseFloat(this.value);
  });
  bottomRangeSlider1.addEventListener('input', function() {
    bottom_range_1 = parseFloat(this.value);
  });
  leftRangeSlider1.addEventListener('input', function() {
    left_range_1 = parseFloat(this.value);
  });
  rightRangeSlider1.addEventListener('input', function() {
    right_range_1 = parseFloat(this.value);
  });

topRangeSlider2.addEventListener('input', function() {
  top_range_2 = parseFloat(this.value);
});
bottomRangeSlider2.addEventListener('input', function() {
  bottom_range_2 = parseFloat(this.value);
});
leftRangeSlider2.addEventListener('input', function() {
  left_range_2 = parseFloat(this.value);
});
rightRangeSlider2.addEventListener('input', function() {
  right_range_2 = parseFloat(this.value);
});

function saveRangeSettings() {
    localStorage.setItem('top_range_1', top_range_1);
    localStorage.setItem('bottom_range_1', bottom_range_1);
    localStorage.setItem('left_range_1', left_range_1);
    localStorage.setItem('right_range_1', right_range_1);
    localStorage.setItem('top_range_2', top_range_2);
    localStorage.setItem('bottom_range_2', bottom_range_2);
    localStorage.setItem('left_range_2', left_range_2);
    localStorage.setItem('right_range_2', right_range_2);
}

function loadRangeSettings() {
    const savedTopRange1 = localStorage.getItem('top_range_1');
    if (savedTopRange1 !== null) {
      top_range_1 = parseFloat(savedTopRange1);
      topRangeSlider1.value = savedTopRange1;
    }
    const savedBottomRange1 = localStorage.getItem('bottom_range_1');
    if (savedBottomRange1 !== null) {
      bottom_range_1 = parseFloat(savedBottomRange1);
      bottomRangeSlider1.value = savedBottomRange1;
    }
    const savedLeftRange1 = localStorage.getItem('left_range_1');
    if (savedLeftRange1 !== null) {
      left_range_1 = parseFloat(savedLeftRange1);
      leftRangeSlider1.value = savedLeftRange1;
    }
    const savedRightRange1 = localStorage.getItem('right_range_1');
    if (savedRightRange1 !== null) {
      right_range_1 = parseFloat(savedRightRange1);
      rightRangeSlider1.value = savedRightRange1;
    }
    const savedTopRange2 = localStorage.getItem('top_range_2');
    if (savedTopRange2 !== null) {
      top_range_2 = parseFloat(savedTopRange2);
      topRangeSlider2.value = savedTopRange2;
    }
    const savedBottomRange2 = localStorage.getItem('bottom_range_2');
    if (savedBottomRange2 !== null) {
      bottom_range_2 = parseFloat(savedBottomRange2);
      bottomRangeSlider2.value = savedBottomRange2;
    }
    const savedLeftRange2 = localStorage.getItem('left_range_2');
    if (savedLeftRange2 !== null) {
      left_range_2 = parseFloat(savedLeftRange2);
      leftRangeSlider2.value = savedLeftRange2;
    }
    const savedRightRange2 = localStorage.getItem('right_range_2');
    if (savedRightRange2 !== null) {
      right_range_2 = parseFloat(savedRightRange2);
      rightRangeSlider2.value = savedRightRange2;
    }
  }

  topRangeSlider1.addEventListener('input', function() {
    top_range_1 = parseFloat(this.value);
    saveRangeSettings();
  });
  bottomRangeSlider1.addEventListener('input', function() {
    bottom_range_1 = parseFloat(this.value);
    saveRangeSettings();
  });
  leftRangeSlider1.addEventListener('input', function() {
    left_range_1 = parseFloat(this.value);
    saveRangeSettings();
  });
  rightRangeSlider1.addEventListener('input', function() {
    right_range_1 = parseFloat(this.value);
    saveRangeSettings();
  });
  topRangeSlider2.addEventListener('input', function() {
    top_range_2 = parseFloat(this.value);
    saveRangeSettings();
  });
  bottomRangeSlider2.addEventListener('input', function() {
    bottom_range_2 = parseFloat(this.value);
    saveRangeSettings();
  });
  leftRangeSlider2.addEventListener('input', function() {
    left_range_2 = parseFloat(this.value);
    saveRangeSettings();
  });
  rightRangeSlider2.addEventListener('input', function() {
    right_range_2 = parseFloat(this.value);
    saveRangeSettings();
  });

// Sound Volume UI -----------------------------------------------------------------------------------------

bgmVolumeSlider.addEventListener('input', function() {
    VOLUME_BGM = this.value;
    SetBGMVolume(VOLUME_BGM);
    localStorage.setItem('bgmVolume', VOLUME_BGM);
});

seVolumeSlider.addEventListener('input', function() {
    VOLUME_SE = this.value;
    localStorage.setItem('seVolume', VOLUME_SE);
});

navigationVolumeSlider.addEventListener('input', function() {
   VOLUME_NAVIGATION = this.value;
   localStorage.setItem('navigationVolume', VOLUME_NAVIGATION);
});

speechVolumeSlider.addEventListener('input', function() {
    VOLUME_SPEECH = this.value;
    localStorage.setItem('speechVolume', VOLUME_SPEECH);
});

  function loadSavedVolume() {
    const savedBgmVolume = localStorage.getItem('bgmVolume');
    if (savedBgmVolume !== null) {
      VOLUME_BGM = savedBgmVolume;
      bgmVolumeSlider.value = savedBgmVolume;
      SetBGMVolume(VOLUME_BGM);
    }

    const savedSeVolume = localStorage.getItem('seVolume');
    if (savedSeVolume !== null) {
        VOLUME_SE = savedSeVolume;
        seVolumeSlider.value = savedSeVolume;
    }

    const savedNavigationVolume = localStorage.getItem('navigationVolume');
    if (savedNavigationVolume !== null) {
        VOLUME_NAVIGATION = savedNavigationVolume;
        navigationVolumeSlider.value = savedNavigationVolume;
    }

    const savedSpeechVolume = localStorage.getItem('speechVolume');
    if (savedSpeechVolume !== null) {
        VOLUME_SPEECH = savedSpeechVolume;
        speechVolumeSlider.value = savedSpeechVolume;
    }
  }


// Audio Control -----------------------------------------------------------------------------------------
function handle_Sounds() {
    if (bgm_stopping) {
        stopBGM();
        bgm_stopping = false;
    }
}

var navigation_seq = 0;
function repeatNavigationSound(){
    switch (navigation_seq) {
        case 0:
            if(Date.now() - navigation_sound_repeat_time < 10000) return;
            speech_cancel_all();
            language_instruction = "ja";
            speech_string.push(speech_text.GameInstruction1);
            speech_string.push(speech_text.GameInstruction2);
            break;
        case 1:
            if(Date.now() - navigation_sound_repeat_time < 40000) return;
            navigation_sound_queue.push(sound_navigation_list.Setup);
            break;
        case 2:
            if(Date.now() - navigation_sound_repeat_time < 10000) return;
            speech_cancel_all();
            language_instruction = "en";
            speech_string.push(speech_text_en.GameInstruction1);
            speech_string.push(speech_text_en.GameInstruction2);
            break;
        case 3:
            if(Date.now() - navigation_sound_repeat_time < 40000) return;
            speech_cancel_all();
            language_instruction = "en";
            speech_string.push(speech_text_en.Setup);
            break;
        default:
    }
    navigation_seq++;
    if(navigation_seq == 4) navigation_seq = 0;

    navigation_sound_repeat_time = Date.now();
}

function read_score_controller(){
    if(game_status != game_mode.Playing) return;
    if(Date.now()-game_score_read_time > 10000){
        read_score();
    }
}

function read_score(){
    speech_push(game_score + speech_text.ReadScore);
    game_score_read_time = Date.now();
}

// 10, 30, 60sec announcement -----------------------------------------------------------------------------------------
function checkAnnouncements() {
    const currentTime = Date.now();
    const elapsedTime = currentTime - game_time;

    if (elapsedTime >= 10000 && !announcementsMade.tenSeconds) {
        speech(speech_text.Announce_10sec);
        announcementsMade.tenSeconds = true;
    }

    if (elapsedTime >= 30000 && !announcementsMade.thirtySeconds) {
        speech(speech_text.Announce_30sec);
        announcementsMade.thirtySeconds = true;
    }

    if (elapsedTime >= 60000 && !announcementsMade.sixtySeconds) {
        speech(speech_text.Announce_60sec);
        announcementsMade.sixtySeconds = true;
    }
}


// Game Status -----------------------------------------------------------------------------------------
function startGame() {
    game_status = game_mode.Playing;
    gameend_sound_played = false;
    gameend_speech_done = false;
    swing_se_sound_count = 0;
    swing_se_sound_count_time = Date.now();
    synchro_percent = 100;
    game_score = 0;
    man1pose_move = 0;
    man2pose_move = 0;
    man1pose_time = Date.now();
    man2pose_time = Date.now();
    game_score_read_time = Date.now();
    game_time = Date.now();
    lastScoreUpdateTime = Date.now();
    announcementsMade = {
        tenSeconds: false,
        thirtySeconds: false,
        sixtySeconds: false
    };
    language_instruction = "";  // for repeat navigation sound
    speech_cancel_all();
    playNavigationSound(sound_navigation_list.GameStart);
    playBGM();
}

var gameend_speech_done = true;
function update_game_status() {
    switch (game_status) {
        case game_mode.WaitingForPlayers:
            if (isAutoStart && inField_ManInFrontOfTheMirror && inField_ManInTheMirror) {    // Play Status
                startGame();
            } else {
                repeatNavigationSound();
                updateStartButtonState();
            }
            break

        case game_mode.Playing:
            if (!inField_ManInFrontOfTheMirror && !inField_ManInTheMirror) {    // Play Status -> End
                game_status = game_mode.End;
                playNavigationSound(sound_navigation_list.LostPlayers);
                game_end_timer = Date.now();
            } else if (!inField_ManInFrontOfTheMirror || !inField_ManInTheMirror) {    // Play Status -> Pause
                game_status = game_mode.Pause;
            }

            if(Date.now() - game_time > GAME_TIME){     // 60 sec play
                game_status = game_mode.End;
//                playNavigationSound(sound_navigation_list.GameComplete);  duplicate with GameEnd
                game_end_timer = Date.now();
            }
            break

        case game_mode.Pause:
            if (!inField_ManInFrontOfTheMirror && !inField_ManInTheMirror) {    // Play Status -> End
                game_status = game_mode.End;
                playNavigationSound(sound_navigation_list.LostPlayers);
                game_end_timer = Date.now();
            } else if (inField_ManInFrontOfTheMirror && inField_ManInTheMirror) {    // Pause Status -> Play Status
                game_status = game_mode.Playing;
            }
            break

        case game_mode.End:     // BGM End (Play all time or out of field)
            if(gameend_speech_done == false){
                playNavigationSound(sound_navigation_list.GameEnd);
                gameend_speech_done = true;
            }
            if(gameend_sound_played == false){
                if(game_score > 1000){   // save the mirrory
                    playSound_se(sound_se_list.se_Shining_soundeffectlab, VOLUME_DEFAULT);
                }else{
//                    playSound_se(sound_navigation_list.se_GoblinShout_soundeffectlab);
                }
                playSound_se(sound_se_list.se_CheersEnding_soundeffectlab, VOLUME_DEFAULT);
                gameend_sound_played = true;
            }
            if(Date.now() - game_end_timer > 10000){    // keep end status for 10sec
                game_status = game_mode.WaitingForPlayers;
                updateStartButtonState();
            }
            bgm_stopping = true;
            break

        default:
    }
}


// Loop -----------------------------------------------------------------------------------------

function mirror_loop() {
    update_man_status();
    if (joint_degree1 && joint_degree2) {
        compare_joint_degree();
        updateSynchroRate();
    }
    if (man1pose[leftWrist]){
        const {prevWristTime: prevWristTime, isPunchMoving: isPunchMoving} = handle_punch_sound(man1pose[leftWrist].position, prevLeftWristPos1, prevLeftWristTime1, isLeftPunchMoving1);
        prevLeftWristTime1 = prevWristTime;
        prevLeftWristPos1 = man1pose[leftWrist].position;
        isLeftPunchMoving1 = isPunchMoving;
    }
    if (man1pose[rightWrist]){
        const {prevWristTime: prevWristTime, isPunchMoving: isPunchMoving} = handle_punch_sound(man1pose[rightWrist].position, prevRightWristPos1, prevRightWristTime1, isRightPunchMoving1);
        prevRightWristTime1 = prevWristTime;
        prevRightWristPos1 = man1pose[rightWrist].position;
        isRightPunchMoving1 = isPunchMoving;
    }
    if (man2pose[leftWrist]){
        const {prevWristTime: prevWristTime, isPunchMoving: isPunchMoving} = handle_punch_sound(man2pose[leftWrist].position, prevLeftWristPos2, prevLeftWristTime2, isLeftPunchMoving2);
        prevLeftWristTime2 = prevWristTime;
        prevLeftWristPos2 = man2pose[leftWrist].position;
        isLeftPunchMoving12 = isPunchMoving;
    }
    if (man2pose[rightWrist]){
        const {prevWristTime: prevWristTime, isPunchMoving: isPunchMoving} = handle_punch_sound(man2pose[rightWrist].position, prevRightWristPos2, prevRightWristTime2, isRightPunchMoving2);
        prevRightWristTime2 = prevWristTime;
        prevRightWristPos2 = man2pose[rightWrist].position;
        isRightPunchMoving2 = isPunchMoving;
    }

    draw_man();
    draw_mirror_out_gauge();
    draw_man_in_out();
    draw_canvasarea();
    drawScoreTimeSynchro(ctx_score);
    handle_move();
    update_game_status();
    add_score_and_synchro_percent();
    handle_Sounds();
    playNavigationQueue();
    speech_controller();
    read_score_controller();
    checkAnnouncements();
}

var move = function () {
    mirror_loop();

    clearTimeout(timer);
    timer = setTimeout(move, interval);
};

window.onload = function () {
    loadSavedVolume();
    loadRangeSettings();

    if(language === "en") {
        languageButton.textContent = "EN";
    } else {
        languageButton.textContent = "JP";
    }
    languageButton.classList.add('active-button');

    if(areamode == 1) {
        areaModeButton.textContent = "UpperBody";
    } else {
        areaModeButton.textContent = "FullBody";
    }
    areaModeButton.classList.add('active-button');

    move();
};