#include "FoliaORTC.h"
#include <onnxruntime/onnxruntime_cxx_api.h>
#include <algorithm>
#include <cstring>
#include <memory>
#include <stdexcept>
#include <vector>

// Public ORT C++ API only. CPU arena/pattern disabled. Parallel stems use one inter-op worker;
// this is not the Python-only enable_mem_reuse flag, and device memory still requires measurement.
struct FMORTSession {
    Ort::Env env{ORT_LOGGING_LEVEL_ERROR, "FoliaAutomix"};
    std::unique_ptr<Ort::Session> session;
    std::vector<std::string> inputs, outputs;
    std::vector<std::vector<int64_t>> shapes;
};
static void fail(char **error, const char *message) { if (error) *error = strdup(message); }
FMORTSession *fmort_create(const char *path, int parallel, char **error) {
    try {
        auto result = std::make_unique<FMORTSession>();
        Ort::SessionOptions options;
        options.DisableCpuMemArena().DisableMemPattern().SetIntraOpNumThreads(2).SetInterOpNumThreads(1);
        // Do not busy-wait between graph tasks alongside WebKit's audio and animation threads.
        options.AddConfigEntry("session.intra_op.allow_spinning", "0").AddConfigEntry("session.inter_op.allow_spinning", "0");
        options.SetExecutionMode(parallel ? ORT_PARALLEL : ORT_SEQUENTIAL);
        result->session = std::make_unique<Ort::Session>(result->env, path, options);
        Ort::AllocatorWithDefaultOptions allocator;
        for (size_t i = 0; i < result->session->GetInputCount(); ++i) {
            result->inputs.push_back(result->session->GetInputNameAllocated(i, allocator).get());
            result->shapes.push_back(result->session->GetInputTypeInfo(i).GetTensorTypeAndShapeInfo().GetShape());
        }
        for (size_t i = 0; i < result->session->GetOutputCount(); ++i)
            result->outputs.push_back(result->session->GetOutputNameAllocated(i, allocator).get());
        return result.release();
    } catch (const std::exception &e) { fail(error, e.what()); return nullptr; }
}
void fmort_destroy(FMORTSession *session) { delete session; }
int fmort_input_shape(FMORTSession *session, int index, int64_t *shape, size_t capacity) {
    if (!session || index < 0 || size_t(index) >= session->shapes.size()) return -1;
    const auto &dims = session->shapes[index];
    if (dims.size() > capacity) return -1;
    std::copy(dims.begin(), dims.end(), shape); return int(dims.size());
}
int fmort_run(FMORTSession *session, const float *first, size_t firstCount, int frames,
              const float *second, size_t secondCount, FMORTOutput *output, size_t capacity, char **error) {
    try {
        if (!session || session->outputs.size() > capacity || session->inputs.size() > 2) throw std::runtime_error("Unsupported model contract");
        auto memory = Ort::MemoryInfo::CreateCpu(OrtDeviceAllocator, OrtMemTypeDefault);
        std::vector<Ort::Value> inputs;
        std::vector<const char *> inputNames, outputNames;
        for (size_t i = 0; i < session->inputs.size(); ++i) {
            auto dims = session->shapes[i];
            if (frames > 0 && i == 0) dims = {1, frames, 128};
            const float *data = i == 0 ? first : second;
            size_t count = i == 0 ? firstCount : secondCount, expected = 1;
            for (auto dim : dims) { if (dim <= 0) throw std::runtime_error("Invalid tensor shape"); expected *= size_t(dim); }
            if (!data || count != expected) throw std::runtime_error("Model input size mismatch");
            inputs.push_back(Ort::Value::CreateTensor<float>(memory, const_cast<float *>(data), count, dims.data(), dims.size()));
            inputNames.push_back(session->inputs[i].c_str());
        }
        for (const auto &name : session->outputs) outputNames.push_back(name.c_str());
        auto results = session->session->Run(Ort::RunOptions{nullptr}, inputNames.data(), inputs.data(), inputs.size(), outputNames.data(), outputNames.size());
        for (size_t i = 0; i < results.size(); ++i) {
            const auto info = results[i].GetTensorTypeAndShapeInfo();
            auto dims = info.GetShape();
            if (info.GetElementType() != ONNX_TENSOR_ELEMENT_DATA_TYPE_FLOAT || dims.size() > 8) throw std::runtime_error("Unsupported model output");
            output[i].count = info.GetElementCount(); output[i].rank = dims.size();
            std::copy(dims.begin(), dims.end(), output[i].shape);
            // Transfer tensor ownership, not its multi-megabyte contents. Swift uses a scoped view.
            auto tensor = std::make_unique<Ort::Value>(std::move(results[i]));
            output[i].data = tensor->GetTensorData<float>();
            output[i].owner = tensor.release();
        }
        return int(results.size());
    } catch (const std::exception &e) {
        for (size_t i = 0; i < capacity; ++i) fmort_free_output(&output[i]);
        fail(error, e.what()); return -1;
    }
}
void fmort_free_output(FMORTOutput *output) {
    if (output) {
        delete static_cast<Ort::Value *>(output->owner);
        output->owner = nullptr; output->data = nullptr; output->count = 0; output->rank = 0;
    }
}
void fmort_free_error(char *error) { free(error); }
