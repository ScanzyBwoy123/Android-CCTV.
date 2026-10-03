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

// ------------------------------------------
// ELEMENTS
// ------------------------------------------

const connectionStatus =
    document.getElementById("connectionStatus");

const cameraModeButton =
    document.getElementById("cameraModeButton");

const viewerModeButton =
    document.getElementById("viewerModeButton");

const cameraSection =
    document.getElementById("cameraSection");

const viewerSection =
    document.getElementById("viewerSection");

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


// ------------------------------------------
// STATUS
// ------------------------------------------

function setStatus(message) {

    if (connectionStatus) {
        connectionStatus.textContent = message;
    }

    console.log(message);
}


// ------------------------------------------
// MODE SWITCHING
// ------------------------------------------

function showCameraMode() {

    cameraSection.style.display = "block";
    viewerSection.style.display = "none";

    cameraModeButton.classList.add("active");
    viewerModeButton.classList.remove("active");

    setStatus("Camera mode");
}


function showViewerMode() {

    cameraSection.style.display = "none";
    viewerSection.style.display = "block";

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


// ------------------------------------------
// START CAMERA
// ------------------------------------------

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

            localVideo.srcObject =
                localStream;

            await localVideo.play();

            setStatus(
                "Camera started successfully"
            );

            createOfferButton.disabled = false;

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


// ------------------------------------------
// CREATE PEER CONNECTION
// ------------------------------------------

function createPeerConnection() {

    peerConnection =
        new RTCPeerConnection(
            configuration
        );


    // Send camera tracks
    if (localStream) {

        localStream
            .getTracks()
            .forEach(function (track) {

                peerConnection.addTrack(
                    track,
                    localStream
                );

            });

    }


    // ICE candidates
    peerConnection.onicecandidate =
        function (event) {

            if (!event.candidate) {

                if (
                    peerConnection.localDescription
                ) {

                    offerOutput.value =
                        JSON.stringify(
                            peerConnection.localDescription
                        );

                    setStatus(
                        "Offer ready"
                    );
                }
            }
        };


    peerConnection.onconnectionstatechange =
        function () {

            console.log(
                "Connection state:",
                peerConnection.connectionState
            );

            setStatus(
                "Connection: " +
                peerConnection.connectionState
            );
        };
}


// ------------------------------------------
// CAMERA: CREATE OFFER
// ------------------------------------------

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


            createPeerConnection();


            const offer =
                await peerConnection.createOffer();


            await peerConnection.setLocalDescription(
                offer
            );


            setStatus(
                "Creating connection offer..."
            );

        } catch (error) {

            console.error(error);

            setStatus(
                "Offer error: " +
                error.message
            );
        }
    }
);


// ------------------------------------------
// CAMERA: RECEIVE ANSWER
// ------------------------------------------

connectCameraButton.addEventListener(
    "click",
    async function () {

        try {

            if (!peerConnection) {

                alert(
                    "Create an offer first."
                );

                return;
            }


            const answerText =
                answerInput.value.trim();


            if (!answerText) {

                alert(
                    "Paste the viewer answer first."
                );

                return;
            }


            const answer =
                JSON.parse(answerText);


            await peerConnection.setRemoteDescription(
                answer
            );


            setStatus(
                "Connected to viewer"
            );

        } catch (error) {

            console.error(error);

            setStatus(
                "Answer error: " +
                error.message
            );

            alert(
                "Invalid answer.\n\n" +
                error.message
            );
        }
    }
);


// ------------------------------------------
// VIEWER: CREATE ANSWER
// ------------------------------------------

createAnswerButton.addEventListener(
    "click",
    async function () {

        try {

            const offerText =
                offerInput.value.trim();


            if (!offerText) {

                alert(
                    "Paste the camera offer first."
                );

                return;
            }


            const offer =
                JSON.parse(offerText);


            createPeerConnection();


            peerConnection.ontrack =
                function (event) {

                    console.log(
                        "Remote video received"
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
                                    "Autoplay blocked:",
                                    error
                                );

                            });

                    }
                };


            await peerConnection.setRemoteDescription(
                offer
            );


            const answer =
                await peerConnection.createAnswer();


            await peerConnection.setLocalDescription(
                answer
            );


            setStatus(
                "Creating viewer answer..."
            );

        } catch (error) {

            console.error(error);

            setStatus(
                "Viewer error: " +
                error.message
            );

            alert(
                "Unable to create answer.\n\n" +
                error.message
            );
        }
    }
);


// ------------------------------------------
// COPY OFFER
// ------------------------------------------

copyOfferButton.addEventListener(
    "click",
    async function () {

        try {

            await navigator.clipboard.writeText(
                offerOutput.value
            );

            setStatus(
                "Offer copied"
            );

        } catch (error) {

            console.error(error);

            alert(
                "Could not copy the offer."
            );
        }
    }
);


// ------------------------------------------
// COPY ANSWER
// ------------------------------------------

copyAnswerButton.addEventListener(
    "click",
    async function () {

        try {

            await navigator.clipboard.writeText(
                answerOutput.value
            );

            setStatus(
                "Answer copied"
            );

        } catch (error) {

            console.error(error);

            alert(
                "Could not copy the answer."
            );
        }
    }
);


// ------------------------------------------
// INITIAL STATE
// ------------------------------------------

if (cameraSection) {
    cameraSection.style.display = "block";
}

if (viewerSection) {
    viewerSection.style.display = "none";
}

if (createOfferButton) {
    createOfferButton.disabled = true;
}

setStatus("Ready");
