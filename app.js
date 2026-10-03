let localStream = null;
let peerConnection = null;
let signalingChannel = null;

let currentCameraFacing = "environment";
let cameraAudioEnabled = true;

const SUPABASE_URL =
    "https://vsdujfqygetvwgbfrjzj.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
    "sb_publishable_awDxxCnxSAoB0o5-nhKh7A_9bZ_aYRo";

const ROOM_ID =
    "android-cctv-demo";
/* =========================================
   DEVICE ID
========================================= */

function getCameraId() {

    let cameraId =
        localStorage.getItem(
            "androidCctvCameraId"
        );


    if (!cameraId) {

        const randomPart =
            Math.random()
                .toString(36)
                .substring(2, 8)
                .toUpperCase();


        cameraId =
            "CAM-" +
            randomPart;


        localStorage.setItem(
            "androidCctvCameraId",
            cameraId
        );

    }


    return cameraId;
}


const CAMERA_ID =
    getCameraId();
const cameraIdDisplay =
    document.getElementById(
        "cameraIdDisplay"
    );
/* =========================================
   SAVED CAMERA PAIRING
========================================= */

const cameraIdInput =
    document.getElementById(
        "cameraIdInput"
    );

const addCameraButton =
    document.getElementById(
        "addCameraButton"
    );

const savedCameraContainer =
    document.getElementById(
        "savedCameraContainer"
    );


function getSavedCameraId() {

    return localStorage.getItem(
        "pairedCameraId"
    );

}


function saveCameraId(
    cameraId
) {

    localStorage.setItem(
        "pairedCameraId",
        cameraId
    );

}


function displaySavedCamera() {

    if (
        !savedCameraContainer
    ) {

        return;
    }


    const savedCameraId =
        getSavedCameraId();


    if (!savedCameraId) {

        savedCameraContainer.innerHTML =
            "";

        return;
    }


    savedCameraContainer.innerHTML = `

        <div class="camera-card">

            <div class="camera-card-icon">
                📷
            </div>

            <div class="camera-card-info">

                <h3>
                    Android Camera
                </h3>

                <p>
                    Camera ID:
                    ${savedCameraId}
                </p>

                <p
                    id="savedCameraStatus"
                >
                    🔴 Offline
                </p>

            </div>

            <button
                type="button"
                id="savedCameraConnectButton"
                class="connect-button"
            >
                Connect
            </button>

        </div>

    `;


    const connectButton =
        document.getElementById(
            "savedCameraConnectButton"
        );


    if (connectButton) {

        connectButton.addEventListener(
            "click",
            async function () {

                createAnswerButton.click();

            }
        );

    }

}


if (addCameraButton) {

    addCameraButton.addEventListener(
        "click",
        function () {

            const enteredId =
                cameraIdInput.value
                    .trim()
                    .toUpperCase();


            if (!enteredId) {

                alert(
                    "Please enter a Camera ID."
                );

                return;
            }


            if (
                !enteredId.startsWith(
                    "CAM-"
                )
            ) {

                alert(
                    "Invalid Camera ID.\n\n" +
                    "A Camera ID should start with CAM-."
                );

                return;
            }


            saveCameraId(
                enteredId
            );


            cameraIdInput.value =
                "";


            displaySavedCamera();


            setViewerStatus(
                "Camera added successfully."
            );

        }
    );

}


displaySavedCamera();

if (cameraIdDisplay) {

    cameraIdDisplay.textContent =
        CAMERA_ID;

}
let cameraHeartbeatTimer = null;

let lastCameraHeartbeat = 0;

const CAMERA_HEARTBEAT_INTERVAL = 5000;

const CAMERA_OFFLINE_TIMEOUT = 15000;
const configuration = {
    iceServers: [
        {
            urls:
                "stun:stun.l.google.com:19302"
        }
    ]
};


/* =========================================
   SUPABASE
========================================= */

const supabaseClient =
    window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_PUBLISHABLE_KEY
    );


/* =========================================
   DOM ELEMENTS
========================================= */

