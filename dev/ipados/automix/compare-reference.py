#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Compare synthetic native fixtures to the unchanged desktop Python/NumPy implementation. No private audio."""
import argparse
import importlib.util
import json
from pathlib import Path
import numpy as np
import onnxruntime as ort

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--models', type=Path, required=True)
parser.add_argument('--fixtures', type=Path, required=True)
parser.add_argument('--output', type=Path)
args = parser.parse_args()
root = Path(__file__).resolve().parents[3]
spec = importlib.util.spec_from_file_location('original_htdemucs', root / 'electron/analysis/htdemucs_runner.py')
original = importlib.util.module_from_spec(spec)
spec.loader.exec_module(original)
read = lambda name: np.fromfile(args.fixtures / name, dtype=np.float32)

def metrics(actual, expected):
    error = actual.astype(np.float64) - expected.astype(np.float64)
    return {'maxAbs': float(np.max(np.abs(error))), 'snrDB': float(10 * np.log10(max(np.sum(expected.astype(np.float64)**2), 1e-30) / max(np.sum(error**2), 1e-30)))}

mel = read('mel.f32').reshape(1, -1, 128)
options = ort.SessionOptions()
options.enable_cpu_mem_arena = False
options.intra_op_num_threads = 2
beat_session = ort.InferenceSession(str(args.models / 'beat_this.onnx'), sess_options=options, providers=['CPUExecutionProvider'])
beat = np.concatenate([v.reshape(-1) for v in beat_session.run(None, {'input_spectrogram': mel})])
beat_metrics = metrics(read('beat.f32'), beat)
del beat_session
session = original.make_session(str(args.models / 'htdemucs-v2.onnx'))
left, right = read('input.f32').reshape(2, -1)
segment = original.segment_of(session)
fft = original.stft_head(np.stack([left[:segment], right[:segment]])[None], session.get_inputs()[1].shape)
fft_metrics = metrics(read('spectrum.f32'), fft.reshape(-1))
parts = original.separate(session, left, right)
expected = np.concatenate([channel for stem in original.RETURNED for channel in parts[stem]])
stem_metrics = metrics(read('stems.f32'), expected)
report = {'syntheticOnly': True, 'referenceRuntime': ort.__version__, 'nativeRuntime': '1.24.2',
          'sampleRate': 44100, 'seconds': len(left)/44100, 'beat': beat_metrics, 'stft': fft_metrics, 'stems': stem_metrics}
print(json.dumps(report, indent=2))
if args.output:
    args.output.write_text(json.dumps(report, indent=2) + '\n')
assert beat_metrics['maxAbs'] < 1e-4
assert fft_metrics['maxAbs'] < 1e-5
assert stem_metrics['snrDB'] > 80
