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
const cameraOptions = document.querySelector('.video-options>select');

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
const numOfJoint = 16

var synchro_counter = 0;
const synchro_counter_max = 50;
var bgm_playing = false;

var inField_ManInFrontOfTheMirror = false;
var inField_ManInTheMirror = false;


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

function drawPose(ctx, kp, joint_degree, mirror/*true for mirror draw*/) {
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
    if(synchro_counter != 0){
        synchro_counter++;  // Skip to update synchro result for a while
        if(synchro_counter > synchro_counter_max){
            synchro_counter = 0;
        }
        return;
    }
    synchro_counter++;

    ctx.clearRect(0, 0, 640, 480);
    ctx.beginPath()
    ctx.font = "30pt 'Times New Roman'";
    var syncro_percent = Math.round((1000 - synchro) / 10);
    if(syncro_percent < 0 ) syncro_percent = 0;

    if(syncro_percent < 60){
        ctx.fillStyle = "#FF0000";
        if(mirror_sound[sound_num.synchronized_alert] != null){
//            mirror_sound[sound_num.synchronized_alert].play();
            mirror_sound[sound_num.Etude_Plus_Op10No1_MSumi].volume = 0.1;
            const uttr = new SpeechSynthesisUtterance("まったくあっていませんよ")
            window.speechSynthesis.speak(uttr);
            if(bgm_playing){
                mirror_sound[sound_num.Etude_Plus_Op10No1_MSumi].pause();
                bgm_playing = false;
            }
            stopMIDI();
//            playMIDI(900);
        }
    }else if(syncro_percent < 80){ 
        ctx.fillStyle = "#FFA500";
        if(mirror_sound[sound_num.not_synchronized] != null){
//            mirror_sound[sound_num.not_synchronized].play();
            mirror_sound[sound_num.Etude_Plus_Op10No1_MSumi].volume = 0.1;
            const uttr = new SpeechSynthesisUtterance("ずれています")
            window.speechSynthesis.speak(uttr);
            if(bgm_playing){
                mirror_sound[sound_num.Etude_Plus_Op10No1_MSumi].pause();
                bgm_playing = false;
            }
            stopMIDI();
//            playMIDI(300);
        }
    }else{
        ctx.fillStyle = "#118B11";
        if(mirror_sound[sound_num.synchronized] != null){
//            mirror_sound[sound_num.synchronized].play();
            if(!bgm_playing){
                mirror_sound[sound_num.Etude_Plus_Op10No1_MSumi].play();
                bgm_playing = true;
            }
            mirror_sound[sound_num.Etude_Plus_Op10No1_MSumi].volume = 0.4;
            stopMIDI();
        }
    }

    ctx.fillText("Syncro: " + syncro_percent + "%", 50, 40);
    ctx.fillStyle = "#000000";
    ctx.stroke();
}

