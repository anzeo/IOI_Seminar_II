import { InferenceSession } from 'onnxjs';

export async function loadModel() {
    const session = new InferenceSession();
    await session.loadModel('./onnx_model.onnx');
    console.log("Session loaded")
    return session;
}