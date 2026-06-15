let session;

// Load model once on page load
async function loadModel() {
    try {
        session = await ort.InferenceSession.create("./cnn_model_inline.onnx");
        console.log("Model loaded");
    } catch (error) {
        console.error("Error loading model:", error);
    }
}

document.addEventListener('DOMContentLoaded', loadModel);

const classes = ['airplane', 'alarm clock', 'angel', 'ant', 'apple', 'arm', 'armchair', 'ashtray', 'axe', 'backpack', 'banana', 'barn', 'baseball bat', 'basket', 'bathtub', 'bear (animal)', 'bed', 'bee', 'beer-mug', 'bell', 'bench', 'bicycle', 'binoculars', 'blimp', 'book', 'bookshelf', 'boomerang', 'bottle opener', 'bowl', 'brain', 'bread', 'bridge', 'bulldozer', 'bus', 'bush', 'butterfly', 'cabinet', 'cactus', 'cake', 'calculator', 'camel', 'camera', 'candle', 'cannon', 'canoe', 'car (sedan)', 'carrot', 'castle', 'cat', 'cell phone', 'chair', 'chandelier', 'church', 'cigarette', 'cloud', 'comb', 'computer monitor', 'computer-mouse', 'couch', 'cow', 'crab', 'crane (machine)', 'crocodile', 'crown', 'cup', 'diamond', 'dog', 'dolphin', 'donut', 'door', 'door handle', 'dragon', 'duck', 'ear', 'elephant', 'envelope', 'eye', 'eyeglasses', 'face', 'fan', 'feather', 'fire hydrant', 'fish', 'flashlight', 'floor lamp', 'flower with stem', 'flying bird', 'flying saucer', 'foot', 'fork', 'frog', 'frying-pan', 'giraffe', 'grapes', 'grenade', 'guitar', 'hamburger', 'hammer', 'hand', 'harp', 'hat', 'head', 'head-phones', 'hedgehog', 'helicopter', 'helmet', 'horse', 'hot air balloon', 'hot-dog', 'hourglass', 'house', 'human-skeleton', 'ice-cream-cone', 'ipod', 'kangaroo', 'key', 'keyboard', 'knife', 'ladder', 'laptop', 'leaf', 'lightbulb', 'lighter', 'lion', 'lobster', 'loudspeaker', 'mailbox', 'megaphone', 'mermaid', 'microphone', 'microscope', 'monkey', 'moon', 'mosquito', 'motorbike', 'mouse (animal)', 'mouth', 'mug', 'mushroom', 'nose', 'octopus', 'owl', 'palm tree', 'panda', 'paper clip', 'parachute', 'parking meter', 'parrot', 'pear', 'pen', 'penguin', 'person sitting', 'person walking', 'piano', 'pickup truck', 'pig', 'pigeon', 'pineapple', 'pipe (for smoking)', 'pizza', 'potted plant', 'power outlet', 'present', 'pretzel', 'pumpkin', 'purse', 'rabbit', 'race car', 'radio', 'rainbow', 'revolver', 'rifle', 'rollerblades', 'rooster', 'sailboat', 'santa claus', 'satellite', 'satellite dish', 'saxophone', 'scissors', 'scorpion', 'screwdriver', 'sea turtle', 'seagull', 'shark', 'sheep', 'ship', 'shoe', 'shovel', 'skateboard', 'skull', 'skyscraper', 'snail', 'snake', 'snowboard', 'snowman', 'socks', 'space shuttle', 'speed-boat', 'spider', 'sponge bob', 'spoon', 'squirrel', 'standing bird', 'stapler', 'strawberry', 'streetlight', 'submarine', 'suitcase', 'sun', 'suv', 'swan', 'sword', 'syringe', 't-shirt', 'table', 'tablelamp', 'teacup', 'teapot', 'teddy-bear', 'telephone', 'tennis-racket', 'tent', 'tiger', 'tire', 'toilet', 'tomato', 'tooth', 'toothbrush', 'tractor', 'traffic light', 'train', 'tree', 'trombone', 'trousers', 'truck', 'trumpet', 'tv', 'umbrella', 'van', 'vase', 'violin', 'walkie talkie', 'wheel', 'wheelbarrow', 'windmill', 'wine-bottle', 'wineglass', 'wrist-watch', 'zebra'];


document.addEventListener('keydown', (event) => {
    
});

const canvas = document.getElementById('drawCanvas');
const ctx = canvas.getContext('2d');
const colorPicker = document.getElementById('colorPicker');
const brushSizeEl = document.getElementById('brushSize');
const sizeOut = document.getElementById('sizeOut');
const opacitySlider = document.getElementById('opacitySlider');
const opacityOut = document.getElementById('opacityOut');
const coordLabel = document.getElementById('coordLabel');
const toolLabel = document.getElementById('toolLabel');

