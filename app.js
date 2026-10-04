let localStream = null;
let peerConnection = null;
let signalingChannel = null;
let signalingReady = null;

let currentCameraFacing = "environment";
let cameraAudioEnabled = true;

let connectedRemoteDeviceId = null;

const SUPABASE_URL =
    "https://vsdujfqygetvwgbfrjzj.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
    "sb_publishable_awDxxCnxSAoB0o5-nhKh7A_9bZ_aYRo";

const ROOM_ID =
    "android-cctv-demo";

const configuration = {
    iceServers: [
        {
            urls: "stun:stun.l.google.com:19302"
        }
    ]
};


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
            "CAM-" + randomPart;

        localStorage.setItem(
            "androidCctvCameraId",
            cameraId
        );
    }

    return cameraId;
}

const CAMERA_ID =
    getCameraId();


/* =========================================
   CAMERA PAIRING
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

const cameraIdDisplay =
    document.getElementById(
        "cameraIdDisplay"
    );


function getSavedCameraId() {

    return localStorage.getItem(
        "pairedCameraId"
    );
}


function saveCameraId(cameraId) {

    localStorage.setItem(
        "pairedCameraId",
        cameraId
    );
}


function displaySavedCamera() {

    if (!savedCameraContainer) {
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

                <p id="savedCameraStatus">
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

    const button =
        document.getElementById(
            "savedCameraConnectButton"
        );

    if (button) {

        button.addEventListener(
            "click",
            function () {

                if (createAnswerButton) {
                    createAnswerButton.click();
                }

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


/* =========================================
   HEARTBEAT
========================================= */

let cameraHeartbeatTimer = null;

let lastCameraHeartbeat = 0;

const CAMERA_HEARTBEAT_INTERVAL =
    5000;

const CAMERA_OFFLINE_TIMEOUT =
    15000;


/* =========================================
   SUPABASE
========================================= */

const supabaseClient =
    window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_PUBLISHABLE_KEY
    );
/* =========================================
   AUTHENTICATION GATE
   ========================================= */

let currentUser = null;

const authSection =
    document.getElementById("authSection");

const signInForm =
    document.getElementById("signInForm");

const signUpForm =
    document.getElementById("signUpForm");

const protectedApp =
    document.getElementById("protectedApp");


function showLoggedOutState() {

    currentUser = null;

    /* Show authentication */

    if (authSection) {
        authSection.style.display = "flex";
    }

    /* Hide the entire CCTV application */

    if (protectedApp) {
        protectedApp.style.display = "none";
    }
}


function showLoggedInState(user) {

    currentUser = user;

    /* Hide authentication */

    if (authSection) {
        authSection.style.display = "none";
    }

    /* Show the entire CCTV application */

    if (protectedApp) {
        protectedApp.style.display = "";
    }
}


/* =========================================
   CHECK CURRENT LOGIN SESSION
   ========================================= */

async function checkAuthentication() {

    try {

        const {
            data,
            error
        } =
        await supabaseClient.auth.getSession();

        if (error) {

            console.error(
                "Authentication check failed:",
                error
            );

            showLoggedOutState();

            return;
        }

        if (data.session) {

            showLoggedInState(
                data.session.user
            );

        } else {

            showLoggedOutState();

        }

    } catch (error) {

        console.error(
            "Authentication error:",
            error
        );

        showLoggedOutState();
    }
}


/* =========================================
   LISTEN FOR LOGIN / LOGOUT
   ========================================= */

supabaseClient.auth.onAuthStateChange(
    function (event, session) {

        if (session) {

            showLoggedInState(
                session.user
            );

        } else {

            showLoggedOutState();

        }

    }
);


/* =========================================
   START AUTHENTICATION CHECK
   ========================================= */

checkAuthentication();
/* =========================================
   AUTHENTICATION FORM SWITCHING
   ========================================= */

const showSignUpButton =
    document.getElementById("showSignUpButton");

const showSignInButton =
    document.getElementById("showSignInButton");


