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

    connectionStatus.textContent = message;

    console.log(message);
}


// ==========================================
// MODE SWITCHING
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

            setStatus("Requesting camera permission...");

            localStream =
                await navigator.mediaDevices.getUserMedia({
                    video: {
                        facingMode: {
                            ideal: "environment"
                        }
                    },
                    audio: true
                });

            localVideo.srcObject = localStream;

            await localVideo.play();

            createOfferButton.disabled = false;

            setStatus("Camera started successfully");

        } catch (error) {

            console.error(error);

            setStatus(
                "Camera error: " + error.message
            );

            alert(
                "Unable to access camera.\n\n" +
                error.message
            );
        }
    }
);


// ==========================================
// WAIT FOR ICE GATHERING
// ==========================================

function waitForIceGatheringComplete(
    connection
) {

    return new Promise(function (resolve) {

        if (
            connection.iceGatheringState ===
            "complete"
        ) {
            resolve();
            return;
        }


        function checkState() {

            if (
                connection.iceGatheringState ===
                "complete"
            ) {

                connection.removeEventListener(
                    "icegatheringstatechange",
                    checkState
                );

                resolve();
            }
        }


        connection.addEventListener(
            "icegatheringstatechange",
            checkState
        );


        // Safety timeout
        setTimeout(function () {

            connection.removeEventListener(
                "icegatheringstatechange",
                checkState
            );

            resolve();

        }, 10000);

    });
}


// ==========================================
// CREATE PEER CONNECTION
// ==========================================

function createPeerConnection(isViewer) {

    peerConnection =
        new RTCPeerConnection(
            configuration
        );


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
                            "Video playback waiting for user interaction",
                            error
                        );
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


    peerConnection.onicegatheringstatechange =
        function () {

            console.log(
                "ICE gathering:",
                peerConnection.iceGatheringState
            );
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


            setStatus(
                "Creating connection..."
            );


            createPeerConnection(false);


            const offer =
                await peerConnection.createOffer();


            await peerConnection.setLocalDescription(
                offer
            );


            setStatus(
                "Gathering connection information..."
            );


            await waitForIceGatheringComplete(
                peerConnection
            );


            const connectionCode =
                JSON.stringify(
                    peerConnection.localDescription
                );


            offerOutput.value =
                connectionCode;


            copyOfferButton.disabled =
                false;


            connectCameraButton.disabled =
                false;


            setStatus(
                "Connection code ready"
            );


        } catch (error) {

            console.error(error);

            setStatus(
                "Offer error: " +
                error.message
            );

            alert(
                "Could not create connection.\n\n" +
                error.message
            );
        }
    }
);


// ==========================================
// VIEWER — CREATE RESPONSE
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


            setStatus(
                "Connecting to camera..."
            );


            createPeerConnection(true);


            await peerConnection.setRemoteDescription(
                offer
            );


            const answer =
                await peerConnection.createAnswer();


            await peerConnection.setLocalDescription(
                answer
            );


            setStatus(
                "Creating viewer response..."
            );


            await waitForIceGatheringComplete(
                peerConnection
            );


            const response =
                JSON.stringify(
                    peerConnection.localDescription
                );


            answerOutput.value =
                response;


            copyAnswerButton.disabled =
                false;


            setStatus(
                "Viewer response ready"
            );


        } catch (error) {

            console.error(error);

            setStatus(
                "Viewer error: " +
                error.message
            );

            alert(
                "Could not connect to camera.\n\n" +
                error.message
            );
        }
    }
);


// ==========================================
// CAMERA — RECEIVE VIEWER RESPONSE
// ==========================================

connectCameraButton.addEventListener(
    "click",
    async function () {

        try {

            const answerText =
                answerInput.value.trim();


            if (!answerText) {

                alert(
                    "Paste the viewer response first."
                );

                return;
            }


            if (!peerConnection) {

                alert(
                    "Create the camera connection first."
                );

                return;
            }


            const answer =
                JSON.parse(answerText);


            await peerConnection.setRemoteDescription(
                answer
            );


            setStatus(
                "Connecting to viewer..."
            );


        } catch (error) {

            console.error(error);

            setStatus(
                "Connection error: " +
                error.message
            );

            alert(
                "Could not connect viewer.\n\n" +
                error.message
            );
        }
    }
);


// ==========================================
// COPY CAMERA CODE
// ==========================================

copyOfferButton.addEventListener(
    "click",
    async function () {

        try {

            await navigator.clipboard.writeText(
                offerOutput.value
            );

            setStatus(
                "Connection code copied"
            );

        } catch (error) {

            offerOutput.select();

            document.execCommand("copy");

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

            await navigator.clipboard.writeText(
                answerOutput.value
            );

            setStatus(
                "Viewer response copied"
            );

        } catch (error) {

            answerOutput.select();

            document.execCommand("copy");

            setStatus(
                "Viewer response copied"
            );
        }
    }
);


// ==========================================
// INITIAL STATE
// ==========================================

cameraSection.classList.remove("hidden");
viewerSection.classList.add("hidden");

createOfferButton.disabled = true;
copyOfferButton.disabled = true;
connectCameraButton.disabled = true;
copyAnswerButton.disabled = true;

setStatus("Ready");
