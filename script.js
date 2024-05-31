const video = document.getElementById('webcam');
const video2 = document.getElementById('webcam2');
const enableWebcamButton1 = document.getElementById('webcamButton1');
const enableWebcamButton2 = document.getElementById('webcamButton2');
var cameraList = document.getElementById("camera_list");

var canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d')
var canvas2 = document.getElementById('canvas2');
const ctx2 = canvas2.getContext('2d')
var canvas3 = document.getElementById('canvas3_status');
const ctx3_status = canvas3.getContext('2d')
var canvas_score = document.getElementById('canvas_score');
const ctx_score = canvas_score.getContext('2d')
const cameraOptions = document.querySelector('.video-options>select');

const WIDTH = 320;
const HEIGHT = 320;

const VOLUME_BGM = 0.2;
const VOLUME_NAVIGATION = 0.7;
const VOLUME_SPEECH = 1.0;

const VOLUME_DEFAULT = 1.0;
const VOLUME_HI = 0.8;
const VOLUME_MID = 0.7;
const VOLUME_LOW = 0.01;
const GAME_TIME = 60000;

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

var kp_1 = new Array(numOfJoint);
var kp_2 = new Array(numOfJoint);
var kp_1_temp = new Array(numOfJoint);
var kp_2_temp = new Array(numOfJoint);
var kp_1_move = 0;
var kp_2_move = 0;
var kp_1_time = Date.now();
var kp_2_time = Date.now();


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