if (showSignUpButton) {

    showSignUpButton.addEventListener(
        "click",
        function () {

            if (signInForm) {
                signInForm.classList.add("hidden");
            }

            if (signUpForm) {
                signUpForm.classList.remove("hidden");
            }

        }
    );

}


if (showSignInButton) {

    showSignInButton.addEventListener(
        "click",
        function () {

            if (signUpForm) {
                signUpForm.classList.add("hidden");
            }

            if (signInForm) {
                signInForm.classList.remove("hidden");
            }

        }
    );

}


/* =========================================
   CREATE ACCOUNT
   ========================================= */

const signUpButton =
    document.getElementById("signUpButton");

const signUpEmail =
    document.getElementById("signUpEmail");

const signUpPassword =
    document.getElementById("signUpPassword");

const signUpConfirmPassword =
    document.getElementById(
        "signUpConfirmPassword"
    );

const signUpMessage =
    document.getElementById("signUpMessage");


if (signUpButton) {

    signUpButton.addEventListener(
        "click",
        async function () {

            const email =
                signUpEmail.value.trim();

            const password =
                signUpPassword.value;

            const confirmPassword =
                signUpConfirmPassword.value;


            /* Validate email */

            if (!email) {

                signUpMessage.textContent =
                    "Please enter your email address.";

                return;
            }


            /* Validate password */

            if (!password) {

                signUpMessage.textContent =
                    "Please create a password.";

                return;
            }


            /* Password length */

            if (password.length < 6) {

                signUpMessage.textContent =
                    "Password must be at least 6 characters.";

                return;
            }


            /* Confirm password */

            if (password !== confirmPassword) {

                signUpMessage.textContent =
                    "Passwords do not match.";

                return;
            }


            signUpButton.disabled = true;

            signUpButton.textContent =
                "Creating Account...";

            signUpMessage.textContent =
                "Creating your account...";


            try {

                const {
                    data,
                    error
                } =
                await supabaseClient.auth.signUp({
                    email: email,
                    password: password
                });


                if (error) {

                    signUpMessage.textContent =
                        error.message;

                    return;
                }


                /*
                 * Account created successfully.
                 */

                if (data.user) {

                    signUpMessage.textContent =
                        "Account created successfully! You can now sign in.";

                    signUpEmail.value = "";
                    signUpPassword.value = "";
                    signUpConfirmPassword.value = "";

                }


            } catch (error) {

                console.error(
                    "Sign up error:",
                    error
                );

                signUpMessage.textContent =
                    "Unable to create account. Please try again.";

            } finally {

                signUpButton.disabled = false;

                signUpButton.textContent =
                    "Create Account";

            }

        }
    );

}
/* =========================================
   SIGN IN
========================================= */

const signInButton =
    document.getElementById(
        "signInButton"
    );

const authEmail =
    document.getElementById(
        "authEmail"
    );

const authPassword =
    document.getElementById(
        "authPassword"
    );

const authMessage =
    document.getElementById(
        "authMessage"
    );


if (signInButton) {

    signInButton.addEventListener(
        "click",
        async function () {

            const email =
                authEmail.value.trim();

            const password =
                authPassword.value;


            /* Validate email */

            if (!email) {

                authMessage.textContent =
                    "Please enter your email address.";

                return;
            }


            /* Validate password */

            if (!password) {

                authMessage.textContent =
                    "Please enter your password.";

                return;
            }


            signInButton.disabled = true;

            signInButton.textContent =
                "Signing In...";

            authMessage.textContent =
                "Checking your account...";


            try {

                const {
                    data,
                    error
                } =
                await supabaseClient.auth.signInWithPassword({
                    email: email,
                    password: password
                });


                if (error) {

                    console.error(
                        "Sign in error:",
                        error
                    );

                    authMessage.textContent =
                        error.message;

                    return;
                }


                if (data.session) {

                    authMessage.textContent =
                        "Login successful.";

                    /*
                     * The existing auth listener
                     * will show the CCTV application.
                     */

                    showLoggedInState(
    data.session.user
);

await registerCameraWithSupabase();

                }


            } catch (error) {

                console.error(
                    "Sign in error:",
                    error
                );

                authMessage.textContent =
                    "Unable to sign in. Please try again.";

            } finally {

                signInButton.disabled = false;

                signInButton.textContent =
                    "Sign In";

            }

        }
    );

}
/* =========================================
   SIGN OUT
   ========================================= */

