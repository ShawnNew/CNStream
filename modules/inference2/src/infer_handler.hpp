/*************************************************************************
 * Copyright (C) [2021] by Cambricon, Inc. All rights reserved
 *
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
 * OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL
 * THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 *************************************************************************/

#ifndef MODULES_INFER_HANDLER_HPP_
#define MODULES__INFER_HANDLER_HPP_

#include <memory>
#include <string>

#include "inferencer2.hpp"
#include "postproc.hpp"

namespace cnstream {

class InferDataObserver;

/**
 * @brief for inference handler used to do inference based on infer_server.
 */
class InferHandlerImpl : public InferHandler {
 public:
  explicit InferHandlerImpl(Inferencer2* module, InferParamerters infer_params,
                            std::shared_ptr<VideoPostproc> post_processor, std::shared_ptr<Preproc> pre_processor)
      : InferHandler(module, infer_params, post_processor, pre_processor) {}

  virtual ~InferHandlerImpl();

  bool Open() override;
  void Close() override;

  int Process(CNFrameInfoPtr data, bool with_objs = false) override;

  void WaitTaskDone(const std::string& stream_id) override;

 private:
  bool LinkInferServer();

 private:
  InferModelInfoPtr model_info_ = nullptr;
  std::unique_ptr<InferEngine> infer_server_ = nullptr;
  std::shared_ptr<InferDataObserver> data_observer_ = nullptr;
  InferEngineSession session_ = nullptr;
  InferPreprocessType scale_platform_ = InferPreprocessType::UNKNOWN;
  bool get_response = false;
  std::mutex response_mutex;
  std::condition_variable response_cond;
};

}  // namespace cnstream

#endif  // MODULES_INFER_HANDLER_HPP_
