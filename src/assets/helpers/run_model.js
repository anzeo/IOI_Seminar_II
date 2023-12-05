import {InferenceSession} from 'onnxjs';

export async function loadModel() {
    const session = new InferenceSession();
    const hand_landmark_model = localStorage.getItem('hand_landmark_model');
    if (hand_landmark_model) {
        await session.loadModel(b64toBlob(hand_landmark_model))
        console.log("loaded local storage model")
    } else {
        // Use static model if the one in local storage is not available, so the app doesn't stop working
        // !!! The model MUST BE located in ~/public directory, next to index.html !!!
        await session.loadModel('./onnx_model.onnx');
        console.log("loaded static model")
    }
    console.log("Session loaded")
    return session;
}

function b64toBlob(dataURI) {

    let byteString = atob(dataURI.split(',')[1]);
    let ab = new ArrayBuffer(byteString.length);
    let ia = new Uint8Array(ab);

    for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
    }
    return new Blob([ab]);
}