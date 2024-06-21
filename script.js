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
var canvas3 = document.getElementById('canvas3_status');
const ctx3_status = canvas3.getContext('2d')
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
var man1pose_draw = new Array(numOfJoint);
var man2pose_draw = new Array(numOfJoint);
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
  } else {
    language = "ja";
  }
}

function getUserMediaSupported() {
    return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
}

if (getUserMediaSupported()) {
    enableWebcamButton1.addEventListener('click', enableCam1);
    enableWebcamButton2.addEventListener('click', enableCam2);
} else {
    console.warn('getUserMedia() is not supported by your browser');
}

function change_areamode(event){
    if(areamode == 0){
        areamode = 1;
    }else{
        areamode = 0;
    }
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
    ctx.beginPath()
    ctx.font = "150pt 'Times New Roman'";

    if (synchro_percent < 60) {
        ctx.fillStyle = "#FF0000";
    } else if (synchro_percent < 80) {
        ctx.fillStyle = "#FFA500";
    } else {
        ctx.fillStyle = "#118B11";
    }

    ctx.fillText("Synchro: " + synchro_percent + "%", 20, offset + height_diff * 2);
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

function drawStatus(ctx) {
    ctx.clearRect(0, 0, 500, 50);

    var area_mode;
    if(areamode == 0){
        area_mode = "Full Body Mode";
    }else{
        area_mode = "Upper Body Mode";
    }

    var language_mode;
    if(language == "ja"){
        language_mode = "JP";
    }else{
        language_mode = "EN";
    }

    ctx.beginPath()
    ctx.font = "18pt 'Times New Roman'";
    ctx.fillText(area_mode + " / " + language_mode, 20, 20);
    ctx.fillStyle = "#000000";
    ctx.stroke();
}

function draw_man() {
    clearPoseRect(ctx);
    drawPose(ctx, man1pose_draw, joint_degree1, false/*true*//*mirror draw*/, 'lightgray');  // pose for draw
    if(Captured_ManInTheMirror){
        drawPose(ctx, man1pose, joint_degree1, false/*true*//*mirror draw*/, 'black');  // pose instance for analysis
    }

    clearPoseRect(ctx2);
    drawPose(ctx2, man2pose_draw, joint_degree2, true/*false*//*mirror draw*/, 'lightgray');  // pose for draw
    if(Captured_ManInFrontOfTheMirror){
        drawPose(ctx2, man2pose, joint_degree2, true/*false*//*mirror draw*/, 'black');  // pose instance for analysis
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
    if(!inField_ManInTheMirror || !inField_ManInFrontOfTheMirror) return;
    var sync_confidence = 0;
    var mirror_joint_degree2 = mirror_joint_degree(joint_degree2);
    for (var i = 0; i < numOfJoint; i++) {
        if(areamode == 1 && numOfJoint >= leftHip) continue;  // Ignore if the area mode is upper body and not upper body
        var diff = Math.abs(joint_degree1[i] - mirror_joint_degree2[i]);
        if (diff > 30) {
            sync_confidence = sync_confidence + diff;
        }
    }
    synchro = sync_confidence;

    return;
}

function handle_synchro_percent() {
    if(game_status != game_mode.Playing) return;
    synchro_counter++;
    if(synchro_counter < synchro_counter_max) return;
    synchro_counter = 0;

    synchro_percent = Math.round((1000 - synchro) / 10);
    if (synchro_percent < 0) synchro_percent = 0;

    if (synchro_percent < 60) {
        if (game_status == game_mode.Playing) {
          playNavigationSound(sound_navigation_list.Synchronized_alert);
        }
        game_score--;
    } else if (synchro_percent < 80) {
        if (game_status == game_mode.Playing) {
          playNavigationSound(sound_navigation_list.Not_synchronized);
        }
        game_score--;
    } else {
        var add_point = 10 + 30 * Math.round(man1pose_move/10000) * Math.round(man2pose_move/10000);
        var double_point = 1;
        if(Date.now() - game_time > 60){
            double_point = 2;
            console.log("doublePoint time");
        }
        game_score = game_score + add_point * double_point;
        console.log("Point" + add_point)
        if(add_point > 100){
            playSound_se(sound_se_list.se_MagicCharge1_soundeffectlab,VOLUME_HI);  // Super Power Point
        }else if(add_point > 30){
            playSound_se(sound_se_list.se_MagicCharge2_soundeffectlab,VOLUME_MID);  // Power Point
        }
        man1pose_move = 0;
        man2pose_move = 0;
    }
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

function predictWebcam_common(predictVideo, predictFunc) {
    model.estimateMultiplePoses(predictVideo, {
        flipHorizontal: false,
        maxDetections: 3,       // number of person to detect
        scoreThreshold: 0.5,
        nmsRadius: 20
    }).then(function (predictions) {
        // Detect frontmost person
        let frontmostPose = null;
        let frontmostY = Infinity;

        for (const pose of predictions) {
            const pose_leftShoulder = pose.keypoints[leftShoulder];
            const pose_rightShoulder = pose.keypoints[rightShoulder];
            var active_pose = false;

            if (predictVideo === video) {
                active_pose = isInField(pose.keypoints, left_range_1*WIDTH, right_range_1*WIDTH, top_range_1*HEIGHT, bottom_range_1*HEIGHT);
            }
            if (predictVideo === video2) {
                active_pose = isInField(pose.keypoints, left_range_2*WIDTH, right_range_2*WIDTH, top_range_2*HEIGHT, bottom_range_2*HEIGHT);
            }

            if (active_pose && pose_leftShoulder.score > 0.5 && pose_rightShoulder.score > 0.5) {
                const shoulderY = (pose_leftShoulder.position.y + pose_rightShoulder.position.y) / 2;   // frontmost
                if (shoulderY < frontmostY) {
                    frontmostY = shoulderY;
                    frontmostPose = pose;
                }
            }
        }

        if (frontmostPose) {                    // found available pose
            if (frontmostPose.score > 0.3) {
                var kp = frontmostPose.keypoints;
                const pose_leftShoulder = kp[leftShoulder];
                const pose_rightShoulder = kp[rightShoulder];
                if (predictVideo === video) {
                    if(Date.now() - man1pose_time > 100){    // count 100 msec
                        if(man1pose_temp[0] == null){man1pose_temp = Object.assign({}, kp);}
                        man1pose_move = calc_pose_move_total_diff(man1pose_temp, kp);           // detect amount of movement
                        man1pose_temp = Object.assign({}, kp);
                        man1pose_draw = Object.assign({}, kp);
                        man1pose_time = Date.now();
                    }
                    if(man1pose[0] == null){man1pose = Object.assign({}, kp);}
                    man1pose = Object.assign({}, kp);                   // latest pose
                    Captured_ManInTheMirror = true;
                }

                if (predictVideo === video2) {
                    if(Date.now() - man2pose_time > 100){    // count 100 msec
                        if(man2pose_temp[0] == null){man2pose_temp = Object.assign({}, kp);}
                        man2pose_move = calc_pose_move_total_diff(man2pose_temp, kp);           // detect amount of movement
                        man2pose_temp = Object.assign({}, kp);
                        man2pose_draw = Object.assign({}, kp);
                        man2pose_time = Date.now();
                    }
                    if(man2pose[0] == null){man2pose = Object.assign({}, kp);}
                    man2pose = Object.assign({}, kp);                   // latest pose
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
                break;
            }
            if (predictVideo === video && NotAvailablePose != null) {
                man1pose_draw = Object.assign({}, NotAvailablePose.keypoints);
                Captured_ManInTheMirror = false;
            }
            if (predictVideo === video2 && NotAvailablePose != null) {
                man2pose_draw = Object.assign({}, NotAvailablePose.keypoints);
                Captured_ManInFrontOfTheMirror = false;
            }
        }

        window.requestAnimationFrame(predictFunc);
    });
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
    getDeviceList();
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


// Cam Device -----------------------------------------------------------------------------------------

// Cam Device List
// https://qiita.com/massie_g/items/b9863e4366cfed339528
function getDeviceList() {
    clearDeviceList();
    navigator.mediaDevices.enumerateDevices()
        .then(function (devices) {
            devices.forEach(function (device) {
                console.log(device.kind + ": " + device.label +
                    " id = " + device.deviceId);
                addDevice(device);
            });
        })
        .catch(function (err) {
            console.error('enumerateDevide ERROR:', err);
        });
}

function clearDeviceList() {
    while (cameraList.lastChild) {
        cameraList.removeChild(cameraList.lastChild);
    }
}

function addDevice(device) {
    if (device.kind === 'videoinput') {
        var id = device.deviceId;
        var label = device.label || 'camera'; // label is available for https 

        var option = document.createElement('option');
        option.setAttribute('value', id);
        option.innerHTML = label;
        cameraList.appendChild(option);
    }
    else {
        console.log('UNKNOWN Device kind:' + device.kind);
    }
}


// Enable Cam

function getSelectedVideo() {
    var id = cameraList.options[cameraList.selectedIndex].value;
    return id;
}

function enableCam(event, video, predictFunc) {
    if (!model) {
      return;
    }
    event.target.classList.add('removed');
    // need on https to detect deviceid
    var deviceId = getSelectedVideo();
    var constraints = {
      video: {
        deviceId: deviceId
      }
    };

    navigator.mediaDevices.getUserMedia(constraints)
      .then(function (stream) {
        video.srcObject = stream;
        video.addEventListener('loadeddata', predictFunc);
      });
  }

  function enableCam1(event) {
    enableCam(event, video, predictWebcam);
  }

  function enableCam2(event) {
    enableCam(event, video2, predictWebcam2);
  }


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



// BGM(loop) -----------------------------------------------------------------------------------------

const sound_bgm_list = {
    Etude_Plus_Op10No1_MSumi: 'Etude_Plus_Op10No1_MSumi'
};
var mirror_sound_bgm = {};

var sound_play_time = Date.now();
var sound_repeat_time = Date.now();
var sound_queue = [];
const sound_sleeptime = 1500;

function initSound_bgm() {
    for (let key in sound_bgm_list) {
        if (!mirror_sound_bgm[key]) {
            mirror_sound_bgm[key] = new Audio('./music/sound_' + sound_bgm_list[key] + ".mp3");
            mirror_sound_bgm[key].load();
        }
    }
}

function playBGM(){
    if (mirror_sound_bgm[sound_bgm_list.Etude_Plus_Op10No1_MSumi] != null) {
        mirror_sound_bgm[sound_bgm_list.Etude_Plus_Op10No1_MSumi].play();
        mirror_sound_bgm[sound_bgm_list.Etude_Plus_Op10No1_MSumi].volume = VOLUME_BGM;
    }
}

function stopBGM() {
    if (mirror_sound_bgm[sound_bgm_list.Etude_Plus_Op10No1_MSumi] != null) {
        mirror_sound_bgm[sound_bgm_list.Etude_Plus_Op10No1_MSumi].pause();
        mirror_sound_bgm[sound_bgm_list.Etude_Plus_Op10No1_MSumi].currentTime = 0;
    }
}

function SetBGMVolume(volume){
    if (mirror_sound_bgm[sound_bgm_list.Etude_Plus_Op10No1_MSumi] != null) {
        mirror_sound_bgm[sound_bgm_list.Etude_Plus_Op10No1_MSumi].volume = volume;
    }
}

function pauseBgm() {
    for (let i = 0; i < sound_name.length; i++) {
        if (mirror_sound_bgm[i] != null) { mirror_sound_bgm[i].pause(); }
    }
}


function handle_Sounds() {
    if (bgm_stopping) {
        stopBGM();
        bgm_stopping = false;
    }
}

// Sound (Sound Effect): play as soon as possible  -----------------------------------------------------------------------------------------
const sound_se_list = {
    se_Shining_soundeffectlab: "se_Shining_soundeffectlab",
    se_GoblinShout_soundeffectlab: "se_GoblinShout_soundeffectlab",
    se_Punch_soundeffectlab: "se_Punch_soundeffectlab",
    se_MagicCharge1_soundeffectlab: "se_MagicCharge1_soundeffectlab",
    se_MagicCharge2_soundeffectlab: "se_MagicCharge2_soundeffectlab",
    se_Cheers_soundeffectlab: "se_Cheers_soundeffectlab",
    se_CheersStadium_soundeffectlab: "se_CheersStadium_soundeffectlab",
    se_CheersEnding_soundeffectlab: "se_CheersEnding_soundeffectlab"
};
var mirror_sound_se = {};

function initSound_se() {
    for (let key in sound_se_list) {
        if (!mirror_sound_se[key]) {
            console.log("load" + key);
            mirror_sound_se[key] = new Audio('./music/sound_' + sound_se_list[key] + ".mp3");
            mirror_sound_se[key].load();
        }
    }
}

function playSound_se(key, volume){
    if (mirror_sound_se[key] != null) {
        mirror_sound_se[key].currentTime = 0;
        mirror_sound_se[key].volume = VOLUME_SE * volume;
        mirror_sound_se[key].play();
    }
}

// Sound (Navigation): waits for a while after previous navigation -----------------------------------------------------------------------------------------
const sound_navigation_list = {
    Setup: "Setup",
    GameStart: "GameStart",
    GameEnd: "GameEnd",
    GameComplete: "GameComplete",
    Not_synchronized: "Not_synchronized",
    Synchronized_alert: "Synchronized_alert",
    FoundManInTheMirror: "FoundManInTheMirror",
    LostManInTheMirror: "LostManInTheMirror",
    FoundManInFrontOfTheMirror: "FoundManInFrontOfTheMirror",
    LostManInFrontOfTheMirror: "LostManInFrontOfTheMirror",
    LostPlayers: "LostPlayers"
};
var mirror_sound_navigation = {};
var pre_play_navigation_sound = -1;

var navigation_sound_play_time = Date.now();
var navigation_sound_repeat_time = Date.now();
var navigation_sound_queue = [];
const navigation_sound_sleeptime = 1500;


function initSound_navigation() {
    for (let key in sound_navigation_list) {
        if (!mirror_sound_navigation[key]) {
            mirror_sound_navigation[key] = new Audio('./music/sound_' + sound_navigation_list[key] + ".mp3");
            mirror_sound_navigation[key].load();
        }
    }
}
function playNavigationSound(key){
    if (language === "ja") {
        if (pre_play_navigation_sound == key) return; // avoid duplicate play
        navigation_sound_queue.push(key);
        pre_play_navigation_sound = key;
        playNavigationQueue();
      } else {
        speech_push(get_navigation_en_speech(key));
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

function playNavigationQueue(){
    if(Date.now() - navigation_sound_play_time < navigation_sound_sleeptime) return;
    if(navigation_sound_queue.length != 0){
        if (mirror_sound_navigation[navigation_sound_queue[0]] != null) {
            mirror_sound_navigation[navigation_sound_queue[0]].volume = VOLUME_NAVIGATION;
            mirror_sound_navigation[navigation_sound_queue[0]].play();
            navigation_sound_queue.shift();
            navigation_sound_play_time = Date.now();
            return true;    // Played
        }
    }
    return false;   // not played
}

function get_navigation_en_speech(key) {
    switch (key) {
      case sound_navigation_list.GameInstruction:
        return speech_text_en.GameInstruction;
      case sound_navigation_list.Setup:
        return speech_text_en.Setup;
      case sound_navigation_list.GameStart:
        return speech_text_en.GameStart;
      case sound_navigation_list.GameEnd:
        return speech_text_en.GameEnd;
      case sound_navigation_list.GameComplete:
        return speech_text_en.GameComplete;
      case sound_navigation_list.Not_synchronized:
        return speech_text_en.not_synchronized;
      case sound_navigation_list.Synchronized_alert:
        return speech_text_en.synchronized_alert;
      case sound_navigation_list.FoundManInTheMirror:
        return speech_text_en.FoundManInTheMirror;
      case sound_navigation_list.LostManInTheMirror:
        return speech_text_en.LostManInTheMirror;
      case sound_navigation_list.FoundManInFrontOfTheMirror:
        return speech_text_en.FoundManInFrontOfTheMirror;
      case sound_navigation_list.LostManInFrontOfTheMirror:
        return speech_text_en.LostManInFrontOfTheMirror;
      case sound_navigation_list.LostPlayers:
        return speech_text_en.LostPlayers;
      case speech_text.Announce_10sec:              // speech en/jp
        return speech_text_en.Announce_10sec;
      case speech_text.Announce_30sec:              // speech en/jp
        return speech_text_en.Announce_30sec;
      case speech_text.Announce_60sec:              // speech en/jp
        return speech_text_en.Announce_60sec;

      default:
        return "";
    }
  }

// Speech(PC) -----------------------------------------------------------------------------------------

const speech_text = Object.freeze({
    GameInstruction1: "みらーおぶてらーにようこそ。かがみのせかいにまよいこんでしまったみたいですね。このげーむは、ふたりであそびます。ぽーずをとるひと、それをまねするひとにわかれてください。",
    GameInstruction2: "ぽーずをとるひとはかがみのまえにたち。まねするひとはかがみのなかにたってください。いっぷんかん かがみになりきることができれば、かがみのせかいからぬけだせます。",
    Setup: "かがみのまえとなかにたってください",
    GameStart: "げーむをかいしします",
    GameEnd: "げーむしゅうりょうです",
    GameComplete: "よくできました。げーむかんりょうです",
    Not_synchronized: "ずれています",
    synchronized_alert: "まったくあっていませんよ",
    FoundManInTheMirror: "かがみのなかのひとをみつけました",
    LostManInTheMirror: "かがみのなかのひとをみうしないました",
    FoundManInFrontOfTheMirror: "かがみのまえのひとをみつけました",
    LostManInFrontOfTheMirror: "かがみのまえのひとをみうしないました",
    LostPlayers: "ぷれーやーがいなくなりました",
    ReadScore: "てんです",
    Announce_10sec: "ぽーずをあわせましょう。あっていればぽいんとがはいります",
    Announce_30sec: "ぽーずをあわせたままうごくとぽいんとあっぷ",
    Announce_60sec: "ぼーなすたいむ。とくてんがばいになります"
});

const speech_text_en = Object.freeze({
    GameInstruction1: "Welcome to Mirror of Terror. It seems like you've wandered into the world of mirrors. This game is played by two people. Please split into two roles.",
    GameInstruction2: "The person who poses and the person who imitates. The person who poses should stand in front of the mirror. while the person who imitates should stand inside the mirror. If you can fully become the mirror for one minute. you'll be able to escape from the mirror world.",
    Setup: "Please stand in front of and inside the mirror",
    GameStart: "Game will start now",
    GameEnd: "Game is over",
    GameComplete: "Well done. Game completed",
    Not_synchronized: "You are out of sync",
    synchronized_alert: "You are completely out of sync",
    FoundManInTheMirror: "Found a person in the mirror",
    LostManInTheMirror: "Lost the person in the mirror",
    FoundManInFrontOfTheMirror: "Found a person in front of the mirror",
    LostManInFrontOfTheMirror: "Lost the person in front of the mirror",
    LostPlayers: "Players are lost",
    ReadScore: "points",
    Announce_10sec: "Let's match our poses. Earn points when they align.",
    Announce_30sec: "Keep moving while maintaining the pose to increase points.",
    Announce_60sec: "Bonus time! Points are doubled."
});

var speech_string = [];
var pre_speech_string = "";

function speech(key){   // jp/en
    if (language === "ja") {
        speech_push(key);
      } else {
        speech_push(get_navigation_en_speech(key));
      }
}

function speech_push(string) {
    if (string == pre_speech_string) {
        return;
    }
    if (string == speech_text.GameStart || string == speech_text.GameEnd) { // Priority high speech
        speech_string.splice(0);    // remove all items
        //        window.speechSynthesis.cancel();  // cant control right after cancelling
        console.log("speech cancel");
    }

    speech_string.push(string);
    pre_speech_string = string;
}

function speech_controller() {
    if (!sound_on) return;
    if (speech_string.length != 0) {
        console.log(speech_string[0]);
        if (speech_string[0] != "") {
            if (speech_string[0] == speech_text.ReadScore || speech_string[0] == speech_text_en.ReadScore) {
              const uttr = new SpeechSynthesisUtterance(game_score + speech_string[0])
              uttr.lang = language;
              uttr.volume = VOLUME_SPEECH;
              window.speechSynthesis.speak(uttr);
            } else {
              const uttr = new SpeechSynthesisUtterance(speech_string[0])
              if(language_instruction != ""){
                uttr.lang = language_instruction;
              }else{
                uttr.lang = language;
              }
              uttr.volume = VOLUME_SPEECH;
              window.speechSynthesis.speak(uttr);
            }
          }
        speech_string.shift();
    }
}

function speech_cancel_all(){
    speech_string.splice(0);    // remove all items
    window.speechSynthesis.cancel();
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

var gameend_speech_done = true;
function update_game_status() {
    switch (game_status) {
        case game_mode.WaitingForPlayers:
            if (inField_ManInFrontOfTheMirror && inField_ManInTheMirror) {    // Play Status
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
                announcementsMade = {
                    tenSeconds: false,
                    thirtySeconds: false,
                    sixtySeconds: false
                };
                language_instruction = "";  // for repeat navigation sound
                speech_cancel_all();
                playNavigationSound(sound_navigation_list.GameStart);
                playBGM();
            } else {
                repeatNavigationSound();
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
    drawStatus(ctx3_status);
    handle_move();
    update_game_status();
    handle_synchro_percent();
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
    move();
};