const connectionStatus =
    document.getElementById(
        "connectionStatus"
    );

const cameraModeButton =
    document.getElementById(
        "cameraModeButton"
    );

const viewerModeButton =
    document.getElementById(
        "viewerModeButton"
    );

const cameraSection =
    document.getElementById(
        "cameraMode"
    );

const viewerSection =
    document.getElementById(
        "viewerMode"
    );

const localVideo =
    document.getElementById(
        "localVideo"
    );

const remoteVideo =
    document.getElementById(
        "remoteVideo"
    );

const startCameraButton =
    document.getElementById(
        "startCameraButton"
    );

const createAnswerButton =
    document.getElementById(
        "createAnswerButton"
    );

const cameraOnlineStatus =
    document.getElementById(
        "cameraOnlineStatus"
    );

const viewerStatusMessage =
    document.getElementById(
        "viewerStatusMessage"
    );

const liveIndicator =
    document.getElementById(
        "liveIndicator"
    );

const cameraControlContainer =
    document.getElementById(
        "cameraControlContainer"
    );

const viewerControlContainer =
    document.getElementById(
        "viewerControlContainer"
    );


/* =========================================
   STATUS
========================================= */

function setStatus(message) {

    if (connectionStatus) {

        connectionStatus.textContent =
            message;

    }

    console.log(message);
}


/* =========================================
   CAMERA ONLINE STATUS
========================================= */

function setCameraOnlineStatus(
    online
) {

    if (!cameraOnlineStatus) {

        return;
    }

    cameraOnlineStatus.textContent =
        online
            ? "🟢 Online"
            : "🔴 Offline";
}


/* =========================================
   VIEWER STATUS
========================================= */

function setViewerStatus(
    message
) {

    if (viewerStatusMessage) {

        viewerStatusMessage.textContent =
            message;

    }
}


/* =========================================
   MODE SWITCHING
========================================= */

function showCameraMode() {

    cameraSection.classList.remove(
        "hidden"
    );

    viewerSection.classList.add(
        "hidden"
    );

    cameraModeButton.classList.add(
        "active"
    );

    viewerModeButton.classList.remove(
        "active"
    );

    setStatus(
        "Camera mode"
    );

    connectToSignalingServer();
}


function showViewerMode() {

    cameraSection.classList.add(
        "hidden"
    );

    viewerSection.classList.remove(
        "hidden"
    );

    viewerModeButton.classList.add(
        "active"
    );

    cameraModeButton.classList.remove(
        "active"
    );

    setStatus(
        "Viewer mode"
    );

    setViewerStatus(
        "Select a camera to connect."
    );

    connectToSignalingServer();
}


cameraModeButton.addEventListener(
    "click",
    showCameraMode
);


viewerModeButton.addEventListener(
    "click",
    showViewerMode
);


/* =========================================
   CAMERA CONTROLS
========================================= */

function createCameraControls() {

    if (
        !cameraControlContainer
    ) {

        return;
    }

    cameraControlContainer.innerHTML = `

        <div
            class="camera-control-panel"
            style="
                display:flex;
                flex-wrap:wrap;
                gap:8px;
                margin:15px 0;
            "
        >

            <button
                type="button"
                id="cameraStopButton"
            >
                ⏹ Stop
            </button>

            <button
                type="button"
                id="cameraFrontButton"
            >
                🔄 Front
            </button>

            <button
                type="button"
                id="cameraRearButton"
            >
                🔄 Rear
            </button>

            <button
                type="button"
                id="cameraMuteButton"
            >
                🎤 Mute
            </button>

        </div>

    `;


    const stopButton =
        document.getElementById(
            "cameraStopButton"
        );

    const frontButton =
        document.getElementById(
            "cameraFrontButton"
        );

    const rearButton =
        document.getElementById(
            "cameraRearButton"
        );

    const muteButton =
        document.getElementById(
            "cameraMuteButton"
        );


    stopButton.addEventListener(
        "click",
        function () {

            stopCamera();

        }
    );


    frontButton.addEventListener(
        "click",
        async function () {

            await switchCamera(
                "user"
            );

        }
    );


    rearButton.addEventListener(
        "click",
        async function () {

            await switchCamera(
                "environment"
            );

        }
    );


    muteButton.addEventListener(
        "click",
        function () {

            cameraAudioEnabled =
                !cameraAudioEnabled;

            setCameraAudio(
                cameraAudioEnabled
            );

            muteButton.textContent =
                cameraAudioEnabled
                    ? "🎤 Mute"
                    : "🔊 Unmute";

        }
    );
}


