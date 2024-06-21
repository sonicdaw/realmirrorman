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

// Export functions
window.getDeviceList = getDeviceList;
window.enableCam1 = enableCam1;
window.enableCam2 = enableCam2;