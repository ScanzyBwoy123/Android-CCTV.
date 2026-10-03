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
   SUPABASE REALTIME
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
                    "Signal received:",
                    data.type
                );


                /* CAMERA RECEIVES VIEWER REQUEST */

                if (
                    data.type ===
                    "request-camera"
                ) {

                    await handleCameraRequest();

                    return;
                }


                /* VIEWER RECEIVES CAMERA OFFER */

                if (
                    data.type ===
                    "offer"
                ) {

                    await handleIncomingOffer(
                        data
                    );

                    return;
                }


                /* CAMERA RECEIVES VIEWER ANSWER */

                if (
                    data.type ===
                    "answer"
                ) {

                    await handleIncomingAnswer(
                        data
                    );

                    return;
                }


                /* BOTH DEVICES RECEIVE ICE */

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

        console.log(
            "Supabase channel unavailable"
        );

        return;
    }


    try {

        await signalingChannel.send({

            type: "broadcast",

            event: "signal",

            payload: message

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
            .forEach(function (track) {

                peerConnection.addTrack(
                    track,
                    localStream
                );
            });
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
                    .catch(function (error) {

                        console.log(
                            "Video playback waiting:",
                            error
                        );
                    });
            }
        };


    /*
       ICE CANDIDATES
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
   START CAMERA
========================================= */

startCameraButton.addEventListener(
    "click",
    async function () {

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
                                ideal:
                                    "environment"
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
);


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
   CAMERA RECEIVES REQUEST
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


        /*
           If camera has not been started,
           the browser cannot silently request
           camera permission.
        */

        if (!localStream) {

            setStatus(
                "Viewer requested camera — start camera"
            );


            alert(
                "A viewer is requesting this camera.\n\n" +
                "Tap Start Camera to allow the camera."
            );


            return;
        }


        if (peerConnection) {

            peerConnection.close();
        }


        setStatus(
            "Viewer detected. Creating connection..."
        );


        createPeerConnection(false);


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


        await handleCameraRequest();
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

            return;
        }


        if (peerConnection) {

            peerConnection.close();
        }


        setStatus(
            "Camera found. Connecting video..."
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
   OLD MANUAL CAMERA BUTTON
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

setStatus(
    "Ready"
);


/* =========================================
   CONNECT TO SUPABASE
========================================= */

connectToSignalingServer();