/* =========================================
   VIEWER CONTROLS
========================================= */

function createViewerControls() {

    if (
        !viewerControlContainer
    ) {

        return;
    }

    viewerControlContainer.innerHTML = `

        <div
            class="viewer-control-panel"
            style="
                display:flex;
                flex-wrap:wrap;
                gap:8px;
                margin:15px 0;
            "
        >

            <button
                type="button"
                id="viewerFrontButton"
            >
                🔄 Front
            </button>

            <button
                type="button"
                id="viewerRearButton"
            >
                🔄 Rear
            </button>

            <button
                type="button"
                id="viewerMuteButton"
            >
                🔇 Mute
            </button>

            <button
                type="button"
                id="viewerStopButton"
            >
                ⏹ Disconnect
            </button>

        </div>

    `;


    const frontButton =
        document.getElementById(
            "viewerFrontButton"
        );

    const rearButton =
        document.getElementById(
            "viewerRearButton"
        );

    const muteButton =
        document.getElementById(
            "viewerMuteButton"
        );

    const stopButton =
        document.getElementById(
            "viewerStopButton"
        );


    frontButton.addEventListener(
        "click",
        function () {

            sendCameraCommand(
                "switch-camera",
                {
                    facingMode:
                        "user"
                }
            );

        }
    );


    rearButton.addEventListener(
        "click",
        function () {

            sendCameraCommand(
                "switch-camera",
                {
                    facingMode:
                        "environment"
                }
            );

        }
    );


    muteButton.addEventListener(
        "click",
        function () {

            if (
                !remoteVideo ||
                !remoteVideo.srcObject
            ) {

                return;
            }

            const tracks =
                remoteVideo
                    .srcObject
                    .getAudioTracks();


            if (
                tracks.length === 0
            ) {

                return;
            }


            const currentlyEnabled =
                tracks.some(
                    function (track) {

                        return track.enabled;

                    }
                );


            tracks.forEach(
                function (track) {

                    track.enabled =
                        !currentlyEnabled;

                }
            );


            muteButton.textContent =
                currentlyEnabled
                    ? "🔊 Unmute"
                    : "🔇 Mute";

        }
    );


    stopButton.addEventListener(
        "click",
        function () {

            disconnectViewer();

        }
    );
}


/* =========================================
   SUPABASE REALTIME
========================================= */

async function connectToSignalingServer() {

    if (signalingChannel) {

        return;
    }


    setStatus(
        "Connecting..."
    );


    signalingChannel =
        supabaseClient.channel(
            "cctv:" + ROOM_ID,
            {
                config: {
                    broadcast: {
                        self: false
                    }
                }
            }
        );


    signalingChannel.on(
        "broadcast",
        {
            event: "signal"
        },
        async function (message) {

            try {

                const data =
                    message.payload;


                console.log(
                    "Signal received:",
                    data.type
                );
if (
    data.type ===
    "camera-presence"
) {

    handleCameraPresence(
        data
    );

    return;
}

                if (
                    data.type ===
                    "request-camera"
                ) {

                    await handleCameraRequest(data);

                    return;
                }


                if (
                    data.type ===
                    "camera-command"
                ) {

                    await handleCameraCommand(
                        data
                    );

                    return;
                }


                if (
                    data.type ===
                    "offer"
                ) {

                    await handleIncomingOffer(
                        data
                    );

                    return;
                }


                if (
                    data.type ===
                    "answer"
                ) {

                    await handleIncomingAnswer(
                        data
                    );

                    return;
                }


                if (
                    data.type ===
                    "candidate"
                ) {

                    await handleIncomingCandidate(
                        data
                    );

                    return;
                }

            } catch (error) {

                console.error(
                    "Signaling error:",
                    error
                );

            }

        }
    );


    signalingChannel.subscribe(
        function (status, error) {

            console.log(
                "Supabase:",
                status
            );


            if (
                status ===
                "SUBSCRIBED"
            ) {

                setStatus(
                    "Online"
                );

                return;
            }


            if (
                status ===
                "CHANNEL_ERROR"
            ) {

                console.error(
                    error
                );

                setStatus(
                    "Connection error"
                );

                return;
            }


            if (
                status ===
                "TIMED_OUT"
            ) {

                setStatus(
                    "Connection timed out"
                );

                return;
            }


            if (
                status ===
                "CLOSED"
            ) {

                signalingChannel =
                    null;

                setStatus(
                    "Offline"
                );

            }

        }
    );
}
/* =========================================
   CAMERA ONLINE / OFFLINE HEARTBEAT
========================================= */