const logoutButton =
    document.getElementById(
        "logoutButton"
    );


if (logoutButton) {

    logoutButton.addEventListener(
        "click",
        async function () {

            logoutButton.disabled = true;
            logoutButton.textContent =
                "Logging Out...";

            try {

                const {
                    error
                } =
                await supabaseClient.auth.signOut();

                if (error) {

                    console.error(
                        "Sign out error:",
                        error
                    );

                    logoutButton.disabled = false;
                    logoutButton.textContent =
                        "Log Out";

                    return;
                }

                console.log(
                    "User signed out successfully."
                );

            } catch (error) {

                console.error(
                    "Sign out error:",
                    error
                );

                logoutButton.disabled = false;
                logoutButton.textContent =
                    "Log Out";
            }

        }
    );

}

/* =========================================
   DOM
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

    console.log(
        "[STATUS]",
        message
    );
}


function setViewerStatus(message) {

    if (viewerStatusMessage) {

        viewerStatusMessage.textContent =
            message;
    }

    console.log(
        "[VIEWER]",
        message
    );
}


/* =========================================
   CAMERA STATUS
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
   REGISTER CAMERA WITH SUPABASE
========================================= */

async function registerCameraWithSupabase() {

    if (!currentUser) {
        console.log(
            "Camera registration skipped: user not logged in."
        );
        return;
    }

    try {

        const {
            data,
            error
        } =
        await supabaseClient
            .from("cameras")
         .insert({
    user_id: currentUser.id,
    camera_id: CAMERA_ID,
    name: "Android Camera"
})
            .select()
            .single();


        if (error) {

    console.error(
        "Camera registration failed:",
        error
    );

    alert(
        "Camera registration failed:\n\n" +
        error.message
    );

    return;
}


        console.log(
            "Camera registered with Supabase:",
            data
        );

    } catch (error) {

        console.error(
            "Camera registration error:",
            error
        );

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

registerCameraWithSupabase();

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


if (cameraModeButton) {

    cameraModeButton.addEventListener(
        "click",
        showCameraMode
    );
}


if (viewerModeButton) {

    viewerModeButton.addEventListener(
        "click",
        showViewerMode
    );
}


/* =========================================
   SUPABASE SIGNALING
========================================= */

async function connectToSignalingServer() {

    if (signalingChannel) {

        if (signalingReady) {
            await signalingReady;
        }

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
                    "[SIGNAL RECEIVED]",
                    data
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

                    await handleCameraRequest(
                        data
                    );

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
                    "Signal processing error:",
                    error
                );
            }

        }
    );


    signalingReady =
        new Promise(
            function (resolve) {

                signalingChannel.subscribe(
                    function (
                        status,
                        error
                    ) {

                        console.log(
                            "[SUPABASE]",
                            status
                        );


                        if (
                            status ===
                            "SUBSCRIBED"
                        ) {

                            setStatus(
                                "Online"
                            );

                            resolve();

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

                            resolve();

                            return;
                        }


                        if (
                            status ===
                            "TIMED_OUT"
                        ) {

                            setStatus(
                                "Connection timed out"
                            );

                            resolve();

                            return;
                        }


                        if (
                            status ===
                            "CLOSED"
                        ) {

                            signalingChannel =
                                null;

                            signalingReady =
                                null;

                            setStatus(
                                "Offline"
                            );

                            resolve();
                        }

                    }
                );

            }
        );


    await signalingReady;
}


/* =========================================
   SEND SIGNAL
========================================= */

