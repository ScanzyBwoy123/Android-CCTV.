let localStream = null;
let peerConnection = null;
let signalingSocket = null;

const SIGNALING_SERVER =
    "wss://android-cctv-signaling.scanzybwoy8.workers.dev";

const ROOM_ID = "android-cctv-demo";

const configuration = {
    iceServers: [
        {
            urls: "stun:stun.l.google.com:19302"
        }
    ]
};

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


function setStatus(message) {
    connectionStatus.textContent = message;
    console.log(message);
}


/* =========================================
   CAMERA / VIEWER MODE
========================================= */

function showCameraMode() {

    cameraSection.classList.remove("hidden");
    viewerSection.classList.add("hidden");

    cameraModeButton.classList.add("active");
    viewerModeButton.classList.remove("active");

    setStatus("Camera mode");

    connectToSignalingServer();
}


function showViewerMode() {

    cameraSection.classList.add("hidden");
    viewerSection.classList.remove("hidden");

    viewerModeButton.classList.add("active");
    cameraModeButton.classList.remove("active");

    setStatus("Viewer mode");

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
   SIGNALING SERVER
========================================= */

function connectToSignalingServer() {

    if (
        signalingSocket &&
        signalingSocket.readyState === WebSocket.OPEN
    ) {
        return;
    }

    if (
        signalingSocket &&
        signalingSocket.readyState === WebSocket.CONNECTING
    ) {
        return;
    }

    setStatus(
        "Connecting to signaling server..."
    );

    signalingSocket = new WebSocket(
        SIGNALING_SERVER +
        "?room=" +
        encodeURIComponent(ROOM_ID)
    );


    signalingSocket.onopen = function () {

        console.log(
            "Connected to signaling server"
        );

        setStatus(
            "Signaling server connected"
        );
    };


    signalingSocket.onmessage = async function (event) {

        try {

            const message =
                JSON.parse(event.data);

            console.log(
                "Signaling message:",
                message.type
            );


            if (message.type === "joined") {

                setStatus(
                    "Signaling server connected"
                );

                return;
            }


            if (message.type === "offer") {

                await handleIncomingOffer(
                    message
                );

                return;
            }


            if (message.type === "answer") {

                await handleIncomingAnswer(
                    message
                );

                return;
            }


            if (message.type === "candidate") {

                await handleIncomingCandidate(
                    message
                );

                return;
            }


            if (message.type === "pong") {

                console.log(
                    "Signaling server pong"
                );

                return;
            }

        } catch (error) {

            console.error(
                "Signaling message error:",
                error
            );
        }
    };


    signalingSocket.onerror = function (error) {

        console.error(
            "Signaling error:",
            error
        );

        setStatus(
            "Signaling server error"
        );
    };


    signalingSocket.onclose = function (event) {

        console.log(
            "SIGNALING SOCKET CLOSED"
        );

        console.log(
            "Close code:",
            event.code
        );

        console.log(
            "Close reason:",
            event.reason
        );

        console.log(
            "Was clean:",
            event.wasClean
        );

        setStatus(
            "Signaling server disconnected (" +
            event.code +
            ")"
        );

        signalingSocket = null;
    };
}


/* =========================================
   SEND SIGNALING MESSAGE
========================================= */

function sendSignalingMessage(message) {

    if (
        signalingSocket &&
        signalingSocket.readyState ===
        WebSocket.OPEN
    ) {

        signalingSocket.send(
            JSON.stringify(message)
        );

        console.log(
            "Sent signaling message:",
            message.type
        );

    } else {

        console.log(
            "Signaling socket is not connected"
        );
    }
}


/* =========================================
   PEER CONNECTION
========================================= */

function createPeerConnection(isViewer) {

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
            .forEach(function (track) {

                peerConnection.addTrack(
                    track,
                    localStream
                );

            });
    }


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
                    .catch(function (error) {

                        console.log(
                            "Video playback waiting:",
                            error
                        );

                    });
            }
        };


    peerConnection.onicecandidate =
        function (event) {

            if (event.candidate) {

                sendSignalingMessage({

                    type: "candidate",

                    candidate:
                        event.candidate
                });
            }
        };


    peerConnection.onconnectionstatechange =
        function () {

            const state =
                peerConnection.connectionState;

            console.log(
                "Connection state:",
                state
            );

            setStatus(
                "Connection: " + state
            );
        };
}


/* =========================================
   START CAMERA
========================================= */

startCameraButton.addEventListener(
    "click",
    async function () {

        console.log(
            "START CAMERA BUTTON CLICKED"
        );

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


            localStream =
                await navigator.mediaDevices.getUserMedia({

                    video: {
                        facingMode: {
                            ideal: "environment"
                        }
                    },

                    audio: true
                });


            console.log(
                "Camera stream received"
            );


            localVideo.srcObject =
                localStream;


            await localVideo.play();


            createOfferButton.disabled =
                false;


            setStatus(
                "Camera started successfully"
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
);


/* =========================================
   CAMERA CREATES OFFER
========================================= */

createOfferButton.addEventListener(
    "click",
    async function () {

        try {

            if (!localStream) {

                alert(
                    "Start the camera first."
                );

                return;
            }


            if (peerConnection) {

                peerConnection.close();
            }


            setStatus(
                "Creating camera connection..."
            );


            createPeerConnection(false);


            const offer =
                await peerConnection.createOffer();


            await peerConnection.setLocalDescription(
                offer
            );


            sendSignalingMessage({

                type: "offer",

                offer:
                    peerConnection.localDescription
            });


            offerOutput.value =
                "Automatic signaling enabled";


            setStatus(
                "Camera offer sent automatically"
            );

        } catch (error) {

            console.error(
                "Offer error:",
                error
            );

            setStatus(
                "Offer error: " +
                error.message
            );
        }
    }
);


/* =========================================
   VIEWER RECEIVES OFFER
========================================= */

async function handleIncomingOffer(message) {

    try {

        if (
            viewerSection.classList.contains("hidden")
        ) {

            return;
        }


        if (peerConnection) {

            peerConnection.close();
        }


        setStatus(
            "Camera found. Connecting..."
        );


        createPeerConnection(true);


        await peerConnection.setRemoteDescription(
            message.offer
        );


        const answer =
            await peerConnection.createAnswer();


        await peerConnection.setLocalDescription(
            answer
        );


        sendSignalingMessage({

            type: "answer",

            answer:
                peerConnection.localDescription
        });


        answerOutput.value =
            "Automatic signaling enabled";


        setStatus(
            "Viewer connected to camera"
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

async function handleIncomingAnswer(message) {

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
                "Camera connected to viewer"
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

async function handleIncomingCandidate(message) {

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
   OLD MANUAL BUTTONS
========================================= */

connectCameraButton.addEventListener(
    "click",
    function () {

        alert(
            "Manual connection is no longer required."
        );
    }
);


createAnswerButton.addEventListener(
    "click",
    function () {

        alert(
            "Manual answer creation is no longer required."
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

cameraSection.classList.remove("hidden");
viewerSection.classList.add("hidden");

createOfferButton.disabled = true;

connectCameraButton.disabled = true;

setStatus("Ready");

connectToSignalingServer();