function startCameraHeartbeat() {

    stopCameraHeartbeat();


    sendCameraPresence();


    cameraHeartbeatTimer =
        setInterval(
            function () {

                sendCameraPresence();

            },
            CAMERA_HEARTBEAT_INTERVAL
        );
}


function stopCameraHeartbeat() {

    if (
        cameraHeartbeatTimer
    ) {

        clearInterval(
            cameraHeartbeatTimer
        );

        cameraHeartbeatTimer =
            null;
    }
}


async function sendCameraPresence() {

    if (
        !localStream
    ) {

        return;
    }


    await sendSignalingMessage({

        type:
            "camera-presence",

        online:
            true,

        timestamp:
            Date.now()

    });
}

function handleCameraPresence(
    data
) {

    if (
        !viewerSection ||
        viewerSection.classList.contains(
            "hidden"
        )
    ) {

        return;
    }


    if (
        data.online === true
    ) {

        lastCameraHeartbeat =
            Date.now();


        if (cameraOnlineStatus) {

            cameraOnlineStatus.textContent =
                "🟢 Online";

        }


        const savedCameraStatus =
            document.getElementById(
                "savedCameraStatus"
            );


        if (savedCameraStatus) {

            savedCameraStatus.textContent =
                "🟢 Online";

        }

    }

}
function checkCameraOffline() {

    if (
        !viewerSection ||
        viewerSection.classList.contains(
            "hidden"
        )
    ) {

        return;
    }


    if (
        lastCameraHeartbeat === 0
    ) {

        return;
    }


    const elapsed =
        Date.now() -
        lastCameraHeartbeat;


    if (
        elapsed >
        CAMERA_OFFLINE_TIMEOUT
    ) {

        if (cameraOnlineStatus) {

    cameraOnlineStatus.textContent =
        "🔴 Offline";

}


const savedCameraStatus =
    document.getElementById(
        "savedCameraStatus"
    );


if (savedCameraStatus) {

    savedCameraStatus.textContent =
        "🔴 Offline";

}

    }

}


setInterval(
    checkCameraOffline,
    5000
);

/* =========================================
   SEND SIGNAL
========================================= */
async function sendSignalingMessage(
    message
) {

    if (!signalingChannel) {

        await connectToSignalingServer();

    }


    if (!signalingChannel) {

        return;

    }


    try {

        await signalingChannel.send({

            type:
                "broadcast",

            event:
                "signal",

            payload: {
                ...message,
                cameraId: CAMERA_ID
            }

        });


        console.log(
            "Signal sent:",
            message.type
        );

    } catch (error) {

        console.error(
            "Signal send error:",
            error
        );

    }

}

        console.error(
            "Signal send error:",
            error
        );

    }
}


/* =========================================
   CAMERA COMMAND
========================================= */

async function sendCameraCommand(
    command,
    options = {}
) {

    await sendSignalingMessage({

        type:
            "camera-command",

        command:
            command,

        options:
            options

    });
}