async function sendSignalingMessage(
    message
) {

    await connectToSignalingServer();

    if (!signalingChannel) {

        throw new Error(
            "Signaling channel is not connected."
        );
    }


    const payload = {
        ...message,
        cameraId: CAMERA_ID
    };


    console.log(
        "[SIGNAL SENT]",
        payload
    );


    await signalingChannel.send({

        type:
            "broadcast",

        event:
            "signal",

        payload:
            payload

    });
}


/* =========================================
   CAMERA PRESENCE
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

    if (!localStream) {
        return;
    }

    try {

        await sendSignalingMessage({

            type:
                "camera-presence",

            online:
                true,

            timestamp:
                Date.now()

        });

    } catch (error) {

        console.error(
            "Presence error:",
            error
        );
    }
}


function handleCameraPresence(
    data
) {

    const selectedCameraId =
        getSavedCameraId();


    if (
        selectedCameraId &&
        data.cameraId !==
            selectedCameraId
    ) {

        return;
    }


    if (
        data.online !== true
    ) {

        return;
    }


    lastCameraHeartbeat =
        Date.now();


    const savedCameraStatus =
        document.getElementById(
            "savedCameraStatus"
        );


    if (savedCameraStatus) {

        savedCameraStatus.textContent =
            "🟢 Online";
    }


    if (cameraOnlineStatus) {

        cameraOnlineStatus.textContent =
            "🟢 Online";
    }
}


function checkCameraOffline() {

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

        const savedCameraStatus =
            document.getElementById(
                "savedCameraStatus"
            );


        if (savedCameraStatus) {

            savedCameraStatus.textContent =
                "🔴 Offline";
        }


        if (cameraOnlineStatus) {

            cameraOnlineStatus.textContent =
                "🔴 Offline";
        }
    }
}


setInterval(
    checkCameraOffline,
    5000
);


/* =========================================
   CAMERA CONTROLS
========================================= */

