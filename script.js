const video = document.getElementById('webcam');
const video2 = document.getElementById('webcam2');
const enableWebcamButton1 = document.getElementById('webcamButton1');
const enableWebcamButton2 = document.getElementById('webcamButton2');
var cameraList = document.getElementById("camera_list");

var canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d')
var canvas2 = document.getElementById('canvas2');
const ctx2 = canvas2.getContext('2d')
var canvas3 = document.getElementById('canvas3');
const ctx3 = canvas3.getContext('2d')
var canvas3 = document.getElementById('canvas3_status');
const ctx3_status = canvas3.getContext('2d')
const cameraOptions = document.querySelector('.video-options>select');

var timer;
var interval = 10;
const VOLUME_DEFAULT = 0.3;
const VOLUME_LOW = 0.1;
var bgm_volume = VOLUME_LOW;
var sound_on = false;

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

var synchro_counter = 0;
const synchro_counter_max = 100;
var pre_bgm_playing = false;
var bgm_playing = false;
var bgm_stopping = false;

var inField_ManInFrontOfTheMirror = false;
var inField_ManInTheMirror = false;
var FilterinField_ManInFrontOfTheMirror = 0;
var FilterinField_ManInTheMirror = 0;
var Captured_ManInFrontOfTheMirror = false;
var Captured_ManInTheMirror = false;
const FilterinField_Max = 500;

const game_mode = Object.freeze({WaitingForPlayers: 0, Playing: 1, Pause: 2, End: 3});
var game_status = game_mode.WaitingForPlayers;

const WIDTH = 320;
const HEIGHT = 320;

function getUserMediaSupported() {
    return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
}

if (getUserMediaSupported()) {
    enableWebcamButton1.addEventListener('click', enableCam1);
    enableWebcamButton2.addEventListener('click', enableCam2);
} else {
    console.warn('getUserMedia() is not supported by your browser');
}

function enableCam1(event) {
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

    var cameras = navigator.mediaDevices.getUserMedia(constraints);
    cameras.then(function (stream) {
        video.srcObject = stream;
        video.addEventListener('loadeddata', predictWebcam);
    });
}

function enableCam2(event) {
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

    var cameras = navigator.mediaDevices.getUserMedia(constraints);
    cameras.then(function (stream) {;
        video2.srcObject = stream;
        video2.addEventListener('loadeddata', predictWebcam2);
    });
}

var model = undefined;

posenet.load().then(function (loadedModel) {
    model = loadedModel;
});

const drawLine = (ctx, kp0, kp1, mirror) => {
    if (kp0.score < 0.3 || kp1.score < 0.3) return
    ctx.strokeStyle = 'black'
    ctx.lineWidth = 2
    ctx.beginPath()
    if(mirror){
        ctx.moveTo(WIDTH - kp0.position.x, kp0.position.y)
        ctx.lineTo(WIDTH - kp1.position.x, kp1.position.y)
    }else{
        ctx.moveTo(kp0.position.x, kp0.position.y)
        ctx.lineTo(kp1.position.x, kp1.position.y)
    }
    ctx.stroke();
}

const drawPoint = (ctx, kp, mirror) => {
    if (kp.score < 0.3) return
    ctx.fillStyle = 'black'
    ctx.beginPath()
    if(mirror){
        ctx.arc(WIDTH - kp.position.x, kp.position.y, 3, 0, 2 * Math.PI);
    }else{
        ctx.arc(kp.position.x, kp.position.y, 3, 0, 2 * Math.PI);
    }
    ctx.fill()
}

const drawHead = (ctx, kp, kp2, mirror) => {
    if (kp.score < 0.3) return
    ctx.fillStyle = 'black'
    ctx.beginPath()
    if(mirror){
        ctx.arc(WIDTH - kp.position.x, kp.position.y, Math.abs(kp2.position.x - kp.position.x) * 2, 0, 2 * Math.PI);
    }else{
        ctx.arc(kp.position.x, kp.position.y, Math.abs(kp2.position.x - kp.position.x) * 2, 0, 2 * Math.PI);
    }
    ctx.stroke()
}