/* =========================================
   HANDLE CAMERA COMMAND
========================================= */

async function handleCameraCommand(
    data
) {

    /*
       Only Camera mode handles
       remote camera commands.
    */

    if (
        cameraSection.classList.contains(
            "hidden"
        )
    ) {

        return;
    }


    if (
        data.command ===
        "start-camera"
    ) {

        await startCameraFromCommand();

        return;
    }


    if (
        data.command ===
        "stop-camera"
    ) {

        stopCamera();

        return;
    }


    if (
        data.command ===
        "switch-camera"
    ) {

        const facingMode =
            data.options &&
            data.options.facingMode
                ? data.options.facingMode
                : "environment";


        await switchCamera(
            facingMode
        );

        return;
    }


    if (
        data.command ===
        "audio-control"
    ) {

        const enabled =
            data.options &&
            typeof data.options.enabled ===
                "boolean"
                ? data.options.enabled
                : true;


        setCameraAudio(
            enabled
        );

    }
}


/* =========================================
   START CAMERA
========================================= */

async function startCamera() {

    try {

        setStatus(
            "Requesting camera..."
        );


        if (
            !navigator.mediaDevices ||
            !navigator.mediaDevices.getUserMedia
        ) {

            throw new Error(
                "Camera API is not available."
            );

        }


        if (localStream) {

            localStream
                .getTracks()
                .forEach(
                    function (track) {

                        track.stop();

                    }
                );

        }


        localStream =
            await navigator.mediaDevices
                .getUserMedia({

                    video: {

                        facingMode: {

                            ideal:
                                currentCameraFacing

                        }

                    },

                    audio: true

                });


        localStream
            .getAudioTracks()
            .forEach(
                function (track) {

                    track.enabled =
                        cameraAudioEnabled;

                }
            );


        localVideo.srcObject =
            localStream;


        await localVideo.play();


        createCameraControls();


        setCameraOnlineStatus(
            true
        );
startCameraHeartbeat();

        setStatus(
            "Camera online"
        );


        /*
           Keep Supabase connected.
        */

        await connectToSignalingServer();


    } catch (error) {

        console.error(
            "Camera error:",
            error
        );


        setStatus(
            "Camera error"
        );


        alert(
            "Unable to start the camera.\n\n" +
            error.message
        );

    }
}


startCameraButton.addEventListener(
    "click",
    startCamera
);


/* =========================================
   REMOTE START
========================================= */

async function startCameraFromCommand() {

    /*
       Browsers may block remote camera
       permission without a user gesture.
    */

    if (localStream) {

        return;

    }


    try {

        await startCamera();

    } catch (error) {

        console.error(
            "Remote start error:",
            error
        );

    }
}


/* =========================================
   STOP CAMERA
========================================= */

function stopCamera() {

    if (localStream) {

        localStream
            .getTracks()
            .forEach(
                function (track) {

                    track.stop();

                }
            );


        localStream =
            null;

    }


    localVideo.srcObject =
        null;


    if (peerConnection) {

        peerConnection.close();

        peerConnection =
            null;

    }

stopCameraHeartbeat();
    setCameraOnlineStatus(
        false
    );


    setStatus(
        "Camera offline"
    );
}


/* =========================================
   SWITCH CAMERA
========================================= */

async function switchCamera(
    facingMode
) {

    if (!localStream) {

        setStatus(
            "Camera is not running"
        );

        return;

    }


    try {

        const newStream =
            await navigator.mediaDevices
                .getUserMedia({

                    video: {

                        facingMode:
                            facingMode

                    },

                    audio: false

                });


        const newVideoTrack =
            newStream.getVideoTracks()[0];


        const oldVideoTrack =
            localStream.getVideoTracks()[0];


        if (
            peerConnection
        ) {

            const sender =
                peerConnection
                    .getSenders()
                    .find(
                        function (item) {

                            return (
                                item.track &&
                                item.track.kind ===
                                    "video"
                            );

                        }
                    );


            if (sender) {

                await sender.replaceTrack(
                    newVideoTrack
                );

            }

        }


        if (oldVideoTrack) {

            oldVideoTrack.stop();

            localStream.removeTrack(
                oldVideoTrack
            );

        }


        localStream.addTrack(
            newVideoTrack
        );


        localVideo.srcObject =
            localStream;


        currentCameraFacing =
            facingMode;


        setStatus(
            facingMode === "user"
                ? "Front camera active"
                : "Rear camera active"
        );

    } catch (error) {

        console.error(
            "Switch camera error:",
            error
        );


        setStatus(
            "Unable to switch camera"
        );

    }
}