const canvasSize = 400;
const inputImageSize = 128;

function resize() {
    const wrap = canvas.parentElement;
    const W = canvasSize;
    const H = canvasSize;
    const saved = ctx.getImageData(0, 0, canvas.width, canvas.height);
    canvas.width = W;
    canvas.height = H;
    wrap.style.width = W + 'px';
    wrap.style.height = H + 'px';
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, W, H);
    ctx.putImageData(saved, 0, 0);
}

resize();
window.addEventListener('resize', resize);

let tool = 'brush';
let drawing = false;
let lastX = 0, lastY = 0;
let startX = 0, startY = 0;
let undoStack = [];
let redoStack = [];
let snapshot = null;

function saveState() {
    undoStack.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
    if (undoStack.length > 40) undoStack.shift();
    redoStack = [];
}

function undo() {
    if (!undoStack.length) return;
    redoStack.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
    ctx.putImageData(undoStack.pop(), 0, 0);
}

function redo() {
    if (!redoStack.length) return;
    undoStack.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
    ctx.putImageData(redoStack.pop(), 0, 0);
}

// Keyboard shortcuts
document.addEventListener('keydown', e => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'z') { e.preventDefault(); e.shiftKey ? redo() : undo(); }
    if ((e.ctrlKey || e.metaKey) && e.key === 'y') { e.preventDefault(); redo(); }
    const map = { b:'brush', e:'eraser', l:'line', r:'rect', c:'circle', f:'fill' };
    if (!e.ctrlKey && !e.metaKey && map[e.key]) setTool(map[e.key]);
});

function setTool(t) {
    tool = t;
    document.querySelectorAll('.tool-btn').forEach(b => b.classList.remove('active'));
    const btn = document.getElementById('btn-' + t);
    if (btn) btn.classList.add('active');
    toolLabel.textContent = 'Tool: ' + t;
    canvas.style.cursor = (t === 'fill') ? 'cell' : (t === 'eraser') ? 'cell' : 'crosshair';
}

const swatchColors = ['#2c2c2a','#888780','#e24b4a','#378add','#1d9e75','#ef9f27','#d4537e','#534ab7','#ffffff'];
const swatchRow = document.getElementById('swatchRow');
swatchColors.forEach((c, i) => {
    const s = document.createElement('div');
    s.className = 'swatch' + (i === 0 ? ' active' : '');
    s.style.background = c;
    if (c === '#ffffff') s.style.border = '1.5px solid #ccc';
    s.title = c;
    s.onclick = () => {
    colorPicker.value = c;
    document.querySelectorAll('.swatch').forEach(el => el.classList.remove('active'));
    s.classList.add('active');
    };
    swatchRow.appendChild(s);
});

colorPicker.addEventListener('input', () => {
    document.querySelectorAll('.swatch').forEach(el => el.classList.remove('active'));
});

brushSizeEl.addEventListener('input', () => { sizeOut.textContent = brushSizeEl.value + 'px'; });
opacitySlider.addEventListener('input', () => { opacityOut.textContent = opacitySlider.value + '%'; });

function getPos(e) {
    const r = canvas.getBoundingClientRect();
    const sx = canvas.width / r.width;
    const sy = canvas.height / r.height;
    const src = e.touches ? e.touches[0] : e;
    return [Math.round((src.clientX - r.left) * sx), Math.round((src.clientY - r.top) * sy)];
}

function applyCtxStyle() {
    ctx.lineWidth = parseInt(brushSizeEl.value);
    ctx.globalAlpha = parseInt(opacitySlider.value) / 100;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
}

function hexToRgb(hex) {
    const r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return r ? { r: parseInt(r[1],16), g: parseInt(r[2],16), b: parseInt(r[3],16) } : null;
}

