#ifndef FOLIA_ORT_C_H
#define FOLIA_ORT_C_H
#include <stdint.h>
#include <stddef.h>
#ifdef __cplusplus
extern "C" {
#endif
// Narrow, owned C boundary. Returned tensors/errors must be freed; sessions are confined to one serial queue.
typedef struct FMORTSession FMORTSession;
// data borrows an ORT tensor kept alive by owner until fmort_free_output; never free data directly.
typedef struct { const float *data; size_t count; int64_t shape[8]; size_t rank; void *owner; } FMORTOutput;
FMORTSession *fmort_create(const char *path, int parallel, char **error);
void fmort_destroy(FMORTSession *session);
int fmort_input_shape(FMORTSession *session, int index, int64_t *shape, size_t capacity);
int fmort_run(FMORTSession *session, const float *first, size_t firstCount, int frames,
              const float *second, size_t secondCount, FMORTOutput *output, size_t capacity, char **error);
void fmort_free_output(FMORTOutput *output);
void fmort_free_error(char *error);
#ifdef __cplusplus
}
#endif
#endif
