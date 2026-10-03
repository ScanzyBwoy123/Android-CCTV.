let localStream = null;
let peerConnection = null;
let signalingChannel = null;

let currentCameraFacing = "environment";
let cameraAudioEnabled = true;

const SUPABASE_URL =
    "https://vsdujfqygetvwgbfrjzj.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
    "sb_publishable_awDxxCnxSAoB0o5-nhKh7A_9bZ_aYRo";

const ROOM_ID = "android-cctv-demo";

const configuration = {
    iceServers: [
        {
            urls: "stun:stun.l.google.com:19302"
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
    document.getElementById("connectionStatus");

const cameraModeButton =
    document.getElementById("cameraModeButton");

const viewerModeButton =
    document.getElementById("viewerModeButton");

const cameraSection =
    document.getElementById("cameraMode");

const viewerSection =
    document.getElementById("viewerMode");

const localVideo =
    document.getElementById("localVideo");

const remoteVideo =
    document.getElementById("remoteVideo");

const startCameraButton =
    document.getElementById("startCameraButton");

const createOfferButton =
    document.getElementById("createOfferButton");

const offerOutput =
    document.getElementById("offerOutput");

const copyOfferButton =
    document.getElementById("copyOfferButton");

const answerInput =
    document.getElementById("answerInput");

const connectCameraButton =
    document.getElementById("connectCameraButton");

const offerInput =
    document.getElementById("offerInput");

const createAnswerButton =
    document.getElementById("createAnswerButton");

const answerOutput =
    document.getElementById("answerOutput");

const copyAnswerButton =
    document.getElementById("copyAnswerButton");


/* =========================================
   STATUS
========================================= */

function setStatus(message) {

    connectionStatus.textContent =
        message;

    console.log(message);
}


/* =========================================
   CREATE CONTROL BUTTONS
   These are created automatically so
   index.html does not need to change yet.
========================================= */

function createCameraControls() {

    if (
        document.getElementById(
            "cameraControlPanel"
        )
    ) {
        return;
    }


    const panel =
        document.createElement("div");

    panel.id =
        "cameraControlPanel";


    panel.style.marginTop =
        "15px";


    panel.style.display =
        "flex";


    panel.style.flexWrap =
        "wrap";


    panel.style.gap =
        "8px";


    panel.innerHTML = `

        <button
            type="button"
            id="remoteStartCameraButton"
        >
            📹 Start Camera
        </button>

        <button
            type="button"
            id="remoteStopCameraButton"
        >
            ⏹ Stop Camera
        </button>

        <button
            type="button"
            id="switchFrontCameraButton"
        >
            🔄 Front Camera
        </button>

        <button
            type="button"
            id="switchRearCameraButton"
        >
            🔄 Rear Camera
        </button>

        <button
            type="button"
            id="toggleCameraAudioButton"
        >
            🎤 Mute Audio
        </button>

    `;


    cameraSection.appendChild(
        panel
    );


    document
        .getElementById(
            "remoteStartCameraButton"
        )
        .addEventListener(
            "click",
            function () {

                sendCameraCommand(
                    "start-camera"
                );

            }
        );


    document
        .getElementById(
            "remoteStopCameraButton"
        )
        .addEventListener(
            "click",
            function () {

                sendCameraCommand(
                    "stop-camera"
                );

            }
        );


    document
        .getElementById(
            "switchFrontCameraButton"
        )
        .addEventListener(
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


    document
        .getElementById(
            "switchRearCameraButton"
        )
        .addEventListener(
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


    document
        .getElementById(
            "toggleCameraAudioButton"
        )
        .addEventListener(
            "click",
            function () {

                cameraAudioEnabled =
                    !cameraAudioEnabled;


                sendCameraCommand(
                    "audio-control",
                    {
                        enabled:
                            cameraAudioEnabled
                    }
                );


                this.textContent =
                    cameraAudioEnabled
                        ? "🎤 Mute Audio"
                        : "🔇 Unmute Audio";

            }
        );
}


/* =========================================
   VIEWER CONTROL PANEL
========================================= */

function createViewerControls() {

    if (
        document.getElementById(
            "viewerControlPanel"
        )
    ) {
        return;
    }


    const panel =
        document.createElement("div");


    panel.id =
        "viewerControlPanel";


    panel.style.marginTop =
        "15px";


    panel.style.display =
        "flex";


    panel.style.flexWrap =
        "wrap";


    panel.style.gap =
        "8px";


    panel.innerHTML = `

        <button
            type="button"
            id="viewerStartCameraButton"
        >
            📹 Start Camera
        </button>

        <button
            type="button"
            id="viewerStopCameraButton"
        >
            ⏹ Stop Camera
        </button>

        <button
            type="button"
            id="viewerFrontCameraButton"
        >
            🔄 Front
        </button>

        <button
            type="button"
            id="viewerRearCameraButton"
        >
            🔄 Rear
        </button>

        <button
            type="button"
            id="viewerMuteButton"
        >
            🔇 Mute
        </button>

    `;


    viewerSection.appendChild(
        panel
    );


    document
        .getElementById(
            "viewerStartCameraButton"
        )
        .addEventListener(
            "click",
            function () {

                sendCameraCommand(
                    "start-camera"
                );

            }
        );


    document
        .getElementById(
            "viewerStopCameraButton"
        )
        .addEventListener(
            "click",
            function () {

                sendCameraCommand(
                    "stop-camera"
                );

            }
        );


    document
        .getElementById(
            "viewerFrontCameraButton"
        )
        .addEventListener(
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


    document
        .getElementById(
            "viewerRearCameraButton"
        )
        .addEventListener(
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


    document
        .getElementById(
            "viewerMuteButton"
        )
        .addEventListener(
            "click",
            function () {

                if (
                    remoteVideo.srcObject
                ) {

                    const tracks =
                        remoteVideo
                            .srcObject
                            .getAudioTracks();


                    tracks.forEach(
                        function (track) {

                            track.enabled =
                                !track.enabled;

                        }
                    );


                    this.textContent =
                        tracks.some(
                            function (track) {
                                return track.enabled;
                            }
                        )
                            ? "🔇 Mute"
                            : "🔊 Unmute";
                }

            }
        );
}


/* =========================================
   CAMERA MODE
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
   SUPABASE REALTIME
========================================= */

async function connectToSignalingServer() {

    if (signalingChannel) {

        return;
    }


    setStatus(
        "Connecting to Supabase..."
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


                /* =================================
                   VIEWER REQUESTS CAMERA
                ================================= */

                if (
                    data.type ===
                    "request-camera"
                ) {

                    await handleCameraRequest();

                    return;
                }


                /* =================================
                   CAMERA REMOTE COMMANDS
                ================================= */

                if (
                    data.type ===
                    "camera-command"
                ) {

                    await handleCameraCommand(
                        data
                    );

                    return;
                }


                /* =================================
                   VIEWER RECEIVES OFFER
                ================================= */

                if (
                    data.type ===
                    "offer"
                ) {

                    await handleIncomingOffer(
                        data
                    );

                    return;
                }


                /* =================================
                   CAMERA RECEIVES ANSWER
                ================================= */

                if (
                    data.type ===
                    "answer"
                ) {

                    await handleIncomingAnswer(
                        data
                    );

                    return;
                }


                /* =================================
                   ICE
                ================================= */

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
                    "Supabase message error:",
                    error
                );
            }
        }
    );


    signalingChannel.subscribe(
        function (status, error) {

            console.log(
                "Supabase channel status:",
                status
            );


            if (
                status ===
                "SUBSCRIBED"
            ) {

                setStatus(
                    "Signaling server connected"
                );

                return;
            }


            if (
                status ===
                "CHANNEL_ERROR"
            ) {

                console.error(
                    "Supabase channel error:",
                    error
                );

                setStatus(
                    "Supabase channel error"
                );

                return;
            }


            if (
                status ===
                "TIMED_OUT"
            ) {

                setStatus(
                    "Supabase connection timed out"
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
                    "Supabase signaling disconnected"
                );
            }
        }
    );
}


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

        setStatus(
            "Signaling server unavailable"
        );

        return;
    }


    try {

        await signalingChannel.send({

            type:
                "broadcast",

            event:
                "signal",

            payload:
                message

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


/* =========================================
   SEND CAMERA COMMAND
========================================= */

async function sendCameraCommand(
    command,
    options = {}
) {

    try {

        await sendSignalingMessage({

            type:
                "camera-command",

            command:
                command,

            options:
                options

        });


        setStatus(
            "Camera command sent: " +
            command
        );

    } catch (error) {

        console.error(
            "Camera command error:",
            error
        );

        setStatus(
            "Camera command failed"
        );
    }
}


/* =========================================
   HANDLE CAMERA COMMAND
========================================= */

async function handleCameraCommand(
    data
) {

    /*
       Camera only.
       Viewer ignores camera commands.
    */

    if (
        cameraSection.classList.contains(
            "hidden"
        )
    ) {

        return;
    }


    console.log(
        "Camera command received:",
        data.command
    );


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

        return;
    }
}


/* =========================================
   START CAMERA
========================================= */

async function startCamera() {

    try {

        setStatus(
            "Requesting camera permission..."
        );


        if (
            !navigator.mediaDevices ||
            !navigator.mediaDevices.getUserMedia
        ) {

            throw new Error(
                "Camera API is not available"
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


        localVideo.srcObject =
            localStream;


        await localVideo.play();


        createOfferButton.disabled =
            false;


        setStatus(
            "Camera ready and waiting"
        );


        connectToSignalingServer();

    } catch (error) {

        console.error(
            "Camera error:",
            error
        );


        setStatus(
            "Camera error: " +
            error.message
        );


        alert(
            "Unable to access camera.\n\n" +
            error.message
        );
    }
}


startCameraButton.addEventListener(
    "click",
    startCamera
);


/* =========================================
   START CAMERA FROM REMOTE COMMAND
========================================= */

async function startCameraFromCommand() {

    /*
       IMPORTANT:
       Browsers normally require a user gesture
       before camera permission can be granted.

       Therefore this works automatically if
       permission was already granted and the
       browser allows it.

       Otherwise Android will need the native
       app version for completely automatic
       startup.
    */

    if (localStream) {

        setStatus(
            "Camera is already running"
        );

        return;
    }


    setStatus(
        "Remote request received — starting camera..."
    );


    try {

        await startCamera();


        /*
           If there is already a viewer waiting,
           create the connection automatically.
        */

        if (
            localStream
        ) {

            await createCameraOffer();
        }

    } catch (error) {

        console.error(
            "Remote camera start error:",
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


    createOfferButton.disabled =
        true;


    setStatus(
        "Camera stopped"
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

        const cameraName =
            facingMode === "user"
                ? "front"
                : "rear";


        setStatus(
            "Opening " +
            cameraName +
            " camera..."
        );


        /*
           Get the currently active video track.
        */

        const oldVideoTrack =
            localStream.getVideoTracks()[0];


        /*
           First try to identify the actual
           camera devices available.
        */

        const devices =
            await navigator.mediaDevices.enumerateDevices();


        const videoDevices =
            devices.filter(
                function (device) {

                    return (
                        device.kind ===
                        "videoinput"
                    );

                }
            );


        console.log(
            "Available cameras:",
            videoDevices
        );


        /*
           If the browser already knows the
           camera labels, select the opposite
           physical camera where possible.
        */

        let selectedDevice = null;


        if (
            videoDevices.length > 1
        ) {

            const currentDeviceId =
                oldVideoTrack &&
                oldVideoTrack.getSettings
                    ? oldVideoTrack
                        .getSettings()
                        .deviceId
                    : null;


            const otherDevices =
                videoDevices.filter(
                    function (device) {

                        return (
                            device.deviceId !==
                            currentDeviceId
                        );

                    }
                );


            if (
                otherDevices.length > 0
            ) {

                if (
                    facingMode ===
                    "user"
                ) {

                    selectedDevice =
                        otherDevices.find(
                            function (device) {

                                return (
                                    /front|user/i.test(
                                        device.label
                                    )
                                );

                            }
                        );

                } else {

                    selectedDevice =
                        otherDevices.find(
                            function (device) {

                                return (
                                    /back|rear|environment/i.test(
                                        device.label
                                    )
                                );

                            }
                        );

                }


                /*
                   If labels don't identify the
                   camera, use another camera.
                */

                if (
                    !selectedDevice
                ) {

                    selectedDevice =
                        otherDevices[0];

                }

            }
        }


        /*
           Request the selected physical camera.
        */

        let newStream;


        if (
            selectedDevice
        ) {

            console.log(
                "Using camera device:",
                selectedDevice.label
            );


            newStream =
                await navigator.mediaDevices
                    .getUserMedia({

                        video: {
                            deviceId: {
                                exact:
                                    selectedDevice.deviceId
                            }
                        },

                        audio: false

                    });

        } else {

            /*
               Fallback for browsers that do not
               expose camera devices properly.
            */

            newStream =
                await navigator.mediaDevices
                    .getUserMedia({

                        video: {
                            facingMode: {
                                exact:
                                    facingMode
                            }
                        },

                        audio: false

                    });

        }


        const newVideoTrack =
            newStream.getVideoTracks()[0];


        if (!newVideoTrack) {

            throw new Error(
                "No video camera was returned"
            );
        }


        console.log(
            "New camera settings:",
            newVideoTrack.getSettings()
        );


        /*
           Replace the video track in WebRTC.
        */

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


        /*
           Stop the old physical camera.
        */

        if (
            oldVideoTrack
        ) {

            oldVideoTrack.stop();

            localStream.removeTrack(
                oldVideoTrack
            );

        }


        /*
           Add the new camera track.
        */

        localStream.addTrack(
            newVideoTrack
        );


        /*
           Update local preview.
        */

        localVideo.srcObject =
            localStream;


        await localVideo.play();


        currentCameraFacing =
            facingMode;


        setStatus(
            cameraName === "front"
                ? "✅ Front camera active"
                : "✅ Rear camera active"
        );


        console.log(
            "Camera successfully switched to:",
            cameraName
        );


    } catch (error) {

        console.error(
            "Camera switch error:",
            error
        );


        setStatus(
            "❌ Unable to switch camera"
        );


        alert(
            "Unable to switch camera.\n\n" +
            error.message
        );
    }
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

        setStatus(
            facingMode === "user"
                ? "Switching to front camera..."
                : "Switching to rear camera..."
        );


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


        /*
           Replace camera track inside
           the existing WebRTC connection.
        */

        if (peerConnection) {

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
        }


        localStream.removeTrack(
            oldVideoTrack
        );


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
            "Camera switch error:",
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
            ? "Camera microphone enabled"
            : "Camera microphone muted"
    );
}


/* =========================================
   VIEWER REQUESTS CAMERA
========================================= */

createAnswerButton.addEventListener(
    "click",
    async function () {

        try {

            setStatus(
                "Requesting camera..."
            );


            await connectToSignalingServer();


            await sendSignalingMessage({

                type:
                    "request-camera"

            });


            answerOutput.value =
                "Camera request sent automatically";


            setStatus(
                "Waiting for camera..."
            );

        } catch (error) {

            console.error(
                "Camera request error:",
                error
            );


            setStatus(
                "Camera request failed"
            );
        }
    }
);


/* =========================================
   CAMERA RECEIVES VIEWER REQUEST
========================================= */

async function handleCameraRequest() {

    try {

        if (
            cameraSection.classList.contains(
                "hidden"
            )
        ) {

            return;
        }


        console.log(
            "Viewer requested camera"
        );


        if (!localStream) {

            setStatus(
                "Viewer requested camera — camera is off"
            );


            alert(
                "The viewer requested this camera.\n\n" +
                "The browser cannot silently grant camera permission.\n\n" +
                "Tap Start Camera on this phone."
            );


            return;
        }


        await createCameraOffer();

    } catch (error) {

        console.error(
            "Camera request handling error:",
            error
        );


        setStatus(
            "Camera connection error"
        );
    }
}


/* =========================================
   CREATE CAMERA OFFER
========================================= */

async function createCameraOffer() {

    if (!localStream) {

        return;
    }


    if (peerConnection) {

        peerConnection.close();
    }


    setStatus(
        "Creating camera connection..."
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
            peerConnection.localDescription

    });


    offerOutput.value =
        "Camera connection sent to viewer";


    setStatus(
        "Camera connection sent"
    );
}


/* =========================================
   OLD CAMERA CREATE BUTTON
========================================= */

createOfferButton.addEventListener(
    "click",
    async function () {

        if (!localStream) {

            alert(
                "Start the camera first."
            );

            return;
        }


        await createCameraOffer();
    }
);


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


    /*
       CAMERA SENDS CAMERA/MICROPHONE
    */

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


    /*
       VIEWER RECEIVES CAMERA
    */

    peerConnection.ontrack =
        function (event) {

            console.log(
                "Remote media received"
            );


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
                                "Video playback waiting:",
                                error
                            );

                        }
                    );
            }
        };


    /*
       ICE
    */

    peerConnection.onicecandidate =
        function (event) {

            if (
                event.candidate
            ) {

                sendSignalingMessage({

                    type:
                        "candidate",

                    candidate:
                        event.candidate

                });
            }
        };


    /*
       REAL WEBRTC STATUS
    */

    peerConnection.onconnectionstatechange =
        function () {

            const state =
                peerConnection.connectionState;


            console.log(
                "WebRTC state:",
                state
            );


            if (
                state ===
                "connected"
            ) {

                setStatus(
                    "📹 Live camera connected"
                );

            }


            else if (
                state ===
                "connecting"
            ) {

                setStatus(
                    "Connecting video..."
                );

            }


            else if (
                state ===
                "disconnected"
            ) {

                setStatus(
                    "Video connection interrupted"
                );

            }


            else if (
                state ===
                "failed"
            ) {

                setStatus(
                    "Video connection failed"
                );

            }


            else if (
                state ===
                "closed"
            ) {

                setStatus(
                    "Video connection closed"
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

    try {

        if (
            viewerSection.classList.contains(
                "hidden"
            )
        ) {

            return;
        }


        if (peerConnection) {

            peerConnection.close();
        }


        setStatus(
            "Camera found. Connecting video..."
        );


        createPeerConnection(
            true
        );


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
                peerConnection.localDescription

        });


        answerOutput.value =
            "Camera response received automatically";


        setStatus(
            "Camera response sent"
        );

    } catch (error) {

        console.error(
            "Offer handling error:",
            error
        );


        setStatus(
            "Viewer connection error"
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
                "Viewer response received"
            );
        }

    } catch (error) {

        console.error(
            "Answer handling error:",
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
            "ICE candidate error:",
            error
        );
    }
}


/* =========================================
   OLD CONNECT BUTTON
========================================= */

connectCameraButton.addEventListener(
    "click",
    function () {

        alert(
            "The viewer now requests the camera automatically."
        );

    }
);


/* =========================================
   COPY BUTTONS
========================================= */

copyOfferButton.addEventListener(
    "click",
    async function () {

        try {

            await navigator.clipboard.writeText(
                offerOutput.value
            );

            setStatus(
                "Information copied"
            );

        } catch (error) {

            offerOutput.select();

            document.execCommand(
                "copy"
            );

            setStatus(
                "Information copied"
            );
        }
    }
);


copyAnswerButton.addEventListener(
    "click",
    async function () {

        try {

            await navigator.clipboard.writeText(
                answerOutput.value
            );

            setStatus(
                "Information copied"
            );

        } catch (error) {

            answerOutput.select();

            document.execCommand(
                "copy"
            );

            setStatus(
                "Information copied"
            );
        }
    }
);


/* =========================================
   INITIAL STATE
========================================= */

cameraSection.classList.remove(
    "hidden"
);

viewerSection.classList.add(
    "hidden"
);

createOfferButton.disabled =
    true;

connectCameraButton.disabled =
    true;


/* =========================================
   CREATE CONTROLS
========================================= */

createCameraControls();

createViewerControls();


/* =========================================
   READY
========================================= */

setStatus(
    "Ready"
);


/* =========================================
   CONNECT TO SUPABASE
========================================= */

connectToSignalingServer();