/* =========================================
   CAMERA AUDIO
========================================= */

function setCameraAudio(
    enabled
) {

    cameraAudioEnabled =
        enabled;


    if (!localStream) {

        return;

    }


    localStream
        .getAudioTracks()
        .forEach(
            function (track) {

                track.enabled =
                    enabled;

            }
        );


    setStatus(
        enabled
            ? "Microphone enabled"
            : "Microphone muted"
    );
}


/* =========================================
   VIEWER CONNECT
========================================= */

createAnswerButton.addEventListener(
    "click",
    async function () {

        try {

            const selectedCameraId =
                getSavedCameraId();

            if (!selectedCameraId) {

                setViewerStatus(
                    "Please add a camera first."
                );

                return;

            }


            setViewerStatus(
                "Connecting to camera..."
            );


            setStatus(
                "Requesting camera..."
            );


            await connectToSignalingServer();


            await sendSignalingMessage({

                type:
                    "request-camera",

                targetCameraId:
                    selectedCameraId

            });


            setViewerStatus(
                "Waiting for camera..."
            );


        } catch (error) {

            console.error(
                "Viewer connection error:",
                error
            );


            setViewerStatus(
                "Connection failed"
            );

        }

    }
);
/* =========================================
   CAMERA RECEIVES VIEWER REQUEST
========================================= */

async function handleCameraRequest(data) {

    if (
        cameraSection.classList.contains(
            "hidden"
        )
    ) {

        return;

    }


    // Only respond to requests for this camera
    if (
        data.targetCameraId &&
        data.cameraId !== CAMERA_ID
    ) {

        console.log(
            "Ignoring request for another camera:",
            data.cameraId
        );

        return;

    }


    console.log(
        "Viewer requested this camera:",
        CAMERA_ID
    );


    if (!localStream) {

        setStatus(
            "Viewer is waiting — start camera"
        );

        return;

    }


    await createCameraOffer();

}
/* =========================================
   CREATE CAMERA OFFER
   INTERNAL ONLY
========================================= */

async function createCameraOffer() {

    if (!localStream) {

        return;

    }


    if (peerConnection) {

        peerConnection.close();

    }


    setStatus(
        "Connecting to viewer..."
    );


    createPeerConnection(
        false
    );


    const offer =
        await peerConnection.createOffer();


    await peerConnection.setLocalDescription(
        offer
    );


    await sendSignalingMessage({

    type:
        "offer",

    offer:
        peerConnection.localDescription,

    targetCameraId:
        CAMERA_ID

});


setStatus(
    "Waiting for viewer..."
);

}
/* =========================================
   PEER CONNECTION
========================================= */