function calculate_joint_degree(kp){
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
    var result = true;

    if( kp[rightShoulder].position.x < 0 || kp[rightShoulder].position.x > WIDTH) result = false;
    if( kp[leftElbow].position.x < 0 || kp[leftElbow].position.x > WIDTH) result = false;
    if( kp[rightElbow].position.x < 0 || kp[rightElbow].position.x > WIDTH) result = false;
    if( kp[leftWrist].position.x < 0 || kp[leftWrist].position.x > WIDTH) result = false;
    if( kp[rightWrist].position.x < 0 || kp[rightWrist].position.x > WIDTH) result = false;
    if( kp[leftHip].position.x < 0 || kp[leftHip].position.x > WIDTH) result = false;
    if( kp[rightHip].position.x < 0 || kp[rightHip].position.x > WIDTH) result = false;
    if( kp[leftKnee].position.x < 0 || kp[leftKnee].position.x > WIDTH) result = false;
    if( kp[rightKnee].position.x < 0 || kp[rightKnee].position.x > WIDTH) result = false;
    if( kp[leftAnkle].position.x < 0 || kp[leftAnkle].position.x > WIDTH) result = false;
    if( kp[rightAnkle].position.x < 0 || kp[rightAnkle].position.x > WIDTH) result = false;

    if( kp[rightShoulder].position.y < 0 || kp[rightShoulder].position.y > HEIGHT) result = false;
    if( kp[leftElbow].position.y < 0 || kp[leftElbow].position.y > HEIGHT) result = false;
    if( kp[rightElbow].position.y < 0 || kp[rightElbow].position.y > HEIGHT) result = false;
    if( kp[leftWrist].position.y < 0 || kp[leftWrist].position.y > HEIGHT) result = false;
    if( kp[rightWrist].position.y < 0 || kp[rightWrist].position.y > HEIGHT) result = false;
    if( kp[leftHip].position.y < 0 || kp[leftHip].position.y > HEIGHT) result = false;
    if( kp[rightHip].position.y < 0 || kp[rightHip].position.y > HEIGHT) result = false;
    if( kp[leftKnee].position.y < 0 || kp[leftKnee].position.y > HEIGHT) result = false;
    if( kp[rightKnee].position.y < 0 || kp[rightKnee].position.y > HEIGHT) result = false;
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

function comapre_joint_degree(){
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
                if(!inField_ManInTheMirror && isInField(kp)){      // out of field to in field
                    inField_ManInTheMirror = true;
                    mirror_sound[sound_num.Etude_Plus_Op10No1_MSumi].volume = 0.1;

                    const uttr = new SpeechSynthesisUtterance("かがみのなかのひとをみつけました")
                    window.speechSynthesis.speak(uttr);
                }
                if(inField_ManInTheMirror && !isInField(kp)){      // in field to out of field
                    inField_ManInTheMirror = false;
                    mirror_sound[sound_num.Etude_Plus_Op10No1_MSumi].volume = 0.1;

                    const uttr = new SpeechSynthesisUtterance("かがみのなかのひとをみうしないました")
                    window.speechSynthesis.speak(uttr);
                }

                if(joint_degree1 && joint_degree2){
                    joint_degree1 = calculate_joint_degree(kp);
                }
                drawPose(ctx, kp, joint_degree1, true/*mirror draw*/);
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
                var kp2 = predictions2[n].keypoints;
                if(!inField_ManInFrontOfTheMirror && isInField(kp2)){      // out of field to in field
                    inField_ManInFrontOfTheMirror = true;
                    mirror_sound[sound_num.Etude_Plus_Op10No1_MSumi].volume = 0.1;

                    const uttr = new SpeechSynthesisUtterance("かがみのまえのひとをみつけました")
                    window.speechSynthesis.speak(uttr);
                }
                if(inField_ManInFrontOfTheMirror && !isInField(kp2)){      // in field to out of field
                    inField_ManInFrontOfTheMirror = false;
                    mirror_sound[sound_num.Etude_Plus_Op10No1_MSumi].volume = 0.1;

                    const uttr = new SpeechSynthesisUtterance("かがみのまえのひとをみうしないました")
                    window.speechSynthesis.speak(uttr);
                }

                if(joint_degree1 && joint_degree2){
                    joint_degree2 = calculate_joint_degree(kp2);
                }
                drawPose(ctx2, kp2, joint_degree2, false/*mirror draw*/)
                comapre_joint_degree();
                drawSignal(ctx3);
            }
        }

        window.requestAnimationFrame(predictWebcam2);
    });
}


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



// Set bgm
const sound_name = ['Etude_Plus_Op10No1_MSumi.mp3', 'synchronized.m4a','not_synchronized.m4a','synchronized_alert.m4a']
const sound_num = Object.freeze({Etude_Plus_Op10No1_MSumi: 0, synchronized: 1, not_synchronized: 2, synchronized_alert: 3});
var mirror_sound = new Array(4);

  document.getElementById('play').addEventListener('click', function () {

    for (let i = 0; i < sound_name.length; i++){
        if(mirror_sound[i]==null){
            mirror_sound[i] = new Audio('./music/sound_' + sound_name[i]);
//            mirror_sound[i].load();
        }
    }
  });

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


  // MIDI
  // ref https://html5experts.jp/ryoyakawai/12569/
  // https://ryoyakawai.github.io/html5conference2015/analog/sample02.html
  var vco0, vco1, lfo, vcf;
  var playing =false;
  var ctx_audio=new AudioContext();

function playMIDI(freq){
    return;
    console.log("PlayMIDI");
    if(!playing){
        console.log("Playing: false");
        vco0=ctx_audio.createOscillator();
    //  vco1=ctx_audio.createOscillator();
    //  lfo=ctx_audio.createOscillator();
    vcf=ctx_audio.createBiquadFilter();

    vco0.connect(vcf);
    //  vco1.connect(vcf);
    //  lfo.connect(vco0.frequency);
    //  lfo.connect(vco1.frequency);
    //  lfo.connect(vcf.detune);
    vcf.connect(ctx_audio.destination);
    vco0.frequency.setValueAtTime(freq, ctx_audio.currentTime);
    //  vco1.frequency.setValueAtTime(1000, ctx_audio.currentTime);
 
        vco0.start(0);
//        vco1.start(0);
//        lfo.start(0);   
        playing = true;
    }
}

function stopMIDI(){    // Stop after playing
    console.log("stopMIDI");
    if(playing){
        console.log("Playing: true");
        vco0.stop(0);
        vco0.disconnect(vcf);
        vcf.disconnect(ctx_audio.destination);
 //       vco1.stop(0);
 //       lfo.stop(0); 
        vco0 = null;
        vcf = null;
        playing = false;    
    }
}
