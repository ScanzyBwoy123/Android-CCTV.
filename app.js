const cameraPreview =
    document.getElementById("cameraPreview");

const cameraPlaceholder =
    document.getElementById("cameraPlaceholder");

const startCameraButton =
    document.getElementById("startCameraButton");

const stopCameraButton =
    document.getElementById("stopCameraButton");

const connectionStatus =
    document.getElementById("connectionStatus");

const deviceStatus =
    document.getElementById("deviceStatus");

const connectionType =
    document.getElementById("connectionType");


let cameraStream = null;


// ==========================================
// START CAMERA
// ==========================================

async function startCamera() {

    try {

        connectionStatus.textContent = "Starting...";
        deviceStatus.textContent = "Starting camera...";

        cameraStream =
            await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: {
                        ideal: "environment"
                    }
                },
                audio: true
            });


        cameraPreview.srcObject = cameraStream;

        cameraPreview.style.display = "block";

        cameraPlaceholder.style.display = "none";


        startCameraButton.disabled = true;

        stopCameraButton.disabled = false;


        connectionStatus.textContent = "Camera Active";

        connectionStatus.style.color = "#4ade80";

        deviceStatus.textContent = "Camera Online";

        connectionType.textContent = "Local Camera";


    } catch (error) {

        console.error(
            "Camera error:",
            error
        );


        connectionStatus.textContent =
            "Camera Error";

        connectionStatus.style.color =
            "#f87171";

        deviceStatus.textContent =
            "Camera unavailable";


        alert(
            "We could not access the camera. " +
            "Please allow camera and microphone permission."
        );

    }

}


// ==========================================
// STOP CAMERA
// ==========================================

function stopCamera() {

    if (cameraStream) {

        cameraStream
            .getTracks()
            .forEach(function(track) {

                track.stop();

            });

        cameraStream = null;
    }


    cameraPreview.srcObject = null;

    cameraPreview.style.display = "none";

    cameraPlaceholder.style.display = "flex";


    startCameraButton.disabled = false;

    stopCameraButton.disabled = true;


    connectionStatus.textContent =
        "Offline";

    connectionStatus.style.color =
        "#f87171";

    deviceStatus.textContent =
        "Camera Offline";

    connectionType.textContent =
        "Not connected";

}


// ==========================================
// BUTTON EVENTS
// ==========================================

startCameraButton.addEventListener(
    "click",
    startCamera
);


stopCameraButton.addEventListener(
    "click",
    stopCamera
);