function onStart(e) {
    e.preventDefault();
    const [x, y] = getPos(e);
    if (tool === 'fill') {
    saveState();
    floodFill(x, y, colorPicker.value);
    return;
    }
    saveState();
    drawing = true;
    [startX, startY] = [x, y];
    [lastX, lastY] = [x, y];

    if (tool === 'brush' || tool === 'eraser') {
    applyCtxStyle();
    ctx.strokeStyle = tool === 'eraser' ? '#ffffff' : colorPicker.value;
    ctx.fillStyle = tool === 'eraser' ? '#ffffff' : colorPicker.value;
    ctx.beginPath();
    ctx.arc(x, y, parseInt(brushSizeEl.value) / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
    } else {
    snapshot = ctx.getImageData(0, 0, canvas.width, canvas.height);
    }
}

function onMove(e) {
    e.preventDefault();
    const [x, y] = getPos(e);
    coordLabel.textContent = 'x: ' + x + ', y: ' + y;
    if (!drawing) return;

    if (tool === 'brush' || tool === 'eraser') {
    applyCtxStyle();
    ctx.strokeStyle = tool === 'eraser' ? '#ffffff' : colorPicker.value;
    ctx.beginPath();
    ctx.moveTo(lastX, lastY);
    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.globalAlpha = 1;
    [lastX, lastY] = [x, y];
    } else {
    ctx.putImageData(snapshot, 0, 0);
    ctx.globalAlpha = parseInt(opacitySlider.value) / 100;
    ctx.strokeStyle = colorPicker.value;
    ctx.lineWidth = parseInt(brushSizeEl.value);
    ctx.lineCap = 'round';
    ctx.beginPath();

    if (tool === 'line') {
        ctx.moveTo(startX, startY);
        ctx.lineTo(x, y);
        ctx.stroke();
    } else if (tool === 'rect') {
        ctx.strokeRect(startX, startY, x - startX, y - startY);
    } else if (tool === 'circle') {
        const rx = Math.abs(x - startX) / 2;
        const ry = Math.abs(y - startY) / 2;
        const cx = startX + (x - startX) / 2;
        const cy = startY + (y - startY) / 2;
        ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
        ctx.stroke();
    }
    ctx.globalAlpha = 1;
    }
}

function onEnd(e) {
    if (!drawing) return;
    drawing = false;
    snapshot = null;
    predict();
}

function clearCanvas() {
    saveState();
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function getCanvas() {
    const ctx = canvas.getContext('2d');

    // redraw canvas on a temporary canvas to ensure correct dimensions
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = inputImageSize;
    tempCanvas.height = inputImageSize;
    const tempCtx = tempCanvas.getContext('2d');
    tempCtx.fillStyle = '#ffffff';
    tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
    tempCtx.drawImage(canvas, 0, 0, inputImageSize, inputImageSize);

    const {data, width, height} = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);

    // resize and normalize image
    const tensor = new Float32Array(1 * inputImageSize * inputImageSize);

    for (let x = 0; x < inputImageSize * inputImageSize; x++) {
        const r = data[x * 4]; 
        const g = data[x * 4 + 1];
        const b = data[x * 4 + 2];

        const gray = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
        tensor[x] = (gray - 0.5) / 0.5;
    }
    return new ort.Tensor('float32', tensor, [1, 1, inputImageSize, inputImageSize]);
}

function displayTensor(tensor, width, height, canvasId) {
    const displayCanvas = document.getElementById(canvasId);
    displayCanvas.width = width;
    displayCanvas.height = height;
    const ctx = displayCanvas.getContext("2d");
    const imageData = ctx.createImageData(width, height);
    const data = tensor.data;

    for (let i = 0; i < height * width; i++) {
        const val = Math.round(Math.min(Math.max(data[i], 0), 1) * 255);
        imageData.data[i * 4]     = val;  // R
        imageData.data[i * 4 + 1] = val;  // G
        imageData.data[i * 4 + 2] = val;  // B
        imageData.data[i * 4 + 3] = 255;  // A
    }

    ctx.putImageData(imageData, 0, 0);
}

async function predict() {
    const inputTensor = getCanvas();
    displayTensor(inputTensor, inputImageSize, inputImageSize, 'previewCanvas');
    const input = { input: inputTensor };
    const results = await session.run(input);
    const outputTensor = results.output.data;


    // apply softmax
    const raw = Array.from(outputTensor);
    const maxes = Math.max(...raw);
    const exps = raw.map(v => Math.exp(v - maxes));
    const sums = exps.reduce((a, b) => a + b, 0);
    const softmax = exps.map(v => v / sums);

    const predictedClasses = softmax
                            .map((v, i) => ({ class: classes[i], prob: v }))
                            .sort((a, b) => b.prob - a.prob)
                            .slice(0, 20);
    const predictionList = document.getElementById('predictionList');
    const maxProb = predictedClasses[0].prob;
    predictionList.innerHTML = '';
    predictedClasses.forEach(item => {
        const el = document.createElement('h4');
        el.textContent = `${item.class}: ${(item.prob * 100).toFixed(2)}%`;
        el.style.color = `rgba(0, 0, 0, ${item.prob / maxProb})`;
        predictionList.appendChild(el);
    });
    // alert('Predicted class: ' + classes[predictedClass]);
};

canvas.addEventListener('mousedown', onStart);
canvas.addEventListener('mousemove', onMove);
canvas.addEventListener('mouseup', onEnd);
canvas.addEventListener('mouseleave', onEnd);
canvas.addEventListener('touchstart', onStart, { passive: false });
canvas.addEventListener('touchmove', onMove, { passive: false });
canvas.addEventListener('touchend', onEnd);


