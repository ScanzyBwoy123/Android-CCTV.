// ==========================================
// ANDROID CCTV - WEBRTC CAMERA / VIEWER
// ==========================================

let localStream = null;
let peerConnection = null;

const configuration = {
    iceServers: [
        {
            urls: "stun:stun.l.google.com:19302"
        }
    ]
};

// ==========================================
// ELEMENTS
// ==========================================

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


// ==========================================
// STATUS
// ==========================================

function setStatus(message) {

    if (connectionStatus) {
        connectionStatus.textContent =
            message;
    }

    console.log(message);
}


// ==========================================
// CAMERA / VIEWER MODE
// ==========================================

function showCameraMode() {

    cameraSection.classList.remove("hidden");

    viewerSection.classList.add("hidden");

    cameraModeButton.classList.add("active");

    viewerModeButton.classList.remove("active");

    setStatus("Camera mode");
}


function showViewerMode() {

    cameraSection.classList.add("hidden");

    viewerSection.classList.remove("hidden");

    viewerModeButton.classList.add("active");

    cameraModeButton.classList.remove("active");

    setStatus("Viewer mode");
}


cameraModeButton.addEventListener(
    "click",
    showCameraMode
);


viewerModeButton.addEventListener(
    "click",
    showViewerMode
);


// ==========================================
// START CAMERA
// ==========================================

startCameraButton.addEventListener(
    "click",
    async function () {

        try {

            setStatus(
                "Requesting camera permission..."
            );

            localStream =
                await navigator.mediaDevices
                .getUserMedia({
                    video: {
                        facingMode: {
                            ideal: "environment"
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
                "Camera started successfully"
            );

        } catch (error) {

            console.error(error);

            setStatus(
                "Camera error: " +
                error.message
            );

            alert(
                "Unable to access the camera.\n\n" +
                error.message
            );
        }
    }
);


// ==========================================
// CREATE PEER CONNECTION
// ==========================================

function createPeerConnection(
    isViewer = false
) {

    peerConnection =
        new RTCPeerConnection(
            configuration
        );


    // CAMERA SENDS VIDEO + AUDIO
    if (!isViewer && localStream) {

        localStream
            .getTracks()
            .forEach(function (track) {

                peerConnection.addTrack(
                    track,
                    localStream
                );

            });
    }


    // VIEWER RECEIVES VIDEO + AUDIO
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

                remoteVideo.play()
                    .catch(function (error) {

                        console.log(
                            "Playback requires user action:",
                            error
                        );

                    });
            }
        };


    // ICE COMPLETE
    peerConnection.onicecandidate =
        function (event) {

            if (
                event.candidate === null &&
                peerConnection.localDescription
            ) {

                const code =
                    JSON.stringify(
                        peerConnection.localDescription
                    );


                // CAMERA OFFER
                if (!isViewer) {

                    offerOutput.value =
                        code;

                    copyOfferButton.disabled =
                        false;

                    connectCameraButton.disabled =
                        false;

                    setStatus(
                        "Connection code ready"
                    );
                }


                // VIEWER ANSWER
                else {

                    answerOutput.value =
                        code;

                    copyAnswerButton.disabled =
                        false;

                    setStatus(
                        "Viewer response ready"
                    );
                }
            }
        };


    // CONNECTION STATE
    peerConnection.onconnectionstatechange =
        function () {

            const state =
                peerConnection.connectionState;

            console.log(
                "Connection state:",
                state
            );

            if (state === "connected") {

                setStatus(
                    "Connected successfully"
                );

            } else {

                setStatus(
                    "Connection: " +
                    state
                );
            }
        };
}


// ==========================================
// CAMERA — CREATE CONNECTION CODE
// ==========================================

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


            createPeerConnection(false);


            const offer =
                await peerConnection
                .createOffer();


            await peerConnection
                .setLocalDescription(
                    offer
                );


            setStatus(
                "Creating connection code..."
            );

        } catch (error) {

            console.error(error);

            setStatus(
                "Offer error: " +
                error.message
            );

            alert(
                "Unable to create connection code.\n\n" +
                error.message
            );
        }
    }
);


// ==========================================
// CAMERA — CONNECT VIEWER
// ==========================================

connectCameraButton.addEventListener(
    "click",
    async function () {

        try {

            if (!peerConnection) {

                alert(
                    "Create the connection code first."
                );

                return;
            }


            const answerText =
                answerInput.value.trim();


            if (!answerText) {

                alert(
                    "Paste the viewer response first."
                );

                return;
            }


            const answer =
                JSON.parse(answerText);


            await peerConnection
                .setRemoteDescription(
                    answer
                );


            setStatus(
                "Connecting to viewer..."
            );

        } catch (error) {

            console.error(error);

            setStatus(
                "Connection error"
            );

            alert(
                "Could not connect the viewer.\n\n" +
                error.message
            );
        }
    }
);


// ==========================================
// VIEWER — CONNECT TO CAMERA
// ==========================================

createAnswerButton.addEventListener(
    "click",
    async function () {

        try {

            const offerText =
                offerInput.value.trim();


            if (!offerText) {

                alert(
                    "Paste the camera connection code first."
                );

                return;
            }


            const offer =
                JSON.parse(offerText);


            if (peerConnection) {

                peerConnection.close();
            }


            createPeerConnection(true);


            await peerConnection
                .setRemoteDescription(
                    offer
                );


            const answer =
                await peerConnection
                .createAnswer();


            await peerConnection
                .setLocalDescription(
                    answer
                );


            setStatus(
                "Creating viewer response..."
            );

        } catch (error) {

            console.error(error);

            setStatus(
                "Viewer connection error"
            );

            alert(
                "Unable to connect to camera.\n\n" +
                error.message
            );
        }
    }
);


// ==========================================
// COPY CAMERA CONNECTION CODE
// ==========================================

copyOfferButton.addEventListener(
    "click",
    async function () {

        try {

            await navigator.clipboard
                .writeText(
                    offerOutput.value
                );

            setStatus(
                "Connection code copied"
            );

        } catch (error) {

            offerOutput.select();

            document.execCommand(
                "copy"
            );

            setStatus(
                "Connection code copied"
            );
        }
    }
);


// ==========================================
// COPY VIEWER RESPONSE
// ==========================================

copyAnswerButton.addEventListener(
    "click",
    async function () {

        try {

            await navigator.clipboard
                .writeText(
                    answerOutput.value
                );

            setStatus(
                "Viewer response copied"
            );

        } catch (error) {

            answerOutput.select();

            document.execCommand(
                "copy"
            );

            setStatus(
                "Viewer response copied"
            );
        }
    }
);


// ==========================================
// INITIAL STATE
// ==========================================

cameraSection.classList.remove(
    "hidden"
);

viewerSection.classList.add(
    "hidden"
);

createOfferButton.disabled =
    true;

copyOfferButton.disabled =
    true;

connectCameraButton.disabled =
    true;

copyAnswerButton.disabled =
    true;

setStatus("Ready");