const drawLine = (ctx, kp0, kp1, mirror) => {
    if (kp0.score < 0.3 || kp1.score < 0.3) return
    ctx.strokeStyle = 'black'
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

const drawPoint = (ctx, kp, mirror) => {
    if (kp.score < 0.3) return
    ctx.fillStyle = 'black'
    ctx.beginPath()
    if (mirror) {
        ctx.arc(WIDTH - kp.position.x, kp.position.y, 3, 0, 2 * Math.PI);
    } else {
        ctx.arc(kp.position.x, kp.position.y, 3, 0, 2 * Math.PI);
    }
    ctx.fill()
}

const drawHead = (ctx, kp, kp2, mirror) => {
    if (kp.score < 0.3) return
    ctx.fillStyle = 'black'
    ctx.beginPath()
    if (mirror) {
        ctx.arc(WIDTH - kp.position.x, kp.position.y, Math.abs(kp2.position.x - kp.position.x) * 2, 0, 2 * Math.PI);
    } else {
        ctx.arc(kp.position.x, kp.position.y, Math.abs(kp2.position.x - kp.position.x) * 2, 0, 2 * Math.PI);
    }
    ctx.stroke()
}

function drawPose(ctx, kp, joint_degree, mirror/*true for mirror draw*/) {
    if (kp[leftShoulder] == null) return false;
    ctx.clearRect(0, 0, WIDTH, HEIGHT);
    drawHead(ctx, kp[nose], kp[leftEye], mirror);

    drawPoint(ctx, kp[nose], mirror);
    drawPoint(ctx, kp[leftEye], mirror);
    drawPoint(ctx, kp[rightEye], mirror);
    drawPoint(ctx, kp[leftEar], mirror);
    drawPoint(ctx, kp[rightEar], mirror);

    drawLine(ctx, kp[leftShoulder], kp[rightShoulder], mirror);
    drawLine(ctx, kp[leftShoulder], kp[leftElbow], mirror);
    drawLine(ctx, kp[leftElbow], kp[leftWrist], mirror);
    drawLine(ctx, kp[rightShoulder], kp[rightElbow], mirror);
    drawLine(ctx, kp[rightElbow], kp[rightWrist], mirror);
    drawLine(ctx, kp[leftShoulder], kp[leftHip], mirror);
    drawLine(ctx, kp[rightShoulder], kp[rightHip], mirror);
    drawLine(ctx, kp[leftHip], kp[rightHip], mirror);
    drawLine(ctx, kp[leftHip], kp[leftKnee], mirror);
    drawLine(ctx, kp[leftKnee], kp[leftAnkle], mirror);
    drawLine(ctx, kp[rightHip], kp[rightKnee], mirror);
    drawLine(ctx, kp[rightKnee], kp[rightAnkle], mirror);

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
function drawScoreTimeSynchro(ctx){
    ctx.clearRect(0, 0, 1700, 700);
    var offset = 180;
    var height_diff = 200;

    //  Draw Score
    ctx.beginPath()
    ctx.font = "150pt 'Times New Roman'";
    ctx.fillText("Score: "+ game_score, 20, offset);
    ctx.fillStyle = "#000000";
    ctx.stroke();

    //  Draw Time
    if(game_status == game_mode.Playing){
        ctx.beginPath()
        ctx.font = "150pt 'Times New Roman'";
        ctx.fillText(Math.round((GAME_TIME - (Date.now() - game_time)) / 1000) + " sec", 20, offset + height_diff);
        ctx.fillStyle = "#000000";
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
    ctx.fillStyle = "#000000";
    ctx.stroke();
}

function drawStatus(ctx) {
    var game_status_disp;
    switch (game_status) {
        case game_mode.WaitingForPlayers:
            game_status_disp = "Waiting for Players";
            break

        case game_mode.Playing:
            game_status_disp = "Playing";
            break

        case game_mode.Pause:
            game_status_disp = "Pause: ";
            break

        case game_mode.End:     // BGM End (Play all time or out of field)
            game_status_disp = "Game End";
            break
        default:
    }
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
    ctx.fillText(game_status_disp + " / " + area_mode + " / " + language_mode, 20, 20);
    ctx.fillStyle = "#000000";
    ctx.stroke();

}

function draw_man() {
    drawPose(ctx, kp_1, joint_degree1, false/*true*//*mirror draw*/);
    drawPose(ctx2, kp_2, joint_degree2, true/*false*//*mirror draw*/);
}

function draw_mirror_out_gauge() {
    ctx.beginPath();
    ctx.fillStyle = "red";
    ctx.fillRect(0, 0, (FilterinField_ManInTheMirror / FilterinField_Max) * WIDTH, 10);
    ctx.stroke();

    ctx2.beginPath();
    ctx2.fillStyle = "red";
    ctx2.fillRect(0, 0, (FilterinField_ManInFrontOfTheMirror / FilterinField_Max) * WIDTH, 10);
    ctx2.stroke();
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

function handle_move(){
    ctx.beginPath()
    ctx.font = "30pt 'Times New Roman'";
    ctx.fillStyle = "#000000";
    ctx.fillText("Move:" + Math.round(kp_1_move/10000), 20, 50);
    ctx.stroke();

    ctx2.beginPath()
    ctx2.font = "30pt 'Times New Roman'";
    ctx2.fillStyle = "#000000";
    ctx2.fillText("Move:" + Math.round(kp_2_move/10000), 20, 50);
    ctx2.stroke();

    if((kp_1_move/10000 > 1 || kp_2_move/10000 > 1) && game_status == game_mode.Playing){
        if(Date.now() - swing_se_sound_count_time > 50){
//            swing_se_sound_count++;
//            if(swing_se_sound_count == 3 || swing_se_sound_count == 6 || swing_se_sound_count == 9){
//                playSound_se(sound_se_list.se_MagicCharge1_soundeffectlab,VOLUME_MID);
//            }else if(swing_se_sound_count == 12){
//                playSound_se(sound_se_list.se_MagicCharge2_soundeffectlab,VOLUME_MID);
//                swing_se_sound_count = 0;
//            }else{
                playSound_se(sound_se_list.se_Punch_soundeffectlab,VOLUME_MID);
//            }
            swing_se_sound_count_time = Date.now();
        }
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

    joint_degree[nose] = 0;     // not used
    joint_degree[leftEye] = 0;   // not used
    joint_degree[rightEye] = 0;   // not used
    joint_degree[leftEar] = 0;   // not used
    joint_degree[rightEar] = 0;   // not used
    joint_degree[leftWrist] = 0;   // not used
    joint_degree[rightWrist] = 0;   // not used
    joint_degree[leftAnkle] = 0;   // not used
    joint_degree[rightAnkle] = 0;   // not used

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

function isInField(kp) {
    if (kp[leftShoulder] == null) return false;
    var result = true;

    if (kp[leftShoulder].position.x < 0 || kp[leftShoulder].position.x > WIDTH) result = false;
    if (kp[rightShoulder].position.x < 0 || kp[rightShoulder].position.x > WIDTH) result = false;
    if (kp[leftElbow].position.x < 0 || kp[leftElbow].position.x > WIDTH) result = false;
    if (kp[rightElbow].position.x < 0 || kp[rightElbow].position.x > WIDTH) result = false;
    if (kp[leftWrist].position.x < 0 || kp[leftWrist].position.x > WIDTH) result = false;
    if (kp[rightWrist].position.x < 0 || kp[rightWrist].position.x > WIDTH) result = false;
    if(areamode == 0){  // Check only on Full Body Mode. Ignore if the area mode is not full
        if (kp[leftHip].position.x < 0 || kp[leftHip].position.x > WIDTH) result = false;
        if (kp[rightHip].position.x < 0 || kp[rightHip].position.x > WIDTH) result = false;
        if( kp[leftKnee].position.x < 0 || kp[leftKnee].position.x > WIDTH) result = false;
        if( kp[rightKnee].position.x < 0 || kp[rightKnee].position.x > WIDTH) result = false;
        if( kp[leftAnkle].position.x < 0 || kp[leftAnkle].position.x > WIDTH) result = false;
        if( kp[rightAnkle].position.x < 0 || kp[rightAnkle].position.x > WIDTH) result = false;
    }

    if (kp[leftShoulder].position.y < 0 || kp[leftShoulder].position.y > HEIGHT) result = false;
    if (kp[rightShoulder].position.y < 0 || kp[rightShoulder].position.y > HEIGHT) result = false;
    if (kp[leftElbow].position.y < 0 || kp[leftElbow].position.y > HEIGHT) result = false;
    if (kp[rightElbow].position.y < 0 || kp[rightElbow].position.y > HEIGHT) result = false;
    if (kp[leftWrist].position.y < 0 || kp[leftWrist].position.y > HEIGHT) result = false;
    if (kp[rightWrist].position.y < 0 || kp[rightWrist].position.y > HEIGHT) result = false;
    if(areamode == 0){  // Check only on Full Body Mode
        if (kp[leftHip].position.y < 0 || kp[leftHip].position.y > HEIGHT) result = false;
        if (kp[rightHip].position.y < 0 || kp[rightHip].position.y > HEIGHT) result = false;
        if( kp[leftKnee].position.y < 0 || kp[leftKnee].position.y > HEIGHT) result = false;
        if( kp[rightKnee].position.y < 0 || kp[rightKnee].position.y > HEIGHT) result = false;
        if( kp[leftAnkle].position.y < 0 || kp[leftAnkle].position.y > HEIGHT) result = false;
        if( kp[rightAnkle].position.y < 0 || kp[rightAnkle].position.y > HEIGHT) result = false;
    }

    return result;
}

function mirror_joint_degree(joint_degree) {
    var mirror_joint_degree = new Array(numOfJoint);

    mirror_joint_degree[nose] = 0;     // not used
    mirror_joint_degree[leftEye] = 0;   // not used
    mirror_joint_degree[rightEye] = 0;   // not used
    mirror_joint_degree[leftEar] = 0;   // not used
    mirror_joint_degree[rightEar] = 0;   // not used
    mirror_joint_degree[leftWrist] = 0;   // not used
    mirror_joint_degree[rightWrist] = 0;   // not used
    mirror_joint_degree[leftAnkle] = 0;   // not used
    mirror_joint_degree[rightAnkle] = 0;   // not used

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


// Compare Pose -----------------------------------------------------------------------------------------

function compare_joint_degree() {
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
    if (synchro_counter != 0) {
        synchro_counter++;  // Skip to update synchro result for a while
        if (synchro_counter > synchro_counter_max) {
            synchro_counter = 0;
        }
        return;
    }
    synchro_counter++;

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
        var add_point = 10 + 30 * Math.round(kp_1_move/10000) * Math.round(kp_2_move/10000);
        game_score = game_score + add_point;
        console.log("Point" + add_point)
        if(add_point > 100){
            playSound_se(sound_se_list.se_MagicCharge1_soundeffectlab,VOLUME_HI);  // Super Power Point
        }else if(add_point > 30){
            playSound_se(sound_se_list.se_MagicCharge2_soundeffectlab,VOLUME_MID);  // Power Point
        }
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



// Man Status -----------------------------------------------------------------------------------------

function update_man_status() {
    // Calc Man1 in the mirror
    var ResultInField;
    if (Captured_ManInTheMirror) {
        ResultInField = isInField(kp_1);
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
    joint_degree1 = calculate_joint_degree(kp_1);



    // Calc Man1 in front of the mirror
    if (Captured_ManInFrontOfTheMirror) {
        ResultInField = isInField(kp_2);
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
    joint_degree2 = calculate_joint_degree(kp_2);
}



// Cam Pose Capture -----------------------------------------------------------------------------------------

function predictWebcam_common(predictVideo, predictFunc) {
    model.estimateMultiplePoses(predictVideo, {
        flipHorizontal: false,
        maxDetections: 5,
        scoreThreshold: 0.5,
        nmsRadius: 20
    }).then(function (predictions) {
        // Detect frontmost person
        let frontmostPose = null;
        let frontmostY = Infinity;

        for (const pose of predictions) {
            const pose_leftShoulder = pose.keypoints[leftShoulder];
            const pose_rightShoulder = pose.keypoints[rightShoulder];

            if (pose_leftShoulder.score > 0.5 && pose_rightShoulder.score > 0.5) {
                const shoulderY = (pose_leftShoulder.position.y + pose_rightShoulder.position.y) / 2;   // frontmost
                if (shoulderY < frontmostY) {
                    frontmostY = shoulderY;
                    frontmostPose = pose;
                }
            }
        }

        if (frontmostPose) {
            if (frontmostPose.score > 0.3) {
                var kp = frontmostPose.keypoints;
                if (predictVideo === video) {
                    if(Date.now() - kp_1_time > 100){    // count 100 msec
                        if(kp_1_temp[0] == null){kp_1_temp = Object.assign({}, kp);}
                        kp_1_move = calc_pose_move_total_diff(kp_1_temp, kp);           // detect amount of movement
                        kp_1_temp = Object.assign({}, kp);
                        kp_1_time = Date.now();
                    }
                    if(kp_1[0] == null){kp_1 = Object.assign({}, kp);}
                    kp_1 = Object.assign({}, kp);                   // latest pose
                    Captured_ManInTheMirror = true;
                }

                if (predictVideo === video2) {
                    if(Date.now() - kp_2_time > 100){    // count 100 msec
                        if(kp_2_temp[0] == null){kp_2_temp = Object.assign({}, kp);}
                        kp_2_move = calc_pose_move_total_diff(kp_2_temp, kp);           // detect amount of movement
                        kp_2_temp = Object.assign({}, kp);
                        kp_2_time = Date.now();
                    }
                    if(kp_2[0] == null){kp_2 = Object.assign({}, kp);}
                    kp_2 = Object.assign({}, kp);                   // latest pose
                    Captured_ManInFrontOfTheMirror = true;
                }

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
//    if (mirror_sound_bgm[sound_bgm_list.Etude_Plus_Op10No1_MSumi] != null) {
//        if (window.speechSynthesis.speaking) {
//            mirror_sound_bgm[sound_bgm_list.Etude_Plus_Op10No1_MSumi].volume = VOLUME_LOW;
//        } else {
//            mirror_sound_bgm[sound_bgm_list.Etude_Plus_Op10No1_MSumi].volume = VOLUME_DEFAULT;
//        }

        if (bgm_stopping) {
            stopBGM();
            bgm_stopping = false;
        }
//    }
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
        mirror_sound_se[key].volume = volume;
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

function repeatNavigationSound(key, timer_msec){
    if(Date.now() - navigation_sound_repeat_time < timer_msec) return;
    if (language === "ja") {
        navigation_sound_queue.push(key);                   // direct read (no duplicate read restriction)
        playNavigationQueue();
    }else{
        speech_string.push(get_navigation_en_speech(key));  // direct read (no duplicate read restriction)
    }
    navigation_sound_repeat_time = Date.now();
}

function playNavigationQueue(){
    if(Date.now() - navigation_sound_play_time < navigation_sound_sleeptime) return;
    if(navigation_sound_queue.length != 0){
        if (mirror_sound_navigation[navigation_sound_queue[0]] != null) {
            mirror_sound_navigation[navigation_sound_queue[0]].play();
            mirror_sound_navigation[navigation_sound_queue[0]].volume = VOLUME_NAVIGATION;
            navigation_sound_queue.shift();
            navigation_sound_play_time = Date.now();
            return true;    // Played
        }
    }
    return false;   // not played
}

function get_navigation_en_speech(key) {
    switch (key) {
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
      default:
        return "";
    }
  }

// Speech(PC) -----------------------------------------------------------------------------------------

const speech_text = Object.freeze({
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
    ReadScore: "てんです"
});

const speech_text_en = Object.freeze({
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
    ReadScore: "points"
});

var speech_string = [];
var pre_speech_string = "";

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
    if (window.speechSynthesis.speaking) return;
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
              uttr.lang = language;
              uttr.volume = VOLUME_SPEECH;
              window.speechSynthesis.speak(uttr);
            }
          }
        speech_string.shift();
    }
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

// Game Status -----------------------------------------------------------------------------------------

function update_game_status() {
    switch (game_status) {
        case game_mode.WaitingForPlayers:
            if (inField_ManInFrontOfTheMirror && inField_ManInTheMirror) {    // Play Status
                game_status = game_mode.Playing;
                gameend_sound_played = false;
                swing_se_sound_count = 0;
                swing_se_sound_count_time = Date.now();
                synchro_percent = 100;
                game_score = 0;
                kp_1_move = 0;
                kp_2_move = 0;
                kp_1_time = Date.now();
                kp_2_time = Date.now();
                game_score_read_time = Date.now();
                game_time = Date.now();
                playNavigationSound(sound_navigation_list.GameStart);
                playBGM();
            } else {
                repeatNavigationSound(sound_navigation_list.Setup, 10000/*msec*/);
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
                playNavigationSound(sound_navigation_list.GameComplete);
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
            playNavigationSound(sound_navigation_list.GameEnd);
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
    draw_man();
    draw_mirror_out_gauge();
    draw_man_in_out();
    drawScoreTimeSynchro(ctx_score);
    drawStatus(ctx3_status);
    handle_move();
    update_game_status();
    handle_synchro_percent();
    handle_Sounds();
    playNavigationQueue();
    speech_controller();
    read_score_controller();
}

var move = function () {
    mirror_loop();

    clearTimeout(timer);
    timer = setTimeout(move, interval);
};

window.onload = function () {
    move();
};