function vecotr_theta(x1, y1, x2, y2) {
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
var syncro_percent = 0;

function drawPose(ctx, kp, joint_degree, mirror/*true for mirror draw*/) {
    if(kp[leftShoulder] == null) return false;
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
    if(mirror){
        ctx.fillText(joint_degree[leftShoulder] + "°", WIDTH - kp[leftShoulder].position.x, kp[leftShoulder].position.y);
        ctx.fillText(joint_degree[rightShoulder] + "°", WIDTH - kp[rightShoulder].position.x, kp[rightShoulder].position.y);
        ctx.fillText(joint_degree[leftElbow] + "°", WIDTH - kp[leftElbow].position.x, kp[leftElbow].position.y);
        ctx.fillText(joint_degree[rightElbow] + "°", WIDTH - kp[rightElbow].position.x, kp[rightElbow].position.y);
        ctx.fillText(joint_degree[leftHip] + "°", WIDTH - kp[leftHip].position.x, kp[leftHip].position.y);
        ctx.fillText(joint_degree[rightHip] + "°", WIDTH - kp[rightHip].position.x, kp[rightHip].position.y);
        ctx.fillText(joint_degree[rightKnee] + "°",WIDTH - kp[rightKnee].position.x, kp[rightKnee].position.y);
        ctx.fillText(joint_degree[leftKnee] + "°",WIDTH - kp[leftKnee].position.x, kp[leftKnee].position.y);
    
    }else{
        ctx.fillText(joint_degree[leftShoulder] + "°",kp[leftShoulder].position.x, kp[leftShoulder].position.y);
        ctx.fillText(joint_degree[rightShoulder] + "°",kp[rightShoulder].position.x, kp[rightShoulder].position.y);
        ctx.fillText(joint_degree[leftElbow] + "°",kp[leftElbow].position.x, kp[leftElbow].position.y);
        ctx.fillText(joint_degree[rightElbow] + "°",kp[rightElbow].position.x, kp[rightElbow].position.y);
        ctx.fillText(joint_degree[leftHip] + "°",kp[leftHip].position.x, kp[leftHip].position.y);
        ctx.fillText(joint_degree[rightHip] + "°",kp[rightHip].position.x, kp[rightHip].position.y);
        ctx.fillText(joint_degree[rightKnee] + "°",kp[rightKnee].position.x, kp[rightKnee].position.y);
        ctx.fillText(joint_degree[leftKnee] + "°",kp[leftKnee].position.x, kp[leftKnee].position.y);
    }
}


function drawSignal(ctx) {
    ctx.clearRect(0, 0, 320, 50);
    ctx.beginPath()
    ctx.font = "30pt 'Times New Roman'";

    if(syncro_percent < 60){
        ctx.fillStyle = "#FF0000";
    }else if(syncro_percent < 80){ 
        ctx.fillStyle = "#FFA500";
    }else{
        ctx.fillStyle = "#118B11";
    }

    ctx.fillText("Syncro: " + syncro_percent + "%", 50, 40);
    ctx.fillStyle = "#000000";
    ctx.stroke();
}

function drawStatus(ctx){
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
    ctx.clearRect(0, 0, 320, 50);

    ctx.beginPath()
    ctx.font = "20pt 'Times New Roman'";
    ctx.fillText(game_status_disp, 20, 20);
    ctx.fillStyle = "#000000";
    ctx.stroke();

}


// Pose Analyze

function calculate_joint_degree(kp){
    if(kp[leftShoulder] == null) return false;
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
    joint_degree[leftShoulder] = Math.round(degree(vecotr_theta(leftShoulder_x - kp[leftElbow].position.x, leftShoulder_y - kp[leftElbow].position.y,
        leftShoulder_x - kp[leftHip].position.x, leftShoulder_y - kp[leftHip].position.y)));

    const rightShoulder_x = kp[rightShoulder].position.x;
    const rightShoulder_y = kp[rightShoulder].position.y;
    joint_degree[rightShoulder] = Math.round(degree(vecotr_theta(rightShoulder_x - kp[rightElbow].position.x, rightShoulder_y - kp[rightElbow].position.y,
        rightShoulder_x - kp[rightHip].position.x, rightShoulder_y - kp[rightHip].position.y)));

    const leftElbow_x = kp[leftElbow].position.x;
    const leftElbow_y = kp[leftElbow].position.y;
    joint_degree[leftElbow] = Math.round(degree(vecotr_theta(leftElbow_x - kp[leftShoulder].position.x, leftElbow_y - kp[leftShoulder].position.y,
        leftElbow_x - kp[leftWrist].position.x, leftElbow_y - kp[leftWrist].position.y)));

    const rightElbow_x = kp[rightElbow].position.x;
    const rightElbow_y = kp[rightElbow].position.y;
    joint_degree[rightElbow] = Math.round(degree(vecotr_theta(rightElbow_x - kp[rightShoulder].position.x, rightElbow_y - kp[rightShoulder].position.y,
        rightElbow_x - kp[rightWrist].position.x, rightElbow_y - kp[rightWrist].position.y)));

    const leftHip_x = kp[leftHip].position.x;
    const leftHip_y = kp[leftHip].position.y;
    joint_degree[leftHip] = Math.round(degree(vecotr_theta(leftHip_x - kp[leftKnee].position.x, leftHip_y - kp[leftKnee].position.y,
        leftHip_x - kp[leftShoulder].position.x, leftHip_y - kp[leftShoulder].position.y)));

    const rightHip_x = kp[rightHip].position.x;
    const rightHip_y = kp[rightHip].position.y;
    joint_degree[rightHip] = Math.round(degree(vecotr_theta(rightHip_x - kp[rightKnee].position.x, rightHip_y - kp[rightKnee].position.y,
        rightHip_x - kp[rightShoulder].position.x, rightHip_y - kp[rightShoulder].position.y)));

    const rightKnee_x = kp[rightKnee].position.x;
    const rightKnee_y = kp[rightKnee].position.y;
    joint_degree[rightKnee] = Math.round(degree(vecotr_theta(rightKnee_x - kp[rightHip].position.x, rightKnee_y - kp[rightHip].position.y,
        rightKnee_x - kp[rightAnkle].position.x, rightKnee_y - kp[rightAnkle].position.y)));

    const leftKnee_x = kp[leftKnee].position.x;
    const leftKnee_y = kp[leftKnee].position.y;
    joint_degree[leftKnee] = Math.round(degree(vecotr_theta(leftKnee_x - kp[leftHip].position.x, leftKnee_y - kp[leftHip].position.y,
        leftKnee_x - kp[leftAnkle].position.x, leftKnee_y - kp[leftAnkle].position.y)));

    return joint_degree;
}

function isInField(kp){
    if(kp[leftShoulder] == null) return false;
    var result = true;

    if( kp[leftShoulder].position.x < 0 || kp[leftShoulder].position.x > WIDTH) result = false;
    if( kp[rightShoulder].position.x < 0 || kp[rightShoulder].position.x > WIDTH) result = false;
    if( kp[leftElbow].position.x < 0 || kp[leftElbow].position.x > WIDTH) result = false;
    if( kp[rightElbow].position.x < 0 || kp[rightElbow].position.x > WIDTH) result = false;
    if( kp[leftWrist].position.x < 0 || kp[leftWrist].position.x > WIDTH) result = false;
    if( kp[rightWrist].position.x < 0 || kp[rightWrist].position.x > WIDTH) result = false;
    if( kp[leftHip].position.x < 0 || kp[leftHip].position.x > WIDTH) result = false;
    if( kp[rightHip].position.x < 0 || kp[rightHip].position.x > WIDTH) result = false;
//    if( kp[leftKnee].position.x < 0 || kp[leftKnee].position.x > WIDTH) result = false;
//    if( kp[rightKnee].position.x < 0 || kp[rightKnee].position.x > WIDTH) result = false;
//    if( kp[leftAnkle].position.x < 0 || kp[leftAnkle].position.x > WIDTH) result = false;
//    if( kp[rightAnkle].position.x < 0 || kp[rightAnkle].position.x > WIDTH) result = false;

    if( kp[leftShoulder].position.y < 0 || kp[leftShoulder].position.y > HEIGHT) result = false;
    if( kp[rightShoulder].position.y < 0 || kp[rightShoulder].position.y > HEIGHT) result = false;
    if( kp[leftElbow].position.y < 0 || kp[leftElbow].position.y > HEIGHT) result = false;
    if( kp[rightElbow].position.y < 0 || kp[rightElbow].position.y > HEIGHT) result = false;
    if( kp[leftWrist].position.y < 0 || kp[leftWrist].position.y > HEIGHT) result = false;
    if( kp[rightWrist].position.y < 0 || kp[rightWrist].position.y > HEIGHT) result = false;
    if( kp[leftHip].position.y < 0 || kp[leftHip].position.y > HEIGHT) result = false;
    if( kp[rightHip].position.y < 0 || kp[rightHip].position.y > HEIGHT) result = false;
//    if( kp[leftKnee].position.y < 0 || kp[leftKnee].position.y > HEIGHT) result = false;
//    if( kp[rightKnee].position.y < 0 || kp[rightKnee].position.y > HEIGHT) result = false;
//    if( kp[leftAnkle].position.y < 0 || kp[leftAnkle].position.y > HEIGHT) result = false;
//    if( kp[rightAnkle].position.y < 0 || kp[rightAnkle].position.y > HEIGHT) result = false;

    return result;
}

function mirror_joint_degree(joint_degree){
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

function compare_joint_degree(){
    var sync_confidence = 0;
    var mirror_joint_degree2 = mirror_joint_degree(joint_degree2);
    for(var i=0; i < numOfJoint; i++){
        var diff = Math.abs(joint_degree1[i] - mirror_joint_degree2[i]);
        if(diff > 30){
            sync_confidence = sync_confidence + diff;
        }
    }
    synchro = sync_confidence;

    return;
}


// Cam Pose Capture

// in the mirror
function predictWebcam() {
    model.estimateMultiplePoses(video, {
        flipHorizontal: false,
        maxDetections: 5,
        scoreThreshold: 0.5,
        nmsRadius: 20
    }).then(function (predictions) {

        for (let n = 0; n < predictions.length; n++) {
            if (predictions[n].score > 0.3) {
                var kp = predictions[n].keypoints;
                kp_1 = Object.assign({},kp);
                Captured_ManInTheMirror = true;
            }else{      // prediction is low = Out of field
                Captured_ManInTheMirror = false;

            }
        }

        window.requestAnimationFrame(predictWebcam);
    });
}

// in front of the mirror
function predictWebcam2() {
    model.estimateMultiplePoses(video2, {
        flipHorizontal: false,
        maxDetections: 5,
        scoreThreshold: 0.5,
        nmsRadius: 20
    }).then(function (predictions2) {

        for (let n = 0; n < predictions2.length; n++) {
            if (predictions2[n].score > 0.3) {
                var kp = predictions2[n].keypoints;
                kp_2 = Object.assign({},kp);
                Captured_ManInFrontOfTheMirror = true;
            }else{      // prediction is low = Out of field
                Captured_ManInFrontOfTheMirror = false;
            }
        }

        window.requestAnimationFrame(predictWebcam2);
    });
}


// Device List

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

  function getSelectedVideo() {
    var id = cameraList.options[cameraList.selectedIndex].value;
    return id;
  }


// bgm

const sound_name = ['Etude_Plus_Op10No1_MSumi.mp3']
const sound_num = Object.freeze({Etude_Plus_Op10No1_MSumi: 0});
var mirror_sound = new Array(1);

//  document.getElementById('play').addEventListener('click', function () {
//    initBGM();
//  });

  function getDeviceList_SoundOn(){
    getDeviceList();
    initBGM();
    sound_on = true;
  }

  function initBGM(){
    for (let i = 0; i < sound_name.length; i++){
        if(mirror_sound[i]==null){
            mirror_sound[i] = new Audio('./music/sound_' + sound_name[i]);
//            mirror_sound[i].load();
        }
    }
  }

  function bgm_pause(){
    for (let i = 0; i < sound_name.length; i++){
        if(mirror_sound[i]!=null) { mirror_sound[i].pause(); }
    }
  }

  function bgm_stop(){
    for (let i = 0; i < sound_name.length; i++){
        if(mirror_sound[i]!=null) { mirror_sound[i].pause(); mirror_sound[i].currentTime = 0;}
    }
  }

function bgm_control(){
    // Volume Control
    if(mirror_sound[sound_num.Etude_Plus_Op10No1_MSumi] != null){
        mirror_sound[sound_num.Etude_Plus_Op10No1_MSumi].volume = bgm_volume;

        if(pre_bgm_playing && !bgm_playing){  // Play -> Pause
            bgm_pause();
        }

        if(!pre_bgm_playing && bgm_playing && game_status == game_mode.Playing){  // Pause -> Play
            mirror_sound[sound_num.Etude_Plus_Op10No1_MSumi].play();
        }

        if(bgm_stopping){
            bgm_stop();
            bgm_stopping = false;
        }
    }

    pre_bgm_playing = bgm_playing;
}



// draw man

function draw_man(){
    drawPose(ctx, kp_1, joint_degree1, true/*mirror draw*/);
    drawPose(ctx2, kp_2, joint_degree2, false/*mirror draw*/);
}

// Man Status

function update_man_status(){
// Calc Man1 in the mirror
    var ResultInField;
    if(Captured_ManInTheMirror){
        ResultInField = isInField(kp_1);
    }else{
        ResultInField = false;
    }
    if(!inField_ManInTheMirror && ResultInField){      // out of field to in field
        inField_ManInTheMirror = true;
        bgm_volume = VOLUME_DEFAULT;
        speech_push(speech_text.FoundManInTheMirror);
        FilterinField_ManInTheMirror = 0;
    }

    if(ResultInField){
        FilterinField_ManInTheMirror = 0;
    }
    if(inField_ManInTheMirror && !ResultInField){      // in field to out of field
        FilterinField_ManInTheMirror++;
        if(FilterinField_ManInTheMirror > FilterinField_Max){         // Detect filter
            inField_ManInTheMirror = false;
            bgm_volume = VOLUME_LOW;
            speech_push(speech_text.LostManInTheMirror);
        }
    }
    joint_degree1 = calculate_joint_degree(kp_1);



// Calc Man1 in front of the mirror
    if(Captured_ManInFrontOfTheMirror){
        ResultInField = isInField(kp_2);
    }else{
        ResultInField = false;
    }
    if(!inField_ManInFrontOfTheMirror && ResultInField){      // out of field to in field
        inField_ManInFrontOfTheMirror = true;
        bgm_volume = VOLUME_DEFAULT;
        speech_push(speech_text.FoundManInFrontOfTheMirror);
        FilterinField_ManInFrontOfTheMirror = 0;
    }

    if(ResultInField){
        FilterinField_ManInFrontOfTheMirror = 0;
    }
    if(inField_ManInFrontOfTheMirror && !ResultInField){      // in field to out of field
        FilterinField_ManInFrontOfTheMirror++;
        if(FilterinField_ManInFrontOfTheMirror > FilterinField_Max){         // Detect filter
            inField_ManInFrontOfTheMirror = false;
            bgm_volume = VOLUME_LOW;
            speech_push(speech_text.LostManInFrontOfTheMirror);
        }
    }
    joint_degree2 = calculate_joint_degree(kp_2);
}

function draw_mirror_out_gauge(){
    ctx.beginPath();
    ctx.fillStyle = "red";
    ctx.fillRect(0,0, (FilterinField_ManInTheMirror / FilterinField_Max) * WIDTH, 10);
    ctx.stroke();

    ctx2.beginPath();
    ctx2.fillStyle = "red";
    ctx2.fillRect(0,0, (FilterinField_ManInFrontOfTheMirror / FilterinField_Max) * WIDTH, 10);
    ctx2.stroke();
}

function draw_man_in_out(){
    if(!inField_ManInTheMirror){
        ctx.beginPath();
        ctx.fillStyle = 'rgba(128,128,128,0.8)';
        ctx.fillRect(0,0, WIDTH, HEIGHT);
        ctx.stroke();
    }
    if(!inField_ManInFrontOfTheMirror){
        ctx2.beginPath();
        ctx2.fillStyle = 'rgba(128,128,128,0.8)';
        ctx2.fillRect(0,0, WIDTH, HEIGHT);
        ctx2.stroke();
    }
}

function handle_syncro_percent(){
    if(synchro_counter != 0){
        synchro_counter++;  // Skip to update synchro result for a while
        if(synchro_counter > synchro_counter_max){
            synchro_counter = 0;
        }
        return;
    }
    synchro_counter++;

    syncro_percent = Math.round((1000 - synchro) / 10);
    if(syncro_percent < 0 ) syncro_percent = 0;

    if(syncro_percent < 60){
        if(game_status==game_mode.Playing){
            speech_push(speech_text.synchronized_alert);
        }
        bgm_volume = VOLUME_LOW;
        bgm_playing = false;
    }else if(syncro_percent < 80){
        if(game_status==game_mode.Playing){
            speech_push(speech_text.not_synchronized);
        }
        bgm_volume = VOLUME_LOW;
        bgm_playing = false;
    }else{
        bgm_volume = VOLUME_DEFAULT;
        bgm_playing = true;
    }
}

const speech_text = Object.freeze({
    Setup: "かがみのまえとなかにたってください",
    GameStart: "げーむをかいしします",
    GameEnd: "げーむしゅうりょうです",
    not_synchronized: "ずれています",
    synchronized_alert: "まったくあっていませんよ",
    FoundManInTheMirror: "かがみのなかのひとをみつけました",
    LostManInTheMirror: "かがみのなかのひとをみうしないました",
    FoundManInFrontOfTheMirror: "かがみのまえのひとをみつけました",
    LostManInFrontOfTheMirror: "かがみのまえのひとをみうしないました",
    LostManInTheMirror: "かがみのなかのひとをみうしないました",
    LostManInFrontOfTheMirror: "かがみのまえのひとをみうしないました",
    LostPlayers: "ぷれーやーがいなくなりました"
});

var speech_string = [];
var pre_speech_string = "";

function speech_push(string){
    if(string==pre_speech_string){
        return;
    }
    speech_string.push(string);
    pre_speech_string = string;
}

function speech_controller(){
    if(!sound_on) return;
    if(speech_string.length != 0){
        console.log(speech_string[0]);
        if(speech_string!=""){
            const uttr = new SpeechSynthesisUtterance(speech_string[0])
            window.speechSynthesis.speak(uttr);
        }
        speech_string.shift();
    }
}

// Game Status

  function update_game_status(){
    switch (game_status) {
        case game_mode.WaitingForPlayers:
            if(inField_ManInFrontOfTheMirror && inField_ManInTheMirror){    // Play Status
                game_status = game_mode.Playing;
                speech_push(speech_text.GameStart);
            }else{
                speech_push(speech_text.Setup);
            }
          break

        case game_mode.Playing:
            bgm_playing = true;
            if(!inField_ManInFrontOfTheMirror && !inField_ManInTheMirror){    // Play Status -> End
                game_status = game_mode.End;
                speech_push(speech_text.LostPlayers);
            }else if(!inField_ManInFrontOfTheMirror || !inField_ManInTheMirror){    // Play Status -> Pause
                game_status = game_mode.Pause;
            }
          break

        case game_mode.Pause:
            if(!inField_ManInFrontOfTheMirror && !inField_ManInTheMirror){    // Play Status -> End
                game_status = game_mode.End;
                speech_push(speech_text.LostPlayers);
            }else if(inField_ManInFrontOfTheMirror && inField_ManInTheMirror){    // Pause Status -> Play Status
                game_status = game_mode.Playing;
            }
          break

        case game_mode.End:     // BGM End (Play all time or out of field)
            speech_push(speech_text.GameEnd);
            game_status = game_mode.WaitingForPlayers;
            bgm_stopping = true;
          break

        default:
      }
  }

  function mirror_loop(){
    update_man_status();
    if(joint_degree1 && joint_degree2){
        compare_joint_degree();
    }
    draw_man();
    draw_mirror_out_gauge();
    draw_man_in_out();
    drawSignal(ctx3);
    drawStatus(ctx3_status);
    update_game_status();
    handle_syncro_percent();
    bgm_control();
    speech_controller();
  }

  var move = function() {
    mirror_loop();

    clearTimeout(timer);
    timer = setTimeout(move, interval);
  };

  window.onload = function() {
    move();
  };