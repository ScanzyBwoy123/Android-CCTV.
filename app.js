let localStream = null;
let peerConnection = null;
let signalingChannel = null;

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
   SUPABASE REALTIME SIGNALING
========================================= */

async function connectToSignalingServer() {

    if (signalingChannel) {

        console.log(
            "Supabase signaling already connected"
        );

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
                    "Supabase signal received:",
                    data.type
                );


                if (data.type === "offer") {

                    await handleIncomingOffer(
                        data
                    );

                    return;
                }


                if (data.type === "answer") {

                    await handleIncomingAnswer(
                        data
                    );

                    return;
                }


                if (data.type === "candidate") {

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


            if (status === "SUBSCRIBED") {

                setStatus(
                    "Signaling server connected"
                );

                console.log(
                    "Supabase Realtime connected"
                );

                return;
            }


            if (
                status === "CHANNEL_ERROR"
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
                status === "TIMED_OUT"
            ) {

                console.error(
                    "Supabase channel timed out"
                );

                setStatus(
                    "Supabase connection timed out"
                );

                return;
            }


            if (
                status === "CLOSED"
            ) {

                console.log(
                    "Supabase channel closed"
                );

                setStatus(
                    "Supabase signaling disconnected"
                );

                signalingChannel = null;
            }
        }
    );
}


/* =========================================
   SEND SIGNALING MESSAGE
========================================= */

async function sendSignalingMessage(
    message
) {

    if (!signalingChannel) {

        console.log(
            "Supabase channel is not connected"
        );

        return;
    }


    try {

        const result =
            await signalingChannel.send({

                type: "broadcast",

                event: "signal",

                payload: message

            });


        console.log(
            "Sent Supabase signal:",
            message.type,
            result
        );

    } catch (error) {

        console.error(
            "Supabase send error:",
            error
        );
    }
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
                "WebRTC connection state:",
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
                await navigator.mediaDevices
                    .getUserMedia({

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


            if (!signalingChannel) {

                setStatus(
                    "Waiting for signaling connection..."
                );

                await connectToSignalingServer();

                await new Promise(
                    function (resolve) {

                        const check =
                            setInterval(
                                function () {

                                    if (
                                        signalingChannel
                                    ) {

                                        clearInterval(
                                            check
                                        );

                                        resolve();
                                    }

                                },
                                200
                            );

                    }
                );
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


            await sendSignalingMessage({

                type: "offer",

                offer:
                    peerConnection.localDescription

            });


            offerOutput.value =
                "Camera connection sent automatically";


            setStatus(
                "Camera connection sent"
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

async function handleIncomingOffer(
    message
) {

    try {

        if (
            viewerSection.classList.contains(
                "hidden"
            )
        ) {

            console.log(
                "Offer received but this device is not in Viewer mode"
            );

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


        await sendSignalingMessage({

            type: "answer",

            answer:
                peerConnection.localDescription

        });


        answerOutput.value =
            "Viewer response sent automatically";


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

setStatus(
    "Ready"
);


/* =========================================
   CONNECT TO SUPABASE
========================================= */

connectToSignalingServer();