function createCameraControls() {

    if (!cameraControlContainer) {
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


    document
        .getElementById(
            "cameraStopButton"
        )
        .addEventListener(
            "click",
            stopCamera
        );


    document
        .getElementById(
            "cameraFrontButton"
        )
        .addEventListener(
            "click",
            function () {

                switchCamera(
                    "user"
                );

            }
        );


    document
        .getElementById(
            "cameraRearButton"
        )
        .addEventListener(
            "click",
            function () {

                switchCamera(
                    "environment"
                );

            }
        );


    document
        .getElementById(
            "cameraMuteButton"
        )
        .addEventListener(
            "click",
            function () {

                cameraAudioEnabled =
                    !cameraAudioEnabled;

                setCameraAudio(
                    cameraAudioEnabled
                );

            }
        );
}


/* =========================================
   VIEWER CONTROLS
========================================= */

function createViewerControls() {

    if (!viewerControlContainer) {
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


    document
        .getElementById(
            "viewerFrontButton"
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
            "viewerRearButton"
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
                    !remoteVideo ||
                    !remoteVideo.srcObject
                ) {
                    return;
                }


                remoteVideo
                    .srcObject
                    .getAudioTracks()
                    .forEach(
                        function (track) {

                            track.enabled =
                                !track.enabled;

                        }
                    );

            }
        );


    document
        .getElementById(
            "viewerStopButton"
        )
        .addEventListener(
            "click",
            disconnectViewer
        );
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


        await connectToSignalingServer();


        setStatus(
            "Camera online"
        );

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


if (startCameraButton) {

    startCameraButton.addEventListener(
        "click",
        startCamera
    );
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


    if (localVideo) {

        localVideo.srcObject =
            null;
    }


    if (peerConnection) {

        peerConnection.close();

        peerConnection =
            null;
    }


    connectedRemoteDeviceId =
        null;


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
   VIEWER REQUEST
========================================= */

async function requestCamera() {

    const selectedCameraId =
        getSavedCameraId();


    if (!selectedCameraId) {

        setViewerStatus(
            "Please add a camera first."
        );

        return;
    }


    setViewerStatus(
        "Requesting camera..."
    );


    connectedRemoteDeviceId =
        selectedCameraId;


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
}


if (createAnswerButton) {

    createAnswerButton.addEventListener(
        "click",
        function () {

            requestCamera();

        }
    );
}


/* =========================================
   CAMERA RECEIVES REQUEST
========================================= */

async function handleCameraRequest(
    data
) {

    console.log(
        "[CAMERA REQUEST]",
        data
    );


    if (
        cameraSection.classList.contains(
            "hidden"
        )
    ) {

        return;
    }


    if (
        data.targetCameraId !==
        CAMERA_ID
    ) {

        return;
    }


    connectedRemoteDeviceId =
        data.cameraId;


    console.log(
        "Request matched camera:",
        CAMERA_ID
    );


    if (!localStream) {

        setStatus(
            "Viewer requested camera — start camera"
        );

        return;
    }


    await createCameraOffer();
}


/* =========================================
   CREATE CAMERA OFFER
========================================= */

async function createCameraOffer() {

    if (!localStream) {
        return;
    }


    if (!connectedRemoteDeviceId) {

        console.error(
            "No viewer ID available."
        );

        return;
    }


    if (peerConnection) {

        peerConnection.close();
    }


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

        targetDeviceId:
            connectedRemoteDeviceId

    });


    setStatus(
        "Offer sent to viewer"
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
                        function () {}
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
                !event.candidate ||
                !connectedRemoteDeviceId
            ) {

                return;
            }


            sendSignalingMessage({

                type:
                    "candidate",

                candidate:
                    event.candidate,

                targetDeviceId:
                    connectedRemoteDeviceId

            });

        };


    peerConnection.onconnectionstatechange =
        function () {

            if (!peerConnection) {
                return;
            }


            const state =
                peerConnection.connectionState;


            console.log(
                "[WEBRTC]",
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


            if (
                state ===
                "failed"
            ) {

                setViewerStatus(
                    "Video connection failed"
                );
            }


            if (
                state ===
                "disconnected"
            ) {

                setViewerStatus(
                    "Video connection interrupted"
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


    const selectedCameraId =
        getSavedCameraId();


    if (
        message.cameraId !==
        selectedCameraId
    ) {

        return;
    }


    connectedRemoteDeviceId =
        message.cameraId;


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

            targetDeviceId:
                selectedCameraId

        });


        setViewerStatus(
            "Connecting video..."
        );

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

    if (
        cameraSection.classList.contains(
            "hidden"
        )
    ) {

        return;
    }


    if (
        message.targetDeviceId !==
        CAMERA_ID
    ) {

        return;
    }


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

    if (
        !peerConnection ||
        !message.candidate
    ) {

        return;
    }


    if (
        message.targetDeviceId !==
        CAMERA_ID &&
        message.targetDeviceId !==
            connectedRemoteDeviceId
    ) {

        return;
    }


    try {

        await peerConnection.addIceCandidate(
            message.candidate
        );

    } catch (error) {

        console.error(
            "ICE error:",
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

    const selectedCameraId =
        getSavedCameraId();


    if (!selectedCameraId) {
        return;
    }


    await sendSignalingMessage({

        type:
            "camera-command",

        command:
            command,

        options:
            options,

        targetCameraId:
            selectedCameraId

    });
}


async function handleCameraCommand(
    data
) {

    if (
        cameraSection.classList.contains(
            "hidden"
        )
    ) {

        return;
    }


    if (
        data.targetCameraId !==
        CAMERA_ID
    ) {

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
   DISCONNECT VIEWER
========================================= */

function disconnectViewer() {

    if (peerConnection) {

        peerConnection.close();

        peerConnection =
            null;
    }


    connectedRemoteDeviceId =
        null;


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

if (cameraSection) {

    cameraSection.classList.remove(
        "hidden"
    );
}


if (viewerSection) {

    viewerSection.classList.add(
        "hidden"
    );
}


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


connectToSignalingServer();