function createPeerConnection(
    isViewer
) {

    peerConnection =
        new RTCPeerConnection(
            configuration
        );


    if (
        !isViewer &&
        localStream
    ) {

        localStream
            .getTracks()
            .forEach(
                function (track) {

                    peerConnection.addTrack(
                        track,
                        localStream
                    );

                }
            );

    }


    peerConnection.ontrack =
        function (event) {

            if (
                event.streams &&
                event.streams[0]
            ) {

                remoteVideo.srcObject =
                    event.streams[0];


                remoteVideo
                    .play()
                    .catch(
                        function (error) {

                            console.log(
                                "Playback waiting:",
                                error
                            );

                        }
                    );


                if (liveIndicator) {

                    liveIndicator.style.display =
                        "block";

                }


                setViewerStatus(
                    "🟢 Camera connected"
                );

            }

        };

peerConnection.onicecandidate =
    function (event) {

        if (
            event.candidate
        ) {

            sendSignalingMessage({

                type:
                    "candidate",

                candidate:
                    event.candidate,

                targetCameraId:
                    CAMERA_ID

            });

        }

    };


    peerConnection.onconnectionstatechange =
        function () {

            if (!peerConnection) {

                return;

            }


            const state =
                peerConnection.connectionState;


            console.log(
                "WebRTC:",
                state
            );


            if (
                state ===
                "connected"
            ) {

                setStatus(
                    "🟢 Live camera connected"
                );


                setViewerStatus(
                    "🟢 Camera connected"
                );

            }


            else if (
                state ===
                "connecting"
            ) {

                setViewerStatus(
                    "Connecting video..."
                );

            }


            else if (
                state ===
                "disconnected"
            ) {

                setViewerStatus(
                    "Video connection interrupted"
                );

            }


            else if (
                state ===
                "failed"
            ) {

                setViewerStatus(
                    "Video connection failed"
                );

            }

        };

}


/* =========================================
   VIEWER RECEIVES OFFER
========================================= */

async function handleIncomingOffer(
    message
) {

    if (
        viewerSection.classList.contains(
            "hidden"
        )
    ) {

        return;

    }


    try {

        if (peerConnection) {

            peerConnection.close();

        }


        setViewerStatus(
            "Camera found..."
        );


        createPeerConnection(
            true
        );

const selectedCameraId =
    getSavedCameraId();

if (
    message.targetCameraId &&
    message.targetCameraId !== selectedCameraId
) {

    console.log(
        "Ignoring offer for another camera:",
        message.targetCameraId
    );

    return;
}
        await peerConnection.setRemoteDescription(
            message.offer
        );


        const answer =
            await peerConnection.createAnswer();


        await peerConnection.setLocalDescription(
            answer
        );


        await sendSignalingMessage({

    type:
        "answer",

    answer:
        peerConnection.localDescription,

    targetCameraId:
        CAMERA_ID

});
    } catch (error) {

        console.error(
            "Offer error:",
            error
        );


        setViewerStatus(
            "Unable to connect"
        );

    }
}


/* =========================================
   CAMERA RECEIVES ANSWER
========================================= */

async function handleIncomingAnswer(
    message
) {

    try {

        if (
            peerConnection &&
            peerConnection.signalingState ===
                "have-local-offer"
        ) {

            await peerConnection.setRemoteDescription(
                message.answer
            );

            setStatus(
                "Viewer connected"
            );

        }

    } catch (error) {

        console.error(
            "Answer error:",
            error
        );

    }
}


/* =========================================
   ICE CANDIDATE
========================================= */

async function handleIncomingCandidate(
    message
) {

    try {

        if (
            peerConnection &&
            message.candidate
        ) {

            await peerConnection.addIceCandidate(
                message.candidate
            );

        }

    } catch (error) {

        console.error(
            "ICE error:",
            error
        );

    }
}


/* =========================================
   DISCONNECT VIEWER
========================================= */

function disconnectViewer() {

    if (peerConnection) {

        peerConnection.close();

        peerConnection =
            null;

    }


    if (remoteVideo) {

        remoteVideo.srcObject =
            null;

    }


    if (liveIndicator) {

        liveIndicator.style.display =
            "none";

    }


    setViewerStatus(
        "Disconnected"
    );


    setStatus(
        "Viewer disconnected"
    );
}


/* =========================================
   INITIAL STATE
========================================= */

cameraSection.classList.remove(
    "hidden"
);

viewerSection.classList.add(
    "hidden"
);

setCameraOnlineStatus(
    false
);


if (liveIndicator) {

    liveIndicator.style.display =
        "none";

}


createViewerControls();


setStatus(
    "Ready"
);


/* =========================================
   START SUPABASE
========================================= */

connectToSignalingServer();
