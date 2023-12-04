import { InferenceSession } from 'onnxjs';

export async function loadModel() {
    const session = new InferenceSession();
    await session.loadModel('./onnx_model.onnx');   // !!! The model MUST BE in ~/public directory, next to index.html !!!
    console.log("Session loaded")
    return session;
}